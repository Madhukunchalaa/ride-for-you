const http = require('node:http');
const https = require('node:https');

const DEFAULT_UPSTREAM = 'https://ride-for-you-app-production.up.railway.app';
const HOP_HEADERS = new Set(['connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailer', 'transfer-encoding', 'upgrade']);

// Mount before express.json(): uploads must reach the sales service unchanged.
function createSalesProxy(configured = process.env.SALES_SERVICE_URL || DEFAULT_UPSTREAM) {
  const target = new URL(configured);
  if (!['http:', 'https:'].includes(target.protocol) || target.username || target.password || target.pathname !== '/' || target.search || target.hash)
    throw new Error('SALES_SERVICE_URL must be an HTTP(S) origin.');

  return function salesProxy(req, res) {
    const headers = { ...req.headers, host: target.host };
    const connectionHeaders = String(req.headers.connection || '').split(',').map(x => x.trim().toLowerCase());
    for (const name of [...HOP_HEADERS, ...connectionHeaders, 'authorization']) delete headers[name];
    // Rental credentials are not forwarded to the independent sales workspace.
    const salesCookie = (req.headers.cookie || '').split(';').map(x => x.trim()).filter(x => x.startsWith('rfy_sales='));
    if (salesCookie.length) headers.cookie = salesCookie.join('; ');
    else delete headers.cookie;
    headers['x-forwarded-host'] = req.get('host') || '';
    headers['x-forwarded-proto'] = req.get('x-forwarded-proto') === 'https' ? 'https' : req.protocol;
    headers['x-forwarded-for'] = req.ip || req.socket.remoteAddress || '';

    const transport = target.protocol === 'https:' ? https : http;
    const upstream = transport.request({
      hostname: target.hostname,
      port: target.port || (target.protocol === 'https:' ? 443 : 80),
      path: req.originalUrl,
      method: req.method,
      headers,
      timeout: 30000,
    }, response => {
      res.status(response.statusCode || 502);
      const blocked = new Set([...HOP_HEADERS, ...String(response.headers.connection || '').split(',').map(x => x.trim().toLowerCase())]);
      for (const [name, value] of Object.entries(response.headers))
        if (value !== undefined && !blocked.has(name)) res.setHeader(name, value);
      response.on('error', () => res.destroy());
      response.pipe(res);
    });
    upstream.on('timeout', () => upstream.destroy(new Error('Sales service timeout')));
    upstream.on('error', () => {
      if (!res.headersSent) res.status(502).json({ error: 'Sales workspace is temporarily unavailable. Please try again.' });
      else res.destroy();
    });
    req.on('aborted', () => upstream.destroy());
    res.on('close', () => { if (!res.writableEnded) upstream.destroy(); });
    req.pipe(upstream);
  };
}

module.exports = { createSalesProxy };
