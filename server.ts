import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import firebaseConfig from './firebase-applet-config.json';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface VerifiedIdentity {
  uid: string;
  email: string;
  emailVerified: boolean;
  tenantId: string;
  issuer: string;
  audience: string;
}

export interface AuthenticatedRequest extends Request {
  identity?: VerifiedIdentity;
}

let cachedCerts: Record<string, string> | null = null;
let certsExpiry = 0;

async function getGooglePublicCerts(): Promise<Record<string, string>> {
  const now = Date.now();
  if (cachedCerts && now < certsExpiry) {
    return cachedCerts;
  }
  const res = await fetch(
    'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
  );
  if (!res.ok) {
    throw new Error('Failed to fetch Google public x509 certificates for JWT verification');
  }
  const cacheControl = res.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  const maxAgeSec = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 3600;
  cachedCerts = (await res.json()) as Record<string, string>;
  certsExpiry = now + maxAgeSec * 1000;
  return cachedCerts;
}

function base64UrlToBuffer(base64Url: string): Buffer {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
  return Buffer.from(base64 + pad, 'base64');
}

/**
 * Real Cryptographic JWT Validator (Domain Core v4.0 Section 7)
 * Validates: signature (RS256 against Google x509 public certs), issuer, audience, expiration, algorithm.
 * Derives Tenant Context strictly from verified identity — never from URL or request body.
 */
async function verifyFirebaseJwtToken(token: string): Promise<VerifiedIdentity> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed JWT token structure');
  }

  const [headerB64, payloadB64, signatureB64] = parts;
  const header = JSON.parse(base64UrlToBuffer(headerB64).toString('utf8'));
  const payload = JSON.parse(base64UrlToBuffer(payloadB64).toString('utf8'));

  // 1. Algorithm Check
  if (header.alg !== 'RS256' || !header.kid) {
    throw new Error('Invalid JWT algorithm or missing key ID (requires RS256)');
  }

  // 2. Issuer & Audience Check
  const expectedIssuer = `https://securetoken.google.com/${firebaseConfig.projectId}`;
  if (payload.iss !== expectedIssuer) {
    throw new Error(`Invalid JWT issuer: expected ${expectedIssuer}`);
  }
  if (payload.aud !== firebaseConfig.projectId) {
    throw new Error(`Invalid JWT audience: expected ${firebaseConfig.projectId}`);
  }

  // 3. Expiration & Issued-At Check
  const nowSec = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || payload.exp <= nowSec) {
    throw new Error('JWT token has expired');
  }
  if (typeof payload.iat !== 'number' || payload.iat > nowSec + 300) {
    throw new Error('Invalid JWT issued-at timestamp');
  }
  if (!payload.sub || typeof payload.sub !== 'string') {
    throw new Error('Missing subject (uid) in JWT');
  }

  // 4. Cryptographic Signature Verification
  const certs = await getGooglePublicCerts();
  const certPem = certs[header.kid];
  if (!certPem) {
    throw new Error('No matching Google public certificate found for kid');
  }

  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(`${headerB64}.${payloadB64}`);
  verifier.end();
  const signatureBuf = base64UrlToBuffer(signatureB64);
  const isSignatureValid = verifier.verify(certPem, signatureBuf);

  if (!isSignatureValid) {
    throw new Error('Cryptographic JWT signature verification failed');
  }

  // 5. Derive Tenant Context strictly from Verified Identity (NEVER from URL or Body)
  const email = typeof payload.email === 'string' ? payload.email : '';
  const domainPart = email.includes('@')
    ? email.split('@')[1].replace(/[^a-zA-Z0-9_-]/g, '_')
    : 'default';
  const derivedTenantId = `ablecity_${domainPart}`;

  return {
    uid: payload.sub,
    email,
    emailVerified: Boolean(payload.email_verified),
    tenantId: derivedTenantId,
    issuer: payload.iss,
    audience: payload.aud,
  };
}

const requireVerifiedIdentity = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      messageFa: 'احراز هویت الزامی است. هیچ توکن معتبری ارسال نشده است (No Mock Auth).',
    });
  }

  const token = authHeader.slice('Bearer '.length).trim();
  try {
    const identity = await verifyFirebaseJwtToken(token);
    req.identity = identity;
    next();
  } catch (err) {
    return res.status(401).json({
      error: 'INVALID_JWT',
      messageFa:
        err instanceof Error
          ? `خطای اعتبارسنجی توکن امنیتی: ${err.message}`
          : 'توکن احراز هویت نامعتبر است.',
    });
  }
};

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Health & Security Boundary Inspection Endpoint
  app.get('/api/security/verify-session', requireVerifiedIdentity, (req: AuthenticatedRequest, res) => {
    // Rejects any attempt to pass tenantId via query or body as authoritative
    res.json({
      verified: true,
      identity: req.identity,
      securityNoteFa:
        'امضای دیجیتال RS256، صادرکننده (iss)، مخاطب (aud) و انقضای توکن (exp) تایید شد. شناسه Tenant منحصراً از هویت تاییدشده استخراج گردید.',
    });
  });

  // Server-Side Gemini Coach: Evaluate Ambassador Spoken/Written Pitch in Simulation
  app.post('/api/coach/evaluate-speech', async (req: Request, res: Response) => {
    try {
      const {
        scenarioTitleFa,
        clientQuoteFa,
        clientSubtextFa,
        ambassadorSpeechFa,
        idealHintFa,
      } = req.body || {};

      if (!ambassadorSpeechFa || typeof ambassadorSpeechFa !== 'string') {
        return res.status(400).json({
          error: 'MISSING_SPEECH',
          messageFa: 'متن یا گفتار سفیر برای ارزیابی ارسال نشده است.',
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `سناریو: ${scenarioTitleFa || 'مذاکره فروش B2B'}
سخن مشتری: «${clientQuoteFa || ''}»
دغدغه پنهان مشتری (Subtext): ${clientSubtextFa || ''}
راهنمای پاسخ ایده‌آل: ${idealHintFa || ''}

پاسخ شفاهی/متنی سفیر فروش:
«${ambassadorSpeechFa}»

بر اساس متدولوژی فروش مشاوره‌ای فروشیار در اکوسیستم آفرینش / AbleCity، این پاسخ را تحلیل کن.`,
        config: {
          systemInstruction:
            'تو «مربی هوشمند فروشیار» در اکوسیستم آفرینش و شهر نوآوران AbleCity هستی. لحن تو گرم، انسانی، حرفه‌ای، محترمانه و غیرکودکانه است. وظیفه تو آموزش فروش مشاوره‌ای است (پرهیز از تخفیف زودهنگام، پرهیز از بدگویی درباره رقبا، تمرکز بر کشف نیاز و بازگشت سرمایه مشتری). یادآوری مهم: نظر تو صرفاً بازخورد آموزشی است و جایگزین موتور قطعی صدور گواهینامه Domain Core v4.0 نمی‌شود. خروجی را دقیقاً در قالب JSON برگردان.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isOptimal: {
                type: Type.BOOLEAN,
                description: 'آیا پاسخ سفیر اصول مشاوره‌ای را رعایت کرده و اعتماد مشتری را جلب می‌کند؟',
              },
              trustDelta: {
                type: Type.INTEGER,
                description: 'میزان تغییر اعتماد مشتری بین -25 تا +30',
              },
              resistanceDelta: {
                type: Type.INTEGER,
                description: 'میزان تغییر مقاومت مشتری بین -30 تا +25',
              },
              clientReactionFa: {
                type: Type.STRING,
                description: 'واکنش طبیعی و واقعی مشتری به این جمله سفیر (به زبان فارسی)',
              },
              consequenceVisualFa: {
                type: Type.STRING,
                description: 'توضیح کوتاه درباره پیامد مستقیم این جمله بر ذهنیت مشتری',
              },
              coachFeedbackFa: {
                type: Type.STRING,
                description: 'بازخورد گرم، محترمانه و دقیق مربی فروشیار به همراه پیشنهاد بهبود',
              },
            },
            required: [
              'isOptimal',
              'trustDelta',
              'resistanceDelta',
              'clientReactionFa',
              'consequenceVisualFa',
              'coachFeedbackFa',
            ],
          },
        },
      });

      const rawText = response.text || '{}';
      const parsed = JSON.parse(rawText);
      return res.json(parsed);
    } catch (error) {
      console.error('Gemini speech evaluation error:', error);
      return res.status(500).json({
        error: 'COACH_EVALUATION_FAILED',
        messageFa:
          error instanceof Error
            ? error.message
            : 'خطا در ارتباط با سرور مربی هوشمند. ارزیابی بر اساس روبریک محلی انجام می‌شود.',
      });
    }
  });

  // Server-Side Gemini Coach: General Interactive Coaching Q&A
  app.post('/api/coach/ask', async (req: Request, res: Response) => {
    try {
      const { questionFa, ambassadorContext } = req.body || {};
      if (!questionFa || typeof questionFa !== 'string') {
        return res.status(400).json({ error: ' سوال معتبر ارسال نشده است.' });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `وضعیت فعلی سفیر در Domain Core v4.0: ${JSON.stringify(ambassadorContext || {})}
سوال یا چالش سفیر فروش: ${questionFa}`,
        config: {
          systemInstruction:
            'تو «مربی فروشیار» در اکوسیستم آفرینش / AbleCity / توانا / بندستوانا هستی. لحن تو گرم، حرفه‌ای، محترمانه و کاملاً کاربردی است. به سفیر فروش کمک کن مهارت مذاکره، کشف نیاز، مدیریت اعتراضات و تسلط بر ۷ محصول اکوسیستم (DecorMate, SlabMate, SalonMate, AutoBarter, Tanara, TalaYar, EventMate) را تقویت کند. پاسخ را کوتاه (حداکثر ۴ تا ۶ خط)، ساختاریافته و همراه با یک مثال عملی از دیالوگ واقعی فروش بنویس. هرگز ادعا نکن که مربی می‌تواند بدون آزمون یا ارزیابی میدانی گواهینامه صادر کند.',
        },
      });

      return res.json({
        replyFa: response.text || 'پاسخی دریافت نشد.',
      });
    } catch (error) {
      console.error('Gemini coach ask error:', error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'خطا در سرویس مربی هوشمند',
      });
    }
  });

  // ============================================================================
  // REAL-TIME GROUP CHAT ROOMS (Strictly Group Channels Only — No Private DMs)
  // & TAVANA CITY REFERRAL / XP LEAGUE STATE
  // ============================================================================
  interface GroupChatMessage {
    id: string;
    roomId: 'general_hall' | 'xp_metaverse_club' | 'council_governance' | 'multilingual_hall';
    senderName: string;
    senderReferralCode: string;
    senderTier: string;
    senderXp: number;
    text: string;
    createdAtIso: string;
    timeLabelFa: string;
  }

  interface LeagueMemberRecord {
    referralCode: string;
    displayName: string;
    mobileMasked: string;
    emailMasked: string;
    tier: string;
    xp: number;
    certifiedProductsCount: number;
    referredFriendsCount: number;
    referredByCode: string;
    donatedXpTotal: number;
    receivedTributeXpTotal: number;
    cityNameFa: string;
    updatedAtIso: string;
  }

  const groupChatMessages: GroupChatMessage[] = [
    {
      id: 'msg_seed_1',
      roomId: 'general_hall',
      senderName: 'نگار فرهمند (سفیر ارشد تهران)',
      senderReferralCode: 'TVN-NEG-9121',
      senderTier: 'A++',
      senderXp: 3450,
      text: 'سلام به همه سفیران توانا سیتی! امروز در بورس تجهیزات پزشکی ولیعصر با دموی ۱۰ ثانیه‌ای «طب‌یار» و نمایش کد اصالت IMED، دو قرارداد لایسنس + سایت دائمی بسته شد. حتماً قفل خریدار رو بیرون مغازه فعال کنید!',
      createdAtIso: new Date(Date.now() - 1800000).toISOString(),
      timeLabelFa: '۳۰ دقیقه پیش',
    },
    {
      id: 'msg_seed_2',
      roomId: 'xp_metaverse_club',
      senderName: 'آرش سبحانی (سفیر اصفهان - جلفا)',
      senderReferralCode: 'TVN-ARA-3144',
      senderTier: 'A+',
      senderXp: 2680,
      text: 'دوستان عزیز، با عبور از مرز ۲,۵۰۰ XP سند دیجیتال قطعه زمین رایگان متاورسی در شهر AbleCity برام صادر شد و امروز ۳۰٪ از XP هفتگی خودم رو به دو نفر از دوستان تازه‌وارد تیمم اهدا کردم تا سریع‌تر به سطح زمین رایگان برسند.',
      createdAtIso: new Date(Date.now() - 1200000).toISOString(),
      timeLabelFa: '۲۰ دقیقه پیش',
    },
    {
      id: 'msg_seed_3',
      roomId: 'council_governance',
      senderName: 'مهندس کاوه راد (سفیر تبریز)',
      senderReferralCode: 'TVN-KAV-4118',
      senderTier: 'A++',
      senderXp: 5120,
      text: 'فلسفه دموکراسی ثروت و جایگاه در اکوسیستم آفرینش بی‌نظیره؛ هر کسی در مدیریت برنامه تخصصی خودش بدرخشه و شبکه معرفین قوی بسازه، مستقیم وارد هیئت مدیره برنامه و نامزدی صندلی‌های شورای شهر توانا می‌شه.',
      createdAtIso: new Date(Date.now() - 600000).toISOString(),
      timeLabelFa: '۱۰ دقیقه پیش',
    },
    {
      id: 'msg_seed_4',
      roomId: 'multilingual_hall',
      senderName: 'آناهیتا سرکیسیان (سفیر تهران / ایروان)',
      senderReferralCode: 'TVN-ANA-7720',
      senderTier: 'A+',
      senderXp: 1940,
      text: 'Բարև ձեզ (بارِو ذِز)! اضافه شدن زبان ارمنی (Հայերեն) به همراه تلفظ فارسی برای مذاکره با گالری‌های طلا و استودیوهای صدا عالی شده. اگر سوالی درباره تلفظ جملات ارمنی داشتید در همین تالار گروهی بپرسید.',
      createdAtIso: new Date(Date.now() - 300000).toISOString(),
      timeLabelFa: '۵ دقیقه پیش',
    },
  ];

  const leagueMembersMap = new Map<string, LeagueMemberRecord>([
    [
      'TVN-KAV-4118',
      {
        referralCode: 'TVN-KAV-4118',
        displayName: 'مهندس کاوه راد (سفیر تبریز)',
        mobileMasked: '0914***4118',
        emailMasked: 'kav***@ablecity.ir',
        tier: 'A++',
        xp: 5120,
        certifiedProductsCount: 11,
        referredFriendsCount: 14,
        referredByCode: '',
        donatedXpTotal: 640,
        receivedTributeXpTotal: 890,
        cityNameFa: 'تبریز',
        updatedAtIso: new Date().toISOString(),
      },
    ],
    [
      'TVN-NEG-9121',
      {
        referralCode: 'TVN-NEG-9121',
        displayName: 'نگار فرهمند (سفیر ارشد تهران)',
        mobileMasked: '0912***9121',
        emailMasked: 'neg***@ablecity.ir',
        tier: 'A++',
        xp: 3450,
        certifiedProductsCount: 9,
        referredFriendsCount: 9,
        referredByCode: 'TVN-KAV-4118',
        donatedXpTotal: 420,
        receivedTributeXpTotal: 510,
        cityNameFa: 'تهران',
        updatedAtIso: new Date().toISOString(),
      },
    ],
    [
      'TVN-ARA-3144',
      {
        referralCode: 'TVN-ARA-3144',
        displayName: 'آرش سبحانی (سفیر اصفهان)',
        mobileMasked: '0913***3144',
        emailMasked: 'ara***@ablecity.ir',
        tier: 'A+',
        xp: 2680,
        certifiedProductsCount: 6,
        referredFriendsCount: 7,
        referredByCode: 'TVN-NEG-9121',
        donatedXpTotal: 310,
        receivedTributeXpTotal: 380,
        cityNameFa: 'اصفهان',
        updatedAtIso: new Date().toISOString(),
      },
    ],
    [
      'TVN-ANA-7720',
      {
        referralCode: 'TVN-ANA-7720',
        displayName: 'آناهیتا سرکیسیان (سفیر تهران / جلفا)',
        mobileMasked: '0912***7720',
        emailMasked: 'ana***@ablecity.ir',
        tier: 'A+',
        xp: 1940,
        certifiedProductsCount: 5,
        referredFriendsCount: 5,
        referredByCode: 'TVN-NEG-9121',
        donatedXpTotal: 180,
        receivedTributeXpTotal: 290,
        cityNameFa: 'تهران / ایروان',
        updatedAtIso: new Date().toISOString(),
      },
    ],
    [
      'TVN-SAR-5019',
      {
        referralCode: 'TVN-SAR-5019',
        displayName: 'سارا علوی (سفیر مشهد)',
        mobileMasked: '0915***5019',
        emailMasked: 'sar***@ablecity.ir',
        tier: 'A',
        xp: 1290,
        certifiedProductsCount: 3,
        referredFriendsCount: 3,
        referredByCode: 'TVN-ARA-3144',
        donatedXpTotal: 90,
        receivedTributeXpTotal: 150,
        cityNameFa: 'مشهد',
        updatedAtIso: new Date().toISOString(),
      },
    ],
  ]);

  const sseClients = new Set<Response>();

  function broadcastSseEvent(eventType: string, payload: unknown) {
    const dataStr = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const client of sseClients) {
      try {
        client.write(dataStr);
      } catch {
        sseClients.delete(client);
      }
    }
  }

  // SSE Stream for Live Group Chat & Leaderboard updates
  app.get('/api/chat/stream', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    sseClients.add(res);
    res.write(
      `event: init\ndata: ${JSON.stringify({
        messages: groupChatMessages.slice(-60),
        leaderboard: Array.from(leagueMembersMap.values()),
        onlineCount: sseClients.size + 4,
      })}\n\n`
    );

    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // Get current group chat messages + leaderboard
  app.get('/api/chat/state', (_req: Request, res: Response) => {
    res.json({
      messages: groupChatMessages.slice(-60),
      leaderboard: Array.from(leagueMembersMap.values()),
      onlineCount: sseClients.size + 4,
    });
  });

  // Post a new message to one of the Public Group Chat Rooms (No private 1-on-1 chat allowed)
  app.post('/api/chat/messages', (req: Request, res: Response) => {
    const {
      id,
      roomId,
      senderName,
      senderReferralCode,
      senderTier,
      senderXp,
      text,
    } = req.body || {};

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'EMPTY_MESSAGE' });
    }

    const msgId =
      typeof id === 'string' && id.trim()
        ? id.trim()
        : `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    // Idempotency guard
    const existing = groupChatMessages.find((m) => m.id === msgId);
    if (existing) {
      return res.json({ message: existing, duplicate: true });
    }

    const validRooms = [
      'general_hall',
      'xp_metaverse_club',
      'council_governance',
      'multilingual_hall',
    ] as const;
    const safeRoom = validRooms.includes(roomId) ? roomId : 'general_hall';

    const newMsg: GroupChatMessage = {
      id: msgId,
      roomId: safeRoom,
      senderName: String(senderName || 'سفیر فروشیار').slice(0, 70),
      senderReferralCode: String(senderReferralCode || 'TVN-AMB-1042').slice(0, 24),
      senderTier: String(senderTier || 'A+').slice(0, 10),
      senderXp: Number(senderXp || 420),
      text: text.trim().slice(0, 600),
      createdAtIso: new Date().toISOString(),
      timeLabelFa: new Date().toLocaleTimeString('fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    groupChatMessages.push(newMsg);
    if (groupChatMessages.length > 120) {
      groupChatMessages.shift();
    }

    broadcastSseEvent('chat:message_created', newMsg);
    return res.json({ message: newMsg });
  });

  // Sync Ambassador Registration & XP with the Live Leaderboard
  app.post('/api/league/sync', (req: Request, res: Response) => {
    const {
      referralCode,
      displayName,
      mobilePhone,
      email,
      tier,
      xp,
      certifiedProductsCount,
      referredFriendsCount,
      referredByCode,
      donatedXpTotal,
      receivedTributeXpTotal,
      cityNameFa,
    } = req.body || {};

    if (!referralCode || typeof referralCode !== 'string') {
      return res.status(400).json({ error: 'MISSING_REFERRAL_CODE' });
    }

    const cleanPhone = String(mobilePhone || '');
    const maskedPhone =
      cleanPhone.length >= 7
        ? `${cleanPhone.slice(0, 4)}***${cleanPhone.slice(-4)}`
        : '0912***1042';
    const cleanEmail = String(email || 'ambassador@ablecity.ir');
    const maskedEmail = cleanEmail.includes('@')
      ? `${cleanEmail.slice(0, 3)}***@${cleanEmail.split('@')[1]}`
      : 'amb***@ablecity.ir';

    const existing = leagueMembersMap.get(referralCode);
    const updatedRecord: LeagueMemberRecord = {
      referralCode: referralCode.slice(0, 24),
      displayName: String(displayName || existing?.displayName || 'سفیر توانا سیتی').slice(0, 70),
      mobileMasked: maskedPhone,
      emailMasked: maskedEmail,
      tier: String(tier || existing?.tier || 'A+'),
      xp: Math.max(0, Number(xp ?? existing?.xp ?? 420)),
      certifiedProductsCount: Math.max(
        0,
        Number(certifiedProductsCount ?? existing?.certifiedProductsCount ?? 2)
      ),
      referredFriendsCount: Math.max(
        0,
        Number(referredFriendsCount ?? existing?.referredFriendsCount ?? 0)
      ),
      referredByCode: String(referredByCode ?? existing?.referredByCode ?? ''),
      donatedXpTotal: Math.max(0, Number(donatedXpTotal ?? existing?.donatedXpTotal ?? 0)),
      receivedTributeXpTotal: Math.max(
        0,
        Number(receivedTributeXpTotal ?? existing?.receivedTributeXpTotal ?? 0)
      ),
      cityNameFa: String(cityNameFa || existing?.cityNameFa || 'تهران'),
      updatedAtIso: new Date().toISOString(),
    };

    leagueMembersMap.set(referralCode, updatedRecord);
    const allMembers = Array.from(leagueMembersMap.values());
    broadcastSseEvent('league:updated', allMembers);
    return res.json({ member: updatedRecord, leaderboard: allMembers });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ForoshYar server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
