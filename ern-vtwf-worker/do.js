export class AnnouncementsDO {
  constructor(state) {
    this.state = state;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const json = (data, status = 200) => new Response(JSON.stringify(data), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
      }
    });

    if (url.pathname === '/get') {
      let announcements = await this.state.storage.get('announcements');
      if (!announcements) announcements = [];
      return json(announcements);
    }

    if (url.pathname === '/add' && request.method === 'POST') {
      const body = await request.json();
      let announcements = await this.state.storage.get('announcements');
      if (!announcements) announcements = [];
      const entry = {
        id: Date.now().toString(),
        date: new Date().toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        title: body.title || '',
        priority: body.priority || 'INFO',
        author: body.author || 'ERN Control Ops',
        message: body.message || '',
        html: body.html || '',
        discordMessageId: body.discordMessageId || null,
        timestamp: Date.now()
      };
      announcements.unshift(entry);
      await this.state.storage.put('announcements', announcements);
      return json({ success: true, announcement: entry });
    }

    if (url.pathname === '/edit' && (request.method === 'POST' || request.method === 'PUT')) {
      const body = await request.json();
      let announcements = await this.state.storage.get('announcements');
      if (!announcements) announcements = [];
      const idx = announcements.findIndex(a => a.id === body.id);
      if (idx === -1) {
        return json({ success: false, error: 'Announcement not found' }, 404);
      }
      const existing = announcements[idx];
      const updated = {
        ...existing,
        title: body.title !== undefined ? body.title : existing.title,
        priority: body.priority !== undefined ? body.priority : existing.priority,
        author: body.author !== undefined ? body.author : existing.author,
        message: body.message !== undefined ? body.message : existing.message,
        html: body.html !== undefined ? body.html : existing.html,
        discordMessageId: body.discordMessageId !== undefined ? body.discordMessageId : existing.discordMessageId,
        editedAt: Date.now(),
        isEdited: true
      };
      announcements[idx] = updated;
      await this.state.storage.put('announcements', announcements);
      return json({ success: true, announcement: updated });
    }

    if (url.pathname === '/delete' && request.method === 'DELETE') {
      const id = url.searchParams.get('id');
      let announcements = await this.state.storage.get('announcements');
      if (!announcements) announcements = [];
      let deletedMessageId = null;
      if (!id || id === 'all') {
        announcements = [];
      } else {
        const target = announcements.find(a => a.id === id);
        if (target) deletedMessageId = target.discordMessageId || null;
        announcements = announcements.filter(a => a.id !== id);
      }
      await this.state.storage.put('announcements', announcements);
      return json({ success: true, discordMessageId: deletedMessageId });
    }

    if (url.pathname === '/verify-auth' && request.method === 'POST') {
      const { clientIp } = await request.json();
      const adminIp = await this.state.storage.get('admin_authorized_ip');
      const isLoopback = (ip) => !ip || ip === '127.0.0.1' || ip === '::1' || ip === 'unknown';
      // If an admin IP has been registered, require the client IP to match (unless loopback/local)
      if (adminIp && clientIp && adminIp !== clientIp && !isLoopback(clientIp) && !isLoopback(adminIp)) {
        return json({ ok: false, error: 'Unauthorized IP address' }, 403);
      }
      return json({ ok: true, adminIp: adminIp || clientIp });
    }

    if (url.pathname === '/register-ip' && request.method === 'POST') {
      const { clientIp } = await request.json();
      if (clientIp) {
        await this.state.storage.put('admin_authorized_ip', clientIp);
      }
      return json({ success: true, registeredIp: clientIp });
    }

    if (url.pathname === '/status' && request.method === 'GET') {
      let statusData = await this.state.storage.get('station_status');
      if (!statusData) statusData = { status: 'OPERATIONAL', severeWeather: false, updatedAt: Date.now() };
      const adminIp = await this.state.storage.get('admin_authorized_ip');
      return json({ ...statusData, adminIp: adminIp || null });
    }

    if (url.pathname === '/status' && request.method === 'POST') {
      const body = await request.json();
      let current = await this.state.storage.get('station_status');
      if (!current) current = { status: 'OPERATIONAL', severeWeather: false };
      const statusData = {
        status: body.status !== undefined ? (body.status === 'OFFLINE' ? 'OFFLINE' : 'OPERATIONAL') : current.status,
        severeWeather: body.severeWeather !== undefined ? Boolean(body.severeWeather) : (current.severeWeather || false),
        updatedAt: Date.now()
      };
      await this.state.storage.put('station_status', statusData);
      return json({ success: true, ...statusData });
    }

    if (url.pathname === '/eas-alerts' && request.method === 'GET') {
      let alerts = await this.state.storage.get('decoded_eas_alerts');
      if (!alerts) alerts = [];
      // Auto-filter alerts expired more than 1 hour ago
      const now = Date.now();
      alerts = alerts.filter(a => a && (a.expiresMs > (now - 3600000)));
      return json(alerts);
    }

    if (url.pathname === '/eas-alerts' && request.method === 'DELETE') {
      await this.state.storage.put('decoded_eas_alerts', []);
      return json({ success: true, count: 0 });
    }

    if (url.pathname === '/eas-alerts' && request.method === 'POST') {
      const entry = await request.json();
      if (Array.isArray(entry)) {
        await this.state.storage.put('decoded_eas_alerts', entry);
        return json({ success: true, count: entry.length });
      }
      let alerts = await this.state.storage.get('decoded_eas_alerts');
      if (!alerts) alerts = [];
      const isDup = alerts.some(a => (a.code === entry.code && a.fips === entry.fips && (Math.abs(a.timeMs - entry.timeMs) < 600000)));
      if (!isDup) {
        alerts.unshift(entry);
        if (alerts.length > 50) alerts.pop();
        await this.state.storage.put('decoded_eas_alerts', alerts);
      }
      return json({ success: true, count: alerts.length });
    }

    return new Response('Not Found', { status: 404 });
  }
}