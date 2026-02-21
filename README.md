# Simple Analytics 📊

**Privacy-first, developer-friendly analytics platform**

> One line of code. Complete visitor insights. Open source core with premium dashboard.

## 🎯 Vision

Create the simplest analytics solution for developers who want visitor insights without the complexity of Google Analytics or privacy concerns of big tech trackers.

**Core Promise:**
- Add one line of JavaScript
- Get complete visitor analytics
- Own your data
- Pay only for premium features

## 🚀 Quick Start (Future)

```html
<!-- Add this single line to your website -->
<script src="https://analytics.yourdomain.com/track.js" data-site="your-site-id"></script>
```

That's it. Analytics will start flowing to your dashboard immediately.

## ✨ Features

### Core Analytics (Free/Open Source)
- **Visitor Tracking**: Unique visitors, page views, session duration
- **Geographic Data**: Country, region, city (anonymized)
- **Technical Info**: Browser, OS, device type, screen resolution
- **Traffic Sources**: Referrers, direct traffic, search engines
- **Page Performance**: Load times, bounce rates
- **Real-time Dashboard**: Live visitor count and activity

### Premium Dashboard ($5-10/month)
- **Advanced Segmentation**: Custom visitor groups and filters  
- **Conversion Tracking**: Goal completion and funnel analysis
- **Custom Events**: Track specific user actions
- **Data Export**: CSV, JSON, API access
- **Team Collaboration**: Multiple users, shared dashboards
- **White-label Options**: Custom branding, embed widgets

### Future Features
- **Custom Onboarding Tracking**: Configure multi-step sign-up flows
- **A/B Testing Integration**: Track variant performance
- **Retention Analysis**: User lifecycle and churn prediction
- **API Webhooks**: Real-time event notifications
- **Mobile App SDKs**: iOS/Android tracking

## 🏗 Technical Architecture

### Client-Side Tracking
```javascript
// Ultra-lightweight tracker (~2KB gzipped)
// Privacy-first: no cookies, no fingerprinting
// GDPR compliant by default
```

### Data Collection
- **Minimal Data**: Only essential visitor metrics
- **Privacy First**: IP anonymization, no personal data storage
- **GDPR Compliant**: Consent management, data deletion
- **Real-time Processing**: Sub-second data ingestion

### Dashboard Tech Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Node.js API, PostgreSQL database
- **Analytics Engine**: Custom time-series processing
- **Hosting**: Self-hostable + managed cloud option

## 📈 Business Model

### Open Source Core
- Basic analytics dashboard (self-hosted)
- Essential visitor metrics
- Community support
- GitHub-based development

### Managed Dashboard (Premium)
- **$5-10/month per website**
- Advanced analytics features
- Managed hosting & backups
- Priority support
- Team collaboration tools

### Enterprise (Future)
- **Custom pricing**
- White-label solutions
- On-premise deployment
- Custom integrations
- SLA guarantees

## 🛣 Roadmap

### Phase 1: MVP (Months 1-2)
- [ ] Core tracking script (vanilla JS)
- [ ] Basic dashboard (visitor count, pages, countries)
- [ ] PostgreSQL data storage
- [ ] Simple user authentication
- [ ] One-click integration guides

### Phase 2: Enhanced Analytics (Months 3-4)
- [ ] Advanced filtering & segmentation
- [ ] Traffic source analysis
- [ ] Performance metrics
- [ ] Data export functionality
- [ ] Mobile-responsive dashboard

### Phase 3: Conversion Tracking (Months 5-6)
- [ ] Custom event tracking
- [ ] Goal completion monitoring
- [ ] Funnel analysis
- [ ] A/B testing preparation
- [ ] API for custom integrations

### Phase 4: Premium Features (Months 7-8)
- [ ] Team collaboration tools
- [ ] Custom onboarding flow tracking
- [ ] Advanced retention analysis
- [ ] White-label dashboard options
- [ ] Enterprise security features

## 🔧 Development Setup (Future)

```bash
# Clone repository
git clone https://github.com/yourusername/simple-analytics
cd simple-analytics

# Install dependencies
npm install

# Setup database
npm run db:setup

# Start development server
npm run dev
```

## 🤝 Contributing

We welcome contributions! This project aims to be:
- **Developer-friendly**: Clean code, good documentation
- **Privacy-focused**: User data protection first
- **Open source**: Community-driven development
- **Simple**: Easy to understand and extend

## 📄 License

**Dual License:**
- **Open Source Core**: MIT License
- **Premium Dashboard**: Commercial License

---

## 📋 Technical Implementation Plan

### Database Schema
```sql
-- Core visitor tracking
visitors (
  id, session_id, site_id, 
  country, region, city,
  browser, os, device_type,
  referrer, utm_source, utm_campaign,
  created_at, updated_at
)

-- Page view tracking  
page_views (
  id, visitor_id, page_path, 
  load_time, bounce_rate,
  created_at
)

-- Custom events (premium)
events (
  id, visitor_id, event_name, 
  properties, value,
  created_at
)
```

### API Endpoints
```
GET  /api/sites/{id}/analytics     # Dashboard data
POST /api/sites/{id}/events       # Track custom events
GET  /api/sites/{id}/export       # Data export (premium)
POST /api/sites                   # Create new site
```

### Tracking Script Architecture
```javascript
// Minimal, privacy-first tracker
(function() {
  const siteId = document.currentScript.dataset.site;
  const endpoint = 'https://api.simpleanalytics.com/track';
  
  // Collect minimal data
  const data = {
    site: siteId,
    page: location.pathname,
    referrer: document.referrer,
    screen: screen.width + 'x' + screen.height,
    // No cookies, no fingerprinting
  };
  
  // Send via beacon API (non-blocking)
  navigator.sendBeacon(endpoint, JSON.stringify(data));
})();
```

---

*This project plan was created by Claude Sonnet 4 on February 20, 2026*
*Ready for implementation and future refinement with Claude Opus 4.6*