export const mockSites = [
  { id: "site_1", name: "Acme Corp", domain: "acme.com", createdAt: "2025-12-01" },
  { id: "site_2", name: "My Blog", domain: "blog.example.com", createdAt: "2026-01-15" },
  { id: "site_3", name: "SaaS App", domain: "app.saasproduct.io", createdAt: "2026-02-01" },
];

export const mockOverview = {
  visitors: 12847,
  pageviews: 34219,
  avgTimeOnPage: 142,
  avgScrollDepth: 68,
  engagementRate: 72.4,
  bounceRate: 34.2,
  visitorsChange: 12.3,
  pageviewsChange: 8.7,
  avgTimeChange: -3.1,
  scrollChange: 5.2,
  engagementChange: 2.1,
};

export const mockChartData = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(2026, 1, i + 1);
  return {
    date: date.toISOString().split("T")[0],
    visitors: Math.floor(300 + Math.random() * 200 + Math.sin(i / 3) * 100),
    pageviews: Math.floor(800 + Math.random() * 400 + Math.sin(i / 3) * 200),
  };
});

export const mockTopPages = [
  { path: "/", views: 8432, avgDuration: 45, avgScroll: 62, bounceRate: 42.1 },
  { path: "/pricing", views: 4218, avgDuration: 120, avgScroll: 85, bounceRate: 28.3 },
  { path: "/blog/getting-started", views: 3102, avgDuration: 210, avgScroll: 78, bounceRate: 22.1 },
  { path: "/features", views: 2847, avgDuration: 95, avgScroll: 71, bounceRate: 35.6 },
  { path: "/docs/api", views: 2103, avgDuration: 340, avgScroll: 90, bounceRate: 15.2 },
  { path: "/about", views: 1892, avgDuration: 65, avgScroll: 55, bounceRate: 45.8 },
  { path: "/blog/analytics-tips", views: 1654, avgDuration: 195, avgScroll: 82, bounceRate: 20.4 },
  { path: "/contact", views: 1231, avgDuration: 38, avgScroll: 48, bounceRate: 52.3 },
];

export const mockReferrers = [
  { source: "google.com", visitors: 5432, percentage: 42.3 },
  { source: "twitter.com", visitors: 2103, percentage: 16.4 },
  { source: "github.com", visitors: 1847, percentage: 14.4 },
  { source: "direct", visitors: 1523, percentage: 11.9 },
  { source: "reddit.com", visitors: 987, percentage: 7.7 },
  { source: "hackernews", visitors: 654, percentage: 5.1 },
  { source: "linkedin.com", visitors: 301, percentage: 2.3 },
];

export const mockCountries = [
  { country: "United States", code: "US", visitors: 4832, percentage: 37.6 },
  { country: "United Kingdom", code: "GB", visitors: 1847, percentage: 14.4 },
  { country: "Germany", code: "DE", visitors: 1523, percentage: 11.9 },
  { country: "France", code: "FR", visitors: 987, percentage: 7.7 },
  { country: "Canada", code: "CA", visitors: 854, percentage: 6.6 },
  { country: "Japan", code: "JP", visitors: 654, percentage: 5.1 },
  { country: "Australia", code: "AU", visitors: 543, percentage: 4.2 },
  { country: "Netherlands", code: "NL", visitors: 421, percentage: 3.3 },
  { country: "India", code: "IN", visitors: 387, percentage: 3.0 },
  { country: "Brazil", code: "BR", visitors: 312, percentage: 2.4 },
];

export const mockSessions = [
  { id: "s_1", entryPage: "/", pagesVisited: 5, duration: 342, country: "US", device: "Desktop", browser: "Chrome", os: "macOS", startedAt: "2026-02-20T14:32:00Z" },
  { id: "s_2", entryPage: "/pricing", pagesVisited: 3, duration: 187, country: "GB", device: "Mobile", browser: "Safari", os: "iOS", startedAt: "2026-02-20T14:28:00Z" },
  { id: "s_3", entryPage: "/blog/getting-started", pagesVisited: 7, duration: 524, country: "DE", device: "Desktop", browser: "Firefox", os: "Windows", startedAt: "2026-02-20T14:15:00Z" },
  { id: "s_4", entryPage: "/features", pagesVisited: 4, duration: 256, country: "CA", device: "Tablet", browser: "Chrome", os: "Android", startedAt: "2026-02-20T13:55:00Z" },
  { id: "s_5", entryPage: "/", pagesVisited: 2, duration: 45, country: "US", device: "Desktop", browser: "Chrome", os: "Windows", startedAt: "2026-02-20T13:42:00Z" },
  { id: "s_6", entryPage: "/docs/api", pagesVisited: 12, duration: 892, country: "JP", device: "Desktop", browser: "Chrome", os: "macOS", startedAt: "2026-02-20T13:20:00Z" },
  { id: "s_7", entryPage: "/blog/analytics-tips", pagesVisited: 3, duration: 198, country: "FR", device: "Mobile", browser: "Safari", os: "iOS", startedAt: "2026-02-20T12:58:00Z" },
  { id: "s_8", entryPage: "/", pagesVisited: 6, duration: 445, country: "AU", device: "Desktop", browser: "Edge", os: "Windows", startedAt: "2026-02-20T12:30:00Z" },
];

export const mockSessionTimeline = [
  { type: "pageview", url: "/", timestamp: "2026-02-20T14:32:00Z", duration: 45, scrollDepth: 62 },
  { type: "engage", url: "/", timestamp: "2026-02-20T14:32:45Z", properties: { after_ms: 5000 } },
  { type: "click", url: "/", timestamp: "2026-02-20T14:33:10Z", properties: { selector: "a.cta-button", text: "Get Started" } },
  { type: "pageview", url: "/pricing", timestamp: "2026-02-20T14:33:12Z", duration: 120, scrollDepth: 85 },
  { type: "scroll", url: "/pricing", timestamp: "2026-02-20T14:34:00Z", properties: { depth: 85 } },
  { type: "click", url: "/pricing", timestamp: "2026-02-20T14:35:00Z", properties: { selector: "button.plan-select", text: "Choose Pro" } },
  { type: "pageview", url: "/signup", timestamp: "2026-02-20T14:35:02Z", duration: 95, scrollDepth: 100 },
  { type: "custom", url: "/signup", timestamp: "2026-02-20T14:36:30Z", name: "signup_complete", properties: { plan: "pro" } },
];

export const mockEvents = [
  { name: "signup_complete", count: 342, uniqueUsers: 312, trend: 15.2 },
  { name: "button_click", count: 8934, uniqueUsers: 4521, trend: 3.4 },
  { name: "form_submit", count: 1247, uniqueUsers: 1102, trend: -2.1 },
  { name: "video_play", count: 654, uniqueUsers: 543, trend: 22.8 },
  { name: "file_download", count: 432, uniqueUsers: 387, trend: 8.9 },
  { name: "scroll_milestone", count: 12453, uniqueUsers: 8234, trend: 1.2 },
];

export const mockEventDetail = {
  name: "signup_complete",
  totalCount: 342,
  uniqueUsers: 312,
  trend: Array.from({ length: 14 }, (_, i) => ({
    date: new Date(2026, 1, i + 7).toISOString().split("T")[0],
    count: Math.floor(20 + Math.random() * 15),
  })),
  properties: {
    plan: [
      { value: "pro", count: 187, percentage: 54.7 },
      { value: "starter", count: 112, percentage: 32.7 },
      { value: "enterprise", count: 43, percentage: 12.6 },
    ],
    source: [
      { value: "organic", count: 156, percentage: 45.6 },
      { value: "referral", count: 98, percentage: 28.7 },
      { value: "direct", count: 88, percentage: 25.7 },
    ],
  },
};

export const mockFunnels = [
  { id: "f_1", name: "Signup Flow", steps: 4, conversionRate: 23.4, totalEntered: 5432, createdAt: "2026-01-20" },
  { id: "f_2", name: "Onboarding", steps: 5, conversionRate: 56.7, totalEntered: 342, createdAt: "2026-02-01" },
  { id: "f_3", name: "Purchase Funnel", steps: 3, conversionRate: 12.8, totalEntered: 8921, createdAt: "2026-02-10" },
];

export const mockFunnelDetail = {
  id: "f_1",
  name: "Signup Flow",
  steps: [
    { name: "Landing Page", type: "pageview" as const, match: "/", visitors: 5432, dropoff: 0 },
    { name: "Pricing Page", type: "pageview" as const, match: "/pricing", visitors: 3214, dropoff: 40.8 },
    { name: "Sign Up Click", type: "event" as const, match: "signup_click", visitors: 1847, dropoff: 42.5 },
    { name: "Signup Complete", type: "event" as const, match: "signup_complete", visitors: 1271, dropoff: 31.2 },
  ],
};

export const mockGoals = [
  { id: "g_1", name: "Signups", type: "event", target: "signup_complete", current: 312, goal: 500, period: "monthly" },
  { id: "g_2", name: "Page Views", type: "pageview", target: "/pricing", current: 4218, goal: 5000, period: "monthly" },
  { id: "g_3", name: "Engagement Rate", type: "metric", target: "engagement_rate", current: 72.4, goal: 80, period: "monthly" },
];

export const mockLiveVisitors = {
  current: 47,
  pages: [
    { path: "/", visitors: 12 },
    { path: "/pricing", visitors: 8 },
    { path: "/docs/api", visitors: 6 },
    { path: "/blog/getting-started", visitors: 5 },
    { path: "/features", visitors: 4 },
    { path: "/about", visitors: 3 },
  ],
  countries: [
    { country: "United States", code: "US", visitors: 18 },
    { country: "United Kingdom", code: "GB", visitors: 8 },
    { country: "Germany", code: "DE", visitors: 6 },
    { country: "France", code: "FR", visitors: 4 },
  ],
  recentEvents: [
    { type: "pageview", path: "/pricing", country: "US", timestamp: "2s ago" },
    { type: "pageview", path: "/", country: "GB", timestamp: "5s ago" },
    { type: "event", name: "signup_click", country: "DE", timestamp: "8s ago" },
    { type: "pageview", path: "/docs/api", country: "US", timestamp: "12s ago" },
    { type: "pageview", path: "/blog/getting-started", country: "JP", timestamp: "15s ago" },
  ],
};

export const mockDevices = {
  browsers: [
    { name: "Chrome", visitors: 6423, percentage: 50.0 },
    { name: "Safari", visitors: 3212, percentage: 25.0 },
    { name: "Firefox", visitors: 1542, percentage: 12.0 },
    { name: "Edge", visitors: 1028, percentage: 8.0 },
    { name: "Other", visitors: 642, percentage: 5.0 },
  ],
  os: [
    { name: "macOS", visitors: 4832, percentage: 37.6 },
    { name: "Windows", visitors: 3856, percentage: 30.0 },
    { name: "iOS", visitors: 2056, percentage: 16.0 },
    { name: "Android", visitors: 1542, percentage: 12.0 },
    { name: "Linux", visitors: 561, percentage: 4.4 },
  ],
  devices: [
    { name: "Desktop", visitors: 8432, percentage: 65.6 },
    { name: "Mobile", visitors: 3598, percentage: 28.0 },
    { name: "Tablet", visitors: 817, percentage: 6.4 },
  ],
};

export const mockSources = {
  referrers: mockReferrers,
  utmSources: [
    { source: "google", medium: "cpc", campaign: "brand-q1", visitors: 1234, conversions: 89 },
    { source: "twitter", medium: "social", campaign: "launch-feb", visitors: 876, conversions: 34 },
    { source: "newsletter", medium: "email", campaign: "weekly-digest", visitors: 654, conversions: 123 },
    { source: "producthunt", medium: "referral", campaign: "launch-day", visitors: 543, conversions: 67 },
  ],
};
