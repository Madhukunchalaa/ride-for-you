const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');
const { createSalesProxy } = require('../src/middleware/sales-proxy');

test('custom-domain sales route preserves uploads, origin, cookies and PDF downloads without rental credentials', async () => {
  const seen = [];
  const upstream = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      seen.push({ url: req.url, headers: req.headers, body: Buffer.concat(chunks).toString() });
      if (req.url === '/sales') { res.writeHead(308, { Location: '/sales/' }); return res.end(); }
      if (req.url.endsWith('/pdf')) { res.setHeader('Content-Type', 'application/pdf'); return res.end(Buffer.from('%PDF-test')); }
      res.setHeader('Set-Cookie', 'rfy_sales=test; Path=/sales/; Secure; HttpOnly; SameSite=Strict');
      res.end('ok');
    });
  });
  await new Promise(resolve => upstream.listen(0, '127.0.0.1', resolve));
  const app = express();
  app.use('/sales', createSalesProxy(`http://127.0.0.1:${upstream.address().port}`));
  app.use(express.json());
  app.get('/api/rental-check', (_req, res) => res.json({ rental: true }));
  app.get('*', (_req, res) => res.send('rental website'));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const redirect = await fetch(base + '/sales', { redirect: 'manual' });
    assert.equal(redirect.status, 308);
    assert.equal(redirect.headers.get('location'), '/sales/');
    const body = JSON.stringify({ csv: 'a'.repeat(300000) });
    const response = await fetch(base + '/sales/api/import?preview=1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://rideforyouev.com', Cookie: 'rental_session=private; rfy_sales=test', Authorization: 'Bearer rental-only' },
      body,
    });
    assert.equal(response.status, 200);
    assert(response.headers.get('set-cookie').includes('Path=/sales/'));
    assert.equal(seen.at(-1).body, body);
    assert.equal(seen.at(-1).url, '/sales/api/import?preview=1');
    assert.equal(seen.at(-1).headers.origin, 'https://rideforyouev.com');
    assert.equal(seen.at(-1).headers.cookie, 'rfy_sales=test');
    assert.equal(seen.at(-1).headers.authorization, undefined);
    const pdf = await fetch(base + '/sales/api/invoices/test/pdf');
    assert.equal(pdf.headers.get('content-type'), 'application/pdf');
    assert.equal(await pdf.text(), '%PDF-test');
    assert.deepEqual(await (await fetch(base + '/api/rental-check')).json(), { rental: true });
    assert.equal(await (await fetch(base + '/ride')).text(), 'rental website');
    assert.equal(await (await fetch(base + '/sales-other')).text(), 'rental website');
  } finally {
    await new Promise(resolve => server.close(resolve));
    await new Promise(resolve => upstream.close(resolve));
  }
});
