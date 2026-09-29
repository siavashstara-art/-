import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Lock,
  Smartphone,
  CheckCircle2,
  TrendingUp,
  Share2,
  Mic,
  MicOff,
  FastForward,
  Film,
} from 'lucide-react';
import { ProductId } from '../domain/core';
import { GuildMarketingPlaybook } from './TavanaGuildPlaybook';
import { useAccessibility, SUPPORTED_LOCALES, SupportedLocale } from '../context/AccessibilityAndLocaleContext';

interface GuildAnimatedVideoPlayerProps {
  playbook: GuildMarketingPlaybook;
  customShopName: string;
  customManagerName: string;
  onTriggerLiveBuyerLock: () => void;
}

interface StoryScene {
  id: number;
  phaseCode: string;
  titleFa: string;
  durationSec: number;
  narrationFa: string;
  visualCaptionFa: string;
  trustScore: number;
  resistanceScore: number;
  highlightMetricFa: string;
}

export const GuildAnimatedVideoPlayer: React.FC<GuildAnimatedVideoPlayerProps> = ({
  playbook,
  customShopName,
  customManagerName,
  onTriggerLiveBuyerLock,
}) => {
  const { locale, localeMeta, t, setLocale, announceAndCaption } = useAccessibility();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [sceneProgress, setSceneProgress] = useState(0); // 0 to 100
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Interactive "Shadowing / Pitch Mirror" (آینه تمرینی ۳۰ ثانیه اول)
  const [isShadowRecording, setIsShadowRecording] = useState(false);
  const [shadowTranscript, setShadowTranscript] = useState('');
  const [shadowScore, setShadowScore] = useState<{
    score: number;
    matchedKeywords: string[];
    missingKeywords: string[];
  } | null>(null);

  const timerRef = useRef<number | null>(null);

  const localizedSceneTexts = t.guildVideoScenesLocalized[playbook.productId];

  // Build 5 tailored animated scenes for the selected guild in the user's mother tongue
  const scenes: StoryScene[] = [
    {
      id: 0,
      phaseCode: '۰۰:۱۰ — بیرون درب مغازه',
      titleFa: `صحنه ۱ (${localeMeta.nativeName}): آماده‌سازی ۱۰ ثانیه‌ای و قفل خریدار`,
      durationSec: 8,
      narrationFa:
        locale === 'fa'
          ? `گام اول بیرون درب ${customShopName}: سفیر فروش ۱۰ ثانیه می‌ایستد، نام «${customShopName}» و نام «${customManagerName}» را در تبلت وارد می‌کند و دکمه قفل و مخفی‌سازی را می‌زند تا هیچ اثری از صنف‌های دیگر دیده نشود.`
          : localizedSceneTexts.scene1,
      visualCaptionFa: `🔒 قفل اختصاصی فعال شد: تمام منوها به نام «${customShopName}» تغییر یافت`,
      trustScore: 35,
      resistanceScore: 70,
      highlightMetricFa: `ساعت طلایی مراجعه: ${playbook.bestVisitTimeFa}`,
    },
    {
      id: 1,
      phaseCode: '۰۰:۲۵ — ورود و دیالوگ ۳۰ ثانیه‌ای',
      titleFa: `صحنه ۲ (${localeMeta.nativeName}): دیالوگ صمیمی ورود به مغازه`,
      durationSec: 11,
      narrationFa:
        locale === 'fa'
          ? playbook.opening30SecScriptFa
          : t.guildPitchLocalized[playbook.productId],
      visualCaptionFa: `💬 ${customManagerName}: «جالب شد! چطور با اسم تابلوی خودمان آماده کرده‌اید؟ بدهید ببینم...»`,
      trustScore: 62,
      resistanceScore: 42,
      highlightMetricFa: 'تغییر وضعیت ذهنی مشتری از «دفاعی» به «کنجکاوی شدید» در ۳ ثانیه',
    },
    {
      id: 2,
      phaseCode: '۰۰:۳۵ — حرکت جادویی تبلت',
      titleFa: `صحنه ۳ (${localeMeta.nativeName}): حرکت جادویی ۱۰ ثانیه‌ای روی تبلت`,
      durationSec: 10,
      narrationFa:
        locale === 'fa'
          ? `حرکت جادویی روی تبلت جلوی چشم خریدار: ${playbook.tabletMagicDemoFa}`
          : localizedSceneTexts.scene3,
      visualCaptionFa: `✨ صدور پیش‌فاکتور طلاکوب + جدول چک صیادی + پیامک ضدتحریم در ۰.۸ ثانیه`,
      trustScore: 84,
      resistanceScore: 20,
      highlightMetricFa: playbook.hiddenPainPointFa
        ? playbook.hiddenPainPointFa.slice(0, 90) + '...'
        : 'حل کامل درد پنهان صنف جلوی چشم مدیر مجموعه',
    },
    {
      id: 3,
      phaseCode: '۰۰:۵۰ — پاسخ به بهانه و سایت دائمی',
      titleFa: `صحنه ۴ (${localeMeta.nativeName}): رفع بهانه + پیشنهاد سایت دائمی (۳۰٪ پورسانت)`,
      durationSec: 10,
      narrationFa:
        locale === 'fa'
          ? `مشتری می‌پرسد: ${playbook.objections[0]?.objectionFa || ''} سفیر با آرامش پاسخ می‌دهد: ${
              playbook.objections[0]?.winningAnswerFa || ''
            } و سپس پیشنهاد سایت دائمی را مطرح می‌کند: ${playbook.websiteUpsellPitchFa}`
          : localizedSceneTexts.scene4,
      visualCaptionFa: `🌐 ارتقای قرارداد از لایسنس عادی (۲۵٪) به پکیج لایسنس + سایت دائمی (۳۰٪ کمیسیون)`,
      trustScore: 93,
      resistanceScore: 8,
      highlightMetricFa: 'بدون دردسر اینماد و بدون مالیات درگاه بانکی — مستقیم به واتساپ و پیامک',
    },
    {
      id: 4,
      phaseCode: '۰۱:۰۰ — بستن قرارداد و شکار تقاطعی',
      titleFa: `صحنه ۵ (${localeMeta.nativeName}): بستن قرارداد با ۱ مشتری + شکار تقاطعی ۳۵٪`,
      durationSec: 9,
      narrationFa:
        locale === 'fa'
          ? `${playbook.roiClosingFormulaFa} و بلافاصله پس از ثبت قرارداد: ${playbook.crossSellStrategyFa}`
          : localizedSceneTexts.scene5,
      visualCaptionFa: `🏆 قرارداد بسته شد! + دریافت ۲ سرنخ تقاطعی با کمیسیون ۳۵٪ (${playbook.crossSellTargets.join(
        ' ، '
      )})`,
      trustScore: 98,
      resistanceScore: 0,
      highlightMetricFa: playbook.badgeFa,
    },
  ];

  const currentScene = scenes[currentSceneIdx] || scenes[0];

  // Synthesize subtle cinema transition sound using Web Audio API (works 100% offline)
  const playChime = useCallback(
    (freq = 520) => {
      if (!soundEnabled || typeof window === 'undefined') return;
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.25, ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.26);
      } catch {
        // ignore audio context restrictions
      }
    },
    [soundEnabled]
  );

  // Speak narration for current scene in the user's selected mother tongue
  const speakScene = useCallback(
    (text: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      if (!soundEnabled) return;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = localeMeta.speechLang || 'fa-IR';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    },
    [soundEnabled, localeMeta.speechLang]
  );

  // Reset when guild changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentSceneIdx(0);
    setSceneProgress(0);
    setShadowTranscript('');
    setShadowScore(null);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, [playbook.productId]);

  // Trigger audio when scene changes while playing
  useEffect(() => {
    if (isPlaying) {
      playChime(440 + currentSceneIdx * 70);
      speakScene(currentScene.narrationFa);
    }
  }, [currentSceneIdx, isPlaying, currentScene.narrationFa, playChime, speakScene]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) window.clearInterval(timerRef.current);
      return;
    }

    const stepMs = 100;
    const increment = 100 / ((currentScene.durationSec * 1000) / stepMs);

    timerRef.current = window.setInterval(() => {
      setSceneProgress((prev) => {
        if (prev + increment >= 100) {
          if (currentSceneIdx < scenes.length - 1) {
            setCurrentSceneIdx((idx) => idx + 1);
            return 0;
          } else {
            setIsPlaying(false);
            return 100;
          }
        }
        return prev + increment;
      });
    }, stepMs);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [isPlaying, currentSceneIdx, currentScene.durationSec, scenes.length]);

  const handleTogglePlay = () => {
    if (!isPlaying) {
      if (currentSceneIdx === scenes.length - 1 && sceneProgress >= 100) {
        setCurrentSceneIdx(0);
        setSceneProgress(0);
      }
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  };

  const handleSelectScene = (idx: number) => {
    setCurrentSceneIdx(idx);
    setSceneProgress(0);
    setIsPlaying(true);
  };

  // Golden keywords per guild for the "Shadowing & Pitch Mirror"
  const getGoldenKeywords = (pid: ProductId): string[] => {
    switch (pid) {
      case 'DECORMATE':
        return ['طلاکوب', 'چک صیادی', 'ضدتورم', 'متراژ', 'سایت اختصاصی'];
      case 'SLABMATE':
        return ['پرتی برش', 'چسب پرسلانی', 'سازنده و مالک', 'طلاکوب', 'چک صیادی'];
      case 'SALONMATE':
        return ['سایت رسمی', 'حسابداری لاین', 'هزینه مواد', 'صندلی', 'تخفیف'];
      case 'AUTOBARTER':
        return ['راس‌گیری', 'چک صیادی', 'تهاتر ملک', 'کارشناسی', 'طلاکوب'];
      case 'TANARA':
        return ['طرح درمان', 'ایمپلنت', 'لمینت', 'چک صیادی', 'گارانتی'];
      case 'TALAYAR':
        return ['سامانه مودیان', 'معافیت اصل طلا', 'اجرت و سود', 'طلای کهنه', 'چک صیادی'];
      case 'EVENTMATE':
        return ['منوساز', 'تسهیم هزینه', 'دو خانواده', 'قفل ضدتورم', 'چک صیادی'];
    }
  };

  const evaluateShadowPitch = (text: string) => {
    const keywords = getGoldenKeywords(playbook.productId);
    const matched = keywords.filter((kw) => text.includes(kw) || text.includes(kw.split(' ')[0]));
    const missing = keywords.filter((kw) => !matched.includes(kw));
    const score = Math.min(100, Math.round((matched.length / keywords.length) * 85) + (text.length > 40 ? 15 : 0));
    setShadowScore({ score, matchedKeywords: matched, missingKeywords: missing });
  };

  const handleVoiceShadowing = () => {
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRec) {
      // Populate with standard pitch if browser speech recognition isn't supported
      setShadowTranscript(playbook.opening30SecScriptFa);
      evaluateShadowPitch(playbook.opening30SecScriptFa);
      return;
    }

    if (isShadowRecording) {
      setIsShadowRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = 'fa-IR';
      recognition.continuous = false;
      recognition.interimResults = false;
      setIsShadowRecording(true);

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        setShadowTranscript(transcript);
        evaluateShadowPitch(transcript);
        setIsShadowRecording(false);
      };
      recognition.onerror = () => {
        setIsShadowRecording(false);
      };
      recognition.onend = () => {
        setIsShadowRecording(false);
      };
      recognition.start();
    } catch {
      setIsShadowRecording(false);
    }
  };

  return (
    <div className="rounded-3xl bg-slate-950 text-white border-2 border-sky-500/40 overflow-hidden shadow-xl">
      {/* Top Cinema Header */}
      <div className="bg-slate-900/90 px-5 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-600/20 border border-sky-400/40 flex items-center justify-center text-sky-300">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-sky-400 block">
              {t.videoSectionTitle} ({localeMeta.nativeName})
            </span>
            <h4 className="text-sm sm:text-base font-extrabold text-white">
              فیلم شبیه‌سازی گام‌به‌گام ورود به مغازه و بستن قرارداد — {playbook.shortNameFa}
            </h4>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Mother-Tongue Video Audio/Subtitle Selector */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            {(Object.keys(SUPPORTED_LOCALES) as SupportedLocale[]).map((locCode) => {
              const meta = SUPPORTED_LOCALES[locCode];
              const active = locale === locCode;
              return (
                <button
                  key={locCode}
                  type="button"
                  onClick={() => setLocale(locCode)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-amber-400 text-slate-950'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {meta.nativeName}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => {
              const nextSound = !soundEnabled;
              setSoundEnabled(nextSound);
              if (!nextSound && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
              }
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? 'راوی صوتی: روشن' : 'راوی صوتی: خاموش'}</span>
          </button>

          <button
            type="button"
            onClick={handleTogglePlay}
            className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isPlaying ? 'توقف انیمیشن' : 'پخش انیمیشن با صدا'}</span>
          </button>
        </div>
      </div>

      {/* Main Animated Cinema Stage */}
      <div className="p-5 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950/40">
        {/* Left: Visual Animated Stage */}
        <div className="lg:col-span-7 space-y-5">
          {/* Scene Badge & Live Trust/Resistance Meters */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-extrabold font-mono-tabular">
              {currentScene.phaseCode}
            </span>

            <div className="flex items-center gap-4 text-xs font-mono-tabular">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">اعتماد خریدار:</span>
                <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-500"
                    style={{ width: `${currentScene.trustScore}%` }}
                  />
                </div>
                <strong className="text-emerald-400">{currentScene.trustScore}٪</strong>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">گارد و مقاومت:</span>
                <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-400 transition-all duration-500"
                    style={{ width: `${currentScene.resistanceScore}%` }}
                  />
                </div>
                <strong className="text-rose-400">{currentScene.resistanceScore}٪</strong>
              </div>
            </div>
          </div>

          {/* Animated Visual Scene Canvas */}
          <div className="relative rounded-2xl bg-slate-900/95 border border-slate-700/80 p-5 sm:p-6 min-h-[230px] flex flex-col justify-between overflow-hidden">
            {/* Animated Pulse Background Effect */}
            <div
              className={`absolute -top-16 -left-16 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
                currentSceneIdx === 0
                  ? 'bg-amber-500/15'
                  : currentSceneIdx === 1
                  ? 'bg-sky-500/15'
                  : currentSceneIdx === 2
                  ? 'bg-emerald-500/20'
                  : currentSceneIdx === 3
                  ? 'bg-purple-500/15'
                  : 'bg-amber-400/25'
              }`}
            />

            {/* Scene Visual Actors */}
            <div className="relative z-10 flex items-center justify-between gap-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-xs border ${
                    isPlaying
                      ? 'bg-sky-600 text-white border-sky-300 animate-pulse'
                      : 'bg-slate-800 text-sky-300 border-slate-700'
                  }`}
                >
                  سفیر
                </div>
                <div>
                  <div className="text-xs font-extrabold text-white">سفیر رسمی فروشیار</div>
                  <div className="text-[11px] text-sky-300">
                    {currentSceneIdx === 0
                      ? 'در حال تنظیم ۱۰ ثانیه‌ای تبلت بیرون مغازه'
                      : currentSceneIdx === 1
                      ? 'اجرای دیالوگ ۳۰ ثانیه‌ای ضدگارد'
                      : currentSceneIdx === 2
                      ? 'اجرای حرکت جادویی ۱۰ ثانیه‌ای روی تبلت'
                      : currentSceneIdx === 3
                      ? 'پاسخ مشاوره‌ای + معرفی سایت دائمی'
                      : 'بستن قرارداد و دریافت سرنخ تقاطعی ۳۵٪'}
                  </div>
                </div>
              </div>

              {/* Animated Tablet Mockup in Scene */}
              <div className="px-3 py-1.5 rounded-xl bg-black/70 border border-amber-500/50 text-[11px] text-amber-300 font-bold flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                <span>تبلت: {customShopName}</span>
              </div>
            </div>

            {/* Scene Title & Synchronized Subtitle */}
            <div className="relative z-10 my-4 space-y-2">
              <h5 className="text-base sm:text-lg font-extrabold text-amber-300">
                {currentScene.titleFa}
              </h5>
              <p className="text-xs sm:text-sm text-white/95 leading-relaxed bg-black/50 p-3.5 rounded-xl border border-white/10">
                {currentScene.narrationFa}
              </p>
            </div>

            {/* Bottom Animated Consequence Strip */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
              <span className="text-emerald-300 font-bold">{currentScene.visualCaptionFa}</span>
              <button
                type="button"
                onClick={onTriggerLiveBuyerLock}
                className="text-amber-300 hover:text-amber-200 underline font-bold cursor-pointer"
              >
                امتحان عملی روی تبلت واقعی ←
              </button>
            </div>
          </div>

          {/* 5-Scene Timeline Stepper & Progress Bar */}
          <div className="space-y-2">
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-l from-amber-400 to-sky-500 transition-all duration-150"
                style={{
                  width: `${
                    ((currentSceneIdx + sceneProgress / 100) / scenes.length) * 100
                  }%`,
                }}
              />
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {scenes.map((sc, idx) => {
                const active = idx === currentSceneIdx;
                const done = idx < currentSceneIdx;
                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => handleSelectScene(idx)}
                    className={`p-2 rounded-xl text-right border transition-all cursor-pointer ${
                      active
                        ? 'bg-sky-900/60 border-sky-400 text-white'
                        : done
                        ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-[10px] font-mono-tabular font-bold">
                      پرده {idx + 1}
                    </div>
                    <div className="text-[11px] font-bold truncate mt-0.5">
                      {sc.titleFa.replace(/^صحنه \d+:\s*/, '')}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Creative Educational Feature — "Pitch Mirror & Voice Shadowing" (آینه صوتی ۳۰ ثانیه اول) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[11px] font-extrabold text-amber-400 block">
                ابتکار آموزشی ویژه: تمرین سایه‌ای (Voice Shadowing Mirror)
              </span>
              <h5 className="text-sm font-extrabold text-white mt-0.5">
                آینه تمرین ۳۰ ثانیه اول ورود به مغازه
              </h5>
            </div>
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            پس از دیدن و شنیدن انیمیشن بالا، دکمه میکروفون را بزنید (یا متن خودتان را بنویسید) و دیالوگ ورود به «{customShopName}» را با صدای خودتان تمرین کنید. سیستم به‌صورت آفلاین کلمات کلیدی پولساز این صنف را در بیان شما می‌سنجد:
          </p>

          {/* Golden Keywords Chips for this Guild */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-slate-400 block">
              ۵ کلیدواژه طلایی که باید در ۳۰ ثانیه اول بگویید:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {getGoldenKeywords(playbook.productId).map((kw) => {
                const isHit = shadowScore?.matchedKeywords.includes(kw);
                return (
                  <span
                    key={kw}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                      isHit
                        ? 'bg-emerald-950 border-emerald-400 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    {isHit ? `✓ ${kw}` : kw}
                  </span>
                );
              })}
            </div>
          </div>

          <textarea
            rows={3}
            value={shadowTranscript}
            onChange={(e) => {
              setShadowTranscript(e.target.value);
              evaluateShadowPitch(e.target.value);
            }}
            placeholder="دیالوگ ۳۰ ثانیه اول خودتان را با میکروفون بگویید یا اینجا تایپ کنید..."
            className="w-full rounded-xl bg-slate-950 border border-slate-700 p-3 text-xs text-white placeholder:text-slate-500"
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleVoiceShadowing}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                isShadowRecording
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
              }`}
            >
              {isShadowRecording ? (
                <>
                  <MicOff className="w-4 h-4" />
                  <span>در حال شنیدن صدای شما...</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  <span>ضبط صدای من و سنجش لحن</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setShadowTranscript(playbook.opening30SecScriptFa);
                evaluateShadowPitch(playbook.opening30SecScriptFa);
              }}
              className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
            >
              تست با دیالوگ استاندارد
            </button>
          </div>

          {shadowScore && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400">
                  امتیاز قدرت متقاعدسازی ۳۰ ثانیه اول:
                </span>
                <span className="font-mono-tabular font-extrabold text-sm text-white">
                  {shadowScore.score} از ۱۰۰
                </span>
              </div>
              {shadowScore.missingKeywords.length > 0 ? (
                <p className="text-amber-300 text-[11px]">
                  پیشنهاد مربی: برای میخکوب کردن مشتری، عبارت‌های «
                  {shadowScore.missingKeywords.join('، ')}» را هم به جمله خود اضافه کنید.
                </p>
              ) : (
                <p className="text-emerald-300 text-[11px] font-bold">
                  ● عالی! تمام کلیدواژه‌های حساس و پولساز این صنف را در ۳۰ ثانیه اول بیان کردید.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
