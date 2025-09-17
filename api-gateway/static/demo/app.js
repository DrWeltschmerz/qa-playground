(() => {
  const $ = (id) => document.getElementById(id);
  const state = {
    base: location.origin,
    key: localStorage.getItem('qa.key') || 'service-secret',
    jwt: localStorage.getItem('qa.jwt') || '',
  };
  let lastEmail = '';
  const headers = () => {
    const h = { 'content-type': 'application/json', 'x-api-key': state.key };
    if (state.jwt) h['Authorization'] = `Bearer ${state.jwt}`;
    return h;
  };
  const toast = (msg, ok=true) => { const t = document.createElement('div'); t.className = `toast ${ok?'ok':'err'}`; t.textContent = msg; document.body.appendChild(t); setTimeout(()=>t.remove(), 2200); };
  const fetchJSON = async (url, init={}) => {
    try {
      const res = await fetch(url, init);
      const ct = res.headers.get('content-type') || '';
      const isJSON = ct.includes('application/json');
      const data = isJSON ? await res.json() : await res.text();
      if (!res.ok) { toast((isJSON ? (data.error || JSON.stringify(data)) : String(data)) || `${res.status}`, false); return { ok:false, status: res.status, data }; }
      return { ok:true, status: res.status, data };
    } catch(e){ toast(String(e), false); return { ok:false, status:0, data:{ error:String(e) } }; }
  };
  $('base-url').textContent = state.base;

  // Login/Signup
  const signup = $('signup'); const signin = $('signin');
  if (signup) signup.onclick = async () => {
    const email = $('email').value || `demo_${Math.random().toString(36).slice(2,8)}@example.com`;
    const password = $('password').value || 'P@ssw0rd!';
    const username = email.split('@')[0];
    const r = await fetchJSON(`${state.base}/register`, { method: 'POST', headers: headers(), body: JSON.stringify({ email, username, password }) });
    if (r.ok) { lastEmail = email; if ($('email')) $('email').value = email; toast('Signed up'); }
  };
  if (signin) signin.onclick = async () => {
    const email = $('email').value || lastEmail || `demo_${Math.random().toString(36).slice(2,8)}@example.com`;
    const password = $('password').value || 'P@ssw0rd!';
    const r = await fetchJSON(`${state.base}/login`, { method: 'POST', headers: headers(), body: JSON.stringify({ email, password }) });
  if (r.ok) { state.jwt = r.data.token; localStorage.setItem('qa.jwt', state.jwt); toast('Signed in'); }
  };

  // Compose & Publish
  const compose = $('compose'); const publish = $('publish');
  const copyContent = $('copy-content');
  let lastCompletion = '';
  if (compose) compose.onclick = async () => {
    const prompt = $('prompt').value || 'Write a short announcement about our new feature.';
    try {
      compose.disabled = true;
      // show progress immediately for deterministic UI signals
      const out = $('compose-out'); if (out) out.textContent = 'Loading…';
      const r = await fetchJSON(`${state.base}/v1/ai/complete`, { method: 'POST', headers: headers(), body: JSON.stringify({ prompt, model: 'adapter-a' }) });
      if (r.ok) {
        lastCompletion = r.data?.completion || JSON.stringify(r.data);
        $('compose-out').textContent = lastCompletion;
        publish.disabled = false;
        const previewBtn = document.getElementById('open-preview'); if (previewBtn) previewBtn.disabled = false;
        toast('Composed');
      } else {
        $('compose-out').textContent = typeof r.data === 'string' ? r.data : JSON.stringify(r.data);
      }
    } finally {
      compose.disabled = false;
    }
  };
  if (publish) publish.onclick = async () => {
    // Align payload with API expectations
    const payload = {
      title: 'Announcement',
      // truncate to keep well under server limits
      message: (lastCompletion || '...').slice(0, 1000),
      type: 'info',
      recipient: lastEmail || 'demo@example.com',
      priority: 'medium',
      metadata: { source: 'demo-ui' },
    };
    const r = await fetchJSON(`${state.base}/v1/notifications/`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(payload),
    });
    if (r.ok) {
      localStorage.setItem('qa.notifId', r.data.id || '');
      toast('Published notification');
    }
  };
  if (copyContent) copyContent.onclick = async () => {
    try { await navigator.clipboard.writeText(lastCompletion || ''); toast('Copied'); } catch(e){ toast('Clipboard failed', false); }
  };

  // Workflow
  const createWf = $('create-wf'); const approveWf = $('approve-wf'); const openPreview = $('open-preview');
  let wfId = '';
  if (createWf) createWf.onclick = async () => {
    // Use valid step schema and kick off execution so Approve can succeed
    const wfPayload = {
      name: `wf-${Date.now()}`,
      steps: [{ id: 'start', name: 'Start', type: 'task' }],
    };
    const r = await fetchJSON(`${state.base}/v1/workflows/`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(wfPayload),
    });
    if (r.ok) {
      wfId = r.data.id;
      $('wf-out').textContent = JSON.stringify(r.data, null, 2);
      // Start execution (non-blocking) to allow approval
      fetchJSON(`${state.base}/v1/workflows/${encodeURIComponent(wfId)}/execute`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ triggered_by: 'demo-ui' }),
      });
      approveWf.disabled = false;
      if (openPreview) openPreview.disabled = false;
      localStorage.setItem('qa.wfId', wfId);
      toast('Workflow created');
    }
  };
  if (approveWf) approveWf.onclick = async () => {
    // Confirm modal flow
    const modal = document.getElementById('confirm-modal');
    if (modal && typeof modal.showModal === 'function') {
      const p = new Promise((resolve) => {
        const ok = document.getElementById('modal-ok'); const cancel = document.getElementById('modal-cancel');
        const onOk = () => { modal.close(); modal.removeAttribute('data-open'); ok.removeEventListener('click', onOk); cancel.removeEventListener('click', onCancel); resolve(true); };
        const onCancel = () => { modal.close(); modal.removeAttribute('data-open'); ok.removeEventListener('click', onOk); cancel.removeEventListener('click', onCancel); resolve(false); };
        ok.addEventListener('click', onOk); cancel.addEventListener('click', onCancel);
      });
      try { modal.showModal(); } catch(e) { /* no-op */ }
      // deterministically mark open state for tests and headless
      modal.setAttribute('open', '');
      modal.setAttribute('data-open', '1');
      const go = await p; if (!go) { toast('Approval cancelled'); return; }
    }
    if (!wfId) wfId = localStorage.getItem('qa.wfId') || '';
    if (!wfId) return toast('No workflow', false);
  const r = await fetchJSON(`${state.base}/v1/workflows/${encodeURIComponent(wfId)}/approve`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ approver: 'demo', decision: 'approved', comments: 'ok', timestamp: new Date().toISOString() }),
  });
  if (r.ok) { $('wf-out').textContent = JSON.stringify(r.data, null, 2); toast('Approved'); }
  };
  if (openPreview) openPreview.onclick = () => {
    // open a new tab using a data URL to ensure DOM is ready with <pre>
    const content = (lastCompletion || '').replace(/</g, '&lt;');
    const html = `<!doctype html><html><head><meta charset='utf-8'><title>Preview</title></head><body><pre>${content}</pre></body></html>`;
    const url = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
    const w = window.open(url, '_blank', 'noopener');
    if (!w) {
      // Fallback: render inline preview for environments where popups are blocked
      let pre = document.getElementById('preview-inline');
      if (!pre) {
        pre = document.createElement('pre');
        pre.id = 'preview-inline';
        pre.setAttribute('data-testid', 'preview-inline');
        pre.className = 'out';
        document.body.appendChild(pre);
      }
      pre.textContent = lastCompletion || '';
      toast('Preview opened inline');
    }
  };

  // Extras: standalone Confirm Modal
  const openConfirm = document.getElementById('open-modal');
  if (openConfirm) openConfirm.onclick = () => {
    const modal = document.getElementById('confirm-modal');
    if (!modal) return;
    // Bind close handlers once for standalone usage
    if (!modal.dataset || !modal.dataset.bound) {
      const ok = document.getElementById('modal-ok');
      const cancel = document.getElementById('modal-cancel');
      const close = () => {
        if (typeof modal.close === 'function') modal.close(); else modal.removeAttribute('open');
        modal.removeAttribute('data-open');
      };
      if (ok) ok.addEventListener('click', close);
      if (cancel) cancel.addEventListener('click', close);
      // also remove flag on native close event (e.g., Esc)
      modal.addEventListener('close', () => modal.removeAttribute('data-open'));
      if (modal.dataset) modal.dataset.bound = '1';
    }
    if (typeof modal.showModal === 'function') {
      try { modal.showModal(); } catch (e) { modal.setAttribute('open', ''); }
    } else {
      modal.setAttribute('open', '');
    }
    // deterministically mark open state for tests and headless
    modal.setAttribute('open', '');
    modal.setAttribute('data-open', '1');
  };

  // Activity (Analytics Usage)
  const refresh = $('refresh-activity');
  if (refresh) refresh.onclick = async () => {
    const now = new Date(); const to = now.toISOString(); const from = new Date(now.getTime() - 10*60*1000).toISOString();
  const r = await fetchJSON(`${state.base}/v1/analytics/usage?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, { headers: headers() });
  if (r.ok) $('activity-out').textContent = JSON.stringify(r.data, null, 2);
  };
  const dl = $('download-csv');
  if (dl) dl.onclick = async () => {
    // generate a small CSV from analytics usage
    const now = new Date(); const to = now.toISOString(); const from = new Date(now.getTime() - 10*60*1000).toISOString();
    const r = await fetchJSON(`${state.base}/v1/analytics/usage?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, { headers: headers() });
    if (!r.ok) return;
    const rows = (r.data?.data || []).map((it) => [it.timestamp || '', it.value || '']).map(arr => arr.join(','));
    const csv = ['timestamp,value', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'analytics.csv'; a.click(); URL.revokeObjectURL(a.href);
  };

  // Drag & Drop + File upload hooks
  const dz = $('drop-zone'); const fi = $('file-input');
  const onDrop = (files) => { toast(`Dropped ${files.length} file(s)`); };
  if (dz) {
    dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('drag'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('drag'));
    dz.addEventListener('drop', (e) => { e.preventDefault(); dz.classList.remove('drag'); const files = Array.from(e.dataTransfer.files||[]); onDrop(files); });
  }
  if (fi) fi.addEventListener('change', (e) => { const files = Array.from(e.target.files||[]); onDrop(files); });

  // iframe widget communication
  const widgetOut = $('widget-out');
  window.addEventListener('message', (ev) => {
    const data = ev.data || {}; if (data.type === 'widget-ping') { widgetOut.textContent = `Widget ping @ ${new Date(data.ts).toISOString()}`; toast('Widget ping'); }
  });
  // Signal readiness for tests to avoid race conditions
  try { document.body && document.body.setAttribute('data-demo-ready', '1'); } catch(e){}
  try { window.__demoReady = true; } catch(e){}
})();
