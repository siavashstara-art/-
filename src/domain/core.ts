/**
 * DOMAIN CORE v4.0 — LOCKED SPECIFICATION (WITH FINAL HARDENING PATCH)
 * آموزش بازاریابی (فروشیار) — Marketing Training (ForoshYar)
 * اکوسیستم آفرینش / AbleCity / شهر نوآوران AbleCity / توانا / بندستوانا
 *
 * Architectural Guarantees (v4.0 Final Hardened):
 * 1. General Sales Tier is strictly decoupled from Product Certification.
 * 2. Every Ambassador holds independent, concurrent per-product certifications (NEVER reduced to selectedProduct).
 * 3. ProductCertification has explicit ownership (ambassador_id, tenant_id, product_id) verified against authenticated identity & tenant context.
 * 4. authorizeFieldSales is a strict deterministic Security Boundary.
 * 5. Commission Policy is configurable; Tier bonuses default to 0 and are policy-driven business decisions.
 * 6. Commission calculation strictly validates saleType, baseRate, and tierBonus (never silently falls back to 0.25 on invalid saleType; rejects non-finite/invalid rates with machine-readable DomainError).
 * 7. XP, Badges, and Levels never substitute for real General or Product Certification.
 */

export type AmbassadorTier = 'UNRANKED' | 'A++' | 'A+' | 'A' | 'B' | 'C';

export const VALID_AMBASSADOR_TIERS: readonly AmbassadorTier[] = [
  'UNRANKED',
  'A++',
  'A+',
  'A',
  'B',
  'C',
] as const;

export const AUTHORIZED_FIELD_TIERS: readonly AmbassadorTier[] = [
  'A++',
  'A+',
  'A',
] as const;

export type AcademyStage =
  | 'REGISTERED'
  | 'GENERAL_TRAINING'
  | 'GENERAL_EXAM'
  | 'CERTIFIED_GENERAL'
  | 'SPECIALIZED_TRAINING'
  | 'SPECIALIZED_EXAM'
  | 'SIMULATED_DEAL'
  | 'FIELD_EVALUATION'
  | 'CERTIFIED'
  | 'REASSESSMENT';

export type ProductId =
  | 'DECORMATE'
  | 'SLABMATE'
  | 'SALONMATE'
  | 'AUTOBARTER'
  | 'TANARA'
  | 'TALAYAR'
  | 'EVENTMATE';

export const ALL_PRODUCT_IDS: readonly ProductId[] = [
  'DECORMATE',
  'SLABMATE',
  'SALONMATE',
  'AUTOBARTER',
  'TANARA',
  'TALAYAR',
  'EVENTMATE',
] as const;

export type ProductCertificationStatus =
  | 'NOT_STARTED'
  | 'TRAINING'
  | 'EXAM_FAILED'
  | 'EXAM_PASSED'
  | 'SIMULATION_FAILED'
  | 'FIELD_EVALUATION'
  | 'CERTIFIED'
  | 'SUSPENDED';

export type SaleType =
  | 'initial_license'
  | 'website_plus_license'
  | 'annual_renewal'
  | 'cross_module';

export const VALID_SALE_TYPES: readonly SaleType[] = [
  'initial_license',
  'website_plus_license',
  'annual_renewal',
  'cross_module',
] as const;

export type DomainErrorCode =
  | 'INVALID_SCORE'
  | 'INVALID_AMOUNT'
  | 'INVALID_SALE_TYPE'
  | 'INVALID_BASE_RATE'
  | 'INVALID_TIER_BONUS'
  | 'INVALID_COMMISSION_POLICY'
  | 'GENERAL_CERTIFICATION_REQUIRED'
  | 'TIER_NOT_AUTHORIZED'
  | 'REASSESSMENT_REQUIRED'
  | 'TRAINING_REQUIRED'
  | 'PRODUCT_EXAM_REQUIRED'
  | 'SIMULATION_REQUIRED'
  | 'FIELD_EVALUATION_REQUIRED'
  | 'PRODUCT_MISMATCH'
  | 'PRODUCT_NOT_CERTIFIED'
  | 'AMBASSADOR_MISMATCH'
  | 'TENANT_MISMATCH';

export class DomainError extends Error {
  public readonly code: DomainErrorCode;
  public readonly details?: Record<string, unknown>;

  constructor(code: DomainErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Persistence & Domain representation of ProductCertification.
 * Enforces explicit ownership: ambassador_id (ambassadorId), tenant_id (tenantId), product_id (productId).
 */
export interface ProductCertificationRecord {
  ambassadorId: string;
  tenantId: string;
  productId: ProductId;
  // Explicit snake_case aliases for relational/persistence ownership parity
  ambassador_id?: string;
  tenant_id?: string;
  product_id?: ProductId;
  status: ProductCertificationStatus;
  trainingCompleted: boolean;
  trainingProgress: number; // 0 - 100
  examScore: number; // 0 - 100 (requires >= 75)
  simulationPassed: boolean;
  fieldEvaluationPassed: boolean;
  updatedAt: string;
}

export interface AmbassadorDomainProfile {
  uid: string;
  tenantId: string;
  displayName: string;
  email: string;
  academyStage: AcademyStage;
  tier: AmbassadorTier;
  generalTrainingScore: number;
  generalExamScore: number;
  generalSimulationPassed: boolean;
  generalCertified: boolean;
  reassessmentRequired: boolean;
  xp: number;
  completedScenariosCount: number;
  productCertifications: Record<ProductId, ProductCertificationRecord>;
  createdAt: string;
  updatedAt: string;
}

export interface GeneralCertificationOutcome {
  valid: boolean;
  error?: DomainErrorCode;
  tier?: AmbassadorTier;
  generalCertified?: boolean;
  reassessmentRequired?: boolean;
  nextStage?: AcademyStage;
  explanationFa: string;
}

export function isValidScoreNumber(score: unknown): score is number {
  return (
    typeof score === 'number' &&
    !Number.isNaN(score) &&
    Number.isFinite(score) &&
    score >= 0 &&
    score <= 100
  );
}

/**
 * Evaluates General Exam & Simulation according to Locked Domain Core v4.0 rules:
 * - A++: score >= 95 AND generalSimulationPassed
 * - A+:  score >= 85 AND generalSimulationPassed
 * - A:   score >= 70
 * - B:   score >= 50 (Not authorized for field sales -> Reassessment)
 * - C:   score < 50  (Not authorized for field sales -> Reassessment)
 */
export function evaluateGeneralCertification(
  examScore: number,
  generalSimulationPassed: boolean
): GeneralCertificationOutcome {
  if (!isValidScoreNumber(examScore)) {
    return {
      valid: false,
      error: 'INVALID_SCORE',
      explanationFa: 'نمره آزمون عمومی نامعتبر است. نمره باید عددی متناهی بین ۰ تا ۱۰۰ باشد.',
    };
  }

  if (examScore >= 95 && generalSimulationPassed === true) {
    return {
      valid: true,
      tier: 'A++',
      generalCertified: true,
      reassessmentRequired: false,
      nextStage: 'CERTIFIED_GENERAL',
      explanationFa:
        'رتبه A++ احراز شد (نمره ۹۵+ به همراه قبولی در شبیه‌سازی جامع). شما مجوز ورود به مسیرهای تخصصی محصول را دارید.',
    };
  }

  if (examScore >= 85 && generalSimulationPassed === true) {
    return {
      valid: true,
      tier: 'A+',
      generalCertified: true,
      reassessmentRequired: false,
      nextStage: 'CERTIFIED_GENERAL',
      explanationFa:
        'رتبه A+ احراز شد (نمره ۸۵+ به همراه قبولی در شبیه‌سازی جامع). شما مجوز ورود به مسیرهای تخصصی محصول را دارید.',
    };
  }

  if (examScore >= 70) {
    return {
      valid: true,
      tier: 'A',
      generalCertified: true,
      reassessmentRequired: false,
      nextStage: 'CERTIFIED_GENERAL',
      explanationFa: generalSimulationPassed
        ? 'رتبه A احراز شد (نمره ۷۰ تا ۸۴). صلاحیت عمومی شما تایید شد.'
        : 'رتبه A احراز شد (نمره بالای ۷۰، اما برای ارتقا به A+ یا A++ گذراندن شبیه‌سازی جامع الزامی است).',
    };
  }

  if (examScore >= 50) {
    return {
      valid: true,
      tier: 'B',
      generalCertified: false,
      reassessmentRequired: true,
      nextStage: 'REASSESSMENT',
      explanationFa:
        'سطح B (نمره ۵۰ تا ۶۹): طبق قوانین Domain Core v4.0، سطوح B و C مجاز به فروش میدانی نیستند و وارد مرحله بازآموزی و ارزیابی مجدد (REASSESSMENT) می‌شوند.',
    };
  }

  return {
    valid: true,
    tier: 'C',
    generalCertified: false,
    reassessmentRequired: true,
    nextStage: 'REASSESSMENT',
    explanationFa:
      'سطح C (نمره زیر ۵۰): مجوز فروش میدانی صادر نمی‌شود. ورود به چرخه تمرین تعاملی و ارزیابی مجدد (REASSESSMENT) الزامی است.',
  };
}

/**
 * Computes the deterministic ProductCertificationStatus from individual milestones
 */
export function computeProductLifecycleStatus(
  record: Pick<
    ProductCertificationRecord,
    | 'status'
    | 'trainingCompleted'
    | 'trainingProgress'
    | 'examScore'
    | 'simulationPassed'
    | 'fieldEvaluationPassed'
  >,
  attemptedExam: boolean = false,
  attemptedSimulation: boolean = false
): { valid: boolean; error?: DomainErrorCode; status: ProductCertificationStatus; summaryFa: string } {
  if (!isValidScoreNumber(record.examScore)) {
    return {
      valid: false,
      error: 'INVALID_SCORE',
      status: record.status,
      summaryFa: 'نمره آزمون تخصصی محصول نامعتبر است (باید بین ۰ تا ۱۰۰ باشد).',
    };
  }

  if (record.status === 'SUSPENDED') {
    return {
      valid: true,
      status: 'SUSPENDED',
      summaryFa: 'گواهینامه این محصول موقتاً تعلیق شده است.',
    };
  }

  if (!record.trainingCompleted) {
    if (record.trainingProgress > 0) {
      return {
        valid: true,
        status: 'TRAINING',
        summaryFa: `در حال گذراندن آموزش تخصصی محصول (${record.trainingProgress}٪ تکمیل شده).`,
      };
    }
    return {
      valid: true,
      status: 'NOT_STARTED',
      summaryFa: 'آموزش این محصول هنوز آغاز نشده است.',
    };
  }

  if (record.examScore < 75) {
    if (attemptedExam || record.examScore > 0) {
      return {
        valid: true,
        status: 'EXAM_FAILED',
        summaryFa: `نمره آزمون محصول (${record.examScore} از ۱۰۰) کمتر از حد نصاب ۷۵ است. نیاز به آزمون مجدد.`,
      };
    }
    return {
      valid: true,
      status: 'TRAINING',
      summaryFa: 'آموزش تکمیل شده؛ آماده شرکت در آزمون تخصصی محصول (حد نصاب: ۷۵).',
    };
  }

  if (!record.simulationPassed) {
    if (attemptedSimulation) {
      return {
        valid: true,
        status: 'SIMULATION_FAILED',
        summaryFa: 'آزمون تئوری قبول شده، اما سناریوی شبیه‌سازی فروش محصول هنوز با موفقیت طی نشده است.',
      };
    }
    return {
      valid: true,
      status: 'EXAM_PASSED',
      summaryFa: 'آزمون تخصصی محصول با موفقیت گذرانده شد. گام بعدی: شبیه‌سازی معامله محصول.',
    };
  }

  if (!record.fieldEvaluationPassed) {
    return {
      valid: true,
      status: 'FIELD_EVALUATION',
      summaryFa: 'شبیه‌سازی محصول قبول شد. در انتظار تایید ارزیابی میدانی (Field Evaluation).',
    };
  }

  return {
    valid: true,
    status: 'CERTIFIED',
    summaryFa: 'گواهینامه تخصصی فروش این محصول صادر شده است (CERTIFIED).',
  };
}

export interface AuthorizeFieldSalesInput {
  ambassador: Pick<
    AmbassadorDomainProfile,
    'uid' | 'tenantId' | 'tier' | 'academyStage' | 'generalCertified' | 'reassessmentRequired'
  >;
  productCertification: ProductCertificationRecord;
  requestedProductId: ProductId;
  verifiedTenantId?: string; // Optional explicit tenant context check
  dealAmountIrr?: number;
}

export interface AuthorizeFieldSalesResult {
  authorized: boolean;
  error?: DomainErrorCode;
  reasonFa: string;
  checkedInvariants: {
    code: string;
    labelFa: string;
    passed: boolean;
  }[];
}

/**
 * SECURITY BOUNDARY: authorizeFieldSales
 * Enforces every condition of Locked Domain Core v4.0 before allowing a field sale or commission calculation.
 * Explicitly verifies ownership (ambassador_id, tenant_id, product_id).
 */
export function authorizeFieldSales(
  input: AuthorizeFieldSalesInput
): AuthorizeFieldSalesResult {
  const {
    ambassador,
    productCertification,
    requestedProductId,
    verifiedTenantId,
    dealAmountIrr,
  } = input;
  const checks: { code: string; labelFa: string; passed: boolean }[] = [];

  // 1. Validate Score Integrity
  const validScore = isValidScoreNumber(productCertification?.examScore);
  checks.push({
    code: 'SCORE_VALIDITY',
    labelFa: 'صحت ساختار نمره آزمون (۰ تا ۱۰۰)',
    passed: validScore,
  });
  if (!validScore) {
    return {
      authorized: false,
      error: 'INVALID_SCORE',
      reasonFa: 'خطای دامنه (INVALID_SCORE): نمره ثبت‌شده خارج از بازه مجاز ۰ تا ۱۰۰ است.',
      checkedInvariants: checks,
    };
  }

  // 2. Validate Deal Amount if provided
  if (dealAmountIrr !== undefined) {
    const validAmount =
      typeof dealAmountIrr === 'number' &&
      !Number.isNaN(dealAmountIrr) &&
      Number.isFinite(dealAmountIrr) &&
      dealAmountIrr > 0;
    checks.push({
      code: 'AMOUNT_VALIDITY',
      labelFa: 'مبلغ قرارداد معتبر و بزرگتر از صفر',
      passed: validAmount,
    });
    if (!validAmount) {
      return {
        authorized: false,
        error: 'INVALID_AMOUNT',
        reasonFa: 'خطای دامنه (INVALID_AMOUNT): مبلغ معامله باید عددی متناهی، مثبت و معتبر باشد.',
        checkedInvariants: checks,
      };
    }
  }

  // 3. Explicit Ownership Check: Ambassador ID & Tenant Context
  const certAmbassadorId =
    productCertification.ambassador_id ?? productCertification.ambassadorId;
  const certTenantId =
    productCertification.tenant_id ?? productCertification.tenantId;
  const certProductId =
    productCertification.product_id ?? productCertification.productId;

  const expectedTenantId = verifiedTenantId ?? ambassador?.tenantId;
  const tenantMatches =
    Boolean(expectedTenantId) &&
    Boolean(ambassador?.tenantId) &&
    ambassador.tenantId === expectedTenantId &&
    certTenantId === expectedTenantId;

  const ambassadorMatches =
    Boolean(ambassador?.uid) &&
    Boolean(certAmbassadorId) &&
    ambassador.uid === certAmbassadorId;

  checks.push({
    code: 'AMBASSADOR_AND_TENANT_OWNERSHIP',
    labelFa: 'تطابق مالکیت گواهینامه (ambassador_id و tenant_id با هویت احرازشده)',
    passed: ambassadorMatches && tenantMatches,
  });

  if (!ambassadorMatches) {
    return {
      authorized: false,
      error: 'AMBASSADOR_MISMATCH',
      reasonFa:
        'خطای امنیتی (AMBASSADOR_MISMATCH): گواهینامه محصول متعلق به سفیر احرازشده نیست.',
      checkedInvariants: checks,
    };
  }

  if (!tenantMatches) {
    return {
      authorized: false,
      error: 'TENANT_MISMATCH',
      reasonFa:
        'خطای امنیتی (TENANT_MISMATCH): عدم تطابق Tenant گواهینامه محصول با Tenant معتبر سفیر.',
      checkedInvariants: checks,
    };
  }

  // 4. Product ID Match (product_id)
  const isKnownProduct = ALL_PRODUCT_IDS.includes(requestedProductId);
  const productMatches = isKnownProduct && certProductId === requestedProductId;
  checks.push({
    code: 'PRODUCT_MATCH',
    labelFa: `تطابق شناسه محصول درخواستی (${requestedProductId})`,
    passed: productMatches,
  });
  if (!productMatches) {
    return {
      authorized: false,
      error: 'PRODUCT_MISMATCH',
      reasonFa: `خطای دامنه (PRODUCT_MISMATCH): گواهینامه ارسال‌شده برای ${certProductId} است اما درخواست فروش برای ${requestedProductId} ثبت شده است.`,
      checkedInvariants: checks,
    };
  }

  // 5. Reassessment Guard
  const notInReassessment =
    !ambassador.reassessmentRequired && ambassador.academyStage !== 'REASSESSMENT';
  checks.push({
    code: 'NO_REASSESSMENT',
    labelFa: 'عدم قرارگیری سفیر در وضعیت بازآموزی (REASSESSMENT)',
    passed: notInReassessment,
  });
  if (!notInReassessment) {
    return {
      authorized: false,
      error: 'REASSESSMENT_REQUIRED',
      reasonFa:
        'خطای دامنه (REASSESSMENT_REQUIRED): سفیر در وضعیت نیاز به ارزیابی مجدد قرار دارد و تا زمان قبولی مجدد مجاز به فروش میدانی نیست.',
      checkedInvariants: checks,
    };
  }

  // 6. General Certification Guard
  const hasGeneralCert = ambassador.generalCertified === true;
  checks.push({
    code: 'GENERAL_CERTIFIED',
    labelFa: 'دارا بودن گواهینامه عمومی فروش معتبر',
    passed: hasGeneralCert,
  });
  if (!hasGeneralCert) {
    return {
      authorized: false,
      error: 'GENERAL_CERTIFICATION_REQUIRED',
      reasonFa:
        'خطای دامنه (GENERAL_CERTIFICATION_REQUIRED): گواهینامه عمومی فروش هنوز دریافت نشده است. XP یا سطح تمرینی جایگزین گواهینامه نیست.',
      checkedInvariants: checks,
    };
  }

  // 7. Authorized Tier Guard (A, A+, A++ only; B and C denied)
  const authorizedTier =
    ambassador.tier === 'A' || ambassador.tier === 'A+' || ambassador.tier === 'A++';
  checks.push({
    code: 'TIER_AUTHORIZED',
    labelFa: 'سطح سفیر در رده مجاز (A / A+ / A++)',
    passed: authorizedTier,
  });
  if (!authorizedTier) {
    return {
      authorized: false,
      error: 'TIER_NOT_AUTHORIZED',
      reasonFa: `خطای دامنه (TIER_NOT_AUTHORIZED): سطح فعلی سفیر (${ambassador.tier}) مجاز به فروش میدانی نیست. فقط سطوح A، A+ و A++ مجاز هستند.`,
      checkedInvariants: checks,
    };
  }

  // 8. Product Training Completed
  const trainingDone = productCertification.trainingCompleted === true;
  checks.push({
    code: 'PRODUCT_TRAINING',
    labelFa: 'تکمیل آموزش تخصصی محصول',
    passed: trainingDone,
  });
  if (!trainingDone) {
    return {
      authorized: false,
      error: 'TRAINING_REQUIRED',
      reasonFa:
        'خطای دامنه (TRAINING_REQUIRED): آموزش تخصصی این محصول هنوز به پایان نرسیده است.',
      checkedInvariants: checks,
    };
  }

  // 9. Product Exam Score >= 75
  const examPassed = productCertification.examScore >= 75;
  checks.push({
    code: 'PRODUCT_EXAM',
    labelFa: 'کسب حداقل نمره ۷۵ در آزمون تخصصی محصول',
    passed: examPassed,
  });
  if (!examPassed) {
    return {
      authorized: false,
      error: 'PRODUCT_EXAM_REQUIRED',
      reasonFa: `خطای دامنه (PRODUCT_EXAM_REQUIRED): نمره آزمون تخصصی محصول (${productCertification.examScore}) کمتر از حد نصاب ۷۵ است.`,
      checkedInvariants: checks,
    };
  }

  // 10. Product Simulation Passed
  const simPassed = productCertification.simulationPassed === true;
  checks.push({
    code: 'PRODUCT_SIMULATION',
    labelFa: 'قبولی در شبیه‌سازی فروش تخصصی محصول',
    passed: simPassed,
  });
  if (!simPassed) {
    return {
      authorized: false,
      error: 'SIMULATION_REQUIRED',
      reasonFa:
        'خطای دامنه (SIMULATION_REQUIRED): شبیه‌سازی عملی مذاکره برای این محصول هنوز با موفقیت گذرانده نشده است.',
      checkedInvariants: checks,
    };
  }

  // 11. Field Evaluation Passed
  const fieldEvalPassed = productCertification.fieldEvaluationPassed === true;
  checks.push({
    code: 'FIELD_EVALUATION',
    labelFa: 'تایید ارزیابی میدانی (Field Evaluation)',
    passed: fieldEvalPassed,
  });
  if (!fieldEvalPassed) {
    return {
      authorized: false,
      error: 'FIELD_EVALUATION_REQUIRED',
      reasonFa:
        'خطای دامنه (FIELD_EVALUATION_REQUIRED): ارزیابی میدانی این محصول هنوز تایید نشده است.',
      checkedInvariants: checks,
    };
  }

  // 12. Product Certification Status === CERTIFIED
  const isCertifiedStatus = productCertification.status === 'CERTIFIED';
  checks.push({
    code: 'PRODUCT_STATUS_CERTIFIED',
    labelFa: 'وضعیت نهایی گواهینامه محصول = CERTIFIED',
    passed: isCertifiedStatus,
  });
  if (!isCertifiedStatus) {
    return {
      authorized: false,
      error: 'PRODUCT_NOT_CERTIFIED',
      reasonFa: `خطای دامنه (PRODUCT_NOT_CERTIFIED): وضعیت گواهینامه محصول (${productCertification.status}) برابر با CERTIFIED نیست.`,
      checkedInvariants: checks,
    };
  }

  return {
    authorized: true,
    reasonFa: `مجوز فروش میدانی محصول ${requestedProductId} برای سفیر سطح ${ambassador.tier} با موفقیت تایید شد.`,
    checkedInvariants: checks,
  };
}

/**
 * CONFIGURABLE COMMISSION POLICY (Domain Core v4.0 Section 6 + Hardening Patch #3)
 * Base rates are initialized per specification; Tier bonuses are strictly configurable
 * and default to 0.
 * NEVER silently falls back to 0.25 for an invalid runtime saleType.
 */
export interface CommissionPolicy {
  baseRates: Record<SaleType, number>;
  tierBonuses: Record<AmbassadorTier, number>;
  maxEffectiveRate: number;
}

export const DEFAULT_COMMISSION_POLICY: CommissionPolicy = {
  baseRates: {
    initial_license: 0.25, // 25%
    website_plus_license: 0.30, // 30%
    annual_renewal: 0.15, // 15%
    cross_module: 0.35, // 35%
  },
  // Tier bonus is a configurable business decision, defaulting to 0 for all tiers
  tierBonuses: {
    UNRANKED: 0,
    'A++': 0,
    'A+': 0,
    A: 0,
    B: 0,
    C: 0,
  },
  maxEffectiveRate: 1.0,
};

export function isValidSaleType(value: unknown): value is SaleType {
  return typeof value === 'string' && (VALID_SALE_TYPES as readonly string[]).includes(value);
}

export function validateCommissionRateValue(
  rate: unknown,
  errorCode: 'INVALID_BASE_RATE' | 'INVALID_TIER_BONUS'
): number {
  if (
    typeof rate !== 'number' ||
    Number.isNaN(rate) ||
    !Number.isFinite(rate) ||
    rate < 0 ||
    rate > 1
  ) {
    throw new DomainError(
      errorCode,
      `Invalid commission rate (${errorCode}): rate must be a finite number between 0 and 1, received ${String(
        rate
      )}`,
      { rate }
    );
  }
  return rate;
}

/**
 * Strict, standalone Commission Calculator (Hardening Patch #3):
 * - Validates saleType explicitly (never falls back to 0.25 on invalid saleType)
 * - Validates baseRate and tierBonus explicitly (rejects NaN, Infinity, negative, or > 1)
 * - Throws machine-readable DomainError on invalid inputs
 */
export function calculateStrictCommission(params: {
  amount: number;
  saleType: unknown;
  tier: AmbassadorTier;
  policy?: CommissionPolicy;
}): {
  saleType: SaleType;
  baseRate: number;
  tierBonusRate: number;
  effectiveRate: number;
  commissionAmount: number;
} {
  const { amount, saleType, tier, policy = DEFAULT_COMMISSION_POLICY } = params;

  if (
    typeof amount !== 'number' ||
    Number.isNaN(amount) ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    throw new DomainError(
      'INVALID_AMOUNT',
      'مبلغ معامله نامعتبر است؛ مبلغ باید عددی متناهی و بزرگتر از صفر باشد.',
      { amount }
    );
  }

  // 1. Validate saleType strictly — NEVER fallback to 0.25
  if (!isValidSaleType(saleType)) {
    throw new DomainError(
      'INVALID_SALE_TYPE',
      `نوع فروش نامعتبر است (${String(saleType)}). مقادیر مجاز: ${VALID_SALE_TYPES.join(', ')}`,
      { saleType }
    );
  }

  if (!policy || typeof policy !== 'object' || !policy.baseRates || !policy.tierBonuses) {
    throw new DomainError(
      'INVALID_COMMISSION_POLICY',
      'سیاست کمیسیون (CommissionPolicy) ساختار معتبری ندارد.'
    );
  }

  // 2. Validate baseRate strictly
  const rawBaseRate = (policy.baseRates as Record<string, unknown>)[saleType];
  const baseRate = validateCommissionRateValue(rawBaseRate, 'INVALID_BASE_RATE');

  // 3. Validate tierBonus strictly
  const rawTierBonus = (policy.tierBonuses as Record<string, unknown>)[tier];
  const tierBonusRate = validateCommissionRateValue(rawTierBonus, 'INVALID_TIER_BONUS');

  const combinedRate = baseRate + tierBonusRate;
  if (!Number.isFinite(combinedRate) || combinedRate < 0 || combinedRate > 1) {
    throw new DomainError(
      'INVALID_COMMISSION_POLICY',
      `مجموع نرخ پایه و پاداش سطح (${combinedRate}) خارج از بازه مجاز ۰ تا ۱ است.`,
      { baseRate, tierBonusRate, combinedRate }
    );
  }

  const maxCap =
    typeof policy.maxEffectiveRate === 'number' &&
    Number.isFinite(policy.maxEffectiveRate) &&
    policy.maxEffectiveRate > 0 &&
    policy.maxEffectiveRate <= 1
      ? policy.maxEffectiveRate
      : 1.0;

  if (combinedRate > maxCap) {
    throw new DomainError(
      'INVALID_COMMISSION_POLICY',
      `نرخ موثر کمیسیون (${combinedRate}) از سقف مجاز سیاست (${maxCap}) بیشتر است.`,
      { combinedRate, maxCap }
    );
  }

  const effectiveRate = Number(combinedRate.toFixed(6));
  const commissionAmount = Math.round(amount * effectiveRate);

  return {
    saleType,
    baseRate,
    tierBonusRate,
    effectiveRate,
    commissionAmount,
  };
}

export interface CommissionCalculationResult {
  authorized: boolean;
  error?: DomainErrorCode;
  reasonFa: string;
  baseRate: number;
  tierBonusRate: number;
  effectiveRate: number;
  commissionAmount: number;
  dealAmount: number;
  saleType: SaleType;
  productId: ProductId;
}

export function calculateAuthorizedCommission(params: {
  ambassador: AuthorizeFieldSalesInput['ambassador'];
  productCertification: ProductCertificationRecord;
  requestedProductId: ProductId;
  saleType: SaleType;
  dealAmount: number;
  policy?: CommissionPolicy;
}): CommissionCalculationResult {
  const {
    ambassador,
    productCertification,
    requestedProductId,
    saleType,
    dealAmount,
    policy = DEFAULT_COMMISSION_POLICY,
  } = params;

  const authCheck = authorizeFieldSales({
    ambassador,
    productCertification,
    requestedProductId,
    dealAmountIrr: dealAmount,
  });

  if (!authCheck.authorized) {
    return {
      authorized: false,
      error: authCheck.error,
      reasonFa: authCheck.reasonFa,
      baseRate: 0,
      tierBonusRate: 0,
      effectiveRate: 0,
      commissionAmount: 0,
      dealAmount: dealAmount > 0 ? dealAmount : 0,
      saleType,
      productId: requestedProductId,
    };
  }

  try {
    const calc = calculateStrictCommission({
      amount: dealAmount,
      saleType,
      tier: ambassador.tier,
      policy,
    });

    return {
      authorized: true,
      reasonFa: 'محاسبه کمیسیون پس از تایید کامل مرز امنیتی authorizeFieldSales و اعتبارسنجی نرخ‌ها انجام شد.',
      baseRate: calc.baseRate,
      tierBonusRate: calc.tierBonusRate,
      effectiveRate: calc.effectiveRate,
      commissionAmount: calc.commissionAmount,
      dealAmount,
      saleType: calc.saleType,
      productId: requestedProductId,
    };
  } catch (err) {
    if (err instanceof DomainError) {
      return {
        authorized: false,
        error: err.code,
        reasonFa: err.message,
        baseRate: 0,
        tierBonusRate: 0,
        effectiveRate: 0,
        commissionAmount: 0,
        dealAmount: dealAmount > 0 ? dealAmount : 0,
        saleType,
        productId: requestedProductId,
      };
    }
    throw err;
  }
}

export function createInitialProductCertifications(
  ambassadorId: string,
  tenantId: string
): Record<ProductId, ProductCertificationRecord> {
  const now = new Date().toISOString();
  const map = {} as Record<ProductId, ProductCertificationRecord>;
  for (const pid of ALL_PRODUCT_IDS) {
    map[pid] = {
      ambassadorId,
      tenantId,
      productId: pid,
      ambassador_id: ambassadorId,
      tenant_id: tenantId,
      product_id: pid,
      status: 'NOT_STARTED',
      trainingCompleted: false,
      trainingProgress: 0,
      examScore: 0,
      simulationPassed: false,
      fieldEvaluationPassed: false,
      updatedAt: now,
    };
  }
  return map;
}

export interface AuditTestCaseResult {
  id: string;
  titleFa: string;
  expectedOutcome: string;
  actualOutcome: string;
  passed: boolean;
}

/**
 * Runs a live verification suite against Domain Core v4.0 invariants + Final Hardening Patch
 */
export function runDomainCoreAuditSuite(): AuditTestCaseResult[] {
  const baseAmbassador: AuthorizeFieldSalesInput['ambassador'] = {
    uid: 'amb_test_01',
    tenantId: 'tenant_ablecity',
    tier: 'A+',
    academyStage: 'CERTIFIED',
    generalCertified: true,
    reassessmentRequired: false,
  };

  const baseCert: ProductCertificationRecord = {
    ambassadorId: 'amb_test_01',
    tenantId: 'tenant_ablecity',
    productId: 'DECORMATE',
    ambassador_id: 'amb_test_01',
    tenant_id: 'tenant_ablecity',
    product_id: 'DECORMATE',
    status: 'CERTIFIED',
    trainingCompleted: true,
    trainingProgress: 100,
    examScore: 88,
    simulationPassed: true,
    fieldEvaluationPassed: true,
    updatedAt: new Date().toISOString(),
  };

  const results: AuditTestCaseResult[] = [];

  // 1. A++ requires >=95 and simulation
  const genApp = evaluateGeneralCertification(96, true);
  results.push({
    id: 'GEN_A_PLUS_PLUS',
    titleFa: 'احراز رتبه A++ با نمره ۹۶ و قبولی شبیه‌سازی جامع',
    expectedOutcome: 'tier = A++, generalCertified = true',
    actualOutcome: `tier = ${genApp.tier}, generalCertified = ${genApp.generalCertified}`,
    passed: genApp.tier === 'A++' && genApp.generalCertified === true,
  });

  // 2. Score 96 WITHOUT simulation drops to A
  const genNoSim = evaluateGeneralCertification(96, false);
  results.push({
    id: 'GEN_HIGH_SCORE_NO_SIM',
    titleFa: 'نمره ۹۶ بدون شبیه‌سازی جامع (عدم اعطای کاذب A++)',
    expectedOutcome: 'tier = A',
    actualOutcome: `tier = ${genNoSim.tier}`,
    passed: genNoSim.tier === 'A',
  });

  // 3. Tier B enters Reassessment
  const genB = evaluateGeneralCertification(62, true);
  results.push({
    id: 'GEN_TIER_B_REASSESSMENT',
    titleFa: 'نمره ۶۲ (سطح B) → ورود خودکار به REASSESSMENT و عدم مجوز فروش',
    expectedOutcome: 'tier = B, reassessmentRequired = true',
    actualOutcome: `tier = ${genB.tier}, reassessmentRequired = ${genB.reassessmentRequired}`,
    passed: genB.tier === 'B' && genB.reassessmentRequired === true && !genB.generalCertified,
  });

  // 4. Error: AMBASSADOR_MISMATCH
  const errAmb = authorizeFieldSales({
    ambassador: baseAmbassador,
    productCertification: {
      ...baseCert,
      ambassadorId: 'other_amb',
      ambassador_id: 'other_amb',
    },
    requestedProductId: 'DECORMATE',
  });
  results.push({
    id: 'BOUNDARY_AMBASSADOR_MISMATCH',
    titleFa: 'مرز امنیتی مالکیت: عدم تطابق ambassador_id گواهینامه با سفیر احرازشده',
    expectedOutcome: 'DENY (AMBASSADOR_MISMATCH)',
    actualOutcome: `${errAmb.authorized ? 'ALLOW' : 'DENY'} (${errAmb.error})`,
    passed: !errAmb.authorized && errAmb.error === 'AMBASSADOR_MISMATCH',
  });

  // 5. Error: TENANT_MISMATCH
  const errTenant = authorizeFieldSales({
    ambassador: baseAmbassador,
    productCertification: {
      ...baseCert,
      tenantId: 'other_tenant',
      tenant_id: 'other_tenant',
    },
    requestedProductId: 'DECORMATE',
    verifiedTenantId: 'tenant_ablecity',
  });
  results.push({
    id: 'BOUNDARY_TENANT_MISMATCH',
    titleFa: 'مرز امنیتی ایزولاسیون: عدم تطابق tenant_id گواهینامه با Tenant احرازشده',
    expectedOutcome: 'DENY (TENANT_MISMATCH)',
    actualOutcome: `${errTenant.authorized ? 'ALLOW' : 'DENY'} (${errTenant.error})`,
    passed: !errTenant.authorized && errTenant.error === 'TENANT_MISMATCH',
  });

  // 6. Error: PRODUCT_MISMATCH
  const errProd = authorizeFieldSales({
    ambassador: baseAmbassador,
    productCertification: baseCert,
    requestedProductId: 'SALONMATE',
  });
  results.push({
    id: 'BOUNDARY_PRODUCT_MISMATCH',
    titleFa: 'مرز امنیتی: تلاش برای فروش SALONMATE با گواهینامه DECORMATE',
    expectedOutcome: 'DENY (PRODUCT_MISMATCH)',
    actualOutcome: `${errProd.authorized ? 'ALLOW' : 'DENY'} (${errProd.error})`,
    passed: !errProd.authorized && errProd.error === 'PRODUCT_MISMATCH',
  });

  // 7. Error: REASSESSMENT_REQUIRED
  const errReassess = authorizeFieldSales({
    ambassador: { ...baseAmbassador, reassessmentRequired: true },
    productCertification: baseCert,
    requestedProductId: 'DECORMATE',
  });
  results.push({
    id: 'BOUNDARY_REASSESSMENT',
    titleFa: 'مرز امنیتی: مسدودسازی سفیر در وضعیت REASSESSMENT',
    expectedOutcome: 'DENY (REASSESSMENT_REQUIRED)',
    actualOutcome: `${errReassess.authorized ? 'ALLOW' : 'DENY'} (${errReassess.error})`,
    passed: !errReassess.authorized && errReassess.error === 'REASSESSMENT_REQUIRED',
  });

  // 8. Error: TIER_NOT_AUTHORIZED
  const errTier = authorizeFieldSales({
    ambassador: { ...baseAmbassador, tier: 'B' },
    productCertification: baseCert,
    requestedProductId: 'DECORMATE',
  });
  results.push({
    id: 'BOUNDARY_TIER_B',
    titleFa: 'مرز امنیتی: جلوگیری از فروش میدانی توسط سطح B',
    expectedOutcome: 'DENY (TIER_NOT_AUTHORIZED)',
    actualOutcome: `${errTier.authorized ? 'ALLOW' : 'DENY'} (${errTier.error})`,
    passed: !errTier.authorized && errTier.error === 'TIER_NOT_AUTHORIZED',
  });

  // 9. Error: PRODUCT_EXAM_REQUIRED (<75)
  const errExam = authorizeFieldSales({
    ambassador: baseAmbassador,
    productCertification: { ...baseCert, examScore: 74 },
    requestedProductId: 'DECORMATE',
  });
  results.push({
    id: 'BOUNDARY_PRODUCT_EXAM_74',
    titleFa: 'مرز امنیتی: رد فروش با نمره آزمون محصول ۷۴ (حد نصاب ۷۵)',
    expectedOutcome: 'DENY (PRODUCT_EXAM_REQUIRED)',
    actualOutcome: `${errExam.authorized ? 'ALLOW' : 'DENY'} (${errExam.error})`,
    passed: !errExam.authorized && errExam.error === 'PRODUCT_EXAM_REQUIRED',
  });

  // 10. Error: FIELD_EVALUATION_REQUIRED
  const errField = authorizeFieldSales({
    ambassador: baseAmbassador,
    productCertification: { ...baseCert, fieldEvaluationPassed: false },
    requestedProductId: 'DECORMATE',
  });
  results.push({
    id: 'BOUNDARY_FIELD_EVAL',
    titleFa: 'مرز امنیتی: الزام ارزیابی میدانی حتی پس از قبولی آزمون و شبیه‌سازی',
    expectedOutcome: 'DENY (FIELD_EVALUATION_REQUIRED)',
    actualOutcome: `${errField.authorized ? 'ALLOW' : 'DENY'} (${errField.error})`,
    passed: !errField.authorized && errField.error === 'FIELD_EVALUATION_REQUIRED',
  });

  // 11. Hardening Patch #3: Reject Invalid saleType (Never fallback to 0.25)
  const invalidSaleTypeRes = calculateAuthorizedCommission({
    ambassador: baseAmbassador,
    productCertification: baseCert,
    requestedProductId: 'DECORMATE',
    saleType: 'invalid_runtime_sale_type' as unknown as SaleType,
    dealAmount: 100_000_000,
  });
  results.push({
    id: 'HARDENING_REJECT_INVALID_SALETYPE',
    titleFa: 'اعتبارسنجی کمیسیون: رد صریح saleType نامعتبر بدون Fallback پنهان به ۲۵٪',
    expectedOutcome: 'DENY (INVALID_SALE_TYPE)',
    actualOutcome: `${invalidSaleTypeRes.authorized ? 'ALLOW' : 'DENY'} (${invalidSaleTypeRes.error})`,
    passed:
      !invalidSaleTypeRes.authorized && invalidSaleTypeRes.error === 'INVALID_SALE_TYPE',
  });

  // 12. Hardening Patch #3: Reject Non-Finite / Invalid tierBonus or baseRate
  const corruptedPolicy: CommissionPolicy = {
    ...DEFAULT_COMMISSION_POLICY,
    tierBonuses: {
      ...DEFAULT_COMMISSION_POLICY.tierBonuses,
      'A+': Number.NaN,
    },
  };
  const invalidBonusRes = calculateAuthorizedCommission({
    ambassador: baseAmbassador,
    productCertification: baseCert,
    requestedProductId: 'DECORMATE',
    saleType: 'initial_license',
    dealAmount: 100_000_000,
    policy: corruptedPolicy,
  });
  results.push({
    id: 'HARDENING_REJECT_NAN_TIER_BONUS',
    titleFa: 'اعتبارسنجی کمیسیون: رد صریح tierBonus نامتناهی (NaN / منفی / بالای ۱)',
    expectedOutcome: 'DENY (INVALID_TIER_BONUS)',
    actualOutcome: `${invalidBonusRes.authorized ? 'ALLOW' : 'DENY'} (${invalidBonusRes.error})`,
    passed:
      !invalidBonusRes.authorized && invalidBonusRes.error === 'INVALID_TIER_BONUS',
  });

  // 13. Valid Multi-Product Authorization & Commission Calculation
  const validComm = calculateAuthorizedCommission({
    ambassador: baseAmbassador,
    productCertification: baseCert,
    requestedProductId: 'DECORMATE',
    saleType: 'website_plus_license',
    dealAmount: 100_000_000,
  });
  results.push({
    id: 'VALID_COMMISSION_CALC',
    titleFa: 'محاسبه کمیسیون مجاز (وب‌سایت + لایسنس = ۳۰٪ پایه، پاداش سطح پیش‌فرض = ۰٪)',
    expectedOutcome: 'ALLOW, effectiveRate = 0.30, commission = 30000000',
    actualOutcome: `${validComm.authorized ? 'ALLOW' : 'DENY'}, rate = ${validComm.effectiveRate}, comm = ${validComm.commissionAmount}`,
    passed:
      validComm.authorized &&
      validComm.effectiveRate === 0.30 &&
      validComm.commissionAmount === 30_000_000,
  });

  return results;
}
