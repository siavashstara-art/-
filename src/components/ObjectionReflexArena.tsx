import React, { useState, useEffect } from 'react';
import { useAmbassador } from '../context/AmbassadorContext';
import { ALL_PRODUCT_IDS, ProductId, authorizeFieldSales } from '../domain/core';
import { ECOSYSTEM_PRODUCTS } from '../data/ecosystemData';
import {
  Zap,
  Trophy,
  Award,
  Timer,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

interface ReflexChallenge {
  id: string;
  productId: ProductId;
  guildNameFa: string;
  suddenObjectionFa: string;
  timeLimitSec: number;
  options: {
    id: string;
    textFa: string;
    isMasterMove: boolean;
    tacticTagFa: string;
    explanationFa: string;
  }[];
}

const REFLEX_CHALLENGES: ReflexChallenge[] = [
  {
    id: 'ref_talayar_1',
    productId: 'TALAYAR',
    guildNameFa: 'گالری طلا و جواهر (TalaYar)',
    suddenObjectionFa:
      '«مظنه طلا در روز ۱۰ بار بالا و پایین می‌شه؛ سایت شما تا قیمت رو عوض کنه من ضرر کردم!»',
    timeLimitSec: 15,
    options: [
      {
        id: 'opt_1',
        textFa:
          '«دقیقاً به همین خاطر طلایار به وب‌سرویس لحظه‌ای مظنه متصل است و با مکانیزم توقف خودکار (Circuit Breaker) در نوسان شدید، در کسری از ثانیه قیمت تمام ۲۰۰ مدل ویترین را همزمان قفل یا به‌روز می‌کند.»',
        isMasterMove: true,
        tacticTagFa: 'تبدیل ترس به مزیت امنیتی (Circuit Breaker)',
        explanationFa:
          'واکنش سریع و دقیق! شما بزرگ‌ترین ترس طلافروش را به دلیل اصلی خرید TalaYar تبدیل کردید.',
      },
      {
        id: 'opt_2',
        textFa: '«خب می‌تونید روزی دو بار دستی قیمت‌ها رو توی پنل عوض کنید، کار سختی نیست.»',
        isMasterMove: false,
        tacticTagFa: 'تله کار دستی در بازار پرنوسان',
        explanationFa:
          'تغییر دستی قیمت در بازار طلا مساوی با فاجعه مالی برای طلافروش است.',
      },
      {
        id: 'opt_3',
        textFa: '«بهتون ۲۰ درصد تخفیف می‌دم که اگر ضرر کردید جبران بشه!»',
        isMasterMove: false,
        tacticTagFa: 'تله تخفیف مخرب اعتبار',
        explanationFa:
          'پیشنهاد تخفیف در برابر نگرانی فنی، به معنی تایید ضعف سیستم شماست.',
      },
    ],
  },
  {
    id: 'ref_eventmate_1',
    productId: 'EVENTMATE',
    guildNameFa: 'تالار عروسی و تشریفات / نمایشگاه (EventMate)',
    suddenObjectionFa:
      '«عروس و دامادها یا بازدیدکننده‌ها میگن فکرهامون رو می‌کنیم و میرن، دیگه هم جواب تلفن نمیدن!»',
    timeLimitSec: 15,
    options: [
      {
        id: 'opt_1',
        textFa:
          '«چون وقتی از در تالار بیرون می‌روند، جزئیات منو و پکیج شما از ذهنشان می‌پرد! با EventMate در همان ۱۰ ثانیه‌ای که جلوی شما نشسته‌اند، پیش‌فاکتور تصویری و ویدیوی اختصاصی تالار روی واتساپشان ارسال می‌شود.»',
        isMasterMove: true,
        tacticTagFa: 'تثبیت آنی سرنخ داغ (Instant Lead Lock)',
        explanationFa:
          'عالی! شما علت سرد شدن مشتری بعد از خروج از تالار را هدف گرفتید.',
      },
      {
        id: 'opt_2',
        textFa: '«مشتری‌های الان کلاً وقت‌گذرونی می‌کنن و قصد قرارداد ندارن.»',
        isMasterMove: false,
        tacticTagFa: 'تایید ناامیدی مشتری',
        explanationFa: 'تایید اینکه مشتری‌ها خریدار نیستند، انگیزه خرید نرم‌افزار را از بین می‌برد.',
      },
    ],
  },
  {
    id: 'ref_cross_slab_decor',
    productId: 'SLABMATE',
    guildNameFa: 'شوروم سنگ و کابینت لوکس (SlabMate + DecorMate)',
    suddenObjectionFa:
      '«معمار سنگ اسلب رو می‌پسنده، اما کارفرما میگه نمی‌تونم تصور کنم این رگه سنگ کنار کابینت‌ها چطور درمیاد!»',
    timeLimitSec: 15,
    options: [
      {
        id: 'opt_1',
        textFa:
          '«اینجاست که ترکیب هم‌افزای SlabMate و DecorMate معامله را می‌بندد: همان باندل اسلب انتخابی معمار را با یک لمس در فضای سه‌بعدی آشپزخانه و کنار کابینت کارفرما بوک‌مچ می‌کنید تا درجا تایید کند.»',
        isMasterMove: true,
        tacticTagFa: 'معماری فروش مکمل ۳۵٪ (Cross-Module Mastery)',
        explanationFa:
          'فوق‌العاده! شما از اعتراض مشتری برای ارتقای قرارداد به مدل Cross-Module (با کمیسیون ۳۵٪) استفاده کردید.',
      },
      {
        id: 'opt_2',
        textFa: '«به کارفرما بگید به سلیقه معمارش اعتماد کنه و سخت نگیره.»',
        isMasterMove: false,
        tacticTagFa: 'نادیده گرفتن تردید خریدار نهایی',
        explanationFa: 'نادیده گرفتن تردید کارفرما باعث قفل شدن کل فاکتور سنگ و کابینت می‌شود.',
      },
    ],
  },
  {
    id: 'ref_furnimate_1',
    productId: 'FURNIMATE',
    guildNameFa: 'گالری مبل و جهیزیه عروس (FurniMate VIP)',
    suddenObjectionFa:
      '«۹۰٪ عروس و دامادها قیمت مبل و ناهارخوری رو روی کاغذ می‌گیرن و میگن «یک دور دیگر در بازار مبل بزنیم برمی‌گردیم» و دیگه پیداشون نمی‌شه!»',
    timeLimitSec: 15,
    options: [
      {
        id: 'opt_1',
        textFa:
          '«چون بعد از دیدن ۱۰ گالری مبل، کاغذهای بی‌هویت فراموش می‌شوند! با مبلیار در ۱۰ ثانیه پکیج جهیزیه (مبل ۸ نفره + ناهارخوری + سرویس خواب)، مابه‌التفاوت ۳۲ متر پارچه شانل ترک، گواهی ۵ سال ضمانت کلاف راش گرجستان و جدول چک صیادی بنفش را با نام گالری خودتان به گوشی عروس و داماد شلیک می‌کنید تا مستقیم پیش خودتان برگردند!»',
        isMasterMove: true,
        tacticTagFa: 'قفل کردن عروس و داماد با پیش‌فاکتور طلاکوب جهیزیه',
        explanationFa:
          'عالی! شما بزرگ‌ترین زخم بازار مبل را با پیش‌فاکتور طلاکوب، ضمانت ۵ ساله کلاف راش و چک صیادی درمان کردید.',
      },
      {
        id: 'opt_2',
        textFa: '«به مشتری بگید اگر الان نخره فردا قیمت مبل رو دوبرابر می‌کنید.»',
        isMasterMove: false,
        tacticTagFa: 'تهدید قیمتی غیرحرفه‌ای',
        explanationFa: 'تهدید کلامی باعث فرار عروس و داماد از گالری مبل می‌شود.',
      },
    ],
  },
  {
    id: 'ref_tvn_partner_1',
    productId: 'EVENTMATE',
    guildNameFa: 'تکنیک ادب بازاری و شراکت معکوس (۲۰٪ ویزیتور + ۱۵٪ معرف)',
    suddenObjectionFa:
      '«تالاردار یا صاحب گالری می‌گوید: دست شما درد نکنه، ولی من فعلاً این پکیج رو نمی‌خوام!»',
    timeLimitSec: 15,
    options: [
      {
        id: 'opt_1',
        textFa:
          '«فدای سرتان که فعلاً نیاز ندارید! من می‌خواهم پیشنهاد شراکت بدهم: من ۳۵٪ پورسانت می‌گیرم؛ ۲۰٪ من برمی‌دارم و ۱۵٪ شما! اگر کسانی که از طرف شما معرفی می‌شوند خرید کنند، ۱۵٪ حق فروش (۴.۳۵ میلیون تومان) بدون هیچ کاری نصیب شما می‌شود. البته من بعد از این به همکاران شما هم سر می‌زنم؛ اگر آن را بپذیرید از خرید آن‌ها سود می‌کنید، و اگر نپذیرید آن‌ها سود می‌کنند و سودی نصیب شما نمی‌شود!»',
        isMasterMove: true,
        tacticTagFa: 'ادب بازاری + شراکت ۲۰/۱۵ + یادآوری محترمانه سود همکاران',
        explanationFa:
          'عالی! بدون کوچک‌ترین بی‌احترامی یا کلمات منفی، نشان دادید که پذیرش کد معرف چطور سود خرید همکاران منطقه را نصیب ایشان می‌کند.',
      },
      {
        id: 'opt_2',
        textFa: '«اگر قبول نکنید از بقیه جا می‌مانید و ضرر سنگینی می‌کنید!»',
        isMasterMove: false,
        tacticTagFa: 'تله بی‌احترامی با کلمات منفی (جا ماندن / ضرر کردن)',
        explanationFa:
          'استفاده از کلمات «جا می‌مانید» و «ضرر می‌کنید» بی‌احترامی به کاسب است و گارد منفی ایجاد می‌کند؛ همیشه بگویید «آن‌ها سود می‌کنند و سودی نصیب شما نمی‌شود».',
      },
    ],
  },
];

interface OfflineArenaStats {
  currentStreak: number;
  bestStreak: number;
  fastestResponseSec: number | null;
  totalMasterMoves: number;
  unlockedInsignias: string[];
}

const INITIAL_ARENA_STATS: OfflineArenaStats = {
  currentStreak: 2,
  bestStreak: 4,
  fastestResponseSec: 4.8,
  totalMasterMoves: 7,
  unlockedInsignias: ['ZERO_DISCOUNT_GUARD', 'OFFLINE_WARRIOR'],
};

export const ObjectionReflexArena: React.FC = () => {
  const { profile } = useAmbassador();

  const [arenaStats, setArenaStats] = useState<OfflineArenaStats>(() => {
    try {
      const saved = localStorage.getItem('foroshyar_reflex_arena_v4');
      if (saved) return JSON.parse(saved) as OfflineArenaStats;
    } catch {
      // fallback
    }
    return INITIAL_ARENA_STATS;
  });

  const [challengeIndex, setChallengeIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(
    REFLEX_CHALLENGES[0].timeLimitSec
  );
  const [timerActive, setTimerActive] = useState(false);
  const [chosenOptId, setChosenOptId] = useState<string | null>(null);

  const currentChallenge = REFLEX_CHALLENGES[challengeIndex];

  useEffect(() => {
    try {
      localStorage.setItem('foroshyar_reflex_arena_v4', JSON.stringify(arenaStats));
    } catch {
      // ignore
    }
  }, [arenaStats]);

  useEffect(() => {
    if (!timerActive || chosenOptId) return;
    if (secondsLeft <= 0) {
      setTimerActive(false);
      return;
    }
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [timerActive, secondsLeft, chosenOptId]);

  const handleStartReflexTimer = () => {
    setChosenOptId(null);
    setSecondsLeft(currentChallenge.timeLimitSec);
    setTimerActive(true);
  };

  const handlePickOption = (opt: (typeof currentChallenge.options)[number]) => {
    setChosenOptId(opt.id);
    setTimerActive(false);

    const elapsed = Math.max(
      1.2,
      Number((currentChallenge.timeLimitSec - secondsLeft + 0.4).toFixed(1))
    );

    if (opt.isMasterMove) {
      setArenaStats((prev) => {
        const nextStreak = prev.currentStreak + 1;
        const nextBest = Math.max(prev.bestStreak, nextStreak);
        const nextFastest =
          prev.fastestResponseSec === null
            ? elapsed
            : Math.min(prev.fastestResponseSec, elapsed);
        const nextInsignias = new Set(prev.unlockedInsignias);
        if (nextStreak >= 3) nextInsignias.add('STREAK_3_REFLEX');
        if (currentChallenge.productId === 'SLABMATE') {
          nextInsignias.add('CROSS_MODULE_ARCHITECT');
        }
        return {
          currentStreak: nextStreak,
          bestStreak: nextBest,
          fastestResponseSec: nextFastest,
          totalMasterMoves: prev.totalMasterMoves + 1,
          unlockedInsignias: Array.from(nextInsignias),
        };
      });
    } else {
      setArenaStats((prev) => ({
        ...prev,
        currentStreak: 0,
      }));
    }
  };

  const handleNextChallenge = () => {
    const nextIdx = (challengeIndex + 1) % REFLEX_CHALLENGES.length;
    setChallengeIndex(nextIdx);
    setChosenOptId(null);
    setSecondsLeft(REFLEX_CHALLENGES[nextIdx].timeLimitSec);
    setTimerActive(true);
  };

  // Calculate certified count for Leaderboard comparison
  const myCertifiedCount = ALL_PRODUCT_IDS.filter(
    (pid) =>
      authorizeFieldSales({
        ambassador: profile,
        productCertification: profile.productCertifications[pid],
        requestedProductId: pid,
      }).authorized
  ).length;

  const chosenOption = currentChallenge.options.find((o) => o.id === chosenOptId);

  const leaderboardEntries = [
    {
      rank: 1,
      nameFa: 'نگار فرهمند (سفیر ارشد تهران)',
      tier: 'A++',
      certifiedProducts: 6,
      reflexStreak: 14,
      fastestSec: '3.2s',
      synergyTitle: 'معمار هم‌افزایی ۷ صنف',
      isCurrentUser: false,
    },
    {
      rank: 2,
      nameFa: `${profile.displayName} (شما)`,
      tier: profile.tier,
      certifiedProducts: myCertifiedCount,
      reflexStreak: arenaStats.bestStreak,
      fastestSec: `${arenaStats.fastestResponseSec ?? 4.8}s`,
      synergyTitle:
        myCertifiedCount >= 2 ? 'متخصص فروش چندمحصولی (Cross-Module)' : 'سفیر در حال صعود',
      isCurrentUser: true,
    },
    {
      rank: 3,
      nameFa: 'آرش سبحانی (سفیر اصفهان)',
      tier: 'A+',
      certifiedProducts: 3,
      reflexStreak: 6,
      fastestSec: '5.1s',
      synergyTitle: 'متخصص طلایار و سالن‌میت',
      isCurrentUser: false,
    },
    {
      rank: 4,
      nameFa: 'سارا علوی (سفیر مشهد)',
      tier: 'A',
      certifiedProducts: 2,
      reflexStreak: 4,
      fastestSec: '6.4s',
      synergyTitle: 'متخصص دکورمیت و اسلب‌میت',
      isCurrentUser: false,
    },
  ].sort((a, b) => {
    if (b.certifiedProducts !== a.certifiedProducts) {
      return b.certifiedProducts - a.certifiedProducts;
    }
    return b.reflexStreak - a.reflexStreak;
  });

  return (
    <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-xs font-semibold text-sky-700 mb-1">
            موتور انگیزشی و گیمیفیکیشن حرفه‌ای · ۱۰۰٪ آفلاین‌محور و منطبق بر قوانین Domain Core v4.0
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            میدان واکنش سریع به اعتراضات (Reflex Arena) و لیگ استادی اصناف
          </h2>
        </div>

        {/* Strict Domain Core v4.0 Invariant Notice */}
        <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-100 px-3.5 py-2 rounded-xl">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>
            رتبه لیگ بر اساس <strong>تعداد گواهینامه‌های واقعی محصول</strong> + <strong>سرعت دفع اعتراض</strong> محاسبه می‌شود (XP جایگزین گواهینامه نیست).
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT 7 COLS: 15-Second Rapid Objection Reflex Arena */}
        <div className="lg:col-span-7 bg-slate-900 text-white rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-base font-bold">
                  چالش ۱۵ ثانیه‌ای دفع اعتراض اصناف: {currentChallenge.guildNameFa}
                </h3>
                <p className="text-xs text-slate-400">
                  در مذاکره واقعی، مکث بیش از چند ثانیه در برابر اعتراض قیمت، اقتدار سفیر را می‌شکند.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 font-mono-tabular text-xs">
              <span className="text-emerald-400 font-bold">
                زنجیره بدون خطا: {arenaStats.currentStreak}x
              </span>
              <span aria-hidden="true">·</span>
              <span
                className={`flex items-center gap-1 font-bold px-2.5 py-1 rounded-lg ${
                  secondsLeft <= 5
                    ? 'bg-red-500/20 text-red-300'
                    : 'bg-sky-500/20 text-sky-300'
                }`}
              >
                <Timer className="w-3.5 h-3.5" />
                {secondsLeft} ثانیه
              </span>
            </div>
          </div>

          {/* Sudden Client Objection */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
            <span className="text-xs text-amber-300 font-semibold block">
              اعتراض ناگهانی صاحب صنف ({ECOSYSTEM_PRODUCTS[currentChallenge.productId].nameFa}):
            </span>
            <p className="text-base sm:text-lg font-bold leading-relaxed">
              {currentChallenge.suddenObjectionFa}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            {currentChallenge.options.map((opt, idx) => {
              const isPicked = chosenOptId === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => handlePickOption(opt)}
                  className={`w-full text-right p-4 rounded-xl border text-xs sm:text-sm transition-colors ${
                    isPicked
                      ? opt.isMasterMove
                        ? 'bg-emerald-950/90 border-emerald-400 text-white'
                        : 'bg-red-950/90 border-red-400 text-white'
                      : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>پاسخ واکنشی {idx + 1}</span>
                    {isPicked && (
                      <span
                        className={`font-bold ${
                          opt.isMasterMove ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {opt.isMasterMove ? `● ${opt.tacticTagFa}` : `▲ ${opt.tacticTagFa}`}
                      </span>
                    )}
                  </div>
                  <p className="leading-relaxed">{opt.textFa}</p>
                </button>
              );
            })}
          </div>

          {/* Feedback & Next Button */}
          {chosenOption ? (
            <div className="p-4 rounded-xl bg-white/10 border border-white/15 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-start gap-2.5 flex-1">
                {chosenOption.isMasterMove ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold text-white mb-0.5">
                    {chosenOption.isMasterMove
                      ? 'ضربه استادانه! زنجیره واکنش سریع شما تقویت شد.'
                      : 'افت در تله مذاکره! زنجیره واکنش صفر شد.'}
                  </p>
                  <p className="text-slate-300">{chosenOption.explanationFa}</p>
                </div>
              </div>

              <button
                onClick={handleNextChallenge}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg transition-colors whitespace-nowrap"
              >
                چالش بعدی اصناف ←
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>برای ثبت رکورد سرعت واکنش، بهترین پاسخ مشاوره‌ای را انتخاب کنید.</span>
              <button
                onClick={handleStartReflexTimer}
                className="flex items-center gap-1 text-sky-300 hover:text-white whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>شروع مجدد تایمر ۱۵ ثانیه</span>
              </button>
            </div>
          )}
        </div>

        {/* RIGHT 5 COLS: Offline-First Guild Leaderboard & Tactical Mastery Insignias */}
        <div className="lg:col-span-5 space-y-6">
          {/* Leaderboard Table */}
          <div className="border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  جدول برترین سفیران اکوسیستم آفرینش (آفلاین‌محور)
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-mono-tabular">
                معیار اول: گواهینامه CERTIFIED
              </span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {leaderboardEntries.map((row, idx) => (
                <div
                  key={row.nameFa}
                  className={`py-3 px-2.5 flex items-center justify-between gap-2 rounded-lg ${
                    row.isCurrentUser ? 'bg-sky-50/90 font-bold' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono-tabular font-bold text-slate-500 w-4">
                      {idx + 1}.
                    </span>
                    <div className="truncate">
                      <p className="text-slate-900 truncate">{row.nameFa}</p>
                      <p className="text-[11px] text-slate-500 font-normal">
                        {row.synergyTitle} · سطح {row.tier}
                      </p>
                    </div>
                  </div>

                  <div className="text-left font-mono-tabular shrink-0">
                    <span className="text-emerald-700 font-bold block">
                      {row.certifiedProducts}/7 محصول مجاز
                    </span>
                    <span className="text-[11px] text-slate-500">
                      زنجیره: {row.reflexStreak}x · سرعت: {row.fastestSec}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tactical Mastery Insignias */}
          <div className="border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-sky-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  نشان‌های مهارت تاکتیکی شما (Tactical Mastery Insignias)
                </h3>
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {[
                {
                  id: 'ZERO_DISCOUNT_GUARD',
                  titleFa: 'سپر ضد تخفیف زودهنگام',
                  descFa: 'دفع اعتراض قیمت با فرمول بازگشت سرمایه ۴۵ روزه',
                },
                {
                  id: 'OFFLINE_WARRIOR',
                  titleFa: 'آمادگی ۱۰۰٪ در میدان آفلاین',
                  descFa: 'تمرین مستمر سناریوها پیش از ورود به شوروم مشتری',
                },
                {
                  id: 'STREAK_3_REFLEX',
                  titleFa: 'واکنش صاعقه‌ای (زنجیره ۳+)',
                  descFa: 'پاسخ صحیح به ۳ اعتراض پیاپی اصناف در زیر ۱۵ ثانیه',
                },
                {
                  id: 'CROSS_MODULE_ARCHITECT',
                  titleFa: 'معمار فروش هم‌افزا (۳۵٪ کمیسیون)',
                  descFa: 'تسلط بر پیوند SlabMate + DecorMate در یک معامله',
                },
              ].map((badge) => {
                const unlocked = arenaStats.unlockedInsignias.includes(badge.id);
                return (
                  <div
                    key={badge.id}
                    className={`p-3 rounded-xl border ${
                      unlocked
                        ? 'bg-emerald-50/50 border-emerald-200 text-slate-900'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold">{badge.titleFa}</span>
                      <span className="font-mono-tabular text-[11px]">
                        {unlocked ? '● فعال' : '○ قفل'}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed">{badge.descFa}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
