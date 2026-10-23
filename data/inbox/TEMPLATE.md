---
# --- capture (fill on drop) ---
title: ""
url: ""
publisher: ""
published:            # YYYY-MM-DD, the article/source date
captured: 2026-06-29  # YYYY-MM-DD, when you grabbed it
type: news_article    # news_article | press_release | filing | tech_spec | social_media | report
# --- triage (fill on review) ---
status: new           # new | triaged | extracted | archived | rejected
relevance:            # high | medium | low | none
trust_tier:           # regulatory | company_official | trade_press | satellite | local_journalism | industry_report | social_media
africa:               # true | false
countries: []         # ISO alpha-2, e.g. [ZA, KE]
facilities: []        # existing facility ids, or NEW:<proposed-slug>
signals: []           # capacity, ai_workload, tenant, status, timeline, power_grid, cooling_water, financials, governance, ownership, new_facility
actions: []           # concrete edits this implies
notes: >
  Free-text: what's extractable, what's uncertain, what needs corroboration.
# --- once extracted ---
extracted_to:         # source record path + facility ids it became, e.g.
                      #   source: data/sources/2025-TechCentral-Teraco-JB5.md
                      #   facilities: [teraco-isando-campus, teraco-jb7-isando]
---

<!-- Paste the full article / source text below, or leave the URL above if that's all you have. -->
