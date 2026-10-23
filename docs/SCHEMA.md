# Data schema

Reference for the facility record format. The machine-readable contract is
[`facility.schema.json`](../facility.schema.json) (JSON Schema), enforced on every build by
`npm run validate`. This document explains what the fields *mean* and how to fill them honestly;
the JSON Schema decides what is *valid*.

One YAML file per facility in `data/facilities/<id>.yaml`. The filename must match the `id`.

## Design principles

Three rules explain most of the schema's shape.

**1. A fact without a source is not in this dataset.** Every non-trivial field is registered in
`sourced_fields` with at least one source id and a confidence level. Provenance is the point of the
project; a well-populated record with weak sourcing is worse than a sparse one.

**2. Fact, claim, and analysis are kept structurally separate.** Sourced facts live in the typed
fields. Contested or unconfirmed assertions live in `claims`, with their own status and denial
tracking. Maintainer judgement lives in `analysis` and is flagged `is_editorial: true`. A reader can
strip all editorial content by ignoring one block.

**3. Uncertainty is recorded, not resolved.** `unknown` is a valid and often correct value.
Conflicting sources become a `disputed` claim rather than a silent choice between them.

## Required fields

`id`, `name`, `country`, `status`, `last_verified`, `sources`.

Everything else is optional, because partial records with good provenance are more useful than
complete records with invented values.

## Field groups

| group | fields | notes |
|---|---|---|
| Identity | `id`, `name`, `aliases`, `project`, `external_ids` | `id` is a lowercase slug (`^[a-z0-9-]+$`) and **must never change after publication** — other people's citations depend on it. Put market names, former names and ambiguous labels in `aliases`. |
| Location | `country`, `city`, `region`, `location` | `country` is ISO 3166-1 alpha-2. `location.precision` records whether coordinates are exact, city-level, or approximate — never imply precision you do not have. |
| Lifecycle | `status`, `status_history`, `timeline`, `scale_tier` | See `docs/SCOPE.md` for the status vocabulary. `status_history` preserves transitions, including reversals. |
| Parties | `operators`, `owners`, `tenants` | Tenancy is frequently rumoured and rarely confirmed. Unconfirmed tenant links belong in `claims`, not here. |
| Capacity | `capacity.total_facility_mw`, `capacity.it_load_mw_current`, `capacity.it_load_mw_as_of`, `capacity.land_area_hectares` | Project scale vs attributed load are different quantities. See the capacity section of `docs/SCOPE.md` before aggregating. |
| Physical | `infrastructure`, `power`, `water` | Includes tier certification, cooling adequacy for AI workloads, grid connection, utility, grid carbon intensity, water source and basin stress. |
| Governance | `governance` | Jurisdiction, operator/owner jurisdictions, foreign capital origin, and `compute_access` (access model, local-access commitments). This is what makes the dataset usable for compute-governance questions rather than only site inventory. |
| Workload | `workload_profile` | Whether the facility serves general cloud, colocation, or identified AI workloads. Marketing language claiming "AI-ready" is not evidence of AI workloads; say so in the notes. |
| Contested | `claims`, `claim_history` | See below. |
| Pressure | `constraints` | Typed constraints with a `dimension` (e.g. `grid_capacity`, `water_stress`), a `severity`, a sourced `rationale`, and `source_ids`. |
| Judgement | `analysis` | Maintainer assessment. Always `is_editorial: true`, with `assessed_by` and `assessed_on`. |
| Provenance | `sources`, `sourced_fields`, `verification`, `last_verified`, `first_tracked`, `notes` | See below. |

## Sources

Each entry in `sources` has an `id` (`s1`, `s2`, …) referenced from `sourced_fields`, `claims` and
`constraints`, plus `url`, `title`, `publisher`, `retrieved`, and a `trust_tier`.

Trust tiers, roughly strongest to weakest as evidence of fact:

| tier | typical use |
|---|---|
| `regulatory` | Filings, permits, tribunal records, licence grants |
| `company_official` | Press releases, investor materials, official specifications |
| `trade_press` | Industry publications with datacenter beats |
| `satellite` | Imagery-derived observation |
| `local_journalism` | Regional and national reporting |
| `industry_report` | Analyst and consultancy publications |
| `social_media` | Operator posts and executive statements on social platforms |

Tier is a statement about *provenance type*, not about accuracy. A `company_official` capacity
figure is authoritative about intent and often optimistic about delivery; `local_journalism` may be
the only source that reports what a project actually costs a city. Where sources conflict, record
both and open a `disputed` claim.

Archive source URLs via [web.archive.org](https://web.archive.org/save/) and populate
`archived_url`. Where a source is difficult to retrieve reproducibly — social posts especially —
also preserve a local snapshot under `data/sources/`.

## Sourced fields

`sourced_fields` maps a field path (`capacity.total_facility_mw`, `power.grid_connected`) to:

- `source_ids` — at least one
- `confidence` — one of `confirmed` | `reported` | `estimated` | `disputed`
- `note` — optional, and the right place for unit conversions, caveats, and why a figure is weak

| confidence | meaning |
|---|---|
| `confirmed` | Directly stated by a source with authority over the fact |
| `reported` | Stated by a credible source without direct authority |
| `estimated` | Derived, inferred, or approximated by the maintainer from sourced inputs |
| `disputed` | Sources conflict, or the claim is contested |

Use `estimated` freely and explain it in the note. An honest estimate with a stated basis is more
useful than an omission, and far more useful than a `reported` label on a guess.

## Claims

`claims` holds assertions that are not established fact — most often anchor tenants, ownership
links, and capacity figures that a party has neither confirmed nor denied.

Each claim carries `id`, `type`, `entity` (where applicable), `status`, `denial_status`,
`source_ids`, `first_observed`, `last_reviewed`, and a `note`.

`denial_status` exists because "the company was asked and did not deny it" and "nobody has asked"
are very different epistemic situations, and reporting routinely conflates them.

Claims are never promoted into typed fields on the strength of repetition. A claim becomes a fact
when a source with authority over it says so.

## Analysis

`analysis` is the only block containing maintainer opinion: `strategic_significance` (level plus
rationale), `significance_summary` bullets, `assessed_by`, `assessed_on`, and `is_editorial: true`.

The flag is a contract with data users: **anything outside `analysis` is intended as sourced fact or
explicitly marked claim.** If an assessment starts leaking into `notes` or field values, that is a
bug in the record.

## Verification and staleness

`last_verified` is the maintainer's statement of when the record was last checked against its
sources. `npm run check-stale` reports records that have gone too long without review.

Staleness is a property of individual records, not of the dataset. A dataset-level "last updated"
date says only that *something* changed.

## Adding or changing a record

1. Source material enters `data/inbox/` and is triaged (`npm run inbox`).
2. Canonical text or PDFs are promoted to `data/sources/` with a `trust_tier`.
3. Only then may a facility record cite them.
4. `npm run validate` must pass; the build runs it.
5. Update `last_verified` when you have actually re-checked the fields — not merely edited the file.

See `CONTRIBUTING.md` for the contribution flow and `docs/SCOPE.md` for what belongs in the dataset
at all.
