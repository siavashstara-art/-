import React, { useState, useEffect, useRef } from 'react';
import { useAmbassador } from '../context/AmbassadorContext';
import { ALL_PRODUCT_IDS, authorizeFieldSales } from '../domain/core';
import {
  Trophy,
  Gift,
  Users,
  Sparkles,
  Crown,
  Landmark,
  MapPin,
  Copy,
  CheckCircle2,
  Send,
  Wifi,
  WifiOff,
  MessageSquare,
  ShieldCheck,
  UserPlus,
  Award,
  HeartHandshake,
  Phone,
  Mail,
  Shield,
  UserCheck,
  BadgeDollarSign,
} from 'lucide-react';

export interface ReferredFriendItem {
  id: string;
  nameFa: string;
  mobileMasked: string;
  earnedXp: number;
  tribute30PctSent: boolean;
  tributeAmountXp: number;
  joinedAtFa: string;
}

export type ChatRoomId =
  | 'general_hall'
  | 'xp_metaverse_club'
  | 'council_governance'
  | 'multilingual_hall'
  | 'family_clan_hall';

export interface GroupChatMessageItem {
  id: string;
  roomId: ChatRoomId;
  senderName: string;
  senderReferralCode: string;
  senderTier: string;
  senderXp: number;
  text: string;
  createdAtIso: string;
  timeLabelFa: string;
  pendingOffline?: boolean;
}

export type FamilyMemberRole = 'CAPTAIN' | 'VICE_CAPTAIN' | 'SECRETARY' | 'ASSISTANT' | 'MEMBER';

export interface FamilyClanMember {
  id: string;
  nameFa: string;
  referralCode: string;
  role: FamilyMemberRole;
  xpContributed: number;
  isNewcomerProtected: boolean;
}

export interface LeaderboardRow {
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
  isCurrentUser?: boolean;
}

const ROLE_LABELS_FA: Record<
  FamilyMemberRole,
  { labelFa: string; badgeClass: string; descFa: string }
> = {
  CAPTAIN: {
    labelFa: '👑 کاپیتان و بنیانگذار فامیلی (یک‌ضرب A++)',
    badgeClass: 'bg-amber-400 text-slate-950 font-extrabold',
    descFa: 'دارنده نمره یک‌ضرب A++، صاحب اتاق چت فامیلی و چتر حمایتی ۲۰ نفره',
  },
  VICE_CAPTAIN: {
    labelFa: '🛡️ معاون اول کاپیتان (Vice-Captain)',
    badgeClass: 'bg-emerald-500 text-slate-950 font-extrabold',
    descFa: 'جانشین کاپیتان در هدایت مذاکرات میدانی و پشتیبانی اعضا',
  },
  SECRETARY: {
    labelFa: '📋 منشی فامیلی (Secretary)',
    badgeClass: 'bg-sky-400 text-slate-950 font-extrabold',
    descFa: 'مسئول هماهنگی جلسات، ثبت کدهای معرف و پیگیری آموزش تازه‌واردها',
  },
  ASSISTANT: {
    labelFa: '⚡ دستیار اجرایی (Assistant)',
    badgeClass: 'bg-purple-400 text-slate-950 font-extrabold',
    descFa: 'همراهی عملی با اعضای جدید در اولین ویزیت‌های حضوری با تبلت',
  },
  MEMBER: {
    labelFa: '🌱 عضو تحت پوشش فامیلی (تازه‌وارد)',
    badgeClass: 'bg-slate-800 text-slate-200 border border-slate-700',
    descFa: 'تحت حمایت و آموزش مستقیم کاپیتان، معاون، منشی و دستیار فامیلی',
  },
};

const DEFAULT_OFFLINE_LEADERBOARD: LeaderboardRow[] = [
  {
    referralCode: 'TVN-KAV-4118',
    displayName: 'مهندس کاوه راد (کاپیتان فامیلی تبریز)',
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
  },
  {
    referralCode: 'TVN-NEG-9121',
    displayName: 'نگار فرهمند (کاپیتان فامیلی تهران)',
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
  },
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
  },
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
  },
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
  },
];

const DEFAULT_OFFLINE_MESSAGES: GroupChatMessageItem[] = [
  {
    id: 'msg_seed_1',
    roomId: 'general_hall',
    senderName: 'نگار فرهمند (کاپیتان فامیلی تهران)',
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
    senderName: 'مهندس کاوه راد (کاپیتان فامیلی تبریز)',
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
  {
    id: 'msg_seed_5',
    roomId: 'family_clan_hall',
    senderName: 'امیرحسین رضایی (معاون اول فامیلی)',
    senderReferralCode: 'TVN-AMI-8841',
    senderTier: 'A+',
    senderXp: 850,
    text: 'سلام کاپیتان و اعضای عزیز فامیلی! امروز ۳ نفر از اعضای تازه‌وارد فامیلی رو در تمرین اسکریپت «استودیویار» و «دکوریار» همراهی کردم و همگی آماده اولین ویزیت حضوری فردا هستند.',
    createdAtIso: new Date(Date.now() - 180000).toISOString(),
    timeLabelFa: '۳ دقیقه پیش',
  },
];

export const TavanaMetaverseReferralLeague: React.FC = () => {
  const {
    profile,
    registrationInfo,
    registerWithMobileAndEmail,
    adjustAmbassadorXp,
    applyPresetProfileScenario,
  } = useAmbassador();

  // Registration Form State (Mobile + Email -> Instant Referral Code + XP)
  const [regName, setRegName] = useState(profile.displayName);
  const [regMobile, setRegMobile] = useState(registrationInfo.mobilePhone || '09123456789');
  const [regEmail, setRegEmail] = useState(registrationInfo.email || profile.email);
  const [regRefBy, setRegRefBy] = useState(registrationInfo.referredByCode || 'TVN-NEG-9121');
  const [regCity, setRegCity] = useState('تهران');
  const [regSuccessBanner, setRegSuccessBanner] = useState<string | null>(null);
  const [copiedMyRefLink, setCopiedMyRefLink] = useState(false);

  // Family / Clan System State (for First-Strike A++ Captains)
  const [familyNameFa, setFamilyNameFa] = useState<string>(() => {
    try {
      return (
        localStorage.getItem('foroshyar_family_clan_name_v4') ||
        'فامیلی ستارگان آفرینش توانا سیتی'
      );
    } catch {
      return 'فامیلی ستارگان آفرینش توانا سیتی';
    }
  });
  const [firstStrikeAPlusPlusUnlocked, setFirstStrikeAPlusPlusUnlocked] = useState<boolean>(
    () => profile.tier === 'A++'
  );
  const [familyMembers, setFamilyMembers] = useState<FamilyClanMember[]>(() => {
    try {
      const saved = localStorage.getItem('foroshyar_family_clan_members_v4');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [
      {
        id: 'fm_1',
        nameFa: 'امیرحسین رضایی',
        referralCode: 'TVN-AMI-8841',
        role: 'VICE_CAPTAIN',
        xpContributed: 850,
        isNewcomerProtected: false,
      },
      {
        id: 'fm_2',
        nameFa: 'مریم نادری',
        referralCode: 'TVN-MAR-2190',
        role: 'SECRETARY',
        xpContributed: 640,
        isNewcomerProtected: false,
      },
      {
        id: 'fm_3',
        nameFa: 'سهراب جاوید',
        referralCode: 'TVN-SOH-5512',
        role: 'ASSISTANT',
        xpContributed: 520,
        isNewcomerProtected: false,
      },
      {
        id: 'fm_4',
        nameFa: 'پارسا نیک‌زاد (تازه‌وارد تحت پوشش)',
        referralCode: 'TVN-PAR-1098',
        role: 'MEMBER',
        xpContributed: 280,
        isNewcomerProtected: true,
      },
      {
        id: 'fm_5',
        nameFa: 'الناز کریمی (تازه‌وارد تحت پوشش)',
        referralCode: 'TVN-ELN-3304',
        role: 'MEMBER',
        xpContributed: 310,
        isNewcomerProtected: true,
      },
    ];
  });
  const [newClanMemberName, setNewClanMemberName] = useState('');
  const [newClanMemberRole, setNewClanMemberRole] = useState<FamilyMemberRole>('MEMBER');

  // Referred Friends Network State (who can gift 30% of their XP back to the user!)
  const [referredFriends, setReferredFriends] = useState<ReferredFriendItem[]>(() => {
    try {
      const saved = localStorage.getItem('foroshyar_referred_friends_v4');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [
      {
        id: 'fr_1',
        nameFa: 'امیرحسین رضایی (معرفی‌شده توسط شما)',
        mobileMasked: '0912***8841',
        earnedXp: 600,
        tribute30PctSent: false,
        tributeAmountXp: 180,
        joinedAtFa: '۲ روز پیش',
      },
      {
        id: 'fr_2',
        nameFa: 'مریم نادری (معرفی‌شده توسط شما)',
        mobileMasked: '0935***2190',
        earnedXp: 450,
        tribute30PctSent: false,
        tributeAmountXp: 135,
        joinedAtFa: 'دیروز',
      },
    ];
  });

  const [newFriendName, setNewFriendName] = useState('');
  const [newFriendPhone, setNewFriendPhone] = useState('');

  // 30% XP Gifting & Tribute State
  const [giftPercent, setGiftPercent] = useState<number>(30); // up to 30%
  const [giftTargetCode, setGiftTargetCode] = useState<string>('TVN-SAR-5019');
  const [donatedXpTotal, setDonatedXpTotal] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('foroshyar_donated_xp_total_v4') || 0);
    } catch {
      return 0;
    }
  });
  const [receivedTributeXpTotal, setReceivedTributeXpTotal] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('foroshyar_received_tribute_xp_v4') || 0);
    } catch {
      return 0;
    }
  });
  const [sentTributeToMyReferrer, setSentTributeToMyReferrer] = useState<boolean>(false);
  const [xpActionFeedback, setXpActionFeedback] = useState<string | null>(null);

  // Leaderboard State (Offline-first + synced with server when online)
  const [serverLeaderboard, setServerLeaderboard] = useState<LeaderboardRow[]>(
    DEFAULT_OFFLINE_LEADERBOARD
  );

  // Public & Family Group Chat State (Strictly Group Rooms Only — Non-blocking Offline)
  const [activeChatRoom, setActiveChatRoom] = useState<ChatRoomId>('general_hall');
  const [chatMessages, setChatMessages] = useState<GroupChatMessageItem[]>(() => {
    try {
      const saved = localStorage.getItem('foroshyar_group_chat_cache_v4');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_OFFLINE_MESSAGES;
  });
  const [chatDraft, setChatDraft] = useState('');
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [onlineUsersCount, setOnlineUsersCount] = useState<number>(8);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (profile.tier === 'A++') {
      setFirstStrikeAPlusPlusUnlocked(true);
    }
  }, [profile.tier]);

  useEffect(() => {
    try {
      localStorage.setItem('foroshyar_family_clan_name_v4', familyNameFa);
      localStorage.setItem('foroshyar_family_clan_members_v4', JSON.stringify(familyMembers));
    } catch {
      // ignore
    }
  }, [familyNameFa, familyMembers]);

  useEffect(() => {
    try {
      localStorage.setItem('foroshyar_referred_friends_v4', JSON.stringify(referredFriends));
    } catch {
      // ignore
    }
  }, [referredFriends]);

  useEffect(() => {
    try {
      localStorage.setItem('foroshyar_group_chat_cache_v4', JSON.stringify(chatMessages));
    } catch {
      // ignore
    }
  }, [chatMessages]);

  // Monitor Online/Offline without ever blocking the app
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const myCertifiedCount = ALL_PRODUCT_IDS.filter(
    (pid) =>
      authorizeFieldSales({
        ambassador: profile,
        productCertification: profile.productCertifications[pid],
        requestedProductId: pid,
      }).authorized
  ).length;

  // Calculate Family Total XP & Expanding Capacity (Starts at 20, expands to 35 and 50 with Family Success!)
  const familyTotalXp =
    profile.xp + familyMembers.reduce((sum, m) => sum + m.xpContributed, 0);
  const familyCapacityLimit =
    familyTotalXp >= 6000 ? 50 : familyTotalXp >= 3000 ? 35 : 20;
  const familySuccessTierFa =
    familyTotalXp >= 6000
      ? 'سطح ۳ فامیلی (فامیلی طلایی شورای شهر — ظرفیت ارتقایافته به ۵۰ نفر)'
      : familyTotalXp >= 3000
      ? 'سطح ۲ فامیلی (فامیلی نقره‌ای — ظرفیت ارتقایافته به ۳۵ نفر)'
      : 'سطح ۱ فامیلی (ظرفیت پایه پوشش ۲۰ نفر از تازه‌واردان و دوستان)';

  // Non-blocking SSE & REST Sync for Group Chat and Leaderboard when online
  useEffect(() => {
    if (!isOnline) return;

    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/chat/stream');
      es.addEventListener('init', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (Array.isArray(data.messages) && data.messages.length > 0) {
            setChatMessages((prev) => {
              const ids = new Set(prev.map((m) => m.id));
              const merged = [...prev];
              for (const srvMsg of data.messages) {
                if (!ids.has(srvMsg.id)) merged.push(srvMsg);
              }
              return merged;
            });
          }
          if (Array.isArray(data.leaderboard) && data.leaderboard.length > 0) {
            setServerLeaderboard(data.leaderboard);
          }
          if (typeof data.onlineCount === 'number') {
            setOnlineUsersCount(data.onlineCount);
          }
        } catch {
          // ignore parse error
        }
      });

      es.addEventListener('chat:message_created', (e: MessageEvent) => {
        try {
          const msg = JSON.parse(e.data) as GroupChatMessageItem;
          setChatMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        } catch {
          // ignore
        }
      });

      es.addEventListener('league:updated', (e: MessageEvent) => {
        try {
          const list = JSON.parse(e.data) as LeaderboardRow[];
          if (Array.isArray(list)) {
            setServerLeaderboard(list);
          }
        } catch {
          // ignore
        }
      });

      es.onerror = () => {
        // Silent fallback to offline mode — never block the UI
        es?.close();
      };
    } catch {
      // Silent offline fallback
    }

    return () => {
      es?.close();
    };
  }, [isOnline]);

  // Sync current user's XP & Referral Code to server leaderboard silently when online
  useEffect(() => {
    if (!isOnline) return;
    const timer = setTimeout(() => {
      fetch('/api/league/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referralCode: registrationInfo.referralCode,
          displayName: profile.displayName,
          mobilePhone: registrationInfo.mobilePhone || regMobile,
          email: registrationInfo.email || profile.email,
          tier: profile.tier,
          xp: profile.xp,
          certifiedProductsCount: myCertifiedCount,
          referredFriendsCount: referredFriends.length,
          referredByCode: registrationInfo.referredByCode,
          donatedXpTotal,
          receivedTributeXpTotal,
          cityNameFa: regCity,
        }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data && Array.isArray(data.leaderboard)) {
            setServerLeaderboard(data.leaderboard);
          }
        })
        .catch(() => {
          // Silent offline resilience
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [
    isOnline,
    profile.xp,
    profile.displayName,
    profile.tier,
    registrationInfo.referralCode,
    registrationInfo.mobilePhone,
    registrationInfo.email,
    registrationInfo.referredByCode,
    myCertifiedCount,
    referredFriends.length,
    donatedXpTotal,
    receivedTributeXpTotal,
    regCity,
    regMobile,
  ]);

  // Build Combined Sorted Leaderboard (always includes current user with live XP!)
  const combinedLeaderboard: LeaderboardRow[] = React.useMemo(() => {
    const map = new Map<string, LeaderboardRow>();
    for (const item of serverLeaderboard) {
      map.set(item.referralCode, { ...item, isCurrentUser: false });
    }

    const cleanPhone = registrationInfo.mobilePhone || regMobile;
    const maskedPhone =
      cleanPhone.length >= 7
        ? `${cleanPhone.slice(0, 4)}***${cleanPhone.slice(-4)}`
        : '0912***1042';
    const cleanEmail = registrationInfo.email || profile.email;
    const maskedEmail = cleanEmail.includes('@')
      ? `${cleanEmail.slice(0, 3)}***@${cleanEmail.split('@')[1]}`
      : 'amb***@ablecity.ir';

    map.set(registrationInfo.referralCode, {
      referralCode: registrationInfo.referralCode,
      displayName: `${profile.displayName} (شما)`,
      mobileMasked: maskedPhone,
      emailMasked: maskedEmail,
      tier: profile.tier,
      xp: profile.xp,
      certifiedProductsCount: myCertifiedCount,
      referredFriendsCount: referredFriends.length,
      referredByCode: registrationInfo.referredByCode,
      donatedXpTotal,
      receivedTributeXpTotal,
      cityNameFa: regCity,
      isCurrentUser: true,
    });

    return Array.from(map.values()).sort((a, b) => {
      if (b.xp !== a.xp) return b.xp - a.xp;
      return b.certifiedProductsCount - a.certifiedProductsCount;
    });
  }, [
    serverLeaderboard,
    registrationInfo,
    profile.displayName,
    profile.email,
    profile.tier,
    profile.xp,
    myCertifiedCount,
    referredFriends.length,
    donatedXpTotal,
    receivedTributeXpTotal,
    regCity,
    regMobile,
  ]);

  const myRank =
    combinedLeaderboard.findIndex((r) => r.referralCode === registrationInfo.referralCode) + 1;

  // Governance & Metaverse Land Eligibility based on XP
  const getGovernanceAndLandStatus = (xp: number, certsCount: number) => {
    if (xp >= 5000 && certsCount >= 5) {
      return {
        governanceTitleFa: '🏛️ نامزد رسمی صندلی «شورای شهر توانا» در اکوسیستم آفرینش',
        landTitleFa: '🌟 عمارت ۵۰۰ متری رایگان در میدان مرکزی شهر متاورسی AbleCity',
        badgeTone: 'bg-amber-400 text-slate-950 border-white',
      };
    }
    if (xp >= 2500 && certsCount >= 3) {
      return {
        governanceTitleFa: '👑 عضو هیئت مدیره برنامه و مدیر ارشد در اکوسیستم توانا',
        landTitleFa: '🏡 پلاک طلایی ۳۰۰ متری رایگان در شهر متاورسی ایبل‌سیتی (توانا سیتی)',
        badgeTone: 'bg-emerald-500 text-slate-950 border-emerald-200',
      };
    }
    if (xp >= 1000) {
      return {
        governanceTitleFa: '🚀 مدارج بالای مدیریتی برنامه (مدیر تیم معرفان و آموزش)',
        landTitleFa: '🌱 قطعه زمین تجاری ۱۰۰ متری رایگان در شهر متاورسی AbleCity',
        badgeTone: 'bg-sky-500 text-slate-950 border-sky-200',
      };
    }
    return {
      governanceTitleFa: '⚡ سفیر و معرف فعال شهر نوآوران توانا (در مسیر صعود به مدیریت)',
      landTitleFa: `در مسیر زمین رایگان متاورسی (${Math.min(100, Math.round((xp / 1000) * 100))}٪ تا زمین ۱۰۰ متری)`,
      badgeTone: 'bg-slate-800 text-slate-200 border-slate-700',
    };
  };

  const myGovernance = getGovernanceAndLandStatus(profile.xp, myCertifiedCount);
  const maxDonatable30PctXp = Math.floor(profile.xp * (giftPercent / 100));

  const handleInstantRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regMobile.trim() || !regEmail.trim()) return;
    const res = await registerWithMobileAndEmail({
      displayName: regName,
      mobilePhone: regMobile,
      email: regEmail,
      referredByCode: regRefBy,
    });
    setRegSuccessBanner(
      res.awardedXp > 0
        ? `🎉 ثبت‌نام شما با موبایل و ایمیل انجام شد! کد معرف اختصاصی شما: ${res.referralCode} (+${res.awardedXp} XP به حساب و رتبه شما در جدول اضافه شد!)`
        : `✓ اطلاعات تماس و کد معرف اختصاصی شما (${res.referralCode}) در جدول رده‌بندی به‌روزرسانی شد.`
    );
  };

  const handleInviteNewFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFriendName.trim() || !newFriendPhone.trim()) return;
    const cleanPhone = newFriendPhone.trim();
    const masked =
      cleanPhone.length >= 7
        ? `${cleanPhone.slice(0, 4)}***${cleanPhone.slice(-4)}`
        : '0912***9900';

    const initialFriendXp = 400;
    const friendItem: ReferredFriendItem = {
      id: `fr_${Date.now()}`,
      nameFa: `${newFriendName.trim()} (معرفی‌شده با کد ${registrationInfo.referralCode})`,
      mobileMasked: masked,
      earnedXp: initialFriendXp,
      tribute30PctSent: false,
      tributeAmountXp: Math.round(initialFriendXp * 0.3),
      joinedAtFa: 'هم‌اکنون',
    };

    setReferredFriends((prev) => [friendItem, ...prev]);
    setNewFriendName('');
    setNewFriendPhone('');
    await adjustAmbassadorXp(
      250,
      `پاداش معرفی و ثبت‌نام دوست جدید (${friendItem.nameFa}) در لیگ توانا سیتی`
    );
    setXpActionFeedback(
      `🎉 تبریک! بابت معرفی «${friendItem.nameFa}» با کد معرف ${registrationInfo.referralCode}، مقدار +۲۵۰ XP به شما تعلق گرفت و او نیز می‌تواند ۳۰٪ از XPهای خود را به شما ببخشد!`
    );
  };

  // Top-table 30% XP Donation to another ambassador/friend
  const handleDonateUpTo30PctXp = async () => {
    if (maxDonatable30PctXp <= 0) return;
    const targetMember = combinedLeaderboard.find((m) => m.referralCode === giftTargetCode);
    const targetName = targetMember ? targetMember.displayName : giftTargetCode;

    setServerLeaderboard((prev) =>
      prev.map((row) =>
        row.referralCode === giftTargetCode
          ? {
              ...row,
              xp: row.xp + maxDonatable30PctXp,
              receivedTributeXpTotal: row.receivedTributeXpTotal + maxDonatable30PctXp,
            }
          : row
      )
    );

    const nextDonated = donatedXpTotal + maxDonatable30PctXp;
    setDonatedXpTotal(nextDonated);
    try {
      localStorage.setItem('foroshyar_donated_xp_total_v4', String(nextDonated));
    } catch {
      // ignore
    }

    await adjustAmbassadorXp(
      -maxDonatable30PctXp,
      `اهدای سخاوتمندانه ${giftPercent}٪ از XP (${maxDonatable30PctXp} XP) به ${targetName} در جدول لیگ`
    );

    setXpActionFeedback(
      `✨ شما ${giftPercent}٪ از XP خود (${maxDonatable30PctXp} XP) را به «${targetName}» اهدا کردید! امتیاز سخاوت و رهبری شما برای صندلی شورای شهر توانا ثبت شد.`
    );
  };

  // Referred friend gifts 30% of their XP back to the user (their referrer!)
  const handleClaim30PctFromReferredFriend = async (friendId: string) => {
    const friend = referredFriends.find((f) => f.id === friendId);
    if (!friend || friend.tribute30PctSent) return;

    const tributeXp = Math.round(friend.earnedXp * 0.3);
    setReferredFriends((prev) =>
      prev.map((f) =>
        f.id === friendId
          ? {
              ...f,
              earnedXp: f.earnedXp - tributeXp,
              tribute30PctSent: true,
            }
          : f
      )
    );

    const nextReceived = receivedTributeXpTotal + tributeXp;
    setReceivedTributeXpTotal(nextReceived);
    try {
      localStorage.setItem('foroshyar_received_tribute_xp_v4', String(nextReceived));
    } catch {
      // ignore
    }

    await adjustAmbassadorXp(
      tributeXp,
      `دریافت ۳۰٪ XP اهدایی (${tributeXp} XP) از دوست معرفی‌شده «${friend.nameFa}» به پاس معرفی شما`
    );

    setXpActionFeedback(
      `💚 «${friend.nameFa}» به پاس اینکه او را به برنامه معرفی کردید، ۳۰٪ از XP خود (+${tributeXp} XP) را به شما بخشید و رتبه شما در جدول ارتقا یافت!`
    );
  };

  // User gifts 30% of their own XP to the person who referred them
  const handleGift30PctToMyReferrer = async () => {
    if (sentTributeToMyReferrer || !registrationInfo.referredByCode) return;
    const tributeAmount = Math.floor(profile.xp * 0.3);
    if (tributeAmount <= 0) return;

    const refCode = registrationInfo.referredByCode;
    setServerLeaderboard((prev) =>
      prev.map((row) =>
        row.referralCode === refCode
          ? {
              ...row,
              xp: row.xp + tributeAmount,
              receivedTributeXpTotal: row.receivedTributeXpTotal + tributeAmount,
            }
          : row
      )
    );

    setSentTributeToMyReferrer(true);
    await adjustAmbassadorXp(
      -tributeAmount,
      `بخشش ۳۰٪ از XP خود (${tributeAmount} XP) به معرف شما (${refCode}) به رسم وفاداری توانا سیتی`
    );
    setXpActionFeedback(
      `🙏 شما ۳۰٪ از XP خود (${tributeAmount} XP) را به معرف خودتان (${refCode}) بخشیدید!`
    );
  };

  // Family Clan Role Change & Adding Newcomer (up to 20 base capacity, expanding with success)
  const handleChangeFamilyMemberRole = (memberId: string, nextRole: FamilyMemberRole) => {
    setFamilyMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role: nextRole } : m))
    );
  };

  const handleAddFamilyClanMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClanMemberName.trim()) return;
    if (familyMembers.length + 1 >= familyCapacityLimit) {
      setXpActionFeedback(
        `ظرفیت فعلی فامیلی شما (${familyCapacityLimit} نفر) تکمیل است. با افزایش XP فامیلی سقف به ۳۵ و ۵۰ نفر ارتقا می‌یابد!`
      );
      return;
    }

    const added: FamilyClanMember = {
      id: `fm_${Date.now()}`,
      nameFa: newClanMemberName.trim(),
      referralCode: `TVN-FAM-${Math.floor(1000 + Math.random() * 8999)}`,
      role: newClanMemberRole,
      xpContributed: 250,
      isNewcomerProtected: newClanMemberRole === 'MEMBER',
    };

    setFamilyMembers((prev) => [...prev, added]);
    setNewClanMemberName('');
    await adjustAmbassadorXp(
      180,
      `پذیرش عضو جدید «${added.nameFa}» زیر چتر حمایتی فامیلی (${familyNameFa})`
    );
    setXpActionFeedback(
      `🛡️ «${added.nameFa}» با سمت «${ROLE_LABELS_FA[newClanMemberRole].labelFa}» به فامیلی شما پیوست (+۱۸۰ XP توفیق فامیلی)!`
    );
  };

  // Send message to Public or Family Group Chat (works online via REST/SSE + non-blocking offline queue)
  const handleSendGroupChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = chatDraft.trim();
    if (!cleanText) return;

    const msgId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newMsg: GroupChatMessageItem = {
      id: msgId,
      roomId: activeChatRoom,
      senderName: profile.displayName,
      senderReferralCode: registrationInfo.referralCode,
      senderTier: profile.tier,
      senderXp: profile.xp + 15,
      text: cleanText,
      createdAtIso: new Date().toISOString(),
      timeLabelFa: new Date().toLocaleTimeString('fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      pendingOffline: !isOnline,
    };

    // Optimistic local update (never blocks offline users)
    setChatMessages((prev) => [...prev, newMsg]);
    setChatDraft('');

    await adjustAmbassadorXp(15, 'مشارکت و دوستی در اتاق چت گروهی توانا سیتی');

    if (isOnline && activeChatRoom !== 'family_clan_hall') {
      try {
        await fetch('/api/chat/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newMsg),
        });
      } catch {
        // Keep in local cache silently if network drops
      }
    }
  };

  const shareableReferralUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/?ref=${encodeURIComponent(registrationInfo.referralCode)}`
      : `https://ablecity.ir/?ref=${registrationInfo.referralCode}`;

  const filteredRoomMessages = chatMessages.filter((m) => m.roomId === activeChatRoom);

  return (
    <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 text-white rounded-3xl p-6 sm:p-8 border-2 border-amber-500/40 space-y-8 shadow-xl">
      {/* ====================================================================
          HEADER: TAVANA CITY REFERRAL LEAGUE, FREE METAVERSE LAND & DEMOCRACY OF WEALTH
      ==================================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold text-amber-400">
            <Crown className="w-4 h-4" />
            <span>لیگ معرفان، سیستم فامیلی ۲۰ نفره و سفیران شهر متاورسی توانا سیتی (AbleCity)</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400">دموکراسی ثروت، جایگاه و مدیریت</span>
            <span aria-hidden="true">·</span>
            <span className="text-sky-300">پاداش زمین رایگان متاورسی</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            ثبت‌نام فوری با موبایل و ایمیل، صدور کد معرف، جدول رده‌بندی XP، فامیلی A++ و اتاق چت گروهی
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-4xl leading-relaxed">
            اینجا صرفاً یک برنامه آموزشی نیست؛ یک <strong className="text-amber-300">جامعه زنده برای دوستی، همکاری و ساختن آینده</strong> است! به محض ثبت شماره موبایل و ایمیل، کد معرف اختصاصی شما صادر شده و با هر فعالیت آموزشی و معرفی دوستان، عدد <strong className="text-amber-300">XP</strong> شما در جدول بالا می‌رود تا به <strong className="text-emerald-300">زمین رایگان در شهر متاورسی ایبل‌سیتی (توانا سیتی)</strong>، <strong className="text-sky-300">کاپیتانی فامیلی ۲۰ نفره (ویژه نمره یک‌ضرب A++)</strong>، <strong className="text-emerald-300">هیئت مدیره برنامه</strong> و <strong className="text-amber-300">صندلی‌های شورای شهر توانا در اکوسیستم آفرینش</strong> دست پیدا کنید.
          </p>
        </div>

        {/* Live Rank & XP Badge */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-900/90 border border-amber-500/40 rounded-2xl p-4 shrink-0">
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">رتبه فعلی شما در لیگ:</span>
            <span className="text-xl font-extrabold font-mono-tabular text-amber-400">
              رتبه #{myRank}
            </span>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">مجموع امتیاز (XP):</span>
            <span className="text-xl font-extrabold font-mono-tabular text-emerald-400">
              {profile.xp.toLocaleString('fa-IR')} XP
            </span>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">کد معرف رسمی شما:</span>
            <span className="text-sm font-extrabold font-mono-tabular text-sky-300">
              {registrationInfo.referralCode}
            </span>
          </div>
        </div>
      </div>

      {/* PROFESSIONAL SERIOUSNESS & HIGH-CALIBER MARKETER MANIFESTO (تربیت بازاریابان بلندطراز و پایان نگاه رفع تکلیفی) */}
      <div className="bg-gradient-to-l from-amber-500/15 via-slate-900/90 to-emerald-500/15 border border-amber-400/50 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>
              فلسفه اجتماعی فروشیار: پرورش «بازاریابان بلندطراز» در کنار هم‌قطاران مصمم (پایان نگاه رفع تکلیفی به آموزش!)
            </span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed">
            وقتی کارآموز وارد این محیط می‌شود و می‌بیند دیگران با چه <strong className="text-white">جدیت، انضباط و انگیزه‌ای</strong> برای گرفتن <strong className="text-amber-300">نمره یک‌ضرب A++، کاپیتانی فامیلی ۲۰ نفره، زمین متاورسی AbleCity و صندلی شورای شهر توانا</strong> تلاش می‌کنند، دیگر به چشم یک «شوخی» یا «رفع تکلیف اداری» به آموزش نگاه نمی‌کند؛ بلکه تشویق می‌شود تا با استانداردهای این اپلیکیشن، به یک <strong className="text-emerald-300">بازاریاب بلندطراز، حرفه‌ای و صاحب پرستیژ</strong> تبدیل شود و اینجا با همکارانش رفاقت و هم‌پیمانی واقعی بسازد.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-[11px] font-extrabold text-emerald-300 bg-slate-950/90 px-3.5 py-2 rounded-xl border border-emerald-500/40">
          <Award className="w-4 h-4 text-amber-400" />
          <span>استاندارد بازاریاب بلندطراز توانا سیتی</span>
        </div>
      </div>

      {/* ====================================================================
          STEP 1: INSTANT MOBILE & EMAIL REGISTRATION + REFERRAL CODE GENERATOR
      ==================================================================== */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm sm:text-base font-extrabold text-white">
              ۱. ثبت‌نام آنی با شماره موبایل و ایمیل و دریافت کد معرف رسمی (+۱۵۰ XP پاداش ثبت‌نام)
            </h3>
          </div>
          <span
            className={`px-3 py-1 rounded-lg text-xs font-extrabold ${
              registrationInfo.isRegisteredWithContact
                ? 'bg-emerald-950 border border-emerald-500/50 text-emerald-300'
                : 'bg-amber-500/20 border border-amber-400/50 text-amber-300'
            }`}
          >
            {registrationInfo.isRegisteredWithContact
              ? `● ثبت‌شده در لیگ با کد معرف: ${registrationInfo.referralCode}`
              : '⚡ آماده ثبت‌نام فوری و دریافت +۱۵۰ XP هدیه'}
          </span>
        </div>

        <form
          onSubmit={handleInstantRegister}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end"
        >
          <div>
            <label className="block text-[11px] text-slate-300 mb-1">
              نام و نام خانوادگی سفیر:
            </label>
            <input
              type="text"
              required
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              placeholder="مثلاً: سیاوش امیری"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-300 mb-1 flex items-center gap-1">
              <Phone className="w-3 h-3 text-emerald-400" />
              <span>شماره موبایل (الزامی):</span>
            </label>
            <input
              type="tel"
              required
              dir="ltr"
              value={regMobile}
              onChange={(e) => setRegMobile(e.target.value)}
              placeholder="0912..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono-tabular"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-300 mb-1 flex items-center gap-1">
              <Mail className="w-3 h-3 text-sky-400" />
              <span>آدرس ایمیل (الزامی):</span>
            </label>
            <input
              type="email"
              required
              dir="ltr"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono-tabular"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-300 mb-1">
              کد معرف دعوت‌کننده (اختیاری +۱۰۰ XP):
            </label>
            <input
              type="text"
              dir="ltr"
              value={regRefBy}
              onChange={(e) => setRegRefBy(e.target.value.toUpperCase())}
              placeholder="TVN-NEG-9121"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-amber-300 font-mono-tabular"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-300 mb-1">شهر فعالیت:</label>
            <input
              type="text"
              value={regCity}
              onChange={(e) => setRegCity(e.target.value)}
              placeholder="تهران / اصفهان / تبریز..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-l from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold text-xs transition-colors cursor-pointer whitespace-nowrap shadow-md"
            >
              {registrationInfo.isRegisteredWithContact
                ? 'به‌روزرسانی و همگام‌سازی رتبه'
                : 'ثبت‌نام فوری + دریافت کد معرف و XP'}
            </button>
          </div>
        </form>

        {regSuccessBanner && (
          <div className="p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-xs text-emerald-200 font-bold flex flex-wrap items-center justify-between gap-2">
            <span>{regSuccessBanner}</span>
          </div>
        )}

        {/* Shareable Referral Link Bar */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-300 font-bold">
              لینک دعوت اختصاصی شما برای معرفی دوستان و عزیزان (+۲۵۰ XP به ازای هر نفر):
            </span>
            <code
              dir="ltr"
              className="px-3 py-1 rounded-lg bg-slate-950 border border-amber-500/40 text-amber-300 font-mono-tabular"
            >
              {shareableReferralUrl}
            </code>
          </div>
          <button
            type="button"
            onClick={() => {
              if (typeof navigator !== 'undefined' && navigator.clipboard) {
                navigator.clipboard.writeText(shareableReferralUrl);
                setCopiedMyRefLink(true);
                setTimeout(() => setCopiedMyRefLink(false), 2000);
              }
            }}
            className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copiedMyRefLink ? '✓ لینک و کد معرف کپی شد' : 'کپی لینک دعوت دوستان'}</span>
          </button>
        </div>
      </div>

      {/* ====================================================================
          STEP 2: DEMOCRACY OF WEALTH, METAVERSE LAND & CITY COUNCIL LADDER
      ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: 4-Stage Democracy of Wealth & Tavana City Council Ladder */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Landmark className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                ۲. منشور «دموکراسی ثروت، جایگاه و مدیریت» در شهر متاورسی توانا سیتی (AbleCity)
              </h3>
            </div>
            <span className="text-[11px] text-amber-300 font-bold">
              شایسته‌سالاری محض بدون رانت
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {[
              {
                step: 'پله اول (ورود و کد معرف)',
                xpReq: '۱۵۰+ XP',
                title: 'سفیر و معرف رسمی مهارت‌های بازاریابی',
                desc: 'ثبت‌نام با موبایل و ایمیل، دریافت کد معرف اختصاصی و کسب XP از آموزش‌ها، شبیه‌سازی صوتی و معرفی عزیزان و دوستان.',
                unlocked: profile.xp >= 150,
              },
              {
                step: 'پله دوم (پاداش متاورسی)',
                xpReq: '۱,۰۰۰+ XP',
                title: 'دریافت رایگان زمین در شهر متاورسی ایبل‌سیتی / توانا سیتی',
                desc: 'افرادی که با XP بالا در سطح این برنامه قرار بگیرند، به‌صورت کاملاً رایگان صاحب قطعه زمین دارای سند دیجیتال در شهر متاورسی AbleCity / توانا سیتی می‌شوند.',
                unlocked: profile.xp >= 1000,
              },
              {
                step: 'پله سوم (مدیریت و هیئت مدیره)',
                xpReq: '۲,۵۰۰+ XP',
                title: 'صعود به مدارج بالای مدیریتی و هیئت مدیره همین برنامه',
                desc: 'با توجه به دموکراسی ثروت و جایگاه در ایبل‌سیتی، سفیران برتر به مدیریت ارشد اجرایی و عضویت در هیئت مدیره برنامه فروشیار و صنف تخصصی خود می‌رسند.',
                unlocked: profile.xp >= 2500,
              },
              {
                step: 'پله چهارم (پارلمان اکوسیستم آفرینش)',
                xpReq: '۵,۰۰۰+ XP',
                title: 'کسب صندلی‌های «شورای شهر توانا» در اکوسیستم آفرینش',
                desc: 'در صورتی که در مدیریت برنامه خودتان موفق باشید، می‌توانید چشم به صندلی‌های «شورای شهر توانا» در اکوسیستم آفرینش داشته باشید و در سیاست‌گذاری کل شهر مجازی مشارکت کنید.',
                unlocked: profile.xp >= 5000,
              },
            ].map((stage, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl border space-y-1.5 ${
                  stage.unlocked
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-white'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-400">{stage.step}</span>
                  <span className="font-mono-tabular text-[11px] px-2 py-0.5 rounded bg-black/40 text-emerald-300 font-bold">
                    {stage.unlocked ? `✓ فعال (${stage.xpReq})` : stage.xpReq}
                  </span>
                </div>
                <h4 className="font-extrabold text-xs sm:text-sm text-white">{stage.title}</h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">{stage.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right 5 Cols: Digital Metaverse Land Deed Card + XP Activity Log */}
        <div className="lg:col-span-5 bg-gradient-to-br from-amber-950/50 via-slate-900 to-emerald-950/50 border border-amber-400/50 rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>سند دیجیتال زمین رایگان شهر متاورسی AbleCity / توانا سیتی</span>
              </span>
              <span className="text-[11px] font-mono-tabular text-emerald-300 font-bold">
                {profile.xp >= 1000 ? '● واجد شرایط زمین رایگان' : `${profile.xp} / ۱۰۰۰ XP`}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-black/50 border border-amber-500/30 space-y-2 text-xs">
              <div className="text-amber-300 font-extrabold">{myGovernance.landTitleFa}</div>
              <div className="text-sky-300 font-bold">{myGovernance.governanceTitleFa}</div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-gradient-to-l from-amber-400 to-emerald-400 transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.round((profile.xp / 1000) * 100))}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-300 pt-1 leading-relaxed">
                کد مالکیت متاورسی شما:{' '}
                <strong className="font-mono-tabular text-white">
                  ABLECITY-LAND-{registrationInfo.referralCode}
                </strong>
              </p>
            </div>

            {/* Recent XP Earnings Log */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-300 block">
                ریز تراکنش‌های XP شما در فعالیت‌های مختلف برنامه:
              </span>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {registrationInfo.xpHistory.slice(0, 6).map((item) => (
                  <div
                    key={item.id}
                    className="px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2 text-[11px]"
                  >
                    <span className="text-slate-300 truncate">{item.reasonFa}</span>
                    <span
                      className={`font-mono-tabular font-extrabold shrink-0 ${
                        item.delta >= 0 ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {item.delta >= 0 ? `+${item.delta} XP` : `${item.delta} XP`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                adjustAmbassadorXp(
                  120,
                  'تکمیل تمرین مهارت بازاریابی ۱۱ صنف و مرور اسکریپت‌های تبلت'
                )
              }
              className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition-colors cursor-pointer"
            >
              + ثبت تمرین روزانه بازاریابی (+۱۲۰ XP)
            </button>
          </div>
        </div>
      </div>

      {/* ====================================================================
          STEP 3: FIRST-STRIKE A++ FAMILY CLAN SYSTEM (۲۰ نفر ظرفیت پایه + کاپیتان، معاون، منشی و دستیار + اتاق چت فامیلی)
      ==================================================================== */}
      <div className="bg-gradient-to-l from-indigo-950/80 via-slate-900 to-amber-950/50 border-2 border-amber-400/60 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-extrabold text-amber-300">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>
                ۳. سیستم «فامیلی و خاندان فروش (Family Clan)» ویژه دارندگان نمره یک‌ضرب A++
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-white">
              تأسیس فامیلی شخصی (پوشش تا ۲۰ نفر تازه‌وارد)، اتاق چت اختصاصی فامیلی و انتصاب معاون، منشی و دستیار توسط کاپیتان
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
              کسانی که در آزمون این برنامه <strong className="text-amber-300">یک‌ضرب نمره A++</strong> بگیرند، به مقام <strong className="text-white">«کاپیتان فامیلی»</strong> می‌رسند: صاحب اتاق چت اختصاصی فامیلی خودشان می‌شوند، می‌توانند تا <strong className="text-emerald-300">۲۰ نفر (و با توفیقات فامیلی تا ۵۰ نفر)</strong> از افراد تازه‌وارد و دوستان را زیر چتر حمایتی خود قرار دهند و برای فامیلی خود <strong className="text-sky-300">معاون اول، منشی و دستیار</strong> انتخاب کنند تا هیچکس در این برنامه احساس تنهایی نکند!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {firstStrikeAPlusPlusUnlocked || profile.tier === 'A++' ? (
              <span className="px-3.5 py-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5">
                <Crown className="w-4 h-4" />
                <span>👑 حکم کاپیتانی یک‌ضرب A++ فعال است</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  setFirstStrikeAPlusPlusUnlocked(true);
                  await applyPresetProfileScenario('TIER_A_PLUS_PLUS');
                  await adjustAmbassadorXp(
                    350,
                    'کسب یک‌ضرب درجه A++ و دریافت حکم تأسیس فامیلی ۲۰ نفره و اتاق چت فامیلی'
                  );
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-l from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 text-slate-950 text-xs font-extrabold cursor-pointer whitespace-nowrap shadow-md"
              >
                ⚡ شبیه‌سازی کسب یک‌ضرب A++ و فعال‌سازی حکم کاپیتانی فامیلی
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 5 Cols: Family Identity, Capacity Progress & Adding Newcomers / Assigning Roles */}
          <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-amber-300">
                نام فامیلی / خاندان اختصاصی شما در توانا سیتی:
              </label>
              <input
                type="text"
                value={familyNameFa}
                onChange={(e) => setFamilyNameFa(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-amber-500/40 text-xs sm:text-sm font-extrabold text-white"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-bold">اعضای تحت پوشش فامیلی:</span>
                <span className="font-mono-tabular font-extrabold text-emerald-400">
                  {familyMembers.length + 1} از {familyCapacityLimit} نفر
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-l from-amber-400 to-sky-400 transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(((familyMembers.length + 1) / familyCapacityLimit) * 100)
                    )}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-sky-300 font-bold">{familySuccessTierFa}</span>
                <span className="font-mono-tabular text-amber-300 font-bold">
                  XP کل فامیلی: {familyTotalXp.toLocaleString('fa-IR')} XP
                </span>
              </div>
            </div>

            <form onSubmit={handleAddFamilyClanMember} className="space-y-2.5 pt-2 border-t border-slate-800">
              <span className="text-xs font-extrabold text-white block">
                + پذیرش عضو جدید در فامیلی (تازه‌وارد یا کادر رهبری کاپیتان):
              </span>
              <input
                type="text"
                required
                value={newClanMemberName}
                onChange={(e) => setNewClanMemberName(e.target.value)}
                placeholder="نام دوست یا کارآموز تازه‌وارد..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  value={newClanMemberRole}
                  onChange={(e) => setNewClanMemberRole(e.target.value as FamilyMemberRole)}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-amber-300 font-bold"
                >
                  <option value="MEMBER">🌱 عضو تحت پوشش فامیلی (تازه‌وارد)</option>
                  <option value="VICE_CAPTAIN">🛡️ معاون اول کاپیتان (Vice-Captain)</option>
                  <option value="SECRETARY">📋 منشی فامیلی (Secretary)</option>
                  <option value="ASSISTANT">⚡ دستیار اجرایی (Assistant)</option>
                </select>
                <button
                  type="submit"
                  className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs cursor-pointer whitespace-nowrap"
                >
                  افزودن به فامیلی (+۱۸۰ XP)
                </button>
              </div>
            </form>

            <button
              type="button"
              onClick={() => setActiveChatRoom('family_clan_hall')}
              className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>ورود به اتاق چت اختصاصی «{familyNameFa}»</span>
            </button>
          </div>

          {/* Right 7 Cols: Family Command Roster (Captain + Vice-Captain + Secretary + Assistant + Protected Newcomers) */}
          <div className="lg:col-span-7 bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <h4 className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>چارت فرماندهی و اعضای «{familyNameFa}» (انتصاب آنلاین معاون، منشی و دستیار):</span>
              </h4>
              <span className="text-[11px] text-amber-300">
                کاپیتان می‌تواند سمت هر عضو فامیلی را تغییر دهد
              </span>
            </div>

            {/* Captain Row (Current User) */}
            <div className="p-3 rounded-xl bg-gradient-to-l from-amber-500/20 to-slate-900 border border-amber-400/50 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-extrabold text-[11px]">
                  👑 کاپیتان و بزرگ فامیلی (شما)
                </span>
                <span className="font-extrabold text-white">{profile.displayName}</span>
                <span className="text-[11px] font-mono-tabular text-sky-300">
                  ({registrationInfo.referralCode})
                </span>
              </div>
              <span className="font-mono-tabular font-bold text-amber-300">
                {profile.xp.toLocaleString('fa-IR')} XP · درجه {profile.tier}
              </span>
            </div>

            {/* Family Members List with Live Role Selector */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {familyMembers.map((member) => {
                const roleMeta = ROLE_LABELS_FA[member.role];
                return (
                  <div
                    key={member.id}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] ${roleMeta.badgeClass}`}>
                          {roleMeta.labelFa}
                        </span>
                        <span className="font-bold text-white">{member.nameFa}</span>
                        <span className="text-[10px] font-mono-tabular text-slate-400">
                          {member.referralCode} · +{member.xpContributed} XP
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">{roleMeta.descFa}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleChangeFamilyMemberRole(
                            member.id,
                            e.target.value as FamilyMemberRole
                          )
                        }
                        className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-[11px] text-amber-300 font-bold"
                      >
                        <option value="VICE_CAPTAIN">انتصاب: 🛡️ معاون کاپیتان</option>
                        <option value="SECRETARY">انتصاب: 📋 منشی فامیلی</option>
                        <option value="ASSISTANT">انتصاب: ⚡ دستیار اجرایی</option>
                        <option value="MEMBER">انتصاب: 🌱 عضو تحت پوشش</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          STEP 4: BIDIRECTIONAL 30% XP GIFTING & REFERRED FRIENDS TRIBUTE ENGINE
      ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 Cols: Top-Table 30% XP Donation (اهدای ۳۰٪ توسط افراد بالای جدول) */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-amber-500/40 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                ۴-الف. اهدای تا ۳۰٪ از XP توسط افراد بالای جدول به دیگران
              </h3>
            </div>
            <span className="text-xs font-mono-tabular text-amber-300 font-bold">
              حداکثر قابل اهدا: ۳۰٪ ({Math.floor(profile.xp * 0.3)} XP)
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            طبق قانون سخاوت و دموکراسی ثروت در شهر توانا، افرادی که در بالای جدول قرار دارند می‌توانند تا <strong className="text-amber-300">۳۰ درصد از XP خودشان</strong> را به دوستان، اعضای فامیلی یا سفیران دیگر اهدا نمایند تا آن‌ها نیز سریع‌تر به زمین رایگان متاورسی برسند:
          </p>

          <div className="space-y-3 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">درصد اهدای XP شما (تا سقف ۳۰٪):</span>
              <span className="font-mono-tabular font-extrabold text-amber-400">
                {giftPercent}٪ معادل {maxDonatable30PctXp} XP
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={30}
              step={5}
              value={giftPercent}
              onChange={(e) => setGiftPercent(Number(e.target.value))}
              className="w-full accent-amber-400"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  انتخاب سفیر یا دوست دریافت‌کننده در جدول:
                </label>
                <select
                  value={giftTargetCode}
                  onChange={(e) => setGiftTargetCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-bold"
                >
                  {combinedLeaderboard
                    .filter((m) => !m.isCurrentUser)
                    .map((m) => (
                      <option key={m.referralCode} value={m.referralCode}>
                        {m.displayName} ({m.xp} XP)
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleDonateUpTo30PctXp}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition-colors cursor-pointer"
                >
                  اهدای {giftPercent}٪ ({maxDonatable30PctXp} XP) به این عضو
                </button>
              </div>
            </div>
          </div>

          {registrationInfo.referredByCode && (
            <div className="p-3.5 rounded-xl bg-sky-950/50 border border-sky-500/40 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div>
                <span className="font-bold text-sky-300 block">
                  معرف شما در برنامه: کد {registrationInfo.referredByCode}
                </span>
                <span className="text-[11px] text-slate-300">
                  شما هم می‌توانید ۳۰٪ از XP خودتان ({Math.floor(profile.xp * 0.3)} XP) را به شخصی که شما را معرفی کرده ببخشید:
                </span>
              </div>
              <button
                type="button"
                disabled={sentTributeToMyReferrer}
                onClick={handleGift30PctToMyReferrer}
                className="px-3 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-extrabold text-xs cursor-pointer whitespace-nowrap"
              >
                {sentTributeToMyReferrer
                  ? '✓ ۳۰٪ به معرف شما بخشیده شد'
                  : `بخشش ۳۰٪ XP به معرفم (${registrationInfo.referredByCode})`}
              </button>
            </div>
          )}
        </div>

        {/* Right 6 Cols: Referred Friends Gifting 30% of their XP to You */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-emerald-500/40 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                ۴-ب. عزیزان معرفی‌شده توسط شما و دریافت ۳۰٪ XP بخشیده‌شده آن‌ها
              </h3>
            </div>
            <span className="text-xs font-mono-tabular text-emerald-300 font-bold">
              معرفی‌های شما: {referredFriends.length} نفر
            </span>
          </div>

          <form onSubmit={handleInviteNewFriend} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              required
              value={newFriendName}
              onChange={(e) => setNewFriendName(e.target.value)}
              placeholder="نام دوست یا همکار جدید..."
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
            />
            <input
              type="tel"
              required
              dir="ltr"
              value={newFriendPhone}
              onChange={(e) => setNewFriendPhone(e.target.value)}
              placeholder="شماره موبایل دوست (0912...)"
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono-tabular"
            />
            <button
              type="submit"
              className="py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs cursor-pointer whitespace-nowrap"
            >
              + ثبت معرفی دوست (+۲۵۰ XP)
            </button>
          </form>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {referredFriends.map((fr) => (
              <div
                key={fr.id}
                className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="font-bold text-white">{fr.nameFa}</div>
                  <div className="text-[11px] text-slate-400 font-mono-tabular">
                    موبایل: {fr.mobileMasked} · XP فعلی دوست: {fr.earnedXp} XP · {fr.joinedAtFa}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={fr.tribute30PctSent}
                  onClick={() => handleClaim30PctFromReferredFriend(fr.id)}
                  className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-colors cursor-pointer whitespace-nowrap ${
                    fr.tribute30PctSent
                      ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                  }`}
                >
                  {fr.tribute30PctSent
                    ? `✓ ۳۰٪ (+${fr.tributeAmountXp} XP) به شما بخشیده شد`
                    : `دریافت ۳۰٪ XP اهدایی دوست (+${Math.round(fr.earnedXp * 0.3)} XP)`}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {xpActionFeedback && (
        <div className="p-4 rounded-2xl bg-amber-500/20 border-2 border-amber-400 text-xs sm:text-sm text-amber-200 font-extrabold flex items-center justify-between">
          <span>{xpActionFeedback}</span>
        </div>
      )}

      {/* ====================================================================
          STEP 5: LIVE LEADERBOARD TABLE + ONLINE GROUP & FAMILY CHAT ROOM (NON-BLOCKING OFFLINE)
      ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: Official Live Referral & Marketing XP Leaderboard */}
        <div className="lg:col-span-7 bg-slate-900/95 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                ۵. جدول رده‌بندی زنده لیگ معرفان و مهارت‌های بازاریابی توانا سیتی
              </h3>
            </div>
            <span className="text-[11px] text-emerald-300 font-mono-tabular">
              رده‌بندی بر اساس عدد XP + معرفی دوستان + گواهینامه‌ها
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                  <th className="py-2.5 px-2">رتبه</th>
                  <th className="py-2.5 px-2">سفیر / کد معرف و موبایل</th>
                  <th className="py-2.5 px-2">معرفی‌ها</th>
                  <th className="py-2.5 px-2">عدد XP</th>
                  <th className="py-2.5 px-2">جایگاه متاورسی و شورای شهر توانا</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {combinedLeaderboard.map((row, idx) => {
                  const status = getGovernanceAndLandStatus(
                    row.xp,
                    row.certifiedProductsCount
                  );
                  return (
                    <tr
                      key={row.referralCode}
                      className={
                        row.isCurrentUser
                          ? 'bg-sky-950/80 font-extrabold text-white'
                          : 'hover:bg-slate-800/40 text-slate-200'
                      }
                    >
                      <td className="py-3 px-2 font-mono-tabular font-extrabold text-amber-400">
                        #{idx + 1}
                      </td>
                      <td className="py-3 px-2">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{row.displayName}</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono-tabular text-sky-300">
                            {row.referralCode}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono-tabular mt-0.5">
                          {row.mobileMasked} · {row.emailMasked} · سطح {row.tier}
                        </div>
                      </td>
                      <td className="py-3 px-2 font-mono-tabular text-emerald-300 font-bold">
                        {row.referredFriendsCount} نفر
                      </td>
                      <td className="py-3 px-2 font-mono-tabular text-sm font-extrabold text-amber-300">
                        {row.xp.toLocaleString('fa-IR')} XP
                      </td>
                      <td className="py-3 px-2">
                        <div className="text-[11px] font-bold text-emerald-300">
                          {status.landTitleFa}
                        </div>
                        <div className="text-[10px] text-sky-300 mt-0.5">
                          {status.governanceTitleFa}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 5 Cols: Strictly Group & Family Chat Room (Non-Blocking Offline Mode) */}
        <div className="lg:col-span-5 bg-slate-900/95 border border-sky-500/40 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    اتاق چت گروهی و تالار اختصاصی فامیلی توانا سیتی
                  </h3>
                  <span className="text-[10px] text-amber-300 block">
                    📌 منحصراً چت گروهی و فامیلی (بدون چت انفرادی) · غیرمسدودکننده در حالت آفلاین
                  </span>
                </div>
              </div>

              <span
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 ${
                  isOnline
                    ? 'bg-emerald-950 border border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-800 border border-slate-700 text-amber-300'
                }`}
              >
                {isOnline ? (
                  <>
                    <Wifi className="w-3 h-3" />
                    <span>آنلاین ({onlineUsersCount} عضو در تالار)</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3" />
                    <span>حالت آفلاین (بدون توقف برنامه)</span>
                  </>
                )}
              </span>
            </div>

            {/* 5 Group Hall Selector Tabs (including the A++ Family Clan Hall!) */}
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              {[
                { id: 'general_hall' as const, label: '۱. تالار عمومی تجربه فروش' },
                { id: 'xp_metaverse_club' as const, label: '۲. باشگاه ۳۰٪ XP و زمین متاورس' },
                { id: 'council_governance' as const, label: '۳. مجمع شورای شهر توانا' },
                { id: 'multilingual_hall' as const, label: '۴. تالار ۱۱ زبان (شامل ارمنی 🇦🇲)' },
                {
                  id: 'family_clan_hall' as const,
                  label: `۵. 👑 اتاق چت فامیلی: ${familyNameFa}`,
                },
              ].map((room) => (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => setActiveChatRoom(room.id)}
                  className={`px-2.5 py-1.5 rounded-xl font-bold text-right transition-colors cursor-pointer truncate ${
                    room.id === 'family_clan_hall' ? 'col-span-2 ' : ''
                  }${
                    activeChatRoom === room.id
                      ? room.id === 'family_clan_hall'
                        ? 'bg-amber-400 text-slate-950 font-extrabold'
                        : 'bg-sky-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {room.label}
                </button>
              ))}
            </div>

            {/* Messages Feed */}
            <div className="h-64 overflow-y-auto space-y-2.5 bg-slate-950/90 p-3 rounded-xl border border-slate-800">
              {filteredRoomMessages.map((msg) => {
                const isMine = msg.senderReferralCode === registrationInfo.referralCode;
                return (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-xl text-xs space-y-1 border ${
                      isMine
                        ? 'bg-sky-950/80 border-sky-500/40 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-[10px]">
                      <span className="font-extrabold text-amber-300">
                        {msg.senderName} ({msg.senderReferralCode} · {msg.senderXp} XP)
                      </span>
                      <span className="text-slate-400 font-mono-tabular">
                        {msg.pendingOffline ? '⏳ ذخیره در صف آفلاین' : msg.timeLabelFa}
                      </span>
                    </div>
                    <p className="leading-relaxed text-xs">{msg.text}</p>
                  </div>
                );
              })}
              <div ref={chatBottomRef} />
            </div>
          </div>

          {/* Group Chat Input Form */}
          <form onSubmit={handleSendGroupChatMessage} className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatDraft}
                onChange={(e) => setChatDraft(e.target.value)}
                placeholder={
                  activeChatRoom === 'family_clan_hall'
                    ? `پیام کاپیتان یا اعضای «${familyNameFa}» (+۱۵ XP)...`
                    : 'پیام گروهی خود را برای دوستی و همکاری در این تالار بنویسید (+۱۵ XP)...'
                }
                className="flex-1 px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Send className="w-3.5 h-3.5" />
                <span>ارسال در گروه</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              ✓ قانون دوستی و امنیت توانا سیتی: چت‌ها منحصراً گروهی یا در چارچوب فامیلی ۲۰ نفره هستند و در صورت آفلاین بودن نیز هیچ اختلالی در کار برنامه ایجاد نمی‌شود.
            </p>
          </form>
        </div>
      </div>

      {/* ====================================================================
          STEP 6: MARKET PRICING STRATEGY FOR FOROSHYAR & VISITOR ACQUISITION PLAYBOOK
      ==================================================================== */}
      <div className="bg-slate-900/95 border border-emerald-500/40 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BadgeDollarSign className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm sm:text-base font-extrabold text-white">
              ۶. جدول مصوب قیمت‌گذاری بازار برای «آموزش ویزیتوری فروشیار» و مدل جذب همزمان برای برنامه مادر (صنفیار VIP)
            </h3>
          </div>
          <span className="text-xs font-extrabold text-amber-300">
            فرمول «هزینه آموزش = بازگشت ۱۰۰٪ در اولین فروش صنفیار»
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-sky-400 block">
              پلن ۱: ورودی جامعه‌ساز (Freemium)
            </span>
            <div className="text-base font-extrabold text-white">رایگان (۰ تومان)</div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              ثبت‌نام با موبایل و ایمیل، دریافت کد معرف، ورود به لیگ XP، چت گروهی، آموزش ۱ صنف اول و عضویت زیر چتر یک «فامیلی ۲۰ نفره» برای جذب میلیونی مخاطب.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/50 space-y-2">
            <span className="text-[11px] font-bold text-emerald-300 block">
              پلن ۲: لایسنس سفیر حرفه‌ای ۱۱ صنف (پرفروش‌ترین)
            </span>
            <div className="text-base font-extrabold text-amber-300">
              ۱,۴۹۰,۰۰۰ تومان (یا بورسیه بازگشت وجه)
            </div>
            <p className="text-[11px] text-slate-200 leading-relaxed">
              دسترسی کامل آفلاین به ۱۱+۲ صنف، آزمون رسمی گواهینامه A/A+/A++، شبیه‌ساز تبلت قفل خریدار و استودیوی ضبط صدا. <strong className="text-emerald-300">با اولین فروش صنفیار (حداقل ۷ تا ۱۳ میلیون پورسانت)، ۱۰۰٪ مبلغ آموزش به سفیر بازگردانده می‌شود!</strong>
            </p>
          </div>

          <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-400/50 space-y-2">
            <span className="text-[11px] font-bold text-amber-300 block">
              پلن ۳: پکیج کاپیتانی فامیلی ۲۰ نفره (Leader Pack)
            </span>
            <div className="text-base font-extrabold text-white">۴,۹۰۰,۰۰۰ تومان</div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              ویژه سرگروه‌ها و شرکت‌های پخش: امکان تأسیس فامیلی اختصاصی تا ۲۰ نفر (قابل ارتقا به ۵۰ نفر)، اتاق چت فامیلی، انتصاب معاون/منشی/دستیار و سهمیه زمین رایگان متاورسی AbleCity.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-sky-950/50 border border-sky-500/40 space-y-2">
            <span className="text-[11px] font-bold text-sky-300 block">
              پلن ۴: باندل دوگانه به اصناف (صنفیار VIP + فروشیار)
            </span>
            <div className="text-base font-extrabold text-emerald-300">
              هدیه رایگان روی لایسنس ۲۹ میلیونی صنفیار
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              هر صاحب مغازه که «صنفیار VIP» را می‌خرد، ۳ اکانت «فروشیار» برای آموزش فروشندگان داخل مغازه خودش هدیه می‌گیرد؛ و هر فروشنده مغازه هم تبدیل به معرف ۱۵٪ برنامه‌های دیگر می‌شود!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
