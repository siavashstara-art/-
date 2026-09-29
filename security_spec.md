# Security Specification — ForoshYar (Domain Core v4.0)

## 1. Data Invariants
1. **Verified Identity & Tenant Binding**: Every `AmbassadorProfile` at `/ambassadors/{ambassadorId}` must have `ambassadorId == request.auth.uid`, `data.uid == request.auth.uid`, and `request.auth.token.email_verified == true`.
2. **Subcollection Master Gate**: Every `ProductCertification` at `/ambassadors/{ambassadorId}/productCertifications/{productId}` and `SimulationAttempt` at `/ambassadors/{ambassadorId}/simulationAttempts/{attemptId}` must belong to an existing parent `/ambassadors/{ambassadorId}` document owned by `request.auth.uid` with matching `tenantId`.
3. **Domain Core v4.0 Certification Integrity**:
   - `tier` must strictly be one of `['UNRANKED', 'A++', 'A+', 'A', 'B', 'C']`.
   - `productId` must strictly be one of `['DECORMATE', 'SLABMATE', 'SALONMATE', 'AUTOBARTER', 'TANARA', 'TALAYAR', 'EVENTMATE']`.
   - Score boundaries must be `0 <= score <= 100`.
4. **PII Isolation**: Reading `/ambassadors/{ambassadorId}` is strictly restricted to `request.auth.uid == ambassadorId` (or verified admin). Blanket `isSignedIn()` reads are forbidden.
5. **Temporal Integrity**: `createdAt` and `updatedAt` are server timestamps (`request.time`) and `createdAt`, `uid`, and `tenantId` are immutable on update.

## 2. The "Dirty Dozen" Payloads (Rejected by Rules)
1. **Unverified Email Write**: Authenticated user with `email_verified: false` attempting to create `/ambassadors/{uid}`. -> `PERMISSION_DENIED`
2. **Identity Spoofing**: User `uid_A` attempting to create `/ambassadors/uid_B` or set `data.uid = 'uid_B'`. -> `PERMISSION_DENIED`
3. **Shadow Field Injection**: Updating `/ambassadors/{uid}` with an undeclared field `isSuperAdmin: true`. -> `PERMISSION_DENIED`
4. **Cross-Tenant Tampering**: Updating `tenantId` on `/ambassadors/{uid}` after creation. -> `PERMISSION_DENIED`
5. **Score Boundary Poisoning**: Setting `generalExamScore: 150` or `-10`. -> `PERMISSION_DENIED`
6. **Invalid Product Enum**: Creating `/ambassadors/{uid}/productCertifications/FAKE_PRODUCT`. -> `PERMISSION_DENIED`
7. **Orphaned Subcollection Write**: Creating a `ProductCertification` when parent `/ambassadors/{uid}` does not exist. -> `PERMISSION_DENIED`
8. **PII Cross-User Read**: User `uid_A` attempting `get` or `list` on `/ambassadors/uid_B`. -> `PERMISSION_DENIED`
9. **ID Poisoning**: Creating a simulation attempt with a 500-character junk ID or special characters. -> `PERMISSION_DENIED`
10. **Immutable Timestamp Mutation**: Modifying `createdAt` during an `update` on `/ambassadors/{uid}`. -> `PERMISSION_DENIED`
11. **Client Timestamp Forgery**: Supplying a past/future timestamp for `updatedAt` instead of `request.time`. -> `PERMISSION_DENIED`
12. **Value Type Poisoning**: Supplying a string `"95"` instead of a number for `examScore`. -> `PERMISSION_DENIED`
