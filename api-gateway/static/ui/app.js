(() => {
  // Settings state
  const state = {
    base: localStorage.getItem('qa.base') || location.origin,
    key: localStorage.getItem('qa.key') || 'service-secret',
    jwt: localStorage.getItem('qa.jwt') || '',
  };
  const $ = (id) => document.getElementById(id);
  const out = (id, data) => { const el = $(id); el.textContent = typeof data === 'string' ? data : JSON.stringify(data, null, 2); };
  const toast = (msg, ok=true) => {
    let t = document.createElement('div');
    t.className = `toast ${ok ? 'ok' : 'err'}`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
  };
  const fetchJSON = async (url, init={}) => {
    try {
      const res = await fetch(url, init);
      const ct = res.headers.get('content-type') || '';
      const isJSON = ct.includes('application/json');
      const data = isJSON ? await res.json() : await res.text();
      if (!res.ok) {
        const msg = isJSON ? (data.error || JSON.stringify(data)) : String(data);
        toast(msg || `${res.status}`, false);
        return { ok: false, status: res.status, data };
      }
      return { ok: true, status: res.status, data };
    } catch (e) {
      toast(String(e), false);
      return { ok: false, status: 0, data: { error: String(e) } };
    }
  };
  const requireVal = (id) => {
    const el = $(id); const v = (el.value||'').trim();
    if (!v) { el.classList.add('invalid'); setTimeout(()=>el.classList.remove('invalid'), 800); toast(`${id} is required`, false); }
    return v;
  };
  const requireJSON = (id, fallback) => {
    try { return JSON.parse($(id).value || fallback); } catch(e) { toast(`Invalid JSON in ${id}`, false); throw e; }
  };
  const headers = () => {
    const h = { 'content-type': 'application/json', 'x-api-key': state.key };
    if (state.jwt) h['Authorization'] = `Bearer ${state.jwt}`;
    return h;
  };
  const refreshUI = () => {
    $('base-url').textContent = state.base;
    if ($('cfg-base')) $('cfg-base').value = state.base;
    if ($('cfg-key')) $('cfg-key').value = state.key;
    if ($('cfg-jwt')) $('cfg-jwt').textContent = state.jwt ? `${state.jwt.slice(0,16)}…` : '(none)';
    // Prefill restored IDs if present
    const n = localStorage.getItem('qa.notifId'); if (n && $('notif-id')) $('notif-id').value = n;
    const w = localStorage.getItem('qa.wfId'); if (w && $('wf-id')) $('wf-id').value = w;
    const j = localStorage.getItem('qa.aiJobId'); if (j && $('ai-job-id')) $('ai-job-id').value = j;
  };
  refreshUI();

  // SETTINGS
  if ($('cfg-save')) $('cfg-save').onclick = () => {
    state.base = $('cfg-base').value || state.base;
    state.key = $('cfg-key').value || state.key;
    localStorage.setItem('qa.base', state.base);
    localStorage.setItem('qa.key', state.key);
    refreshUI(); toast('Saved');
  };
  if ($('cfg-reset')) $('cfg-reset').onclick = () => {
    localStorage.removeItem('qa.base'); localStorage.removeItem('qa.key'); localStorage.removeItem('qa.jwt');
    state.base = location.origin; state.key = 'service-secret'; state.jwt = '';
    refreshUI(); toast('Reset');
  };
  if ($('cfg-clear-jwt')) $('cfg-clear-jwt').onclick = () => { state.jwt=''; localStorage.removeItem('qa.jwt'); refreshUI(); toast('JWT cleared'); };

  // USERS
  $('register').onclick = async () => {
    const email = document.getElementById('reg-email').value || `user_${Math.random().toString(36).slice(2,8)}@example.com`;
    const username = document.getElementById('reg-username').value || email.split('@')[0];
    const password = document.getElementById('reg-password').value || 'P@ssw0rd!';
    const r = await fetchJSON(`${state.base}/register`, { method: 'POST', headers: headers(), body: JSON.stringify({ email, username, password }) });
    out('users-out', r.data);
    if (r.ok) toast('Registered');
  };
  let userToken = '';
  $('login').onclick = async () => {
    const u = document.getElementById('login-username').value; const p = document.getElementById('login-password').value || 'P@ssw0rd!';
    const r = await fetchJSON(`${state.base}/login`, { method: 'POST', headers: headers(), body: JSON.stringify({ email: u, password: p }) });
    userToken = r.data?.token || ''; if (userToken) { state.jwt = userToken; localStorage.setItem('qa.jwt', state.jwt); }
    refreshUI(); out('users-out', r.data);
    if (r.ok) toast('Logged in');
  };
  $('me').onclick = async () => {
    const { data } = await fetchJSON(`${state.base}/user/profile`, { headers: headers() });
    out('users-out', data);
  };

  // RUN FLOW: register → login → AI batch → analytics usage
  const runFlowBtn = $('run-flow');
  if (runFlowBtn) runFlowBtn.onclick = async () => {
    const email = `flow_${Math.random().toString(36).slice(2,8)}@example.com`;
    const username = email.split('@')[0];
    const password = 'P@ssw0rd!';
    const steps = [];

    steps.push('Registering user…'); toast('Registering…');
    let r = await fetchJSON(`${state.base}/users/register`, { method: 'POST', headers: headers(), body: JSON.stringify({ email, username, password }) });
    if (!r.ok) return; steps.push('Registered');

    steps.push('Logging in…'); toast('Logging in…');
    r = await fetchJSON(`${state.base}/users/login`, { method: 'POST', headers: headers(), body: JSON.stringify({ username: email, password }) });
    if (!r.ok) return; const token = r.data?.token; if (token) { state.jwt = token; localStorage.setItem('qa.jwt', token); refreshUI(); }
    steps.push('Logged in');

    steps.push('Submitting AI batch…'); toast('AI batch…');
    r = await fetchJSON(`${state.base}/v1/ai/batch`, { method: 'POST', headers: headers(), body: JSON.stringify({ inputs: ['hello','world'] }) });
    if (!r.ok) return; const jobId = r.data?.jobId || r.data?.id; if (jobId) { localStorage.setItem('qa.aiJobId', jobId); if ($('ai-job-id')) $('ai-job-id').value = jobId; }
    steps.push('AI batch submitted');

    steps.push('Reading analytics usage…'); toast('Analytics usage…');
    const now = new Date(); const to = now.toISOString(); const from = new Date(now.getTime()-10*60*1000).toISOString();
    r = await fetchJSON(`${state.base}/v1/analytics/usage?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, { headers: headers() });
    if (!r.ok) return; steps.push(`Analytics points: ${Array.isArray(r.data?.data) ? r.data.data.length : 'n/a'}`);

    out('users-out', { email, steps }); toast('Flow done');
  };

  // ADMIN
  document.getElementById('status').onclick = async () => {
    const { data } = await fetchJSON(`${state.base}/v1/admin/system/status`, { headers: headers() });
    out('admin-out', data);
  };
  document.getElementById('config').onclick = async () => {
    const { data } = await fetchJSON(`${state.base}/v1/admin/system/config`, { headers: headers() });
    out('admin-out', data);
  };
  document.getElementById('maintenance-toggle').onchange = async (e) => {
    const enabled = !!e.target.checked;
    const payload = enabled
      ? { enabled: true, estimated_duration: 60, message: 'maintenance window' }
      : { enabled: false, completion_message: 'maintenance ended' };
    const { data } = await fetchJSON(`${state.base}/v1/admin/system/maintenance`, { method: 'POST', headers: headers(), body: JSON.stringify(payload) });
    out('admin-out', data);
  };
  document.getElementById('backup-create').onclick = async () => {
    const { data } = await fetchJSON(`${state.base}/v1/admin/system/backup`, { method: 'POST', headers: headers() });
    out('admin-out', data);
  };
  document.getElementById('backup-list').onclick = async () => {
    const { data } = await fetchJSON(`${state.base}/v1/admin/system/backups`, { headers: headers() });
    out('admin-out', data);
  };

  // ANALYTICS
  document.getElementById('analytics-usage').onclick = async () => {
    const from = document.getElementById('analytics-from').value || new Date(Date.now()-15*60*1000).toISOString();
    const to = document.getElementById('analytics-to').value || new Date().toISOString();
    const { data } = await fetchJSON(`${state.base}/v1/analytics/usage?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, { headers: headers() });
    out('analytics-out', data);
  };
  document.getElementById('analytics-perf').onclick = async () => {
    const window = document.getElementById('analytics-window').value || '1h';
    const { data } = await fetchJSON(`${state.base}/v1/analytics/performance?window=${encodeURIComponent(window)}`, { headers: headers() });
    out('analytics-out', data);
  };
  document.getElementById('analytics-errors').onclick = async () => {
    const svc = document.getElementById('analytics-service').value || 'api';
    const { data } = await fetchJSON(`${state.base}/v1/analytics/errors?service=${encodeURIComponent(svc)}`, { headers: headers() });
    out('analytics-out', data);
  };

  // NOTIFICATIONS
  document.getElementById('notif-create').onclick = async () => {
    const subject = document.getElementById('notif-subject').value || `hello ${Date.now()}`;
    const body = document.getElementById('notif-body').value || 'from ui';
    const { data } = await fetchJSON(`${state.base}/v1/notifications/`, { method: 'POST', headers: headers(), body: JSON.stringify({ subject, body }) });
    out('notifications-out', data);
    if (data?.id) { localStorage.setItem('qa.notifId', data.id); if ($('notif-id')) $('notif-id').value = data.id; }
  };
  document.getElementById('notif-get').onclick = async () => {
    const id = document.getElementById('notif-id').value;
    const need = requireVal('notif-id'); if (!need) return;
    const { data } = await fetchJSON(`${state.base}/v1/notifications/${encodeURIComponent(need)}`, { headers: headers() });
    out('notifications-out', data);
  };
  document.getElementById('notif-status').onclick = async () => {
    const id = requireVal('notif-id'); if (!id) return;
    // Some environments may not expose /status; fallback to GET by id
    const res = await fetchJSON(`${state.base}/v1/notifications/${encodeURIComponent(id)}`, { headers: headers() });
    out('notifications-out', res.data);
  };

  // WORKFLOWS
  const stepsField = document.getElementById('wf-steps');
  const getStepsFromUI = () => {
    try {
      const raw = (stepsField?.value || '').trim();
      if (!raw) return [ { id: 'start', name: 'Start', type: 'task' } ];
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr) || arr.length === 0) return [ { id: 'start', name: 'Start', type: 'task' } ];
      return arr;
    } catch { return [ { id: 'start', name: 'Start', type: 'task' } ]; }
  };
  const setStepsUI = (arr) => { if (stepsField) stepsField.value = JSON.stringify(arr, null, 2); };
  document.getElementById('wf-add-start')?.addEventListener('click', () => {
    const arr = getStepsFromUI(); arr.push({ id: `start-${Date.now().toString(36)}`, name: 'Start', type: 'task' }); setStepsUI(arr);
  });
  document.getElementById('wf-add-approval')?.addEventListener('click', () => {
    const arr = getStepsFromUI(); arr.push({ id: `approve-${Date.now().toString(36)}`, name: 'Approval', type: 'manual' }); setStepsUI(arr);
  });
  document.getElementById('wf-clear-steps')?.addEventListener('click', () => setStepsUI([]));

  document.getElementById('wf-create').onclick = async () => {
    const name = document.getElementById('wf-name').value || `wf-${Date.now()}`;
    const steps = getStepsFromUI();
    const { data } = await fetchJSON(`${state.base}/v1/workflows/`, { method: 'POST', headers: headers(), body: JSON.stringify({ name, steps, description: 'Created via UI' }) });
    out('workflows-out', data);
    if (data?.id) { localStorage.setItem('qa.wfId', data.id); if ($('wf-id')) $('wf-id').value = data.id; }
  };
  document.getElementById('wf-get').onclick = async () => {
    const id = document.getElementById('wf-id').value;
    const need = requireVal('wf-id'); if (!need) return;
    const { data } = await fetchJSON(`${state.base}/v1/workflows/${encodeURIComponent(need)}`, { headers: headers() });
    out('workflows-out', data);
  };
  // Execute a workflow to create an execution context
  const wfExecBtn = document.getElementById('wf-execute');
  if (wfExecBtn) wfExecBtn.onclick = async () => {
    const id = requireVal('wf-id'); if (!id) return;
    const { data } = await fetchJSON(`${state.base}/v1/workflows/${encodeURIComponent(id)}/execute`, { method: 'POST', headers: headers(), body: JSON.stringify({ triggered_by: 'ui-demo' }) });
    out('workflows-out', data);
  };
  document.getElementById('wf-approve').onclick = async () => {
    const id = requireVal('wf-id'); if (!id) return;
    // Backend expects approver and decision === "approved"
    const payload = { approver: 'ui-demo', decision: 'approved', comments: 'Approved via UI', timestamp: new Date().toISOString() };
    const { data } = await fetchJSON(`${state.base}/v1/workflows/${encodeURIComponent(id)}/approve`, { method: 'POST', headers: headers(), body: JSON.stringify(payload) });
    out('workflows-out', data);
  };
  document.getElementById('wf-reject').onclick = async () => {
    const id = requireVal('wf-id'); if (!id) return;
    // Backend expects decision === "rejected"
    const payload = { approver: 'ui-demo', decision: 'rejected', comments: 'Rejected via UI', reason: 'no', timestamp: new Date().toISOString() };
    const { data } = await fetchJSON(`${state.base}/v1/workflows/${encodeURIComponent(id)}/reject`, { method: 'POST', headers: headers(), body: JSON.stringify(payload) });
    out('workflows-out', data);
  };

  // AI
  document.getElementById('ai-models').onclick = async () => {
    const { data } = await fetchJSON(`${state.base}/v1/ai/models`, { headers: headers() });
    out('ai-out', data);
  };
  document.getElementById('ai-metrics').onclick = async () => {
    const { data } = await fetchJSON(`${state.base}/v1/ai/metrics`, { headers: headers() });
    out('ai-out', data);
  };
  document.getElementById('ai-batch').onclick = async () => {
    try {
      const inputs = JSON.parse(document.getElementById('ai-batch-inputs').value || '["hello","world"]');
  const { data } = await fetchJSON(`${state.base}/v1/ai/batch`, { method: 'POST', headers: headers(), body: JSON.stringify({ inputs }) });
  out('ai-out', data);
  const id = data?.jobId || data?.id; if (id) { localStorage.setItem('qa.aiJobId', id); if ($('ai-job-id')) $('ai-job-id').value = id; }
    } catch (e) {
      out('ai-out', { error: String(e) });
    }
  };
  document.getElementById('ai-job').onclick = async () => {
    const id = document.getElementById('ai-job-id').value;
    const need = requireVal('ai-job-id'); if (!need) return;
    const { data } = await fetchJSON(`${state.base}/v1/ai/jobs/${encodeURIComponent(need)}`, { headers: headers() });
    out('ai-out', data);
  };

  // AUDIT
  const auditSearch = document.getElementById('audit-search');
  const runAudit = async (deltaPage=0) => {
  const actor = document.getElementById('audit-actor').value || '';
    const action = document.getElementById('audit-action').value || '';
    let page = parseInt(document.getElementById('audit-page').value || '1', 10) + deltaPage;
    if (page < 1) page = 1;
    document.getElementById('audit-page').value = String(page);
    const limit = parseInt(document.getElementById('audit-limit').value || '10', 10);
    const order = document.getElementById('audit-order').value || 'desc';
  const qs = { ...(actor && { user_id: actor }), ...(action && { action }), page, limit, order };
    const params = new URLSearchParams(qs).toString();
    const { data } = await fetchJSON(`${state.base}/v1/audit/logs?${params}`, { headers: headers() });
    // Compact formatting: show a few fields per log
    if (data?.logs) {
      const lines = data.logs.map(l => `${l.timestamp} ${l.action} ${l.resource_type || l.resource} ${l.resource_id || ''} by ${l.user_id}`);
      out('audit-out', lines.join('\n') + (data.total ? `\n\nTotal: ${data.total}, page ${data.page}/${Math.ceil(data.total / data.limit)}` : ''));
    } else {
      out('audit-out', data);
    }
  };
  if (auditSearch) auditSearch.onclick = () => runAudit(0);
  const auditPrev = document.getElementById('audit-prev'); if (auditPrev) auditPrev.onclick = () => runAudit(-1);
  const auditNext = document.getElementById('audit-next'); if (auditNext) auditNext.onclick = () => runAudit(1);

  // ADAPTERS HEALTH
  const adpA = document.getElementById('adp-a-health');
  if (adpA) adpA.onclick = async () => {
    const { data } = await fetchJSON(`${state.base}/v1/adapter-a/health`, { headers: headers() });
    out('adapters-out', data);
  };
  const adpB = document.getElementById('adp-b-health');
  if (adpB) adpB.onclick = async () => {
    const { data } = await fetchJSON(`${state.base}/v1/adapter-b/health`, { headers: headers() });
    out('adapters-out', data);
  };
  const adpAModel = document.getElementById('adp-a-model');
  if (adpAModel) adpAModel.onclick = async () => {
    const { data } = await fetchJSON(`${state.base}/v1/adapter-a/model`, { headers: headers() });
    out('adapters-out', data);
  };
  const adpBModels = document.getElementById('adp-b-models');
  if (adpBModels) adpBModels.onclick = async () => {
    const { data } = await fetchJSON(`${state.base}/v1/adapter-b/models/available`, { headers: headers() });
    out('adapters-out', data);
  };
  const adpBSent = document.getElementById('adp-b-sentiment');
  if (adpBSent) adpBSent.onclick = async () => {
    const { data } = await fetchJSON(`${state.base}/v1/adapter-b/analyze/sentiment`, { method: 'POST', headers: headers(), body: JSON.stringify({ text: 'this is great' }) });
    out('adapters-out', data);
  };

  // EXERCISE EXAMPLES
  const code = (s) => s.replace(/^\s+\n/gm, '').trim();
  let lastCurl = ''; let lastPW = '';
  const esc = (s) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const hiSh = (s) => esc(s)
    .replace(/\bcurl\b/g, '<span class="tok-kw">curl</span>')
    .replace(/( -{1,2}[a-zA-Z0-9\-]+)/g, '<span class="tok-flag">$1</span>')
    .replace(/'(.*?)'/g, "'<span class=tok-str>$1</span>'");
  const hiTs = (s) => esc(s)
    .replace(/\b(import|from|async|await|const|let|return|expect|test)\b/g, '<span class="tok-kw">$1</span>')
    .replace(/'(.*?)'/g, "'<span class=tok-str>$1</span>'")
    .replace(/`(.*?)`/g, "`<span class=tok-str>$1</span>`");
  const renderCode = (id, code, lang) => {
    const el = $(id);
    el.innerHTML = (lang === 'sh' ? hiSh(code) : hiTs(code));
  };
  const setExamples = (curl, pw) => {
    lastCurl = curl; lastPW = pw;
    renderCode('ex-out-curl', curl, 'sh');
    renderCode('ex-out-pw', pw, 'ts');
  };
  const exAdmin = document.getElementById('ex-admin');
  if (exAdmin) exAdmin.onclick = () => {
    const curl = code(`
      curl -s -H 'x-api-key: ${state.key}' ${state.base}/v1/admin/system/status | jq .
      curl -s -X POST -H 'x-api-key: ${state.key}' -H 'content-type: application/json' \
        -d '{"enabled":true}' ${state.base}/v1/admin/system/maintenance | jq .
    `);
    const pw = code(`
      import { test, expect } from '@playwright/test';
      test('maintenance toggle', async ({ request }) => {
  const headers = { 'x-api-key': '${state.key}', 'content-type': 'application/json' };
        await request.post('/v1/admin/system/maintenance', { headers, data: { enabled: true } });
        const res = await request.get('/v1/admin/system/status', { headers });
        expect((await res.json()).maintenance.enabled).toBe(true);
      });
    `);
    setExamples(curl, pw);
  };
  const exAI = document.getElementById('ex-ai');
  if (exAI) exAI.onclick = () => {
    const curl = code(`
      curl -s -X POST -H 'x-api-key: ${state.key}' -H 'content-type: application/json' \
        -d '{"inputs":["hello","world"]}' ${state.base}/v1/ai/batch | jq .
    `);
    const pw = code(`
      import { test, expect } from '@playwright/test';
      test('ai batch', async ({ request }) => {
  const headers = { 'x-api-key': '${state.key}', 'content-type': 'application/json' };
        const accepted = await (await request.post('/v1/ai/batch', { headers, data: { inputs: ['hello','world'] } })).json();
        const id = accepted.jobId || accepted.id;
        const job = await request.get('/v1/ai/jobs/' + id, { headers });
        expect(job.ok()).toBeTruthy();
      });
    `);
    setExamples(curl, pw);
  };
  const exUsers = document.getElementById('ex-users');
  if (exUsers) exUsers.onclick = () => {
    const email = `user_${Math.random().toString(36).slice(2,8)}@example.com`;
    const curl = code(`
      curl -s -X POST -H 'content-type: application/json' -d '{"email":"${email}","username":"${email.split('@')[0]}","password":"P@ssw0rd!"}' ${state.base}/users/register | jq .
      curl -s -X POST -H 'content-type: application/json' -d '{"username":"${email}","password":"P@ssw0rd!"}' ${state.base}/users/login | jq .
    `);
    const pw = code(`
      import { test, expect } from '@playwright/test';
      test('register→login', async ({ request }) => {
        const email = '${email}';
        await request.post('/users/register', { data: { email, username: email.split('@')[0], password: 'P@ssw0rd!' } });
        const login = await request.post('/users/login', { data: { username: email, password: 'P@ssw0rd!' } });
        expect((await login.json()).token).toBeTruthy();
      });
    `);
    setExamples(curl, pw);
  };
  const copy = async (text) => { try { await navigator.clipboard.writeText(text); toast('Copied'); } catch(e){ toast('Copy failed', false);} };
  const btnCurl = document.getElementById('ex-copy-curl'); if (btnCurl) btnCurl.onclick = () => copy(lastCurl);
  const btnPW = document.getElementById('ex-copy-pw'); if (btnPW) btnPW.onclick = () => copy(lastPW);
  const btnBoth = document.getElementById('ex-copy-both'); if (btnBoth) btnBoth.onclick = () => copy(`# curl\n${lastCurl}\n\n# Playwright\n${lastPW}`);

  // EXTRA EXAMPLES: Notifications & Workflows
  const exNotifs = document.getElementById('ex-notifs');
  if (exNotifs) exNotifs.onclick = () => {
    const curl = code(`
      curl -s -X POST -H 'x-api-key: ${state.key}' -H 'content-type: application/json' \
        -d '{"subject":"hello","body":"from ui"}' ${state.base}/v1/notifications/ | jq .
      # replace <id>
      curl -s -H 'x-api-key: ${state.key}' ${state.base}/v1/notifications/<id> | jq .
      curl -s -H 'x-api-key: ${state.key}' ${state.base}/v1/notifications/<id>/status | jq .
    `);
    const pw = code(`
      import { test, expect } from '@playwright/test';
      test('notifications', async ({ request }) => {
  const headers = { 'x-api-key': '${state.key}', 'content-type': 'application/json' };
        const created = await (await request.post('/v1/notifications/', { headers, data: { subject: 'hello', body: 'from ui' } })).json();
        const id = created.id;
        const got = await request.get('/v1/notifications/' + id, { headers }); expect(got.ok()).toBeTruthy();
        const st = await request.get('/v1/notifications/' + id + '/status', { headers }); expect(st.ok()).toBeTruthy();
      });
    `);
    setExamples(curl, pw);
  };
  const exWF = document.getElementById('ex-wf');
  if (exWF) exWF.onclick = () => {
    const name = `wf-${Date.now()}`;
    const curl = code(`
      curl -s -X POST -H 'x-api-key: ${state.key}' -H 'content-type: application/json' \
        -d '{"name":"${name}","steps":[{"id":"start","name":"Start","type":"task"}]}' ${state.base}/v1/workflows/ | jq .
      # replace <id>
      curl -s -H 'x-api-key: ${state.key}' ${state.base}/v1/workflows/<id> | jq .
      # start execution before any approvals
      curl -s -X POST -H 'x-api-key: ${state.key}' -H 'content-type: application/json' \
        -d '{"triggered_by":"ui-demo"}' ${state.base}/v1/workflows/<id>/execute | jq .
      curl -s -X POST -H 'x-api-key: ${state.key}' -H 'content-type: application/json' \
        -d '{"approver":"ui-demo","decision":"approved","comments":"Approved via example"}' ${state.base}/v1/workflows/<id>/approve | jq .
    `);
    const pw = code(`
      import { test, expect } from '@playwright/test';
      test('workflow approval', async ({ request }) => {
        const headers = { 'x-api-key': '${state.key}', 'content-type': 'application/json' };
        const created = await (await request.post('/v1/workflows/', { headers, data: { name: '${name}', steps: [ { id: 'start', name: 'Start', type: 'task' } ] } })).json();
        const id = created.id; expect(id).toBeTruthy();
        await request.post('/v1/workflows/' + id + '/execute', { headers, data: { triggered_by: 'ui-demo' } });
        await request.post('/v1/workflows/' + id + '/approve', { headers, data: { approver: 'ui-demo', decision: 'approved', comments: 'ok' } });
        const got = await (await request.get('/v1/workflows/' + id, { headers })).json();
        expect(got.id).toBe(id);
      });
    `);
    setExamples(curl, pw);
  };
})();
