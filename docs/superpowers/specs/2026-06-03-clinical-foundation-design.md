# Clinical Adherence - Sub-project 1: Foundation (Domain Model, Roles, RLS)

Date: 2026-06-03
Status: Draft for review (first sub-project of the clinical adherence product)
Parent: docs/clinical-adherence-concept.md

> **Not legal/clinical advice.** Build to be HIPAA-ready; do not put real PHI in
> until a Supabase BAA is signed and a security review is done.

## Goal

The data + access foundation everything else builds on: a monorepo scaffold, the
Supabase schema (orgs, users/roles, care plans, plan items, assignments, adherence,
outcomes, audit log), role-based access via Postgres RLS, and an auth/invite flow.
No clinical UI yet beyond what's needed to prove the access model.

## Monorepo scaffold

```
clinical-adherence/                 (new repo)
  packages/exercise-core/           # extracted FlexAI dataset/engine/animations/safety
  apps/patient/                     # Expo (later sub-projects)
  apps/clinician/                   # Next.js (later sub-projects)
  supabase/
    migrations/                     # SQL schema + RLS (this sub-project)
    seed.sql                        # demo org/clinician/patient for local dev
  package.json (workspaces)
```

This sub-project delivers `supabase/` (schema + RLS + seed) and `packages/exercise-core`
(the shared library); the two apps are scaffolded empty and filled in sub-projects 2-3.

## Roles & RBAC

Three roles, stored on a `profiles` row linked to the Supabase auth user:
- **admin** - manages an organization (clinic): clinicians, patients, billing.
- **clinician** - manages their assigned patients and care plans within their org.
- **patient** - sees only their own data.

A user belongs to exactly one `organization`. Access is enforced in the database
with RLS (not just in app code), so a compromised client cannot read across orgs or
patients.

## Schema (Postgres)

```sql
organizations            (id, name, created_at)
profiles                 (id = auth.users.id, org_id, role, full_name, email, created_at)
clinician_patient        (clinician_id, patient_id, org_id, created_at)   -- assignment of patients to clinicians
care_plans               (id, org_id, created_by, title, description, duration_days, status, created_at)
plan_items               (id, care_plan_id, type, exercise_id, target jsonb, schedule jsonb, position)
                         -- type: exercise|walking|swimming|strength|weigh_in|custom
assignments              (id, care_plan_id, patient_id, clinician_id, org_id, start_date, end_date, status, created_at)
adherence_logs           (id, assignment_id, plan_item_id, patient_id, org_id, date, completed, value jsonb, source, note, created_at)
                         -- source: manual|healthkit|health_connect
outcomes                 (id, patient_id, org_id, instrument, score numeric, recorded_at)
audit_logs               (id, org_id, actor_id, action, entity, entity_id, at, meta jsonb)
```

Notes:
- `exercise_id` references the shared `exercise-core` library by string id (the
  FlexAI stretch ids); not a DB FK since the library is code, not a table.
- `target`/`schedule`/`value` are JSONB for flexibility (sets/reps/duration vs
  steps/distance vs weight).
- `org_id` is denormalized onto child rows so RLS policies are simple and fast.

## RLS policy model (per table)

Enable RLS on every table. Helper: a SQL function `current_org()` and `current_role()`
reading the caller's `profiles` row via `auth.uid()`.

- **organizations:** members of the org can `select`; only `admin` can `update`.
- **profiles:** a user can `select`/`update` their own row; admins can
  `select`/`insert`/`update` profiles in their org.
- **care_plans / plan_items:** `select`/`insert`/`update` limited to clinicians and
  admins in the same `org_id`; patients have no direct access (they see plans only
  through their assignment - exposed via a view or a security-definer RPC).
- **assignments:** clinicians/admins in the org manage them; a patient can `select`
  only assignments where `patient_id = auth.uid()`.
- **adherence_logs:** a patient can `insert`/`select`/`update` only their own rows;
  clinicians/admins can `select` rows for patients in their org.
- **outcomes:** same shape as adherence_logs.
- **audit_logs:** `insert` by the app (service role / trigger); `select` limited to
  admins in the org. No update/delete (append-only).

## Auth & invite flow

- Supabase email OTP (reuse the pattern already in FlexAI's `auth.ts`).
- **Invite:** an admin/clinician creates a `profiles` row (role=patient) with an
  email and org; the patient signs in with OTP to that email, which links the auth
  user to the pre-created profile (matched by email) via a trigger/RPC.
- First admin of a new org is created by a seed/onboarding RPC.

## Audit logging

Write an `audit_logs` row on sensitive actions (plan create/assign, adherence
export, profile changes). MVP: app-layer writes via a single `logAudit()` helper
behind the service boundary; later, DB triggers for defense in depth.

## What this sub-project includes

- Monorepo scaffold + workspaces.
- `packages/exercise-core` extracted from FlexAI (dataset, engine, types, safety;
  animations optional now).
- `supabase/migrations/0001_foundation.sql` (schema + RLS + helper functions).
- `supabase/seed.sql` (demo org, 1 admin, 1 clinician, 1 patient, 1 sample plan).
- A small **RLS test harness** (SQL or a Node script using two JWTs) proving:
  cross-org reads are denied; a patient cannot read another patient's adherence; a
  clinician can read their org's adherence; append-only audit.

## Out of scope (later sub-projects)

Care-plan builder UI (2), patient app UI (3), wearables (4), dashboards (5), PROMs
(6), SOC 2/BAA operational work (7), billing.

## Testing

- Migration applies cleanly on a fresh Supabase/local Postgres.
- RLS harness: the deny/allow matrix above passes for each role.
- `exercise-core` keeps its existing FlexAI unit tests green after extraction.

## Honest boundaries / external prerequisites

- A **Supabase project** (yours) is needed to run migrations against real infra; I
  can write/validate the SQL and test against local Postgres without it.
- **No real patient data** until the **BAA** is signed (paid tier) and a security
  review is done.
- A **design-partner clinic** would refine the care-plan/target model before the UI
  sub-projects.
