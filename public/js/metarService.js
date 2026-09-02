// ===== AVIATION METAR OBSERVATION SERVICE =====
import { CONFIG } from './config.js';

export function calculateFlightCategory(visSM, ceilingFt) {
  const v = (visSM !== null && visSM !== undefined) ? visSM : 10;
  const c = (ceilingFt !== null && ceilingFt !== undefined) ? ceilingFt : 25000;

  if (c < 500 || v < 1) return { cat: 'LIFR', badge: 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/40' };
  if (c < 1000 || v < 3) return { cat: 'IFR', badge: 'bg-red-500/20 text-red-400 border-red-500/40' };
  if (c <= 3000 || v <= 5) return { cat: 'MVFR', badge: 'bg-blue-500/20 text-blue-400 border-blue-500/40' };
  return { cat: 'VFR', badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' };
}

export const MetarService = {
  async fetchAirportObservations() {
    const promises = CONFIG.AIRPORTS.map(async (apt) => {
      try {
        const res = await fetch(`https://api.weather.gov/stations/${apt.id}/observations/latest`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const props = data.properties || {};

        let visSM = null;
        if (props.visibility && props.visibility.value !== null) {
          visSM = parseFloat((props.visibility.value / 1609.34).toFixed(1));
        }

        let ceilingFt = null;
        let cloudStr = 'CLR';
        if (Array.isArray(props.cloudLayers) && props.cloudLayers.length > 0) {
          cloudStr = props.cloudLayers.map(l => {
            const baseFt = l.base && l.base.value !== null ? Math.round(l.base.value * 3.28084) : '';
            if (['BKN', 'OVC'].includes(l.amount) && baseFt !== '' && (ceilingFt === null || baseFt < ceilingFt)) {
              ceilingFt = baseFt;
            }
            return `${l.amount} ${baseFt ? String(baseFt).padStart(3, '0') : ''}`.trim();
          }).join(', ');
        }

        const flt = calculateFlightCategory(visSM, ceilingFt);
        let wspdKt = 0;
        let wgstKt = '';
        let wdirStr = 'VRB';
        if (props.windDirection && props.windDirection.value !== null) {
          wdirStr = `${String(Math.round(props.windDirection.value)).padStart(3, '0')}°`;
        }
        if (props.windSpeed && props.windSpeed.value !== null) {
          wspdKt = Math.round(props.windSpeed.value * 0.539957);
        }
        if (props.windGust && props.windGust.value !== null) {
          wgstKt = ` G${Math.round(props.windGust.value * 0.539957)}kt`;
        }

        let tempStr = '--';
        if (props.temperature && props.temperature.value !== null) {
          const c = props.temperature.value;
          tempStr = `${Math.round(c * 9/5 + 32)}°F (${c.toFixed(1)}°C)`;
        }

        let altimStr = '--';
        if (props.barometricPressure && props.barometricPressure.value !== null) {
          altimStr = `${(props.barometricPressure.value / 3386.38867).toFixed(2)} inHg`;
        }

        return {
          id: apt.id,
          name: apt.name,
          flightCategory: flt.cat,
          badgeClass: flt.badge,
          wind: `${wdirStr} @ ${wspdKt}kt${wgstKt}`,
          visibility: visSM !== null ? `${visSM} SM` : '10+ SM',
          clouds: cloudStr,
          temp: tempStr,
          altimeter: altimStr,
          raw: props.rawMessage || `${apt.id} METAR unavailable`
        };
      } catch (err) {
        return {
          id: apt.id,
          name: apt.name,
          flightCategory: 'UNAVAIL',
          badgeClass: 'bg-slate-800 text-slate-400',
          wind: '--',
          visibility: '--',
          clouds: '--',
          temp: '--',
          altimeter: '--',
          raw: `${apt.id} observation momentarily unavailable`
        };
      }
    });

    return Promise.all(promises);
  }
};
