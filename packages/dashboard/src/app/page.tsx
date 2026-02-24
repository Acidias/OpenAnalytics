import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Check,
  Globe,
  Layers,
  MousePointerClick,
  Shield,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react";

const statChips = [
  { label: "Live visitors", value: "2,481", delta: "+18%" },
  { label: "Avg. engaged time", value: "4m 12s", delta: "+26%" },
  { label: "Conversion", value: "12.8%", delta: "+2.7%" },
  { label: "Bounce", value: "22%", delta: "-9%" },
];

const features = [
  {
    icon: Shield,
    title: "Privacy-first by design",
    description: "No cookies, no PII, no dark patterns. Built for GDPR-first teams from day one.",
  },
  {
    icon: Zap,
    title: "Realtime intelligence",
    description: "Watch visitors, funnels, and campaigns update instantly without waiting for delayed batches.",
  },
  {
    icon: MousePointerClick,
    title: "Journey-level clarity",
    description: "Track sessions, entry points, and drop-off moments with actionable context for each visit.",
  },
  {
    icon: Workflow,
    title: "Visual funnels",
    description: "Create conversion funnels in minutes and understand exactly where growth gets blocked.",
  },
  {
    icon: Globe,
    title: "Fast and lightweight",
    description: "Under 2KB tracker script with minimal overhead so your site stays blazing fast.",
  },
  {
    icon: Layers,
    title: "Open and extensible",
    description: "Self-host or cloud deploy, with API access and flexible data ownership on every plan.",
  },
];

const showcaseCards = [
  {
    title: "Campaign Command Center",
    description: "Compare paid and organic performance side-by-side with realtime attribution snapshots.",
    metrics: ["ROAS +32%", "CPA -18%", "Lead Quality +21%"],
  },
  {
    title: "Product Activation Funnel",
    description: "Pinpoint friction between signup and first value moment with step-level conversion trends.",
    metrics: ["Step 1: 87%", "Step 2: 62%", "Step 3: 41%"],
  },
  {
    title: "Global Audience Pulse",
    description: "Monitor traffic and engagement by region, language, and device in a single glance.",
    metrics: ["EMEA 38%", "APAC 24%", "Mobile 61%"],
  },
];

const plans = [
  {
    name: "Self-hosted",
    price: "Free",
    description: "For builders who want full control.",
    features: ["Unlimited sites", "Unlimited events", "Community support", "Full source access"],
  },
  {
    name: "Cloud",
    price: "$9/mo",
    description: "Managed analytics for modern teams.",
    features: ["100K pageviews/month", "Managed infrastructure", "Email support", "Auto-upgrades"],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Security and scale for large orgs.",
    features: ["Unlimited scale", "SLA + SSO", "Priority support", "Dedicated environments"],
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-14rem] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-[-8rem] right-[-6rem] h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-primary/10 p-1.5">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <span className="text-base font-semibold tracking-tight">OpenAnalytics</span>
          </div>
          <nav className="hidden items-center gap-7 md:flex">
            <Link href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Features</Link>
            <Link href="#showcase" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Showcase</Link>
            <Link href="#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Pricing</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login"><Button size="sm" variant="ghost">Sign in</Button></Link>
            <Link href="/login"><Button size="sm">Get started</Button></Link>
          </div>
        </div>
      </header>

      <section className="px-4 pb-24 pt-20 md:pt-28">
        <div className="container mx-auto grid items-center gap-14 lg:grid-cols-2">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              New: AI-assisted insight summaries
            </div>
            <h1 className="max-w-xl text-4xl font-bold tracking-tight md:text-6xl">
              Analytics that look <span className="text-primary">beautiful</span> and think faster.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              OpenAnalytics gives your team a modern, privacy-first command center for growth. Understand users, campaigns, and conversion flows in seconds.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/login"><Button size="lg" className="gap-2">Launch dashboard <ArrowRight className="h-4 w-4" /></Button></Link>
              <Link href="https://github.com/Acidias/OpenAnalytics" target="_blank"><Button size="lg" variant="outline">View on GitHub</Button></Link>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/70 p-4 shadow-2xl shadow-primary/10 backdrop-blur">
            <div className="rounded-xl border bg-background p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Realtime Overview</p>
                  <p className="text-xs text-muted-foreground">Last 30 minutes</p>
                </div>
                <div className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-500">Live</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {statChips.map((stat) => (
                  <div key={stat.label} className="rounded-lg border bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="mt-1 text-lg font-semibold">{stat.value}</p>
                    <p className="text-xs text-emerald-500">{stat.delta}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg border bg-muted/40 p-4">
                <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Performance trend</span>
                  <span>+24.6%</span>
                </div>
                <div className="flex h-24 items-end gap-2">
                  {[35, 44, 28, 53, 47, 68, 72, 66, 80, 86].map((h, idx) => (
                    <div key={idx} className="flex-1 rounded-sm bg-primary/20" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-t border-border/60 px-4 py-24">
        <div className="container mx-auto">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Built to impress your team and ship insight faster</h2>
            <p className="mt-4 text-muted-foreground">A polished experience inspired by modern product design, with serious analytics power underneath.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-xl border border-border/60 bg-card/60 p-6 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5">
                <feature.icon className="mb-4 h-8 w-8 text-primary" />
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="showcase" className="border-t border-border/60 px-4 py-24">
        <div className="container mx-auto">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Showcases & example dashboards</h2>
              <p className="mt-3 text-muted-foreground">Explore opinionated layouts for growth, product, and geo analytics workflows.</p>
            </div>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {showcaseCards.map((card) => (
              <div key={card.title} className="rounded-2xl border border-border/60 bg-gradient-to-b from-card to-card/40 p-6">
                <h3 className="text-lg font-semibold">{card.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{card.description}</p>
                <div className="mt-6 space-y-2">
                  {card.metrics.map((metric) => (
                    <div key={metric} className="flex items-center justify-between rounded-lg border bg-background/70 px-3 py-2 text-sm">
                      <span>{metric.split(" ")[0]}</span>
                      <span className="font-medium text-primary">{metric.replace(`${metric.split(" ")[0]} `, "")}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="border-y border-border/60 px-4 py-24">
        <div className="container mx-auto">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight md:text-4xl">Simple pricing, serious value</h2>
          <div className="grid gap-5 md:grid-cols-3">
            {plans.map((plan) => (
              <div key={plan.name} className={`rounded-2xl border p-7 ${plan.highlighted ? "border-primary bg-primary/5 shadow-xl shadow-primary/10" : "border-border/60 bg-card/60"}`}>
                <p className="text-sm font-medium text-muted-foreground">{plan.name}</p>
                <p className="mt-3 text-4xl font-bold">{plan.price}</p>
                <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/login" className="mt-7 block">
                  <Button className="w-full" variant={plan.highlighted ? "default" : "outline"}>Start now</Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="px-4 py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-3 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> OpenAnalytics</div>
          <p>Open source analytics for modern product teams.</p>
        </div>
      </footer>
    </div>
  );
}
