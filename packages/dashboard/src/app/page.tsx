import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  Clock3,
  Eye,
  Globe2,
  MousePointerClick,
  Shield,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Eye,
    title: "Event clarity, instantly",
    description:
      "Auto-capture pageviews, scroll depth, and engagement with clean charts your whole team can understand.",
  },
  {
    icon: Shield,
    title: "Privacy-first by default",
    description:
      "No cookies, no fingerprinting, no dark patterns. Stay compliant while still learning what matters.",
  },
  {
    icon: MousePointerClick,
    title: "Session journey tracking",
    description:
      "Understand where users click, drop, and convert with precise timeline playback and path analysis.",
  },
  {
    icon: Zap,
    title: "Realtime pulse",
    description:
      "Watch live visitors arrive by source, country, and page in a dashboard that updates in seconds.",
  },
  {
    icon: Bot,
    title: "AI recommendations",
    description:
      "Get smart suggestions on funnels, retention, and conversion opportunities based on your own data.",
  },
  {
    icon: Globe2,
    title: "Global scale",
    description:
      "Deploy cloud or self-hosted, track unlimited sites, and keep performance fast with a lightweight script.",
  },
];

const showcaseCards = [
  {
    title: "Launch report in 90 seconds",
    metric: "12.8K",
    label: "visitors this week",
    change: "+21%",
  },
  {
    title: "Top growth funnel",
    metric: "38.4%",
    label: "signup conversion",
    change: "+7.2%",
  },
  {
    title: "Realtime monitor",
    metric: "184",
    label: "active users now",
    change: "live",
  },
];

const testimonials = [
  {
    quote:
      "OpenAnalytics replaced three tools for us. Setup was minutes, and the product team checks it every day.",
    author: "Amara Lee",
    role: "Head of Growth, Orbital Labs",
  },
  {
    quote:
      "The privacy model made legal approval effortless. We finally have actionable analytics without compromise.",
    author: "Jonas Keller",
    role: "CTO, Northgrid",
  },
];

const plans = [
  {
    name: "Starter",
    price: "Free",
    description: "Self-hosted and developer friendly",
    features: ["Unlimited projects", "Community support", "Open source core", "Basic funnels"],
  },
  {
    name: "Pro",
    price: "$9/mo",
    description: "Managed cloud with premium insights",
    features: ["Up to 100K pageviews", "Realtime dashboard", "AI suggestions", "Priority support"],
    highlighted: true,
  },
  {
    name: "Scale",
    price: "Custom",
    description: "Enterprise-grade controls and SLAs",
    features: ["Unlimited traffic", "Dedicated infra", "SAML/SSO", "Security reviews"],
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="rounded-md bg-primary/10 p-1.5">
              <Activity className="h-4 w-4" />
            </div>
            <span className="text-base font-semibold">OpenAnalytics</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="#features" className="text-sm text-muted-foreground transition hover:text-foreground">
              Features
            </Link>
            <Link href="#showcase" className="text-sm text-muted-foreground transition hover:text-foreground">
              Showcase
            </Link>
            <Link href="#pricing" className="text-sm text-muted-foreground transition hover:text-foreground">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm">Start Free</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden px-4 pb-24 pt-20 md:pt-28">
        <div className="pointer-events-none absolute -top-20 left-1/2 h-96 w-[44rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="container relative mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              Modern analytics stack for product-led teams
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Beautiful analytics that turn user behavior into product wins
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              OpenAnalytics gives you realtime trends, conversion funnels, and AI-powered optimization ideas in one elegant,
              privacy-first dashboard.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/login">
                <Button size="lg" className="gap-2">
                  Launch Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="https://github.com/Acidias/OpenAnalytics" target="_blank">
                <Button variant="outline" size="lg">
                  View on GitHub
                </Button>
              </Link>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground sm:text-sm">
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                No cookies
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                Under 2KB script
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                Open source
              </span>
            </div>
          </div>

          <div className="mt-14 rounded-2xl border bg-card/80 p-4 shadow-2xl shadow-primary/10 backdrop-blur sm:p-6">
            <div className="grid gap-4 md:grid-cols-3">
              {showcaseCards.map((card) => (
                <div key={card.title} className="rounded-xl border bg-background p-4">
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="mt-2 text-3xl font-bold">{card.metric}</p>
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{card.label}</span>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-600">{card.change}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl border bg-background p-5">
              <div className="mb-4 flex items-center justify-between text-sm">
                <span className="font-medium">Weekly Traffic Overview</span>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock3 className="h-3.5 w-3.5" />
                  last 7 days
                </span>
              </div>
              <div className="grid h-40 grid-cols-12 items-end gap-2">
                {[28, 40, 34, 56, 63, 52, 72, 46, 59, 64, 68, 74].map((value, index) => (
                  <div
                    key={`${value}-${index}`}
                    className="rounded-t-md bg-gradient-to-t from-primary/90 to-primary/20"
                    style={{ height: `${value}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-t px-4 py-20">
        <div className="container mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Designed for focus. Built for growth.</h2>
            <p className="mt-4 text-muted-foreground">
              Everything from onboarding to insights is crafted to feel fast, intuitive, and decision-ready.
            </p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="group rounded-2xl border bg-card p-6 transition hover:-translate-y-1 hover:shadow-lg">
                <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-2 text-primary">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="showcase" className="border-t px-4 py-20">
        <div className="container mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl border bg-card p-8">
            <h3 className="text-2xl font-semibold">Built-in use cases your team can ship today</h3>
            <div className="mt-6 space-y-4">
              {[
                { icon: Target, title: "Marketing", body: "Measure campaign ROI and landing-page conversion in one place." },
                { icon: BarChart3, title: "Product", body: "Track feature adoption, retention trends, and behavior cohorts." },
                { icon: Activity, title: "Operations", body: "Monitor uptime-impact on traffic and conversion in realtime." },
              ].map((item) => (
                <div key={item.title} className="flex gap-4 rounded-xl border bg-background p-4">
                  <div className="mt-0.5 rounded-lg bg-primary/10 p-2">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            {testimonials.map((t) => (
              <figure key={t.author} className="rounded-2xl border bg-card p-6">
                <blockquote className="text-sm leading-relaxed text-foreground/90">“{t.quote}”</blockquote>
                <figcaption className="mt-4 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{t.author}</span> · {t.role}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="border-t px-4 py-20">
        <div className="container mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple plans for every stage</h2>
            <p className="mt-4 text-muted-foreground">Start free, upgrade when ready, or run fully self-hosted forever.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-6 ${plan.highlighted ? "relative bg-primary text-primary-foreground shadow-xl" : "bg-card"}`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl font-semibold">{plan.name}</h3>
                <p className={`mt-2 text-sm ${plan.highlighted ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{plan.description}</p>
                <p className="mt-6 text-3xl font-bold">{plan.price}</p>
                <ul className="mt-6 space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className={`h-4 w-4 ${plan.highlighted ? "text-emerald-300" : "text-emerald-500"}`} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/login" className="mt-8 block">
                  <Button className="w-full" variant={plan.highlighted ? "secondary" : "outline"}>
                    Get Started
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t px-4 py-20">
        <div className="container mx-auto max-w-4xl rounded-2xl border bg-card p-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Ready to build with better analytics?</h2>
          <p className="mt-3 text-muted-foreground">Join teams shipping smarter products with a dashboard everyone actually uses.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/login">
              <Button size="lg" className="gap-2">
                Start Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="https://github.com/Acidias/OpenAnalytics" target="_blank">
              <Button variant="outline" size="lg">
                Star on GitHub
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t px-4 py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-2 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            OpenAnalytics
          </div>
          <p>Open source analytics for modern teams.</p>
        </div>
      </footer>
    </div>
  );
}
