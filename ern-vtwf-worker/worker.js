// ERN / VTWF — Cloudflare Worker with Durable Object
// Serves all pages + API routes for login & announcements

export { AnnouncementsDO } from './do';

const MAINTENANCE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Station Maintenance & Upgrade — ERN / VTWF</title>
  <meta name="description" content="ERN / VTWF Station Maintenance & Hardware Upgrade." />
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%23ef4444'/><text x='50' y='68' font-size='38' font-weight='800' fill='white' text-anchor='middle' font-family='sans-serif'>ERN</text></svg>" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            'ern-dark': '#0f172a',
            'ern-surface': '#1e293b',
            'ern-border': '#334155',
            'ern-green': '#22c55e',
            'ern-amber': '#f59e0b',
            'ern-red': '#ef4444',
          },
          fontFamily: { 'mono': ['JetBrains Mono', 'ui-monospace', 'monospace'] }
        }
      }
    }
  </script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
  <style>
    body { font-family: 'Inter', sans-serif; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
    .scanline { background: repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 3px); }
  </style>
</head>
<body class="bg-ern-dark text-slate-200 min-h-screen flex flex-col items-center justify-center p-4 scanline">
  <div class="max-w-lg w-full bg-ern-surface rounded-2xl border border-ern-border p-6 sm:p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
    <div class="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 text-3xl shadow-lg shadow-amber-500/20 animate-pulse">
      🔧
    </div>
    
    <div class="space-y-2">
      <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
        <span class="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
        CRITICAL INFRASTRUCTURE ADVISORY
      </span>
      <h1 class="text-2xl font-extrabold text-white">Broadcast System Stability Alert</h1>
      <p class="text-slate-400 text-sm leading-relaxed">
        <strong>HopCast</strong> is temporarily offline due to hardware kernel panics/BSODs. <strong>ERN / VTWF</strong> remains active (with potential 24/7 YouTube live streaming planned).
      </p>
    </div>

    <div class="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-left space-y-2.5 text-xs font-mono">
      <div class="flex justify-between items-center text-slate-400">
        <span>Station Status Page:</span>
        <a href="https://status.listentovtwfip.org" class="text-emerald-400 hover:underline flex items-center gap-1 font-bold">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Live 24/7 (Online) ↗
        </a>
      </div>
      <div class="flex justify-between items-center text-slate-400">
        <span>Primary Audio Stream:</span>
        <a href="https://icecast.gwes-eas.network/ERN-VTWF" target="_blank" class="text-sky-400 hover:underline">Direct Link ↗</a>
      </div>
      <div class="flex justify-between items-center text-slate-400">
        <span>Backup Relay Stream:</span>
        <a href="http://radio.wjonip.org/wjonip" target="_blank" class="text-amber-400 hover:underline">WJON-IP Direct ↗</a>
      </div>
    </div>

    <div class="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
      <a href="https://status.listentovtwfip.org" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white text-sm transition shadow-lg shadow-emerald-900/40">
        View Live Status &amp; Uptime Page ↗
      </a>
      <a href="/login.html" class="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono font-bold text-slate-300 transition">
        <svg class="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
        Admin Console 🔐
      </a>
    </div>

    <p class="text-[11px] text-slate-500 font-mono">EAS Relay Network (ERN / VTWF) &bull; New York City, NY</p>
  </div>
</body>
</html>`;

function getClientIp(request) {
  const cfIp = request.headers.get('CF-Connecting-IP');
  if (cfIp) {
    const ip = cfIp.trim();
    if (ip === '::1' || ip === '::ffff:127.0.0.1') return '127.0.0.1';
    return ip;
  }
  const forwardedFor = request.headers.get('X-Forwarded-For');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0].trim();
    if (firstIp === '::1' || firstIp === '::ffff:127.0.0.1') return '127.0.0.1';
    return firstIp;
  }
  return '127.0.0.1';
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const id = env.ANNOUNCEMENTS.idFromName("ern-vtwf");
    const stub = env.ANNOUNCEMENTS.get(id);
    const clientIp = getClientIp(request);

    // ===== UPTIME KUMA REVERSE PROXY (status.listentovtwfip.org) =====
    if (url.hostname === 'status.listentovtwfip.org') {
      const KUMA_UPSTREAM = 'https://contribution-pilot-filename-critics.trycloudflare.com';

      // Redirect root or /dashboard visits directly to the public /status/default page
      if (url.pathname === '/' || url.pathname === '' || url.pathname === '/dashboard') {
        return Response.redirect(`${url.origin}/status/default`, 302);
      }

      const targetUrl = new URL(url.pathname + url.search, KUMA_UPSTREAM);

      const proxyReqHeaders = new Headers(request.headers);
      proxyReqHeaders.set('Host', new URL(KUMA_UPSTREAM).host);
      proxyReqHeaders.set('X-Forwarded-Host', url.host);
      proxyReqHeaders.set('X-Forwarded-Proto', url.protocol.replace(':', ''));
      proxyReqHeaders.set('X-Real-IP', clientIp);

      try {
        const kumaRes = await fetch(targetUrl.toString(), {
          method: request.method,
          headers: proxyReqHeaders,
          body: (request.method !== 'GET' && request.method !== 'HEAD') ? request.body : undefined,
          redirect: 'manual'
        });

        const respHeaders = new Headers(kumaRes.headers);
        // Rewrite location headers if Uptime Kuma sends redirects to dashboard
        const loc = respHeaders.get('location');
        if (loc) {
          try {
            const locUrl = new URL(loc, KUMA_UPSTREAM);
            if (locUrl.pathname === '/dashboard' || locUrl.pathname === '/') {
              respHeaders.set('location', '/status/default');
            } else if (locUrl.host === new URL(KUMA_UPSTREAM).host) {
              respHeaders.set('location', locUrl.pathname + locUrl.search);
            }
          } catch(e) {}
        }
        respHeaders.set('Access-Control-Allow-Origin', '*');

        return new Response(kumaRes.body, {
          status: kumaRes.status,
          statusText: kumaRes.statusText,
          headers: respHeaders
        });
      } catch (err) {
        return new Response(`Uptime Kuma Tunnel Offline: ${err.message}`, { status: 502 });
      }
    }

    // ===== DYNAMIC MAINTENANCE / STATION BROADCAST MODE =====
    // status.listentovtwfip.org remains completely UP and active 24/7 above
    if (url.hostname !== 'status.listentovtwfip.org') {
      const allowedAdminPaths = ['/login.html', '/admin.html', '/login', '/admin', '/favicon.ico'];
      if (!url.pathname.startsWith('/api/') && !allowedAdminPaths.includes(url.pathname)) {
        // Query the Durable Object station status state
        try {
          const statusRes = await stub.fetch(new Request('https://do/status'));
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            if (statusData && statusData.status === 'OFFLINE') {
              // Check if user has active admin session to bypass maintenance screen
              const auth = checkAuth(request, clientIp);
              if (!auth.ok) {
                return new Response(MAINTENANCE_HTML, {
                  status: 503,
                  headers: {
                    'Content-Type': 'text/html; charset=utf-8',
                    'Retry-After': '120',
                    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
                  }
                });
              }
            }
          }
        } catch(e) {}
      }
    }

    // ===== API ROUTES =====
    if (url.pathname === '/api/login' && request.method === 'POST') {
      const body = await request.json();
      const email = (body.email || '').toLowerCase().trim();
      const passcode = (body.passcode || '').trim();
      const validUsernames = ['vtwfipradio', 'solomonder1234@gmail.com', 'admin@vtwfip.org'];
      if (validUsernames.includes(email) && passcode.toLowerCase() === 'lakota1234') {
        const token = btoa(`${email}:${Date.now()}:ern-admin:${clientIp}`);
        // Register this IP in the Durable Object as the authorized admin IP
        await stub.fetch(new Request('https://do/register-ip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientIp })
        }));
        return json({ success: true, token, clientIp });
      }
      return json({ success: false, error: 'Invalid credentials' }, 401);
    }

    if (url.pathname === '/api/verify-session' && request.method === 'POST') {
      const auth = checkAuth(request, clientIp);
      if (!auth.ok) return json({ ok: false, error: 'Unauthorized' }, 401);
      await stub.fetch(new Request('https://do/register-ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientIp })
      }));
      return json({ ok: true, adminIp: clientIp });
    }

    if (url.pathname === '/api/announcements' && request.method === 'GET') {
      return stub.fetch(new Request('https://do/get'));
    }

    if (url.pathname === '/api/announcements' && request.method === 'POST') {
      const auth = checkAuth(request, clientIp);
      if (!auth.ok) return json({ success: false, error: 'Unauthorized IP or Token' }, 401);

      // Verify with Durable Object IP registry
      const ipCheck = await stub.fetch(new Request('https://do/verify-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientIp })
      }));
      if (!ipCheck.ok) return json({ success: false, error: 'Unauthorized IP Address' }, 403);
      const ipCheckData = await ipCheck.json();
      if (!ipCheckData.ok) return json({ success: false, error: 'Unauthorized IP Address' }, 403);

      const body = await request.json();

      // Post to Discord Webhook from Server Worker (bypasses browser CORS & privacy shields)
      let discordResult = null;
      let discordMessageId = null;
      try {
        const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1539383686993023028/Q7x4V3a6C_trfuRKOAo024dvldB75WtFbFrWbzd8fYyaVI1da-aYHt4h5ZJI8vR3wSMN";
        const PING_ID = "1539556475683340318";
        
        const priorityColors = {
          'NOTICE': 2067276,      // Cyan #1fb6ff
          'TEST': 2278750,        // Green #22c55e
          'MAINTENANCE': 10181046,// Purple #9b59b6
          'ADVISORY': 16766720,   // Yellow #ffd700
          'WARNING': 16761035,    // Amber #f59e0b
          'SEVERE': 15105570,     // Orange #e67e22
          'EMERGENCY': 15158332,  // Red #e74c3c
          'CRITICAL': 10038562,   // Crimson #992d22
          'INFO': 3447003         // Blue #3498db
        };
        const colorHex = priorityColors[(body.priority || '').toUpperCase()] || 3447003;

        const discordPayload = {
          content: `<@&${PING_ID}>`,
          allowed_mentions: {
            roles: [PING_ID]
          },
          username: "ERN / VTWF Station Alert System",
          avatar_url: "https://listentovtwfip.org/favicon.ico",
          embeds: [{
            title: '📢 ' + (body.title || 'Station Announcement'),
            description: body.message || '',
            color: colorHex,
            fields: [
              { name: "Priority Level", value: body.priority || 'INFO', inline: true },
              { name: "Operator", value: body.author || 'ERN Control Ops', inline: true }
            ],
            footer: { text: "EAS Relay Network • Broadcast Transmission" },
            timestamp: new Date().toISOString()
          }]
        };

        const dRes = await fetch(`${DISCORD_WEBHOOK}?wait=true`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ERN-Alert-Bot"
          },
          body: JSON.stringify(discordPayload)
        });
        if (dRes.ok) {
          try {
            const dJson = await dRes.json();
            if (dJson && dJson.id) discordMessageId = dJson.id;
          } catch(e) {}
        }
        discordResult = { status: dRes.status, ok: dRes.ok, messageId: discordMessageId };
      } catch (err) {
        console.error("Worker Discord Webhook error:", err);
        discordResult = { error: err.message };
      }

      const doRes = await stub.fetch(new Request('https://do/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, discordMessageId })
      }));
      const doData = await doRes.json();
      return json({ ...doData, discord: discordResult });
    }

    if (url.pathname === '/api/announcements' && (request.method === 'PUT' || request.method === 'PATCH')) {
      const auth = checkAuth(request, clientIp);
      if (!auth.ok) return json({ success: false, error: 'Unauthorized IP or Token' }, 401);

      // Verify with Durable Object IP registry
      const ipCheck = await stub.fetch(new Request('https://do/verify-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientIp })
      }));
      if (!ipCheck.ok) return json({ success: false, error: 'Unauthorized IP Address' }, 403);
      const ipCheckData = await ipCheck.json();
      if (!ipCheckData.ok) return json({ success: false, error: 'Unauthorized IP Address' }, 403);

      const body = await request.json();
      if (!body.id) return json({ success: false, error: 'Missing announcement ID' }, 400);

      // Update Durable Object first
      const doRes = await stub.fetch(new Request('https://do/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }));
      const doData = await doRes.json();
      if (!doRes.ok || !doData.success) {
        return json(doData, doRes.status || 400);
      }

      const ann = doData.announcement;
      let discordResult = null;
      let targetMessageId = ann ? ann.discordMessageId : null;

      const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1539383686993023028/Q7x4V3a6C_trfuRKOAo024dvldB75WtFbFrWbzd8fYyaVI1da-aYHt4h5ZJI8vR3wSMN";
      const priorityColors = {
        'NOTICE': 2067276,      // Cyan #1fb6ff
        'TEST': 2278750,        // Green #22c55e
        'MAINTENANCE': 10181046,// Purple #9b59b6
        'ADVISORY': 16766720,   // Yellow #ffd700
        'WARNING': 16761035,    // Amber #f59e0b
        'SEVERE': 15105570,     // Orange #e67e22
        'EMERGENCY': 15158332,  // Red #e74c3c
        'CRITICAL': 10038562,   // Crimson #992d22
        'INFO': 3447003         // Blue #3498db
      };
      const colorHex = priorityColors[(ann.priority || '').toUpperCase()] || 3447003;

      let patchOk = false;

      // 1. Try PATCH if discordMessageId exists
      if (targetMessageId) {
        try {
          const discordPatchPayload = {
            embeds: [{
              title: '📢 ' + (ann.title || 'Station Announcement'),
              description: ann.message || '',
              color: colorHex,
              fields: [
                { name: "Priority Level", value: ann.priority || 'INFO', inline: true },
                { name: "Operator", value: ann.author || 'ERN Control Ops', inline: true }
              ],
              footer: { text: "EAS Relay Network • Broadcast Transmission (Edited)" },
              timestamp: new Date(ann.editedAt || Date.now()).toISOString()
            }]
          };

          const dRes = await fetch(`${DISCORD_WEBHOOK}/messages/${targetMessageId}`, {
            method: "PATCH",
            headers: { 
              "Content-Type": "application/json",
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ERN-Alert-Bot"
            },
            body: JSON.stringify(discordPatchPayload)
          });
          if (dRes.ok) {
            patchOk = true;
            discordResult = { status: dRes.status, ok: true, method: 'PATCH' };
          }
        } catch (err) {
          console.error("Worker Discord Webhook edit error:", err);
        }
      }

      // 2. Fallback: If PATCH wasn't successful or discordMessageId was missing, post message & capture message ID
      if (!patchOk) {
        try {
          const PING_ID = "1539556475683340318";
          const discordPayload = {
            content: `<@&${PING_ID}>`,
            allowed_mentions: { roles: [PING_ID] },
            username: "ERN / VTWF Station Alert System",
            avatar_url: "https://listentovtwfip.org/favicon.ico",
            embeds: [{
              title: '📢 ' + (ann.title || 'Station Announcement'),
              description: ann.message || '',
              color: colorHex,
              fields: [
                { name: "Priority Level", value: ann.priority || 'INFO', inline: true },
                { name: "Operator", value: ann.author || 'ERN Control Ops', inline: true }
              ],
              footer: { text: "EAS Relay Network • Broadcast Transmission (Edited)" },
              timestamp: new Date(ann.editedAt || Date.now()).toISOString()
            }]
          };

          const dRes = await fetch(`${DISCORD_WEBHOOK}?wait=true`, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ERN-Alert-Bot"
            },
            body: JSON.stringify(discordPayload)
          });
          if (dRes.ok) {
            const dJson = await dRes.json();
            if (dJson && dJson.id) {
              targetMessageId = dJson.id;
              // Save message ID to DO so future edits use PATCH
              await stub.fetch(new Request('https://do/edit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: ann.id, discordMessageId: targetMessageId })
              }));
            }
          }
          discordResult = { status: dRes.status, ok: dRes.ok, method: 'POST_FALLBACK', messageId: targetMessageId };
        } catch(err) {
          discordResult = { error: err.message };
        }
      }

      return json({ ...doData, discord: discordResult });
    }

    if (url.pathname === '/api/announcements' && request.method === 'DELETE') {
      const auth = checkAuth(request, clientIp);
      if (!auth.ok) return json({ success: false, error: 'Unauthorized' }, 401);

      // Verify with Durable Object IP registry
      const ipCheck = await stub.fetch(new Request('https://do/verify-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientIp })
      }));
      if (!ipCheck.ok) return json({ success: false, error: 'Unauthorized IP Address' }, 403);
      const ipCheckData = await ipCheck.json();
      if (!ipCheckData.ok) return json({ success: false, error: 'Unauthorized IP Address' }, 403);

      const entryId = url.searchParams.get('id') || 'all';
      const doRes = await stub.fetch(new Request(`https://do/delete?id=${entryId}`, { method: 'DELETE' }));
      const doData = await doRes.json();

      let discordResult = null;
      if (doData.discordMessageId) {
        try {
          const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1539383686993023028/Q7x4V3a6C_trfuRKOAo024dvldB75WtFbFrWbzd8fYyaVI1da-aYHt4h5ZJI8vR3wSMN";
          const dRes = await fetch(`${DISCORD_WEBHOOK}/messages/${doData.discordMessageId}`, {
            method: "DELETE",
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ERN-Alert-Bot"
            }
          });
          discordResult = { status: dRes.status, ok: dRes.ok };
        } catch(err) {
          discordResult = { error: err.message };
        }
      }
      return json({ ...doData, discord: discordResult });
    }

    if (url.pathname === '/api/status' && request.method === 'GET') {
      return stub.fetch(new Request('https://do/status'));
    }

    if (url.pathname === '/api/iembot' && request.method === 'GET') {
      try {
        const room = url.searchParams.get('room') || 'okxchat';
        if (!/^[a-z0-9]+chat$/.test(room)) return new Response('Invalid room', {status: 400});
        const feedUrl = `https://weather.im/iembot-rss/room/${room}.xml?t=` + Date.now();
        const res = await fetch(feedUrl, {
          headers: {
            'User-Agent': 'ERN-VTWF-Bot/1.0 (https://listentovtwfip.org)'
          },
          cache: 'no-store'
        });
        const text = await res.text();
        return new Response(text, {
          headers: {
            'Content-Type': 'application/xml',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (err) {
        return json({ error: err.message }, 500);
      }
    }

    if (url.pathname === '/api/status' && request.method === 'POST') {
      const auth = checkAuth(request, clientIp);
      if (!auth.ok) return json({ success: false, error: 'Unauthorized' }, 401);

      // Verify with Durable Object IP registry
      const ipCheck = await stub.fetch(new Request('https://do/verify-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientIp })
      }));
      if (!ipCheck.ok) return json({ success: false, error: 'Unauthorized IP Address' }, 403);
      const ipCheckData = await ipCheck.json();
      if (!ipCheckData.ok) return json({ success: false, error: 'Unauthorized IP Address' }, 403);

      const body = await request.json();
      return stub.fetch(new Request('https://do/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));
    }

    // ===== CROSS-DEVICE DECODED EAS ALERTS SYNC (/api/alerts and /api/decoded-alerts) =====
    if (url.pathname === '/api/decoded-alerts' || url.pathname === '/api/alerts') {
      if (request.method === 'GET') {
        return stub.fetch(new Request('https://do/eas-alerts'));
      }
      if (request.method === 'DELETE') {
        return stub.fetch(new Request('https://do/eas-alerts', { method: 'DELETE' }));
      }
      if (request.method === 'POST') {
        const body = await request.json();
        return stub.fetch(new Request('https://do/eas-alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        }));
      }
    }

    // ===== AUDIO STREAM PROXIES (Supports CORS & HTTPS proxying) =====
    if (url.pathname === '/api/stream/live' || url.pathname === '/api/stream/wjonip') {
      try {
        const streamHeaders = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ERN-Audio-Proxy',
          'Icy-MetaData': '0',
          'Accept': '*/*'
        };

        let streamRes;
        if (url.pathname === '/api/stream/wjonip') {
          streamRes = await fetch('http://radio.wjonip.org/wjonip', { headers: streamHeaders });
          if (!streamRes.ok) {
            streamRes = await fetch('http://radio.wjonip.org/live', { headers: streamHeaders });
          }
        } else {
          streamRes = await fetch('https://icecast.gwes-eas.network/ERN-VTWF', { headers: streamHeaders });
          if (!streamRes.ok) {
            streamRes = await fetch('http://radio.wjonip.org/live', { headers: streamHeaders });
          }
        }
        if (!streamRes.ok) throw new Error("Stream mount not active");
        return new Response(streamRes.body, {
          status: streamRes.status,
          headers: {
            'Content-Type': streamRes.headers.get('Content-Type') || 'audio/mpeg',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            'Connection': 'keep-alive'
          }
        });
      } catch (err) {
        return new Response('Stream offline', { status: 503, headers: { 'Access-Control-Allow-Origin': '*' } });
      }
    }

    // ===== NDBC MARINE BUOY TELEMETRY PROXY =====
    if (url.pathname === '/api/buoys' && request.method === 'GET') {
      try {
        const buoyIds = ['44065', '44017', '44025'];
        const results = await Promise.all(buoyIds.map(async (id) => {
          try {
            const res = await fetch(`https://www.ndbc.noaa.gov/data/realtime2/${id}.txt`, {
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ERN-Buoy-Ingest' },
              cf: { cacheTtl: 60 }
            });
            if (!res.ok) return { stationId: id, waveHeight: 'N/A', wavePeriod: 'N/A', waterTemp: 'N/A', wind: 'N/A', timeStr: 'Offline' };
            const text = await res.text();
            const lines = text.trim().split('\n');
            if (lines.length < 3) return { stationId: id, waveHeight: 'N/A', wavePeriod: 'N/A', waterTemp: 'N/A', wind: 'N/A', timeStr: 'Offline' };

            const headers = lines[0].replace('#', '').trim().split(/\s+/);
            const latest = lines[2].trim().split(/\s+/);

            const getVal = (col) => {
              const idx = headers.indexOf(col);
              return (idx !== -1 && latest[idx] && latest[idx] !== 'MM') ? latest[idx] : null;
            };

            const wvhtM = getVal('WVHT');
            const wvhtFt = wvhtM ? `${(parseFloat(wvhtM) * 3.28084).toFixed(1)} ft` : 'N/A';
            const dpd = getVal('DPD') ? `${getVal('DPD')} sec` : 'N/A';
            const wtmpC = getVal('WTMP');
            const wtmpF = wtmpC ? `${(parseFloat(wtmpC) * 9/5 + 32).toFixed(1)}°F` : 'N/A';
            const wspd = getVal('WSPD');
            const gst = getVal('GST');

            let wind = 'N/A';
            if (wspd) {
              const kt = (parseFloat(wspd) * 1.94384).toFixed(0);
              const gstKt = gst ? ` (G${(parseFloat(gst) * 1.94384).toFixed(0)})` : '';
              wind = `${kt} kt${gstKt}`;
            }

            const hh = getVal('hh');
            const mm = getVal('mm');
            const timeStr = (hh && mm) ? `${hh}:${mm} UTC` : 'Recent';

            return {
              stationId: id,
              waveHeight: wvhtFt,
              wavePeriod: dpd,
              waterTemp: wtmpF,
              wind: wind,
              timeStr: timeStr
            };
          } catch(e) {
            return { stationId: id, waveHeight: 'N/A', wavePeriod: 'N/A', waterTemp: 'N/A', wind: 'N/A', timeStr: 'Offline' };
          }
        }));

        return json(results, 200, { 'Access-Control-Allow-Origin': '*' });
      } catch(err) {
        return json({ error: err.message }, 500, { 'Access-Control-Allow-Origin': '*' });
      }
    }

    // ===== NOW PLAYING / BUTT METADATA PROXY (Detects /live vs /wjonip) =====
    if (url.pathname === '/api/nowplaying' && request.method === 'GET') {
      try {
        let sources = [];
        let rawAlert = null;

        // 1. Fetch gwes-eas network status-json.xsl directly
        try {
          const gwesRes = await fetch('https://icecast.gwes-eas.network/status-json.xsl', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ERN-Audio-Proxy' },
            cf: { cacheTtl: 0 }
          });
          if (gwesRes.ok) {
            const gwesData = await gwesRes.json();
            if (gwesData.icestats && gwesData.icestats.source) {
              const gList = Array.isArray(gwesData.icestats.source) ? gwesData.icestats.source : [gwesData.icestats.source];
              sources.push(...gList);
            }
          }
        } catch(e) {}

        // 2. Fetch radio.wjonip.org status-json.xsl directly
        try {
          const wjonRes = await fetch('http://radio.wjonip.org/status-json.xsl', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) WJON-IP-Exclusive-Decoder' },
            cf: { cacheTtl: 0 }
          });
          if (wjonRes.ok) {
            const wjonData = await wjonRes.json();
            if (wjonData.icestats && wjonData.icestats.source) {
              const wList = Array.isArray(wjonData.icestats.source) ? wjonData.icestats.source : [wjonData.icestats.source];
              sources.push(...wList);
            }
          }
        } catch(e) {}

        // Check if primary mount (/live or ERN-VTWF) is active
        const primaryMount = sources.find(s => {
          const u = (s.listenurl || s.mount || s.server_name || '').toLowerCase();
          return u.includes('/ern-vtwf') || u.includes('ern-vtwf') || u.includes('/live');
        });

        // Backup mount (/wjonip)
        const backupMount = sources.find(s => {
          const u = (s.listenurl || s.mount || s.server_name || '').toLowerCase();
          return u.includes('/wjonip') || u.includes('wjonip');
        });

        const isPrimaryActive = !!primaryMount;
        const activeMount = primaryMount || backupMount || (sources.length > 0 ? sources[0] : null);

        if (!activeMount) {
          return json({
            live: false,
            isPrimaryActive: false,
            station: 'WJON-IP Relay',
            mount: 'https://radio.wjonip.org/wjonip',
            listeners: 0,
            rawTitle: '',
            artist: 'WJON-IP Emergency Relay',
            track: 'Connecting to WJON-IP...',
            album: '',
            artwork: null,
            alert: null
          });
        }

        const mount = activeMount;
        const stationName = isPrimaryActive ? 'ERN-VTWF Live Broadcast' : 'WJON-IP Relay';

        let rawTitle = mount.title || mount.yp_currently_playing || '';
        try { rawTitle = decodeURIComponent(rawTitle); } catch(e) {}

        // Check if ANY active mount (especially WeatherScan, ERN-JON, or ERN-VTWF) is currently carrying an EAS alert
        const easEventsMap = {
          'EAN': 'Emergency Action Notification',
          'EAT': 'Emergency Action Termination',
          'NIC': 'National Information Center',
          'NPT': 'National Periodic Test',
          'RMT': 'Required Monthly Test',
          'RWT': 'Required Weekly Test',
          'DMO': 'Practice/Demo Warning',
          'CEM': 'Civil Emergency Message',
          'CIV': 'Civil Emergency Message',
          'EVI': 'Evacuation Immediate',
          'EVA': 'Evacuation Immediate',
          'CAE': 'Child Abduction Emergency',
          'BLU': 'Blue Alert',
          'ADR': 'Administrative Message',
          'CDW': 'Civil Danger Warning',
          'LAE': 'Local Area Emergency',
          'TOE': '911 Telephone Outage Emergency',
          'SPW': 'Shelter in Place Warning',
          'AVW': 'Avalanche Warning',
          'AVA': 'Avalanche Watch',
          'FRW': 'Fire Warning',
          'HMW': 'Hazardous Materials Warning',
          'NUW': 'Nuclear Power Plant Warning',
          'RHW': 'Radiological Hazard Warning',
          'VOW': 'Volcano Warning',
          'TOR': 'Tornado Warning',
          'TOA': 'Tornado Watch',
          'TOW': 'Tornado Watch',
          'SVR': 'Severe Thunderstorm Warning',
          'SVA': 'Severe Thunderstorm Watch',
          'SVS': 'Severe Weather Statement',
          'SPS': 'Special Weather Statement',
          'EWW': 'Extreme Wind Warning',
          'HWW': 'High Wind Warning',
          'HWA': 'High Wind Watch',
          'WND': 'Wind Advisory',
          'FFW': 'Flash Flood Warning',
          'FFA': 'Flash Flood Watch',
          'FFS': 'Flash Flood Statement',
          'FLW': 'Flood Warning',
          'FLA': 'Flood Watch',
          'FLS': 'Flood Statement',
          'BZW': 'Blizzard Warning',
          'WSW': 'Winter Storm Warning',
          'WSA': 'Winter Storm Watch',
          'WWY': 'Winter Weather Advisory',
          'ISW': 'Ice Storm Warning',
          'LEW': 'Lake Effect Snow Warning',
          'FZW': 'Freeze Warning',
          'FZA': 'Freeze Watch',
          'FRZ': 'Frost Advisory',
          'WCW': 'Wind Chill Warning',
          'WCA': 'Wind Chill Watch',
          'HUW': 'Hurricane Warning',
          'HUA': 'Hurricane Watch',
          'HLS': 'Hurricane Local Statement',
          'TRW': 'Tropical Storm Warning',
          'TRA': 'Tropical Storm Watch',
          'TYW': 'Typhoon Warning',
          'TYA': 'Typhoon Watch',
          'SMW': 'Special Marine Warning',
          'MWW': 'Marine Weather Warning',
          'MWA': 'Marine Weather Watch',
          'MAW': 'Marine Warning',
          'TSW': 'Tsunami Warning',
          'TSA': 'Tsunami Watch',
          'FWW': 'Red Flag Fire Weather Warning',
          'FWA': 'Fire Weather Watch',
          'EHW': 'Excessive Heat Warning',
          'EHA': 'Excessive Heat Watch',
          'HTA': 'Heat Advisory',
          'DSW': 'Dust Storm Warning',
          'SQW': 'Snow Squall Warning',
          'WXR': 'Weather Alert Message'
        };

        // Scan all sources for authentic EAS headers (must start with ZCZC-)
        for (const s of sources) {
          const t = (s.title || s.yp_currently_playing || s.server_name || '').trim();
          if (!t) continue;
          const u = (s.listenurl || '').toUpperCase();
          const srcStation = (u.includes('JON') || u.includes('WSCN') || u.includes('PERMA')) ? 'WJON-IP' : 'ERN-VTWF';

          if (t.includes('ZCZC-')) {
            rawAlert = {
              rawZczc: t,
              station: srcStation,
              timeMs: Date.now()
            };
            break;
          }
        }

        if (!rawTitle || rawTitle.trim() === '') {
          return json({
            live: true,
            isPrimaryActive,
            station: stationName,
            listeners: mount.listeners || 0,
            song: null,
            rawTitle: '',
            artist: isPrimaryActive ? 'ERN-VTWF Broadcast' : 'WJON-IP Relay',
            track: isPrimaryActive ? 'ERN-VTWF — Live Relay' : 'WJON-IP — Emergency Relay',
            album: '',
            artwork: null,
            alert: rawAlert
          });
        }

        let artist = '';
        let track = rawTitle.trim();
        let isEasTitle = false;

        // If rawTitle itself is an EAS message
        if (rawTitle.toUpperCase().includes('RELAYING') || rawTitle.toUpperCase().includes('WARNING') || rawTitle.toUpperCase().includes('WATCH') || rawTitle.toUpperCase().includes('EAS') || rawTitle.includes('ZCZC-')) {
          isEasTitle = true;
        }

        if (rawTitle.includes(' - ') && !isEasTitle) {
          const parts = rawTitle.split(' - ');
          artist = parts[0].trim();
          track = parts.slice(1).join(' - ').trim();
        } else if (!isEasTitle) {
          artist = stationName;
        }

        // Fetch Artwork from iTunes Search API (with intelligent fallback)
        let artwork = null;
        let album = null;
        if (!isEasTitle && track && !track.includes('Persistent Monitors') && !track.includes('Barker Channel')) {
          try {
            const queries = [
              `${artist} ${track}`.replace(/WJON.*|ERN.*/gi, '').trim(),
              `${track}`.trim(),
              `${artist}`.trim()
            ].filter(q => q.length > 2);

            for (const q of queries) {
              if (artwork) break;
              try {
                const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&country=US&limit=1`, {
                  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
                });
                if (itunesRes.ok) {
                  const itunesData = await itunesRes.json();
                  if (itunesData.resultCount > 0) {
                    const res = itunesData.results[0];
                    if (res.artworkUrl100) {
                      artwork = res.artworkUrl100.replace('100x100bb.jpg', '600x600bb.jpg');
                    }
                    if (!album && res.collectionName) album = res.collectionName;
                    if (res.artistName && (!artist || artist === stationName)) artist = res.artistName;
                    if (res.trackName && track === rawTitle) track = res.trackName;
                  }
                }
              } catch(e) {}
            }
          } catch(err) {}
        }

        return json({
          live: true,
          isPrimaryActive,
          station: stationName,
          mount: mount.listenurl || '',
          listeners: mount.listeners || 0,
          rawTitle,
          artist: isEasTitle ? 'EMERGENCY ALERT SYSTEM' : (artist || 'EAS Relay Network'),
          track: isEasTitle ? rawTitle : track,
          album,
          artwork,
          alert: rawAlert
        });
      } catch (err) {
        return json({ live: false, error: err.message });
      }
    }

    // --- LIVE NATIONWIDE EAS & NWS ACTIVE ALERTS FEED (DECODES EVEN WHEN STREAM IS PAUSED) ---
    if (url.pathname === '/api/live-alerts') {
      try {
        const nwsRes = await fetch('https://api.weather.gov/alerts/active', {
          headers: {
            'User-Agent': '(listentovtwfip.org, contact@listentovtwfip.org)',
            'Accept': 'application/geo+json'
          },
          cf: { cacheTtl: 30 }
        });
        if (nwsRes.ok) {
          const data = await nwsRes.json();
          const alerts = [];
          if (data.features) {
            // Filter high priority EAS events: TOR, SVR, FFW, SMW, EAN, CEM, CAE, etc.
            for (const f of data.features.slice(0, 25)) {
              const p = f.properties;
              const sameCodes = (p.geocode && p.geocode.SAME) ? p.geocode.SAME : [];
              const eventCode = p.event ? (p.event.includes('Tornado') ? 'TOR' : (p.event.includes('Thunderstorm') ? 'SVR' : (p.event.includes('Flash Flood') ? 'FFW' : (p.event.includes('Marine') ? 'SMW' : (p.event.includes('Test') ? 'RWT' : 'WXR'))))) : 'WXR';
              
              alerts.push({
                id: p.id,
                event: p.event,
                code: eventCode,
                headline: p.headline || p.event,
                areaDesc: p.areaDesc,
                fipsList: sameCodes,
                geometry: (f.geometry && f.geometry.coordinates) ? f.geometry : null,
                expires: p.expires ? new Date(p.expires).getTime() : (Date.now() + 45 * 60000),
                senderName: p.senderName || 'National Weather Service'
              });
            }
          }
          return json(alerts, 200, { 'Cache-Control': 'public, max-age=30' });
        }
      } catch(e) {}
      return json([], 200);
    }

    // --- LIVE NWS 7-DAY FORECAST ENDPOINT (OFFICIAL NOAA OKX) ---
    if (url.pathname === '/api/nws-forecast') {
      try {
        const nwsRes = await fetch('https://api.weather.gov/gridpoints/OKX/33,42/forecast', {
          headers: {
            'User-Agent': '(listentovtwfip.org, contact@listentovtwfip.org)',
            'Accept': 'application/geo+json'
          },
          cf: { cacheTtl: 300, cacheEverything: true }
        });
        if (nwsRes.ok) {
          const data = await nwsRes.json();
          return json(data, 200, {
            'Cache-Control': 'public, max-age=300, s-maxage=300'
          });
        }
      } catch(e) {}
      return json({ error: 'NWS forecast fetch failed' }, 502);
    }

    // --- IEMBOT RSS FEED PROXY (OKX & PHI CHANNELS via weather.im) ---
    if (url.pathname === '/api/iembot-rss') {
      const room = url.searchParams.get('room') || (url.searchParams.get('channel') === 'bot-phi' || url.searchParams.get('room') === 'phichat' ? 'phichat' : 'okxchat');
      const targetUrl = `https://weather.im/iembot-rss/room/${encodeURIComponent(room)}.xml`;
      try {
        const iemRes = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ERN-VTWF-Bot'
          },
          cf: { cacheTtl: 15 }
        });
        if (iemRes.ok) {
          const xml = await iemRes.text();
          return new Response(xml, {
            status: 200,
            headers: {
              'Content-Type': 'application/rss+xml; charset=utf-8',
              'Cache-Control': 'public, max-age=15',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }
      } catch(e) {}
      return new Response('<rss><channel></channel></rss>', { status: 200, headers: { 'Content-Type': 'application/xml', 'Access-Control-Allow-Origin': '*' } });
    }

    // --- IEM VTEC GEOJSON PROXY (wfo & year) ---
    if (url.pathname === '/api/iem-vtec') {
      const wfo = url.searchParams.get('wfo') || 'OKX';
      const year = url.searchParams.get('year') || new Date().getUTCFullYear();
      try {
        const iemRes = await fetch(`https://mesonet.agron.iastate.edu/geojson/vtec.geojson?wfo=${encodeURIComponent(wfo)}&year=${encodeURIComponent(year)}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ERN-VTWF-Bot'
          },
          cf: { cacheTtl: 30 }
        });
        if (iemRes.ok) {
          const data = await iemRes.json();
          return json(data, 200, { 'Cache-Control': 'public, max-age=30' });
        }
      } catch(e) {}
      return json({ type: 'FeatureCollection', features: [] }, 200);
    }

    // ===== STATIC ASSETS & PUBLIC DASHBOARD =====
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }
    return new Response('Not Found', { status: 404 });
  }
};

function json(data, status = 200, customHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Access-Control-Allow-Origin': '*',
      ...customHeaders
    }
  });
}
function checkAuth(request, clientIp) {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return { ok: false };
  try {
    const decoded = atob(auth.replace('Bearer ', ''));
    if (!decoded.includes(':ern-admin')) return { ok: false };
    const parts = decoded.split(':');
    const validUsernames = ['vtwfipradio', 'solomonder1234@gmail.com', 'admin@vtwfip.org'];
    if (!parts[0] || !validUsernames.includes(parts[0].toLowerCase())) return { ok: false };
    return { ok: true, email: parts[0] };
  } catch {
    return { ok: false };
  }
}