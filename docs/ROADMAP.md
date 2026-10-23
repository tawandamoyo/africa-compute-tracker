# Roadmap

Short, honest, and undated. Items move to `CHANGELOG.md` when they ship.

## Next

- **Separate announced from operational capacity in every aggregate view.** Most tracked capacity is
  announced rather than built, and any headline total that hides this is misleading. Totals should
  be grouped by status wherever they appear.
- **Downloadable exports from the website.** CSV and JSON are generated in the repo but are not yet
  offered as direct downloads to people who will never open GitHub.
- **Archived URLs for every source.** Coverage is currently partial; link rot is the main long-term
  threat to a provenance-based dataset.

## Under consideration

- Power and energy fields: tariff context, PPA status, backup generation, and grid connection path.
  Grid constraint is already recorded in `constraints`, but not in a structured, comparable form.
- Wider geographic coverage — Ghana, Ethiopia, Rwanda, Côte d'Ivoire, Tunisia, Senegal.
- Satellite verification of construction status for a small number of high-signal records.
- Periodic published briefs summarising what changed in the dataset and why it matters.

## Not planned

- Becoming a complete census of African datacenters. The dataset covers AI-relevant and
  hyperscale-relevant facilities; see `docs/SCOPE.md`.
- Retail colocation, edge sites, or network points of presence.
- Adding records faster than sourcing can support. Fourteen well-sourced records are more useful
  than forty thin ones.

## Corrections and suggestions

Open an issue. Corrections to existing records are the most valuable contribution and are handled
first — see `CONTRIBUTING.md`.
