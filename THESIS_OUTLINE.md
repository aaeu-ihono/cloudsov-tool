# Thesis Outline

**Achieving Data Sovereignty for EU Enterprises Through European Cloud Infrastructure:
A Comparative Analysis of Technical Capabilities and Regulatory Compliance**

Ihonosetale Oseghale — M.Eng.

---

## 1. Scope reconciliation — read this first

Your approved scope (`attachments/[THESIS] - Scope 3.docx`) defines **three phases with fixed
weightings**, where Phase 3 (30%) was a live deployment. Deployment is now out of scope. Your
presentation defines **five studies**. The reconciliation below assumes **Study 5 (Build
Feasibility) takes the place of the deployment phase** — correct me if you intend otherwise.

| Study | Approved phase it serves | Weight | Status |
|---|---|---|---|
| 1 · Sovereignty Scoring | Phase 1 — Europeanness Scoring Framework | 30% | ✅ Built |
| 2 · Capability Gap Analysis | Phase 1 — Cloud Readiness Assessment | (same 30%) | ✅ Built |
| 3 · Financial Viability | **⚠ addition, not in approved scope** | — | ✅ Built |
| 4 · Technical Benchmarking | Phase 2 — Technical benchmarking | 40% | ✅ Built |
| — Metrics Evaluation vs Alps Alpine checklist | Phase 2 — Measurement & Metrics Evaluation | (same 40%) | ❌ Not started |
| — Final ranking | Phase 2 — Final outcome | (same 40%) | ❌ Not started |
| 5 · Build Feasibility | **replaces Phase 3 — Deployment** | 30% | 🟡 Research done, not written |

### Resolve with your professor before writing

1. **Dropping Phase 3 is a major scope change.** A 30% component of an approved scope is being
   removed and substituted. This needs explicit written sign-off — it is the single largest
   grading risk in the project. Do not write around it.

2. **Your title already supports the change.** *"A Comparative Analysis of Technical Capabilities
   and Regulatory Compliance"* never promised a deployment. Lead with that when you make the
   case: the thesis becomes a coherent analytical work — four evaluative studies plus one
   feasibility study — rather than an evaluation with a deployment bolted on.

3. **Studies 3 and 5 are additions.** Get both acknowledged in the same conversation.

---

## 2. Chapter structure

The build-vs-buy frame does the structural work: Studies 1–4 answer *"which provider do we buy
from?"*, Study 5 answers *"what would it take to build it ourselves?"*

### 1 · Introduction
- Motivation: Alps Alpine's dependency problem; department exploring alternatives to public AI
- Problem statement and research questions
- Scope and delimitation — **state explicitly that no deployment is performed, and why**
- Structure of the work

### 2 · Foundations
- **2.1 Legal & regulatory** — GDPR, Schrems II, CLOUD Act, FISA 702
  *Core argument: US-incorporated providers cannot guarantee sovereignty regardless of data
  centre location.* This is the load-bearing argument of the entire thesis.
- **2.2 Regulations vs. Directives** — GDPR/DORA/CRA apply uniformly; NIS2 reaches you through
  27 national implementations
- **2.3 Sovereignty as a full-stack property** — a sovereign application on a non-sovereign layer
  is not sovereign
- **2.4 Technical foundations** — kernel, virtualization techniques, hypervisor types, KVM's
  position as the industry centre of gravity
- **2.5 Related work** — Gillam et al. (2013) fair benchmarking; Blancato (2023) cloud
  sovereignty nexus; EC DG DIGIT Cloud Sovereignty Framework v1.2.1

### 3 · Methodology
- **3.1 Research design** — multi-criteria evaluation; five studies; build-vs-buy decision frame.
  *State here that Studies 1–4 are evaluative and Study 5 is a feasibility study — two distinct
  research genres under one framework.*
- **3.2 Why these five dimensions** — each is a way a provider can disqualify itself
- **3.3 Provider selection** — 18 EU providers + AWS baseline; inclusion criteria
- **3.4 Data sources and evidence standards** — documentary evidence, Cloud Mercato,
  self-measured benchmarks; how each is attributed
- **3.5 Normalisation and aggregation** — 0–100 scaling, weighting, composite construction
- **3.6 Limitations of the design** — state here, not buried in the conclusion

### 4 · Part I — Buy: Provider Evaluation

#### 4.1 Study 1 — Sovereignty Scoring
Instrument (EC DG DIGIT SOV: 8 objectives, 45 questions, seal levels 0–4), scoring rule
`Σ(seal/4 × weight × 100)`, per-provider evidence, results, interpretation.

#### 4.2 Study 2 — Capability Gap Analysis
Dimensions assessed, AWS as reference baseline, gap quantification, results.

#### 4.3 Study 3 — Financial Viability
Revenue series, CAGR, investment milestones, gap-closure projection to AWS parity. Be explicit
about what the projection does **not** claim — linear extrapolation is an illustration of
current velocity, not a forecast.

#### 4.4 Study 4 — Technical Benchmarking
Gillam et al. protocol, 2 vCPU / 8 GB tier, eight profiles (pts/stream, pts/hint,
pts/compress-7zip, pts/postmark, pts/apache, iperf3, boot, setup), 3-run minimum,
normalisation, composite, price-performance.

> ⚠ **Data integrity:** most Phoronix figures in `benchmarking/data/*.json` are still
> placeholders — only OVHcloud is self-measured. You have since run PTS on real instances.
> Those values must replace the placeholders **before** this chapter is written, and every
> figure you did not measure yourself must be attributed in-text. A reviewer who finds one
> unattributed borrowed number will doubt all of them.

#### 4.5 Metrics Evaluation against Alps Alpine requirements ❌
Service-catalogue coverage mapped to the checklist (Compute, Storage, DB, Networking, AI/ML,
Security, Monitoring, IoT, Messaging); LLM self-hosting feasibility (GPU availability, ML
tooling, storage throughput) as analytical assessment.
*Required by the approved scope. Not started. This is your largest writing gap.*

### 5 · Part II — Build: Feasibility of Own Infrastructure
*Study 5 — a feasibility study, replacing the deployment phase.*

- **5.1 Starting conditions** — Customer Zero definition, certified colocation (Tier III+,
  Frankfurt / DE-CIX proximity), open-source stack commitment
- **5.2 Reference architecture** — OpenStack + Ceph + KVM; node roles; hardware BOM
  (~15 servers, 5 network devices, 2 racks)
- **5.3 Network design** — VLAN segmentation by traffic class, underlay/overlay, DE-CIX peering
- **5.4 Deployment sequence** — Kolla-Ansible; Keystone → Glance → Neutron → Nova → Cinder,
  and why the dependency order is forced
- **5.5 Organisational feasibility** — the six engineer profiles; **European OpenStack/Ceph
  talent scarcity is itself a sovereignty constraint.** This is your sharpest original finding
  in Part II — give it room.
- **5.6 Cost model** — CAPEX/OPEX against the per-hour provider pricing from Study 4. This is
  what makes Part II commensurable with Part I rather than a separate essay.
- **5.7 Feasibility verdict** for an organisation of Alps Alpine's size

### 6 · Synthesis — Ranking and Decision
- **6.1 Composite ranking** — sovereignty + readiness + benchmarks, as the approved scope requires
- **6.2 Sensitivity analysis** — does the ranking survive different weightings? *Do this. It is
  the first thing a methodologically-minded examiner will probe, and it is cheap to produce
  from the data you already have.*
- **6.3 Build vs. buy** — the two branches compared on cost, risk, time-to-capability, control
- **6.4 Recommendation** for Alps Alpine

### 7 · Discussion
- Answers to the research questions
- What generalises beyond Alps Alpine
- Threats to validity: third-party vs. self-measured data, single instance tier, point-in-time
  assessment, single-company requirements, no empirical validation of Part II
- Where the EU provider landscape is genuinely not competitive — say it plainly. A thesis that
  concludes everything is fine reads as advocacy.

### 8 · Conclusion & Future Work
Deployment as the obvious next step — frame it as future work, which is exactly where it now
belongs.

---

## 3. Recommended writing order

Do **not** start at Chapter 1. Write in this order:

1. **Ch. 4 (Studies 1–4)** — data is fresh, the app already renders the results
2. **Ch. 3 (Methodology)** — easier to write accurately once the studies are on paper
3. **Ch. 5 (Study 5)** — the Canonical notes are effectively a first draft already
4. **Ch. 2 (Foundations)** — most citation-heavy chapter; budget real time for the legal section
5. **Ch. 6, 7, 8 (Synthesis, Discussion, Conclusion)**
6. **Ch. 1 (Introduction)** — last. You cannot introduce a thesis you have not finished.

---

## 4. Immediate actions

| Priority | Action |
|---|---|
| 🔴 | Get written sign-off on dropping Phase 3 and substituting Study 5 |
| 🔴 | Replace placeholder benchmark data with your real PTS runs |
| 🟠 | Write §4.5 Metrics Evaluation — the remaining Phase 2 gap |
| 🟠 | Confirm required document format (Word template vs. LaTeX) with your institution |
| 🟡 | Add the 6.2 sensitivity analysis to the app — it is a small change to existing code |
| 🟡 | Ask Kris Lowet (nexxwave.eu) for raw `.pts` files for cross-validation |
