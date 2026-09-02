// ===== REACTIVE CENTRAL APPLICATION STATE =====
export class StateStore {
  constructor() {
    this.state = {
      office: 'OKX',
      filterCategory: 'all', // 'all', 'alerts', 'warnings', 'chat'
      imageFilter: 'all',
      isPrimaryActive: true,
      isPlaying: false,
      nowPlaying: null,
      messages: { OKX: [], PHI: [] },
      warningImages: { OKX: [], PHI: [] }
    };
    this.listeners = new Set();
  }

  getState() {
    return this.state;
  }

  setState(updates) {
    this.state = { ...this.state, ...updates };
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}

export const appState = new StateStore();
