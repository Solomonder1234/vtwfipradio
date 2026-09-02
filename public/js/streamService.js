// ===== STREAM & WEB AUDIO SERVICE =====
import { CONFIG } from './config.js';
import { appState } from './state.js';

let audioCtx = null;
let analyser = null;
let sourceNode = null;
let animFrameId = null;

export const StreamService = {
  initAudioVisualizer(audioEl, canvasEl, vuBarEl, dbTextEl, dotEl, statusTextEl) {
    if (!canvasEl) return;
    const canvasCtx = canvasEl.getContext('2d');

    function initWebAudio() {
      if (!audioCtx) {
        const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
        if (AudioCtxClass) {
          try {
            audioCtx = new AudioCtxClass();
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 64;
            analyser.smoothingTimeConstant = 0.8;

            if (!sourceNode && audioEl) {
              sourceNode = audioCtx.createMediaElementSource(audioEl);
              sourceNode.connect(analyser);
              analyser.connect(audioCtx.destination);
            }
          } catch (e) {
            console.warn('Web Audio init fallback:', e);
          }
        }
      }
    }

    let fakePhase = 0;
    function renderLoop() {
      if (!canvasCtx || audioEl.paused) return;

      const bufferLength = analyser ? analyser.frequencyBinCount : 32;
      const dataArray = new Uint8Array(bufferLength);
      let isReal = false;

      if (analyser) {
        try {
          analyser.getByteFrequencyData(dataArray);
          for (let i = 0; i < bufferLength; i++) {
            if (dataArray[i] > 0) { isReal = true; break; }
          }
        } catch (e) {}
      }

      if (!isReal) {
        fakePhase += 0.15;
        for (let i = 0; i < bufferLength; i++) {
          const bassBoost = Math.max(0, (12 - i) * 8);
          const wave1 = Math.sin(fakePhase + i * 0.4) * 45;
          const wave2 = Math.cos(fakePhase * 1.3 + i * 0.7) * 35;
          dataArray[i] = Math.max(15, Math.min(240, 80 + bassBoost + wave1 + wave2 + (Math.random() * 30)));
        }
      }

      canvasCtx.clearRect(0, 0, canvasEl.width, canvasEl.height);
      const barWidth = (canvasEl.width / bufferLength) * 0.85;
      let x = 1;
      let totalEnergy = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * (canvasEl.height - 2);
        totalEnergy += dataArray[i];

        let fillColor = '#22c55e';
        if (dataArray[i] > 200) fillColor = '#ef4444';
        else if (dataArray[i] > 140) fillColor = '#f59e0b';

        canvasCtx.fillStyle = fillColor;
        canvasCtx.fillRect(x, canvasEl.height - barHeight, barWidth, barHeight);
        x += barWidth + 1.5;
      }

      const avg = totalEnergy / bufferLength;
      const peakPercent = Math.min(100, Math.round((avg / 200) * 100));
      if (vuBarEl) {
        vuBarEl.style.width = `${peakPercent}%`;
        vuBarEl.className = peakPercent > 85 ? 'bg-red-500 h-full' : (peakPercent > 60 ? 'bg-amber-400 h-full' : 'bg-ern-green h-full');
      }
      if (dbTextEl) {
        dbTextEl.textContent = avg > 0 ? `${(20 * Math.log10(avg / 255)).toFixed(1)} dB` : '-∞ dB';
      }

      animFrameId = requestAnimationFrame(renderLoop);
    }

    audioEl.addEventListener('play', () => {
      initWebAudio();
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
      if (dotEl) dotEl.className = 'w-2 h-2 rounded-full bg-ern-green animate-pulse';
      if (statusTextEl) {
        statusTextEl.innerHTML = 'RF Spectrum &bull; Active (44.1kHz)';
        statusTextEl.className = 'text-[11px] font-mono text-emerald-400 uppercase tracking-wider';
      }
      cancelAnimationFrame(animFrameId);
      renderLoop();
    });

    audioEl.addEventListener('pause', () => {
      if (dotEl) dotEl.className = 'w-2 h-2 rounded-full bg-slate-500';
      if (statusTextEl) {
        statusTextEl.innerHTML = 'RF Spectrum Analyser &bull; Standby';
        statusTextEl.className = 'text-[11px] font-mono text-slate-400 uppercase tracking-wider';
      }
      cancelAnimationFrame(animFrameId);
      if (canvasCtx) canvasCtx.clearRect(0, 0, canvasEl.width, canvasEl.height);
      if (vuBarEl) vuBarEl.style.width = '0%';
      if (dbTextEl) dbTextEl.textContent = '-∞ dB';
    });
  },

  async pollMetadata() {
    try {
      const res = await fetch(`/api/nowplaying?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        appState.setState({
          isPrimaryActive: data.isPrimaryActive !== false,
          nowPlaying: data
        });
      }
    } catch (e) {
      console.warn('Metadata poll error:', e);
    }
  },

  startPolling() {
    this.pollMetadata();
    return setInterval(() => this.pollMetadata(), CONFIG.STREAM.METADATA_POLL_MS);
  }
};
