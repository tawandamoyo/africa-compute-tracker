export function formatStatus(status) {
  const labels = {
    announced: 'Announced',
    under_construction: 'Under Construction',
    operational: 'Operational',
    expanded: 'Expanding',
    cancelled: 'Cancelled',
    paused: 'Paused',
  };
  return labels[status] ?? status;
}

export function statusColor(status) {
  const map = {
    announced: 'bg-amber-100 text-amber-800',
    under_construction: 'bg-blue-100 text-blue-800',
    operational: 'bg-emerald-100 text-emerald-800',
    expanded: 'bg-teal-100 text-teal-800',
    cancelled: 'bg-red-100 text-red-800',
    paused: 'bg-gray-100 text-gray-600',
  };
  return map[status] ?? 'bg-gray-100 text-gray-600';
}

export function statusMarkerHex(status) {
  const map = {
    announced: '#f59e0b',
    under_construction: '#3b82f6',
    operational: '#10b981',
    expanded: '#14b8a6',
    cancelled: '#ef4444',
    paused: '#6b7280',
  };
  return map[status] ?? '#6b7280';
}

export function scaleTierLabel(tier) {
  const map = {
    hyperscale: 'Hyperscale',
    large: 'Large-scale',
    medium: 'Mid-scale',
    small: 'Small-scale',
  };
  return map[tier] ?? tier;
}

export function scaleTierColor(tier) {
  const map = {
    hyperscale: 'bg-purple-100 text-purple-800',
    large: 'bg-orange-100 text-orange-800',
    medium: 'bg-blue-100 text-blue-800',
    small: 'bg-gray-100 text-gray-600',
  };
  return map[tier] ?? 'bg-gray-100 text-gray-600';
}

export function coolingAiLabel(val) {
  const map = {
    inference_only: 'Inference only',
    ai_capable: 'AI-capable',
    frontier_training: 'Frontier training',
    unknown: 'Not assessed',
  };
  return map[val] ?? val;
}

export function coolingAiColor(val) {
  const map = {
    inference_only: 'bg-gray-100 text-gray-600',
    ai_capable: 'bg-indigo-100 text-indigo-800',
    frontier_training: 'bg-purple-100 text-purple-800',
    unknown: 'bg-gray-100 text-gray-600',
  };
  return map[val] ?? 'bg-gray-100 text-gray-600';
}

export function confidenceClasses(confidence) {
  const map = {
    confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    reported: 'bg-blue-50 text-blue-700 border-blue-200',
    estimated: 'bg-amber-50 text-amber-700 border-amber-200',
    disputed: 'bg-red-50 text-red-700 border-red-200',
  };
  return map[confidence] ?? 'bg-gray-50 text-gray-600 border-gray-200';
}

export function trustTierClasses(tier) {
  const map = {
    regulatory: 'bg-purple-50 text-purple-700',
    company_official: 'bg-emerald-50 text-emerald-700',
    trade_press: 'bg-blue-50 text-blue-700',
    satellite: 'bg-teal-50 text-teal-700',
    local_journalism: 'bg-orange-50 text-orange-700',
    industry_report: 'bg-indigo-50 text-indigo-700',
    social_media: 'bg-red-50 text-red-700',
  };
  return map[tier] ?? 'bg-gray-50 text-gray-600';
}

export function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function isStale(dateStr) {
  if (!dateStr) return false;
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 6);
  return new Date(dateStr + 'T00:00:00') < cutoff;
}

// 1 MW continuous ≈ 2,900 SA households (avg ~250 kWh/month per household)
const SA_HOUSEHOLDS_PER_MW = 2900;
const CAPE_TOWN_PEAK_MW = 1676;       // City of Cape Town max demand
const SA_EFFECTIVE_GRID_MW = 30000;   // Eskom effective available capacity (~30 GW usable)

export function powerContext(mw, city, country) {
  if (mw == null || mw <= 0) return null;
  const households = Math.round(mw * SA_HOUSEHOLDS_PER_MW).toLocaleString();

  let gridNote = null;
  if (city === 'Cape Town') {
    const pct = ((mw / CAPE_TOWN_PEAK_MW) * 100).toFixed(1);
    gridNote = `${pct}% of Cape Town's peak grid demand (${CAPE_TOWN_PEAK_MW.toLocaleString()} MW)`;
  }

  let nationalGridNote = null;
  if (country === 'ZA') {
    const pct = ((mw / SA_EFFECTIVE_GRID_MW) * 100).toFixed(2);
    nationalGridNote = `${pct}% of South Africa's effective grid capacity (~${(SA_EFFECTIVE_GRID_MW / 1000).toFixed(0)} GW available)`;
  }

  let scaleNote = null;
  if (mw >= 500) scaleNote = 'Hyperscale — would rank among the world\'s largest data centre facilities';
  else if (mw >= 300) scaleNote = 'Among the world\'s largest individual data centre projects by planned capacity';
  else if (mw >= 100) scaleNote = 'Comparable to a major hyperscaler campus';
  else if (mw >= 30) scaleNote = 'Comparable to a large regional cloud facility';
  else if (mw >= 5) scaleNote = 'Comparable to a mid-size cloud data centre';

  return { households, gridNote, nationalGridNote, scaleNote };
}

// Carbon intensity context
const GLOBAL_AVG_GCO2 = 436; // IEA 2022 global average g CO₂/kWh

export function carbonContext(gco2) {
  if (gco2 == null) return null;
  const multiple = (gco2 / GLOBAL_AVG_GCO2).toFixed(1);
  let label, color;
  if (gco2 < 100) {
    label = 'Very low — nuclear / hydro grid';
    color = 'text-emerald-700';
  } else if (gco2 < 300) {
    label = 'Low — wind / solar dominant';
    color = 'text-emerald-600';
  } else if (gco2 < 500) {
    label = 'Medium — gas-dominated grid';
    color = 'text-amber-600';
  } else if (gco2 < 700) {
    label = 'High — coal + gas mix';
    color = 'text-orange-600';
  } else {
    label = 'Very high — coal-heavy grid';
    color = 'text-red-600';
  }
  return { gco2, multiple, label, color, global_avg: GLOBAL_AVG_GCO2 };
}
