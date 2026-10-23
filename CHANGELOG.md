# Changelog

Dataset and project changes, newest first. Versions are `YYYY.MM`, bumped when records or scope
change materially. Record-level currency is tracked per record in `last_verified` — see
`docs/SCHEMA.md`.

## 2026.08 — unreleased

**Website**

- Renamed the site to Africa Compute Tracker, matching the domain.
- Capacity is now reported as disclosed running and disclosed planned IT load, never one blended
  total, alongside how many records disclose any figure.
- Added CSV and JSON downloads with a field guide (`/data/`), country and operator pages, an about
  page and this changelog on the site.
- Sources whose original URL has not been confirmed are shown without a link instead of pointing
  at a placeholder address.
- Maintainer notes (update reminders, record-history remarks) moved out of public facility text
  into YAML comments.
- Icons for every platform (favicon at 16/32/48 px, Apple touch, Android and maskable install
  icons), generated from one definition with `npm run icons`. Share cards now show each
  facility's disclosed capacity and verification date, and the data, methodology, glossary,
  about, changelog and countries pages have their own cards.

**Documentation**

- Added `docs/SCOPE.md` as the single source of truth for geographic coverage, inclusion criteria,
  exclusions, and how capacity figures should be read. Scope had previously been stated in several
  places with conflicting country lists.
- Added `docs/SCHEMA.md` documenting field groups, trust tiers, confidence levels, the claims model,
  and the fact/claim/analysis separation.
- Added `CITATION.cff` so the dataset can be cited from GitHub and reference managers.
- Added this changelog.

**Corrections**

- Stated scope corrected from "South Africa, Kenya, Nigeria (v1)" to the five countries actually
  present in the dataset: South Africa, Kenya, Nigeria, Egypt, Morocco.
- The Cassava AI Factory press release now links to its real URL on ADC CPT1, NBO1, LOS1 and
  Cassava AI Factory Morocco; it was already cited with that URL on two other records.
- G42 / Microsoft Kenya now has region-level coordinates (Olkaria geothermal area), so it appears
  on the map.
- `(planned)` dropped from the Cassava AI Factory Egypt and Morocco names; status already says so.
- A recorded 0 MW running load on a facility that is not yet built counts as undisclosed, not as a
  disclosed figure, in totals, tables and the CSV.

## 2026.07

- Olkaria (Kenya) status updated to `paused` following the suspension of the Microsoft–G42 project.

## Earlier

Records were added and revised before this changelog existed; see the git history of
`data/facilities/` for the full record.
