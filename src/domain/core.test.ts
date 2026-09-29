import assert from 'node:assert/strict';
import {
  ALL_PRODUCT_IDS,
  DEFAULT_COMMISSION_POLICY,
  DomainError,
  ProductCertificationRecord,
  SaleType,
  authorizeFieldSales,
  calculateAuthorizedCommission,
  calculateStrictCommission,
  computeProductLifecycleStatus,
  createInitialProductCertifications,
  evaluateGeneralCertification,
  runDomainCoreAuditSuite,
} from './core.ts';
import {
  DbClientLike,
  DbPoolLike,
  ProductCertificationRepository,
  executeSecureRlsTransaction,
} from '../security/rlsTransactionGuard.ts';

interface TestRecord {
  name: string;
  passed: boolean;
  detail: string;
}

async function runCompleteSecurityAndUnitTestSuite() {
  const results: TestRecord[] = [];

  function recordTest(name: string, fn: () => void | Promise<void>) {
    return (async () => {
      try {
        await fn();
        results.push({ name, passed: true, detail: 'PASS' });
      } catch (err) {
        results.push({
          name,
          passed: false,
          detail: err instanceof Error ? err.message : String(err),
        });
      }
    })();
  }

  // =========================================================================
  // SUITE 1: HARDENING PATCH #1 — TRANSACTION SAFETY (RLS LIFECYCLE)
  // =========================================================================
  await recordTest(
    'Hardening #1.1: Transaction commits on success, sets app.current_tenant_id, and releases client exactly once',
    async () => {
      const executedQueries: { sql: string; params?: unknown[] }[] = [];
      let releaseCount = 0;

      const mockClient: DbClientLike = {
        query: async (sql, params) => {
          executedQueries.push({ sql, params });
          return { rows: [{ ok: 1 }] };
        },
        release: () => {
          releaseCount += 1;
        },
      };

      const mockPool: DbPoolLike = {
        connect: async () => mockClient,
      };

      const output = await executeSecureRlsTransaction(
        mockPool,
        {
          ambassadorId: 'amb_verified_100',
          tenantId: 'tenant_ablecity_main',
          emailVerified: true,
        },
        async (ctx) => {
          assert.equal(ctx.getState(), 'ACTIVE');
          await ctx.client.query('SELECT 1 FROM product_certifications');
          return 'HANDLER_DONE';
        }
      );

      assert.equal(output, 'HANDLER_DONE');
      assert.equal(releaseCount, 1, 'Client must be released exactly once');
      assert.equal(executedQueries[0].sql, 'BEGIN');
      assert.equal(
        executedQueries[1].sql,
        "SELECT set_config('app.current_tenant_id', $1, true)"
      );
      assert.deepEqual(executedQueries[1].params, ['tenant_ablecity_main']);
      assert.equal(
        executedQueries[2].sql,
        "SELECT set_config('app.current_ambassador_id', $1, true)"
      );
      assert.deepEqual(executedQueries[2].params, ['amb_verified_100']);
      assert.equal(executedQueries[3].sql, 'SELECT 1 FROM product_certifications');
      assert.equal(executedQueries[4].sql, 'COMMIT');
      assert.equal(executedQueries.length, 5);
    }
  );

  await recordTest(
    'Hardening #1.2: Transaction rolls back on downstream handler error, prevents commit-after-error, and releases client exactly once',
    async () => {
      const executedQueries: string[] = [];
      let releaseCount = 0;

      const mockClient: DbClientLike = {
        query: async (sql) => {
          executedQueries.push(sql);
          return { rows: [] };
        },
        release: () => {
          releaseCount += 1;
        },
      };

      const mockPool: DbPoolLike = {
        connect: async () => mockClient,
      };

      await assert.rejects(
        async () => {
          await executeSecureRlsTransaction(
            mockPool,
            {
              ambassadorId: 'amb_verified_100',
              tenantId: 'tenant_ablecity_main',
              emailVerified: true,
            },
            async (ctx) => {
              await ctx.client.query('INSERT INTO test_table VALUES (1)');
              throw new Error('DOWNSTREAM_HANDLER_FAILURE');
            }
          );
        },
        /DOWNSTREAM_HANDLER_FAILURE/
      );

      assert.equal(releaseCount, 1, 'Client must be released exactly once even on error');
      assert.equal(executedQueries[0], 'BEGIN');
      assert.ok(
        executedQueries.includes('ROLLBACK'),
        'ROLLBACK must be executed when downstream handler throws'
      );
      assert.ok(
        !executedQueries.includes('COMMIT'),
        'COMMIT must never be executed after an error'
      );
    }
  );

  // =========================================================================
  // SUITE 2: HARDENING PATCH #2 — CERTIFICATION OWNERSHIP & UNTRUSTED INPUTS
  // =========================================================================
  await recordTest(
    'Hardening #2.1: ProductCertificationRepository enforces authenticated ambassador_id & tenant_id and ignores spoofed body fields',
    async () => {
      let capturedParams: unknown[] = [];

      const mockClient: DbClientLike = {
        query: async (sql, params) => {
          if (sql.includes('INSERT INTO product_certifications')) {
            capturedParams = params || [];
            return {
              rows: [
                {
                  tenant_id: params?.[0],
                  ambassador_id: params?.[1],
                  product_id: params?.[2],
                  status: params?.[3],
                  training_completed: params?.[4],
                  training_progress: params?.[5],
                  exam_score: params?.[6],
                  simulation_passed: params?.[7],
                  field_evaluation_passed: params?.[8],
                  updated_at: '2026-09-29T12:00:00Z',
                },
              ],
            };
          }
          return { rows: [] };
        },
        release: () => {},
      };

      const mockPool: DbPoolLike = {
        connect: async () => mockClient,
      };

      const savedRecord = await executeSecureRlsTransaction(
        mockPool,
        {
          ambassadorId: 'real_authenticated_ambassador',
          tenantId: 'real_verified_tenant',
          emailVerified: true,
        },
        async (ctx) => {
          // Attacker supplies spoofed ambassadorId and tenantId in request payload
          return ProductCertificationRepository.upsertForAuthenticatedAmbassador(ctx, {
            ambassadorId: 'attacker_spoofed_ambassador',
            tenantId: 'attacker_spoofed_tenant',
            ambassador_id: 'attacker_spoofed_ambassador',
            tenant_id: 'attacker_spoofed_tenant',
            productId: 'DECORMATE',
            status: 'CERTIFIED',
            trainingCompleted: true,
            trainingProgress: 100,
            examScore: 91,
            simulationPassed: true,
            fieldEvaluationPassed: true,
          });
        }
      );

      assert.equal(capturedParams[0], 'real_verified_tenant');
      assert.equal(capturedParams[1], 'real_authenticated_ambassador');
      assert.equal(savedRecord.tenantId, 'real_verified_tenant');
      assert.equal(savedRecord.tenant_id, 'real_verified_tenant');
      assert.equal(savedRecord.ambassadorId, 'real_authenticated_ambassador');
      assert.equal(savedRecord.ambassador_id, 'real_authenticated_ambassador');
      assert.equal(savedRecord.productId, 'DECORMATE');
      assert.equal(savedRecord.product_id, 'DECORMATE');
    }
  );

  await recordTest(
    'Hardening #2.2: authorizeFieldSales rejects mismatched ambassador_id or tenant_id with AMBASSADOR_MISMATCH / TENANT_MISMATCH',
    () => {
      const ambassador = {
        uid: 'amb_real',
        tenantId: 'tenant_real',
        tier: 'A+' as const,
        academyStage: 'CERTIFIED' as const,
        generalCertified: true,
        reassessmentRequired: false,
      };

      const validCert: ProductCertificationRecord = {
        ambassadorId: 'amb_real',
        tenantId: 'tenant_real',
        productId: 'DECORMATE',
        ambassador_id: 'amb_real',
        tenant_id: 'tenant_real',
        product_id: 'DECORMATE',
        status: 'CERTIFIED',
        trainingCompleted: true,
        trainingProgress: 100,
        examScore: 88,
        simulationPassed: true,
        fieldEvaluationPassed: true,
        updatedAt: new Date().toISOString(),
      };

      const wrongAmb = authorizeFieldSales({
        ambassador,
        productCertification: {
          ...validCert,
          ambassadorId: 'amb_other',
          ambassador_id: 'amb_other',
        },
        requestedProductId: 'DECORMATE',
      });
      assert.equal(wrongAmb.authorized, false);
      assert.equal(wrongAmb.error, 'AMBASSADOR_MISMATCH');

      const wrongTenant = authorizeFieldSales({
        ambassador,
        productCertification: {
          ...validCert,
          tenantId: 'tenant_other',
          tenant_id: 'tenant_other',
        },
        requestedProductId: 'DECORMATE',
        verifiedTenantId: 'tenant_real',
      });
      assert.equal(wrongTenant.authorized, false);
      assert.equal(wrongTenant.error, 'TENANT_MISMATCH');
    }
  );

  // =========================================================================
  // SUITE 3: HARDENING PATCH #3 — COMMISSION VALIDATION (NO 0.25 FALLBACK)
  // =========================================================================
  await recordTest(
    'Hardening #3.1: calculateStrictCommission rejects invalid runtime saleType with DomainError(INVALID_SALE_TYPE) and never falls back to 0.25',
    () => {
      assert.throws(
        () => {
          calculateStrictCommission({
            amount: 100_000_000,
            saleType: 'invalid_unknown_type',
            tier: 'A+',
          });
        },
        (err: unknown) => {
          assert.ok(err instanceof DomainError);
          assert.equal(err.code, 'INVALID_SALE_TYPE');
          return true;
        }
      );
    }
  );

  await recordTest(
    'Hardening #3.2: calculateStrictCommission rejects non-finite / negative / >1 baseRate and tierBonus with DomainError',
    () => {
      assert.throws(
        () => {
          calculateStrictCommission({
            amount: 100_000_000,
            saleType: 'initial_license',
            tier: 'A+',
            policy: {
              ...DEFAULT_COMMISSION_POLICY,
              baseRates: {
                ...DEFAULT_COMMISSION_POLICY.baseRates,
                initial_license: Number.NaN,
              },
            },
          });
        },
        (err: unknown) => err instanceof DomainError && err.code === 'INVALID_BASE_RATE'
      );

      assert.throws(
        () => {
          calculateStrictCommission({
            amount: 100_000_000,
            saleType: 'initial_license',
            tier: 'A+',
            policy: {
              ...DEFAULT_COMMISSION_POLICY,
              tierBonuses: {
                ...DEFAULT_COMMISSION_POLICY.tierBonuses,
                'A+': -0.05,
              },
            },
          });
        },
        (err: unknown) => err instanceof DomainError && err.code === 'INVALID_TIER_BONUS'
      );

      assert.throws(
        () => {
          calculateStrictCommission({
            amount: 100_000_000,
            saleType: 'initial_license',
            tier: 'A+',
            policy: {
              ...DEFAULT_COMMISSION_POLICY,
              tierBonuses: {
                ...DEFAULT_COMMISSION_POLICY.tierBonuses,
                'A+': Number.POSITIVE_INFINITY,
              },
            },
          });
        },
        (err: unknown) => err instanceof DomainError && err.code === 'INVALID_TIER_BONUS'
      );
    }
  );

  await recordTest(
    'Hardening #3.3: Default base rates (25%, 30%, 15%, 35%) and default 0% tier bonuses are preserved accurately',
    () => {
      const r1 = calculateStrictCommission({
        amount: 1000,
        saleType: 'initial_license',
        tier: 'A++',
      });
      assert.equal(r1.baseRate, 0.25);
      assert.equal(r1.tierBonusRate, 0);
      assert.equal(r1.commissionAmount, 250);

      const r2 = calculateStrictCommission({
        amount: 1000,
        saleType: 'website_plus_license',
        tier: 'A+',
      });
      assert.equal(r2.baseRate, 0.30);
      assert.equal(r2.commissionAmount, 300);

      const r3 = calculateStrictCommission({
        amount: 1000,
        saleType: 'annual_renewal',
        tier: 'A',
      });
      assert.equal(r3.baseRate, 0.15);
      assert.equal(r3.commissionAmount, 150);

      const r4 = calculateStrictCommission({
        amount: 1000,
        saleType: 'cross_module',
        tier: 'A++',
      });
      assert.equal(r4.baseRate, 0.35);
      assert.equal(r4.commissionAmount, 350);
    }
  );

  // =========================================================================
  // SUITE 4: DOMAIN CORE v4.0 LOCKED INVARIANTS SUITE
  // =========================================================================
  await recordTest(
    'Domain Core v4.0 Built-In 13-Test Audit Suite passes 100%',
    () => {
      const suite = runDomainCoreAuditSuite();
      assert.equal(suite.length, 13);
      for (const item of suite) {
        assert.equal(item.passed, true, `Failed audit item ${item.id}: ${item.actualOutcome}`);
      }
    }
  );

  await recordTest(
    'Domain Core v4.0 Multi-Product Independence (7 concurrent products per ambassador)',
    () => {
      const certs = createInitialProductCertifications('amb_01', 'tenant_01');
      assert.equal(Object.keys(certs).length, 7);
      for (const pid of ALL_PRODUCT_IDS) {
        assert.equal(certs[pid].productId, pid);
        assert.equal(certs[pid].status, 'NOT_STARTED');
      }
      const nextState = computeProductLifecycleStatus(
        {
          ...certs.DECORMATE,
          trainingCompleted: true,
          trainingProgress: 100,
          examScore: 80,
          simulationPassed: true,
          fieldEvaluationPassed: true,
        },
        true,
        true
      );
      assert.equal(nextState.status, 'CERTIFIED');
      assert.equal(certs.SALONMATE.status, 'NOT_STARTED');
    }
  );

  // Print Summary Report
  console.log('==============================================================');
  console.log('FOROSHYAR — DOMAIN CORE v4.0 + HARDENING PATCH TEST REPORT');
  console.log('==============================================================');
  let passedCount = 0;
  for (const r of results) {
    if (r.passed) passedCount += 1;
    console.log(`[${r.passed ? 'PASS' : 'FAIL'}] ${r.name} -> ${r.detail}`);
  }
  console.log('--------------------------------------------------------------');
  console.log(`TOTAL: ${passedCount}/${results.length} TESTS PASSED`);
  console.log('==============================================================');

  if (passedCount !== results.length) {
    process.exit(1);
  }
}

runCompleteSecurityAndUnitTestSuite();
