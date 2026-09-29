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
