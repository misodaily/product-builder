// src/render/render.js
import { TOP50_KR, TOP50_US, TOP50 } from '../../data/top50.js';
import { EVENT_LABELS, SAMPLE_EVENTS } from '../../data/events.js';

// ==================== Utilities ====================
export function findStock(market, ticker) {
  return TOP50.find(s => s.market === market && s.ticker === ticker);
}

export function getEventsByTicker(market, ticker) {
  return SAMPLE_EVENTS.filter(e => e.market === market && e.ticker === ticker)
    .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
}

export function getEventsByTimeframe(timeframe = '24h', limit = -1) {
  const now = new Date();
  let cutoff;
  if (timeframe === '7d') {
    cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (timeframe === '30d') {
    cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else { // default '24h'
    cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  const events = SAMPLE_EVENTS
    .filter(e => new Date(e.startedAt) > cutoff)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  return limit > 0 ? events.slice(0, limit) : events;
}

export function getEventById(id) {
  return SAMPLE_EVENTS.find(e => e.id === id);
}

export function formatRelTime(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '방금';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}시간 전`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}일 전`;
}

export function formatDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
}

export function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' });
}

export function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ==================== Renderers ====================
export function renderConfidenceBadge(confidence) {
  let colorClass = '';
  let label = '';
  switch (confidence) {
    case 'confirmed':
      colorClass = 'confirmed';
      label = '확정';
      break;
    case 'speculative':
      colorClass = 'speculative';
      label = '관측';
      break;
    case 'reported':
    default:
      colorClass = 'reported';
      label = '보도';
      break;
  }
  return `<span class="confidence-badge ${colorClass}">${label}</span>`;
}


export function renderStockGrid(stocks, showBadge = false, timeframe = '24h') {
  return stocks.map(s => {
    const events = getEventsByTicker(s.market, s.ticker);
    let recentEventCount = 0;
    if (timeframe === '7d') {
      recentEventCount = events.filter(e => new Date(e.startedAt) > new Date(Date.now() - 7*24*60*60*1000)).length;
    } else if (timeframe === '30d') {
      recentEventCount = events.filter(e => new Date(e.startedAt) > new Date(Date.now() - 30*24*60*60*1000)).length;
    } else { // default '24h'
      recentEventCount = events.filter(e => new Date(e.startedAt) > new Date(Date.now() - 24*24*60*60*1000)).length;
    }

    return `
      <a href="/stocks/${s.market}/${s.ticker}" class="stock-item">
        <div class="stock-ticker">${escapeHtml(s.ticker)}</div>
        <div class="stock-name">${escapeHtml(s.name_ko)}</div>
        ${showBadge && recentEventCount > 0 ? `<div class="stock-badge">${recentEventCount}건 사건</div>` : ''}
      </a>
    `;
  }).join('');
}

export function renderEventCard(event, showTicker = true) {
  const stock = findStock(event.market, event.ticker);
  const stockName = stock ? stock.name_ko : event.ticker;

  return `
    <a href="/stocks/${event.market}/${event.ticker}/events/${event.id}" class="event-card">
      <div class="event-header">
        ${showTicker ? `
        <div class="event-ticker-info">
          <span class="event-ticker">${escapeHtml(event.ticker)}</span>
          <span class="event-company">${escapeHtml(stockName)}</span>
        </div>
        ` : ''}
        <div class="event-labels-group">
          <span class="event-label" data-type="${event.type}">${EVENT_LABELS[event.type] || '기타'}</span>
          ${event.confidence ? renderConfidenceBadge(event.confidence) : ''}
        </div>
      </div>
      <ul class="event-summary">
        ${event.summary2.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
      </ul>
      <div class="event-why">
        <strong>왜 중요?</strong> ${escapeHtml(event.why)}
      </div>
      <div class="event-links">
        ${event.links.slice(0, 3).map(link => `
          <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener" class="event-link">
            <span class="event-link-source">${escapeHtml(link.source)}</span>
            ${escapeHtml(link.title)}
            <span class="event-link-time">${formatRelTime(link.publishedAt)}</span>
          </a>
        `).join('')}
      </div>
      <div class="event-time">
        <span>발생: ${formatRelTime(event.startedAt)}</span> ·
        <span>업데이트: ${formatRelTime(event.updatedAt)}</span>
      </div>
    </a>
  `;
}

export function renderHomePage(params = {}) {
  const { marketFilter, timeframe = '24h' } = params;
  let stocks = TOP50;
  let pageTitle = 'TOP50 종목 사건 아카이브';

  if (marketFilter === 'kr') {
    stocks = TOP50_KR;
    pageTitle = '국내 TOP25 종목';
  } else if (marketFilter === 'us') {
    stocks = TOP50_US;
    pageTitle = '미국 TOP25 종목';
  }

  const topEvents = getEventsByTimeframe(timeframe);

  const eventCounts = {};
  topEvents.forEach(event => {
    eventCounts[event.type] = (eventCounts[event.type] || 0) + 1;
  });

  return `
    <section>
      <div class="section-header">
        <div>
          <h1 class="section-title">오늘의 주요 사건</h1>
          <div class="section-sub">최근 ${timeframe === '24h' ? '24시간' : timeframe === '7d' ? '7일' : '30일'} 내 발생한 주요 이슈</div>
        </div>
        <div class="timeframe-toggle">
          <span class="timeframe-pill ${timeframe === '24h' ? 'active' : ''}" data-timeframe="24h">24h</span>
          <span class="timeframe-pill ${timeframe === '7d' ? 'active' : ''}" data-timeframe="7d">7d</span>
          <span class="timeframe-pill ${timeframe === '30d' ? 'active' : ''}" data-timeframe="30d">30d</span>
        </div>
      </div>
      <div class="label-filters">
        <span class="label-pill active" data-label="all">전체</span>
        ${Object.entries(EVENT_LABELS).map(([k, v]) => `
          <span class="label-pill" data-label="${k}">${v} ${eventCounts[k] ? `(${eventCounts[k]})` : ''}</span>
        `).join('')}
      </div>
      <div class="event-cards" id="topEvents">
        ${topEvents.length > 0
          ? topEvents.map(e => renderEventCard(e, true)).join('')
          : '<div class="empty-state"><h2>최근 사건 없음</h2><p>최근 24시간 내 등록된 사건이 없습니다.</p></div>'
        }
      </div>
    </section>

    <section style="margin-top:32px;">
      <div class="section-header">
        <div>
          <h2 class="section-title">${marketFilter ? pageTitle : 'TOP50 종목'}</h2>
          <div class="section-sub">${stocks.length}개 종목</div>
        </div>
      </div>
      ${!marketFilter ? `
      <div class="tabs">
        <span class="tab active" data-market="">전체</span>
        <span class="tab" data-market="kr">국내 25</span>
        <span class="tab" data-market="us">미국 25</span>
      </div>
      ` : ''}
      <div class="stock-grid" id="stockGrid">
        ${renderStockGrid(stocks, true, timeframe)}
      </div>
    </section>
  `;
}

export function renderStockPage(market, ticker, timeframe = '24h') {
  const stock = findStock(market, ticker);
  if (!stock) {
    return renderNotFound();
  }

  const events = getEventsByTicker(market, ticker);
  let filteredEvents;
  if (timeframe === '7d') {
    filteredEvents = events.filter(e => new Date(e.startedAt) > new Date(Date.now() - 7*24*60*60*1000));
  } else if (timeframe === '30d') {
    filteredEvents = events.filter(e => new Date(e.startedAt) > new Date(Date.now() - 30*24*60*60*1000));
  } else { // default '24h'
    filteredEvents = events.filter(e => new Date(e.startedAt) > new Date(Date.now() - 24*24*60*60*1000));
  }

  // Dedupe links
  const allLinks = events.flatMap(e => e.links);
  const seenUrls = new Set();
  const uniqueLinks = allLinks.filter(l => {
    if (seenUrls.has(l.url)) return false;
    seenUrls.add(l.url);
    return true;
  }).slice(0, 10);

  return `
    <nav class="breadcrumb">
      <a href="/top50">홈</a>
      <span class="breadcrumb-sep">›</span>
      <a href="/top50?market=${market}">${market === 'kr' ? '국내' : '미국'}</a>
      <span class="breadcrumb-sep">›</span>
      <span>${escapeHtml(stock.name_ko)}</span>
    </nav>

    <div class="stock-header">
      <div class="stock-header-main">
        <h1>${escapeHtml(stock.name_ko)}</h1>
        <span class="ticker">${escapeHtml(stock.ticker)}</span>
        <span class="exchange">${escapeHtml(stock.exchange)}</span>
      </div>
    </div>

    <section>
      <div class="section-header">
        <div>
          <h2 class="section-title">최근 ${timeframe === '24h' ? '24시간' : timeframe === '7d' ? '7일' : '30일'} 사건</h2>
          <div class="section-sub">${filteredEvents.length}건</div>
        </div>
        <div class="timeframe-toggle">
          <span class="timeframe-pill ${timeframe === '24h' ? 'active' : ''}" data-timeframe="24h">24h</span>
          <span class="timeframe-pill ${timeframe === '7d' ? 'active' : ''}" data-timeframe="7d">7d</span>
          <span class="timeframe-pill ${timeframe === '30d' ? 'active' : ''}" data-timeframe="30d">30d</span>
        </div>
      </div>
      <div class="event-cards">
        ${filteredEvents.length > 0
          ? filteredEvents.slice(0, 5).map(e => renderEventCard(e, false)).join('')
          : '<div class="empty-state"><p>최근 해당 기간 내 등록된 사건이 없습니다.</p><a href="/top50" class="related-link">홈으로 돌아가기</a></div>'
        }
      </div>
    </section>

    ${uniqueLinks.length > 0 ? `
    <section class="related-section">
      <h3 class="related-title">관련 원문 링크</h3>
      <div class="event-links" style="gap:8px;">
        ${uniqueLinks.map(l => `
          <a href="${escapeHtml(l.url)}" target="_blank" rel="noopener" class="event-link" style="padding:8px 12px;background:rgba(0,0,0,.2);border-radius:8px;">
            <span class="event-link-source">${escapeHtml(l.source)}</span>
            ${escapeHtml(l.title)}
            <span class="event-link-time">${formatRelTime(l.publishedAt)}</span>
          </a>
        `).join('')}
      </div>
    </section>
    ` : ''}

    <section class="related-section">
      <h3 class="related-title">관련 종목</h3>
      <div class="related-links">
        ${(market === 'kr' ? TOP50_KR : TOP50_US)
          .filter(s => s.ticker !== ticker)
          .slice(0, 6)
          .map(s => `<a href="/stocks/${s.market}/${s.ticker}" class="related-link">${escapeHtml(s.name_ko)}</a>`)
          .join('')}
      </div>
    </section>
  `;
}

export function renderEventPage(market, ticker, eventId) {
  const event = getEventById(eventId);
  const stock = findStock(market, ticker);

  if (!event || !stock) {
    return renderNotFound();
  }

  const dateStr = formatDate(event.startedAt);
  const title = `${stock.name_ko} ${event.summary2[0]} (${dateStr})`;

  // Related events (same ticker, different event)
  const relatedEvents = getEventsByTicker(market, ticker)
    .filter(e => e.id !== eventId)
    .slice(0, 3);

  // Related stocks (same market)
  const relatedStocks = (market === 'kr' ? TOP50_KR : TOP50_US)
    .filter(s => s.ticker !== ticker)
    .slice(0, 5);

  // JSON-LD for Article/NewsArticle
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": event.summary2[0],
    "image": "https://example.com/og.png", // Placeholder, will be replaced by build script
    "datePublished": event.startedAt,
    "dateModified": event.updatedAt,
    "author": {
      "@type": "Organization",
      "name": "miso_daily"
    },
    "publisher": {
      "@type": "Organization",
      "name": "miso_daily",
      "logo": {
        "@type": "ImageObject",
        "url": "https://example.com/og.png" // Placeholder
      }
    },
    "description": event.summary2.join(' '),
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://example.com/stocks/${market}/${ticker}/events/${eventId}` // Placeholder
    },
    "url": `https://example.com/stocks/${market}/${ticker}/events/${eventId}`, // Placeholder
    "inLanguage": "ko-KR"
  });

  return `
    <script type="application/ld+json">${jsonLd}</script>
    <nav class="breadcrumb">
      <a href="/top50">홈</a>
      <span class="breadcrumb-sep">›</span>
      <a href="/top50?market=${market}">${market === 'kr' ? '국내' : '미국'}</a>
      <span class="breadcrumb-sep">›</span>
      <a href="/stocks/${market}/${ticker}">${escapeHtml(stock.name_ko)}</a>
      <span class="breadcrumb-sep">›</span>
      <span>사건 상세</span>
    </nav>

    <article class="event-detail-header">
      <div class="event-labels-group" style="margin-bottom:12px;display:inline-flex;gap:8px;">
        <span class="event-label" data-type="${event.type}">${EVENT_LABELS[event.type] || '기타'}</span>
        ${event.confidence ? renderConfidenceBadge(event.confidence) : ''}
      </div>
      <h1>${event.summary2.map(s => escapeHtml(s)).join('<br>')}</h1>
      <div class="event-detail-meta">
        <a href="/stocks/${market}/${ticker}" style="color:var(--accent2);font-weight:600;">
          ${escapeHtml(stock.ticker)} ${escapeHtml(stock.name_ko)}
        </a>
        <span>·</span>
        <span>발생: ${formatDateTime(event.startedAt)}</span>
        <span>·</span>
        <span>업데이트: ${formatDateTime(event.updatedAt)}</span>
      </div>
    </article>

    <section style="margin-bottom:24px;">
      <div class="event-why" style="font-size:15px;padding:16px;">
        <strong>왜 중요한가?</strong><br>
        ${escapeHtml(event.why)}
      </div>
    </section>

    <section>
      <h2 class="section-title" style="font-size:16px;margin-bottom:12px;">근거 링크</h2>
      <div class="event-links" style="gap:10px;">
        ${event.links.map(l => `
          <a href="${escapeHtml(l.url)}" target="_blank" rel="noopener" class="event-link" style="padding:12px 14px;background:rgba(0,0,0,.25);border-radius:10px;border:1px solid var(--line);">
            <span class="event-link-source">${escapeHtml(l.source)}</span>
            <span style="flex:1;">${escapeHtml(l.title)}</span>
            <span class="event-link-time">${formatDateTime(l.publishedAt)}</span>
          </a>
        `).join('')}
      </div>
    </section>

    ${relatedEvents.length > 0 ? `
    <section class="related-section">
      <h3 class="related-title">이 종목의 다른 사건</h3>
      <div class="event-cards">
        ${relatedEvents.map(e => renderEventCard(e, false)).join('')}
      </div>
    </section>
    ` : ''}

    <section class="related-section">
      <h3 class="related-title">관련 종목</h3>
      <div class="related-links">
        ${(market === 'kr' ? TOP50_KR : TOP50_US)
          .filter(s => s.ticker !== ticker)
          .slice(0, 6)
          .map(s => `<a href="/stocks/${s.market}/${s.ticker}" class="related-link">${escapeHtml(s.name_ko)}</a>`)
          .join('')}
      </div>
    </section>
  `;
}

export function renderNotFound() {
  return `
    <div class="empty-state">
      <h2>페이지를 찾을 수 없습니다</h2>
      <p>요청하신 페이지가 존재하지 않거나 삭제되었습니다.</p>
      <a href="/top50" class="related-link" style="display:inline-block;margin-top:16px;">홈으로 돌아가기</a>
    </div>
  `;
}