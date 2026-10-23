# Inbox — raw source intake

A staging area for un-triaged source material: news articles, press releases, filings,
tech specs, social posts. Drop things here fast; triage them later. **Nothing here is part
of the dataset yet.**

## The pipeline

```
data/inbox/        ← raw drops (paste article text or just a URL). Messy, unscored.
   │  triage  — add front-matter: relevance, signals, which facilities
   ▼
data/sources/      ← promoted canonical evidence (YYYY-Publisher-Slug.md). Cited by facilities.
   │  extract
   ▼
data/facilities/*  ← sources[] entry (sN + trust_tier + retrieved) + claims / constraints / sourced_fields
```

**The rule that protects the provenance moat:** nothing enters a facility YAML until it has
been promoted to a real `data/sources/` record with a `trust_tier`. The inbox lets you capture
quickly without polluting the dataset.

## How to use

1. **Drop.** Create `data/inbox/<short-slug>.md`. Paste the article text, or just the URL if
   that's all you have. Add the capture half of the front-matter (see `TEMPLATE.md`).
2. **Triage** (≈2 min). Fill the triage half: `relevance`, `trust_tier`, `countries`,
   `facilities`, `signals`, `actions`. Set `status: triaged`.
3. **Extract** (only `high`/`medium`). Promote the canonical text to `data/sources/` using the
   `YYYY-Publisher-Slug.md` naming already used there, give the facility YAML a new `sN` source
   entry, and add the claims/constraints/sourced_fields. Set `status: extracted` and list the
   facility + source ids it became.
4. **`low`** → `status: archived` (kept for context, no facility change). **`none`** → delete.

## Tooling

```bash
npm run inbox             # list every item by status + a worklist
npm run inbox -- --todo   # worklist only: what needs triage, what's ready to extract
npm run inbox -- --strict # exit non-zero if any item's front-matter is malformed
```

`npm run inbox` reads the front-matter of every `.md` here (except this `README.md` and
`TEMPLATE.md`), groups items by `status`, and prints two pending buckets: **to triage**
(`status: new`) and **ready to extract** (`status: triaged` with `relevance: high|medium`).
It also lint-checks the front-matter — bad enum values, a triaged item missing `relevance`, or an
`extracted` item missing `extracted_to` are flagged. `trust_tier` is validated against the same
enum as `facility.schema.json`, so the two never drift.

## Relevance rubric

`relevance` = *in-scope? × maps-to-a-facility? × extractable signals × trust tier*.

| score | meaning | what happens |
|---|---|---|
| **high** | Hard, attributable data point — MW, named tenant, status/timeline change, capex, governance signal — that **creates** a facility or **materially updates** one | promote → `data/sources/`, edit facility YAML |
| **medium** | Touches a tracked/trackable facility; confirms a soft fact or adds a claim needing corroboration | promote, add a claim/constraint |
| **low** | Africa + datacenter-adjacent but no extractable structured fact (market color, opinion) | keep for context, no facility change |
| **none** | Not Africa, or not compute infrastructure | delete |

## Signal taxonomy

`signals` is what makes an item relevant, and each maps onto a facility schema block:

| signal | maps to |
|---|---|
| `capacity` | `capacity.*` (MW / MVA / halls / sqm) |
| `ai_workload` | `analysis.ai_relevance`, AI claims |
| `tenant` | `claims[type: anchor_tenant]` |
| `status` / `timeline` | `status`, `status_history`, `timeline.*` |
| `power_grid` | `constraints[dimension: grid_pressure]` |
| `cooling_water` | `constraints[dimension: water_stress]` |
| `financials` | `financials.*` (capex, funding) |
| `governance` | policy / community / benefit-sharing claims |
| `ownership` | `owners`, `operators` |
| `new_facility` | proposes a `NEW:<slug>` record |

## Fields

`type`: `news_article | press_release | filing | tech_spec | social_media | report`
`status`: `new | triaged | extracted | archived | rejected`
`relevance`: `high | medium | low | none`
`trust_tier`: same enum as `facility.schema.json` →
`regulatory | company_official | trade_press | satellite | local_journalism | industry_report | social_media`
