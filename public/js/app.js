// ===== MAIN DASHBOARD APPLICATION ENTRYPOINT =====
import { CONFIG } from './config.js';
import { appState } from './state.js';
import { StreamService } from './streamService.js';
import { IemService } from './iemService.js';

// DOM Elements
const audio = document.getElementById('audio-player');
const spectrumCanvas = document.getElementById('audio-spectrum-canvas');
const vuBar = document.getElementById('audio-vu-bar');
const dbText = document.getElementById('audio-db-text');
const spectrumDot = document.getElementById('spectrum-live-dot');
const spectrumStatusText = document.getElementById('spectrum-status-text');

const emergencyBanner = document.getElementById('emergency-banner');
const bannerText = document.getElementById('banner-text');
const nowPlayingTitle = document.getElementById('track-title');
const nowPlayingArtist = document.getElementById('track-artist');
const nowPlayingBadge = document.getElementById('track-badge');
const albumCover = document.getElementById('album-cover');

const chatContainer = document.getElementById('iembot-feed');
const imgContainer = document.getElementById('iembot-images-feed');

function renderMessages(messages, activeFilter) {
  if (!chatContainer) return;
  const filtered = messages.filter(m => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'alerts') return ['warnings', 'watches', 'advisories'].includes(m.category);
    if (activeFilter === 'warnings') return m.category === 'warnings';
    if (activeFilter === 'chat') return m.isChat || m.category === 'chat';
    return true;
  });

  if (filtered.length === 0) {
    chatContainer.innerHTML = `
      <div class="h-full min-h-[220px] flex flex-col items-center justify-center p-6 text-center">
        <div class="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mb-2.5 text-slate-400">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <div class="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider mb-1">No Messages</div>
        <p class="text-xs text-slate-500 font-mono">No matching products currently in stream.</p>
      </div>
    `;
    return;
  }

  chatContainer.innerHTML = filtered.map(msg => {
    if (msg.isChat || msg.category === 'chat') {
      const authorBadge = msg.author ? `<span class="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">👤 ${msg.author}</span>` : '';
      return `
        <div class="bg-slate-900/80 border-y border-r border-slate-700/60 border-l-[3px] border-l-slate-500 rounded-lg p-3 hover:bg-slate-800/90 transition shadow-sm mb-2.5">
          <div class="flex items-center justify-between gap-2 mb-1.5 border-b border-slate-800/80 pb-1.5">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${msg.roomBadgeColor}">${msg.wfo}</span>
              ${authorBadge}
              <span class="text-[9px] font-mono font-medium text-slate-400">${msg.dateStr}</span>
            </div>
            <span class="text-[9px] font-mono text-slate-500 uppercase tracking-wide">CHAT</span>
          </div>
          <div class="text-xs text-slate-200 font-mono leading-relaxed select-text">${msg.summaryText}</div>
        </div>
      `;
    }

    return `
      <div class="bg-slate-900/80 border-y border-r border-slate-700/60 border-l-[3px] ${msg.borderClass} rounded-lg p-3 hover:bg-slate-800/90 transition shadow-sm mb-2.5">
        <div class="flex items-center justify-between gap-2 mb-1.5 border-b border-slate-800/80 pb-1.5">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${msg.roomBadgeColor}">${msg.wfo}</span>
            <span class="text-[9px] font-mono font-medium text-slate-400">${msg.dateStr}</span>
            ${msg.etn ? `<span class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${msg.badgeStyle}">#${msg.etn}</span>` : ''}
          </div>
          <a href="${msg.link}" target="_blank" rel="noopener noreferrer" class="text-[9px] text-sky-400 font-bold uppercase tracking-wide">VTEC Detail ↗</a>
        </div>
        <div class="text-xs font-bold ${msg.titleColor} font-mono leading-tight mb-1">${msg.eventTitle}</div>
        <div class="text-xs text-slate-200 font-mono leading-relaxed select-text">${msg.summaryText}</div>
      </div>
    `;
  }).join('');
}

function renderImagery(warningImages, office, activeImageFilter) {
  if (!imgContainer) return;
  const routine = IemService.get247RoutineImagery(office);
  let allImages = [];

  warningImages.forEach(w => {
    allImages.push({
      id: w.id,
      category: 'radar',
      badgeText: `🔴 ${w.phenCode} #${w.etn} RADAR LOOP (.GIF)`,
      badgeStyle: 'bg-red-950/90 text-red-300 border border-red-500/80 animate-pulse backdrop-blur-sm font-extrabold',
      borderClass: 'border-2 border-red-500 shadow-lg shadow-red-950/60',
      url: w.url,
      fallbackUrl: w.fallbackUrl
    });
  });

  routine.forEach(r => {
    allImages.push({
      id: r.id,
      category: r.category,
      badgeText: r.badgeText,
      badgeStyle: r.badgeStyle,
      borderClass: 'border border-slate-800 hover:border-slate-600',
      url: r.url,
      fallbackUrl: r.fallbackUrl
    });
  });

  const filtered = allImages.filter(img => {
    if (activeImageFilter === 'all') return true;
    if (activeImageFilter === 'radar') return img.category === 'radar';
    if (activeImageFilter === 'briefings') return img.category === 'briefings';
    if (activeImageFilter === 'skewt') return img.category === 'skewt';
    return true;
  });

  imgContainer.innerHTML = filtered.map(item => `
    <div class="relative w-full overflow-hidden rounded-xl ${item.borderClass} bg-slate-950 shadow-md group transition-all duration-200 mb-4">
      <div class="absolute top-2.5 left-2.5 z-10">
        <span class="inline-flex items-center px-2 py-1 rounded text-[10px] font-mono tracking-wider shadow-sm uppercase ${item.badgeStyle}">
          ${item.badgeText}
        </span>
      </div>
      <a href="${item.url}" target="_blank" rel="noopener noreferrer" 
         class="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 flex items-center justify-center text-xs font-mono font-bold backdrop-blur-sm opacity-80 hover:opacity-100 transition shadow">
        ↗
      </a>
      <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="block w-full h-auto bg-slate-950 cursor-zoom-in">
        <img src="${item.url}" alt="${item.badgeText}" class="w-full h-auto object-cover display-block hover:brightness-105 transition duration-200" loading="lazy" onerror="if(!this.dataset.triedFallback && '${item.fallbackUrl}'){this.dataset.triedFallback='1';this.src='${item.fallbackUrl}';}else{this.parentElement.style.display='none';}" />
      </a>
    </div>
  `).join('');
}

// Global Event Dispatches
window.setOffice = (office) => {
  appState.setState({ office });
  IemService.fetchOfficeData(office);
};

window.setIemFilter = (filterCategory) => {
  appState.setState({ filterCategory });
};

window.setImageFilter = (imageFilter) => {
  appState.setState({ imageFilter });
};

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Stream & Audio Analyser
  if (audio) {
    StreamService.initAudioVisualizer(audio, spectrumCanvas, vuBar, dbText, spectrumDot, spectrumStatusText);
    StreamService.startPolling();
  }

  // 2. State Observer
  appState.subscribe(state => {
    // Failover Banner & Now Playing updates
    if (state.nowPlaying) {
      if (nowPlayingTitle) nowPlayingTitle.textContent = state.nowPlaying.track || 'ERN-VTWF — Live Relay';
      if (nowPlayingArtist) nowPlayingArtist.textContent = state.nowPlaying.artist || 'EAS Relay Network';
      if (nowPlayingBadge) {
        nowPlayingBadge.textContent = state.isPrimaryActive ? 'PRIMARY LIVE' : 'BACKUP LIVE';
        nowPlayingBadge.className = state.isPrimaryActive ? 'px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-ern-green/20 text-ern-green' : 'px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-amber-500/20 text-amber-400';
      }
      if (albumCover && state.nowPlaying.artwork) {
        albumCover.src = state.nowPlaying.artwork;
      }
    }

    // Office tab buttons
    const btnOkx = document.getElementById('tab-btn-okx');
    const btnPhi = document.getElementById('tab-btn-phi');
    const indicator = document.getElementById('active-tab-indicator');
    if (btnOkx && btnPhi) {
      if (state.office === 'OKX') {
        btnOkx.className = 'iem-tab-btn flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition border border-[#38bdf8] bg-[#1e293b] text-[#38bdf8] shadow-sm';
        btnPhi.className = 'iem-tab-btn flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition border border-transparent';
        if (indicator) { indicator.textContent = 'OKX LIVE'; indicator.className = 'text-[10px] font-mono text-[#38bdf8] font-bold uppercase border border-[#38bdf8]/30 bg-[#38bdf8]/10 px-2 py-0.5 rounded'; }
      } else {
        btnPhi.className = 'iem-tab-btn flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition border border-[#38bdf8] bg-[#1e293b] text-[#38bdf8] shadow-sm';
        btnOkx.className = 'iem-tab-btn flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition border border-transparent';
        if (indicator) { indicator.textContent = 'PHI LIVE'; indicator.className = 'text-[10px] font-mono text-purple-400 font-bold uppercase border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 rounded'; }
      }
    }

    // Render Feeds
    const msgs = state.messages[state.office] || [];
    const imgs = state.warningImages[state.office] || [];
    renderMessages(msgs, state.filterCategory);
    renderImagery(imgs, state.office, state.imageFilter);
  });

  // 3. Ingest Office Feeds
  IemService.fetchOfficeData('OKX');
  IemService.fetchOfficeData('PHI');
  setInterval(() => {
    IemService.fetchOfficeData('OKX');
    IemService.fetchOfficeData('PHI');
  }, 25000);
});
