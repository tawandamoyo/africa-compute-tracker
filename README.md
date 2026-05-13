# Africa AI Datacenter Tracker

An open-source, version-controlled tracker for AI-relevant datacenter infrastructure across Africa.
The primary product is analytical writeups backed by a credible, sourced dataset — the map is the
supporting visual. Every data point has a source, a trust tier, and a retrieval date.

**Current scope (v1):** South Africa, Kenya, Nigeria — hyperscaler cloud regions, large
carrier-neutral colocation campuses, and purpose-built AI compute facilities announced,
under construction, or expanded within the last ~3 years.

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
facility.schema.json        JSON Schema (v1) — do not edit without updating PROJECT.md
data/
  facilities/               One YAML file per facility
scripts/
  validate.mjs              AJV validation — run on every build
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
3. Every non-trivial field must have an entry in `sourced_fields` with at least one source id and
   a confidence level (`confirmed` | `reported` | `estimated` | `disputed`).
4. Run `npm run validate` — the build will fail if the YAML is invalid.
5. Source URLs should be archived via [web.archive.org](https://web.archive.org/save/) and the
   `archived_url` field populated.

See `PROJECT.md` for architecture decisions, schema feedback, and session history.

---

## Data license

Facility data: [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/).
Code: MIT.
