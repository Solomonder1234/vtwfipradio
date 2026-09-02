// ===== CONSOLIDATED WEATHER PANELS & ALL-GIF ANIMATED OPERATIONAL STREAM =====

const IEM_CHANNELS = {
  OKX: {
    wfo: 'OKX',
    lowerWfo: 'okx',
    radarSite: 'KOKX',
    room: 'okxchat',
    name: 'NWS New York (OKX)',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    messages: [],
    warningImages: [],
    routineImages: []
  },
  PHI: {
    wfo: 'PHI',
    lowerWfo: 'phi',
    radarSite: 'KDIX',
    room: 'phichat',
    name: 'NWS Mount Holly (PHI)',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    messages: [],
    warningImages: [],
    routineImages: []
  }
};

let activeIEMTab = 'OKX';
let activeIEMFilter = 'all'; // 'all', 'alerts', 'warnings', 'chat'
let activeImageFilter = 'all'; // 'all', 'radar', 'briefings', 'skewt'

const PHEN_CONFIG = {
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
};

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

function classifyAlert(text = '', phenomena = '', significance = '', author = '') {
  const sig = (significance || '').toUpperCase();
  const t = (text || '').toUpperCase();

  if (sig === 'W' || t.includes('WARNING') || ['TOR:', 'SVR:', 'FFW:', 'SMW:'].some(k => t.includes(k))) {
    return 'warnings';
  }
  if (sig === 'A' || t.includes('WATCH') || ['TOA:', 'SVA:', 'FFA:'].some(k => t.includes(k))) {
    return 'watches';
  }
  if (['Y', 'S'].includes(sig) || t.includes('ADVISORY') || t.includes('STATEMENT') || t.includes('SPS') || t.includes('SPECIAL WEATHER')) {
    return 'advisories';
  }
  return 'chat';
}

function setOffice(wfo) {
  if (!IEM_CHANNELS[wfo]) return;
  activeIEMTab = wfo;

  const btnOkx = document.getElementById('tab-btn-okx');
  const btnPhi = document.getElementById('tab-btn-phi');
  const indicator = document.getElementById('active-tab-indicator');

  if (btnOkx && btnPhi) {
    if (wfo === 'OKX') {
      btnOkx.className = 'iem-tab-btn flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition border border-[#38bdf8] bg-[#1e293b] text-[#38bdf8] shadow-sm';
      btnOkx.querySelector('span')?.classList.add('animate-pulse');
      btnPhi.className = 'iem-tab-btn flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition border border-transparent';
      btnPhi.querySelector('span')?.classList.remove('animate-pulse');
    } else {
      btnPhi.className = 'iem-tab-btn flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition border border-[#38bdf8] bg-[#1e293b] text-[#38bdf8] shadow-sm';
      btnPhi.querySelector('span')?.classList.add('animate-pulse');
      btnOkx.className = 'iem-tab-btn flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition border border-transparent';
      btnOkx.querySelector('span')?.classList.remove('animate-pulse');
    }
  }

  if (indicator) {
    if (wfo === 'OKX') {
      indicator.textContent = 'OKX LIVE';
      indicator.className = 'text-[10px] font-mono text-[#38bdf8] font-bold uppercase border border-[#38bdf8]/30 bg-[#38bdf8]/10 px-2 py-0.5 rounded';
    } else {
      indicator.textContent = 'PHI LIVE';
      indicator.className = 'text-[10px] font-mono text-purple-400 font-bold uppercase border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 rounded';
    }
  }

  renderIEMActiveFeed(true);
  fetchOfficeData(wfo);
}
window.setOffice = setOffice;
window.switchIEMTab = setOffice;

function setIemFilter(filterCategory) {
  activeIEMFilter = filterCategory;

  const filterMap = {
    'all': { id: 'filter-btn-all', activeClass: 'iem-filter-pill px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition border border-sky-500/40 bg-sky-500/20 text-sky-300 shadow-sm whitespace-nowrap' },
    'alerts': { id: 'filter-btn-alerts', activeClass: 'iem-filter-pill px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition border border-amber-500/40 bg-amber-500/20 text-amber-300 shadow-sm whitespace-nowrap' },
    'warnings': { id: 'filter-btn-warnings', activeClass: 'iem-filter-pill px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition border border-red-500/40 bg-red-500/20 text-red-300 shadow-sm whitespace-nowrap' },
    'chat': { id: 'filter-btn-chat', activeClass: 'iem-filter-pill px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition border border-slate-500/40 bg-slate-700/40 text-slate-200 shadow-sm whitespace-nowrap' }
  };

  const inactiveClass = 'iem-filter-pill px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition border border-transparent whitespace-nowrap';

  Object.keys(filterMap).forEach(key => {
    const btn = document.getElementById(filterMap[key].id);
    if (btn) {
      btn.className = (key === filterCategory) ? filterMap[key].activeClass : inactiveClass;
    }
  });

  renderIEMActiveFeed(false);
}
window.setIemFilter = setIemFilter;

function setImageFilter(filterCategory) {
  activeImageFilter = filterCategory;

  const filterMap = {
    'all': { id: 'img-filter-all', activeClass: 'iem-filter-pill px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition border border-emerald-500/40 bg-emerald-500/20 text-emerald-300 shadow-sm whitespace-nowrap' },
    'radar': { id: 'img-filter-radar', activeClass: 'iem-filter-pill px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition border border-sky-500/40 bg-sky-500/20 text-sky-300 shadow-sm whitespace-nowrap' },
    'briefings': { id: 'img-filter-briefings', activeClass: 'iem-filter-pill px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition border border-amber-500/40 bg-amber-500/20 text-amber-300 shadow-sm whitespace-nowrap' },
    'skewt': { id: 'img-filter-skewt', activeClass: 'iem-filter-pill px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition border border-cyan-500/40 bg-cyan-500/20 text-cyan-300 shadow-sm whitespace-nowrap' }
  };

  const inactiveClass = 'iem-filter-pill px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition border border-transparent whitespace-nowrap';

  Object.keys(filterMap).forEach(key => {
    const btn = document.getElementById(filterMap[key].id);
    if (btn) {
      btn.className = (key === filterCategory) ? filterMap[key].activeClass : inactiveClass;
    }
  });

  renderIEMActiveFeed(false);
}
window.setImageFilter = setImageFilter;

function renderIEMMessageCard(msg) {
  const isChat = msg.isChat || msg.category === 'chat';

  if (isChat) {
    const authorBadge = msg.author ? `<span class="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">👤 ${msg.author}</span>` : '';
    const wfoBadge = `<span class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${msg.roomBadgeColor}">${msg.wfo}</span>`;
    const timeStampStr = `<span class="text-[9px] font-mono font-medium text-slate-400">${msg.dateStr}</span>`;

    return `
      <div class="bg-slate-900/80 border-y border-r border-slate-700/60 border-l-[3px] border-l-slate-500 rounded-lg p-3 hover:bg-slate-800/90 transition shadow-sm break-words relative group mb-2.5">
        <div class="flex items-center justify-between gap-2 mb-1.5 border-b border-slate-800/80 pb-1.5">
          <div class="flex items-center gap-1.5 flex-wrap">
            ${wfoBadge}
            ${authorBadge}
            ${timeStampStr}
          </div>
          <span class="text-[9px] font-mono text-slate-500 uppercase tracking-wide">CHAT</span>
        </div>
        <div class="text-xs text-slate-200 font-mono leading-relaxed select-text">
          ${msg.summaryText}
        </div>
      </div>
    `;
  }

  const borderClass = msg.borderClass || (msg.category === 'warnings' ? 'border-l-red-500' : (msg.category === 'watches' ? 'border-l-amber-500' : 'border-l-cyan-400'));
  const wfoBadge = `<span class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${msg.roomBadgeColor}">${msg.wfo}</span>`;
  const timeStampStr = `<span class="text-[9px] font-mono font-medium text-slate-400">${msg.dateStr}</span>`;
  const etnBadge = msg.etn ? `<span class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${msg.badgeStyle}">#${msg.etn}</span>` : '';

  return `
    <div class="bg-slate-900/80 border-y border-r border-slate-700/60 border-l-[3px] ${borderClass} rounded-lg p-3 hover:bg-slate-800/90 transition shadow-sm break-words relative group mb-2.5">
      <div class="flex items-center justify-between gap-2 mb-1.5 border-b border-slate-800/80 pb-1.5">
        <div class="flex items-center gap-1.5 flex-wrap">
          ${wfoBadge}
          ${timeStampStr}
          ${etnBadge}
        </div>
        <a href="${msg.link}" target="_blank" rel="noopener noreferrer" class="opacity-0 group-hover:opacity-100 transition text-[9px] text-sky-400 font-bold uppercase tracking-wide">
          VTEC Detail ↗
        </a>
      </div>
      <div class="text-xs font-bold ${msg.titleColor} font-mono leading-tight mb-1">
        ${msg.eventTitle}
      </div>
      <div class="text-xs text-slate-200 font-mono leading-relaxed select-text">
        ${msg.summaryText}
      </div>
    </div>
  `;
}

function getRoutineImagery(wfo) {
  const channel = IEM_CHANNELS[wfo] || IEM_CHANNELS.OKX;
  const radarSite = channel.radarSite;

  return [
    {
      id: `radar_${radarSite}`,
      category: 'radar',
      badgeText: `📡 ${radarSite} LIVE NEXRAD LOOP (.GIF)`,
      badgeStyle: 'bg-slate-900/80 text-sky-400 border border-sky-500/40 backdrop-blur-sm',
      url: `https://radar.weather.gov/ridge/standard/${radarSite}_0.gif?t=${Date.now()}`,
      fallbackUrl: `https://radar.weather.gov/ridge/standard/${radarSite}_loop.gif`
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
      url: `https://radar.weather.gov/ridge/standard/NORTHEAST_0.gif?t=${Date.now()}`,
      fallbackUrl: `https://radar.weather.gov/ridge/standard/NORTHEAST_loop.gif`
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

function renderIEMActiveFeed(autoScroll = false) {
  const chatContainer = document.getElementById('iembot-feed');
  const imgContainer = document.getElementById('iembot-images-feed');
  if (!chatContainer) return;

  const currentChannel = IEM_CHANNELS[activeIEMTab];
  const allMessages = currentChannel ? currentChannel.messages : [];
  const warningImages = currentChannel ? (currentChannel.warningImages || []) : [];
  const routineImages = getRoutineImagery(activeIEMTab);

  // Filter messages based on active filter pill
  const filteredMessages = allMessages.filter(m => {
    if (activeIEMFilter === 'all') return true;
    if (activeIEMFilter === 'alerts') return ['warnings', 'watches', 'advisories'].includes(m.category);
    if (activeIEMFilter === 'warnings') return m.category === 'warnings';
    if (activeIEMFilter === 'chat') return m.isChat || m.category === 'chat';
    return true;
  });

  // 1. Panel 1: Message Feed
  if (filteredMessages.length === 0) {
    const filterLabels = {
      'all': 'messages or alerts',
      'alerts': 'active weather alerts',
      'warnings': 'active warnings',
      'chat': 'spotter reports or chat messages'
    };
    const activeLabel = filterLabels[activeIEMFilter] || 'matching products';
    chatContainer.innerHTML = `
      <div class="h-full min-h-[220px] flex flex-col items-center justify-center p-6 text-center">
        <div class="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mb-2.5 text-slate-400">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <div class="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider mb-1">No Messages</div>
        <p class="text-xs text-slate-500 font-mono">No ${activeLabel} currently in stream for ${currentChannel ? currentChannel.name : activeIEMTab}.</p>
      </div>
    `;
  } else {
    chatContainer.innerHTML = filteredMessages.map(renderIEMMessageCard).join('');
    if (autoScroll) {
      chatContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // 2. Panel 2: 100% Animated GIF Operational Visual Stream
  if (imgContainer) {
    let allDeckImages = [];

    // Push active VTEC animated warning loops (.gif)
    warningImages.forEach(w => {
      allDeckImages.push({
        id: `${w.id}_radar_gif`,
        isWarning: true,
        category: 'radar',
        badgeText: `🔴 ${w.phenCode} #${w.etn} RADAR LOOP (.GIF)`,
        badgeStyle: 'bg-red-950/90 text-red-300 border border-red-500/80 animate-pulse backdrop-blur-sm font-extrabold',
        borderClass: 'border-2 border-red-500 shadow-lg shadow-red-950/60',
        url: w.radarGifUrl,
        fallbackUrl: w.radarFallbackUrl
      });
    });

    // Append 100% GIF operational graphics
    routineImages.forEach(r => {
      allDeckImages.push({
        id: r.id,
        isWarning: false,
        category: r.category,
        badgeText: r.badgeText,
        badgeStyle: r.badgeStyle,
        borderClass: 'border border-slate-800 hover:border-slate-600',
        url: r.url,
        fallbackUrl: r.fallbackUrl
      });
    });

    // Filter images
    const filteredImages = allDeckImages.filter(img => {
      if (activeImageFilter === 'all') return true;
      if (activeImageFilter === 'radar') return img.category === 'radar';
      if (activeImageFilter === 'briefings') return img.category === 'briefings';
      if (activeImageFilter === 'skewt') return img.category === 'skewt';
      return true;
    });

    imgContainer.innerHTML = filteredImages.map(item => `
      <div class="relative w-full overflow-hidden rounded-xl ${item.borderClass} bg-slate-950 shadow-md group transition-all duration-200 mb-4">
        <!-- Floating Translucent Top-Left Badge -->
        <div class="absolute top-2.5 left-2.5 z-10">
          <span class="inline-flex items-center px-2 py-1 rounded text-[10px] font-mono tracking-wider shadow-sm uppercase ${item.badgeStyle}">
            ${item.badgeText}
          </span>
        </div>

        <!-- Floating Top-Right Raw Expand Link -->
        <a href="${item.url}" target="_blank" rel="noopener noreferrer" 
           class="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 flex items-center justify-center text-xs font-mono font-bold backdrop-blur-sm opacity-80 hover:opacity-100 transition shadow"
           title="Open Animated GIF">
          ↗
        </a>

        <!-- Pure Edge-to-Edge Animated GIF -->
        <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="block w-full h-auto bg-slate-950 cursor-zoom-in">
          <img src="${item.url}" 
               alt="${item.badgeText}"
               class="w-full h-auto object-cover display-block hover:brightness-105 transition duration-200"
               loading="lazy"
               onerror="if(!this.dataset.triedFallback && '${item.fallbackUrl}'){this.dataset.triedFallback='1';this.src='${item.fallbackUrl}';}else{this.parentElement.style.display='none';}" />
        </a>
      </div>
    `).join('');
  }
}

async function fetchOfficeData(targetWfo = null) {
  try {
    const curYear = new Date().getUTCFullYear();
    const wfos = targetWfo ? [targetWfo] : ['OKX', 'PHI'];

    for (const wfo of wfos) {
      const channel = IEM_CHANNELS[wfo];
      if (!channel) continue;

      const combinedMessages = [];
      const warningImages = [];

      // 1. Fetch GeoJSON Structured VTEC Data
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
              const dateStr = issueDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
              
              const cfg = PHEN_CONFIG[phen] || { name: warnName || `${phen} Product`, code: `${phen}.${sig}`, color: 'text-sky-400', bg: 'bg-sky-500/80 text-white border-sky-400', border: 'border-l-sky-400' };
              const fullTitle = `${cleanWfo} ${cfg.name}`;
              const summaryStr = props.text || props.desc || `${cfg.name} in effect for ${cleanWfo} area.`;
              const alertCategory = classifyAlert(fullTitle + ' ' + summaryStr, phen, sig);

              combinedMessages.push({
                id: `vtec_${cleanWfo}_${yr}_${phen}_${sig}_${etn}`,
                wfo: cleanWfo,
                isChat: false,
                author: '',
                eventTitle: fullTitle,
                summaryText: summaryStr,
                dateStr: dateStr,
                pubDate: issueDate.toISOString(),
                etn: etn || '',
                category: alertCategory,
                titleColor: cfg.color,
                badgeStyle: cfg.bg,
                borderClass: cfg.border,
                roomBadgeColor: channel.badgeColor,
                link: `https://mesonet.agron.iastate.edu/vtec/#${yr}-O-NEW-K${cleanWfo}-${phen}-${sig}-${etn ? String(etn).padStart(4, '0') : ''}`
              });

              // Warning Animated Radar Loops (.GIF)
              if (sig === 'W' && ['MA', 'SV', 'TO', 'FF'].includes(phen) && etn) {
                const etnStr = String(etn).padStart(4, '0');
                const gifUrl = `https://mesonet.agron.iastate.edu/vtec/f/${yr}-O-NEW-K${cleanWfo}-${phen}-W-${etnStr}.gif`;
                const fallbackUrl = `https://mesonet.agron.iastate.edu/GIS/radmap.php?vtec=${yr}.O.NEW.K${cleanWfo}.${phen}.W.${etnStr}`;

                warningImages.push({
                  id: `vtec_img_${cleanWfo}_${etnStr}`,
                  wfo: cleanWfo,
                  phenCode: cfg.code || `${phen}.W`,
                  etn: etnStr,
                  dateStr: dateStr,
                  eventTitle: fullTitle,
                  radarGifUrl: gifUrl,
                  radarFallbackUrl: fallbackUrl
                });
              }
            });
          }
        }
      } catch (err) {
        console.warn(`GeoJSON fetch error for ${wfo}:`, err);
      }

      // 2. Fetch Live Room Chat & Spotter Dialogue via proxy
      try {
        const resChat = await fetch(`/api/iembot?room=${channel.room}&t=${Date.now()}`);
        if (resChat.ok) {
          const xmlText = await resChat.text();
          const xmlDoc = new DOMParser().parseFromString(xmlText, 'text/xml');
          const items = xmlDoc.querySelectorAll('item');

          items.forEach(item => {
            const rawTitle = item.querySelector('title')?.textContent || '';
            const rawDesc = item.querySelector('description')?.textContent || '';
            const pubDate = item.querySelector('pubDate')?.textContent || '';
            const author = item.querySelector('author')?.textContent || item.querySelector('dc\\:creator')?.textContent || '';
            const rawContent = (rawDesc || rawTitle).trim();

            if (!rawContent) return;

            let cleanText = rawContent
              .replace(/^[0-9]{3,4}\s+[A-Z0-9]{4,6}\s+[A-Z0-9]{4}\s+[0-9]{6}[^\n]*\n?/i, '')
              .replace(/\b(WHUS|WWUS|WFUS|WTUS|WGUS|NWUS)[0-9]{2}\s+[A-Z0-9]{4}\s+[0-9]{6}\b/gi, '')
              .replace(/\/([A-Z])\.(NEW|CON|EXT|EXA|EXB|UPG|CAN|COR|ROU)\.[A-Z0-9./-]+\//g, '')
              .replace(/LAT\.\.\.LON[\s0-9]+/gi, '')
              .replace(/\$\$[\s\S]*$/g, '')
              .trim();

            if (!cleanText) cleanText = rawContent;

            const isAlert = /warning|watch|advisory|statement|tornado|severe|flood/i.test(cleanText);
            const dateObj = pubDate ? new Date(pubDate) : new Date();
            const dateStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
            const cat = isAlert ? classifyAlert(cleanText) : 'chat';

            if (!combinedMessages.some(m => m.summaryText === cleanText || m.id.includes(cleanText.slice(0, 30)))) {
              combinedMessages.push({
                id: `chat_${wfo}_${pubDate}_${Math.random().toString(36).substr(2, 5)}`,
                wfo: wfo,
                isChat: !isAlert,
                author: author || 'NWS/Spotter',
                eventTitle: isAlert ? `${wfo} Weather Update` : `${wfo} Room Discussion`,
                summaryText: cleanText,
                dateStr: dateStr,
                pubDate: dateObj.toISOString(),
                etn: '',
                category: cat,
                titleColor: isAlert ? 'text-amber-400' : 'text-slate-200',
                badgeStyle: isAlert ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-slate-800 text-slate-300 border-slate-700',
                borderClass: isAlert ? 'border-l-amber-500' : 'border-l-slate-500',
                roomBadgeColor: channel.badgeColor,
                link: 'https://weather.im/iembot/'
              });
            }
          });
        }
      } catch (chatErr) {
        console.warn(`Chat RSS fetch error for ${wfo}:`, chatErr);
      }

      channel.messages = combinedMessages.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate)).slice(0, 60);
      channel.warningImages = warningImages;
    }

    renderIEMActiveFeed(false);
  } catch(e) {
    console.warn("Unified office data fetch error:", e);
  }
}

// Global auto-poll every 25 seconds
fetchOfficeData();
setInterval(() => fetchOfficeData(), 25000);
