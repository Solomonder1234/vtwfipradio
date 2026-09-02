// ===== IEMBOT & VTEC INGESTION SERVICE =====
import { CONFIG } from './config.js';
import { appState } from './state.js';

function getCleanPhenomena(rawPhen, nameStr) {
  let p = (rawPhen || '').toUpperCase();
  if (p === 'MW' || p === 'SMW') p = 'MA';
  if (!p && nameStr) {
    const n = nameStr.toUpperCase();
    if (n.includes('TORNADO')) p = 'TO';
    else if (n.includes('SEVERE THUNDERSTORM')) p = 'SV';
    else if (n.includes('FLASH FLOOD')) p = 'FF';
    else if (n.includes('MARINE')) p = 'MA';
  }
  return p || 'SV';
}

function classifyAlert(text = '', phenomena = '', significance = '') {
  const sig = (significance || '').toUpperCase();
  const t = (text || '').toUpperCase();
  if (sig === 'W' || t.includes('WARNING') || ['TOR:', 'SVR:', 'FFW:', 'SMW:'].some(k => t.includes(k))) return 'warnings';
  if (sig === 'A' || t.includes('WATCH') || ['TOA:', 'SVA:', 'FFA:'].some(k => t.includes(k))) return 'watches';
  if (['Y', 'S'].includes(sig) || t.includes('ADVISORY') || t.includes('STATEMENT') || t.includes('SPS') || t.includes('SPECIAL WEATHER')) return 'advisories';
  return 'chat';
}

export const IemService = {
  async fetchOfficeData(wfo = 'OKX') {
    const curYear = new Date().getUTCFullYear();
    const officeCfg = CONFIG.OFFICES[wfo];
    if (!officeCfg) return;

    const messages = [];
    const warningImages = [];

    // 1. Ingest GeoJSON VTEC Warnings
    try {
      const resGeo = await fetch(`https://mesonet.agron.iastate.edu/geojson/vtec.geojson?wfo=${wfo}&year=${curYear}&t=${Date.now()}`);
      if (resGeo.ok) {
        const dataGeo = await resGeo.json();
        if (dataGeo && Array.isArray(dataGeo.features)) {
          dataGeo.features.forEach(f => {
            const props = f.properties || {};
            const cleanWfo = (props.wfo || wfo).toUpperCase().replace(/^K/, '');
            const warnName = props.name || props.ps || '';
            const phen = getCleanPhenomena(props.phenomena, warnName);
            const sig = (props.significance || 'W').toUpperCase();
            const etn = parseInt(props.eventid || props.etn, 10);
            const yr = props.year || curYear;
            const issueDate = props.issue ? new Date(props.issue) : new Date();
            const dateStr = issueDate.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
            
            const cfg = CONFIG.PHENOMENA[phen] || { name: warnName || `${phen} Product`, code: `${phen}.${sig}`, color: 'text-sky-400', bg: 'bg-sky-500/80 text-white border-sky-400', border: 'border-l-sky-400' };
            const fullTitle = `${cleanWfo} ${cfg.name}`;
            const summaryStr = props.text || props.desc || `${cfg.name} in effect for ${cleanWfo} area.`;

            messages.push({
              id: `vtec_${cleanWfo}_${yr}_${phen}_${sig}_${etn}`,
              wfo: cleanWfo,
              isChat: false,
              author: '',
              eventTitle: fullTitle,
              summaryText: summaryStr,
              dateStr: dateStr,
              pubDate: issueDate.toISOString(),
              etn: etn || '',
              category: classifyAlert(fullTitle + ' ' + summaryStr, phen, sig),
              titleColor: cfg.color,
              badgeStyle: cfg.bg,
              borderClass: cfg.border,
              roomBadgeColor: officeCfg.badgeColor,
              link: `https://mesonet.agron.iastate.edu/vtec/#${yr}-O-NEW-K${cleanWfo}-${phen}-${sig}-${etn ? String(etn).padStart(4, '0') : ''}`
            });

            if (sig === 'W' && ['MA', 'SV', 'TO', 'FF'].includes(phen) && etn) {
              const etnStr = String(etn).padStart(4, '0');
              warningImages.push({
                id: `vtec_img_${cleanWfo}_${etnStr}`,
                wfo: cleanWfo,
                phenCode: cfg.code || `${phen}.W`,
                etn: etnStr,
                dateStr: dateStr,
                url: `https://mesonet.agron.iastate.edu/vtec/f/${yr}-O-NEW-K${cleanWfo}-${phen}-W-${etnStr}.gif`,
                fallbackUrl: `https://mesonet.agron.iastate.edu/GIS/radmap.php?vtec=${yr}.O.NEW.K${cleanWfo}.${phen}.W.${etnStr}`
              });
            }
          });
        }
      }
    } catch (e) {
      console.warn(`VTEC fetch error for ${wfo}:`, e);
    }

    // 2. Ingest Live Room Chat via Proxy
    try {
      const resChat = await fetch(`/api/iembot?room=${officeCfg.room}&t=${Date.now()}`);
      if (resChat.ok) {
        const xmlText = await resChat.text();
        const xmlDoc = new DOMParser().parseFromString(xmlText, 'text/xml');
        const items = xmlDoc.querySelectorAll('item');

        items.forEach(item => {
          const rawDesc = item.querySelector('description')?.textContent || item.querySelector('title')?.textContent || '';
          const pubDate = item.querySelector('pubDate')?.textContent || '';
          const author = item.querySelector('author')?.textContent || item.querySelector('dc\\:creator')?.textContent || '';
          const cleanText = rawDesc
            .replace(/^[0-9]{3,4}\s+[A-Z0-9]{4,6}\s+[A-Z0-9]{4}\s+[0-9]{6}[^\n]*\n?/i, '')
            .replace(/\b(WHUS|WWUS|WFUS|WTUS|WGUS|NWUS)[0-9]{2}\s+[A-Z0-9]{4}\s+[0-9]{6}\b/gi, '')
            .replace(/\/([A-Z])\.(NEW|CON|EXT|EXA|EXB|UPG|CAN|COR|ROU)\.[A-Z0-9./-]+\//g, '')
            .replace(/LAT\.\.\.LON[\s0-9]+/gi, '')
            .replace(/\$\$[\s\S]*$/g, '')
            .trim();

          if (!cleanText) return;
          const isAlert = /warning|watch|advisory|statement|tornado|severe|flood/i.test(cleanText);
          const dateObj = pubDate ? new Date(pubDate) : new Date();

          if (!messages.some(m => m.summaryText === cleanText)) {
            messages.push({
              id: `chat_${wfo}_${pubDate}_${Math.random().toString(36).substr(2, 5)}`,
              wfo: wfo,
              isChat: !isAlert,
              author: author || 'NWS/Spotter',
              eventTitle: isAlert ? `${wfo} Weather Update` : `${wfo} Room Discussion`,
              summaryText: cleanText,
              dateStr: dateObj.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
              pubDate: dateObj.toISOString(),
              etn: '',
              category: isAlert ? classifyAlert(cleanText) : 'chat',
              titleColor: isAlert ? 'text-amber-400' : 'text-slate-200',
              badgeStyle: isAlert ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-slate-800 text-slate-300 border-slate-700',
              borderClass: isAlert ? 'border-l-amber-500' : 'border-l-slate-500',
              roomBadgeColor: officeCfg.badgeColor,
              link: 'https://weather.im/iembot/'
            });
          }
        });
      }
    } catch (e) {
      console.warn(`Chat fetch error for ${wfo}:`, e);
    }

    const currentState = appState.getState();
    const sortedMessages = messages.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate)).slice(0, 60);

    appState.setState({
      messages: { ...currentState.messages, [wfo]: sortedMessages },
      warningImages: { ...currentState.warningImages, [wfo]: warningImages }
    });
  },

  get247RoutineImagery(wfo = 'OKX') {
    const channel = CONFIG.OFFICES[wfo] || CONFIG.OFFICES.OKX;
    const radarSite = channel.radarSite;

    return [
      {
        id: `radar_${radarSite}`,
        category: 'radar',
        badgeText: `📡 ${radarSite} LIVE NEXRAD LOOP (.GIF)`,
        badgeStyle: 'bg-slate-900/80 text-sky-400 border border-sky-500/40 backdrop-blur-sm',
        url: `https://radar.weather.gov/ridge/standard/${radarSite}_loop.gif?t=${Date.now()}`,
        fallbackUrl: `https://radar.weather.gov/ridge/standard/${radarSite}_0.gif`
      },
      {
        id: `satellite_goes_east`,
        category: 'radar',
        badgeText: `🛰️ GOES-EAST GEOCOLOR ANIMATED LOOP (.GIF)`,
        badgeStyle: 'bg-slate-900/80 text-indigo-300 border border-indigo-500/40 backdrop-blur-sm',
        url: `https://cdn.star.nesdis.noaa.gov/GOES16/ABI/SECTOR/ne/GEOCOLOR/GOES16-NE-GEOCOLOR-600x600.gif?t=${Date.now()}`,
        fallbackUrl: `https://cdn.star.nesdis.noaa.gov/GOES16/ABI/SECTOR/ne/GEOCOLOR/GOES16-NE-GEOCOLOR-1000x1000.gif`
      },
      {
        id: `radar_regional_northeast`,
        category: 'radar',
        badgeText: `📡 NORTHEAST REGIONAL RADAR MOSAIC (.GIF)`,
        badgeStyle: 'bg-slate-900/80 text-emerald-300 border border-emerald-500/40 backdrop-blur-sm',
        url: `https://radar.weather.gov/ridge/standard/NORTHEAST_loop.gif?t=${Date.now()}`,
        fallbackUrl: `https://radar.weather.gov/ridge/standard/NORTHEAST_0.gif`
      },
      {
        id: `spc_day1_loop`,
        category: 'briefings',
        badgeText: `⚡ SPC CONVECTIVE OUTLOOK (.GIF)`,
        badgeStyle: 'bg-slate-900/80 text-red-300 border border-red-500/40 backdrop-blur-sm',
        url: `https://www.spc.noaa.gov/products/outlook/day1otlk.gif?t=${Date.now()}`,
        fallbackUrl: `https://www.spc.noaa.gov/products/outlook/day1otlk_1200.gif`
      },
      {
        id: `satellite_water_vapor`,
        category: 'radar',
        badgeText: `💧 GOES-EAST WATER VAPOR LOOP (.GIF)`,
        badgeStyle: 'bg-slate-900/80 text-cyan-300 border border-cyan-500/40 backdrop-blur-sm',
        url: `https://cdn.star.nesdis.noaa.gov/GOES16/ABI/SECTOR/ne/09/GOES16-NE-09-600x600.gif?t=${Date.now()}`,
        fallbackUrl: `https://cdn.star.nesdis.noaa.gov/GOES16/ABI/SECTOR/ne/08/GOES16-NE-08-600x600.gif`
      }
    ];
  }
};
