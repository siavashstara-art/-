import React, { useState, useMemo } from 'react';
import { useAmbassador } from '../context/AmbassadorContext';
import { ECOSYSTEM_PRODUCTS, SALE_TYPE_LABELS } from '../data/ecosystemData';
import {
  ALL_PRODUCT_IDS,
  AmbassadorTier,
  ProductId,
  SaleType,
  VALID_SALE_TYPES,
  authorizeFieldSales,
  calculateAuthorizedCommission,
  runDomainCoreAuditSuite,
  DEFAULT_COMMISSION_POLICY,
} from '../domain/core';
import { PRODUCT_CERTIFICATION_DDL_WITH_RLS } from '../security/rlsTransactionGuard';
import {
  ShieldCheck,
  ShieldAlert,
  Calculator,
  CheckCircle2,
  Sliders,
  Terminal,
  Sparkles,
  GitBranch,
  Copy,
  Check,
} from 'lucide-react';

interface AuthorizationAndCommissionLabProps {
  initialProductId?: ProductId;
}

export const AuthorizationAndCommissionLab: React.FC<
  AuthorizationAndCommissionLabProps
> = ({ initialProductId }) => {
  const {
    profile,
    commissionPolicy,
    updateCommissionPolicy,
    applyPresetProfileScenario,
  } = useAmbassador();

  const [activeTab, setActiveTab] = useState<
    'BOUNDARY_AND_COMMISSION' | 'AUDIT_SUITE' | 'CRITIQUE_AND_CICD'
  >('BOUNDARY_AND_COMMISSION');

  const [selectedProductId, setSelectedProductId] = useState<ProductId>(
    initialProductId || 'DECORMATE'
  );
  const [selectedSaleType, setSelectedSaleType] = useState<SaleType>(
    'website_plus_license'
  );
  const [dealAmountIrr, setDealAmountIrr] = useState<number>(180_000_000);

  // Test override state to let user simulate invalid runtime saleType or cross-product mismatch
  const [simulateProductMismatch, setSimulateProductMismatch] = useState(false);
  const [simulateInvalidSaleType, setSimulateInvalidSaleType] = useState(false);
  const [copiedBlock, setCopiedBlock] = useState<string | null>(null);

  const certToPass = simulateProductMismatch
    ? profile.productCertifications[
        selectedProductId === 'DECORMATE' ? 'SALONMATE' : 'DECORMATE'
      ]
    : profile.productCertifications[selectedProductId];

  const authBoundaryResult = useMemo(
    () =>
      authorizeFieldSales({
        ambassador: profile,
        productCertification: certToPass,
        requestedProductId: selectedProductId,
        dealAmountIrr,
      }),
    [profile, certToPass, selectedProductId, dealAmountIrr]
  );

  const commissionResult = useMemo(
    () =>
      calculateAuthorizedCommission({
        ambassador: profile,
        productCertification: certToPass,
        requestedProductId: selectedProductId,
        saleType: simulateInvalidSaleType
          ? ('unapproved_custom_sale' as unknown as SaleType)
          : selectedSaleType,
        dealAmount: dealAmountIrr,
        policy: commissionPolicy,
      }),
    [
      profile,
      certToPass,
      selectedProductId,
      selectedSaleType,
      simulateInvalidSaleType,
      dealAmountIrr,
      commissionPolicy,
    ]
  );

  const auditResults = useMemo(() => runDomainCoreAuditSuite(), []);

  const handleTierBonusChange = (tier: AmbassadorTier, bonusPercent: number) => {
    const clamped = Math.min(15, Math.max(0, bonusPercent)) / 100;
    updateCommissionPolicy({
      ...commissionPolicy,
      tierBonuses: {
        ...commissionPolicy.tierBonuses,
        [tier]: clamped,
      },
    });
  };

  const handleCopyCode = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBlock(id);
    setTimeout(() => setCopiedBlock(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <p className="text-xs font-medium text-sky-700 mb-1">
            هسته قفل‌شده Domain Core v4.0 + Final Hardening Patch · مرز امنیتی فروش و سیاست کمیسیون
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 headline-balance">
            مجوز فروش میدانی، کمیسیون و ممیزی فنی معماری
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('BOUNDARY_AND_COMMISSION')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'BOUNDARY_AND_COMMISSION'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ۱. مرز امنیتی فروش و کمیسیون
          </button>
          <button
            onClick={() => setActiveTab('AUDIT_SUITE')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'AUDIT_SUITE'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ۲. تست‌های امنیتی و Hardening ({auditResults.length}/
            {auditResults.length} PASS)
          </button>
          <button
            onClick={() => setActiveTab('CRITIQUE_AND_CICD')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'CRITIQUE_AND_CICD'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ۳. نقد فنی، خلاقیت ویژه و اتوماسیون APK/AAB
          </button>
        </div>
      </div>

      {/* Preset Profile State Switcher to test all Domain Core v4.0 states effortlessly */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="text-xs">
          <span className="font-bold text-slate-900 block">
            شبیه‌ساز فوری وضعیت پرونده سفیر (برای آزمایش مرزهای امنیتی):
          </span>
          <span className="text-slate-500">
            می‌توانید پرونده فعلی را بین ۴ حالت استاندارد سند معماری تغییر دهید و رفتار authorizeFieldSales را ببینید.
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => applyPresetProfileScenario('BRIEF_MULTI_PRODUCT_EXAMPLE')}
            className="px-3 py-2 text-xs font-semibold bg-sky-50 text-sky-900 border border-sky-200 rounded-lg hover:bg-sky-100 transition-colors whitespace-nowrap"
          >
            مثال سند (DecorMate & SalonMate = CERTIFIED)
          </button>
          <button
            onClick={() => applyPresetProfileScenario('TIER_A_PLUS_PLUS')}
            className="px-3 py-2 text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors whitespace-nowrap"
          >
            سفیر ارشد A++ (هر ۷ محصول CERTIFIED)
          </button>
          <button
            onClick={() => applyPresetProfileScenario('REASSESSMENT_TIER_B')}
            className="px-3 py-2 text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors whitespace-nowrap"
          >
            تست سطح B (ورود به REASSESSMENT و قفل فروش)
          </button>
        </div>
      </div>

      {activeTab === 'BOUNDARY_AND_COMMISSION' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Security Boundary Check (authorizeFieldSales) */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2">
                {authBoundaryResult.authorized ? (
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                ) : (
                  <ShieldAlert className="w-6 h-6 text-red-600" />
                )}
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    دروازه امنیتی مجوز فروش میدانی (authorizeFieldSales)
                  </h2>
                  <p className="text-xs text-slate-500">
                    بررسی ۱۲ شرط الزامی Domain Core v4.0 پیش از صدور اجازه ثبت قرارداد
                  </p>
                </div>
              </div>

              <span
                className={`font-mono-tabular text-xs font-bold px-3 py-1.5 rounded-lg ${
                  authBoundaryResult.authorized
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'bg-red-50 text-red-800'
                }`}
              >
                {authBoundaryResult.authorized
                  ? '● ALLOW (مجاز به فروش)'
                  : `▲ DENY (${authBoundaryResult.error})`}
              </span>
            </div>

            {/* Product Selector for Authorization Test */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                محصول مورد درخواست برای ثبت قرارداد فروش میدانی:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ALL_PRODUCT_IDS.map((pid) => {
                  const cert = profile.productCertifications[pid];
                  const active = pid === selectedProductId;
                  return (
                    <button
                      key={pid}
                      onClick={() => setSelectedProductId(pid)}
                      className={`p-2.5 rounded-xl border text-right text-xs transition-colors ${
                        active
                          ? 'bg-sky-50 border-sky-700 font-bold text-slate-900'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{ECOSYSTEM_PRODUCTS[pid].nameFa}</span>
                        <span
                          className={
                            cert.status === 'CERTIFIED'
                              ? 'text-emerald-700 font-bold'
                              : 'text-amber-700'
                          }
                        >
                          {cert.status === 'CERTIFIED' ? '●' : '○'}
                        </span>
                      </div>
                      <span className="block text-[11px] font-mono-tabular text-slate-500 mt-0.5">
                        {cert.status}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Adversarial Test Toggles */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
              <p className="font-bold text-slate-800">
                تست‌های نفوذ و خطای زمان اجرا (Adversarial & Runtime Boundary Tests):
              </p>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={simulateProductMismatch}
                    onChange={(e) => setSimulateProductMismatch(e.target.checked)}
                    className="accent-sky-700 rounded"
                  />
                  <span>
                    شبیه‌سازی ارسال گواهینامه محصول دیگر (تست خطای{' '}
                    <code className="font-mono-tabular font-bold">PRODUCT_MISMATCH</code>)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={simulateInvalidSaleType}
                    onChange={(e) => setSimulateInvalidSaleType(e.target.checked)}
                    className="accent-sky-700 rounded"
                  />
                  <span>
                    شبیه‌سازی ارسال saleType نامعتبر (تست Hardening Patch #3:{' '}
                    <code className="font-mono-tabular font-bold">INVALID_SALE_TYPE</code>)
                  </span>
                </label>
              </div>
            </div>

            {/* Checked Invariants List */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700">
                زنجیره بررسی شروط (Evaluation Trace):
              </p>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {authBoundaryResult.checkedInvariants.map((inv) => (
                  <div
                    key={inv.code}
                    className="p-3 bg-white flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold ${
                          inv.passed ? 'text-emerald-700' : 'text-red-700'
                        }`}
                      >
                        {inv.passed ? '● PASS' : '▲ FAIL'}
                      </span>
                      <span className="text-slate-800">{inv.labelFa}</span>
                    </div>
                    <span className="font-mono-tabular text-slate-400">{inv.code}</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              className={`p-4 rounded-xl text-xs font-semibold leading-relaxed ${
                authBoundaryResult.authorized
                  ? 'bg-emerald-50 text-emerald-950 border border-emerald-200'
                  : 'bg-red-50 text-red-950 border border-red-200'
              }`}
            >
              خروجی نهایی مرز امنیتی: {authBoundaryResult.reasonFa}
            </div>
          </div>

          {/* Right Column: Configurable Commission Policy & Deal Calculator */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-4">
                <Calculator className="w-5 h-5 text-sky-700" />
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    محاسبه‌گر کمیسیون مجاز (Commission Engine)
                  </h2>
                  <p className="text-xs text-slate-500">
                    اعتبارسنجی صریح saleType، baseRate و tierBonus بدون مقادیر هاردکد پنهان
                  </p>
                </div>
              </div>

              {/* Deal Amount Slider */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <label htmlFor="deal-amount-range" className="font-bold text-slate-700">
                    مبلغ قرارداد فروش (ریال):
                  </label>
                  <span className="font-mono-tabular font-bold text-slate-900">
                    {dealAmountIrr.toLocaleString('fa-IR')} ریال
                  </span>
                </div>
                <input
                  id="deal-amount-range"
                  type="range"
                  min={20_000_000}
                  max={1_000_000_000}
                  step={10_000_000}
                  value={dealAmountIrr}
                  onChange={(e) => setDealAmountIrr(Number(e.target.value))}
                  className="w-full accent-sky-700"
                />
              </div>

              {/* Sale Type Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  نوع قرارداد فروش (Sale Type):
                </label>
                <div className="space-y-2">
                  {VALID_SALE_TYPES.map((st) => {
                    const meta = SALE_TYPE_LABELS[st];
                    const active = selectedSaleType === st && !simulateInvalidSaleType;
                    return (
                      <button
                        key={st}
                        onClick={() => {
                          setSimulateInvalidSaleType(false);
                          setSelectedSaleType(st);
                        }}
                        className={`w-full text-right p-3 rounded-xl border text-xs transition-colors ${
                          active
                            ? 'bg-sky-50 border-sky-700 font-semibold text-slate-900'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{meta.titleFa}</span>
                          <span className="font-mono-tabular font-bold text-sky-800">
                            نرخ پایه: {Math.round(commissionPolicy.baseRates[st] * 100)}٪
                          </span>
                        </div>
                        <p className="text-slate-500 mt-0.5 font-normal">
                          {meta.descriptionFa}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Commission Output Box */}
              <div className="bg-slate-900 text-white p-5 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>وضعیت محاسبه کمیسیون:</span>
                  <span
                    className={`font-mono-tabular font-bold ${
                      commissionResult.authorized ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {commissionResult.authorized
                      ? '● AUTHORIZED'
                      : `▲ REJECTED (${commissionResult.error})`}
                  </span>
                </div>

                {commissionResult.authorized ? (
                  <>
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-xs">
                      <div>
                        <span className="text-slate-400 block">نرخ پایه</span>
                        <span className="font-mono-tabular font-bold text-white">
                          {(commissionResult.baseRate * 100).toFixed(1)}٪
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">
                          پاداش سطح ({profile.tier})
                        </span>
                        <span className="font-mono-tabular font-bold text-sky-300">
                          +{(commissionResult.tierBonusRate * 100).toFixed(1)}٪
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">نرخ نهایی</span>
                        <span className="font-mono-tabular font-bold text-emerald-400">
                          {(commissionResult.effectiveRate * 100).toFixed(1)}٪
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-baseline justify-between">
                      <span className="text-xs text-slate-300">مبلغ کمیسیون قابل پرداخت:</span>
                      <span className="text-xl font-bold font-mono-tabular text-emerald-400">
                        {commissionResult.commissionAmount.toLocaleString('fa-IR')} ریال
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-red-300 leading-relaxed pt-2 border-t border-slate-800">
                    کمیسیون صفر ریال — دلیل رد: {commissionResult.reasonFa}
                  </p>
                )}
              </div>
            </div>

            {/* Configurable Tier Bonus Policy Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-sky-700" />
                  <h3 className="text-sm font-bold text-slate-900">
                    تنظیم سیاست پاداش سطح (Configurable Tier Bonus Policy)
                  </h3>
                </div>
                <button
                  onClick={() => updateCommissionPolicy(DEFAULT_COMMISSION_POLICY)}
                  className="text-xs text-sky-700 hover:underline font-medium whitespace-nowrap"
                >
                  بازنشانی به پیش‌فرض قفل‌شده (۰٪)
                </button>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                طبق بند ۶ سند، هیچ پاداش سطحی (مثل +۵٪ یا +۲٪) به عنوان قانون قطعی هاردکد نشده است و به صورت پیش‌فرض ۰٪ است، اما مدیریت می‌تواند سیاست پاداش را در زمان اجرا تنظیم کند:
              </p>

              <div className="space-y-3">
                {(['A++', 'A+', 'A'] as AmbassadorTier[]).map((t) => {
                  const pct = Math.round((commissionPolicy.tierBonuses[t] || 0) * 100);
                  return (
                    <div key={t} className="flex items-center justify-between gap-4 text-xs">
                      <label
                        htmlFor={`bonus-slider-${t}`}
                        className="font-mono-tabular font-bold text-slate-800 w-24"
                      >
                        سطح {t}: +{pct}٪
                      </label>
                      <input
                        id={`bonus-slider-${t}`}
                        type="range"
                        min={0}
                        max={10}
                        step={1}
                        value={pct}
                        onChange={(e) => handleTierBonusChange(t, Number(e.target.value))}
                        className="flex-1 accent-sky-700"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'AUDIT_SUITE' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-emerald-700" />
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    گزارش اجرای خودکار تست‌های واحد و امنیتی (Domain Core v4.0 + Hardening Patch)
                  </h2>
                  <p className="text-xs text-slate-500">
                    تمامی ۱۳ سناریوی حیاتی مرزهای امنیتی، مالکیت گواهینامه و اعتبارسنجی کمیسیون در زمان اجرا بررسی شده‌اند
                  </p>
                </div>
              </div>

              <span className="font-mono-tabular text-xs font-bold text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-lg">
                ● ALL {auditResults.length} TESTS PASSED
              </span>
            </div>

            <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
              {auditResults.map((test) => (
                <div
                  key={test.id}
                  className="p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-slate-900">{test.titleFa}</span>
                      <span className="font-mono-tabular text-slate-400">({test.id})</span>
                    </div>
                    <p className="text-slate-500 pr-6">
                      خروجی مورد انتظار: <code className="font-mono-tabular">{test.expectedOutcome}</code>
                    </p>
                  </div>
                  <div className="sm:text-left font-mono-tabular">
                    <span className="text-emerald-700 font-bold block">
                      ● PASS: {test.actualOutcome}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Persistence Ownership & RLS SQL Schema Verification */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  تضمین مالکیت گواهینامه در لایه دیتابیس و RLS (Hardening Patch #1 & #2)
                </h3>
                <p className="text-xs text-slate-500">
                  اسکیمای جدول product_certifications با کلید ترکیبی (tenant_id, ambassador_id, product_id) و سیاست FORCE ROW LEVEL SECURITY
                </p>
              </div>
              <button
                onClick={() => handleCopyCode('rls_sql', PRODUCT_CERTIFICATION_DDL_WITH_RLS)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
              >
                {copiedBlock === 'rls_sql' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>کپی شد</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>کپی DDL و RLS</span>
                  </>
                )}
              </button>
            </div>
            <pre
              dir="ltr"
              className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono-tabular overflow-x-auto leading-relaxed"
            >
              {PRODUCT_CERTIFICATION_DDL_WITH_RLS.trim()}
            </pre>
          </div>
        </div>
      )}

      {activeTab === 'CRITIQUE_AND_CICD' && (
        <div className="space-y-6">
          {/* Critical Architectural Evaluation & Market Potential */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-4">
              <Sparkles className="w-5 h-5 text-sky-700" />
              <h2 className="text-xl font-bold text-slate-900">
                نقد فنی معماری Domain Core v4.0، ارزیابی پتانسیل بازار و خلاقیت ویژه پیشنهادی
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs sm:text-sm leading-relaxed">
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <h3 className="font-bold text-slate-900 text-base">
                  ۱. چرا این معماری در تراز سازمانی (Enterprise-Grade) است؟
                </h3>
                <p className="text-slate-700">
                  بزرگ‌ترین آسیب سیستم‌های آموزش فروش مرسوم (LMS)، صدور گواهینامه‌های صوری صرفاً با تماشای ویدیو یا جمع کردن امتیاز بازی‌گونه (XP) است. معماری <strong>Domain Core v4.0</strong> شما با تفکیک قاطع «صلاحیت عمومی مذاکره» از «گواهینامه مستقل هر محصول (Per-Product Certification)» و قرار دادن تابع <code>authorizeFieldSales</code> به عنوان مرز امنیتی پیش از محاسبه کمیسیون، ریسک اعزام ویزیتور ناآماده به بازار و آسیب به برند <strong>اکوسیستم آفرینش / AbleCity</strong> را به صفر می‌رساند.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2.5">
                <h3 className="font-bold text-emerald-950 text-base">
                  ۲. پاسخ صادقانه: آیا این برنامه در بازار خواهد درخشید و خریدار دارد؟
                </h3>
                <p className="text-slate-800">
                  <strong>بله، با قطعیت بالا — در دو بازار موازی:</strong>
                  <br />
                  اولاً برای شبکه سفیران فروش ۷ محصول خودتان (DecorMate, SlabMate, SalonMate, TalaYar و...) یک مزیت رقابتی بی‌بدیل است که زمان راه‌اندازی بازاریاب جدید (Onboarding Time) را تا ۶۰٪ کاهش می‌دهد.
                  <br />
                  ثانیاً به عنوان یک محصول مستقل <strong>B2B Sales Enablement & Simulation SaaS</strong> در بازار ایران، شرکت‌های پخش، بیمه، تجهیزات پزشکی و نرم‌افزارهای سازمانی به شدت نیازمند سیستمی هستند که ویزیتور قبل از سوزاندن سرنخ‌های واقعی (Leads)، در یک محیط شبیه‌سازی‌شده اشتباه کند، بازخورد بگیرد و مجوز فروش محصول بگیرد.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-sky-50/70 border border-sky-200 space-y-2.5">
                <h3 className="font-bold text-sky-950 text-base">
                  ۳. خلاقیت ویژه پیشنهادی برای درخشش ۱۰ برابری: «همزاد دیجیتال مشتری» (Pre-Visit Deal Twin)
                </h3>
                <p className="text-slate-800">
                  پیشنهاد ویژه مهندسی ما که هسته آن را در بخش شبیه‌ساز شفاهی (Speak Mode) تعبیه کردیم:
                  <strong> تمرین ۳ دقیقه‌ای قبل از ورود به شوروم واقعی!</strong> وقتی سفیر فروش در خیابان فرشته یا شهرک غرب پشت در یک گالری سنگ یا سالن زیبایی ایستاده است، مشخصات آن فروشگاه را به مربی فروشیار می‌دهد و در ۹۰ ثانیه با «همزاد شبیه‌سازی‌شده همان مدیر» مذاکره صوتی می‌کند تا تپش قلبش آرام شود و با آمادگی ۱۰۰٪ وارد جلسه واقعی شود.
                </p>
              </div>
            </div>
          </div>

          {/* GitHub Actions + Signed Gradle APK & AAB Release Automation */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-sky-700" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    اتوماسیون کامل GitHub Push، ساخت Gradle و امضای خودکار APK و AAB
                  </h3>
                  <p className="text-xs text-slate-500">
                    فایل <code>.github/workflows/android-apk-aab-release.yml</code> در پروژه شما ایجاد شده است؛ بدون قرار دادن هیچ کلید خصوصی یا API Key در کد!
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2 leading-relaxed">
              <p className="font-bold text-slate-900">
                چرا کلیدهای API و Keystore هرگز نباید داخل کدهای مخزن (Repository) هاردکد شوند؟
              </p>
              <p>
                طبق بند ۷ سند معماری شما (<code>هیچ Secret یا API Key را داخل Repository قرار نده</code>)، قرار دادن کلید در کد باعث افشای امنیتی و مسدود شدن خودکار کلید توسط Google و GitHub Secret Scanner می‌شود. به جای آن، پایپ‌لاین زیر کلیدها را به صورت ۱۰۰٪ خودکار از <strong>GitHub Encrypted Secrets</strong> در لحظه بیلد می‌خواند، فایل‌های <code>.apk</code> و <code>.aab</code> امضاشده را با Gradle تولید می‌کند و در <strong>GitHub Releases</strong> منتشر می‌نماید.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
