import React from 'react';
import {
  useAccessibility,
  SUPPORTED_LOCALES,
  SupportedLocale,
} from '../context/AccessibilityAndLocaleContext';
import {
  Eye,
  Ear,
  Hand,
  Brain,
  Globe,
  Volume2,
  Type,
} from 'lucide-react';

interface AccessibilityToolbarProps {
  currentScreenSummaryFa: string;
}

export const AccessibilityToolbar: React.FC<AccessibilityToolbarProps> = ({
  currentScreenSummaryFa,
}) => {
  const {
    locale,
    t,
    adhdFocusMode,
    motorLargeTargets,
    visualHighContrast,
    fontScale,
    hearingVisualCaptions,
    lastCaptionBanner,
    visualFlashActive,
    setLocale,
    toggleAdhdFocusMode,
    toggleMotorLargeTargets,
    toggleVisualHighContrast,
    cycleFontScale,
    toggleHearingVisualCaptions,
    announceAndCaption,
  } = useAccessibility();

  return (
    <div
      role="region"
      aria-label="نوار دسترس‌پذیری جامع توانا (AbleCity) و انتخاب زبان"
      className={`border-b transition-colors px-4 sm:px-8 py-2.5 text-xs ${
        visualFlashActive
          ? 'bg-amber-400 text-slate-950 ring-4 ring-amber-500'
          : visualHighContrast
          ? 'bg-black text-yellow-300 border-yellow-400'
          : 'bg-slate-900 text-slate-100 border-slate-800'
      }`}
    >
      <div className="max-w-[1360px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        {/* Left / Right: 6 Languages Switcher */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-bold text-amber-300 flex items-center gap-1 ml-1">
            <Globe className="w-3.5 h-3.5" />
            <span>{t.a11yBarTitle}</span>
          </span>

          {(Object.keys(SUPPORTED_LOCALES) as SupportedLocale[]).map((locCode) => {
            const meta = SUPPORTED_LOCALES[locCode];
            const active = locale === locCode;
            return (
              <button
                key={locCode}
                type="button"
                onClick={() => setLocale(locCode)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
                title={meta.labelFa}
              >
                {meta.nativeName}
              </button>
            );
          })}
        </div>

        {/* Disability & Neurodiversity Toggles (Motor, Visual, Hearing, ADHD) */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* 1. ADHD Focus Mode */}
          <button
            type="button"
            onClick={toggleAdhdFocusMode}
            aria-pressed={adhdFocusMode}
            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 border transition-colors cursor-pointer whitespace-nowrap ${
              adhdFocusMode
                ? 'bg-emerald-500 text-slate-950 border-white'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>{t.adhdModeLabel}</span>
          </button>

          {/* 2. Motor Impairment (Large Touch Targets + Keyboard 1-5) */}
          <button
            type="button"
            onClick={toggleMotorLargeTargets}
            aria-pressed={motorLargeTargets}
            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 border transition-colors cursor-pointer whitespace-nowrap ${
              motorLargeTargets
                ? 'bg-sky-400 text-slate-950 border-white'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Hand className="w-3.5 h-3.5" />
            <span>{t.motorModeLabel}</span>
          </button>

          {/* 3. Visual Impairment (High Contrast AAA) */}
          <button
            type="button"
            onClick={toggleVisualHighContrast}
            aria-pressed={visualHighContrast}
            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 border transition-colors cursor-pointer whitespace-nowrap ${
              visualHighContrast
                ? 'bg-yellow-300 text-black border-white'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{t.visualContrastLabel}</span>
          </button>

          {/* Font Scale Button */}
          <button
            type="button"
            onClick={cycleFontScale}
            className="px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 cursor-pointer whitespace-nowrap"
            title="تغییر اندازه قلم برای کم‌بینایان"
          >
            <Type className="w-3.5 h-3.5 text-amber-300" />
            <span>
              قلم:{' '}
              {fontScale === 'normal'
                ? '۱۰۰٪'
                : fontScale === 'large'
                ? '۱۱۵٪'
                : '۱۳۰٪'}
            </span>
          </button>

          {/* 4. Hearing Impairment (Deaf Visual Captions & Flash Alert) */}
          <button
            type="button"
            onClick={toggleHearingVisualCaptions}
            aria-pressed={hearingVisualCaptions}
            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 border transition-colors cursor-pointer whitespace-nowrap ${
              hearingVisualCaptions
                ? 'bg-purple-400 text-slate-950 border-white'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Ear className="w-3.5 h-3.5" />
            <span>{t.deafCaptionsLabel}</span>
          </button>

          {/* Screen Reader Audio Guide */}
          <button
            type="button"
            onClick={() => announceAndCaption(currentScreenSummaryFa)}
            className="px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-400/50 hover:bg-amber-500/30 cursor-pointer whitespace-nowrap"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{t.readAloudPage}</span>
          </button>
        </div>
      </div>

      {/* Language Policy & Live Visual Caption Strip */}
      <div className="max-w-[1360px] mx-auto mt-2 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <span className="text-sky-300 font-semibold">
          📌 قانون آموزشی فروشیار: شما می‌توانید تمام آموزش‌ها و ویدیوهای انیمیشنی را به ۱۱ زبان و گویش مادری شهر و دیار خودتان (فارسی، لُری، مازندرانی، گیلکی، تورکی، کوردی، عربی، بلوچی، پشتو، ارمنی Հայերեն و English) ببینید و بشنوید؛ اما <strong className="text-amber-300 underline">آزمون‌های رسمی گواهینامه فقط به زبان فارسی</strong> برگزار می‌شوند.
        </span>
        {motorLargeTargets && (
          <span className="text-emerald-300 font-mono-tabular">
            ⌨️ میانبر حرکتی فعال: کلیدهای ۱ تا ۵ کیبورد برای جابه‌جایی سریع صفحات
          </span>
        )}
      </div>

      {/* Live Visual Caption Strip for Deaf / Hard-of-Hearing Users */}
      {(hearingVisualCaptions || lastCaptionBanner) && (
        <div
          aria-live="polite"
          role="status"
          className="max-w-[1360px] mx-auto mt-2 px-3.5 py-2 rounded-xl bg-yellow-300 text-slate-950 font-extrabold text-xs flex items-center justify-between gap-2 border-2 border-white"
        >
          <span>
            🦻 زیرنویس زنده ناشنوایان و کم‌شنوایان (Visual Haptic Caption):{' '}
            {lastCaptionBanner || currentScreenSummaryFa}
          </span>
        </div>
      )}
    </div>
  );
};
