"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function SiteSettingsPage() {
  const { siteId } = useParams();
  const [siteName, setSiteName] = useState("Acme Corp");
  const [domain, setDomain] = useState("acme.com");

  const scriptTag = `<script defer data-site="${siteId}" src="https://cdn.openanalytics.dev/oa.js"></script>`;

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Site Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your site configuration</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Site Name</Label>
            <Input id="name" value={siteName} onChange={(e) => setSiteName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="domain">Domain</Label>
            <Input id="domain" value={domain} onChange={(e) => setDomain(e.target.value)} />
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tracking Script</CardTitle>
          <CardDescription>Add this script to your website&apos;s &lt;head&gt; tag</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-md bg-muted font-mono text-sm break-all">{scriptTag}</div>
          <Button variant="outline" className="mt-3" onClick={() => navigator.clipboard.writeText(scriptTag)}>
            Copy to Clipboard
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Auto-Track Rules</CardTitle>
          <CardDescription>Automatically track clicks on elements matching CSS selectors</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href={`/dashboard/${siteId}/settings/tracking`}>
            <Button variant="outline">Manage Tracking Rules</Button>
          </Link>
        </CardContent>
      </Card>

      <Separator />

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete Site</p>
              <p className="text-sm text-muted-foreground">Permanently delete this site and all its data</p>
            </div>
            <Button variant="destructive">Delete Site</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
