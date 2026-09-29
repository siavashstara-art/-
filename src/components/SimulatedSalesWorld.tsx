import React, { useState, useRef } from 'react';
import {
  SIMULATION_SCENARIOS,
  SalesScenario,
  COACH_AVATAR_PATH,
} from '../data/ecosystemData';
import { useAmbassador } from '../context/AmbassadorContext';
import {
  Volume2,
  Mic,
  MicOff,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Eye,
  Ear,
  MessageSquare,
  Send,
} from 'lucide-react';

interface SimulatedSalesWorldProps {
  initialScenarioId?: string;
  onCompleteNavigate?: (destination: 'products' | 'academy' | 'authorization') => void;
}

export const SimulatedSalesWorld: React.FC<SimulatedSalesWorldProps> = ({
  initialScenarioId,
  onCompleteNavigate,
}) => {
  const {
    profile,
    markGeneralSimulationPassed,
    markProductSimulationOutcome,
  } = useAmbassador();

  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(
    initialScenarioId || SIMULATION_SCENARIOS[0].id
  );

  const scenario: SalesScenario =
    SIMULATION_SCENARIOS.find((s) => s.id === selectedScenarioId) ||
    SIMULATION_SCENARIOS[0];

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStep = scenario.steps[currentStepIndex] || scenario.steps[0];

  // Observe -> Listen -> Choose/Speak state
  const [observedClues, setObservedClues] = useState(true);
  const [interactionMode, setInteractionMode] = useState<'CHOOSE' | 'SPEAK'>('CHOOSE');
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  // Dynamic simulation metrics
  const [trustScore, setTrustScore] = useState<number>(currentStep.initialTrust);
  const [resistanceScore, setResistanceScore] = useState<number>(
    currentStep.initialResistance
  );
  const [mistakesMade, setMistakesMade] = useState<number>(0);
  const [scenarioFinished, setScenarioFinished] = useState<boolean>(false);

  // Consequence & Coach feedback state
  const [activeEvaluation, setActiveEvaluation] = useState<{
    isOptimal: boolean;
    trustDelta: number;
    resistanceDelta: number;
    clientReactionFa: string;
    consequenceVisualFa: string;
    coachFeedbackFa: string;
    spokenTextFa: string;
  } | null>(null);

  // Speech / Voice Input state
  const [customSpeechInput, setCustomSpeechInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isEvaluatingSpeech, setIsEvaluatingSpeech] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [imgError, setImgError] = useState(false);
  const [coachImgError, setCoachImgError] = useState(false);

  const handleSelectScenario = (scen: SalesScenario) => {
    setSelectedScenarioId(scen.id);
    setCurrentStepIndex(0);
    const firstStep = scen.steps[0];
    setTrustScore(firstStep.initialTrust);
    setResistanceScore(firstStep.initialResistance);
    setSelectedOptionId(null);
    setActiveEvaluation(null);
    setMistakesMade(0);
    setScenarioFinished(false);
    setCustomSpeechInput('');
  };

  const handleSpeakClientQuote = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentStep.clientQuoteFa);
      utterance.lang = 'fa-IR';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleChooseOption = (opt: (typeof currentStep.options)[number]) => {
    setSelectedOptionId(opt.id);
    const nextTrust = Math.min(100, Math.max(0, currentStep.initialTrust + opt.trustDelta));
    const nextResistance = Math.min(
      100,
      Math.max(0, currentStep.initialResistance + opt.resistanceDelta)
    );
    setTrustScore(nextTrust);
    setResistanceScore(nextResistance);

    if (!opt.isOptimal) {
      setMistakesMade((prev) => prev + 1);
    }

    setActiveEvaluation({
      isOptimal: opt.isOptimal,
      trustDelta: opt.trustDelta,
      resistanceDelta: opt.resistanceDelta,
      clientReactionFa: opt.clientReactionFa,
      consequenceVisualFa: opt.consequenceVisualFa,
      coachFeedbackFa: opt.coachFeedbackFa,
      spokenTextFa: opt.spokenScriptFa,
    });
  };

  const handleRetryCurrentStep = () => {
    setSelectedOptionId(null);
    setActiveEvaluation(null);
    setTrustScore(currentStep.initialTrust);
    setResistanceScore(currentStep.initialResistance);
  };

  const toggleVoiceRecording = () => {
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setCustomSpeechInput((prev) =>
        prev
          ? prev
          : 'مرورگر شما از تبدیل گفتار مستقیم پشتیبانی نمی‌کند؛ لطفاً جمله مذاکره خود را در این کادر بنویسید.'
      );
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = 'fa-IR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        if (transcript) {
          setCustomSpeechInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsRecording(false);
    }
  };

  const evaluateCustomSpeech = async () => {
    const trimmed = customSpeechInput.trim();
    if (!trimmed) return;
    setIsEvaluatingSpeech(true);

    try {
      const res = await fetch('/api/coach/evaluate-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioTitleFa: scenario.titleFa,
          clientQuoteFa: currentStep.clientQuoteFa,
          clientSubtextFa: currentStep.clientSubtextFa,
          ambassadorSpeechFa: trimmed,
          idealHintFa: currentStep.speechEvaluationRubric.idealHintFa,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const nextTrust = Math.min(
          100,
          Math.max(0, currentStep.initialTrust + Number(data.trustDelta || 0))
        );
        const nextRes = Math.min(
          100,
          Math.max(0, currentStep.initialResistance + Number(data.resistanceDelta || 0))
        );
        setTrustScore(nextTrust);
        setResistanceScore(nextRes);
        if (!data.isOptimal) {
          setMistakesMade((prev) => prev + 1);
        }
        setActiveEvaluation({
          isOptimal: Boolean(data.isOptimal),
          trustDelta: Number(data.trustDelta || 0),
          resistanceDelta: Number(data.resistanceDelta || 0),
          clientReactionFa: data.clientReactionFa,
          consequenceVisualFa: data.consequenceVisualFa,
          coachFeedbackFa: data.coachFeedbackFa,
          spokenTextFa: trimmed,
        });
        setIsEvaluatingSpeech(false);
        return;
      }
    } catch {
      // Fallback to deterministic rubric if offline
    }

    // Deterministic Rubric Fallback
    const rubric = currentStep.speechEvaluationRubric;
    const hasTrap = rubric.forbiddenTrapWordsFa.some((w) => trimmed.includes(w));
    const matchedKeywords = rubric.requiredKeywordsFa.filter((w) => trimmed.includes(w));
    const isOptimal = !hasTrap && matchedKeywords.length >= 2 && trimmed.length >= 25;

    const tDelta = isOptimal ? 24 : -15;
    const rDelta = isOptimal ? -25 : 20;
    setTrustScore(Math.min(100, Math.max(0, currentStep.initialTrust + tDelta)));
    setResistanceScore(Math.min(100, Math.max(0, currentStep.initialResistance + rDelta)));

    if (!isOptimal) {
      setMistakesMade((prev) => prev + 1);
    }

    setActiveEvaluation({
      isOptimal,
      trustDelta: tDelta,
      resistanceDelta: rDelta,
      clientReactionFa: isOptimal
        ? 'مشتری با علاقه سر تکان می‌دهد: «نکته دقیقی را مطرح کردید، از این زاویه به موضوع نگاه نکرده بودم.»'
        : 'مشتری همچنان مردد است: «هنوز متوجه نشدم این دقیقاً چه دردی از کسب‌وکار من دوا می‌کند.»',
      consequenceVisualFa: isOptimal
        ? 'پاسخ شفاهی شما مستقیماً به دغدغه اصلی مشتری متصل شد و مقاومت را شکست.'
        : 'پاسخ شما یا کوتاه بود و یا بدون اشاره به دغدغه اصلی مشتری ارائه شد.',
      coachFeedbackFa: isOptimal
        ? 'آفرین! بیان شفاهی شما محترمانه، دقیق و مبتنی بر ارزش واقعی کسب‌وکار مشتری بود.'
        : `پیشنهاد مربی: ${rubric.idealHintFa}`,
      spokenTextFa: trimmed,
    });
    setIsEvaluatingSpeech(false);
  };

  const handleProceedNextStep = async () => {
    if (currentStepIndex + 1 < scenario.steps.length) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      setSelectedOptionId(null);
      setActiveEvaluation(null);
      setCustomSpeechInput('');
      setTrustScore(scenario.steps[nextIdx].initialTrust);
      setResistanceScore(scenario.steps[nextIdx].initialResistance);
    } else {
      // Scenario Completed! Save outcome to Domain Core v4.0 state
      setScenarioFinished(true);
      const passed = trustScore >= scenario.passingTrustThreshold;
      if (scenario.productId === 'GENERAL') {
        await markGeneralSimulationPassed(trustScore, mistakesMade);
      } else {
        await markProductSimulationOutcome(
          scenario.productId,
          passed,
          trustScore,
          mistakesMade
        );
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Scenario Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <p className="text-xs font-medium text-sky-700 mb-1">
            محیط شبیه‌سازی فروش زنده · چرخه Observe → Listen → Choose → Speak → Feedback → Retry
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 headline-balance">
            میدان تمرین و شبیه‌سازی مذاکره واقعی
          </h1>
        </div>

        {/* Interactive Filter Controls for Scenarios */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 rounded-xl">
          {SIMULATION_SCENARIOS.map((scen) => {
            const active = scen.id === scenario.id;
            return (
              <button
                key={scen.id}
                onClick={() => handleSelectScenario(scen)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {scen.productId === 'GENERAL' ? 'جامع عمومی' : scen.productId} · {scen.clientNameFa}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loop Progress Bar (Teaching & Guiding Animation) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          {[
            { id: 'observe', label: '۱. مشاهده (Observe)', active: observedClues },
            { id: 'listen', label: '۲. شنیدن دغدغه (Listen)', active: true },
            {
              id: 'act',
              label: '۳. انتخاب یا گفتار (Choose / Speak)',
              active: !activeEvaluation,
            },
            {
              id: 'feedback',
              label: '۴. پیامد و بازخورد مربی (Consequence & Feedback)',
              active: Boolean(activeEvaluation),
            },
            {
              id: 'retry',
              label: '۵. اصلاح اشتباه و تثبیت مهارت (Retry & Mastery)',
              active: Boolean(activeEvaluation && !activeEvaluation.isOptimal),
            },
          ].map((phase, idx) => (
            <div
              key={phase.id}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-transform duration-150 ${
                phase.active
                  ? 'bg-sky-50 text-sky-900 font-semibold scale-[1.01]'
                  : 'text-slate-500'
              }`}
            >
              <span>{phase.label}</span>
              {idx < 4 && (
                <span className="text-slate-300 mr-1" aria-hidden="true">
                  ←
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* TWO-ZONE SANDBOX LAYOUT (Education & Simulation Guidelines) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT / TOP ZONE: Interactive Visual Stage (7 cols ~ 60%) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl overflow-hidden">
          {/* Visual Scene Frame with Scrim */}
          <div className="relative h-64 sm:h-72 bg-slate-900 overflow-hidden">
            {!imgError ? (
              <img
                src={scenario.imageUrl}
                alt={scenario.titleFa}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover opacity-85 transition-transform duration-200"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-900 via-sky-950 to-slate-800 flex items-center justify-center p-6 text-center">
                <p className="text-white font-semibold text-lg">{scenario.titleFa}</p>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />

            {/* Top Overlay Metadata (Unboxed text with separators) */}
            <div className="absolute top-4 right-4 left-4 flex items-center justify-between text-xs text-slate-200">
              <div className="flex items-center gap-2 bg-black/45 backdrop-blur-xs px-3 py-1.5 rounded-lg">
                <span>{scenario.locationFa}</span>
                <span aria-hidden="true">·</span>
                <span>سطح دشواری: {scenario.difficultyFa}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular">
                  گام {currentStepIndex + 1} از {scenario.steps.length}
                </span>
              </div>
              <button
                onClick={handleSpeakClientQuote}
                className="flex items-center gap-1.5 bg-white/95 text-slate-900 px-3 py-1.5 rounded-lg font-medium hover:bg-white transition-colors whitespace-nowrap"
                title="پخش صوتی دیالوگ مشتری"
              >
                <Volume2 className="w-3.5 h-3.5 text-sky-700" />
                <span>شنیدن صدای مشتری</span>
              </button>
            </div>

            {/* Bottom Overlay Client Persona */}
            <div className="absolute bottom-4 right-4 left-4 text-white">
              <p className="text-xs text-sky-300 font-medium mb-0.5">
                {scenario.clientNameFa} · {scenario.clientRoleFa}
              </p>
              <h2 className="text-lg sm:text-xl font-bold leading-snug headline-balance">
                {scenario.titleFa}
              </h2>
            </div>
          </div>

          {/* Live Telemetry & Dual-Coded Behavioral Meters (Purposeful Feedback Animation) */}
          <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50/70">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Trust Meter */}
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-slate-700">
                    شاخص اعتماد و درک ارزش مشتری (Trust)
                  </span>
                  <span
                    className={`font-mono-tabular font-semibold ${
                      trustScore >= scenario.passingTrustThreshold
                        ? 'text-emerald-700'
                        : trustScore >= 50
                        ? 'text-sky-700'
                        : 'text-red-700'
                    }`}
                  >
                    {trustScore >= scenario.passingTrustThreshold
                      ? `● مطلوب (${trustScore}٪ / حد نصاب ${scenario.passingTrustThreshold}٪)`
                      : trustScore >= 50
                      ? `◐ در حال شکل‌گیری (${trustScore}٪)`
                      : `▲ بحرانی (${trustScore}٪)`}
                  </span>
                </div>
                <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-transform duration-200 origin-right ${
                      trustScore >= scenario.passingTrustThreshold
                        ? 'bg-emerald-600'
                        : trustScore >= 50
                        ? 'bg-sky-600'
                        : 'bg-red-600'
                    }`}
                    style={{
                      width: `${trustScore}%`,
                    }}
                  />
                </div>
              </div>

              {/* Resistance Meter */}
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-slate-700">
                    گارد دفاعی و مقاومت ذهنی (Resistance)
                  </span>
                  <span
                    className={`font-mono-tabular font-semibold ${
                      resistanceScore <= 35
                        ? 'text-emerald-700'
                        : resistanceScore <= 65
                        ? 'text-amber-700'
                        : 'text-red-700'
                    }`}
                  >
                    {resistanceScore <= 35
                      ? `● گارد باز (${resistanceScore}٪)`
                      : resistanceScore <= 65
                      ? `◐ محتاط (${resistanceScore}٪)`
                      : `▲ گارد بسته (${resistanceScore}٪)`}
                  </span>
                </div>
                <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-transform duration-200 origin-right ${
                      resistanceScore <= 35
                        ? 'bg-emerald-600'
                        : resistanceScore <= 65
                        ? 'bg-amber-500'
                        : 'bg-red-600'
                    }`}
                    style={{
                      width: `${resistanceScore}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Client Dialogue & Subtext Observation Area */}
          <div className="p-5 sm:p-6 space-y-5">
            {/* Step 1: Observe Environmental & Behavioral Cue */}
            <div className="border-r-4 border-sky-600 bg-sky-50/70 p-4 rounded-l-xl">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-900">
                  <Eye className="w-4 h-4 text-sky-700" />
                  <span>مشاهده صحنه و ذهنیت پنهان مشتری (Observe)</span>
                </div>
                <button
                  onClick={() => setObservedClues((prev) => !prev)}
                  className="text-xs text-sky-700 hover:underline font-medium whitespace-nowrap"
                >
                  {observedClues ? 'پنهان کردن تحلیل صحنه' : 'نمایش نشانه‌های محیطی'}
                </button>
              </div>
              {observedClues && (
                <p className="text-sm text-slate-700 leading-relaxed">
                  {currentStep.clientSubtextFa}
                  <span className="block mt-1 text-xs text-slate-500">
                    لحن فعلی مشتری: {currentStep.clientToneFa}
                  </span>
                </p>
              )}
            </div>

            {/* Step 2: Listen to Client Quote */}
            <div className="bg-slate-900 text-white p-5 rounded-xl">
              <div className="flex items-center gap-2 text-xs text-sky-300 mb-2">
                <Ear className="w-4 h-4" />
                <span>سخن مستقیم {scenario.clientNameFa} (Listen):</span>
              </div>
              <p className="text-base sm:text-lg font-medium leading-relaxed">
                {currentStep.clientQuoteFa}
              </p>
            </div>

            {/* Step 4 & 5: Consequence Animation & Coach Feedback (Only appears after user acts) */}
            {activeEvaluation && (
              <div
                className={`p-5 rounded-xl border transition-opacity duration-200 ${
                  activeEvaluation.isOptimal
                    ? 'bg-emerald-50/80 border-emerald-300'
                    : 'bg-amber-50/90 border-amber-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    {activeEvaluation.isOptimal ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
                    )}
                    <h3 className="font-bold text-sm sm:text-base text-slate-900">
                      {activeEvaluation.isOptimal
                        ? 'واکنش مثبت مشتری و جهش اعتماد (پاسخ مشاوره‌ای دقیق)'
                        : 'مشاهده پیامد اشتباه (Make Mistake → Learn → Retry)'}
                    </h3>
                  </div>
                  <span className="font-mono-tabular text-xs font-bold text-slate-700 whitespace-nowrap">
                    تغییر اعتماد: {activeEvaluation.trustDelta > 0 ? `+${activeEvaluation.trustDelta}` : activeEvaluation.trustDelta}٪
                  </span>
                </div>

                <p className="text-xs text-slate-600 mb-2 italic">
                  پاسخ شما: «{activeEvaluation.spokenTextFa}»
                </p>

                <div className="bg-white/90 p-3.5 rounded-lg border border-slate-200/80 mb-3">
                  <p className="text-xs font-bold text-slate-700 mb-1">واکنش مشتری در صحنه:</p>
                  <p className="text-sm text-slate-900 leading-relaxed">
                    {activeEvaluation.clientReactionFa}
                  </p>
                  <p className="text-xs font-semibold text-sky-800 mt-2">
                    تحلیل پیامد (Show Consequence): {activeEvaluation.consequenceVisualFa}
                  </p>
                </div>

                {/* Coach Feedback Box */}
                <div className="flex items-start gap-3 pt-2">
                  {!coachImgError ? (
                    <img
                      src={COACH_AVATAR_PATH}
                      alt="مربی فروشیار"
                      referrerPolicy="no-referrer"
                      onError={() => setCoachImgError(true)}
                      className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-300"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-sky-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      مربی
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-800 mb-0.5">
                      بازخورد مربی فروشیار:
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {activeEvaluation.coachFeedbackFa}
                    </p>
                  </div>
                </div>

                {/* Action Bar: Retry on Mistake OR Proceed on Optimal */}
                <div className="mt-4 pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                  <button
                    onClick={handleRetryCurrentStep}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>تلاش مجدد در همین گام (Retry)</span>
                  </button>

                  {activeEvaluation.isOptimal && !scenarioFinished && (
                    <button
                      onClick={handleProceedNextStep}
                      className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-sky-700 rounded-lg hover:bg-sky-800 transition-colors whitespace-nowrap"
                    >
                      <span>
                        {currentStepIndex + 1 < scenario.steps.length
                          ? 'ادامه به گام بعدی مذاکره'
                          : 'ثبت نهایی نتیجه شبیه‌سازی در پرونده'}
                      </span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Completion Summary Banner */}
            {scenarioFinished && (
              <div className="p-5 rounded-xl bg-slate-900 text-white space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-emerald-400">
                    شبیه‌سازی با موفقیت در Domain Core v4.0 ثبت شد!
                  </h3>
                  <span className="font-mono-tabular text-xs text-slate-300">
                    اعتماد نهایی: {trustScore}٪ · تعداد خطاهای اصلاح‌شده: {mistakesMade}
                  </span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {scenario.productId === 'GENERAL'
                    ? 'شرط قبولی شبیه‌سازی جامع عمومی (General Simulation Passed) در پرونده شما فعال شد. اکنون در صورت کسب نمره ۸۵+ یا ۹۵+ در آزمون جامع، به سطح A+ یا A++ ارتقا می‌یابید.'
                    : `شرط قبولی شبیه‌سازی تخصصی محصول ${scenario.productId} با موفقیت تایید و در گواهینامه مستقل این محصول ثبت گردید.`}
                </p>
                {onCompleteNavigate && (
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      onClick={() =>
                        onCompleteNavigate(
                          scenario.productId === 'GENERAL' ? 'academy' : 'products'
                        )
                      }
                      className="px-4 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors whitespace-nowrap"
                    >
                      {scenario.productId === 'GENERAL'
                        ? 'بازگشت به آزمون جامع آکادمی'
                        : `مشاهده چرخه گواهینامه ${scenario.productId}`}
                    </button>
                    <button
                      onClick={() => onCompleteNavigate('authorization')}
                      className="px-4 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors whitespace-nowrap"
                    >
                      بررسی مرز امنیتی مجوز فروش میدانی
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT / BOTTOM ZONE: Interactive Control & Response Deck (5 cols ~ 40%) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
          <div>
            <span className="text-xs font-semibold text-sky-700 block mb-1">
              {currentStep.stageLabelFa}
            </span>
            <h3 className="text-lg font-bold text-slate-900">
              نوبت تصمیم و بیان شماست (Choose / Speak)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              ماموریت: {scenario.missionBriefFa}
            </p>
          </div>

          {/* Mode Selector: Choose vs Speak */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setInteractionMode('CHOOSE')}
              className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                interactionMode === 'CHOOSE'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              انتخاب تاکتیک مذاکره (Choose)
            </button>
            <button
              onClick={() => setInteractionMode('SPEAK')}
              className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                interactionMode === 'SPEAK'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              بیان شفاهی با میکروفون / متن (Speak)
            </button>
          </div>

          {interactionMode === 'CHOOSE' ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                یکی از رویکردهای زیر را برای پاسخ به {scenario.clientNameFa} انتخاب کنید تا اثر آن را بر اعتماد مشتری ببینید:
              </p>
              {currentStep.options.map((opt, idx) => {
                const isSelected = selectedOptionId === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleChooseOption(opt)}
                    className={`w-full text-right p-4 rounded-xl border transition-colors ${
                      isSelected
                        ? opt.isOptimal
                          ? 'border-emerald-600 bg-emerald-50/50'
                          : 'border-amber-600 bg-amber-50/50'
                        : 'border-slate-200 hover:border-sky-600/60 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                      <span className="font-semibold text-slate-800">
                        گزینه {idx + 1}: {opt.labelFa}
                      </span>
                      {isSelected && (
                        <span
                          className={`font-semibold ${
                            opt.isOptimal ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {opt.isOptimal ? '● رویکرد مشاوره‌ای' : '▲ تله رایج فروش'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {opt.spokenScriptFa}
                    </p>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
                <p className="font-bold text-slate-900">راهنمای بیان شفاهی (Speak Phase):</p>
                <p>{currentStep.speechEvaluationRubric.idealHintFa}</p>
                <p className="text-slate-500 pt-1">
                  کلیدواژه‌های پیشنهادی:{' '}
                  {currentStep.speechEvaluationRubric.requiredKeywordsFa.join(' · ')}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="ambassador-speech-input"
                    className="text-xs font-semibold text-slate-700"
                  >
                    جمله خودتان به مشتری را بگویید یا بنویسید:
                  </label>
                  <button
                    type="button"
                    onClick={toggleVoiceRecording}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      isRecording
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="w-3.5 h-3.5" />
                        <span>توقف ضبط صدا</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5 text-sky-700" />
                        <span>ضبط صوتی با میکروفون (فارسی)</span>
                      </>
                    )}
                  </button>
                </div>

                <textarea
                  id="ambassador-speech-input"
                  rows={4}
                  value={customSpeechInput}
                  onChange={(e) => setCustomSpeechInput(e.target.value)}
                  placeholder="مثال: مهندس جان، کاملاً به زمان شما احترام می‌گذارم؛ اگر مشتریانی که بین دو سرامیک مردد هستند بتوانند در ۵ ثانیه طرح را در خانه خودشان روی تبلت ببینند چقدر روی فروش شوروم اثر می‌گذارد؟"
                  className="w-full rounded-xl border border-slate-300 p-3.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600"
                />

                <button
                  type="button"
                  disabled={isEvaluatingSpeech || !customSpeechInput.trim()}
                  onClick={evaluateCustomSpeech}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-sky-700 hover:bg-sky-800 disabled:bg-slate-300 text-white text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {isEvaluatingSpeech
                      ? 'در حال تحلیل لحن و استدلال توسط مربی فروشیار...'
                      : 'ارزیابی گفتار و مشاهده واکنش مشتری'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Current Ambassador Simulation Status Note */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              <span>سطح فعلی شما: {profile.tier}</span>
            </div>
            <span className="font-mono-tabular">
              سناریوهای تکمیل‌شده: {profile.completedScenariosCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
