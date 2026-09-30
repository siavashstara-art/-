/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AmbassadorProvider, useAmbassador } from './context/AmbassadorContext';
import {
  AccessibilityProvider,
  useAccessibility,
} from './context/AccessibilityAndLocaleContext';
import { AccessibilityToolbar } from './components/AccessibilityToolbar';
import { SimulatedSalesWorld } from './components/SimulatedSalesWorld';
import { AcademyAndGeneralExam } from './components/AcademyAndGeneralExam';
import { ProductCertificationTracks } from './components/ProductCertificationTracks';
import { AuthorizationAndCommissionLab } from './components/AuthorizationAndCommissionLab';
import { CoachDrawer } from './components/CoachDrawer';
import { ObjectionReflexArena } from './components/ObjectionReflexArena';
import { TavanaMetaverseReferralLeague } from './components/TavanaMetaverseReferralLeague';
import {
  ECOSYSTEM_PRODUCTS,
  HERO_IMAGE_PATH,
  COACH_AVATAR_PATH,
} from './data/ecosystemData';
import {
  ALL_PRODUCT_IDS,
  ProductId,
  authorizeFieldSales,
  DEFAULT_SENFYAR_BRIDGE_URL,
  resolveGuildProductIdFromQuery,
} from './domain/core';
import {
  Play,
  Compass,
  Award,
  Layers,
  ShieldCheck,
  MessageSquareHeart,
  LogIn,
  LogOut,
  Wifi,
  CheckCircle2,
  ArrowLeft,
  Mic,
  Volume2,
  Settings,
  ExternalLink,
} from 'lucide-react';

type ActiveScreen =
  | 'HOME'
  | 'ACADEMY'
  | 'SIMULATION'
  | 'PRODUCTS'
  | 'AUTHORIZATION';

const MainShell: React.FC = () => {
  const {
    firebaseUser,
    isSigningIn,
    authError,
    verifiedServerSession,
    profile,
    signInWithGoogle,
    signOutUser,
  } = useAmbassador();
  const { t, adhdFocusMode } = useAccessibility();

  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('HOME');

  // Motor Accessibility: Keyboard shortcuts 1 to 5 to switch tabs without mouse
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === '1') setActiveScreen('HOME');
      else if (e.key === '2') setActiveScreen('SIMULATION');
      else if (e.key === '3') setActiveScreen('ACADEMY');
      else if (e.key === '4') setActiveScreen('PRODUCTS');
      else if (e.key === '5') setActiveScreen('AUTHORIZATION');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
  const [coachOpen, setCoachOpen] = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | undefined>(
    undefined
  );
  const [focusedAuthProductId, setFocusedAuthProductId] = useState<
    ProductId | undefined
  >(undefined);
  const [heroImgError, setHeroImgError] = useState(false);
  const [coachAvatarError, setCoachAvatarError] = useState(false);

  // Pre-Visit Deal Twin (همزاد دیجیتال مشتری قبل از ورود به شوروم) — Offline-First Quick Warmup
  const [dealTwinProduct, setDealTwinProduct] = useState<ProductId>('DECORMATE');
  const [dealTwinMood, setDealTwinMood] = useState<
    'SKEPTICAL_PRICE' | 'BUSY_RUSHED' | 'TRADITIONAL_HABIT'
  >('SKEPTICAL_PRICE');

  // Bidirectional App Switcher (پل ارتباطی دوطرفه فروشیار <-> ابرسامانه صنفیار VIP)
  const [senfyarBaseUrl, setSenfyarBaseUrl] = useState<string>(() => {
    try {
      return (
        localStorage.getItem('foroshyar_senfyar_bridge_url') ||
        DEFAULT_SENFYAR_BRIDGE_URL
      );
    } catch {
      return DEFAULT_SENFYAR_BRIDGE_URL;
    }
  });
  const [showBridgeSettings, setShowBridgeSettings] = useState<boolean>(false);
  const [bridgeUrlDraft, setBridgeUrlDraft] = useState<string>(senfyarBaseUrl);
  const [incomingReturnUrl, setIncomingReturnUrl] = useState<string | null>(null);
  const [ambassadorRefCode, setAmbassadorRefCode] = useState<string>('TVN-AMB-101');

  const activeBridgeGuild: ProductId = focusedAuthProductId || dealTwinProduct || 'DECORMATE';

  // Read incoming URL parameters (?guild=...&ref=...&returnUrl=...) on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const rawGuild = params.get('guild');
    const rawRef = params.get('ref');
    const rawReturnUrl = params.get('returnUrl');

    if (rawRef && rawRef.trim()) {
      setAmbassadorRefCode(rawRef.trim());
    }
    if (rawReturnUrl && rawReturnUrl.trim()) {
      setIncomingReturnUrl(rawReturnUrl.trim());
    }
    const resolvedPid = resolveGuildProductIdFromQuery(rawGuild);
    if (resolvedPid) {
      setFocusedAuthProductId(resolvedPid);
      setDealTwinProduct(resolvedPid);
      setActiveScreen('PRODUCTS');
    }
  }, []);

  const handleSaveSenfyarUrl = () => {
    const cleaned = (bridgeUrlDraft.trim() || DEFAULT_SENFYAR_BRIDGE_URL).replace(/\/+$/, '');
    setSenfyarBaseUrl(cleaned);
    setBridgeUrlDraft(cleaned);
    try {
      localStorage.setItem('foroshyar_senfyar_bridge_url', cleaned);
    } catch {
      // ignore
    }
    setShowBridgeSettings(false);
  };

  const buildSenfyarOperationalUrl = (pid: ProductId): string => {
    const cleanBase = senfyarBaseUrl.replace(/\/+$/, '');
    const currentOrigin =
      typeof window !== 'undefined' ? window.location.origin : '';
    const refParam = encodeURIComponent(
      profile.uid && profile.uid !== 'sandbox_visitor' ? profile.uid : ambassadorRefCode
    );
    const retParam = encodeURIComponent(
      `${currentOrigin}/?guild=${pid}&ref=${ambassadorRefCode}`
    );
    return `${cleanBase}/?guild=${pid}&mode=visitor&ref=${refParam}&returnUrl=${retParam}`;
  };

  const certifiedProductsCount = ALL_PRODUCT_IDS.filter(
    (pid) => profile.productCertifications[pid].status === 'CERTIFIED'
  ).length;

  const dealTwinScript = {
    SKEPTICAL_PRICE: {
      objectionFa: `«قیمت ${ECOSYSTEM_PRODUCTS[dealTwinProduct].nameFa} نسبت به بودجه فعلی فروشگاه ما بالاست.»`,
      openingHookFa: `«کاملاً درک می‌کنم؛ اگر ${ECOSYSTEM_PRODUCTS[dealTwinProduct].nameFa} فقط از دست رفتن ۲ مشتری مردد در ماه را جبران کند، کل هزینه یک‌ساله آن در کمتر از ۴۵ روز برمی‌گردد. اجازه بدهید روی میانگین فاکتور خودتان حساب کنیم.»`,
    },
    BUSY_RUSHED: {
      objectionFa: '«الان سرم شلوغ است و مشتری داخل شوروم دارم، خلاصه بگو چکار می‌کنید؟»',
      openingHookFa: `«به زمان شما کاملاً احترام می‌گذارم؛ فقط در ۲۰ ثانیه روی همین تبلت ببینید چطور ${ECOSYSTEM_PRODUCTS[dealTwinProduct].nameFa} تردید همان مشتری داخل شوروم را به خرید قطعی تبدیل می‌کند.»`,
    },
    TRADITIONAL_HABIT: {
      objectionFa: '«ما سال‌هاست با روش سنتی و دفتر دستک خودمان کار می‌کنیم و مشکلی نداریم.»',
      openingHookFa: `«تجربه سنتی شما ستون اصلی اعتبارتان است؛ ${ECOSYSTEM_PRODUCTS[dealTwinProduct].nameFa} جایگزین تجربه شما نمی‌شود، بلکه سرعت پاسخگویی به مشتریان نسل جدید اینستاگرام و نمایشگاه را ۵ برابر می‌کند.»`,
    },
  }[dealTwinMood];

  const handleLaunchProductSimulation = (productId: ProductId) => {
    if (productId === 'DECORMATE') {
      setSelectedScenarioId('scen_decormate_pro');
    } else if (productId === 'SALONMATE') {
      setSelectedScenarioId('scen_salonmate_pro');
    } else if (productId === 'FURNIMATE') {
      setSelectedScenarioId('scen_furnimate_pro');
    } else if (productId === 'POOSHAKYAR') {
      setSelectedScenarioId('scen_pooshakyar_pro');
    } else if (productId === 'NERKHYAR') {
      setSelectedScenarioId('scen_nerkhyar_pro');
    } else if (productId === 'TEBYAR') {
      setSelectedScenarioId('scen_tebyar_pro');
    } else if (productId === 'AHANYAR') {
      setSelectedScenarioId('scen_ahanyar_pro');
    } else if (productId === 'STUDIOYAR') {
      setSelectedScenarioId('scen_studioyar_pro');
    } else {
      setSelectedScenarioId('scen_general_core');
    }
    setActiveScreen('SIMULATION');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      {/* TOP OFFICIAL ECOSYSTEM BANNER + BIDIRECTIONAL APP SWITCHER (پل ارتباطی دوطرفه فروشیار <-> صنفیار VIP) */}
      <div className="bg-gradient-to-l from-slate-950 via-indigo-950 to-slate-950 text-white border-b border-amber-500/40 px-4 sm:px-8 py-2.5">
        <div className="max-w-[1360px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-2 font-extrabold text-amber-300">
            <span>✦ اکوسیستم آفرینش · شهر نیو متاورسی جهان توانا سیتی (Tavana City New Metaverse World)</span>
            <span className="text-sky-300 font-normal hidden sm:inline">|</span>
            <span className="text-[11px] text-sky-200 font-semibold">
              ۱۱ برنامه صنفیار VIP + پوشاک‌یار و نرخ‌یار
            </span>
          </div>

          {/* BIDIRECTIONAL APP SWITCHER CONTROLS */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="انتخاب شغل برای پرش به صنفیار"
              value={activeBridgeGuild}
              onChange={(e) => {
                const pid = e.target.value as ProductId;
                setFocusedAuthProductId(pid);
                setDealTwinProduct(pid);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-amber-400/50 text-amber-200 text-xs font-bold focus:outline-none"
            >
              {ALL_PRODUCT_IDS.map((pid) => (
                <option key={pid} value={pid}>
                  {ECOSYSTEM_PRODUCTS[pid].nameFa} (?guild={pid})
                </option>
              ))}
            </select>

            <a
              href={buildSenfyarOperationalUrl(activeBridgeGuild)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-l from-amber-400 via-amber-500 to-purple-600 hover:from-amber-300 hover:to-purple-500 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap"
            >
              <span>🚀 ورود ۱-کلیکی به محیط عملیاتی این شغل در ابرسامانه صنفیار (پل دوطرفه)</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-950 shrink-0" />
            </a>

            {incomingReturnUrl && (
              <a
                href={incomingReturnUrl}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 whitespace-nowrap"
              >
                <span>↩ بازگشت ۱-کلیکی به صنفیار</span>
              </a>
            )}

            <button
              type="button"
              onClick={() => setShowBridgeSettings((prev) => !prev)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <Settings className="w-3.5 h-3.5 text-amber-400" />
              <span>⚙️ تنظیم لینک صنفیار</span>
            </button>
          </div>
        </div>

        {/* Collapsible SenfYar Bridge Domain Editor */}
        {showBridgeSettings && (
          <div className="max-w-[1360px] mx-auto mt-2.5 pt-2.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[260px]">
              <span className="text-amber-300 font-bold whitespace-nowrap">
                آدرس ابرسامانه عملیاتی صنفیار VIP:
              </span>
              <input
                type="url"
                dir="ltr"
                value={bridgeUrlDraft}
                onChange={(e) => setBridgeUrlDraft(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono-tabular text-xs"
                placeholder={DEFAULT_SENFYAR_BRIDGE_URL}
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveSenfyarUrl}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
              >
                ذخیره در مرورگر (localStorage)
              </button>
              <button
                type="button"
                onClick={() => {
                  setBridgeUrlDraft(DEFAULT_SENFYAR_BRIDGE_URL);
                  setSenfyarBaseUrl(DEFAULT_SENFYAR_BRIDGE_URL);
                  try {
                    localStorage.setItem(
                      'foroshyar_senfyar_bridge_url',
                      DEFAULT_SENFYAR_BRIDGE_URL
                    );
                  } catch {
                    // ignore
                  }
                  setShowBridgeSettings(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                بازنشانی به پیش‌فرض
              </button>
            </div>
          </div>
        )}
      </div>

      {/* UNIVERSAL ACCESSIBILITY (MOTOR, VISUAL, HEARING, ADHD) & 10 MOTHER-TONGUES BAR */}
      <AccessibilityToolbar currentScreenSummaryFa={`اکوسیستم آفرینش شهر نیو متاورسی جهان توانا سیتی — ${t.brandTitle} — ${t.heroGreeting} ${t.heroSubtitle}`} />

      {/* STRICT 3-ZONE TOP BAR CONTRACT */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Zone 1: Single Text Element Brand Wordmark */}
        <button
          onClick={() => setActiveScreen('HOME')}
          className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 whitespace-nowrap"
        >
          {t.brandTitle}
        </button>

        {/* Zone 2: 5 Clean Text Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs sm:text-sm font-medium text-slate-600">
          <button
            onClick={() => setActiveScreen('HOME')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap py-1 ${
              activeScreen === 'HOME'
                ? 'text-slate-900 font-bold border-b-2 border-sky-700'
                : ''
            }`}
          >
            {t.navHome}
          </button>
          <button
            onClick={() => setActiveScreen('SIMULATION')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap py-1 ${
              activeScreen === 'SIMULATION'
                ? 'text-slate-900 font-bold border-b-2 border-sky-700'
                : ''
            }`}
          >
            {t.navSimulation}
          </button>
          <button
            onClick={() => setActiveScreen('ACADEMY')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap py-1 ${
              activeScreen === 'ACADEMY'
                ? 'text-slate-900 font-bold border-b-2 border-sky-700'
                : ''
            }`}
          >
            {t.navAcademy}
          </button>
          <button
            onClick={() => setActiveScreen('PRODUCTS')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap py-1 ${
              activeScreen === 'PRODUCTS'
                ? 'text-slate-900 font-bold border-b-2 border-sky-700'
                : ''
            }`}
          >
            {t.navProducts}
          </button>
          <button
            onClick={() => setActiveScreen('AUTHORIZATION')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap py-1 ${
              activeScreen === 'AUTHORIZATION'
                ? 'text-slate-900 font-bold border-b-2 border-sky-700'
                : ''
            }`}
          >
            {t.navAuthorization}
          </button>
        </nav>

        {/* Zone 3: 2 Primary Actions (Coach + Real Verified Auth) */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCoachOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-sky-900 bg-sky-50 hover:bg-sky-100 rounded-xl transition-colors whitespace-nowrap"
          >
            <MessageSquareHeart className="w-4 h-4 text-sky-700" />
            <span>{t.coachButton}</span>
          </button>

          {firebaseUser ? (
            <button
              onClick={signOutUser}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors whitespace-nowrap"
              title={firebaseUser.email || ''}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="max-w-[110px] truncate">
                {firebaseUser.displayName || firebaseUser.email}
              </span>
            </button>
          ) : (
            <button
              disabled={isSigningIn}
              onClick={signInWithGoogle}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{isSigningIn ? 'در حال ورود...' : 'ورود رسمی سفیر'}</span>
            </button>
          )}
        </div>
      </header>

      {/* Mobile Secondary Navigation Bar */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-2 overflow-x-auto">
        {[
          { id: 'HOME' as const, label: 'خانه' },
          { id: 'SIMULATION' as const, label: 'سناریوهای واقعی' },
          { id: 'ACADEMY' as const, label: 'آکادمی و آزمون' },
          { id: 'PRODUCTS' as const, label: 'مسیرهای محصول' },
          { id: 'AUTHORIZATION' as const, label: 'مجوز فروش و کمیسیون' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveScreen(item.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              activeScreen === item.id
                ? 'bg-sky-700 text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Main Content Container (1440px Desktop Presence) */}
      <main className="flex-1 w-full max-w-[1360px] mx-auto px-4 sm:px-8 py-8">
        {authError && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 flex items-center justify-between">
            <span>{authError}</span>
          </div>
        )}

        {activeScreen === 'HOME' && (
          <div className="space-y-12">
            {/* HERO SECTION: Warm, Human, Energetic, Welcoming Greeting + Ecosystem Brand Identity */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white border border-slate-200 rounded-3xl p-6 sm:p-10">
              <div className="lg:col-span-7 space-y-6">
                {/* Unboxed Brand Header Metadata per Brief Section 0 & Anti-Slop Zero-Pill Rule */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold text-sky-800">
                  <span>اکوسیستم آفرینش</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-700">شهر نیو متاورسی جهان توانا سیتی</span>
                  <span aria-hidden="true">·</span>
                  <span>شهر نوآوران AbleCity</span>
                  <span aria-hidden="true">·</span>
                  <span>توانا و بندستوانا</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-700 flex items-center gap-1">
                    <Wifi className="w-3.5 h-3.5" />
                    آموزش و تمرین آفلاین‌محور + آزمون رسمی آنلاین
                  </span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight headline-balance">
                  {t.heroGreeting}
                </h1>

                <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                  {t.heroSubtitle}
                </p>

                {/* Primary Focal CTA + Secondary Action */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    onClick={() => setActiveScreen('SIMULATION')}
                    className="flex items-center gap-2 px-6 py-3.5 bg-sky-700 hover:bg-sky-800 text-white text-sm font-bold rounded-xl transition-colors whitespace-nowrap shadow-xs"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>{t.ctaEnterSimulation}</span>
                  </button>

                  <button
                    onClick={() => setActiveScreen('PRODUCTS')}
                    className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-900 text-sm font-semibold rounded-xl transition-colors whitespace-nowrap"
                  >
                    {t.ctaProductTracks} ({certifiedProductsCount}/۱۰ فعال)
                  </button>
                </div>

                {/* Unboxed Status Summary Line */}
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-500 font-mono-tabular">
                  <span>
                    سطح عمومی من: <strong className="text-slate-900">{profile.tier}</strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    نمره آزمون جامع: <strong className="text-slate-900">{profile.generalExamScore}٪</strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    محصولات مجاز به فروش میدانی:{' '}
                    <strong className="text-emerald-700">{certifiedProductsCount} محصول</strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    هویت Tenant:{' '}
                    <strong className="text-slate-800">
                      {verifiedServerSession?.identity?.tenantId || profile.tenantId}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Right Visual Anchor */}
              <div className="lg:col-span-5">
                <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-video lg:aspect-4/3 border border-slate-200">
                  {!heroImgError ? (
                    <img
                      src={HERO_IMAGE_PATH}
                      alt="مرکز نوآوری و آکادمی فروشیار AbleCity"
                      referrerPolicy="no-referrer"
                      onError={() => setHeroImgError(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-900 to-sky-950 flex items-center justify-center p-6 text-white font-bold">
                      شهر نوآوران AbleCity — آکادمی فروشیار
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-4 right-4 left-4 text-white space-y-1">
                    <p className="text-xs text-sky-300 font-medium">
                      چرخه یادگیری عملی در فروشیار
                    </p>
                    <p className="text-sm font-bold leading-snug">
                      مشاهده ← شنیدن ← انتخاب و گفتار ← بازخورد مربی ← دریافت گواهینامه مستقل محصول
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* THE 6 CORE ACTIONS (Brief Section 9: ادامه آموزش / ماموریت امروز / آکادمی / سناریوهای واقعی / سطح من / مسیرهای محصول) */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">
                  میز کار سفیر فروش — ۶ گام اصلی امروز شما
                </h2>
                <span className="text-xs text-slate-500">
                  هر بخش بر یک هدف مشخص تمرکز دارد (جلوگیری از شلوغی ذهنی)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[
                  {
                    id: 'continue',
                    kicker: '۰۱. ادامه آموزش · آفلاین‌محور',
                    title: 'ادامه آموزش (تالاریار — ۶۰٪)',
                    desc: 'در حال گذراندن ماژول «منوساز عروسی، تسهیم هزینه دو خانواده و قفل ضدتورم» هستید. بدون نیاز به اینترنت ادامه دهید.',
                    cta: 'ادامه ماژول آموزشی',
                    icon: Layers,
                    onClick: () => setActiveScreen('PRODUCTS'),
                  },
                  {
                    id: 'mission',
                    kicker: '۰۲. ماموریت امروز · تمرین تعاملی',
                    title: 'ماموریت امروز: عبور از گارد اولیه مدیر شوروم',
                    desc: 'در کمتر از ۳ دقیقه با مهندس کاظمی مذاکره کنید، دغدغه خروج مشتریان مردد را کشف کنید و اعتماد را به بالای ۷۵٪ برسانید.',
                    cta: 'شروع ماموریت امروز',
                    icon: Compass,
                    onClick: () => {
                      setSelectedScenarioId('scen_general_core');
                      setActiveScreen('SIMULATION');
                    },
                  },
                  {
                    id: 'academy',
                    kicker: '۰۳. آکادمی · آزمون آنلاین رسمی',
                    title: 'آکادمی و گواهینامه عمومی (General Exam)',
                    desc: `نمره فعلی شما ${profile.generalExamScore} از ۱۰۰ (سطح ${profile.tier}) است. برای ارتقا به سطح A++ نمره ۹۵+ و قبولی شبیه‌سازی جامع را ثبت کنید.`,
                    cta: 'ورود به آکادمی و آزمون',
                    icon: Award,
                    onClick: () => setActiveScreen('ACADEMY'),
                  },
                  {
                    id: 'scenarios',
                    kicker: '۰۴. سناریوهای واقعی · Choose & Speak',
                    title: 'سناریوهای واقعی مذاکره (صوتی و موقعیتی)',
                    desc: 'تمرین مذاکره با مدیر گالری سنگ، کلینیک ساختمانی و سالن زیبایی با امکان ضبط صدا و دریافت بازخورد فوری از مربی.',
                    cta: 'انتخاب سناریوی واقعی',
                    icon: Mic,
                    onClick: () => setActiveScreen('SIMULATION'),
                  },
                  {
                    id: 'my_tier',
                    kicker: '۰۵. سطح من · مرز امنیتی فروش',
                    title: `سطح من (${profile.tier}) و مجوز فروش میدانی`,
                    desc: 'بررسی وضعیت authorizeFieldSales، مشاهده جدول کمیسیون‌های ۲۵٪ تا ۳۵٪ و ممیزی امنیتی Domain Core v4.0.',
                    cta: 'بررسی سطح و کمیسیون من',
                    icon: ShieldCheck,
                    onClick: () => setActiveScreen('AUTHORIZATION'),
                  },
                  {
                    id: 'product_paths',
                    kicker: '۰۶. مسیرهای محصول · ۱۰ سامانه مستقل',
                    title: 'مسیرهای تخصصی ۱۰ سامانه اکوسیستم',
                    desc: 'مدیریت همزمان گواهینامه‌های کابینت‌یار، سرامیک‌یار، زیباجو، اتویار، تن‌آرا، طلایار، تالاریار، جهیزیه‌جو، پوشاک‌یار و نرخ‌یار.',
                    cta: 'مدیریت گواهینامه‌های محصول',
                    icon: CheckCircle2,
                    onClick: () => setActiveScreen('PRODUCTS'),
                  },
                ].map((card) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={card.id}
                      className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between gap-4 hover:border-slate-300 transition-colors"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-sky-700 font-semibold">
                          <span>{card.kicker}</span>
                          <Icon className="w-4 h-4 text-sky-700" />
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900">
                          {card.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                          {card.desc}
                        </p>
                      </div>

                      <button
                        onClick={card.onClick}
                        className="w-full py-2.5 px-4 bg-slate-50 hover:bg-sky-50 text-slate-900 hover:text-sky-900 border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-between transition-colors whitespace-nowrap"
                      >
                        <span>{card.cta}</span>
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* SPECIAL CREATIVE FEATURE: PRE-VISIT DEAL TWIN (همزاد دیجیتال مشتری — گرم‌کردن ۶۰ ثانیه‌ای آفلاین پشت در شوروم) */}
            <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div className="flex items-center gap-3">
                  {!coachAvatarError ? (
                    <img
                      src={COACH_AVATAR_PATH}
                      alt="مربی فروشیار"
                      referrerPolicy="no-referrer"
                      onError={() => setCoachAvatarError(true)}
                      className="w-12 h-12 rounded-full object-cover border border-slate-300"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-sky-700 text-white flex items-center justify-center font-bold text-xs">
                      مربی
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-sky-700">
                      ابتکار ویژه فروشیار · ۱۰۰٪ آفلاین و بدون نیاز به اینترنت در محل قرار
                    </p>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                      «همزاد دیجیتال مشتری» — آماده‌سازی ۶۰ ثانیه‌ای دقیقاً پیش از ورود به شوروم واقعی
                    </h2>
                  </div>
                </div>

                <button
                  onClick={() => setCoachOpen(true)}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
                >
                  گفتگوی اختصاصی با مربی فروشیار
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-5 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      ۱. الان پشت در کدام صنف / محصول ایستاده‌اید؟
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {ALL_PRODUCT_IDS.map((pid) => (
                        <button
                          key={pid}
                          onClick={() => setDealTwinProduct(pid)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                            dealTwinProduct === pid
                              ? 'bg-sky-700 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {ECOSYSTEM_PRODUCTS[pid].nameFa}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      ۲. پیش‌بینی شما از روحیه فعلی مدیر فروشگاه چیست؟
                    </label>
                    <div className="space-y-1.5">
                      {[
                        {
                          id: 'SKEPTICAL_PRICE' as const,
                          label: 'حساس به قیمت و بازگشت سرمایه (چند ماهه برمی‌گردد؟)',
                        },
                        {
                          id: 'BUSY_RUSHED' as const,
                          label: 'بسیار پرمشغله و کم‌حوصله (فقط ۱ دقیقه وقت دارد)',
                        },
                        {
                          id: 'TRADITIONAL_HABIT' as const,
                          label: 'وابسته به روش سنتی (دفتر دستک و روش قدیمی)',
                        },
                      ].map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setDealTwinMood(m.id)}
                          className={`w-full text-right px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                            dealTwinMood === m.id
                              ? 'bg-sky-50 border-sky-700 text-sky-950'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-7 bg-slate-900 text-white rounded-2xl p-6 space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs text-amber-300 font-semibold block">
                      احتمالی‌ترین جمله‌ای که در دقیقه اول خواهید شنید:
                    </span>
                    <p className="text-sm sm:text-base font-medium text-slate-100">
                      {dealTwinScript.objectionFa}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-emerald-400 font-bold">
                        پاسخ طلایی و بازکننده قفل جلسه برای {ECOSYSTEM_PRODUCTS[dealTwinProduct].nameFa}:
                      </span>
                      <button
                        onClick={() => {
                          if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                            window.speechSynthesis.cancel();
                            const u = new SpeechSynthesisUtterance(
                              dealTwinScript.openingHookFa
                            );
                            u.lang = 'fa-IR';
                            window.speechSynthesis.speak(u);
                          }
                        }}
                        className="flex items-center gap-1 text-xs text-sky-300 hover:text-white whitespace-nowrap"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>شنیدن لحن بیان</span>
                      </button>
                    </div>
                    <p className="text-sm sm:text-base font-bold text-white leading-relaxed">
                      {dealTwinScript.openingHookFa}
                    </p>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                    <span>
                      وضعیت مجوز فروش شما برای {ECOSYSTEM_PRODUCTS[dealTwinProduct].nameFa}:{' '}
                      <strong
                        className={
                          authorizeFieldSales({
                            ambassador: profile,
                            productCertification:
                              profile.productCertifications[dealTwinProduct],
                            requestedProductId: dealTwinProduct,
                          }).authorized
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                        }
                      >
                        {authorizeFieldSales({
                          ambassador: profile,
                          productCertification:
                            profile.productCertifications[dealTwinProduct],
                          requestedProductId: dealTwinProduct,
                        }).authorized
                          ? '● مجاز به ثبت قرارداد رسمی'
                          : '▲ نیازمند تکمیل گواهینامه محصول'}
                      </strong>
                    </span>
                    <button
                      onClick={() => handleLaunchProductSimulation(dealTwinProduct)}
                      className="text-sky-300 hover:underline font-semibold whitespace-nowrap"
                    >
                      تمرین کامل این سناریو ←
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* TAVANA CITY METAVERSE REFERRAL LEAGUE, MOBILE/EMAIL REGISTRATION, A++ 20-PERSON FAMILY CLAN, 30% XP GIFTING & GROUP CHAT */}
            <TavanaMetaverseReferralLeague />

            {/* GAMIFIED RAPID OBJECTION REFLEX ARENA & OFFLINE-FIRST GUILD LEADERBOARD */}
            <ObjectionReflexArena />
          </div>
        )}

        {activeScreen === 'SIMULATION' && (
          <SimulatedSalesWorld
            initialScenarioId={selectedScenarioId}
            onCompleteNavigate={(dest) => {
              if (dest === 'academy') setActiveScreen('ACADEMY');
              else if (dest === 'products') setActiveScreen('PRODUCTS');
              else setActiveScreen('AUTHORIZATION');
            }}
          />
        )}

        {activeScreen === 'ACADEMY' && (
          <AcademyAndGeneralExam
            onNavigateToSimulation={() => {
              setSelectedScenarioId('scen_general_core');
              setActiveScreen('SIMULATION');
            }}
            onNavigateToProducts={() => setActiveScreen('PRODUCTS')}
          />
        )}

        {activeScreen === 'PRODUCTS' && (
          <ProductCertificationTracks
            onLaunchProductSimulation={handleLaunchProductSimulation}
            onInspectAuthorization={(pid) => {
              setFocusedAuthProductId(pid);
              setActiveScreen('AUTHORIZATION');
            }}
          />
        )}

        {activeScreen === 'AUTHORIZATION' && (
          <AuthorizationAndCommissionLab initialProductId={focusedAuthProductId} />
        )}

        {/* ====================================================================
            FOUNDER & DEVELOPER VISION + INVITATION TO JOIN TAVANA CITY ECOSYSTEM
        ==================================================================== */}
        <section className="mt-14 bg-gradient-to-br from-slate-950 via-sky-950 to-slate-900 text-white rounded-3xl p-6 sm:p-10 border border-amber-500/40 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="space-y-1.5">
              <p className="text-xs font-extrabold text-amber-400">
                ✦ درباره توسعه‌دهنده و فلسفه بنیانگذار · دعوت به پیوستن به کاروان بزرگ توانا سیتی
              </p>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                اکوسیستم آفرینش · شهر نیو متاورسی جهان توانا سیتی (Tavana City New Metaverse World)
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveScreen('ACADEMY')}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition-colors whitespace-nowrap"
              >
                مطالعه فلسفه توانا سیتی در آکادمی
              </button>
              <button
                onClick={() => setActiveScreen('PRODUCTS')}
                className="px-4 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-600 text-white text-xs font-bold transition-colors whitespace-nowrap"
              >
                ورود به پلی‌بوک ۱۰ سامانه صنفی
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 text-xs sm:text-sm">
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <h3 className="font-extrabold text-amber-300 text-sm">
                ۱. داستان تولد ایده: از «سامانه جامع پوشاک ایران» تا ۱۰ صنف توانا سیتی
              </h3>
              <p className="text-slate-300 leading-relaxed text-xs">
                نطفه اولیه و الهام‌بخش کل این اکوسیستم از دل <strong className="text-white">«سامانه جامع پوشاک ایران (پوشاک‌یار)»</strong> شکل گرفت؛ جایی که توسعه‌دهنده و معمار اکوسیستم با درک عمیق دردهای واقعی بازار سنتی و مدرن ایران، تصمیم گرفت پلتفرمی بسازد که هیچ مشتری و هیچ بازاریابی دست خالی از مغازه بیرون نرود و امروز این الگو ۱۰ صنف استراتژیک کشور (از جمله نرخ‌یار برای همگام‌سازی لحظه‌ای درهم و لیر) را یکپارچه کرده است.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <h3 className="font-extrabold text-sky-300 text-sm">
                ۲. فلسفه «شهر نیو متاورسی جهان توانا سیتی» و عدالت دیجیتال
              </h3>
              <p className="text-slate-300 leading-relaxed text-xs">
                در فلسفه <strong className="text-white">اکوسیستم آفرینش و شهر نوآوران توانا (AbleCity / بندستوانا)</strong>، تکنولوژی و متاورس کاربردی باید در خدمت کرامت انسان، دسترس‌پذیری کامل (برای افراد دارای معلولیت حرکتی، بینایی، شنوایی و تمرکز) و احترام به ۱۱ زبان و گویش مادری اقوام شریف ایران و جهان (شامل زبان ارمنی 🇦🇲 Հայերեն) باشد.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 space-y-2">
              <h3 className="font-extrabold text-emerald-300 text-sm">
                ۳. دعوت از علاقه‌مندان برای پیوستن به اکوسیستم آفرینش
              </h3>
              <p className="text-emerald-100 leading-relaxed text-xs">
                از تمامی بازاریابان، سفیران فروش، مدیران اصناف، برنامه‌نویسان و سرمایه‌گذاران علاقه‌مند دعوت می‌شود به خانواده بزرگ <strong className="text-white">اکوسیستم آفرینش — شهر نیو متاورسی جهان توانا سیتی</strong> بپیوندند؛ جایی که با پورسانت‌های ۲۵٪ تا ۳۵٪ و سیستم شراکت محترمانه معرفین (۲۰٪ سفیر + ۱۵٪ معرف با کد <span className="font-mono-tabular">TVN-PARTNER</span>)، همه برنده واقعی میدان هستند.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Clean Editorial Footer */}
      <footer className="bg-white border-t border-slate-200 px-4 sm:px-8 py-6 mt-12">
        <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-800">
              اکوسیستم آفرینش · شهر نیو متاورسی جهان توانا سیتی — آموزش بازاریابی (فروشیار)
            </span>
            <span aria-hidden="true">·</span>
            <span>شهر نوآوران AbleCity</span>
            <span aria-hidden="true">·</span>
            <span>توانا</span>
            <span aria-hidden="true">·</span>
            <span>بندستوانا</span>
          </div>
          <div className="font-mono-tabular">
            Domain Core v4.0 (10 Guilds Locked) · Offline-First Practice + Online Exam
          </div>
        </div>
      </footer>

      {/* Interactive Coach Drawer */}
      <CoachDrawer isOpen={coachOpen} onClose={() => setCoachOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <AccessibilityProvider>
      <AmbassadorProvider>
        <MainShell />
      </AmbassadorProvider>
    </AccessibilityProvider>
  );
}
