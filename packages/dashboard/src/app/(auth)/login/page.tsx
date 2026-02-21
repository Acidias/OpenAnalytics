"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Activity } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-8">
          <Activity className="h-8 w-8" />
          <span className="font-bold text-2xl">OpenAnalytics</span>
        </Link>
      </div>

      <Card>
        <CardHeader className="text-center">
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full" onClick={() => {}}>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            Continue with GitHub
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><Separator /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={() => {}}>Sign in with Email</Button>
        </CardFooter>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}
