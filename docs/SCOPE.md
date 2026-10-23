# Scope

**This file is the single source of truth for what the dataset covers.** Wherever the website,
`README.md`, or the methodology page state scope, they should link here rather than restate it.
If you find a scope claim anywhere else in this project that contradicts this file, this file wins
and the other place is a bug.

Last reviewed: 2026-08-12 · Dataset version: 2026.08

## Geographic coverage

The dataset currently holds records in five countries:

| country | records |
|---|---:|
| South Africa (ZA) | 9 |
| Kenya (KE) | 2 |
| Nigeria (NG) | 1 |
| Egypt (EG) | 1 |
| Morocco (MA) | 1 |
| **total** | **14** |

Coverage is **not** a complete census of any of these countries. It is the set of facilities that
have met the inclusion criteria below *and* for which sufficient sourced evidence exists to publish
a record.

Known active datacenter development that is **not yet tracked** includes Ghana, Ethiopia, Rwanda,
Côte d'Ivoire, Tunisia and Senegal. Absence from the dataset means "not yet recorded," never
"does not exist."

## Inclusion criteria

A facility is eligible if it is **all** of:

1. Located in Africa.
2. One of:
   - a hyperscaler cloud region or availability zone,
   - a large carrier-neutral colocation campus,
   - a purpose-built AI compute facility (GPU cluster, "AI factory", sovereign compute project).
3. Announced, under construction, operational, or materially expanded within roughly the last
   three years.

## Exclusions

Deliberately out of scope:

- Retail colocation and small enterprise datacenters.
- Edge sites, cell-site cabinets, and network points of presence.
- Facilities with no AI, hyperscaler or large-cloud relevance.
- Facilities for which no citable source exists. A lead without a source is a lead, not a record —
  see `CONTRIBUTING.md`.

## What the capacity numbers mean

This matters more than the coverage list, and it is the most common way a tracker like this gets
misread.

**Most tracked capacity is announced, not built.** Of 14 records, 2 are `operational`, 3 are
`expanded`, 8 are `announced`, and 1 is `paused`. Any headline megawatt total is therefore a total
of *reported project scale*, dominated by facilities that do not yet draw power.

Consequences for anyone citing this dataset:

- Do not describe the aggregate as installed, operational, or available capacity.
- Filter or group by `status` before totalling anything.
- `capacity.total_facility_mw` is the reported scale of the project. `capacity.it_load_mw_current`
  is the load actually attributed at `capacity.it_load_mw_as_of`; for announced projects it is
  normally `0`.
- Some sources report MVA rather than MW. Where a record stores an MVA figure as MW-equivalent, the
  `sourced_fields` note says so explicitly. These are not the same unit and should not be compared
  without care.

## Status vocabulary

| status | meaning |
|---|---|
| `announced` | Publicly announced; not confirmed under construction or operational |
| `operational` | Confirmed live and serving load |
| `expanded` | An existing operational facility with a confirmed capacity expansion |
| `paused` | Announced, then publicly suspended, stalled, or shelved |

`paused` is tracked deliberately. Projects that stall are evidence about constraints — grid
capacity, financing, offtake guarantees — and dropping them would bias the dataset toward
announcements that happened to succeed.

## Time coverage

Records carry `first_tracked` (when the record entered the dataset) and `last_verified` (when a
maintainer last checked its fields against sources). A record's `last_verified` date is the honest
statement of its currency; the dataset-level "last updated" date is the most recent change to any
record, not a guarantee that every record was re-checked on that date.

## Revising this file

Scope changes are dataset events. When the criteria or the country list change, update this file,
add a `CHANGELOG.md` entry, and bump the dataset version.
