# Clinical Foundation (Sub-project 1) Implementation Plan

> REQUIRED SUB-SKILL: subagent-driven-development / executing-plans. Checkbox steps.

**Goal:** Stand up a new monorepo for the clinical adherence product with the shared exercise library, the Supabase schema + RLS, a seed, and a Dockerized RLS test harness proving the access matrix. No app UI yet.

**Where:** NEW repo at `C:\Users\Genti\clinical-adherence` (separate from flexai-coach). Local only - do NOT create or push a GitHub repo (that needs the owner's explicit consent).

**Tech:** Node 20, Postgres (via Docker for tests), Supabase-style SQL. Docker daemon is running.

---

## Task 1: Monorepo scaffold

- [ ] Create `C:\Users\Genti\clinical-adherence` and `git init` it.
- [ ] Root `package.json`:

```json
{
  "name": "clinical-adherence",
  "private": true,
  "workspaces": ["packages/*", "apps/*"],
  "scripts": { "test:rls": "node supabase/test/rls-harness.mjs" }
}
```

- [ ] `.gitignore`: `node_modules`, `dist`, `.env`, `.expo`, `/apps/*/node_modules`.
- [ ] `README.md`: one paragraph (clinical adherence product foundation; see
  `../flexai-coach/docs/clinical-adherence-concept.md`). Note "no real PHI until BAA".
- [ ] Create placeholder dirs with a README each: `apps/patient/README.md`
  ("Expo patient app - sub-project 3"), `apps/clinician/README.md` ("Next.js
  clinician portal - sub-project 2").
- [ ] Commit: `chore: scaffold clinical-adherence monorepo`.

---

## Task 2: Extract exercise-core shared library

- [ ] Create `packages/exercise-core/`. Copy these from
  `C:\Users\Genti\flexai-coach\src\core\`: `types.ts`, `dataset.ts`, `matcher.ts`,
  `validate.ts`, `safety.ts`, `engine.ts` into `packages/exercise-core/src/`.
  Copy the matching tests from `flexai-coach\tests\core\` into
  `packages/exercise-core/tests/`. Remove the `@/` alias usage: change imports to
  relative (`./types`) - the flexai core files import via `./xxx` already, so this
  should be minimal; the engine imports `./gemini` which we do NOT copy - **remove
  the Gemini fallback from the copied `engine.ts`** (the clinical product does not
  use the LLM): delete the `geminiClient`/`LlmClient` import and the fallback branch,
  and have `getStretchResponse` return the local fallback response when no body area
  matches. Keep `classifyRisk`, `buildResponse`, `matchInput`, `validateResponse`.
- [ ] `packages/exercise-core/package.json`:

```json
{
  "name": "@clinical/exercise-core",
  "version": "0.1.0",
  "main": "src/index.ts",
  "scripts": { "test": "jest" },
  "devDependencies": { "jest": "^29.7.0", "ts-jest": "^29.1.0", "@types/jest": "^29.5.14", "typescript": "~5.6.0" }
}
```

- [ ] `packages/exercise-core/src/index.ts` re-exports the public API
  (`types`, `dataset` `buildResponse`/`STRETCH_DATASET`, `matcher` `matchInput`,
  `safety` `classifyRisk`/`highRiskResponse`, `validate` `validateResponse`).
- [ ] `tsconfig.json` (basic, strict) and `jest.config.js` (ts-jest preset, node env).
- [ ] `npm install` in the package; run `npm test` - the copied core tests
  (safety, matcher, dataset, validate, engine) must pass. Adjust the engine test if
  it referenced the Gemini fallback (the "falls back to the LLM" test): change it to
  assert the no-match path returns the local fallback response instead.
- [ ] Commit: `feat(core): extract exercise-core shared library (no LLM)`.

---

## Task 3: Schema + RLS migration

- [ ] Create `supabase/migrations/0001_foundation.sql` with EXACTLY this content:

```sql
-- Helpers (Supabase already provides auth.uid(); these read the caller's profile).
create or replace function public.current_org() returns uuid
  language sql stable security definer set search_path = public as
$$ select org_id from public.profiles where id = auth.uid() $$;

create or replace function public.current_app_role() returns text
  language sql stable security definer set search_path = public as
$$ select role from public.profiles where id = auth.uid() $$;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  role text not null check (role in ('admin','clinician','patient')),
  full_name text, email text,
  created_at timestamptz not null default now()
);

create table public.clinician_patient (
  clinician_id uuid not null references public.profiles(id) on delete cascade,
  patient_id  uuid not null references public.profiles(id) on delete cascade,
  org_id      uuid not null references public.organizations(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (clinician_id, patient_id)
);

create table public.care_plans (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  title text not null, description text, duration_days int,
  status text not null default 'draft' check (status in ('draft','active','archived')),
  created_at timestamptz not null default now()
);

create table public.plan_items (
  id uuid primary key default gen_random_uuid(),
  care_plan_id uuid not null references public.care_plans(id) on delete cascade,
  type text not null check (type in ('exercise','walking','swimming','strength','weigh_in','custom')),
  exercise_id text, target jsonb not null default '{}'::jsonb,
  schedule jsonb not null default '{}'::jsonb, position int not null default 0
);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  care_plan_id uuid not null references public.care_plans(id) on delete cascade,
  patient_id uuid not null references public.profiles(id) on delete cascade,
  clinician_id uuid not null references public.profiles(id),
  org_id uuid not null references public.organizations(id) on delete cascade,
  start_date date not null default current_date, end_date date,
  status text not null default 'active' check (status in ('active','completed','cancelled')),
  created_at timestamptz not null default now()
);

create table public.adherence_logs (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  plan_item_id uuid not null references public.plan_items(id) on delete cascade,
  patient_id uuid not null references public.profiles(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  date date not null default current_date, completed boolean not null default false,
  value jsonb, source text not null default 'manual' check (source in ('manual','healthkit','health_connect')),
  note text, created_at timestamptz not null default now()
);

create table public.outcomes (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  instrument text not null, score numeric, recorded_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null, actor_id uuid, action text not null,
  entity text, entity_id uuid, at timestamptz not null default now(), meta jsonb
);

-- Enable RLS
alter table public.organizations    enable row level security;
alter table public.profiles         enable row level security;
alter table public.clinician_patient enable row level security;
alter table public.care_plans       enable row level security;
alter table public.plan_items       enable row level security;
alter table public.assignments      enable row level security;
alter table public.adherence_logs   enable row level security;
alter table public.outcomes         enable row level security;
alter table public.audit_logs       enable row level security;

-- organizations
create policy org_select on public.organizations for select using (id = public.current_org());
create policy org_update on public.organizations for update using (id = public.current_org() and public.current_app_role() = 'admin');

-- profiles
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or (org_id = public.current_org() and public.current_app_role() in ('admin','clinician')));
create policy profiles_self_update on public.profiles for update using (id = auth.uid());
create policy profiles_admin_insert on public.profiles for insert
  with check (org_id = public.current_org() and public.current_app_role() = 'admin');

-- clinician_patient
create policy cp_staff on public.clinician_patient for all
  using (org_id = public.current_org() and public.current_app_role() in ('admin','clinician'))
  with check (org_id = public.current_org() and public.current_app_role() in ('admin','clinician'));

-- care_plans / plan_items (staff only; patients have no policy => denied)
create policy plans_staff on public.care_plans for all
  using (org_id = public.current_org() and public.current_app_role() in ('admin','clinician'))
  with check (org_id = public.current_org() and public.current_app_role() in ('admin','clinician'));
create policy items_staff on public.plan_items for all
  using (exists (select 1 from public.care_plans p where p.id = care_plan_id
                 and p.org_id = public.current_org() and public.current_app_role() in ('admin','clinician')))
  with check (exists (select 1 from public.care_plans p where p.id = care_plan_id
                 and p.org_id = public.current_org() and public.current_app_role() in ('admin','clinician')));

-- assignments
create policy assignments_staff on public.assignments for all
  using (org_id = public.current_org() and public.current_app_role() in ('admin','clinician'))
  with check (org_id = public.current_org() and public.current_app_role() in ('admin','clinician'));
create policy assignments_patient_select on public.assignments for select using (patient_id = auth.uid());

-- adherence_logs
create policy adherence_patient on public.adherence_logs for all
  using (patient_id = auth.uid()) with check (patient_id = auth.uid());
create policy adherence_staff_select on public.adherence_logs for select
  using (org_id = public.current_org() and public.current_app_role() in ('admin','clinician'));

-- outcomes
create policy outcomes_patient on public.outcomes for all
  using (patient_id = auth.uid()) with check (patient_id = auth.uid());
create policy outcomes_staff_select on public.outcomes for select
  using (org_id = public.current_org() and public.current_app_role() in ('admin','clinician'));

-- audit_logs (append-only: insert in own org; select admins; no update/delete policy => denied)
create policy audit_insert on public.audit_logs for insert with check (org_id = public.current_org());
create policy audit_admin_select on public.audit_logs for select
  using (org_id = public.current_org() and public.current_app_role() = 'admin');
```

- [ ] Commit: `feat(db): foundation schema + RLS`.

---

## Task 4: Local auth shim + seed (test-only)

- [ ] `supabase/test/00_local_auth_shim.sql` (Supabase provides these in real infra;
  needed only for local Postgres):

```sql
create schema if not exists auth;
create table if not exists auth.users (id uuid primary key, email text);
create or replace function auth.uid() returns uuid
  language sql stable as
$$ select nullif(current_setting('request.jwt.claims', true)::json->>'sub','')::uuid $$;
```

- [ ] `supabase/seed.sql`: one org, one admin, one clinician, one patient (insert
  into auth.users + profiles), one care_plan with two plan_items (one exercise_id
  'chin-tucks', one walking target), one assignment (plan->patient), and one
  adherence_log + a SECOND org with its own patient (for cross-org deny tests). Use
  fixed UUIDs so the harness can reference them.

- [ ] Commit: `chore(db): local auth shim + seed`.

---

## Task 5: RLS test harness (Dockerized Postgres)

- [ ] In `supabase/test/`, add a Node harness `rls-harness.mjs` that:
  1. starts Postgres in Docker:
     `docker run -d --rm --name ca-pg -e POSTGRES_PASSWORD=pw -p 55432:5432 postgres:16`
     (wait until ready), 
  2. connects with `pg` (install `pg` in `supabase/test/package.json`),
  3. runs `00_local_auth_shim.sql`, then `migrations/0001_foundation.sql`, then `seed.sql`,
  4. creates a non-owner role and uses it for policy checks:
     `create role app login password 'pw'; grant usage on schema public, auth to app; grant select,insert,update,delete on all tables in schema public to app; grant execute on all functions in schema public, auth to app;`
  5. for each test, connect/SET ROLE app and `set request.jwt.claims` to a user's
     JSON (`{"sub":"<uuid>"}`), run a query, assert.
  6. tears down the container in a finally block.

- [ ] Assertions (the deny/allow matrix):
  - patient P1 selecting own `adherence_logs` -> rows > 0;
  - patient P1 selecting P2's adherence (different patient/org) -> 0 rows;
  - patient P1 selecting `care_plans` -> 0 rows (no policy);
  - clinician C1 (org A) selecting `adherence_logs` for org A -> rows > 0;
  - clinician C1 selecting org B `care_plans` -> 0 rows;
  - `update audit_logs` as admin -> throws (no update policy);
  - admin selecting `audit_logs` in own org -> allowed.

- [ ] Run `node supabase/test/rls-harness.mjs`; ALL assertions must pass. Paste output.
- [ ] Commit: `test(db): dockerized RLS deny/allow harness`.

---

## Task 6: Verify

- [ ] `npm test` in `packages/exercise-core` -> green.
- [ ] `node supabase/test/rls-harness.mjs` -> all RLS assertions pass, container torn down.
- [ ] `git log --oneline` shows the commits. Repo stays LOCAL (no GitHub push).

---

## Self-Review Notes

- **Spec coverage:** monorepo (T1), exercise-core extraction w/o LLM (T2), schema +
  RLS (T3), auth shim + seed (T4), Dockerized RLS harness proving the access matrix (T5).
- **Security:** RLS enforced in DB; helpers are security-definer; audit append-only.
- **Boundaries:** local only; no GitHub repo; no real PHI; Supabase provides
  auth.uid()/auth.users in real infra (shim is test-only).
- **If Docker is unavailable at run time:** report BLOCKED with the error; do NOT
  fake the harness output - the SQL can still be committed, but the RLS proof must
  actually run.
