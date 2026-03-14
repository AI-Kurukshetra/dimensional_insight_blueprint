import type { Metadata } from "next";
import Link from "next/link";
import { signIn, sendMagicLink } from "@/app/auth/actions";
import { hasSupabaseEnv } from "@/lib/env";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = {
  title: "HealthScope | Login",
  description: "Login to HealthScope Analytics Suite."
};

export default function LoginPage({
  searchParams
}: {
  searchParams: { message?: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <Card className="w-full max-w-xl rounded-[2rem] border-0 shadow-2xl shadow-cyan-950/20">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            {hasSupabaseEnv()
              ? "Use email/password or magic link authentication."
              : "Supabase is not configured. The example dashboard remains locally accessible in demo mode."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {searchParams.message ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {searchParams.message}
            </div>
          ) : null}

          <form className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input name="email" type="email" placeholder="you@healthscope.ai" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input name="password" type="password" minLength={6} required />
            </div>
            <Button formAction={signIn} className="w-full">
              Sign in with password
            </Button>
          </form>

          <div className="space-y-4">
            <div className="text-center text-sm text-muted-foreground">or</div>
            <form className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email for magic link</label>
                <Input name="email" type="email" placeholder="you@healthscope.ai" required />
              </div>
              <Button formAction={sendMagicLink} variant="outline" className="w-full">
                Send magic link
              </Button>
            </form>
          </div>

          <p className="text-sm text-muted-foreground">
            Need an account?{" "}
            <Link href="/signup" className="font-medium text-primary">
              Create one here
            </Link>
            .
          </p>

          {hasSupabaseEnv() ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-700">
              Demo sign-in: <span className="font-medium">michael.thompson@evergreenmedical.com</span> /{" "}
              <span className="font-medium">HealthScope@123</span>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
