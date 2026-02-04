/**
 * 정적 HTML 렌더링 함수 (DOM 없이 문자열 반환)
 */

import { TOP50, TOP50_KR, TOP50_US, findStock, getByMarket } from '../data/top50.js';
import { SAMPLE_EVENTS, EVENT_LABELS, CONFIDENCE_LABELS, getEventsByTicker, getTopEvents, getEventById, countEventsByLabel, getEventsByPeriod } from '../data/events.js';

const SITE_URL = 'https://misodaily.web.app';
const BUILD_TIME = new Date('2026-02-04T15:00:00+09:00');

// ==================== Utilities ====================

export function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function formatRelTime(iso) {
  const d = new Date(iso);
  const diffMs = BUILD_TIME - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '방금';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}시간 전`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}일 전`;
}

export function isWithinHours(iso, hours) {
  const d = new Date(iso);
  const cutoff = new Date(BUILD_TIME.getTime() - hours * 60 * 60 * 1000);
  return d > cutoff;
}

export function formatDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
}

export function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' });
}

// ==================== Components ====================

export function renderConfidenceBadge(confidence) {
  const conf = CONFIDENCE_LABELS[confidence] || CONFIDENCE_LABELS.reported;
  return `<span class="confidence-badge" style="background:${conf.color}22;border-color:${conf.color}55;color:${conf.color}">${conf.label}</span>`;
}

export function renderEventCard(event, showTicker = true, isLink = true, hidden = false) {
  const stock = findStock(event.market, event.ticker);
  const stockName = stock ? stock.name_ko : event.ticker;
  const linkCount = event.links?.length || 0;
  const conf = CONFIDENCE_LABELS[event.confidence] || CONFIDENCE_LABELS.reported;

  const hiddenClass = hidden ? ' is-hidden' : '';
  const dataAttrs = [
    `data-type="${escapeHtml(event.type)}"`,
    `data-started-at="${escapeHtml(event.startedAt)}"`,
    `data-updated-at="${escapeHtml(event.updatedAt)}"`,
    `data-market="${escapeHtml(event.market)}"`,
    `data-ticker="${escapeHtml(event.ticker)}"`,
    `data-confidence="${escapeHtml(event.confidence || 'reported')}"`
  ].join(' ');

  const cardContent = `
    <div class="event-header">
      ${showTicker ? `
      <div class="event-ticker-info">
        <span class="event-ticker">${escapeHtml(event.ticker)}</span>
        <span class="event-company">${escapeHtml(stockName)}</span>
      </div>
      ` : ''}
      <div class="event-badges">
        <span class="confidence-badge" style="background:${conf.color}22;border-color:${conf.color}55;color:${conf.color}">${conf.label}</span>
        <span class="event-label" data-type="${event.type}">${EVENT_LABELS[event.type] || '기타'}</span>
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
          <span class="event-link-title">${escapeHtml(link.title)}</span>
          <span class="event-link-time">${formatRelTime(link.publishedAt)}</span>
        </a>
      `).join('')}
    </div>
    <div class="event-meta-row">
      <span class="event-time">발생: ${formatRelTime(event.startedAt)}</span>
      <span class="event-time">업데이트: ${formatRelTime(event.updatedAt)}</span>
      ${linkCount > 1 ? `<span class="event-bundle">동일 이슈 ${linkCount}건 묶음</span>` : ''}
    </div>
  `;

  if (isLink) {
    return `<a href="/stocks/${event.market}/${event.ticker}/events/${event.id}/" class="event-card${hiddenClass}" ${dataAttrs}>${cardContent}</a>`;
  }
  return `<div class="event-card${hiddenClass}" ${dataAttrs}>${cardContent}</div>`;
}

export function renderStockGrid(stocks) {
  return stocks.map(s => {
    const events = getEventsByTicker(s.market, s.ticker);
    const recent24h = getEventsByPeriod(events, 24).length;
    const recent7d = getEventsByPeriod(events, 24 * 7).length;
    const recent30d = getEventsByPeriod(events, 24 * 30).length;
    const badgeText = recent24h > 0
      ? `${recent24h}건 (24h)`
      : recent7d > 0
        ? `${recent7d}건 (7d)`
        : recent30d > 0
          ? `${recent30d}건 (30d)`
          : '';
    return `
      <a href="/stocks/${s.market}/${s.ticker}/" class="stock-item" data-market="${escapeHtml(s.market)}" data-ticker="${escapeHtml(s.ticker)}" data-name-ko="${escapeHtml(s.name_ko)}" data-name-en="${escapeHtml(s.name_en)}" data-count-24="${recent24h}" data-count-168="${recent7d}" data-count-720="${recent30d}">
        <div class="stock-ticker">${escapeHtml(s.ticker)}</div>
        <div class="stock-name">${escapeHtml(s.name_ko)}</div>
        <div class="stock-name-en">${escapeHtml(s.name_en)}</div>
        <div class="stock-badge ${recent24h > 0 ? 'hot' : ''}" data-badge ${badgeText ? '' : 'style="display:none;"'}>${badgeText}</div>
      </a>
    `;
  }).join('');
}

export function renderLabelFilters(events, activeLabel = 'all') {
  const counts = countEventsByLabel(events);
  const total = events.length;

  return `
    <div class="label-filters">
      <span class="label-pill ${activeLabel === 'all' ? 'active' : ''}" data-label="all">전체 <span class="pill-count">${total}</span></span>
      ${Object.entries(EVENT_LABELS).map(([k, v]) => {
        const count = counts[k] || 0;
        return `<span class="label-pill ${activeLabel === k ? 'active' : ''}" data-label="${k}">${v} <span class="pill-count">${count}</span></span>`;
      }).join('')}
    </div>
  `;
}

// ==================== Page Renderers ====================

export function renderHomePage(marketFilter = null) {
  let stocks = TOP50;
  let pageTitle = 'TOP50 종목 사건 아카이브';

  if (marketFilter === 'kr') {
    stocks = TOP50_KR;
    pageTitle = '국내 TOP25 종목';
  } else if (marketFilter === 'us') {
    stocks = TOP50_US;
    pageTitle = '미국 TOP25 종목';
  }

  const topEvents30d = getTopEvents(24 * 30, 30);
  const topEvents24h = topEvents30d.filter(e => isWithinHours(e.startedAt, 24));

  return `
    <section>
      <div class="section-header">
        <div>
          <h1 class="section-title">오늘의 주요 사건</h1>
          <div class="section-sub">최근 발생한 주요 이슈</div>
        </div>
      <div class="period-toggle" data-target="topEvents" data-scope="home">
        <button class="period-btn active" data-hours="24">24h</button>
        <button class="period-btn" data-hours="168">7d</button>
        <button class="period-btn" data-hours="720">30d</button>
      </div>
    </div>

      <div class="search-box">
        <input type="text" id="stockSearch" placeholder="티커 또는 회사명 검색 (예: 삼성전자, AAPL, Apple)" autocomplete="off" />
      </div>

      ${renderLabelFilters(topEvents24h)}

      <div class="event-cards" id="topEvents">
        ${topEvents30d.length > 0
          ? topEvents30d.map(e => renderEventCard(e, true, true, !isWithinHours(e.startedAt, 24))).join('')
          : '<div class="empty-state"><h2>최근 사건 없음</h2><p>최근 30일 내 등록된 사건이 없습니다.</p><a href="/top50/" class="related-link">전체 종목 보기</a></div>'
        }
      </div>
    </section>

    <section style="margin-top:32px;">
      <div class="section-header">
        <div>
          <h2 class="section-title">${pageTitle}</h2>
          <div class="section-sub">${stocks.length}개 종목</div>
        </div>
      </div>
      ${!marketFilter ? `
      <div class="tabs">
        <a href="/top50/" class="tab active" data-market="">전체</a>
        <a href="/top50/kr/" class="tab" data-market="kr">국내 25</a>
        <a href="/top50/us/" class="tab" data-market="us">미국 25</a>
      </div>
      ` : ''}
      <div class="stock-grid" id="stockGrid">
        ${renderStockGrid(stocks)}
      </div>
    </section>
  `;
}

export function renderStockPage(market, ticker) {
  const stock = findStock(market, ticker);
  if (!stock) {
    return renderNotFound();
  }

  const events = getEventsByTicker(market, ticker);
  const events24h = getEventsByPeriod(events, 24);
  const events7d = getEventsByPeriod(events, 24 * 7);
  const events30d = getEventsByPeriod(events, 24 * 30);

  // Dedupe links
  const allLinks = events.flatMap(e => e.links);
  const seenUrls = new Set();
  const uniqueLinks = allLinks.filter(l => {
    if (seenUrls.has(l.url)) return false;
    seenUrls.add(l.url);
    return true;
  }).slice(0, 10);

  const relatedStocks = (market === 'kr' ? TOP50_KR : TOP50_US)
    .filter(s => s.ticker !== ticker)
    .slice(0, 6);

  return `
    <nav class="breadcrumb">
      <a href="/top50/">홈</a>
      <span class="breadcrumb-sep">›</span>
      <a href="/top50/${market}/">${market === 'kr' ? '국내' : '미국'}</a>
      <span class="breadcrumb-sep">›</span>
      <span>${escapeHtml(stock.name_ko)}</span>
    </nav>

    <div class="stock-header">
      <div class="stock-header-main">
        <h1>${escapeHtml(stock.name_ko)}</h1>
        <span class="ticker">${escapeHtml(stock.ticker)}</span>
        <span class="exchange">${escapeHtml(stock.exchange)}</span>
      </div>
      <div class="stock-header-sub">${escapeHtml(stock.name_en)}</div>
    </div>

    <section>
      <div class="section-header">
        <div>
          <h2 class="section-title">최근 사건</h2>
          <div class="section-sub" id="eventCountLabel" data-count-24="${events24h.length}" data-count-168="${events7d.length}" data-count-720="${events30d.length}">${events24h.length}건 (24시간)</div>
        </div>
        <div class="period-toggle" data-target="stockEvents" data-scope="stock">
          <button class="period-btn active" data-hours="24">24h</button>
          <button class="period-btn" data-hours="168">7d</button>
          <button class="period-btn" data-hours="720">30d</button>
        </div>
      </div>
      <div class="event-cards" id="stockEvents">
        ${events.length > 0
          ? events.map(e => renderEventCard(e, false, true, !isWithinHours(e.startedAt, 24))).join('')
          : `<div class="empty-state"><h2>등록된 사건 없음</h2><p>이 종목에 대한 사건이 아직 없습니다.</p><a href="/top50/" class="related-link">홈으로 돌아가기</a></div>`
        }
      </div>
    </section>

    ${uniqueLinks.length > 0 ? `
    <section class="related-section">
      <h3 class="related-title">관련 원문 링크</h3>
      <div class="source-links">
        ${uniqueLinks.map(l => `
          <a href="${escapeHtml(l.url)}" target="_blank" rel="noopener" class="source-link">
            <span class="source-link-source">${escapeHtml(l.source)}</span>
            <span class="source-link-title">${escapeHtml(l.title)}</span>
            <span class="source-link-time">${formatRelTime(l.publishedAt)}</span>
          </a>
        `).join('')}
      </div>
    </section>
    ` : ''}

    <section class="related-section">
      <h3 class="related-title">관련 종목</h3>
      <div class="related-links">
        ${relatedStocks.map(s => `<a href="/stocks/${s.market}/${s.ticker}/" class="related-link">${escapeHtml(s.name_ko)}</a>`).join('')}
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

  const relatedEvents = getEventsByTicker(market, ticker)
    .filter(e => e.id !== eventId)
    .slice(0, 3);

  const relatedStocks = (market === 'kr' ? TOP50_KR : TOP50_US)
    .filter(s => s.ticker !== ticker)
    .slice(0, 5);

  const conf = CONFIDENCE_LABELS[event.confidence] || CONFIDENCE_LABELS.reported;

  return `
    <nav class="breadcrumb">
      <a href="/top50/">홈</a>
      <span class="breadcrumb-sep">›</span>
      <a href="/top50/${market}/">${market === 'kr' ? '국내' : '미국'}</a>
      <span class="breadcrumb-sep">›</span>
      <a href="/stocks/${market}/${ticker}/">${escapeHtml(stock.name_ko)}</a>
      <span class="breadcrumb-sep">›</span>
      <span>사건 상세</span>
    </nav>

    <article class="event-detail-header">
      <div class="event-detail-badges">
        <span class="confidence-badge" style="background:${conf.color}22;border-color:${conf.color}55;color:${conf.color}">${conf.label}</span>
        <span class="event-label" data-type="${event.type}">${EVENT_LABELS[event.type] || '기타'}</span>
      </div>
      <h1>${event.summary2.map(s => escapeHtml(s)).join('<br>')}</h1>
      <div class="event-detail-meta">
        <a href="/stocks/${market}/${ticker}/" class="event-detail-stock">
          ${escapeHtml(stock.ticker)} ${escapeHtml(stock.name_ko)}
        </a>
        <span class="meta-sep">·</span>
        <span>발생: ${formatDateTime(event.startedAt)}</span>
        <span class="meta-sep">·</span>
        <span>업데이트: ${formatDateTime(event.updatedAt)}</span>
      </div>
    </article>

    <section class="event-detail-why">
      <h2>왜 중요한가?</h2>
      <p>${escapeHtml(event.why)}</p>
    </section>

    <section class="event-detail-sources">
      <h2>근거 링크</h2>
      <div class="source-links">
        ${event.links.map(l => `
          <a href="${escapeHtml(l.url)}" target="_blank" rel="noopener" class="source-link">
            <span class="source-link-source">${escapeHtml(l.source)}</span>
            <span class="source-link-title">${escapeHtml(l.title)}</span>
            <span class="source-link-time">${formatDateTime(l.publishedAt)}</span>
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
        ${relatedStocks.map(s => `<a href="/stocks/${s.market}/${s.ticker}/" class="related-link">${escapeHtml(s.name_ko)}</a>`).join('')}
      </div>
    </section>
  `;
}

export function renderNotFound() {
  return `
    <div class="empty-state">
      <h2>페이지를 찾을 수 없습니다</h2>
      <p>요청하신 페이지가 존재하지 않거나 삭제되었습니다.</p>
      <a href="/top50/" class="related-link" style="display:inline-block;margin-top:16px;">홈으로 돌아가기</a>
    </div>
  `;
}

// ==================== JSON-LD ====================

export function generateEventJsonLd(event, stock) {
  const conf = CONFIDENCE_LABELS[event.confidence] || CONFIDENCE_LABELS.reported;
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": event.summary2[0],
    "description": event.summary2.join(' ') + ' ' + event.why,
    "datePublished": event.startedAt,
    "dateModified": event.updatedAt,
    "url": `${SITE_URL}/stocks/${event.market}/${event.ticker}/events/${event.id}/`,
    "publisher": {
      "@type": "Organization",
      "name": "miso_daily"
    },
    "inLanguage": event.market === 'kr' ? 'ko' : 'en',
    "about": {
      "@type": "Corporation",
      "name": stock.name_en,
      "tickerSymbol": stock.ticker
    }
  };
}
