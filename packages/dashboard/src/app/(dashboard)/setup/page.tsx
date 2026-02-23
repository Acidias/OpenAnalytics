"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Copy, ExternalLink } from "lucide-react";

function CodeBlock({ code, id, copiedId, onCopy }: {
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
        {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}

export default function SetupGuidePage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Setup Guide</h1>
        <p className="text-muted-foreground mt-1">
          Connect your local OpenAnalytics instance to the public internet using a Cloudflare Tunnel
        </p>
      </div>

      <div className="rounded-md border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950 p-4 text-sm">
        <p className="font-medium">Why do I need this?</p>
        <p className="mt-1 text-muted-foreground">
          The tracking script runs in your visitors&apos; browsers, so it needs a publicly reachable URL to send
          analytics data back to your API. A Cloudflare Tunnel creates a secure connection from your local machine
          to Cloudflare&apos;s network - no open ports or static IP required.
        </p>
      </div>

      {/* Step 1 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Step 1 - Install cloudflared</CardTitle>
          <CardDescription>
            Install the Cloudflare Tunnel client on your machine
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm font-medium">macOS (Homebrew):</p>
          <CodeBlock code="brew install cloudflared" id="step1" copiedId={copiedId} onCopy={handleCopy} />
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
        </CardContent>
      </Card>

      {/* Step 2 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Step 2 - Authenticate with Cloudflare</CardTitle>
          <CardDescription>
            Log in to your Cloudflare account from the command line
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <CodeBlock code="cloudflared tunnel login" id="step2" copiedId={copiedId} onCopy={handleCopy} />
          <p className="text-sm text-muted-foreground">
            This opens your browser to authorise the tunnel client. Select the domain you want to
            use for analytics.
          </p>
          <div className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950 p-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Prerequisites</p>
            <ul className="mt-1 list-disc list-inside space-y-1">
              <li>A free Cloudflare account</li>
              <li>Your domain must be added to Cloudflare DNS</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Step 3 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Step 3 - Create a tunnel</CardTitle>
          <CardDescription>
            Create a named tunnel for your OpenAnalytics instance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <CodeBlock code="cloudflared tunnel create openanalytics" id="step3" copiedId={copiedId} onCopy={handleCopy} />
          <p className="text-sm text-muted-foreground">
            This generates a tunnel ID and credentials file. You can name the tunnel anything you like.
          </p>
        </CardContent>
      </Card>

      {/* Step 4 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Step 4 - Route DNS</CardTitle>
          <CardDescription>
            Point a subdomain at your tunnel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <CodeBlock
            code="cloudflared tunnel route dns openanalytics analytics.yourdomain.com"
            id="step4"
            copiedId={copiedId}
            onCopy={handleCopy}
          />
          <p className="text-sm text-muted-foreground">
            Replace <code className="bg-muted px-1 rounded">analytics.yourdomain.com</code> with your desired
            subdomain. This creates a CNAME record in your Cloudflare DNS that routes traffic to the tunnel.
          </p>
        </CardContent>
      </Card>

      {/* Step 5 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Step 5 - Configure environment variables</CardTitle>
          <CardDescription>
            Tell OpenAnalytics about your public URL
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Add these to your <code className="bg-muted px-1 rounded">.env</code> file in the project root:
          </p>
          <CodeBlock
            code={`# Public URL where the tracking script is served\nTRACKER_URL=https://analytics.yourdomain.com\n\n# Allow your website(s) to send data to the API\nCORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com`}
            id="step5"
            copiedId={copiedId}
            onCopy={handleCopy}
          />
          <p className="text-sm text-muted-foreground">
            <code className="bg-muted px-1 rounded">TRACKER_URL</code> sets the public-facing URL used in the
            script tag. <code className="bg-muted px-1 rounded">CORS_ORIGIN</code> accepts comma-separated
            origins that are allowed to send analytics data.
          </p>
        </CardContent>
      </Card>

      {/* Step 6 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Step 6 - Start the tunnel</CardTitle>
          <CardDescription>
            Connect your local API to Cloudflare&apos;s network
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <CodeBlock
            code="cloudflared tunnel run --url http://localhost:3101 openanalytics"
            id="step6"
            copiedId={copiedId}
            onCopy={handleCopy}
          />
          <p className="text-sm text-muted-foreground">
            Port <code className="bg-muted px-1 rounded">3101</code> is the default API port. Adjust if you have
            changed it. Keep this running in a separate terminal (or use a process manager).
          </p>
        </CardContent>
      </Card>

      {/* Step 7 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Step 7 - Rebuild and verify</CardTitle>
          <CardDescription>
            Restart the stack so the new environment variables take effect
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <CodeBlock code="docker compose up --build" id="step7" copiedId={copiedId} onCopy={handleCopy} />
          <p className="text-sm text-muted-foreground">
            Once running, open your site&apos;s Settings page and check that the tracking script tag shows
            your public tunnel URL (e.g.{" "}
            <code className="bg-muted px-1 rounded">https://analytics.yourdomain.com/oa.js</code>).
            Add the script tag to your website&apos;s <code className="bg-muted px-1 rounded">&lt;head&gt;</code> and
            check the Live view for incoming data.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
