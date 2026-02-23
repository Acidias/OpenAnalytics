"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Activity,
  Check,
  Copy,
  Monitor,
  Cloud,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api";

/* ---------- Local CodeBlock component ---------- */

function CodeBlock({
  code,
  id,
  copiedId,
  onCopy,
}: {
  code: string;
  id: string;
  copiedId: string | null;
  onCopy: (id: string, text: string) => void;
}) {
  const isCopied = copiedId === id;
  return (
    <div className="relative group">
      <pre className="p-4 rounded-md bg-muted font-mono text-sm overflow-x-auto whitespace-pre-wrap break-all">
        {code}
      </pre>
      <Button
        variant="outline"
        size="icon"
        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onCopy(id, code)}
      >
        {isCopied ? (
          <Check className="h-4 w-4" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

/* ---------- LLM Setup Prompt ---------- */

const LLM_SETUP_PROMPT = `You are helping a user set up a Cloudflare Tunnel for their local OpenAnalytics instance.

Context:
- OpenAnalytics is a self-hosted, privacy-first web analytics platform
- The user is running it locally via Docker (docker compose up)
- The API runs on port 3101 by default
- The tracking script (oa.js) needs to be publicly reachable so visitors' browsers can send analytics data
- A Cloudflare Tunnel creates a secure connection from the local machine to Cloudflare's network - no open ports or static IP required

Guide the user through these steps one at a time. After each step, wait for confirmation before proceeding:

1. Install cloudflared
   - macOS: brew install cloudflared
   - Other OS: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/

2. Authenticate with Cloudflare
   - Run: cloudflared tunnel login
   - This opens the browser to authorise the tunnel client
   - Prerequisites: free Cloudflare account, domain added to Cloudflare DNS

3. Create a tunnel
   - Run: cloudflared tunnel create openanalytics
   - This generates a tunnel ID and credentials file

4. Route DNS
   - Run: cloudflared tunnel route dns openanalytics analytics.yourdomain.com
   - Replace analytics.yourdomain.com with the user's chosen subdomain
   - This creates a CNAME record in Cloudflare DNS

5. Configure environment variables
   - Add to the .env file in the OpenAnalytics project root:
     TRACKER_URL=https://analytics.yourdomain.com
     CORS_ORIGIN=http://localhost:3100,https://yourdomain.com,https://www.yourdomain.com
   - TRACKER_URL sets the public-facing URL for the script tag
   - CORS_ORIGIN is comma-separated list of origins allowed to send data

6. Start the tunnel
   - Run: cloudflared tunnel run --url http://localhost:3101 openanalytics
   - Keep this running in a separate terminal or use a process manager

7. Rebuild and verify
   - Run: docker compose up --build
   - Check that the tracking script tag in Settings shows the public tunnel URL
   - Add the script to the website's <head> and check the Live view for data

Important notes:
- Ask the user for their desired subdomain early on
- Be patient and explain each step clearly
- If they hit errors, help them troubleshoot
- At the end, remind them to come back to the OpenAnalytics wizard and enter their tunnel URL`;

/* ---------- Setup guide step definitions ---------- */

const SETUP_STEPS = [
  {
    title: "Install cloudflared",
    description: "Install the Cloudflare Tunnel client on your machine",
    content: (
      copiedId: string | null,
      onCopy: (id: string, text: string) => void
    ) => (
      <div className="space-y-3">
        <p className="text-sm font-medium">macOS (Homebrew):</p>
        <CodeBlock
          code="brew install cloudflared"
          id="guide-1"
          copiedId={copiedId}
          onCopy={onCopy}
        />
        <p className="text-sm text-muted-foreground">
          For other operating systems, see the{" "}
          <a
            href="https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-4 inline-flex items-center gap-1"
          >
            official download page <ExternalLink className="h-3 w-3" />
          </a>
        </p>
      </div>
    ),
  },
  {
    title: "Authenticate with Cloudflare",
    description: "Log in to your Cloudflare account from the command line",
    content: (
      copiedId: string | null,
      onCopy: (id: string, text: string) => void
    ) => (
      <div className="space-y-3">
        <CodeBlock
          code="cloudflared tunnel login"
          id="guide-2"
          copiedId={copiedId}
          onCopy={onCopy}
        />
        <p className="text-sm text-muted-foreground">
          This opens your browser to authorise the tunnel client. Select the
          domain you want to use for analytics.
        </p>
        <div className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950 p-3 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Prerequisites</p>
          <ul className="mt-1 list-disc list-inside space-y-1">
            <li>A free Cloudflare account</li>
            <li>Your domain must be added to Cloudflare DNS</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    title: "Create a tunnel",
    description: "Create a named tunnel for your OpenAnalytics instance",
    content: (
      copiedId: string | null,
      onCopy: (id: string, text: string) => void
    ) => (
      <div className="space-y-3">
        <CodeBlock
          code="cloudflared tunnel create openanalytics"
          id="guide-3"
          copiedId={copiedId}
          onCopy={onCopy}
        />
        <p className="text-sm text-muted-foreground">
          This generates a tunnel ID and credentials file. You can name the
          tunnel anything you like.
        </p>
      </div>
    ),
  },
  {
    title: "Route DNS",
    description: "Point a subdomain at your tunnel",
    content: (
      copiedId: string | null,
      onCopy: (id: string, text: string) => void
    ) => (
      <div className="space-y-3">
        <CodeBlock
          code="cloudflared tunnel route dns openanalytics analytics.yourdomain.com"
          id="guide-4"
          copiedId={copiedId}
          onCopy={onCopy}
        />
        <p className="text-sm text-muted-foreground">
          Replace{" "}
          <code className="bg-muted px-1 rounded">
            analytics.yourdomain.com
          </code>{" "}
          with your desired subdomain. This creates a CNAME record in your
          Cloudflare DNS that routes traffic to the tunnel.
        </p>
      </div>
    ),
  },
  {
    title: "Configure environment variables",
    description: "Tell OpenAnalytics about your public URL",
    content: (
      copiedId: string | null,
      onCopy: (id: string, text: string) => void
    ) => (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Add these to your{" "}
          <code className="bg-muted px-1 rounded">.env</code> file in the
          project root:
        </p>
        <CodeBlock
          code={`# Public URL where the tracking script is served\nTRACKER_URL=https://analytics.yourdomain.com\n\n# Allow your website(s) to send data to the API\n# localhost is included so the dashboard can still reach the API\nCORS_ORIGIN=http://localhost:3100,https://yourdomain.com,https://www.yourdomain.com`}
          id="guide-5"
          copiedId={copiedId}
          onCopy={onCopy}
        />
        <p className="text-sm text-muted-foreground">
          <code className="bg-muted px-1 rounded">TRACKER_URL</code> sets the
          public-facing URL used in the script tag.{" "}
          <code className="bg-muted px-1 rounded">CORS_ORIGIN</code> accepts
          comma-separated origins that are allowed to send analytics data.
        </p>
      </div>
    ),
  },
  {
    title: "Start the tunnel",
    description: "Connect your local API to Cloudflare's network",
    content: (
      copiedId: string | null,
      onCopy: (id: string, text: string) => void
    ) => (
      <div className="space-y-3">
        <CodeBlock
          code="cloudflared tunnel run --url http://localhost:3101 openanalytics"
          id="guide-6"
          copiedId={copiedId}
          onCopy={onCopy}
        />
        <p className="text-sm text-muted-foreground">
          Port <code className="bg-muted px-1 rounded">3101</code> is the
          default API port. Adjust if you have changed it. Keep this running in
          a separate terminal (or use a process manager).
        </p>
      </div>
    ),
  },
  {
    title: "Rebuild and verify",
    description:
      "Restart the stack so the new environment variables take effect",
    content: (
      copiedId: string | null,
      onCopy: (id: string, text: string) => void
    ) => (
      <div className="space-y-3">
        <CodeBlock
          code="docker compose up --build"
          id="guide-7"
          copiedId={copiedId}
          onCopy={onCopy}
        />
        <p className="text-sm text-muted-foreground">
          Once running, verify the tracking script tag shows your public tunnel
          URL (e.g.{" "}
          <code className="bg-muted px-1 rounded">
            https://analytics.yourdomain.com/oa.js
          </code>
          ). Add the script tag to your website&apos;s{" "}
          <code className="bg-muted px-1 rounded">&lt;head&gt;</code> and check
          the Live view for incoming data.
        </p>
      </div>
    ),
  },
];

/* ---------- Step labels ---------- */

const STEP_LABELS = ["Details", "Deploy", "Setup", "Script", "Done"];

/* ---------- Session storage persistence ---------- */

const WIZARD_STORAGE_KEY = "oa-new-site-wizard";

interface WizardState {
  step: number;
  siteName: string;
  domain: string;
  publicId: string;
  deploymentChoice: "local" | null;
  tunnelUrl: string;
}

function loadWizardState(): Partial<WizardState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(WIZARD_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<WizardState>;
  } catch {
    return {};
  }
}

function saveWizardState(state: WizardState) {
  try {
    sessionStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // sessionStorage full or unavailable - not critical
  }
}

function clearWizardState() {
  try {
    sessionStorage.removeItem(WIZARD_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/* ---------- Main component ---------- */

export default function NewSitePage() {
  const [step, setStep] = useState(1);
  const [siteName, setSiteName] = useState("");
  const [domain, setDomain] = useState("");
  const [publicId, setPublicId] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  // New state for the expanded flow
  const [deploymentChoice, setDeploymentChoice] = useState<"local" | null>(
    null
  );
  const [tunnelUrl, setTunnelUrl] = useState(
    process.env.NEXT_PUBLIC_TRACKER_URL || ""
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const [llmPromptExpanded, setLlmPromptExpanded] = useState(false);

  // Restore wizard state from sessionStorage on mount
  useEffect(() => {
    const saved = loadWizardState();
    if (saved.step && saved.step > 1 && saved.publicId) {
      setStep(saved.step);
      setSiteName(saved.siteName || "");
      setDomain(saved.domain || "");
      setPublicId(saved.publicId);
      setDeploymentChoice(saved.deploymentChoice ?? null);
      setTunnelUrl(saved.tunnelUrl || process.env.NEXT_PUBLIC_TRACKER_URL || "");
    }
  }, []);

  // Persist wizard state to sessionStorage whenever key values change
  const persistState = useCallback(() => {
    if (publicId) {
      saveWizardState({ step, siteName, domain, publicId, deploymentChoice, tunnelUrl });
    }
  }, [step, siteName, domain, publicId, deploymentChoice, tunnelUrl]);

  useEffect(() => {
    persistState();
  }, [persistState]);

  const scriptTag = publicId
    ? `<script defer data-site="${publicId}" src="${tunnelUrl.replace(/\/$/, "")}/oa.js"></script>`
    : "";

  const detectedTunnelUrl = process.env.NEXT_PUBLIC_TRACKER_URL || "";

  const handleCreate = async () => {
    setError("");
    setCreating(true);
    try {
      const data = (await api.sites.create({
        domain,
        name: siteName || undefined,
      })) as { site: { public_id: string } };
      setPublicId(data.site.public_id);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create site");
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(scriptTag);
    setCopiedId("script-tag");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleStep = (index: number) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center">
        <Activity className="h-10 w-10 mx-auto mb-4 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Add a New Site</h1>
        <p className="text-muted-foreground mt-1">
          Start tracking analytics in minutes
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="flex items-center gap-1">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium",
                  step >= s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {step > s ? <Check className="h-4 w-4" /> : s}
              </div>
              <span className="text-xs text-muted-foreground">
                {STEP_LABELS[s - 1]}
              </span>
            </div>
            {s < 5 && (
              <div
                className={cn(
                  "w-8 h-px mb-5",
                  step > s ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1 - Site Details (unchanged) */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Site Details</CardTitle>
            <CardDescription>Enter your website information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Site Name</Label>
              <Input
                id="name"
                placeholder="My Website"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="domain">Domain</Label>
              <Input
                id="domain"
                placeholder="example.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleCreate}
              disabled={!domain || creating}
            >
              {creating ? "Creating..." : "Continue"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2 - Deployment Choice */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              How are you running OpenAnalytics?
            </CardTitle>
            <CardDescription>
              Choose your deployment method to get the right setup instructions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Run Locally */}
              <button
                type="button"
                onClick={() => setDeploymentChoice("local")}
                className={cn(
                  "flex flex-col items-center gap-3 p-6 rounded-lg border-2 text-center transition-colors",
                  deploymentChoice === "local"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <Monitor className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">Run Locally</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your system must be running with the app. Requires a
                    Cloudflare Tunnel for public access.
                  </p>
                </div>
              </button>

              {/* Deploy to DigitalOcean */}
              <div className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-border text-center opacity-50 cursor-not-allowed relative">
                <Badge
                  variant="secondary"
                  className="absolute top-3 right-3 text-xs"
                >
                  Coming soon
                </Badge>
                <Cloud className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">Deploy to DigitalOcean</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    One-click cloud deployment. Always on, no tunnel needed.
                  </p>
                </div>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={() => setStep(3)}
              disabled={!deploymentChoice}
            >
              Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 3 - Setup Guide + LLM Prompt */}
      {step === 3 && (
        <div className="space-y-6">
          {/* Cloudflare Tunnel Setup */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Cloudflare Tunnel Setup
              </CardTitle>
              <CardDescription>
                Set up a secure tunnel so visitors&apos; browsers can reach your
                local analytics API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Detected tunnel URL */}
              {detectedTunnelUrl && (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950 p-4 text-sm">
                  <p className="font-medium text-emerald-800 dark:text-emerald-200">
                    Tunnel URL detected from your configuration
                  </p>
                  <p className="mt-1 text-emerald-700 dark:text-emerald-300 font-mono">
                    {detectedTunnelUrl}
                  </p>
                  <p className="mt-2 text-muted-foreground">
                    Your tunnel appears to be configured already. You can skip
                    the guide below and continue.
                  </p>
                </div>
              )}

              {/* Why do I need this? */}
              <div className="rounded-md border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950 p-4 text-sm">
                <p className="font-medium">Why do I need this?</p>
                <p className="mt-1 text-muted-foreground">
                  The tracking script runs in your visitors&apos; browsers, so
                  it needs a publicly reachable URL to send analytics data back
                  to your API. A Cloudflare Tunnel creates a secure connection
                  from your local machine to Cloudflare&apos;s network - no open
                  ports or static IP required.
                </p>
              </div>

              {/* Collapsible steps */}
              <div className="space-y-2">
                {SETUP_STEPS.map((guideStep, index) => (
                  <div key={index} className="border rounded-lg">
                    <button
                      type="button"
                      onClick={() => toggleStep(index)}
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors"
                    >
                      <span className="flex-shrink-0 h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {guideStep.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {guideStep.description}
                        </p>
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-muted-foreground transition-transform flex-shrink-0",
                          expandedSteps.has(index) && "rotate-180"
                        )}
                      />
                    </button>
                    {expandedSteps.has(index) && (
                      <div className="px-3 pb-3 pl-12">
                        {guideStep.content(copiedId, handleCopy)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Setup Assistant Prompt */}
          <Card>
            <button
              type="button"
              onClick={() => setLlmPromptExpanded(!llmPromptExpanded)}
              className="w-full text-left"
            >
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    AI Setup Assistant Prompt
                  </CardTitle>
                  <CardDescription>
                    Copy this prompt into ChatGPT or Claude for guided help
                  </CardDescription>
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform flex-shrink-0",
                    llmPromptExpanded && "rotate-180"
                  )}
                />
              </CardHeader>
            </button>
            {llmPromptExpanded && (
              <CardContent>
                <CodeBlock
                  code={LLM_SETUP_PROMPT}
                  id="llm-prompt"
                  copiedId={copiedId}
                  onCopy={handleCopy}
                />
              </CardContent>
            )}
          </Card>

          {/* Tunnel URL Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your Tunnel URL</CardTitle>
              <CardDescription>
                Enter the public URL where your OpenAnalytics API is reachable
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tunnel-url">Tunnel URL</Label>
                <Input
                  id="tunnel-url"
                  placeholder="https://analytics.yourdomain.com"
                  value={tunnelUrl}
                  onChange={(e) => setTunnelUrl(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                onClick={() => setStep(4)}
                disabled={!tunnelUrl.trim()}
              >
                Continue
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 4 - Install Tracking Script */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Install Tracking Script</CardTitle>
            <CardDescription>
              Add this snippet to your website&apos;s &lt;head&gt; tag
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-md bg-muted font-mono text-sm break-all">
              {scriptTag}
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleCopyScript}
            >
              {copiedId === "script-tag" ? (
                <>
                  <Check className="mr-2 h-4 w-4" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" /> Copy Script
                </>
              )}
            </Button>
            <Button className="w-full" onClick={() => setStep(5)}>
              I&apos;ve Added the Script
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 5 - Done */}
      {step === 5 && (
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Check className="h-6 w-6 text-emerald-500" />
            </div>
            <CardTitle>You&apos;re all set!</CardTitle>
            <CardDescription>
              {siteName || domain} is now being tracked
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() => {
                clearWizardState();
                window.location.href = "/dashboard";
              }}
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
