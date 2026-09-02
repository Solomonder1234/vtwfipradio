// ===== CENTRAL CONFIGURATION =====
export const CONFIG = {
  OFFICES: {
    OKX: {
      wfo: 'OKX',
      lowerWfo: 'okx',
      radarSite: 'KOKX',
      room: 'okxchat',
      name: 'NWS New York (OKX)',
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    },
    PHI: {
      wfo: 'PHI',
      lowerWfo: 'phi',
      radarSite: 'KDIX',
      room: 'phichat',
      name: 'NWS Mount Holly (PHI)',
      badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    }
  },
  AIRPORTS: [
    { id: 'KJFK', name: 'John F. Kennedy Intl' },
    { id: 'KLGA', name: 'LaGuardia' },
    { id: 'KEWR', name: 'Newark Liberty Intl' },
    { id: 'KTEB', name: 'Teterboro' },
    { id: 'KFRG', name: 'Republic / Farmingdale' },
    { id: 'KISP', name: 'Long Island MacArthur' }
  ],
  BUOYS: ['44065', '44017', '44025'],
  STREAM: {
    PRIMARY: '/api/stream/live',
    BACKUP: '/api/stream/wjonip',
    METADATA_POLL_MS: 10000
  },
  PHENOMENA: {
    'TO': { name: 'Tornado Warning', code: 'TO.W', color: 'text-red-500', bg: 'bg-red-500/80 text-white border-red-400', border: 'border-l-red-500' },
    'SV': { name: 'Severe Thunderstorm Warning', code: 'SV.W', color: 'text-amber-400', bg: 'bg-amber-500/80 text-white border-amber-400', border: 'border-l-amber-500' },
    'FF': { name: 'Flash Flood Warning', code: 'FF.W', color: 'text-emerald-400', bg: 'bg-emerald-500/80 text-white border-emerald-400', border: 'border-l-emerald-500' },
    'MA': { name: 'Special Marine Warning', code: 'MA.W', color: 'text-sky-400', bg: 'bg-sky-500/80 text-white border-sky-400', border: 'border-l-sky-400' },
    'FA': { name: 'Flood Advisory', code: 'FA.Y', color: 'text-cyan-400', bg: 'bg-cyan-500/80 text-white border-cyan-400', border: 'border-l-cyan-400' },
    'FL': { name: 'Flood Warning', code: 'FL.W', color: 'text-emerald-400', bg: 'bg-emerald-500/80 text-white border-emerald-400', border: 'border-l-emerald-500' },
    'WS': { name: 'Winter Storm Warning', code: 'WS.W', color: 'text-indigo-400', bg: 'bg-indigo-500/80 text-white border-indigo-400', border: 'border-l-indigo-400' },
    'BZ': { name: 'Blizzard Warning', code: 'BZ.W', color: 'text-red-400', bg: 'bg-red-500/80 text-white border-red-400', border: 'border-l-red-500' },
    'WI': { name: 'Wind Advisory', code: 'WI.Y', color: 'text-orange-400', bg: 'bg-orange-500/80 text-white border-orange-400', border: 'border-l-orange-400' },
    'HW': { name: 'High Wind Warning', code: 'HW.W', color: 'text-amber-500', bg: 'bg-amber-500/80 text-white border-amber-400', border: 'border-l-amber-500' }
  }
};
