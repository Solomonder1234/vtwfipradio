// ===== LOCAL STORM REPORTS (LSR) SERVICE =====
export function getHazardDetails(type, mag) {
  const t = (type || '').toUpperCase();
  if (t.includes('TORNADO') || t.includes('FUNNEL') || t.includes('WALL CLOUD')) {
    return { cat: 'TORNADO', color: '#ef4444', badge: 'bg-red-500/20 text-red-400 border-red-500/30' };
  }
  if (t.includes('WIND') || t.includes('GUST')) {
    return { cat: 'WIND', color: '#38bdf8', badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
  }
  if (t.includes('HAIL')) {
    return { cat: 'HAIL', color: '#22c55e', badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
  }
  if (t.includes('FLOOD') || t.includes('RAIN')) {
    return { cat: 'FLOOD', color: '#f59e0b', badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
  }
  return { cat: 'OTHER', color: '#a855f7', badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
}

export const LsrService = {
  async fetchStormReports() {
    try {
      const res = await fetch(`https://mesonet.agron.iastate.edu/geojson/lsr.geojson?wfo=OKX&wfo=PHI&hours=24&t=${Date.now()}`);
      if (!res.ok) throw new Error("LSR GeoJSON request failed");
      const data = await res.json();
      const features = data.features || [];

      return features.map(f => {
        const p = f.properties || {};
        const coords = f.geometry && f.geometry.coordinates ? f.geometry.coordinates : [0, 0];
        const time = p.valid ? new Date(p.valid).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--';

        return {
          lat: coords[1],
          lon: coords[0],
          wfo: p.wfo || 'NWS',
          type: p.typetext || p.type || 'STORM REPORT',
          magnitude: p.magnitude || p.mag || '',
          city: p.city || '',
          county: p.county || '',
          timeStr: time,
          remark: p.remark || '',
          hazard: getHazardDetails(p.typetext || p.type, p.magnitude || p.mag)
        };
      });
    } catch (err) {
      console.warn("LSR fetch error:", err);
      return [];
    }
  }
};
