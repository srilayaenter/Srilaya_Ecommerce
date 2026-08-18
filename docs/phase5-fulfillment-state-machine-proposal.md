# Phase 5 Design Proposal — Server-Side Fulfillment State Machine (FINAL — all decisions locked)

Status: **FINAL PLAN — all 10 decisions locked by explicit user approval. Implementation-ready. No code changed yet; do not implement until separately approved.**

## 0. Decision log (all locked)

| # | Decision | Locked value |
|---|---|---|
| 1 | `completed`/`cancelled` are terminal | **YES** |
| 2 | `pending → completed` | **REJECT** |
| 3 | `processing → pending` | **REJECT** |
| 4 | Online + courier snapshot requires confirmed `Shipment` before `pending → processing` | **YES** |
| 5 | Shipment creation + status transition must be atomic | **YES** |
| 6 | Online, no courier snapshot | **ALLOW `pending → processing` without a `Shipment`, via manual admin handling** |
| 7 | Customer cancellation must use the guarded transition path | **YES** |
| 8a | Admin cancellation from `processing` | **ALLOW** |
| 8b | Customer self-cancel from `processing` | **REJECT** (customer self-cancel from `pending` stays **ALLOW**) |
| 9 | Invalid status values | **Reject new writes; audit existing only; no auto-remediation in this PR** |
| 10 | `addShipment` from `completed`/`cancelled` | **REJECT** |

## 1. Item 8b — confirmed behavior

Current code (`apps/web/app/api/orders/cancel/route.ts:30`) already enforces exactly this:

```ts
if (order.fulfillmentStatus !== "pending") {
  return NextResponse.json({ error: "Order has already been dispatched and cannot be cancelled" }, { status: 400 });
}
```

Customer self-cancel today only ever succeeds from `pending`, and per the locked decision this behavior is preserved exactly — no relaxation into `processing`. The only change is *how* it's enforced: routed through the shared guarded transition function (decision #7) instead of an inline check duplicated in the API route, so this rule can no longer silently drift out of sync with the rest of the matrix.

## 2. Current mutation-path inventory (unchanged from v1, retained for reference)

| # | Path | Writes | Guard today | Auth today |
|---|---|---|---|---|
| 1 | `apps/web/lib/applyFulfillmentStatusChange.ts` | `fulfillmentStatus` → any enum value | role check, enum validity, no-op skip | `owner, admin, manager, billing_staff` |
| 2 | `apps/web/lib/applyAddShipment.ts` | creates/updates `Shipment`, then unconditionally sets `fulfillmentStatus = "processing"` | role check, required-field check, idempotent resubmission guard | same 4 roles |
| 3 | `apps/web/lib/applyMarkCodPaid.ts` | `Order.status` only | role check, eligibility guard | `owner, admin` |
| 4 | `apps/web/lib/updatePaymentStatus.ts` | `Order.status` only | role check, enum validity, cancelled-immutability | `owner, admin` |
| 5 | `apps/web/app/api/orders/cancel/route.ts` | `Order.status = "cancelled"`, `fulfillmentStatus = "cancelled"` | customer email-match; only if `fulfillmentStatus === "pending"` | customer self-service |
| 6 | `apps/web/app/actions/offlineOrder.ts` | creates order, `fulfillmentStatus: "pending"`, `orderChannel: "in_store"` | none in-function; middleware only | middleware role gate |
| 7 | `apps/web/app/actions/orders.ts` (`createOrder`) | creates order, `fulfillmentStatus: "pending"`, `orderChannel: "online"`, optional courier snapshot | courier required client-side only, not server-side | public |
| 8 | `apps/web/app/api/cron/release-stock/route.ts` | `Order.status` only | `CRON_SECRET` | cron |
| 9 | `apps/web/app/api/orders/return/route.ts` | reads only | n/a | n/a |
| 10 | `scripts/seed-qa-20260815.ts` (untracked) | writes non-enum `fulfillmentStatus` values (`"delivered"`, `"shipped"`) | none | local script |
| 11 | `scripts/check-order.ts` | reads only | n/a | n/a |

`Order.fulfillmentStatus`, `Order.status`, `Order.orderChannel` remain plain `String` columns — no DB-level enum/CHECK constraint. Per decision #9, this proposal does not add one; it only tightens the application-layer boundary.

## 3. Final transition matrix

| From \ To | pending | processing | completed | cancelled |
|---|---|---|---|---|
| **pending** | – | ✅ (§4 prerequisite) | ❌ REJECT | ✅ (admin + customer*) |
| **processing** | ❌ REJECT | – | ✅ | ✅ admin (8a) · customer REJECT (8b) |
| **completed** | ❌ | ❌ | – | ❌ |
| **cancelled** | ❌ | ❌ | ❌ | – |

`*` `pending → cancelled` is reachable via two authorized paths: the admin transition buttons (role-gated), and the customer self-cancel route (email-match gated, now routed through the same guarded matrix per decision #7).

`completed`/`cancelled` are fully terminal (decision #1) — no code path may write a new `fulfillmentStatus` once an order reaches either.

## 4. Courier/shipment prerequisite — final rule

Evaluated only on `pending → processing`:

| Channel | Snapshot (`courierLabel`) | Rule |
|---|---|---|
| `in_store` | n/a | ✅ always allowed, no shipment required (unchanged) |
| `online` | present | ✅ **only** if a confirmed `Shipment` is created **atomically as part of this same call** (decision #5) — the transition function itself must accept shipment details and create/require the `Shipment` row in the same write, not merely check for a pre-existing one |
| `online` | absent | ✅ allowed without a shipment — manual admin handling (decision #6), same as in-store |

Decision #5 resolves what was Option A vs. Option B in v1 §9 in favor of **Option B, extended**: `applyFulfillmentStatusChange` and `applyAddShipment` are unified into a single atomic write path for the online+snapshot case. Concretely:

- **`applyAddShipment` becomes the sole entry point for `pending → processing` on an online order with a snapshot.** It already creates the `Shipment` row; it now also becomes the only function that transitions `fulfillmentStatus` to `processing` for that case, and it does so inside the **same Prisma transaction** as the shipment write (currently it's two sequential non-transactional calls — `shipment.upsert` then `order.update` — which is not atomic today and must become `prisma.$transaction([...])`).
- **`applyFulfillmentStatusChange` keeps handling every other transition** (`pending → cancelled`, `processing → completed`, `processing → cancelled`, and `pending → processing` for in-store / no-snapshot-online), but for `pending → processing` specifically it must check: if the order is online **and** has a courier snapshot **and** no confirmed shipment exists, reject with `rejected_missing_shipment` and *not* attempt to create a shipment itself (it doesn't have shipment details — courier/tracking — so it structurally cannot satisfy decision #4/#5 on its own). Directing that case to `applyAddShipment` is the only way to reach `processing`.
- This also directly answers decision #10: `applyAddShipment` must check the matrix (`completed`/`cancelled` are terminal) before writing anything, so calling it on a terminal order is rejected outright — it can never "reopen" an order.

## 5. Customer cancellation routing (decision #7)

`apps/web/app/api/orders/cancel/route.ts` currently duplicates transition logic inline. Per decision #7, it must call `applyFulfillmentStatusChange` (extended with an actor-type concept — see §6) instead of writing `fulfillmentStatus` directly.

Concretely, the route today does, inside one `prisma.$transaction`:
1. restock each item's `ProductVariant.stock`
2. `order.update({ status: "cancelled", fulfillmentStatus: "cancelled" })`

The restock logic has no equivalent in `applyFulfillmentStatusChange` today and is specific to customer-initiated cancellation (the admin cancel path, via the generic transition buttons, does **not** currently restock inventory — a pre-existing asymmetry, not something this proposal is introducing or fixing, since restock-on-admin-cancel wasn't asked for and would be a silent scope expansion). Proposed shape:

- `applyFulfillmentStatusChange` gains an actor-type parameter distinguishing `"staff"` (existing role-based path) from `"customer"` (new — authorized by the email-match check the route already performs, not by `actorRole`).
- The matrix check (`pending → cancelled` is allowed) is identical for both actor types.
- Per locked decision 8b, the customer actor type is additionally restricted to only ever request `pending → cancelled` — attempting any other `newStatus` as a customer actor is rejected regardless of the matrix, preserving today's behavior exactly.
- The restock side effect stays in the API route, wrapped around the call to `applyFulfillmentStatusChange`, inside the same `$transaction` — it's a customer-cancellation-specific business action, not a generic fulfillment-transition concern, so it doesn't belong inside the shared function.

## 6. Authorization behavior

- No change to the 4 authorized staff roles (`owner, admin, manager, billing_staff`) for `applyFulfillmentStatusChange`/`applyAddShipment` — no security/business reason identified to change them.
- New: an explicit `actorType: "staff" | "customer"` distinction (§5), so the function can apply decision 8b's customer-specific restriction without conflating it with the role system. Customer actor type does not use `actorRole`/`FULFILLMENT_ALLOWED_ROLES` at all — its authorization remains the route's existing email-match check.
- `applyAddShipment`'s existing role check is unchanged; it becomes reachable from the same 4 roles regardless of whether it's confirming a shipment standalone or as part of a `pending → processing` transition.

## 7. Rejection / error behavior

```ts
export type FulfillmentStatusChangeOutcome =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "rejected_unauthorised"
        | "rejected_invalid_status"
        | "order_not_found"
        | "rejected_invalid_transition"     // NEW — from/to pair not in the matrix (covers terminal-state and #2/#3 rejections)
        | "rejected_missing_shipment"       // NEW — online + snapshot + no shipment, on pending→processing
        | "rejected_customer_scope";        // NEW — customer actor type requesting anything other than pending→cancelled
    };
```

`applyAddShipment`'s outcome type gains one new reason:

```ts
export type AddShipmentOutcome =
  | { ok: true; changed: boolean; order: {...} }
  | {
      ok: false;
      reason:
        | "rejected_unauthorised"
        | "rejected_invalid_input"
        | "order_not_found"
        | "rejected_invalid_transition";    // NEW — order is completed/cancelled (decision #10)
    };
```

No UI error-surfacing is added in this phase (both admin pages currently silently `return` on `!result.ok` — unchanged; this was flagged as open question v1-§12.7 and, absent a decision to add it, stays out of scope rather than assumed). All rejections continue through `logFulfillmentStatusChange`/`logShipmentChange`/`logError` exactly as today, with the new reason values populating the existing `result` field.

## 8. Idempotency requirements

- Same-status no-op check stays first, before the matrix check — unchanged from v1.
- `applyAddShipment`'s identical-resubmission guard (no write, no email) stays, but now runs **after** the terminal-state check (decision #10) — resubmitting identical shipment data on a `completed`/`cancelled` order is rejected, not silently treated as a no-op, since the order shouldn't be touched at all in that state.
- The new atomic transaction (§4) must remain safe under retry: if `Shipment` already exists with identical data and `fulfillmentStatus` is already `processing`, the whole call is a no-op (existing idempotency guard), not a duplicate transition attempt.

## 9. Audit-log requirements

- No new audit table. Existing `logFulfillmentStatusChange` and `logShipmentChange` calls cover every new rejection reason via their existing `result: string` field.
- New: log the `actorType` (`staff`/`customer`) alongside existing `actorId`/`actorRole` fields in `logFulfillmentStatusChange` calls, so the audit trail can distinguish staff-driven from customer-driven cancellations at a glance — this is an additive field, not a schema change (the logger writes structured JSON, not a DB table with a fixed column set — confirming this against `apps/web/lib/logger.ts` before implementation).

## 10. Migration requirements

**None.** Per decision #9, invalid status values are handled by *rejecting new writes* at the application boundary (already effectively true today at `applyFulfillmentStatusChange`'s enum-validity check, just not previously combined with the matrix check) — not by a DB constraint. No schema change proposed.

**Audit step (read-only, per decision #9's "audit existing" clause)**: as part of implementation, run a **read-only** query against staging —

```sql
SELECT id, "fulfillmentStatus", COUNT(*) FROM "Order"
WHERE "fulfillmentStatus" NOT IN ('pending','processing','completed','cancelled')
GROUP BY id, "fulfillmentStatus";
```

— to check whether `scripts/seed-qa-20260815.ts` (or anything else) actually left non-enum data on staging. Report findings only; **no write, no backfill, no auto-remediation** in this PR, exactly as decided. If the audit finds affected rows, that becomes a separate, explicitly-approved follow-up.

## 11. Affected files (final)

- `apps/web/lib/applyFulfillmentStatusChange.ts` — add `FULFILLMENT_TRANSITIONS` matrix check, courier/shipment prerequisite delegation, `actorType` parameter and customer-scope restriction, extended outcome type.
- `apps/web/lib/applyAddShipment.ts` — add terminal-state check (decision #10); when called as part of a `pending → processing` transition, wrap the shipment upsert and the `fulfillmentStatus` write in one `prisma.$transaction` (decision #5); extended outcome type.
- `apps/web/lib/orderConstants.ts` — new exported `FULFILLMENT_TRANSITIONS: Record<FulfillmentStatus, FulfillmentStatus[]>` matrix constant, single source of truth for both the server check and (optionally, follow-up) UI button rendering.
- `apps/web/app/api/orders/cancel/route.ts` — replace the inline `fulfillmentStatus` write with a call to `applyFulfillmentStatusChange({ actorType: "customer", newStatus: "cancelled", ... })`, keeping the restock logic and email-match check in the route.
- `apps/web/app/admin/(protected)/orders/[id]/page.tsx` — no functional change required (server rejects invalid transitions regardless of what the UI renders), but the generic transition-button grid will now sometimes render a button that always fails; deferred as a follow-up UI cleanup, not blocking this PR, unless you want it bundled in.
- `apps/web/app/admin/(protected)/orders/page.tsx` — no change expected.
- New: `tests/unit/fulfillmentTransitions.test.ts` — pure matrix-constant tests.
- Updates: `tests/unit/applyFulfillmentStatusChange.test.ts`, `tests/unit/applyAddShipment.test.ts`, and the existing `tests/unit/adminGuard.test.ts`/`adminRateLimitIntegration.test.ts` if either exercises fulfillment transitions (to be confirmed at implementation time — not yet inspected in this proposal pass).
- New or updated: a test for `apps/web/app/api/orders/cancel/route.ts` covering the routed-through-guarded-path behavior and the restock-on-cancel side effect.

## 12. Tests (final)

- **Matrix**: every (from, to) pair in `FULFILLMENT_STATUSES × FULFILLMENT_STATUSES` asserted against the final table in §3.
- **Courier/shipment gate**: online+snapshot+no-shipment on `pending→processing` via `applyFulfillmentStatusChange` → `rejected_missing_shipment`; same via `applyAddShipment` with courier/tracking data → success, atomic (assert both `Shipment` row and `fulfillmentStatus` change happen or neither does — e.g. simulate a mid-transaction failure and confirm no partial write).
- **No-snapshot online / in-store**: `pending→processing` succeeds without a shipment, for both channels.
- **Terminal-state enforcement**: `applyAddShipment` on a `completed`/`cancelled` order → `rejected_invalid_transition`, no write.
- **Customer-cancel routing**: customer actor type can only reach `pending→cancelled`; any other `newStatus` requested as `actorType: "customer"` → `rejected_customer_scope`; restock still occurs on success; a customer request when `fulfillmentStatus !== "pending"` (i.e. from `processing`) still rejects — this is the direct test of locked decision 8b.
- **Idempotency**: no-op guard still short-circuits before the matrix check; identical-resubmission guard on `applyAddShipment` still works and now also respects the terminal-state check ordering from §8.
- **Regression**: existing role-authorization tests for both functions pass unchanged; `applyMarkCodPaid`/`applyPaymentStatusChange` tests untouched and passing (out of scope, confirmed unmodified).

## 13. Staging rollout plan

1. Implement on a new branch off `staging`.
2. Run the read-only staging audit query from §10 **before** merging (informational only).
3. Full validation: targeted tests → full unit suite → `tsc --noEmit` → production build.
4. Open exactly one Phase 5 PR against `staging`; PR description states every decision from §0 explicitly.
5. After merge: verify `/healthz`, then live-verify on staging:
   - Online order with snapshot, no shipment → attempt `pending→processing` directly (bypassing UI if needed) → confirm rejection.
   - Same order → confirm shipment via `applyAddShipment` path → confirm `Shipment` row exists **and** `fulfillmentStatus` is `processing` in the same check (atomicity).
   - Online order with no snapshot → `pending→processing` → confirm success without a shipment.
   - In-store → `pending→processing` → confirm unchanged (can reuse `#CMSYLFUL`, currently at `processing`, to verify `processing→completed` still succeeds, without creating a new order unless a fresh `pending` in-store case is needed).
   - Attempt `completed→*` and `cancelled→*` on any terminal order → confirm rejection.
   - Customer-cancel: attempt via the API route on a `pending` order → confirm success + restock (decision 8b's `ALLOW` half); attempt on a `processing` order → confirm rejection (decision 8b's `REJECT` half).
6. No production deploy — matches every prior phase.

## 14. Rollback plan

- Standard git revert of the Phase 5 merge commit on `staging`. No schema change (§10), so no migration to reverse.
- The read-only audit query in §10 has no rollback need — it writes nothing.

## 15. Risks

- **Atomicity refactor risk (decision #5)**: unifying `applyAddShipment` and the `processing` transition into one transaction is the largest code change in this phase. `applyAddShipment`'s existing idempotent-resubmission guard and `applyFulfillmentStatusChange`'s no-op guard both need to keep working correctly now that one case (online+snapshot) is fully handled by the former and every other case by the latter — this needs careful test coverage (§12) since it's a genuine behavioral merge, not just an added check.
- **Restock asymmetry (§5)**: admin-initiated cancellation still doesn't restock inventory, only customer self-cancel does — this proposal preserves that asymmetry rather than fixing it, since fixing it wasn't asked for and would be a silent scope expansion. Flagging so it's a known, not accidental, gap.
- **Drift risk unchanged**: no DB constraint added (decision #9's scope), so the enum can still theoretically be violated by a future raw script; only the audit step in §10 provides visibility, not prevention.
