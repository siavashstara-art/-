import React, { useState } from 'react';
import { useAmbassador } from '../context/AmbassadorContext';
import { GENERAL_ACADEMY_EXAM_QUESTIONS } from '../data/ecosystemData';
import { evaluateGeneralCertification } from '../domain/core';
import {
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Award,
  ArrowLeft,
  RotateCcw,
} from 'lucide-react';

interface AcademyAndGeneralExamProps {
  onNavigateToSimulation: () => void;
  onNavigateToProducts: () => void;
}

export const AcademyAndGeneralExam: React.FC<AcademyAndGeneralExamProps> = ({
  onNavigateToSimulation,
  onNavigateToProducts,
}) => {
  const {
    profile,
    completeGeneralTrainingStep,
    submitGeneralExamResult,
  } = useAmbassador();

  const [activeTab, setActiveTab] = useState<'TRAINING' | 'EXAM'>('TRAINING');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [manualScoreTest, setManualScoreTest] = useState<number>(profile.generalExamScore || 89);

  // Interactive Teaching Animation State (Consultative vs Aggressive Pitch Comparison)
  const [comparisonMode, setComparisonMode] = useState<'CONSULTATIVE' | 'TRADITIONAL'>(
    'CONSULTATIVE'
  );

  const handleSelectAnswer = (qId: string, optId: string) => {
    if (examSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optId }));
  };

  const calculateQuizScore = (): number => {
    let correct = 0;
    for (const q of GENERAL_ACADEMY_EXAM_QUESTIONS) {
      const chosen = selectedAnswers[q.id];
      const opt = q.options.find((o) => o.id === chosen);
      if (opt?.isCorrect) correct += 1;
    }
    return Math.round((correct / GENERAL_ACADEMY_EXAM_QUESTIONS.length) * 100);
  };

  const handleSubmitExam = async () => {
    const score = calculateQuizScore();
    setExamSubmitted(true);
    setManualScoreTest(score);
    await submitGeneralExamResult(score);
  };

  const handleResetExam = () => {
    setSelectedAnswers({});
    setExamSubmitted(false);
  };

  const handleApplyScoreSimulation = async (score: number) => {
    setManualScoreTest(score);
    await submitGeneralExamResult(score);
  };

  const currentEval = evaluateGeneralCertification(
    profile.generalExamScore,
    profile.generalSimulationPassed
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <p className="text-xs font-medium text-sky-700 mb-1">
            آکادمی جامع فروشیار · صلاحیت پایه فروش مشاوره‌ای (مستقل از گواهینامه محصول)
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 headline-balance">
            آموزش عمومی و آزمون تعیین سطح سفیر (General Certification)
          </h1>
        </div>

        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('TRAINING')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'TRAINING'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ۱. کارگاه تعاملی اصول مذاکره
          </button>
          <button
            onClick={() => setActiveTab('EXAM')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'EXAM'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ۲. آزمون جامع و تعیین سطح (A++ تا C)
          </button>
        </div>
      </div>

      {/* Ambassador Current General Status Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          <div>
            <p className="text-xs text-slate-500 mb-1">سطح عمومی فعلی (Ambassador Tier)</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono-tabular text-slate-900">
                {profile.tier}
              </span>
              <span
                className={`text-xs font-semibold ${
                  profile.generalCertified ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {profile.generalCertified ? '● مجاز به ورود به محصولات' : '▲ نیازمند احراز صلاحیت'}
              </span>
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1">نمره آزمون جامع عمومی</p>
            <p className="text-xl font-bold font-mono-tabular text-slate-900">
              {profile.generalExamScore} از ۱۰۰
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1">شبیه‌سازی جامع عمومی</p>
            <p
              className={`text-sm font-bold ${
                profile.generalSimulationPassed ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {profile.generalSimulationPassed
                ? '● قبول شده (شرط A+ و A++ فعال)'
                : '▲ هنوز تکمیل نشده'}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1">وضعیت بازآموزی (Reassessment)</p>
            <p
              className={`text-sm font-bold ${
                profile.reassessmentRequired ? 'text-red-700' : 'text-emerald-700'
              }`}
            >
              {profile.reassessmentRequired
                ? '▲ در وضعیت REASSESSMENT (فروش مسدود)'
                : '● وضعیت عادی و فعال'}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <span>{currentEval.explanationFa}</span>
          <span className="text-slate-500">
            یادآوری معماری v4.0: امتیاز تمرینی ({profile.xp} XP) هرگز جایگزین گواهینامه رسمی نمی‌شود.
          </span>
        </div>
      </div>

      {activeTab === 'TRAINING' ? (
        <div className="space-y-6">
          {/* ====================================================================
              PHILOSOPHY OF ECOSYSTEM OF CREATION & TAVANA CITY NEW METAVERSE WORLD
          ==================================================================== */}
          <div className="bg-gradient-to-l from-slate-950 via-sky-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-amber-500/40 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <p className="text-xs font-extrabold text-amber-400">
                  ✦ درس اول آکادمی (ضروری برای تمام سفیران): شناخت هویت، ریشه و آرمان مجموعه
                </p>
                <h2 className="text-lg sm:text-xl font-extrabold text-white mt-1">
                  فلسفه «اکوسیستم آفرینش» و «شهر نیو متاورسی جهان توانا سیتی (Tavana City)»
                </h2>
              </div>
              <button
                onClick={() => completeGeneralTrainingStep(25)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-xl transition-colors whitespace-nowrap"
              >
                ثبت مطالعه فلسفه توانا سیتی (+۲۵٪ پیشرفت)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <span className="font-extrabold text-amber-300 block">
                  ۱. تولد از دل «سامانه جامع پوشاک ایران»
                </span>
                <p className="text-slate-300 leading-relaxed">
                  کل تفکر و معماری این اپلیکیشن از دل <strong className="text-white">«سامانه جامع پوشاک ایران (پوشاک‌یار)»</strong> متولد شد؛ جایی که مشخص شد بزرگ‌ترین درد اصناف ایران، خروج مشتری مردد با جمله «یک دور در بازار بزنیم برمی‌گردیم» و پیچیدگی حساب‌وکتاب چک صیادی است. این الگو امروز به ۱۰ سامانه صنفی توانا سیتی (کابینت‌یار، سرامیک‌یار، زیباجو، اتویار، تن‌آرا، طلایار، تالاریار، جهیزیه‌جو، پوشاک‌یار و نرخ‌یار) گسترش یافته است.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <span className="font-extrabold text-sky-300 block">
                  ۲. برنامه‌های شهر نیو متاورسی جهان توانا سیتی
                </span>
                <p className="text-slate-300 leading-relaxed">
                  در <strong className="text-white">شهر نیو متاورسی جهان توانا سیتی (AbleCity / بندستوانا)</strong>، هر واحد صنفی (از پوشاک، مبل جهیزیه، طلا، کابینت و تالار تا کلینیک، سالن زیبایی، سنگ اسلب، اتوگالری و فروشندگان لپ‌تاپ/ویزا با نرخ درهم و لیر) صاحب یک همزاد دیجیتال، ماشین‌حساب ۱۰ ثانیه‌ای پیش‌فاکتور طلاکوب و سایت دائمی اختصاصی بدون دردسرهای مالیاتی درگاه بانکی می‌شود.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/40 space-y-2">
                <span className="font-extrabold text-emerald-300 block">
                  ۳. توانمندسازی انسان‌ها، ۱۰ زبان مادری و شراکت ۲۰/۱۵
                </span>
                <p className="text-emerald-100 leading-relaxed">
                  فلسفه اکوسیستم آفرینش بر پایه <strong className="text-white">دسترس‌پذیری کامل (معلولین حرکتی، بینایی، شنوایی و تمرکز)</strong>، آموزش به ۱۰ زبان و گویش مادری، و اقتصاد برد-برد است؛ به طوری که حتی اگر مغازه‌داری خودش نخرد، با کد معرف <span className="font-mono-tabular">TVN-PARTNER</span> در سود ۳۵٪ شریک می‌شود (۲۰٪ سفیر + ۱۵٪ معرف).
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Interactive Visual Demonstration of Consultative Sales vs Pitching */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-sky-700">
                  شبیه‌ساز بصری رفتار مشتری (Animation with Purpose: Teach & Demonstrate)
                </p>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                  مقایسه اثر «فروش مشاوره‌ای» در برابر «اصرار و تخفیف سنتی»
                </h2>
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  onClick={() => setComparisonMode('CONSULTATIVE')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                    comparisonMode === 'CONSULTATIVE'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600'
                  }`}
                >
                  متدولوژی فروشیار (مشاوره‌ای)
                </button>
                <button
                  onClick={() => setComparisonMode('TRADITIONAL')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                    comparisonMode === 'TRADITIONAL'
                      ? 'bg-white text-amber-800 shadow-xs'
                      : 'text-slate-600'
                  }`}
                >
                  روش سنتی (فشار و تخفیف)
                </button>
              </div>
            </div>

            {/* Animated Trajectory Stage */}
            <div className="bg-slate-900 text-white rounded-xl p-5 space-y-5">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>مسیر ذهنی مشتری در ۵ دقیقه اول جلسه:</span>
                <span className="font-mono-tabular">
                  {comparisonMode === 'CONSULTATIVE'
                    ? '● نرخ تبدیل نهایی: ۷۸٪'
                    : '▲ نرخ خروج بدون خرید: ۸۵٪'}
                </span>
              </div>

              <div className="space-y-4">
                {(comparisonMode === 'CONSULTATIVE'
                  ? [
                      {
                        step: 'دقیقه ۱: مشاهده (Observe)',
                        desc: 'تشخیص گلوگاه واقعی شوروم قبل از باز کردن کاتالوگ',
                        trust: 55,
                      },
                      {
                        step: 'دقیقه ۲: پرسش کاوشگرانه (Listen)',
                        desc: 'محاسبه تعداد مشتریان مرددی که بدون خرید خارج می‌شوند',
                        trust: 74,
                      },
                      {
                        step: 'دقیقه ۳: تجربه لمسی (Demonstrate)',
                        desc: 'سپردن تبلت به دست خود مدیر برای تغییر متریال در ۵ ثانیه',
                        trust: 92,
                      },
                      {
                        step: 'دقیقه ۵: تحلیل بازگشت سرمایه (Close)',
                        desc: 'مقایسه قیمت لایسنس با سود تنها ۲ فاکتور نجات‌یافته در ماه',
                        trust: 96,
                      },
                    ]
                  : [
                      {
                        step: 'دقیقه ۱: پرش مستقیم به معرفی محصول',
                        desc: 'شروع جلسه با اصطلاحات پیچیده فنی بدون شناخت دغدغه مدیر',
                        trust: 35,
                      },
                      {
                        step: 'دقیقه ۲: مقاومت قیمتی مشتری',
                        desc: 'مشتری می‌گوید «الان نیازی نداریم و قیمت بالاست»',
                        trust: 25,
                      },
                      {
                        step: 'دقیقه ۳: تله تخفیف زودهنگام',
                        desc: 'پیشنهاد ۳۰٪ تخفیف فوری؛ مشتری به کیفیت اصلی محصول شک می‌کند',
                        trust: 18,
                      },
                      {
                        step: 'دقیقه ۵: پایان ناموفق جلسه',
                        desc: '«کاتالوگ را بگذارید، خبرتان می‌کنیم» (عدم پیگیری مجدد)',
                        trust: 12,
                      },
                    ]
                ).map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{item.step}</span>
                      <span className="font-mono-tabular text-slate-300">
                        اعتماد مشتری: {item.trust}٪
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{item.desc}</p>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-transform duration-200 origin-right ${
                          comparisonMode === 'CONSULTATIVE'
                            ? 'bg-emerald-500'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${item.trust}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <button
                onClick={() => completeGeneralTrainingStep(25)}
                className="px-5 py-2.5 bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
              >
                ثبت تکمیل مطالعه این سرفصل (+۲۵٪ پیشرفت آموزش عمومی)
              </button>

              <button
                onClick={() => setActiveTab('EXAM')}
                className="flex items-center gap-1.5 text-xs font-semibold text-sky-700 hover:text-sky-900 whitespace-nowrap"
              >
                <span>ورود به آزمون جامع تعیین سطح</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Column: Tier Threshold Rules Matrix (Locked v4.0) */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-sky-700" />
              <h3 className="text-base font-bold text-slate-900">
                جدول قوانین تعیین سطح عمومی (Domain Core v4.0)
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              تعیین سطح عمومی سفیر بر اساس ترکیب نمره آزمون جامع و وضعیت قبولی در شبیه‌سازی جامع انجام می‌شود:
            </p>

            <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden text-xs">
              {[
                {
                  tier: 'A++',
                  rule: 'نمره >= ۹۵ + قبولی شبیه‌سازی جامع',
                  auth: 'مجاز به مسیر تخصصی و فروش میدانی (پس از گواهینامه محصول)',
                  statusColor: 'text-emerald-700',
                },
                {
                  tier: 'A+',
                  rule: 'نمره >= ۸۵ + قبولی شبیه‌سازی جامع',
                  auth: 'مجاز به مسیر تخصصی و فروش میدانی (پس از گواهینامه محصول)',
                  statusColor: 'text-emerald-700',
                },
                {
                  tier: 'A',
                  rule: 'نمره >= ۷۰',
                  auth: 'مجاز به مسیر تخصصی و فروش میدانی (پس از گواهینامه محصول)',
                  statusColor: 'text-sky-700',
                },
                {
                  tier: 'B',
                  rule: 'نمره ۵۰ تا ۶۹',
                  auth: 'غیرمجاز برای فروش میدانی → ورود خودکار به REASSESSMENT',
                  statusColor: 'text-amber-700',
                },
                {
                  tier: 'C',
                  rule: 'نمره کمتر از ۵۰',
                  auth: 'غیرمجاز برای فروش میدانی → ورود خودکار به REASSESSMENT',
                  statusColor: 'text-red-700',
                },
              ].map((row) => (
                <div key={row.tier} className="p-3.5 bg-white flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono-tabular font-bold text-sm text-slate-900">
                      سطح {row.tier}
                    </span>
                    <span className="font-mono-tabular text-slate-600">{row.rule}</span>
                  </div>
                  <span className={`font-medium ${row.statusColor}`}>{row.auth}</span>
                </div>
              ))}
            </div>

            {/* Interactive Quick Tier Simulator for Testing */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <label
                  htmlFor="general-score-slider"
                  className="font-bold text-slate-800"
                >
                  تست مستقیم نمره آزمون جامع:
                </label>
                <span className="font-mono-tabular font-bold text-sky-700">
                  نمره انتخابی: {manualScoreTest} از ۱۰۰
                </span>
              </div>
              <input
                id="general-score-slider"
                type="range"
                min={20}
                max={100}
                value={manualScoreTest}
                onChange={(e) => setManualScoreTest(Number(e.target.value))}
                className="w-full accent-sky-700"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleApplyScoreSimulation(manualScoreTest)}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                >
                  اعمال این نمره در پرونده ({manualScoreTest})
                </button>
                <button
                  onClick={onNavigateToSimulation}
                  className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                >
                  اجرای شبیه‌سازی جامع (شرط A+ و A++)
                </button>
              </div>
            </div>
          </div>
          </div>
        </div>
      ) : (
        /* General Certification Exam Tab */
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-sky-700" />
              <h2 className="text-lg font-bold text-slate-900">
                سوالات سناریومحور آزمون جامع فروش (۵ موقعیت واقعی)
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-mono-tabular">
              پاسخ داده شده: {Object.keys(selectedAnswers).length} از{' '}
              {GENERAL_ACADEMY_EXAM_QUESTIONS.length}
            </span>
          </div>

          <div className="space-y-6">
            {GENERAL_ACADEMY_EXAM_QUESTIONS.map((q, idx) => {
              const chosenId = selectedAnswers[q.id];
              return (
                <div
                  key={q.id}
                  className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                >
                  <p className="text-xs text-slate-500">
                    موقعیت {idx + 1}: {q.contextFa}
                  </p>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    {q.questionFa}
                  </h3>

                  <div className="space-y-2 pt-1">
                    {q.options.map((opt) => {
                      const isChosen = chosenId === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleSelectAnswer(q.id, opt.id)}
                          className={`w-full text-right p-3.5 rounded-xl border text-xs sm:text-sm transition-colors ${
                            isChosen
                              ? examSubmitted
                                ? opt.isCorrect
                                  ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-semibold'
                                  : 'bg-red-50 border-red-500 text-red-950 font-semibold'
                                : 'bg-sky-50 border-sky-600 text-slate-900 font-semibold'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className="leading-relaxed">{opt.textFa}</span>
                            {examSubmitted && isChosen && (
                              <span className="shrink-0 font-bold text-xs">
                                {opt.isCorrect ? '● صحیح' : '▲ نادرست'}
                              </span>
                            )}
                          </div>
                          {examSubmitted && isChosen && (
                            <p className="mt-2 pt-2 border-t border-slate-200/80 text-xs text-slate-600 font-normal">
                              تحلیل مربی: {opt.coachFeedbackFa}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200">
            {!examSubmitted ? (
              <button
                disabled={
                  Object.keys(selectedAnswers).length <
                  GENERAL_ACADEMY_EXAM_QUESTIONS.length
                }
                onClick={handleSubmitExam}
                className="px-6 py-3 bg-sky-700 hover:bg-sky-800 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition-colors whitespace-nowrap"
              >
                ثبت نهایی پاسخ‌ها و محاسبه سطح عمومی سفیر
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleResetExam}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>آزمون مجدد (Retry Exam)</span>
                </button>
                <button
                  onClick={onNavigateToProducts}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>مشاهده مسیرهای گواهینامه ۷ محصول</span>
                </button>
              </div>
            )}

            {examSubmitted && (
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <AlertCircle className="w-4 h-4 text-sky-700" />
                <span>
                  نمره کسب‌شده: {calculateQuizScore()} از ۱۰۰ · سطح جدید پرونده: {profile.tier}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
