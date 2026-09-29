/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AmbassadorProvider, useAmbassador } from './context/AmbassadorContext';
import { SimulatedSalesWorld } from './components/SimulatedSalesWorld';
import { AcademyAndGeneralExam } from './components/AcademyAndGeneralExam';
import { ProductCertificationTracks } from './components/ProductCertificationTracks';
import { AuthorizationAndCommissionLab } from './components/AuthorizationAndCommissionLab';
import { CoachDrawer } from './components/CoachDrawer';
import {
  ECOSYSTEM_PRODUCTS,
  HERO_IMAGE_PATH,
  COACH_AVATAR_PATH,
} from './data/ecosystemData';
import {
  ALL_PRODUCT_IDS,
  ProductId,
  authorizeFieldSales,
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

  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('HOME');
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
    } else {
      setSelectedScenarioId('scen_general_core');
    }
    setActiveScreen('SIMULATION');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      {/* STRICT 3-ZONE TOP BAR CONTRACT */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Zone 1: Single Text Element Brand Wordmark */}
        <button
          onClick={() => setActiveScreen('HOME')}
          className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 whitespace-nowrap"
        >
          آموزش بازاریابی (فروشیار)
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
            خانه و ماموریت
          </button>
          <button
            onClick={() => setActiveScreen('SIMULATION')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap py-1 ${
              activeScreen === 'SIMULATION'
                ? 'text-slate-900 font-bold border-b-2 border-sky-700'
                : ''
            }`}
          >
            سناریوهای واقعی
          </button>
          <button
            onClick={() => setActiveScreen('ACADEMY')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap py-1 ${
              activeScreen === 'ACADEMY'
                ? 'text-slate-900 font-bold border-b-2 border-sky-700'
                : ''
            }`}
          >
            آکادمی و آزمون
          </button>
          <button
            onClick={() => setActiveScreen('PRODUCTS')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap py-1 ${
              activeScreen === 'PRODUCTS'
                ? 'text-slate-900 font-bold border-b-2 border-sky-700'
                : ''
            }`}
          >
            مسیرهای محصول
          </button>
          <button
            onClick={() => setActiveScreen('AUTHORIZATION')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap py-1 ${
              activeScreen === 'AUTHORIZATION'
                ? 'text-slate-900 font-bold border-b-2 border-sky-700'
                : ''
            }`}
          >
            سطح من و مجوز فروش
          </button>
        </nav>

        {/* Zone 3: 2 Primary Actions (Coach + Real Verified Auth) */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCoachOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-sky-900 bg-sky-50 hover:bg-sky-100 rounded-xl transition-colors whitespace-nowrap"
          >
            <MessageSquareHeart className="w-4 h-4 text-sky-700" />
            <span>مربی فروشیار</span>
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
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-sky-800">
                  <span>اکوسیستم آفرینش</span>
                  <span aria-hidden="true">·</span>
                  <span>شهر نوآوران AbleCity</span>
                  <span aria-hidden="true">·</span>
                  <span>توانا</span>
                  <span aria-hidden="true">·</span>
                  <span>بندستوانا</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-700 flex items-center gap-1">
                    <Wifi className="w-3.5 h-3.5" />
                    آموزش و تمرین آفلاین‌محور + آزمون رسمی آنلاین
                  </span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight headline-balance">
                  «سلام! آماده‌ای امروز یک فروشنده بهتر بشی؟»
                </h1>

                <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                  به دنیای شبیه‌سازی فروش <strong>فروشیار (ForoshYar)</strong> خوش آمدی. اینجا یک کتابخانه خشک از جزوه‌ها نیست؛ اینجا میدان تمرین واقعی توست تا ببینی، بشنوی، انتخاب کنی، صحبت کنی، بدون ترس اشتباه کنی، از مربی بازخورد بگیری و با کسب گواهینامه‌های تخصصی، مجوز رسمی فروش ۷ محصول اکوسیستم آفرینش را دریافت کنی.
                </p>

                {/* Primary Focal CTA + Secondary Action */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    onClick={() => setActiveScreen('SIMULATION')}
                    className="flex items-center gap-2 px-6 py-3.5 bg-sky-700 hover:bg-sky-800 text-white text-sm font-bold rounded-xl transition-colors whitespace-nowrap shadow-xs"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>ورود به میدان شبیه‌سازی فروش (ماموریت امروز)</span>
                  </button>

                  <button
                    onClick={() => setActiveScreen('PRODUCTS')}
                    className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-900 text-sm font-semibold rounded-xl transition-colors whitespace-nowrap"
                  >
                    مسیرهای گواهینامه ۷ محصول ({certifiedProductsCount}/۷ فعال)
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
                    title: 'ادامه آموزش (EVENTMATE — ۶۰٪)',
                    desc: 'در حال گذراندن ماژول «محاسبه هزینه کارت ویزیت‌های فراموش‌شده در نمایشگاه» هستید. بدون نیاز به اینترنت ادامه دهید.',
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
                    kicker: '۰۶. مسیرهای محصول · ۷ محصول مستقل',
                    title: 'مسیرهای تخصصی ۷ محصول اکوسیستم',
                    desc: 'مدیریت همزمان گواهینامه‌های DecorMate، SlabMate، SalonMate، AutoBarter، Tanara، TalaYar و EventMate.',
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
      </main>

      {/* Clean Editorial Footer */}
      <footer className="bg-white border-t border-slate-200 px-4 sm:px-8 py-6 mt-12">
        <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-800">
              آموزش بازاریابی (فروشیار) — Marketing Training (ForoshYar)
            </span>
            <span aria-hidden="true">·</span>
            <span>اکوسیستم آفرینش</span>
            <span aria-hidden="true">·</span>
            <span>شهر نوآوران AbleCity</span>
            <span aria-hidden="true">·</span>
            <span>توانا</span>
            <span aria-hidden="true">·</span>
            <span>بندستوانا</span>
          </div>
          <div className="font-mono-tabular">
            Domain Core v4.0 (Locked & Hardened) · Offline-First Practice + Online Exam
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
    <AmbassadorProvider>
      <MainShell />
    </AmbassadorProvider>
  );
}
