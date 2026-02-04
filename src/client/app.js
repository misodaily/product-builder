// src/client/app.js
import { TOP50_KR, TOP50_US, TOP50 } from '../data/top50.js';
import { EVENT_LABELS, SAMPLE_EVENTS } from '../data/events.js';
import {
  findStock, getEventsByTicker, getEventsByTimeframe, getEventById,
  formatRelTime, formatDateTime, formatDate, escapeHtml,
  renderStockGrid, renderEventCard, renderHomePage, renderStockPage, renderEventPage, renderNotFound, renderConfidenceBadge
} from '../render/render.js';

// ==================== Utilities (Client-side specific) ====================
// For client-side SPA navigation, meta tags are dynamically updated.
function updateClientMeta(opts) {
  const { title, description, canonical, ogImage } = opts;
  document.title = title;
  document.querySelector('meta[name="description"]').content = description;
  document.querySelector('meta[property="og:title"]').content = title;
  document.querySelector('meta[property="og:description"]').content = description;
  document.querySelector('meta[property="og:url"]').content = canonical;
  document.querySelector('meta[property="og:image"]').content = window.location.origin + ogImage;
  document.querySelector('meta[name="twitter:card"]').content = "summary_large_image";
  document.querySelector('meta[name="twitter:title"]').content = title;
  document.querySelector('meta[name="twitter:description"]').content = description;
  document.querySelector('meta[name="twitter:image"]').content = window.location.origin + ogImage;
  document.getElementById('canonical').href = canonical;
}

// ==================== Router ====================
const app = document.getElementById('app');

function parseRoute() {
  const path = window.location.pathname;
  const query = Object.fromEntries(new URLSearchParams(window.location.search));

  if (path === '/top50' || path === '/' || path === '') {
    return { page: 'home', query };
  }

  const eventMatch = path.match(/^\/stocks\/([^/]+)\/([^/]+)\/events\/(.+)$/);
  if (eventMatch) {
    return { page: 'event', market: eventMatch[1], ticker: eventMatch[2], eventId: eventMatch[3], query };
  }

  const stockMatch = path.match(/^\/stocks\/([^/]+)\/([^/]+)$/);
  if (stockMatch) {
    return { page: 'stock', market: stockMatch[1], ticker: stockMatch[2], query };
  }

  return { page: '404', query };
}

function renderClientSide() {
  const route = parseRoute();
  let content = '';
  let pageTitle = '';
  let pageDescription = '';
  let pageCanonical = '';
  let ogImage = '/og.png'; // Default OG image

  switch (route.page) {
    case 'home': {
      const marketFilter = route.query.market;
      const timeframe = route.query.timeframe || '24h';
      let currentStocks = TOP50;
      let currentTitle = 'TOP50 종목 사건 아카이브';

      if (marketFilter === 'kr') {
        currentStocks = TOP50_KR;
        currentTitle = '국내 TOP25 종목';
      } else if (marketFilter === 'us') {
        currentStocks = TOP50_US;
        currentTitle = '미국 TOP25 종목';
      }
      content = renderHomePage({ marketFilter, timeframe });
      pageTitle = `${currentTitle} | miso_daily`;
      pageDescription = '국내외 TOP50 종목의 주요 사건을 실시간으로 정리합니다. 실적, 수주, 규제, 소송 등 투자에 중요한 이슈를 사건 단위로 확인하세요.';
      pageCanonical = window.location.origin + (window.location.pathname === '/' ? '/top50' : window.location.pathname) + window.location.search;
      break;
    }
    case 'stock': {
      const { market, ticker } = route;
      const timeframe = route.query.timeframe || '24h';
      const stock = findStock(market, ticker);
      if (stock) {
        content = renderStockPage(market, ticker, timeframe);
        pageTitle = `${stock.name_ko} (${stock.ticker}) 사건 아카이브 | miso_daily`;
        pageDescription = `${stock.name_ko}의 최근 주요 사건을 확인하세요. 실적, 수주, 규제 등 투자에 중요한 이슈를 사건 단위로 정리합니다.`;
        pageCanonical = `${window.location.origin}/stocks/${market}/${ticker}`;
      } else {
        content = renderNotFound();
        pageTitle = '페이지를 찾을 수 없습니다 | miso_daily';
        pageDescription = '요청하신 페이지를 찾을 수 없습니다.';
        pageCanonical = window.location.href;
      }
      break;
    }
    case 'event': {
      const { market, ticker, eventId } = route;
      const event = getEventById(eventId);
      const stock = findStock(market, ticker);
      if (event && stock) {
        content = renderEventPage(market, ticker, eventId);
        const dateStr = formatDate(event.startedAt);
        pageTitle = `${stock.name_ko} ${event.summary2[0]} (${dateStr}) | miso_daily`;
        pageDescription = `${event.summary2.join(' ')} ${event.why}`;
        pageCanonical = `${window.location.origin}/stocks/${market}/${ticker}/events/${eventId}`;
      } else {
        content = renderNotFound();
        pageTitle = '페이지를 찾을 수 없습니다 | miso_daily';
        pageDescription = '요청하신 페이지를 찾을 수 없습니다.';
        pageCanonical = window.location.href;
      }
      break;
    }
    default:
      content = renderNotFound();
      pageTitle = '페이지를 찾을 수 없습니다 | miso_daily';
      pageDescription = '요청하신 페이지를 찾을 수 없습니다.';
      pageCanonical = window.location.href;
  }

  app.innerHTML = content;
  updateClientMeta({ title: pageTitle, description: pageDescription, canonical: pageCanonical, ogImage });
  bindEvents(); // Rebind events after content changes
  window.scrollTo(0, 0);
}

function navigate(href, replace = false) {
  if (replace) {
    window.history.replaceState({}, '', href);
  } else {
    window.history.pushState({}, '', href);
  }
  renderClientSide();
}

function bindEvents() {
  // Tab clicks
  document.querySelectorAll('.tab').forEach(tab => {
    tab.onclick = () => { // Use onclick for simplicity, or add/remove event listeners properly
      const market = tab.dataset.market;
      const url = market ? `/top50?market=${market}` : '/top50';
      navigate(url);
    };
  });

  // Label filter clicks
  document.querySelectorAll('.label-pill').forEach(pill => {
    pill.onclick = () => {
      document.querySelectorAll('.label-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const activeLabel = pill.dataset.label;

      const currentRoute = parseRoute();
      const timeframe = currentRoute.query.timeframe || '24h';
      
      const allEvents = getEventsByTimeframe(timeframe);
      const filtered = activeLabel === 'all'
        ? allEvents
        : allEvents.filter(e => e.type === activeLabel);

      const container = document.getElementById('topEvents');
      if (container) {
        if (filtered.length > 0) {
          container.innerHTML = filtered.map(e => renderEventCard(e, true)).join('');
        } else {
          container.innerHTML = '<div class="empty-state"><h2>해당 라벨의 사건 없음</h2><p>최근 해당 기간 내 등록된 사건이 없습니다.</p></div>';
        }
      }
    };
  });

  // Timeframe toggle clicks
  document.querySelectorAll('.timeframe-pill').forEach(pill => {
    pill.onclick = () => {
      document.querySelectorAll('.timeframe-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const newTimeframe = pill.dataset.timeframe;

      const currentRoute = parseRoute();
      currentRoute.query.timeframe = newTimeframe;
      const newUrl = window.location.pathname + '?' + new URLSearchParams(currentRoute.query).toString();
      navigate(newUrl);
    };
  });

  // Search input (placeholder for now)
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.oninput = (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const stocksToFilter = TOP50; // Or based on market filter

      const filteredStocks = stocksToFilter.filter(s =>
        s.ticker.toLowerCase().includes(searchTerm) ||
        s.name_ko.toLowerCase().includes(searchTerm) ||
        s.name_en.toLowerCase().includes(searchTerm)
      );
      
      const stockGrid = document.getElementById('stockGrid');
      if (stockGrid) {
        stockGrid.innerHTML = renderStockGrid(filteredStocks, true, parseRoute().query.timeframe || '24h');
      }
    };
  }
}

// ==================== Link Interception ====================
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href]');
  if (!link) return;

  const href = link.getAttribute('href');

  // Skip external links, new tabs, special links
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

// ==================== Init ====================
window.addEventListener('popstate', renderClientSide);
document.getElementById('year').textContent = new Date().getFullYear();

// Initial render or redirect
if (window.location.pathname === '/' || window.location.pathname === '') {
  navigate('/top50', true);
} else {
  renderClientSide();
}