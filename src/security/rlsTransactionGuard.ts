import type { Request, Response } from 'express';
import {
  ALL_PRODUCT_IDS,
  DomainError,
  ProductCertificationRecord,
  ProductCertificationStatus,
  ProductId,
} from '../domain/core';

export interface DbClientLike {
  query: (sql: string, params?: unknown[]) => Promise<{ rows: any[]; rowCount?: number }>;
  release: (err?: Error | boolean) => void;
}

export interface DbPoolLike {
  connect: () => Promise<DbClientLike>;
}

export interface VerifiedAuthContext {
  ambassadorId: string;
  tenantId: string;
  email?: string;
  emailVerified: boolean;
}

export type TransactionLifecycleState = 'IDLE' | 'ACTIVE' | 'COMMITTED' | 'ROLLED_BACK';

export interface TransactionalExecutionContext {
  client: DbClientLike;
  auth: VerifiedAuthContext;
  getState: () => TransactionLifecycleState;
}

/**
 * HARDENING PATCH #1: TRANSACTION SAFETY
 * Implements a strict, deterministic transaction lifecycle:
 *   BEGIN
 *   -> SELECT set_config('app.current_tenant_id', tenantId, true)
 *   -> SELECT set_config('app.current_ambassador_id', ambassadorId, true)
 *   -> await downstream handler
 *   -> COMMIT on successful completion
 *   -> ROLLBACK on error
 *   -> release client exactly once
 *
 * Strictly prevents:
 * - Double release (idempotent releaseOnce guard)
 * - Commit-after-error (state machine transition lock)
 * - Rollback-after-commit (state machine transition lock)
 * - Untrusted tenantId / ambassadorId from request body or URL
 */
export async function executeSecureRlsTransaction<T>(
  pool: DbPoolLike,
  verifiedAuth: VerifiedAuthContext,
  downstreamHandler: (ctx: TransactionalExecutionContext) => Promise<T>
): Promise<T> {
  if (
    !verifiedAuth ||
    typeof verifiedAuth.ambassadorId !== 'string' ||
    !verifiedAuth.ambassadorId.trim() ||
    typeof verifiedAuth.tenantId !== 'string' ||
    !verifiedAuth.tenantId.trim()
  ) {
    throw new DomainError(
      'AMBASSADOR_MISMATCH',
      'Verified authentication identity and tenant context are mandatory before opening an RLS transaction.'
    );
  }

  const client = await pool.connect();
  let txState: TransactionLifecycleState = 'IDLE';
  let clientReleased = false;

  const releaseClientExactlyOnce = () => {
    if (!clientReleased) {
      clientReleased = true;
      client.release();
    }
  };

  try {
    await client.query('BEGIN');
    txState = 'ACTIVE';

    // Apply transaction-local RLS context (is_local = true) from verified identity only
    await client.query("SELECT set_config('app.current_tenant_id', $1, true)", [
      verifiedAuth.tenantId,
    ]);
    await client.query("SELECT set_config('app.current_ambassador_id', $1, true)", [
      verifiedAuth.ambassadorId,
    ]);

    const result = await downstreamHandler({
      client,
      auth: Object.freeze({ ...verifiedAuth }),
      getState: () => txState,
    });

    // Guard against commit-after-error or duplicate commit
    if (txState === 'ACTIVE') {
      await client.query('COMMIT');
      txState = 'COMMITTED';
    }

    return result;
  } catch (error) {
    // Guard against rollback-after-commit or duplicate rollback
    if (txState === 'ACTIVE') {
      try {
        await client.query('ROLLBACK');
      } finally {
        txState = 'ROLLED_BACK';
      }
    }
    throw error;
  } finally {
    releaseClientExactlyOnce();
  }
}

/**
 * Wraps an Express route handler in a verified authentication + RLS transaction lifecycle.
 * Unlike a detached middleware that calls next() without awaiting the route promise,
 * this wrapper awaits the full downstream handler before COMMIT or ROLLBACK.
 */
export function createSecureAuthAndRlsGuard(
  pool: DbPoolLike,
  verifyRequestToken: (req: Request) => Promise<VerifiedAuthContext>,
  routeHandler: (
    req: Request,
    res: Response,
    ctx: TransactionalExecutionContext
  ) => Promise<void>
) {
  return async (req: Request, res: Response): Promise<void> => {
    let verifiedAuth: VerifiedAuthContext;
    try {
      verifiedAuth = await verifyRequestToken(req);
    } catch (authErr) {
      res.status(401).json({
        error: 'UNAUTHORIZED',
        message:
          authErr instanceof Error ? authErr.message : 'Authentication verification failed',
      });
      return;
    }

    try {
      await executeSecureRlsTransaction(pool, verifiedAuth, async (txCtx) => {
        await routeHandler(req, res, txCtx);
      });
    } catch (err) {
      if (!res.headersSent) {
        if (err instanceof DomainError) {
          res.status(400).json({
            error: err.code,
            message: err.message,
          });
        } else {
          res.status(500).json({
            error: 'INTERNAL_TRANSACTION_ERROR',
            message: err instanceof Error ? err.message : 'Transaction aborted and rolled back',
          });
        }
      }
    }
  };
}

/**
 * HARDENING PATCH #2: CERTIFICATION OWNERSHIP
 * Persistence Data Model & Repository for ProductCertification.
 * Enforces explicit ownership columns:
 *   - ambassador_id
 *   - tenant_id
 *   - product_id
 * Never trusts ambassadorId or tenantId supplied by request body or URL.
 */
export const PRODUCT_CERTIFICATION_DDL_WITH_RLS = `
CREATE TABLE IF NOT EXISTS product_certifications (
  tenant_id TEXT NOT NULL,
  ambassador_id TEXT NOT NULL,
  product_id TEXT NOT NULL CHECK (product_id IN (
    'DECORMATE', 'SLABMATE', 'SALONMATE', 'AUTOBARTER', 'TANARA', 'TALAYAR', 'EVENTMATE'
  )),
  status TEXT NOT NULL CHECK (status IN (
    'NOT_STARTED', 'TRAINING', 'EXAM_FAILED', 'EXAM_PASSED',
    'SIMULATION_FAILED', 'FIELD_EVALUATION', 'CERTIFIED', 'SUSPENDED'
  )),
  training_completed BOOLEAN NOT NULL DEFAULT FALSE,
  training_progress NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (training_progress >= 0 AND training_progress <= 100),
  exam_score NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (exam_score >= 0 AND exam_score <= 100),
  simulation_passed BOOLEAN NOT NULL DEFAULT FALSE,
  field_evaluation_passed BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, ambassador_id, product_id)
);

ALTER TABLE product_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_certifications FORCE ROW LEVEL SECURITY;

CREATE POLICY product_certifications_tenant_ambassador_isolation
  ON product_certifications
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)
    AND ambassador_id = current_setting('app.current_ambassador_id', true)
  )
  WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id', true)
    AND ambassador_id = current_setting('app.current_ambassador_id', true)
  );
`;

export interface UntrustedCertificationWriteRequest {
  // Even if caller attempts to pass spoofed ambassadorId or tenantId in body/URL, they are ignored/rejected
  ambassadorId?: string;
  tenantId?: string;
  ambassador_id?: string;
  tenant_id?: string;
  productId: ProductId;
  status: ProductCertificationStatus;
  trainingCompleted: boolean;
  trainingProgress: number;
  examScore: number;
  simulationPassed: boolean;
  fieldEvaluationPassed: boolean;
}

export class ProductCertificationRepository {
  /**
   * Upserts a ProductCertification record using ONLY the verified authentication identity
   * and verified tenant context as the source of truth for ambassador_id and tenant_id.
   */
  static async upsertForAuthenticatedAmbassador(
    ctx: TransactionalExecutionContext,
    payload: UntrustedCertificationWriteRequest
  ): Promise<ProductCertificationRecord> {
    const authoritativeAmbassadorId = ctx.auth.ambassadorId;
    const authoritativeTenantId = ctx.auth.tenantId;

    if (!ALL_PRODUCT_IDS.includes(payload.productId)) {
      throw new DomainError(
        'PRODUCT_MISMATCH',
        `Invalid product_id: ${String(payload.productId)}`
      );
    }

    if (
      typeof payload.examScore !== 'number' ||
      !Number.isFinite(payload.examScore) ||
      payload.examScore < 0 ||
      payload.examScore > 100
    ) {
      throw new DomainError(
        'INVALID_SCORE',
        `Invalid examScore: ${String(payload.examScore)}`
      );
    }

    const sql = `
      INSERT INTO product_certifications (
        tenant_id,
        ambassador_id,
        product_id,
        status,
        training_completed,
        training_progress,
        exam_score,
        simulation_passed,
        field_evaluation_passed,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      ON CONFLICT (tenant_id, ambassador_id, product_id)
      DO UPDATE SET
        status = EXCLUDED.status,
        training_completed = EXCLUDED.training_completed,
        training_progress = EXCLUDED.training_progress,
        exam_score = EXCLUDED.exam_score,
        simulation_passed = EXCLUDED.simulation_passed,
        field_evaluation_passed = EXCLUDED.field_evaluation_passed,
        updated_at = NOW()
      RETURNING
        tenant_id,
        ambassador_id,
        product_id,
        status,
        training_completed,
        training_progress,
        exam_score,
        simulation_passed,
        field_evaluation_passed,
        updated_at;
    `;

    const params = [
      authoritativeTenantId,
      authoritativeAmbassadorId,
      payload.productId,
      payload.status,
      payload.trainingCompleted,
      payload.trainingProgress,
      payload.examScore,
      payload.simulationPassed,
      payload.fieldEvaluationPassed,
    ];

    const res = await ctx.client.query(sql, params);
    const row = res.rows[0];

    // Verify returned record ownership matches authenticated context
    if (
      !row ||
      row.ambassador_id !== authoritativeAmbassadorId ||
      row.tenant_id !== authoritativeTenantId ||
      row.product_id !== payload.productId
    ) {
      throw new DomainError(
        'AMBASSADOR_MISMATCH',
        'Database record ownership verification failed.'
      );
    }

    return {
      ambassadorId: row.ambassador_id,
      tenantId: row.tenant_id,
      productId: row.product_id as ProductId,
      ambassador_id: row.ambassador_id,
      tenant_id: row.tenant_id,
      product_id: row.product_id as ProductId,
      status: row.status as ProductCertificationStatus,
      trainingCompleted: Boolean(row.training_completed),
      trainingProgress: Number(row.training_progress),
      examScore: Number(row.exam_score),
      simulationPassed: Boolean(row.simulation_passed),
      fieldEvaluationPassed: Boolean(row.field_evaluation_passed),
      updatedAt: String(row.updated_at),
    };
  }

  /**
   * Fetches a specific ProductCertification strictly scoped to ctx.auth.tenantId and ctx.auth.ambassadorId
   */
  static async getForAuthenticatedAmbassador(
    ctx: TransactionalExecutionContext,
    productId: ProductId
  ): Promise<ProductCertificationRecord | null> {
    if (!ALL_PRODUCT_IDS.includes(productId)) {
      throw new DomainError('PRODUCT_MISMATCH', `Invalid product_id: ${String(productId)}`);
    }

    const sql = `
      SELECT
        tenant_id,
        ambassador_id,
        product_id,
        status,
        training_completed,
        training_progress,
        exam_score,
        simulation_passed,
        field_evaluation_passed,
        updated_at
      FROM product_certifications
      WHERE tenant_id = $1 AND ambassador_id = $2 AND product_id = $3
      LIMIT 1;
    `;

    const res = await ctx.client.query(sql, [
      ctx.auth.tenantId,
      ctx.auth.ambassadorId,
      productId,
    ]);

    const row = res.rows[0];
    if (!row) return null;

    if (
      row.ambassador_id !== ctx.auth.ambassadorId ||
      row.tenant_id !== ctx.auth.tenantId
    ) {
      throw new DomainError(
        'AMBASSADOR_MISMATCH',
        'Cross-tenant or cross-ambassador record leak blocked.'
      );
    }

    return {
      ambassadorId: row.ambassador_id,
      tenantId: row.tenant_id,
      productId: row.product_id as ProductId,
      ambassador_id: row.ambassador_id,
      tenant_id: row.tenant_id,
      product_id: row.product_id as ProductId,
      status: row.status as ProductCertificationStatus,
      trainingCompleted: Boolean(row.training_completed),
      trainingProgress: Number(row.training_progress),
      examScore: Number(row.exam_score),
      simulationPassed: Boolean(row.simulation_passed),
      fieldEvaluationPassed: Boolean(row.field_evaluation_passed),
      updatedAt: String(row.updated_at),
    };
  }
}
