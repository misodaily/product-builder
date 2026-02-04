const HOURS_IN_MS = 60 * 60 * 1000;

function parseISO(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isWithinHours(iso, hours) {
  const d = parseISO(iso);
  if (!d) return false;
  return Date.now() - d.getTime() <= hours * HOURS_IN_MS;
}

function setActiveNav(pathname) {
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => link.classList.remove('active'));
  if (pathname.startsWith('/top50/kr')) {
    document.querySelector('[data-nav="kr"]')?.classList.add('active');
    return;
  }
  if (pathname.startsWith('/top50/us')) {
    document.querySelector('[data-nav="us"]')?.classList.add('active');
    return;
  }
  document.querySelector('[data-nav="home"]')?.classList.add('active');
}

function updateStockBadges(hours) {
  document.querySelectorAll('.stock-item').forEach(item => {
    const badge = item.querySelector('[data-badge]');
    if (!badge) return;
    const key = hours === 24 ? 'count24' : hours === 168 ? 'count168' : 'count720';
    const count = Number(item.dataset[key] || 0);
    if (count > 0) {
      badge.textContent = `${count}건 (${hours === 24 ? '24h' : hours === 168 ? '7d' : '30d'})`;
      badge.style.display = 'inline-block';
      badge.classList.toggle('hot', hours === 24);
    } else {
      badge.style.display = 'none';
      badge.classList.remove('hot');
    }
  });
}

function updateLabelCounts(container, hours) {
  const counts = {};
  let total = 0;
  container.querySelectorAll('.event-card').forEach(card => {
    const startedAt = card.dataset.startedAt;
    if (!isWithinHours(startedAt, hours)) return;
    total += 1;
    const type = card.dataset.type || 'other';
    counts[type] = (counts[type] || 0) + 1;
  });

  document.querySelectorAll('.label-pill').forEach(pill => {
    const label = pill.dataset.label;
    const countEl = pill.querySelector('.pill-count');
    if (!countEl) return;
    if (label === 'all') {
      countEl.textContent = total;
    } else {
      countEl.textContent = counts[label] || 0;
    }
  });
}

function filterEventCards(container, hours, activeLabel) {
  let visibleCount = 0;
  container.querySelectorAll('.event-card').forEach(card => {
    const within = isWithinHours(card.dataset.startedAt, hours);
    const matchesLabel = activeLabel === 'all' || card.dataset.type === activeLabel;
    if (within && matchesLabel) {
      card.classList.remove('is-hidden');
      visibleCount += 1;
    } else {
      card.classList.add('is-hidden');
    }
  });

  let empty = container.querySelector('.empty-state');
  if (visibleCount === 0) {
    if (!empty) {
      empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = '<h2>해당 기간의 사건 없음</h2><p>선택한 기간에 해당하는 사건이 없습니다.</p><a href="/top50/" class="related-link">전체 종목 보기</a>';
      container.appendChild(empty);
    }
  } else if (empty) {
    empty.remove();
  }
}

function initHome() {
  const searchInput = document.getElementById('stockSearch');
  const stockGrid = document.getElementById('stockGrid');
  const eventContainer = document.getElementById('topEvents');
  const periodToggle = document.querySelector('.period-toggle[data-scope="home"]');

  if (searchInput && stockGrid) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();
      stockGrid.querySelectorAll('.stock-item').forEach(item => {
        const text = `${item.dataset.ticker} ${item.dataset.nameKo} ${item.dataset.nameEn}`.toLowerCase();
        item.style.display = text.includes(q) ? '' : 'none';
      });
    });
  }

  let activeLabel = 'all';

  document.querySelectorAll('.label-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.label-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeLabel = pill.dataset.label || 'all';
      if (eventContainer && periodToggle) {
        const hours = Number(periodToggle.querySelector('.period-btn.active')?.dataset.hours || 24);
        filterEventCards(eventContainer, hours, activeLabel);
      }
    });
  });

  if (periodToggle && eventContainer) {
    periodToggle.addEventListener('click', (e) => {
      const btn = e.target.closest('.period-btn');
      if (!btn) return;
      periodToggle.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const hours = Number(btn.dataset.hours || 24);
      filterEventCards(eventContainer, hours, activeLabel);
      updateLabelCounts(eventContainer, hours);
      updateStockBadges(hours);
    });
  }

  if (eventContainer && periodToggle) {
    const hours = Number(periodToggle.querySelector('.period-btn.active')?.dataset.hours || 24);
    filterEventCards(eventContainer, hours, activeLabel);
    updateLabelCounts(eventContainer, hours);
    updateStockBadges(hours);
  }
}

function initStock() {
  const eventContainer = document.getElementById('stockEvents');
  const periodToggle = document.querySelector('.period-toggle[data-scope="stock"]');
  const countLabel = document.getElementById('eventCountLabel');

  if (!eventContainer || !periodToggle) return;

  const updateCountLabel = (hours) => {
    if (!countLabel) return;
    const key = hours === 24 ? 'count24' : hours === 168 ? 'count168' : 'count720';
    const count = Number(countLabel.dataset[key] || 0);
    countLabel.textContent = `${count}건 (${hours === 24 ? '24시간' : hours === 168 ? '7일' : '30일'})`;
  };

  periodToggle.addEventListener('click', (e) => {
    const btn = e.target.closest('.period-btn');
    if (!btn) return;
    periodToggle.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const hours = Number(btn.dataset.hours || 24);
    filterEventCards(eventContainer, hours, 'all');
    updateCountLabel(hours);
  });

  const hours = Number(periodToggle.querySelector('.period-btn.active')?.dataset.hours || 24);
  filterEventCards(eventContainer, hours, 'all');
  updateCountLabel(hours);
}

function initYear() {
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
}

async function navigate(href, replace = false) {
  const url = new URL(href, window.location.origin);
  try {
    const res = await fetch(url.pathname + url.search);
    if (!res.ok) throw new Error('Failed to load');
    const html = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const newApp = doc.getElementById('app');
    const currentApp = document.getElementById('app');
    if (newApp && currentApp) {
      currentApp.innerHTML = newApp.innerHTML;
    }

    document.title = doc.title;
    const metaNames = ['description', 'twitter:title', 'twitter:description', 'twitter:image'];
    metaNames.forEach(name => {
      const fresh = doc.querySelector(`meta[name="${name}"]`);
      const current = document.querySelector(`meta[name="${name}"]`);
      if (fresh && current) current.setAttribute('content', fresh.getAttribute('content') || '');
    });
    const metaProps = ['og:title', 'og:description', 'og:url', 'og:image', 'og:type'];
    metaProps.forEach(prop => {
      const fresh = doc.querySelector(`meta[property="${prop}"]`);
      const current = document.querySelector(`meta[property="${prop}"]`);
      if (fresh && current) current.setAttribute('content', fresh.getAttribute('content') || '');
    });
    const canonical = doc.querySelector('link[rel="canonical"]');
    const currentCanonical = document.querySelector('link[rel="canonical"]');
    if (canonical && currentCanonical) {
      currentCanonical.setAttribute('href', canonical.getAttribute('href') || '');
    }

    const newJsonLd = doc.getElementById('jsonld');
    const currentJsonLd = document.getElementById('jsonld');
    if (newJsonLd) {
      if (currentJsonLd) {
        currentJsonLd.textContent = newJsonLd.textContent || '';
      } else {
        document.body.insertBefore(newJsonLd, document.querySelector('script[type="module"]'));
      }
    } else if (currentJsonLd) {
      currentJsonLd.remove();
    }

    if (replace) {
      window.history.replaceState({}, '', url.pathname + url.search);
    } else {
      window.history.pushState({}, '', url.pathname + url.search);
    }
    window.scrollTo(0, 0);
    setActiveNav(url.pathname);
    initYear();
    initHome();
    initStock();
  } catch {
    window.location.href = href;
  }
}

function interceptLinks() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href) return;
    if (
      link.target === '_blank' ||
      link.hasAttribute('download') ||
      href.startsWith('http') ||
      href.startsWith('//') ||
      href.startsWith('#') ||
      href.startsWith('mailto:') ||
      e.ctrlKey || e.metaKey || e.shiftKey
    ) {
      return;
    }
    e.preventDefault();
    navigate(href);
  });
}

window.addEventListener('popstate', () => {
  navigate(window.location.pathname + window.location.search, true);
});

setActiveNav(window.location.pathname);
initYear();
initHome();
initStock();
interceptLinks();
