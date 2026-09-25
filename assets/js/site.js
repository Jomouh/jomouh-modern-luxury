/* Jomouh site: navigation, contact tabs, and form delivery */
(function () {
  /* ---- Form delivery ------------------------------------------------------
     Paste your form endpoint here (for example a Formspree form URL such as
     "https://formspree.io/f/abcdwxyz"). While it is empty, forms open the
     visitor's email app with the message pre-filled to the right division. */
  const FORM_ENDPOINT = '';

  const EMAILS = {
    general: 'info@jomouh.com',
    media: 'media@jomouh.com',
    kitchen: 'kitchen@jomouh.com',
    stone: 'stone@jomouh.com'
  };

  /* ---- Mobile menu ---- */
  const btn = document.querySelector('.menu-btn');
  if (btn) {
    const close = () => { document.body.classList.remove('menu-open'); btn.setAttribute('aria-expanded', 'false'); };
    btn.addEventListener('click', () => {
      const open = document.body.classList.toggle('menu-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.querySelectorAll('.mobile-nav a').forEach((a) => a.addEventListener('click', close));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    window.matchMedia('(min-width: 901px)').addEventListener('change', (m) => { if (m.matches) close(); });
  }

  /* ---- Contact page tabs ---- */
  const tabs = document.querySelectorAll('[role="tab"][data-tab]');
  if (tabs.length) {
    const form = document.querySelector('#contact-form');
    const submit = form.querySelector('button[type="submit"]');
    const labels = { general: 'Send message', media: 'Book a strategy call', kitchen: 'Request pricing', stone: 'Request quote' };
    const select = (key, focus) => {
      tabs.forEach((t) => {
        const on = t.dataset.tab === key;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        if (on && focus) t.focus();
      });
      form.querySelectorAll('.group[data-group]').forEach((g) => {
        const on = g.dataset.group === key;
        g.hidden = !on;
        g.querySelectorAll('input,select,textarea').forEach((el) => { el.disabled = !on; });
      });
      form.dataset.division = key;
      submit.textContent = labels[key];
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(t.dataset.tab));
      t.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
        select(next.dataset.tab, true);
      });
    });
    const q = new URLSearchParams(location.search).get('division');
    select(EMAILS[q] ? q : 'general');
  }

  /* ---- Forms ---- */
  document.querySelectorAll('form[data-division]').forEach((form) => {
    const status = form.querySelector('.form__status');
    const setStatus = (state, msg) => { status.dataset.state = state; status.textContent = msg; };
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      if (form.querySelector('.hp input') && form.querySelector('.hp input').value) return;
      const division = form.dataset.division || 'general';
      const data = new FormData(form);
      data.append('division', division);
      data.append('page', location.pathname);
      const btn = form.querySelector('button[type="submit"]');
      if (FORM_ENDPOINT) {
        btn.disabled = true;
        try {
          const res = await fetch(FORM_ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
          if (!res.ok) throw new Error(String(res.status));
          form.reset();
          setStatus('ok', 'Thank you. Your message reached our ' + (division === 'general' ? '' : division + ' ') + 'team. We reply within one business day.');
        } catch (err) {
          setStatus('error', 'Your message did not send. Check your connection and try again, or email ' + EMAILS[division] + '.');
        } finally { btn.disabled = false; }
        return;
      }
      const lines = [];
      data.forEach((v, k) => {
        if (k === 'division' || k === 'page' || k === '_gotcha' || v instanceof File) return;
        const field = form.querySelector('[name="' + k + '"]');
        const label = field && field.id ? form.querySelector('label[for="' + field.id + '"]') : null;
        if (String(v).trim()) lines.push((label ? label.textContent : k) + ': ' + v);
      });
      const subject = 'Website inquiry: ' + (form.dataset.subject || division);
      location.href = 'mailto:' + EMAILS[division] + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
      setStatus('ok', 'Your email app should open with your message ready to send to ' + EMAILS[division] + '.');
    });
  });
})();
