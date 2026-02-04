/**
 * 클라이언트 사이드 라우터 (SPA용)
 * History API 기반
 */

class Router {
  constructor() {
    this.routes = [];
    this.notFoundHandler = null;
    this.beforeEach = null;
    this.afterEach = null;
  }

  /**
   * 라우트 등록
   * @param {string} pattern - URL 패턴 (예: '/stocks/:market/:ticker')
   * @param {Function} handler - 핸들러 함수
   */
  on(pattern, handler) {
    const paramNames = [];
    const regexPattern = pattern
      .replace(/:([^/]+)/g, (_, name) => {
        paramNames.push(name);
        return '([^/]+)';
      })
      .replace(/\*/g, '.*');

    this.routes.push({
      pattern: new RegExp(`^${regexPattern}$`),
      paramNames,
      handler,
      originalPattern: pattern,
    });
    return this;
  }

  /**
   * 404 핸들러 등록
   */
  notFound(handler) {
    this.notFoundHandler = handler;
    return this;
  }

  /**
   * 현재 경로 파싱
   */
  getCurrentPath() {
    return window.location.pathname || '/';
  }

  /**
   * 경로 매칭
   */
  match(path) {
    for (const route of this.routes) {
      const match = path.match(route.pattern);
      if (match) {
        const params = {};
        route.paramNames.forEach((name, i) => {
          params[name] = decodeURIComponent(match[i + 1]);
        });
        return { route, params };
      }
    }
    return null;
  }

  /**
   * 현재 라우트 실행
   */
  async resolve() {
    const path = this.getCurrentPath();
    const queryString = window.location.search;
    const query = Object.fromEntries(new URLSearchParams(queryString));

    if (this.beforeEach) {
      const shouldContinue = await this.beforeEach({ path, query });
      if (shouldContinue === false) return;
    }

    const matched = this.match(path);

    if (matched) {
      await matched.route.handler({
        params: matched.params,
        query,
        path
      });
    } else if (this.notFoundHandler) {
      await this.notFoundHandler({ path, query });
    }

    if (this.afterEach) {
      await this.afterEach({ path, query });
    }
  }

  /**
   * 네비게이션
   */
  navigate(path, options = {}) {
    const { replace = false, query = {} } = options;

    let fullPath = path;
    const queryString = new URLSearchParams(query).toString();
    if (queryString) {
      fullPath += '?' + queryString;
    }

    if (replace) {
      window.history.replaceState({}, '', fullPath);
    } else {
      window.history.pushState({}, '', fullPath);
    }

    this.resolve();
  }

  /**
   * 라우터 시작
   */
  start() {
    // popstate 이벤트 (뒤로가기/앞으로가기)
    window.addEventListener('popstate', () => this.resolve());

    // 링크 클릭 인터셉트
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href]');
      if (!link) return;

      const href = link.getAttribute('href');

      // 외부 링크, 새 탭, 특수 링크는 무시
      if (
        link.target === '_blank' ||
        link.hasAttribute('download') ||
        href.startsWith('http') ||
        href.startsWith('//') ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        e.ctrlKey || e.metaKey || e.shiftKey
      ) {
        return;
      }

      e.preventDefault();
      this.navigate(href);
    });

    // 초기 라우트 실행
    this.resolve();
  }
}

// 싱글톤 인스턴스
const router = new Router();

export { Router };
export default router;
