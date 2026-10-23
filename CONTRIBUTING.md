# Contributing

This dataset is currently single-author. The contribution model is corrections only: if you have a
source that contradicts or updates a field in an existing record, open a pull request.

---

## How to propose a correction

1. **Find the facility file** in `data/facilities/[id].yaml`.

2. **Edit the YAML** with the corrected value. Every change to a substantive field requires a
   corresponding update to `sourced_fields`:
   - Add your source to the `sources` array (give it the next available id, e.g. `s3`)
   - Update the `sourced_fields` entry for the changed field to include your source id
   - If your source contradicts an existing value, set `confidence: disputed` and add a `note`
     explaining both positions

   Facility names and ids must follow the source-backed naming convention:
   - The filename must match `id` exactly.
   - Use `[operator]-[facility-code]-[locality]` for single facilities.
   - Use `[operator]-[official-campus-name]-campus` for campus-level records.
   - Keep the display `name` to the official public name; put market names, former names, and
     ambiguous labels in `aliases`.

3. **Run validation** before opening a PR:
   ```
   npm run validate
   ```
   The build will fail if the YAML does not conform to `facility.schema.json`. Fix any errors first.

4. **Archive your source** via [web.archive.org/save/](https://web.archive.org/save/) and add the
   resulting URL as `archived_url` on the source entry. This is strongly encouraged — sources
   disappear.

5. **Update `last_verified`** to today's date if your change reflects a current review of the record.

6. **Open a pull request** with a short description of what changed and why. Include the source URL
   in the PR description even if it is already in the YAML.

---

## What makes a good correction PR

- A primary source URL (not a secondary aggregator)
- The correct `trust_tier` for your source (see [`docs/SCHEMA.md`](docs/SCHEMA.md) or the Methodology page)
- An archived copy of the source
- A note if the new value contradicts an existing one

## What is out of scope for corrections

- Adding new facilities — open an issue to discuss first
- Changing a facility's `id` — the slug is the permanent URL and cannot change after publish
- Removing sourced facts without a contradicting source
- Adding fields that have no source (leave them absent rather than inventing a value)
- Analytical writeups or editorial content — the `analysis` block is maintainer-only

---

## Reporting an error without a fix

If you have spotted an error but do not have a correcting source, open an issue describing:
- Which facility and field is wrong
- What the correct value appears to be and why
- A source URL if you have one

The maintainer will investigate and update the record.

---

## Licence

Data: CC-BY 4.0. Code: MIT. By contributing you agree that your contribution is released under
the same licence.
