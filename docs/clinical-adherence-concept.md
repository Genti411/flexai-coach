# Clinical Care-Plan Adherence Platform - Concept & Architecture Brief

Date: 2026-06-03
Status: Concept (pre-build). Reuses the FlexAI Coach exercise engine as content.

> **Not legal/clinical advice.** This brief flags regulatory considerations for
> planning only. Engage healthcare-regulatory counsel and a HIPAA security
> assessor before handling real patient data or selling to providers.

---

## 1. Summary

A B2B platform that lets **clinicians** (physical therapists, physicians, chiros,
wellness clinics) prescribe **activity and exercise care plans** - stretches,
mobility, walking, swimming, strength, weight management - and **track patient
adherence and outcomes**, with dashboards and reports for the clinic.

It is the **clinical-adherence** model (think Sword Health, Hinge Health, Kaiser
care programs), **not** an insurance-eligibility product. That distinction is
deliberate and important (see Section 8).

The consumer FlexAI Coach app becomes the **prescribable exercise library** inside
this product.

## 2. Who it's for

- **Buyer:** outpatient PT/rehab clinics, physician groups, chiropractic/wellness
  clinics, digital-MSK programs, employer clinics. (Insurers/value-based-care orgs
  are a later channel, via the providers.)
- **Roles:**
  - **Clinic admin** - manages clinicians, patients, billing, reports.
  - **Clinician** - builds/assigns care plans, reviews adherence + outcomes,
    adjusts plans.
  - **Patient** - sees their plan, does the activities, logs adherence, syncs
    wearables.

## 3. Value proposition

- **Patients** get a clear, guided home program (with the FlexAI animations/images)
  instead of a paper handout - higher adherence.
- **Clinicians** see who's actually doing their program, get flagged on drop-off,
  and capture outcome data - better results with less manual follow-up.
- **Clinics** get measurable adherence/outcomes to justify care, support
  value-based contracts, and differentiate.

## 4. Core user flows

1. Clinician builds a **care plan**: picks exercises from the library (reused FlexAI
   dataset) + adds activity targets (e.g., "8,000 steps/day", "swim 2x/week",
   "weigh in weekly") + schedule/duration.
2. Clinician **assigns** it to a patient (who is invited and consents).
3. Patient opens the app: **today's plan**, does items, **marks them done** (and
   later, steps/swims auto-verify via wearables); periodic **weigh-ins** and
   **outcome questionnaires**.
4. Clinician **dashboard**: adherence %, streaks, trends, non-adherence flags,
   outcome scores; export a report.

## 5. Data model (core entities)

```
Organization (clinic)
User { id, role: admin|clinician|patient, orgId, email }
ClinicianProfile / PatientProfile
CarePlan { id, orgId, createdBy, title, description, durationDays, status }
PlanItem { id, carePlanId, type: exercise|walking|swimming|strength|weigh_in|custom,
           exerciseId?, target (sets/reps/duration/steps/distance/frequency), schedule }
Assignment { id, carePlanId, patientId, startDate, endDate, status }
AdherenceLog { id, assignmentId, planItemId, date, completed, value?, source: manual|healthkit|googlefit, note? }
Outcome (PROM) { id, patientId, instrument, score, recordedAt }
AuditLog { id, actorId, action, entity, at }   // required for HIPAA
Message? (clinician<->patient, optional/later)
```

RBAC + Postgres RLS: a user only sees their org; clinicians see their assigned
patients; patients see only themselves.

## 6. Architecture

- **Patient app:** React Native + Expo (reuse FlexAI Coach UI/engine/animations).
- **Clinician/admin portal:** web (Next.js - matches the `beauty-ai-web` stack the
  developer already uses). Clinicians need a desktop dashboard, not a phone.
- **Backend:** Supabase (Postgres + Auth + Storage + RLS) for the MVP. **HIPAA note:**
  Supabase supports HIPAA with a BAA on paid tiers - required before real PHI.
  Alternative: a dedicated HIPAA-eligible backend (AWS/GCP) if scale/compliance
  demands.
- **Shared content module:** extract the FlexAI exercise `dataset`/`engine`/animations
  into a shared package both apps import (single source of truth for exercises).
- **Wearables/verification:** Apple HealthKit (iOS), Health Connect/Google Fit
  (Android); optionally an aggregator (Terra, Spike) to normalize. Steps, workouts,
  swims, weight.
- **Reporting:** dashboard charts + PDF/CSV export.

## 7. Decomposition into sub-projects (build order)

1. **Domain model + roles/auth + RLS** (foundation).
2. **Care-plan builder** (clinician web): assemble plan from library + activity targets.
3. **Patient adherence app**: today's plan, mark done, manual logging.  ← *first demoable loop with #1/#2*
4. **Wearable verification** (HealthKit/Google Fit): steps, workouts, weight.
5. **Clinician dashboard + reporting**: adherence %, trends, flags, export.
6. **Outcome measures (PROMs)**: standardized questionnaires + scoring.
7. **HIPAA/security hardening + SOC 2 prep**: audit logs, BAAs, encryption review,
   data retention/deletion, breach process.

**Recommended first build (after this doc):** sub-projects 1 + a thin 2 + 3 - the
**prescribe -> assign -> adhere -> see basic adherence** loop, reusing the exercise
library. That validates the core value and de-risks the rest.

## 8. Regulatory & compliance considerations (for counsel)

- **HIPAA (the big one):** handling identifiable patient data *for providers* makes
  the platform a **Business Associate**. Required: signed **BAAs** (with the clinics
  and with subprocessors like Supabase), Security Rule controls (encryption at
  rest/in transit, access controls, **audit logging**, integrity), Privacy Rule
  alignment, and **Breach Notification** procedures.
- **Insurance-eligibility law - avoided by design:** by selling clinical adherence to
  *providers* (not conditioning insurance), we sidestep ACA/ADA/GINA wellness-program
  constraints. Do **not** let a customer wire this into insurance eligibility/pricing
  without specialized counsel.
- **FDA / Software as a Medical Device:** if the app only helps a *licensed clinician*
  deliver and track their own plan (clinician in the loop, no autonomous diagnosis),
  it typically falls under low-risk clinical-decision-support / wellness and is often
  not a regulated device - but confirm; "prescribing" language and any
  auto-recommendation raise the question.
- **Clinical safety:** keep the existing FlexAI safety guardrails (red-flag symptoms
  -> stop + seek care). A clinician oversees plans, which strengthens safety.
- **State law:** PT practice acts, telehealth rules, and clinician licensure by state
  if care crosses state lines.
- **Consent & data rights:** explicit patient consent at enrollment; data
  export/deletion; data retention policy; minors handled separately.
- **Accessibility:** ADA/WCAG for the patient app and clinician portal.

## 9. What reuses FlexAI Coach

- The exercise **dataset** (39 stretches across 11 areas), the matching **engine**,
  the **animations/images** pipeline, and the **safety classifier** - all become the
  prescribable content + on-device safety layer. The consumer app stays as-is; the
  clinical product imports the shared module.

## 10. MVP scope vs. later

- **MVP:** roles/auth + RLS; care-plan builder (library + simple activity targets);
  patient adherence checklist + manual logging + weigh-in entry; basic clinician
  adherence dashboard (%, last-active, flags). Single clinic, web portal + patient app.
- **Later:** wearable auto-verification, PROMs, messaging, multi-clinic/enterprise,
  SOC 2, billing, payer/value-based reporting, configurable protocols/templates.

## 11. Monetization

B2B SaaS: per-**clinician seat** and/or per-**active-patient/month**, tiered by
features (dashboards, wearables, reporting). Enterprise tier for multi-clinic +
SSO + SOC 2. (No consumer charge; the patient app is provided through their clinic.)

## 12. Honest boundaries

I can build the **software** (apps, portal, data model, dashboards, wearable
integrations, exports). I **cannot** deliver the non-code prerequisites to actually
operate on real PHI: signed BAAs, a HIPAA risk assessment, SOC 2 certification,
clinical/legal sign-off, and provider/payer contracts. Plan to build **HIPAA-ready**,
then complete those with counsel/assessors before go-live.

## 13. Open questions to resolve before building

1. Patient app = extend FlexAI's app, or a separate patient app sharing the engine?
2. Clinician portal = Next.js web (recommended) - confirm.
3. Backend = Supabase + BAA for MVP, or a dedicated HIPAA stack from day one?
4. First customer/design partner clinic to shape the MVP? (Strongly recommended -
   build with one real clinic.)
5. Which activities to verify first via wearables (steps and weight are easiest)?
```
