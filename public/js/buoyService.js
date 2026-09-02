// ===== MARINE BUOY TELEMETRY SERVICE (NDBC VIA IEM GEOJSON) =====
import { CONFIG } from './config.js';

export const BuoyService = {
  async fetchBuoyTelemetry() {
    try {
      const res = await fetch(`/api/buoys?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch (err) {
      console.warn("Buoy telemetry fetch error:", err);
    }
    return [];
  }
};
