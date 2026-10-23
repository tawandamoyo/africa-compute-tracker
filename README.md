# Africa Compute Tracker

An open, version-controlled dataset of AI-relevant datacenter infrastructure across Africa. The
primary product is the dataset and the analysis it supports — the map is a supporting visual. Every
substantive data point has a source, a trust tier, a retrieval date and a confidence level.

**Dataset version 2026.08** · 14 records across South Africa, Kenya, Nigeria, Egypt and Morocco ·
[CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/) · <https://africacomputetracker.org>

> **Read this before quoting a total.** Most tracked capacity is *announced*, not built: 2 records
> are operational, 3 expanded, 8 announced, 1 paused. Aggregate megawatt figures are totals of
> reported project scale, not installed capacity. Group by `status` before summing — see
> [`docs/SCOPE.md`](docs/SCOPE.md).

---

## Documentation

| doc | what it covers |
|---|---|
| [`docs/SCOPE.md`](docs/SCOPE.md) | Coverage, inclusion criteria, exclusions, how to read capacity figures — **the source of truth for scope** |
| [`docs/SCHEMA.md`](docs/SCHEMA.md) | Field reference, trust tiers, confidence levels, the claims model |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | What is next, and what is deliberately not planned |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | How to correct a record or submit a lead |
| [`CHANGELOG.md`](CHANGELOG.md) | Dataset changes by version |

## How to cite

> Moyo, Tawanda. *Africa Compute Tracker* (dataset), version 2026.08. Africa Compute
> Observatory. <https://africacomputetracker.org>. Accessed YYYY-MM-DD.

Machine-readable metadata is in [`CITATION.cff`](CITATION.cff). Attribution is required under
CC-BY 4.0. To cite a single record, include its id and `last_verified` date:

> Africa Compute Tracker, "Cosmas Data City Cape Town Campus"
> (`cavaleros-cdc-cape-town-campus`), record last verified 2026-06-29.

**Corrections are welcome and prioritised.** If a field looks wrong,
[open an issue](https://github.com/tawandamoyo/africa-compute-tracker/issues/new/choose) — you do
not need to be certain.

---

## Run locally

```bash
npm install
npm run validate   # validate all facility YAML files against the schema
npm run dev        # start Astro dev server at http://localhost:4321
```

Build for production:

```bash
npm run build      # validates then builds to dist/
npm run preview    # preview the built site
```

---

## Repo structure

```
facility.schema.json        JSON Schema — do not edit without updating docs/SCHEMA.md
data/
  inbox/                    Raw, un-triaged source intake (staging — not part of the dataset)
  sources/                  Promoted, cited evidence (PDFs, captured article text)
  facilities/               One YAML file per facility
scripts/
  validate.mjs              AJV validation — run on every build
  inbox.mjs                 List inbox items by triage status + worklist
src/
  pages/
    index.astro             Home page + map
    methodology.astro       Methodology and trust tier definitions
    facilities/[id].astro   Dynamic facility detail pages
  components/
    Map.astro               MapLibre GL JS map
    FacilityCard.astro      Facility card for the index grid
    SourceCitation.astro    Field value + confidence badge + source links
  lib/
    loadFacilities.js       Read and parse YAML files at build time
    formatters.js           Status colours, date formatting, confidence badges
  styles/
    global.css              Tailwind v4 entry point
```

---

## Adding a facility

1. Create `data/facilities/[id].yaml` following the pattern in an existing file.
2. The `id` must be a lowercase slug (`^[a-z0-9-]+$`) and must never change after publish.
3. The filename must exactly match the id: `data/facilities/[id].yaml`.
4. Use source-backed names:
   - Single facility: `[operator]-[facility-code]-[locality]`, e.g. `equinix-jn1-germiston`.
   - Campus record: `[operator]-[official-campus-name]-campus`, e.g. `teraco-isando-campus`.
   - Display `name` should be the official public name; put market names, former names, and ambiguous labels in `aliases`.
5. Every non-trivial field must have an entry in `sourced_fields` with at least one source id and
   a confidence level (`confirmed` | `reported` | `estimated` | `disputed`).
6. Run `npm run validate` — the build will fail if the YAML is invalid.
7. Source URLs should be archived via [web.archive.org](https://web.archive.org/save/) and the
   `archived_url` field populated.

See [`docs/SCHEMA.md`](docs/SCHEMA.md) for what each field means, how trust tiers and confidence
levels are assigned, and how contested assertions are recorded as claims rather than facts.

---

## Processing source material (the inbox)

Raw source material (news, press releases, filings, specs) is captured in `data/inbox/` before it
enters the dataset, so you can grab things fast and triage later. The flow:

```
data/inbox/   raw drop → triage (add front-matter: relevance, signals, facilities)
data/sources/ promote the canonical text/PDF (cited by facilities)
data/facilities/ extract: add a sources[] entry + claims/constraints/sourced_fields
```

The rule that protects provenance: **nothing enters a facility YAML until it's promoted to a real
`data/sources/` record with a `trust_tier`.** See `data/inbox/README.md` for the full convention,
the relevance rubric, and the signal taxonomy; copy `data/inbox/TEMPLATE.md` for a new item.

```bash
npm run inbox            # list items by status + a worklist (to-triage, ready-to-extract)
npm run inbox -- --todo  # worklist only
npm run inbox -- --strict # non-zero exit if any item's front-matter is malformed (CI)
```

---

## Data license

Facility data: [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/).
Code: MIT.
