(() => {
  'use strict';

  // ---------- Settings ----------
  const STORAGE_KEY = 'jobfolio:jobs';
  const BACKUP_KEY = 'jobfolio:lastBackup';
  const FOLLOW_UP_DAYS = 7;
  const CLOSING_SOON_DAYS = 7;

  const STATUSES = [
    { id: 'applied', label: 'Applied' },
    { id: 'heard', label: 'Heard back' },
    { id: 'interview', label: 'Interview' },
    { id: 'offer', label: 'Offer' },
    { id: 'rejected', label: 'Rejected' },
    { id: 'noresponse', label: 'No response' },
  ];
  const STATUS_BY_ID = Object.fromEntries(STATUSES.map((s) => [s.id, s]));
  const CLOSED_STATUSES = ['rejected', 'noresponse'];
  // Order used for the "most urgent" sort once deadlines and follow-ups are handled.
  const STATUS_RANK = { interview: 0, offer: 1, heard: 2, applied: 3, noresponse: 4, rejected: 5 };

  // Spreadsheet columns: [heading, field]
  const COLUMNS = [
    ['Job title', 'title'],
    ['Company', 'company'],
    ['Location', 'location'],
    ['Status', 'status'],
    ['Date applied', 'applied'],
    ['Closing date', 'closing'],
    ['Advert link', 'link'],
    ['Cover letter sent', 'coverLetter'],
    ['Contact name', 'contact'],
    ['Notes', 'notes'],
    ['Followed up on', 'followedUp'],
    ['ID', 'id'],
  ];

  const ICONS = {
    more: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    briefcase: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="3"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12z"/></svg>',
    flag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 22V4"/><path d="M5 4h12l-2.5 4.5L17 13H5"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0 5-5m-5 5-5-5M5 21h14"/></svg>',
    upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3m0 0 5 5m-5-5L7 8M5 21h14"/></svg>',
    external: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
  };
  const icon = (name) => ICONS[name] || '';

  // ---------- Elements ----------
  const $ = (sel) => document.querySelector(sel);
  const listEl = $('#list');
  const emptyEl = $('#empty');
  const statsEl = $('#stats');
  const searchEl = $('#search');
  const searchClear = $('#searchClear');
  const filtersEl = $('#filters');
  const backdrop = $('#backdrop');
  const jobSheet = $('#jobSheet');
  const menuSheet = $('#menuSheet');
  const form = $('#jobForm');
  const toastEl = $('#toast');

  // ---------- State ----------
  let jobs = load();
  let filter = 'all';
  let query = '';
  let editingId = null;
  let openSheetEl = null;
  const shown = new Set(); // cards already animated in

  // ---------- Storage ----------
  function load() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    } catch {
      toast('Couldn’t save — your phone’s storage may be full');
    }
  }

  const uid = () =>
    (window.crypto && crypto.randomUUID)
      ? crypto.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2);

  // ---------- Dates ----------
  const pad = (n) => String(n).padStart(2, '0');
  const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const todayISO = () => toISO(new Date());

  function parseISO(s) {
    if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  const daysBetween = (a, b) => Math.round((b - a) / 86400000);

  function fmtDate(s, long) {
    const d = parseISO(s);
    if (!d) return '';
    const opts = { day: 'numeric', month: 'short' };
    if (long || d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric';
    return d.toLocaleDateString('en-GB', opts);
  }

  // Accepts 2026-10-28, 28/10/2026 or 28-10-26 (spreadsheet apps sometimes rewrite dates).
  function normaliseDate(s) {
    s = (s || '').trim();
    if (!s) return '';
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
    if (m) {
      const year = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
      return `${year}-${pad(m[2])}-${pad(m[1])}`;
    }
    const d = new Date(s);
    return isNaN(d) ? '' : toISO(d);
  }

  // ---------- Urgency ----------
  function getInfo(job) {
    const today = parseISO(todayISO());
    const closing = parseISO(job.closing);
    const closingIn = closing ? daysBetween(today, closing) : null;
    const stillOpen = job.status !== 'offer' && !CLOSED_STATUSES.includes(job.status);
    const closingSoon = stillOpen && closingIn !== null && closingIn >= 0 && closingIn <= CLOSING_SOON_DAYS;

    const lastContact = [job.applied, job.followedUp].filter(Boolean).sort().pop();
    const waited = lastContact ? daysBetween(parseISO(lastContact), today) : null;
    const followUp = job.status === 'applied' && waited !== null && waited >= FOLLOW_UP_DAYS;

    return { closingIn, closingSoon, followUp, waited, urgent: closingSoon || followUp };
  }

  function urgencyKey(job, info) {
    if (info.closingSoon) return [0, info.closingIn];
    if (info.followUp) return [1, -info.waited];
    const rank = 2 + (STATUS_RANK[job.status] ?? 3);
    const applied = parseISO(job.applied);
    const t = applied ? applied.getTime() : 0;
    // Active jobs: oldest first (closest to needing a nudge). Closed jobs: newest first.
    return [rank, CLOSED_STATUSES.includes(job.status) ? -t : t];
  }

  function compareJobs(a, b, infos) {
    const ka = urgencyKey(a, infos.get(a.id));
    const kb = urgencyKey(b, infos.get(b.id));
    return ka[0] - kb[0] || ka[1] - kb[1] || (b.updated || 0) - (a.updated || 0);
  }

  function matchesFilter(job, info) {
    switch (filter) {
      case 'urgent': return info.urgent;
      case 'active': return !CLOSED_STATUSES.includes(job.status);
      case 'closed': return CLOSED_STATUSES.includes(job.status);
      default: return true;
    }
  }

  function matchesQuery(job, q) {
    if (!q) return true;
    const status = STATUS_BY_ID[job.status]?.label || '';
    return [job.title, job.company, job.location, job.contact, job.notes, status]
      .join(' ')
      .toLowerCase()
      .includes(q);
  }

  // ---------- Rendering ----------
  const esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function hueFor(text) {
    let h = 0;
    for (const ch of String(text || '?')) h = (h * 31 + ch.codePointAt(0)) % 360;
    return h;
  }

  function initials(text) {
    const words = String(text || '').trim().split(/\s+/).filter((w) => /^[\p{L}\p{N}]/u.test(w));
    if (!words.length) return '?';
    return words.slice(0, 2).map((w) => [...w][0]).join('').toUpperCase();
  }

  function closingLabel(days) {
    if (days === 0) return 'Closes today';
    if (days === 1) return 'Closes tomorrow';
    return `Closes in ${days} days`;
  }

  function cardHTML(job, info, index) {
    const status = STATUS_BY_ID[job.status] || STATUS_BY_ID.applied;
    const name = job.company || job.title;
    const sub = [job.company, job.location].filter(Boolean).map(esc).join(' · ');

    const meta = [];
    if (job.applied) meta.push(`<span>${icon('send')}Applied ${fmtDate(job.applied)}</span>`);
    if (job.closing && !info.closingSoon) {
      const past = info.closingIn !== null && info.closingIn < 0;
      meta.push(`<span>${icon('calendar')}${past ? 'Closed' : 'Closes'} ${fmtDate(job.closing)}</span>`);
    }
    if (job.coverLetter) meta.push(`<span>${icon('doc')}Cover letter</span>`);
    if (job.contact) meta.push(`<span>${icon('user')}${esc(job.contact)}</span>`);

    const alerts = [];
    if (info.closingSoon) {
      alerts.push(`<span class="alert alert-closing${info.closingIn <= 2 ? ' hot' : ''}">${icon('clock')}${closingLabel(info.closingIn)}</span>`);
    }
    if (info.followUp) {
      alerts.push(`<span class="alert alert-follow">${icon('bell')}Follow up · ${info.waited} days, no reply</span>`);
    }

    const isNew = !shown.has(job.id);
    const classes = ['card', info.urgent && 'is-urgent', isNew && 'enter'].filter(Boolean).join(' ');

    return `
      <article class="${classes}" data-id="${esc(job.id)}" tabindex="0" role="button" style="--d:${Math.min(index, 8) * 45}ms">
        <div class="card-head">
          <div class="avatar" style="--h:${hueFor(name)}" aria-hidden="true">${esc(initials(name))}</div>
          <div class="card-text">
            <h3>${esc(job.title || 'Untitled role')}</h3>
            ${sub ? `<p>${sub}</p>` : ''}
          </div>
          <span class="badge" data-s="${status.id}">${status.label}</span>
        </div>
        ${meta.length ? `<div class="card-meta">${meta.join('')}</div>` : ''}
        ${alerts.length ? `<div class="card-alerts">${alerts.join('')}</div>` : ''}
      </article>`;
  }

  function renderStats(infos) {
    const urgent = jobs.filter((j) => infos.get(j.id).urgent).length;
    const progressing = jobs.filter((j) => ['heard', 'interview', 'offer'].includes(j.status)).length;
    const tiles = [
      { n: jobs.length, label: 'Applications', icon: 'briefcase', c: 'var(--accent)' },
      { n: progressing, label: 'In progress', icon: 'chat', c: 'var(--purple)' },
      { n: urgent, label: 'Need action', icon: 'flag', c: 'var(--orange)' },
    ];
    statsEl.innerHTML = tiles.map((t) => `
      <div class="stat" style="--c:${t.c}">
        <div class="stat-icon">${icon(t.icon)}</div>
        <div class="stat-num">${t.n}</div>
        <div class="stat-label">${t.label}</div>
      </div>`).join('');

    $('#urgentCount').textContent = urgent ? urgent : '';

    const sub = $('#subtitle');
    if (!jobs.length) sub.textContent = 'Track every application in one place.';
    else if (urgent === 1) sub.textContent = '1 job needs your attention.';
    else if (urgent > 1) sub.textContent = `${urgent} jobs need your attention.`;
    else sub.textContent = 'You’re all caught up. Nice work.';
  }

  function render() {
    const infos = new Map(jobs.map((j) => [j.id, getInfo(j)]));
    renderStats(infos);

    const q = query.trim().toLowerCase();
    const visible = jobs
      .filter((j) => matchesFilter(j, infos.get(j.id)) && matchesQuery(j, q))
      .sort((a, b) => compareJobs(a, b, infos));

    listEl.innerHTML = visible.map((j, i) => cardHTML(j, infos.get(j.id), i)).join('');
    visible.forEach((j) => shown.add(j.id));

    if (visible.length) {
      emptyEl.hidden = true;
    } else {
      emptyEl.hidden = false;
      if (!jobs.length) {
        $('#emptyTitle').textContent = 'No applications yet';
        $('#emptyText').textContent = 'Tap “Add job” to log your first application. Everything stays private on this phone.';
      } else if (q) {
        $('#emptyTitle').textContent = 'No matches';
        $('#emptyText').textContent = `Nothing found for “${query.trim()}”. Try a different word.`;
      } else if (filter === 'urgent') {
        $('#emptyTitle').textContent = 'Nothing urgent';
        $('#emptyText').textContent = 'No closing dates this week and no follow-ups due. Enjoy the breather.';
      } else {
        $('#emptyTitle').textContent = 'Nothing here';
        $('#emptyText').textContent = 'No jobs in this view yet.';
      }
    }
  }

  // ---------- Search & filters ----------
  searchEl.addEventListener('input', () => {
    query = searchEl.value;
    searchClear.hidden = !query;
    render();
  });
  searchEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') searchEl.blur();
  });
  searchClear.addEventListener('click', () => {
    searchEl.value = '';
    query = '';
    searchClear.hidden = true;
    render();
  });

  const filterButtons = [...filtersEl.querySelectorAll('button')];
  filtersEl.style.setProperty('--n', filterButtons.length);
  filterButtons.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      filter = btn.dataset.filter;
      filterButtons.forEach((b) => b.classList.toggle('active', b === btn));
      filtersEl.style.setProperty('--i', i);
      render();
    });
  });

  // ---------- Sheets ----------
  function openSheet(sheet) {
    openSheetEl = sheet;
    document.documentElement.classList.add('locked');
    backdrop.classList.add('show');
    sheet.classList.add('open');
    sheet.setAttribute('aria-hidden', 'false');
    sheet.querySelector('.sheet-body').scrollTop = 0;
  }

  function closeSheet() {
    const sheet = openSheetEl;
    if (!sheet) return;
    openSheetEl = null;
    if (document.activeElement) document.activeElement.blur();
    sheet.style.transform = '';
    sheet.classList.remove('open');
    sheet.setAttribute('aria-hidden', 'true');
    backdrop.classList.remove('show');
    document.documentElement.classList.remove('locked');
    toastEl.classList.remove('above-sheet');
  }

  backdrop.addEventListener('click', closeSheet);
  document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', closeSheet));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSheet();
  });

  // Swipe a sheet down to dismiss it.
  document.querySelectorAll('.sheet').forEach((sheet) => {
    const handle = sheet.querySelector('.sheet-handle');
    let startY = null;
    let dy = 0;
    handle.addEventListener('touchstart', (e) => {
      if (e.target.closest('button')) return;
      startY = e.touches[0].clientY;
      dy = 0;
      sheet.classList.add('dragging');
    }, { passive: true });
    handle.addEventListener('touchmove', (e) => {
      if (startY === null) return;
      dy = Math.max(0, e.touches[0].clientY - startY);
      sheet.style.transform = `translateY(${dy}px)`;
    }, { passive: true });
    const end = () => {
      if (startY === null) return;
      startY = null;
      sheet.classList.remove('dragging');
      if (dy > 110) closeSheet();
      else sheet.style.transform = '';
    };
    handle.addEventListener('touchend', end);
    handle.addEventListener('touchcancel', end);
  });

  // ---------- Job form ----------
  $('#statusPicker').innerHTML = STATUSES.map((s) => `
    <label class="pill" data-s="${s.id}">
      <input type="radio" name="status" value="${s.id}">
      <span>${s.label}</span>
    </label>`).join('');

  const dateFields = [...form.querySelectorAll('.date-field')];
  function refreshDate(wrap) {
    const input = wrap.querySelector('input');
    wrap.classList.toggle('is-empty', !input.value);
    wrap.querySelector('.date-display').textContent = input.value ? fmtDate(input.value, true) : 'Add date';
  }
  dateFields.forEach((wrap) => {
    const input = wrap.querySelector('input');
    input.addEventListener('input', () => refreshDate(wrap));
    input.addEventListener('change', () => refreshDate(wrap));
    wrap.querySelector('.date-clear').addEventListener('click', () => {
      input.value = '';
      refreshDate(wrap);
    });
  });

  function normaliseLink(url) {
    url = (url || '').trim();
    if (url && !/^[a-z][a-z0-9+.-]*:/i.test(url)) url = 'https://' + url;
    return url;
  }

  const linkInput = form.elements.link;
  const openLink = $('#openLink');
  function refreshLink() {
    const url = normaliseLink(linkInput.value);
    const safe = /^https?:\/\//i.test(url);
    openLink.hidden = !safe;
    if (safe) openLink.href = url;
  }
  linkInput.addEventListener('input', refreshLink);

  function showFollowUp(job) {
    const box = $('#followupBox');
    const info = job ? getInfo(job) : null;
    if (!info || !info.followUp) {
      box.hidden = true;
      return;
    }
    box.hidden = false;
    $('#followupText').textContent = job.followedUp
      ? `No reply for ${info.waited} days since you last chased.`
      : `No reply for ${info.waited} days. A short, polite email can help.`;
  }

  function openJobForm(job) {
    editingId = job ? job.id : null;
    form.reset();
    $('#sheetTitle').textContent = job ? 'Edit job' : 'New job';

    const values = job || { status: 'applied', applied: todayISO() };
    for (const key of ['title', 'company', 'location', 'applied', 'closing', 'link', 'contact', 'notes']) {
      form.elements[key].value = values[key] || '';
    }
    form.elements.coverLetter.checked = !!values.coverLetter;
    const radio = form.querySelector(`input[name="status"][value="${values.status || 'applied'}"]`);
    if (radio) radio.checked = true;

    dateFields.forEach(refreshDate);
    refreshLink();
    showFollowUp(job);

    $('#editExtras').hidden = !job;
    if (job) {
      const added = job.created ? new Date(job.created).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
      $('#metaNote').textContent = added ? `Added ${added}` : '';
    }
    openSheet(jobSheet);
  }

  function readForm() {
    const el = form.elements;
    return {
      title: el.title.value.trim(),
      company: el.company.value.trim(),
      location: el.location.value.trim(),
      status: form.querySelector('input[name="status"]:checked')?.value || 'applied',
      applied: el.applied.value,
      closing: el.closing.value,
      link: normaliseLink(el.link.value),
      coverLetter: el.coverLetter.checked,
      contact: el.contact.value.trim(),
      notes: el.notes.value.trim(),
    };
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = readForm();
    if (!data.title) {
      const title = form.elements.title;
      title.classList.remove('shake');
      void title.offsetWidth;
      title.classList.add('shake');
      title.focus();
      toast('Add a job title first', { aboveSheet: true });
      return;
    }

    const now = Date.now();
    if (editingId) {
      const job = jobs.find((j) => j.id === editingId);
      if (job) Object.assign(job, data, { updated: now });
    } else {
      const job = { id: uid(), ...data, followedUp: '', created: now, updated: now };
      jobs.push(job);
    }
    save();
    closeSheet();
    render();
    toast(editingId ? 'Changes saved' : 'Job added');
  });

  $('#followedUpBtn').addEventListener('click', () => {
    const job = jobs.find((j) => j.id === editingId);
    if (!job) return;
    job.followedUp = todayISO();
    job.updated = Date.now();
    save();
    render();
    showFollowUp(job);
    toast(`Great — we’ll remind you again in ${FOLLOW_UP_DAYS} days`, { aboveSheet: true });
  });

  $('#deleteBtn').addEventListener('click', () => {
    const index = jobs.findIndex((j) => j.id === editingId);
    if (index < 0) return;
    const [removed] = jobs.splice(index, 1);
    save();
    closeSheet();
    render();
    toast('Job deleted', {
      action: 'Undo',
      onAction() {
        jobs.splice(index, 0, removed);
        shown.delete(removed.id);
        save();
        render();
      },
    });
  });

  $('#addBtn').addEventListener('click', () => openJobForm(null));

  function openCard(target) {
    const card = target.closest('.card');
    if (!card) return;
    const job = jobs.find((j) => j.id === card.dataset.id);
    if (job) openJobForm(job);
  }
  listEl.addEventListener('click', (e) => openCard(e.target));
  listEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openCard(e.target);
    }
  });

  // ---------- Toast ----------
  let toastTimer;
  function toast(message, opts = {}) {
    const actionBtn = $('#toastAction');
    $('#toastText').textContent = message;
    actionBtn.hidden = !opts.action;
    actionBtn.textContent = opts.action || '';
    actionBtn.onclick = () => {
      toastEl.classList.remove('show');
      opts.onAction && opts.onAction();
    };
    toastEl.classList.toggle('above-sheet', !!opts.aboveSheet);
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), opts.action ? 5000 : 2600);
  }

  // ---------- Backup: export & import ----------
  function refreshBackupNote() {
    const last = localStorage.getItem(BACKUP_KEY);
    const count = jobs.length === 1 ? '1 job' : `${jobs.length} jobs`;
    $('#backupNote').textContent = `${count} saved on this phone · Last backup: ${last ? fmtDate(last, true) : 'never'}`;
  }

  $('#menuBtn').addEventListener('click', () => {
    refreshBackupNote();
    openSheet(menuSheet);
  });

  function csvCell(value) {
    const s = value == null ? '' : String(value);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  function buildCSV() {
    const lines = [COLUMNS.map(([heading]) => heading)];
    const sorted = [...jobs].sort((a, b) => (b.applied || '').localeCompare(a.applied || ''));
    for (const job of sorted) {
      lines.push(COLUMNS.map(([, key]) => {
        if (key === 'status') return STATUS_BY_ID[job.status]?.label || 'Applied';
        if (key === 'coverLetter') return job.coverLetter ? 'Yes' : 'No';
        return job[key] || '';
      }));
    }
    // The BOM helps Excel read accented characters correctly.
    return '﻿' + lines.map((row) => row.map(csvCell).join(',')).join('\r\n');
  }

  $('#exportBtn').addEventListener('click', async () => {
    if (!jobs.length) {
      toast('Add a job first, then you can export', { aboveSheet: true });
      return;
    }
    const filename = `Jobfolio backup ${todayISO()}.csv`;
    const blob = new Blob([buildCSV()], { type: 'text/csv;charset=utf-8' });
    const file = new File([blob], filename, { type: 'text/csv' });

    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        // On iPhone this opens the share sheet: Save to Files, email, AirDrop…
        await navigator.share({ files: [file], title: 'Jobfolio backup' });
      } else {
        const url = URL.createObjectURL(blob);
        const a = Object.assign(document.createElement('a'), { href: url, download: filename });
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
      }
      localStorage.setItem(BACKUP_KEY, todayISO());
      refreshBackupNote();
      toast('Backup ready', { aboveSheet: true });
    } catch (err) {
      if (err && err.name === 'AbortError') return; // share sheet closed
      toast('Couldn’t export — please try again', { aboveSheet: true });
    }
  });

  function parseCSV(text) {
    text = text.replace(/^﻿/, '');
    const rows = [];
    let row = [];
    let field = '';
    let quoted = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (quoted) {
        if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
        else if (c === '"') quoted = false;
        else field += c;
      } else if (c === '"') quoted = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c !== '\r') field += c;
    }
    if (field || row.length) { row.push(field); rows.push(row); }
    return rows.filter((r) => r.some((cell) => cell.trim()));
  }

  function statusFromLabel(label) {
    const l = (label || '').trim().toLowerCase();
    return STATUSES.find((s) => s.label.toLowerCase() === l || s.id === l)?.id || 'applied';
  }

  $('#importBtn').addEventListener('click', () => $('#importFile').click());

  $('#importFile').addEventListener('change', async (e) => {
    const fileInput = e.target;
    const file = fileInput.files && fileInput.files[0];
    fileInput.value = '';
    if (!file) return;

    try {
      const rows = parseCSV(await file.text());
      const headings = (rows[0] || []).map((h) => h.trim().toLowerCase());
      const col = Object.fromEntries(COLUMNS.map(([heading, key]) => [key, headings.indexOf(heading.toLowerCase())]));
      if (rows.length < 2 || (col.title < 0 && col.company < 0)) {
        toast('That file doesn’t look like a Jobfolio backup', { aboveSheet: true });
        return;
      }

      let added = 0;
      let updated = 0;
      const now = Date.now();
      for (const row of rows.slice(1)) {
        const get = (key) => (col[key] >= 0 ? (row[col[key]] || '').trim() : '');
        const job = {
          id: get('id') || uid(),
          title: get('title'),
          company: get('company'),
          location: get('location'),
          status: statusFromLabel(get('status')),
          applied: normaliseDate(get('applied')),
          closing: normaliseDate(get('closing')),
          link: normaliseLink(get('link')),
          coverLetter: /^(yes|y|true|1)$/i.test(get('coverLetter')),
          contact: get('contact'),
          notes: get('notes'),
          followedUp: normaliseDate(get('followedUp')),
          created: now,
          updated: now,
        };
        if (!job.title && !job.company) continue;
        const existing = jobs.findIndex((j) => j.id === job.id);
        if (existing >= 0) {
          job.created = jobs[existing].created || now;
          jobs[existing] = job;
          updated++;
        } else {
          jobs.push(job);
          added++;
        }
      }
      save();
      render();
      refreshBackupNote();
      const parts = [];
      if (added) parts.push(`${added} added`);
      if (updated) parts.push(`${updated} updated`);
      toast(parts.length ? `Restored: ${parts.join(', ')}` : 'No jobs found in that file', { aboveSheet: true });
    } catch {
      toast('Couldn’t read that file', { aboveSheet: true });
    }
  });

  // ---------- Page chrome ----------
  document.querySelectorAll('[data-icon]').forEach((el) => {
    el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon));
  });

  function refreshToday() {
    $('#todayLabel').textContent = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  const topbar = $('#topbar');
  const onScroll = () => topbar.classList.toggle('scrolled', window.scrollY > 48);
  window.addEventListener('scroll', onScroll, { passive: true });

  // When you come back to the app on a new day, refresh the reminders.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      refreshToday();
      render();
    }
  });

  // Ask the browser to keep our data even when storage is low.
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

  // Lets the app open offline once installed.
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  refreshToday();
  onScroll();
  render();
})();
