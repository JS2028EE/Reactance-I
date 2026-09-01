const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Reactance-Key',
  'Access-Control-Max-Age': '86400'
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...CORS_HEADERS }
  });
}

function now() {
  return new Date().toISOString();
}

function requestId() {
  return crypto.randomUUID();
}

function authenticate(request, env) {
  const expected = env.REACTANCE_DEVICE_KEY;
  if (!expected) return { ok: false, status: 503, error: 'device authentication secret is not configured' };

  const auth = request.headers.get('Authorization') || '';
  const headerKey = request.headers.get('X-Reactance-Key') || '';
  const supplied = auth.startsWith('Bearer ') ? auth.slice(7).trim() : headerKey.trim();

  if (!supplied || supplied !== expected) {
    return { ok: false, status: 401, error: 'unauthorized' };
  }

  return { ok: true };
}

function validateEvent(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'JSON object required';
  }

  if (!body.event || typeof body.event !== 'string') {
    return 'event required';
  }

  const allowedEvents = [
    'BEAM_INTERRUPTED',
    'BEAM_RESTORED',
    'SYSTEM_ARMED',
    'SYSTEM_DISARMED',
    'LASER_ON',
    'LASER_OFF',
    'ALARM_STARTED',
    'ALARM_STOPPED',
    'DEVICE_ONLINE',
    'DEVICE_OFFLINE',
    'TEST'
  ];

  if (!allowedEvents.includes(body.event)) {
    return `unsupported event: ${body.event}`;
  }

  if (body.mode !== undefined && !['LOUD', 'SILENT', 'OFF'].includes(String(body.mode).toUpperCase())) {
    return 'mode must be LOUD, SILENT, or OFF';
  }

  if (body.triggerCount !== undefined) {
    const count = Number(body.triggerCount);
    if (!Number.isInteger(count) || count < 0) return 'triggerCount must be a non-negative integer';
  }

  return null;
}

function eventTitle(event) {
  const titles = {
    BEAM_INTERRUPTED: '🚨 BEAM INTERRUPTION DETECTED',
    BEAM_RESTORED: '🟢 BEAM RESTORED',
    SYSTEM_ARMED: '🟢 SYSTEM ARMED',
    SYSTEM_DISARMED: '⚫ SYSTEM DISARMED',
    LASER_ON: '🔴 LASER ACTIVATED',
    LASER_OFF: '⚫ LASER DEACTIVATED',
    ALARM_STARTED: '🔊 ALARM ACTIVATED',
    ALARM_STOPPED: '🔇 ALARM STOPPED',
    DEVICE_ONLINE: '🟢 DEVICE ONLINE',
    DEVICE_OFFLINE: '🔴 DEVICE OFFLINE',
    TEST: '🧪 NOTIFICATION TEST'
  };
  return titles[event] || `⚡ ${event}`;
}

function buildTelegramMessage(body, id, timestamp) {
  const lines = [
    '⚡ REACTANCE I',
    '━━━━━━━━━━━━━━━━━━',
    eventTitle(body.event),
    '',
    `Event: ${body.event}`,
    `System: ${body.systemState || body.state || 'UNKNOWN'}`,
    `Mode: ${body.mode || 'UNKNOWN'}`,
    `Laser: ${body.laserStatus || 'UNKNOWN'}`,
    `Beam: ${body.beamStatus || 'UNKNOWN'}`,
    `Trigger Count: ${body.triggerCount ?? 'N/A'}`,
    `Time: ${body.time || timestamp}`,
    `Event ID: ${id}`
  ];

  if (body.message) lines.push('', `Message: ${String(body.message).slice(0, 500)}`);
  if (body.device) lines.push(`Device: ${String(body.device).slice(0, 100)}`);

  return lines.join('\n');
}

async function sendTelegram(env, text) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    return { ok: false, status: 503, error: 'Telegram secrets are not configured' };
  }

  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_CHAT_ID,
      text,
      disable_web_page_preview: true
    })
  });

  const result = await response.json().catch(() => ({ ok: false, description: 'Invalid Telegram response' }));
  return { ok: response.ok && result.ok === true, status: response.status, result };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const id = requestId();

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/health')) {
      return json({
        ok: true,
        system: 'Reactance I',
        service: 'notification-gateway',
        status: 'ONLINE',
        version: '1.1.0',
        timestamp: now(),
        endpoints: ['/health', '/status', '/notify', '/test']
      });
    }

    if (request.method === 'GET' && url.pathname === '/status') {
      return json({
        ok: true,
        system: 'Reactance I',
        worker: 'ONLINE',
        telegramConfigured: Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID),
        deviceKeyConfigured: Boolean(env.REACTANCE_DEVICE_KEY),
        timestamp: now()
      });
    }

    if (request.method === 'POST' && (url.pathname === '/notify' || url.pathname === '/test')) {
      const auth = authenticate(request, env);
      if (!auth.ok) return json({ ok: false, error: auth.error, requestId: id }, auth.status);

      let body = {};
      if (request.method === 'POST') {
        body = await request.json().catch(() => null);
        if (body === null) return json({ ok: false, error: 'valid JSON body required', requestId: id }, 400);
      }

      if (url.pathname === '/test') {
        body = {
          event: 'TEST',
          systemState: 'ARMED',
          mode: 'SILENT',
          laserStatus: 'ACTIVE',
          beamStatus: 'DETECTED',
          triggerCount: 0,
          message: 'Reactance I notification pipeline is operational.',
          ...body
        };
      }

      const validationError = validateEvent(body);
      if (validationError) return json({ ok: false, error: validationError, requestId: id }, 400);

      const timestamp = now();
      const text = buildTelegramMessage(body, id, timestamp);
      const telegram = await sendTelegram(env, text);

      if (!telegram.ok) {
        return json({
          ok: false,
          requestId: id,
          event: body.event,
          timestamp,
          error: 'Telegram notification failed',
          details: telegram.result || telegram.error
        }, telegram.status >= 500 ? 502 : telegram.status);
      }

      return json({
        ok: true,
        requestId: id,
        event: body.event,
        timestamp,
        notification: 'sent'
      });
    }

    return json({
      ok: false,
      error: 'not found',
      requestId: id,
      path: url.pathname,
      availableEndpoints: ['GET /', 'GET /health', 'GET /status', 'POST /notify', 'POST /test']
    }, 404);
  }
};
