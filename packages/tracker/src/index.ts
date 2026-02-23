(function () {
  var d = document, w = window as any, s = d.currentScript as HTMLScriptElement;
  if (!s) return;
  var site = s.getAttribute('data-site');
  if (!site) return;
  var apiBase = s.getAttribute('data-api') || (s.src.split('/oa.js')[0] + '/api');
  var endpoint = apiBase + '/event';
  var configEndpoint = apiBase + '/config/' + site;

  // Session management
  var sessionId = sessionStorage.getItem('_oa_sid');
  if (!sessionId) {
    sessionId = Math.random().toString(36).substr(2, 12) + Date.now().toString(36);
    sessionStorage.setItem('_oa_sid', sessionId);
  }

  var pageEntryTime = Date.now();
  var maxScroll = 0;
  var engaged = false;
  var leaveSent = false;
  var engageTimer: ReturnType<typeof setTimeout> | null = null;

  // Send helper - Beacon with XHR fallback
  function send(type: string, props?: any) {
    var payload: any = {
      s: site,
      sid: sessionId,
      t: type,
      u: location.pathname + location.search,
      r: (() => { try { return d.referrer && new URL(d.referrer).hostname !== location.hostname ? d.referrer : null; } catch { return null; } })(),
      w: w.innerWidth,
      ts: Date.now()
    };
    if (props) payload.p = props;
    var data = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      // Use text/plain to avoid CORS preflight - the API parses the body
      // as JSON regardless. This makes sendBeacon reliable through tunnels
      // and CDN proxies where preflight + fire-and-forget can conflict.
      var ok = navigator.sendBeacon(endpoint, new Blob([data], { type: 'text/plain' }));
      if (!ok && type !== 'pageleave') {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', endpoint, true);
        xhr.setRequestHeader('Content-Type', 'text/plain');
        xhr.send(data);
      }
    } else {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', endpoint, true);
      xhr.setRequestHeader('Content-Type', 'text/plain');
      xhr.send(data);
    }
  }

  // Scroll depth
  function getScrollPct(): number {
    var h = d.documentElement, b = d.body;
    var st = w.pageYOffset || h.scrollTop || b.scrollTop;
    var sh = Math.max(h.scrollHeight, b.scrollHeight);
    var ch = h.clientHeight;
    if (sh <= ch) return 100;
    return Math.round((st / (sh - ch)) * 100);
  }

  w.addEventListener('scroll', function () {
    var p = getScrollPct();
    if (p > maxScroll) maxScroll = p;
  }, { passive: true });

  // Engagement detection
  function markEngaged() {
    if (!engaged) {
      engaged = true;
      send('engage', { after_ms: Date.now() - pageEntryTime });
    }
    cleanupEngagement();
  }

  function setupEngagement() {
    engageTimer = setTimeout(markEngaged, 5000);
    d.addEventListener('click', markEngaged);
    d.addEventListener('keydown', markEngaged);
  }

  function cleanupEngagement() {
    if (engageTimer) { clearTimeout(engageTimer); engageTimer = null; }
    d.removeEventListener('click', markEngaged);
    d.removeEventListener('keydown', markEngaged);
  }

  setupEngagement();

  // Heartbeat every 30s
  setInterval(function () {
    if (!d.hidden) {
      send('heartbeat', {
        duration_ms: Date.now() - pageEntryTime,
        scroll_pct: maxScroll,
        engaged: engaged
      });
    }
  }, 30000);

  // Page leave
  function onLeave() {
    if (leaveSent) return;
    leaveSent = true;
    send('pageleave', {
      duration_ms: Date.now() - pageEntryTime,
      scroll_max_pct: maxScroll,
      engaged: engaged
    });
  }

  d.addEventListener('visibilitychange', function () {
    if (d.visibilityState === 'hidden') onLeave();
  });
  w.addEventListener('pagehide', onLeave);

  // Outbound link clicks
  d.addEventListener('click', function (e: MouseEvent) {
    var link = (e.target as HTMLElement).closest ? (e.target as HTMLElement).closest('a') : null;
    if (!link) return;
    var href = (link as HTMLAnchorElement).href;
    if (!href) return;
    try {
      var url = new URL(href);
      if (url.hostname !== location.hostname) {
        send('outbound_click', { url: href, text: ((link as HTMLElement).innerText || '').substring(0, 100) });
      }
    } catch (err) {}
  });

  // Pageview
  send('pageview');

  // SPA navigation
  function resetPage() {
    pageEntryTime = Date.now();
    maxScroll = 0;
    engaged = false;
    leaveSent = false;
    cleanupEngagement();
    setupEngagement();
    send('pageview');
  }

  var origPush = history.pushState;
  history.pushState = function () {
    onLeave();
    origPush.apply(history, arguments as any);
    resetPage();
  };
  w.addEventListener('popstate', function () {
    onLeave();
    resetPage();
  });

  // Public API
  w.oa = {
    track: function (name: string, props?: any) { send(name, props); },
    identify: function (traits: any) { send('identify', traits); }
  };

  // Auto-track config (event delegation)
  function applyAutoTrack(rules: any[]) {
    rules.forEach(function (rule: any) {
      if (rule._bound) return;
      rule._bound = true;
      d.addEventListener(rule.trigger || 'click', function (e: Event) {
        var el = (e.target as HTMLElement).closest ? (e.target as HTMLElement).closest(rule.selector) : null;
        if (!el) return;
        var p: any = {};
        if (rule.props) { for (var k in rule.props) p[k] = rule.props[k]; }
        if (rule.captureText) p.text = ((el as HTMLElement).innerText || '').substring(0, 200);
        if (rule.captureValue) p.value = (el as HTMLInputElement).value;
        send(rule.event, p);
      });
    });
  }

  function loadConfig() {
    var x = new XMLHttpRequest();
    x.open('GET', configEndpoint, true);
    x.onload = function () {
      if (x.status === 200) {
        try {
          var cfg = JSON.parse(x.responseText);
          if (cfg.autoTrack) applyAutoTrack(cfg.autoTrack);
        } catch (e) {}
      }
    };
    x.send();
  }

  if (d.readyState === 'complete') loadConfig();
  else w.addEventListener('load', loadConfig);
})();
