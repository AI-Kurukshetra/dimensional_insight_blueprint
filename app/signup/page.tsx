import type { Metadata } from "next";
import Link from "next/link";
import { signUp } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = {
  title: "HealthScope | Sign up",
  description: "Create a HealthScope account."
};

export default function SignupPage({
  searchParams
}: {
  searchParams: { message?: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <Card className="w-full max-w-xl rounded-[2rem] border-0 shadow-2xl shadow-cyan-950/20">
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>
            Account creation is handled by Supabase Auth. A profile is created automatically and the user is assigned to the default seeded organization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {searchParams.message ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {searchParams.message}
            </div>
          ) : null}
          <form className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full name</label>
              <Input name="full_name" type="text" placeholder="Avery Morgan" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Job title</label>
              <Input name="title" type="text" placeholder="Vice President, Analytics" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input name="password" type="password" minLength={6} required />
            </div>
            <Button formAction={signUp} className="w-full">
              Create account
            </Button>
          </form>
          <p className="text-sm text-muted-foreground">
            Already registered?{" "}
            <Link href="/login" className="font-medium text-primary">
              Go to login
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
