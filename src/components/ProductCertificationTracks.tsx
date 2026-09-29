import React, { useState } from 'react';
import { useAmbassador } from '../context/AmbassadorContext';
import { ECOSYSTEM_PRODUCTS } from '../data/ecosystemData';
import {
  ALL_PRODUCT_IDS,
  ProductCertificationStatus,
  ProductId,
  authorizeFieldSales,
} from '../domain/core';
import {
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Play,
  BookOpen,
  ClipboardCheck,
  Award,
} from 'lucide-react';

interface ProductCertificationTracksProps {
  onLaunchProductSimulation: (productId: ProductId) => void;
  onInspectAuthorization: (productId: ProductId) => void;
}

const STATUS_META: Record<
  ProductCertificationStatus,
  { labelFa: string; toneClass: string }
> = {
  NOT_STARTED: { labelFa: '○ آغاز نشده (NOT_STARTED)', toneClass: 'text-slate-500' },
  TRAINING: { labelFa: '◐ در حال آموزش (TRAINING)', toneClass: 'text-sky-700' },
  EXAM_FAILED: {
    labelFa: '▲ نیازمند تکرار آزمون (EXAM_FAILED)',
    toneClass: 'text-amber-700',
  },
  EXAM_PASSED: {
    labelFa: '◐ قبول در آزمون تئوری (EXAM_PASSED)',
    toneClass: 'text-sky-700',
  },
  SIMULATION_FAILED: {
    labelFa: '▲ نیازمند تکرار شبیه‌سازی (SIMULATION_FAILED)',
    toneClass: 'text-amber-700',
  },
  FIELD_EVALUATION: {
    labelFa: '◐ در انتظار ارزیابی میدانی (FIELD_EVALUATION)',
    toneClass: 'text-indigo-700',
  },
  CERTIFIED: {
    labelFa: '● گواهینامه صادر شده (CERTIFIED)',
    toneClass: 'text-emerald-700',
  },
  SUSPENDED: {
    labelFa: '▲ تعلیق شده (SUSPENDED)',
    toneClass: 'text-red-700',
  },
};

export const ProductCertificationTracks: React.FC<ProductCertificationTracksProps> = ({
  onLaunchProductSimulation,
  onInspectAuthorization,
}) => {
  const {
    profile,
    startProductTrack,
    completeProductTraining,
    submitProductExam,
    markProductSimulationOutcome,
    completeProductFieldEvaluation,
  } = useAmbassador();

  // Focusing on a product in the detail studio never reduces the ambassador's multi-product portfolio!
  const [focusedProductId, setFocusedProductId] = useState<ProductId>('DECORMATE');
  const [activeSubView, setActiveSubView] = useState<
    'TRAINING' | 'EXAM' | 'SIMULATION' | 'FIELD_EVAL'
  >('TRAINING');

  // Product Quiz State
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizResultScore, setQuizResultScore] = useState<number | null>(null);

  const focusedProduct = ECOSYSTEM_PRODUCTS[focusedProductId];
  const focusedCert = profile.productCertifications[focusedProductId];

  const focusedAuthBoundary = authorizeFieldSales({
    ambassador: profile,
    productCertification: focusedCert,
    requestedProductId: focusedProductId,
  });

  const handleSelectProduct = (pid: ProductId) => {
    setFocusedProductId(pid);
    setQuizAnswers({});
    setQuizResultScore(null);
  };

  const handleSubmitProductQuiz = async () => {
    const questions = focusedProduct.examQuestions;
    let correct = 0;
    for (const q of questions) {
      const chosen = quizAnswers[q.id];
      const opt = q.options.find((o) => o.id === chosen);
      if (opt?.isCorrect) correct += 1;
    }
    const score = Math.round((correct / questions.length) * 100);
    setQuizResultScore(score);
    await submitProductExam(focusedProductId, score);
  };

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="border-b border-slate-200 pb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-sky-700 mb-1">
            معماری چندمحصولی Domain Core v4.0 · چرخه مستقل گواهینامه برای هر یک از ۷ محصول اکوسیستم آفرینش
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 headline-balance">
            مسیرهای تخصصی محصول و گواهینامه‌های مستقل (Per-Product Certifications)
          </h1>
        </div>

        <div className="text-xs text-slate-600 font-mono-tabular">
          محصولات دارای گواهینامه CERTIFIED:{' '}
          <strong className="text-emerald-700">
            {
              ALL_PRODUCT_IDS.filter(
                (pid) => profile.productCertifications[pid].status === 'CERTIFIED'
              ).length
            }{' '}
            از ۷ محصول
          </strong>
        </div>
      </div>

      {/* Multi-Product Portfolio Matrix (All 7 Products Concurrent Overview) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {ALL_PRODUCT_IDS.map((pid) => {
          const item = ECOSYSTEM_PRODUCTS[pid];
          const cert = profile.productCertifications[pid];
          const isFocused = pid === focusedProductId;
          const statusMeta = STATUS_META[cert.status];

          return (
            <button
              key={pid}
              onClick={() => handleSelectProduct(pid)}
              className={`text-right p-4 rounded-2xl border transition-colors flex flex-col justify-between gap-3 ${
                isFocused
                  ? 'bg-white border-sky-700 ring-2 ring-sky-700/15'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span className="font-mono-tabular font-semibold text-slate-800">
                    {item.nameEn}
                  </span>
                  <span className="font-mono-tabular">آزمون: {cert.examScore}٪</span>
                </div>
                <h2 className="text-base font-bold text-slate-900">{item.nameFa}</h2>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                  {item.taglineFa}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1.5 w-full">
                <p className={`text-xs font-semibold ${statusMeta.toneClass}`}>
                  {statusMeta.labelFa}
                </p>
                {/* 4-Step Mini Progress Bar */}
                <div className="grid grid-cols-4 gap-1">
                  <div
                    className={`h-1.5 rounded-full ${
                      cert.trainingCompleted ? 'bg-emerald-600' : 'bg-slate-200'
                    }`}
                    title="آموزش محصول"
                  />
                  <div
                    className={`h-1.5 rounded-full ${
                      cert.examScore >= 75 ? 'bg-emerald-600' : 'bg-slate-200'
                    }`}
                    title="آزمون محصول (>=75)"
                  />
                  <div
                    className={`h-1.5 rounded-full ${
                      cert.simulationPassed ? 'bg-emerald-600' : 'bg-slate-200'
                    }`}
                    title="شبیه‌سازی محصول"
                  />
                  <div
                    className={`h-1.5 rounded-full ${
                      cert.fieldEvaluationPassed ? 'bg-emerald-600' : 'bg-slate-200'
                    }`}
                    title="ارزیابی میدانی"
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detailed Interactive Certification Studio for Focused Product */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>پرونده مستقل محصول: {focusedProduct.id}</span>
              <span aria-hidden="true">·</span>
              <span>{focusedProduct.categoryFa}</span>
              <span aria-hidden="true">·</span>
              <span className={STATUS_META[focusedCert.status].toneClass}>
                {STATUS_META[focusedCert.status].labelFa}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              {focusedProduct.nameFa} ({focusedProduct.nameEn}) — {focusedProduct.taglineFa}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {focusedCert.status === 'NOT_STARTED' && (
              <button
                onClick={() => startProductTrack(focusedProductId)}
                className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
              >
                شروع مسیر گواهینامه {focusedProduct.nameFa}
              </button>
            )}
            <button
              onClick={() => onInspectAuthorization(focusedProductId)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
            >
              تست مرز امنیتی فروش این محصول
            </button>
          </div>
        </div>

        {/* 4 Mandatory Gates Stepper */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {[
            {
              id: 'TRAINING' as const,
              title: '۱. آموزش تخصصی محصول',
              done: focusedCert.trainingCompleted,
              meta: focusedCert.trainingCompleted ? 'تکمیل شده (۱۰۰٪)' : `${focusedCert.trainingProgress}٪`,
              icon: BookOpen,
            },
            {
              id: 'EXAM' as const,
              title: '۲. آزمون تخصصی (حد نصاب ۷۵)',
              done: focusedCert.examScore >= 75,
              meta: `نمره فعلی: ${focusedCert.examScore} از ۱۰۰`,
              icon: Award,
            },
            {
              id: 'SIMULATION' as const,
              title: '۳. شبیه‌سازی فروش محصول',
              done: focusedCert.simulationPassed,
              meta: focusedCert.simulationPassed ? 'قبول شده' : 'در انتظار اجرا',
              icon: Play,
            },
            {
              id: 'FIELD_EVAL' as const,
              title: '۴. ارزیابی میدانی (Field Evaluation)',
              done: focusedCert.fieldEvaluationPassed,
              meta: focusedCert.fieldEvaluationPassed ? 'تایید شده' : 'نیازمند تایید میدانی',
              icon: ClipboardCheck,
            },
          ].map((gate) => {
            const Icon = gate.icon;
            const active = activeSubView === gate.id;
            return (
              <button
                key={gate.id}
                onClick={() => setActiveSubView(gate.id)}
                className={`p-4 rounded-xl border text-right transition-colors ${
                  active
                    ? 'bg-sky-50/70 border-sky-700'
                    : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Icon
                    className={`w-4 h-4 ${
                      gate.done ? 'text-emerald-600' : 'text-slate-500'
                    }`}
                  />
                  <span
                    className={`text-xs font-semibold ${
                      gate.done ? 'text-emerald-700' : 'text-slate-500'
                    }`}
                  >
                    {gate.done ? '● تکمیل' : '○ الزامی'}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-900">{gate.title}</p>
                <p className="text-xs text-slate-500 font-mono-tabular mt-0.5">
                  {gate.meta}
                </p>
              </button>
            );
          })}
        </div>

        {/* SubView Content */}
        {activeSubView === 'TRAINING' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900">
                شناسنامه تجاری و پرسونای خریدار {focusedProduct.nameFa}
              </h3>
              <div className="space-y-3 text-xs leading-relaxed">
                <div>
                  <span className="font-bold text-slate-700 block">مخاطب هدف (Target Persona):</span>
                  <span className="text-slate-600">{focusedProduct.targetPersonaFa}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-700 block">درد اصلی مشتری (Pain Point):</span>
                  <span className="text-slate-600">{focusedProduct.painPointFa}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-700 block">ارزش پیشنهادی (Value Proposition):</span>
                  <span className="text-emerald-800 font-medium">
                    {focusedProduct.valuePropositionFa}
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-sm font-bold text-slate-900">
                ماژول‌های مهارتی و مقایسه رویکرد غلط در برابر رویکرد مشاوره‌ای
              </h3>
              {focusedProduct.trainingModules.map((mod) => (
                <div
                  key={mod.id}
                  className="p-4 rounded-xl border border-slate-200 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900">{mod.titleFa}</h4>
                    <span className="text-xs font-mono-tabular text-emerald-700 font-semibold">
                      +{mod.trustImpactDelta}٪ اثر اعتماد
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{mod.principleFa}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200">
                      <span className="font-bold text-amber-900 block mb-1">
                        ▲ اشتباه رایج بازاریاب:
                      </span>
                      <p className="text-slate-700">{mod.wrongApproachFa}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200">
                      <span className="font-bold text-emerald-900 block mb-1">
                        ● دیالوگ استاندارد سفیر فروشیار:
                      </span>
                      <p className="text-slate-700">{mod.rightApproachFa}</p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  onClick={async () => {
                    await completeProductTraining(focusedProductId);
                    setActiveSubView('EXAM');
                  }}
                  className="px-5 py-2.5 bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
                >
                  تایید تکمیل آموزش تخصصی {focusedProduct.nameFa} و ورود به آزمون محصول
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSubView === 'EXAM' && (
          <div className="space-y-5 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-bold text-slate-900">
                آزمون تخصصی محصول {focusedProduct.nameFa} (حد نصاب قبولی: ۷۵ از ۱۰۰)
              </h3>
              <span className="text-xs font-mono-tabular text-slate-600">
                نمره ثبت‌شده فعلی در پرونده: {focusedCert.examScore} از ۱۰۰
              </span>
            </div>

            <div className="space-y-4">
              {focusedProduct.examQuestions.map((q, idx) => {
                const chosen = quizAnswers[q.id];
                return (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5"
                  >
                    <p className="text-xs text-slate-500">
                      سوال {idx + 1}: {q.contextFa}
                    </p>
                    <p className="text-sm font-bold text-slate-900">{q.questionFa}</p>
                    <div className="space-y-2 pt-1">
                      {q.options.map((opt) => {
                        const isSelected = chosen === opt.id;
                        return (
                          <button
                            key={opt.id}
                            onClick={() =>
                              setQuizAnswers((prev) => ({ ...prev, [q.id]: opt.id }))
                            }
                            className={`w-full text-right p-3 rounded-lg border text-xs transition-colors ${
                              isSelected
                                ? 'bg-sky-50 border-sky-600 text-slate-900 font-semibold'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {opt.textFa}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-200">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleSubmitProductQuiz}
                  className="px-5 py-2.5 bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
                >
                  ثبت پاسخ‌های آزمون {focusedProduct.nameFa}
                </button>
                <button
                  onClick={() => submitProductExam(focusedProductId, 90)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-xl transition-colors whitespace-nowrap"
                >
                  تست سریع قبولی (نمره ۹۰)
                </button>
                <button
                  onClick={() => submitProductExam(focusedProductId, 65)}
                  className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-medium rounded-xl transition-colors whitespace-nowrap"
                >
                  تست وضعیت رد آزمون (نمره ۶۵ — EXAM_FAILED)
                </button>
              </div>

              {quizResultScore !== null && (
                <span
                  className={`text-xs font-bold ${
                    quizResultScore >= 75 ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  نمره شما: {quizResultScore} از ۱۰۰ (
                  {quizResultScore >= 75 ? '● قبول (EXAM_PASSED)' : '▲ کمتر از ۷۵ (EXAM_FAILED)'})
                </span>
              )}
            </div>
          </div>
        )}

        {activeSubView === 'SIMULATION' && (
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              شبیه‌سازی معامله تخصصی {focusedProduct.nameFa} (Product Simulation)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              طبق بند ۴ معماری Domain Core v4.0، قبولی در آزمون تئوری به تنهایی کافی نیست؛ سفیر باید در محیط شبیه‌سازی فروش، اعتراضات واقعی مشتری {focusedProduct.nameFa} را با موفقیت مدیریت کند.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => onLaunchProductSimulation(focusedProductId)}
                className="px-5 py-2.5 bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
              >
                ورود به اتاق شبیه‌سازی زنده {focusedProduct.nameFa}
              </button>
              <button
                onClick={() =>
                  markProductSimulationOutcome(focusedProductId, true, 88, 0)
                }
                className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
              >
                ثبت قبولی شبیه‌سازی این محصول
              </button>
              <button
                onClick={() =>
                  markProductSimulationOutcome(focusedProductId, false, 45, 2)
                }
                className="px-4 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
              >
                تست وضعیت SIMULATION_FAILED
              </button>
            </div>
          </div>
        )}

        {activeSubView === 'FIELD_EVAL' && (
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              چک‌لیست ارزیابی میدانی {focusedProduct.nameFa} (Field Evaluation Gate)
            </h3>
            <p className="text-xs text-slate-600">
              آخرین گام پیش از صدور گواهینامه نهایی (CERTIFIED) و باز شدن مرز امنیتی authorizeFieldSales:
            </p>

            <div className="space-y-2">
              {focusedProduct.fieldEvaluationChecklist.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-4 text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900">{item.criterionFa}</p>
                    <p className="text-slate-500 mt-0.5">
                      روش راستی‌آزمایی: {item.verificationMethodFa}
                    </p>
                  </div>
                  <span
                    className={`font-semibold whitespace-nowrap ${
                      focusedCert.fieldEvaluationPassed
                        ? 'text-emerald-700'
                        : 'text-slate-500'
                    }`}
                  >
                    {focusedCert.fieldEvaluationPassed ? '● تایید شده' : '○ در انتظار'}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() =>
                  completeProductFieldEvaluation(focusedProductId, true)
                }
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
              >
                تایید ارزیابی میدانی و صدور گواهینامه CERTIFIED
              </button>
              <button
                onClick={() =>
                  completeProductFieldEvaluation(focusedProductId, false)
                }
                className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
              >
                لغو تایید ارزیابی میدانی (تست خطای FIELD_EVALUATION_REQUIRED)
              </button>
            </div>
          </div>
        )}

        {/* Live Security Boundary Status Footer for this Product */}
        <div
          className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
            focusedAuthBoundary.authorized
              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
              : 'bg-amber-50/80 border-amber-300 text-amber-950'
          }`}
        >
          <div className="flex items-center gap-2">
            {focusedAuthBoundary.authorized ? (
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
            )}
            <div>
              <span className="font-bold block">
                وضعیت مرز امنیتی فروش میدانی ({focusedProduct.nameEn}):{' '}
                {focusedAuthBoundary.authorized
                  ? '● مجاز (AUTHORIZED)'
                  : `▲ غیرمجاز — DENY (${focusedAuthBoundary.error})`}
              </span>
              <span>{focusedAuthBoundary.reasonFa}</span>
            </div>
          </div>

          <button
            onClick={() => onInspectAuthorization(focusedProductId)}
            className="px-3.5 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            محاسبه کمیسیون و جزییات مرز امنیتی
          </button>
        </div>
      </div>
    </div>
  );
};
