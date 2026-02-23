"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Check, Copy } from "lucide-react";
import { api } from "@/lib/api";
import { getScriptTag } from "@/lib/script-tag";

interface Site {
  id: string;
  domain: string;
  name: string | null;
  public_id: string;
}

export default function SiteSettingsPage() {
  const { siteId } = useParams();
  const router = useRouter();
  const [site, setSite] = useState<Site | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [siteName, setSiteName] = useState("");
  const [domain, setDomain] = useState("");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.sites
      .get(siteId as string)
      .then((data) => {
        const s = (data as { site: Site }).site;
        setSite(s);
        setSiteName(s.name || "");
        setDomain(s.domain);
      })
      .catch(() => {
        setError("Failed to load site settings");
      });
  }, [siteId]);

  const scriptTag = site ? getScriptTag(site.public_id) : "";

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.sites.update(siteId as string, { name: siteName, domain });
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptTag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.sites.delete(siteId as string);
      router.push("/settings");
    } catch {
      setDeleting(false);
    }
  };

  if (error) {
    return <p className="text-destructive">{error}</p>;
  }

  if (!site) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Site Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your site configuration
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Site Name</Label>
            <Input
              id="name"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="domain">Domain</Label>
            <Input
              id="domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            />
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tracking Script</CardTitle>
          <CardDescription>
            Add this script to your website&apos;s &lt;head&gt; tag
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-md bg-muted font-mono text-sm break-all">
            {scriptTag}
          </div>
          <Button variant="outline" className="mt-3" onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" /> Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" /> Copy to Clipboard
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Auto-Track Rules</CardTitle>
          <CardDescription>
            Automatically track clicks on elements matching CSS selectors
          </CardDescription>
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
          <CardTitle className="text-base text-destructive">
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete Site</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete this site and all its data
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={deleting}>
                  {deleting ? "Deleting..." : "Delete Site"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {site.name || site.domain}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the site and all its analytics
                    data. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={handleDelete}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
