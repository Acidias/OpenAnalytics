import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Activity, BarChart3, Shield, Zap, Globe, MousePointerClick } from "lucide-react";

const features = [
  { icon: BarChart3, title: "Rich Analytics", description: "Pageviews, scroll depth, time on page, and engagement — all tracked by default." },
  { icon: Shield, title: "Privacy First", description: "No cookies, no fingerprinting, no PII. GDPR-compliant out of the box." },
  { icon: MousePointerClick, title: "Session Tracking", description: "Follow entire visitor journeys with automatic session detection." },
  { icon: Zap, title: "Real-time", description: "See visitors on your site right now with live updating dashboards." },
  { icon: Globe, title: "Lightweight", description: "Under 2KB script. Won't slow down your site." },
  { icon: Activity, title: "Custom Funnels", description: "Build conversion funnels and track goals with visual builders." },
];

const plans = [
  { name: "Self-Hosted", price: "Free", description: "Run on your own infrastructure", features: ["Unlimited sites", "Unlimited data", "Full API access", "Community support"] },
  { name: "Cloud", price: "$9/mo", description: "We handle the infrastructure", features: ["Up to 100K pageviews/mo", "Managed hosting", "Email support", "Auto updates"], highlighted: true },
  { name: "Enterprise", price: "Custom", description: "For large-scale deployments", features: ["Unlimited pageviews", "Dedicated infrastructure", "Priority support", "SLA guarantee"] },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6" />
            <span className="font-bold text-lg">OpenAnalytics</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground">Features</Link>
            <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing</Link>
            <Link href="/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
            <Link href="/login"><Button size="sm">Get Started</Button></Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-24 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <h1 className="text-5xl font-bold tracking-tight mb-6">
            Web analytics that respect your users
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Open-source, cookie-free analytics with session tracking, scroll depth, engagement metrics, and conversion funnels. All under 2KB.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/login"><Button size="lg">Start for Free</Button></Link>
            <Link href="https://github.com/Acidias/OpenAnalytics" target="_blank">
              <Button variant="outline" size="lg">View on GitHub</Button>
            </Link>
          </div>
          {/* Mock dashboard preview */}
          <div className="mt-16 rounded-lg border bg-card p-4 shadow-2xl">
            <div className="grid grid-cols-4 gap-4 mb-4">
              {["12.8K visitors", "34.2K pageviews", "2m 22s avg time", "68% scroll depth"].map((stat) => (
                <div key={stat} className="rounded-md bg-muted p-4 text-center">
                  <div className="text-lg font-bold">{stat.split(" ")[0]}</div>
                  <div className="text-xs text-muted-foreground">{stat.split(" ").slice(1).join(" ")}</div>
                </div>
              ))}
            </div>
            <div className="h-48 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 opacity-30" />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4 border-t">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12">Everything you need, nothing you don&apos;t</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f) => (
              <div key={f.title} className="p-6 rounded-lg border bg-card">
                <f.icon className="h-8 w-8 mb-4 text-primary" />
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4 border-t">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12">Simple, transparent pricing</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div key={plan.name} className={`p-8 rounded-lg border ${plan.highlighted ? "border-primary shadow-lg ring-1 ring-primary" : "bg-card"}`}>
                <h3 className="font-semibold text-lg mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                <div className="text-3xl font-bold mb-6">{plan.price}</div>
                <ul className="space-y-2 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="text-sm flex items-center gap-2">
                      <span className="text-emerald-500">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/login">
                  <Button className="w-full" variant={plan.highlighted ? "default" : "outline"}>Get Started</Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span>OpenAnalytics</span>
          </div>
          <div>Open source · MIT License</div>
        </div>
      </footer>
    </div>
  );
}
