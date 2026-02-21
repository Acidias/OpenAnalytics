"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function AccountSettingsPage() {
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john@example.com");

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button>Save Profile</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">API Key</CardTitle>
          <CardDescription>Use this key to access the OpenAnalytics API</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Input value="oa_live_sk_1234567890abcdef" readOnly className="font-mono" />
            <Button variant="outline">Regenerate</Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
            </div>
            <Button variant="destructive">Delete Account</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
