"use server";

import { redirect } from "next/navigation";
import { ensureUserOrganization } from "@/lib/auth/ensureUserOrganization";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";

function getField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getActionErrorMessage(error: unknown, fallback: string) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";

  if (!message) {
    return fallback;
  }

  if (/fetch failed|Failed to fetch|EAI_AGAIN|ENOTFOUND|ECONNREFUSED|ECONNRESET/i.test(message)) {
    return "Unable to reach Supabase Auth. Check NEXT_PUBLIC_SUPABASE_URL and API keys, then retry.";
  }

  return message;
}

export async function signIn(formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirect("/dashboard");
  }

  const supabase = (await createClient()) as any;
  let signInError: { message?: string } | null = null;

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: getField(formData, "email"),
      password: getField(formData, "password")
    });
    signInError = error;
  } catch (error) {
    const message = getActionErrorMessage(
      error,
      "Unable to sign in right now. Please try again."
    );
    redirect(`/login?message=${encodeURIComponent(message)}`);
  }

  if (signInError) {
    redirect(`/login?message=${encodeURIComponent(signInError.message ?? "Unable to sign in.")}`);
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    await ensureUserOrganization({
      supabase,
      user: {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata
      }
    })
      .then(() => null)
      .catch(() => null);

    redirect("/api/setup-user");
  }

  redirect("/login?message=Unable to assign organization. Please contact support.");
}

export async function signUp(formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirect("/signup?message=Configure Supabase to enable account creation.");
  }

  const fullName = getField(formData, "full_name").trim();
  const title = getField(formData, "title").trim();

  const supabase = (await createClient()) as any;
  let signUpError: { message?: string } | null = null;
  let signedUpUser:
    | {
        id: string;
        email?: string | null;
        user_metadata?: Record<string, unknown> | null;
      }
    | null = null;

  try {
    const { data, error } = await supabase.auth.signUp({
      email: getField(formData, "email"),
      password: getField(formData, "password"),
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback?next=/dashboard`,
        data: {
          ...(fullName ? { full_name: fullName } : {}),
          ...(title ? { title } : {})
        }
      }
    });
    signedUpUser = data?.user
      ? {
          id: data.user.id,
          email: data.user.email,
          user_metadata: data.user.user_metadata
        }
      : null;
    signUpError = error;
  } catch (error) {
    const message = getActionErrorMessage(
      error,
      "Unable to create account right now. Please try again."
    );
    redirect(`/signup?message=${encodeURIComponent(message)}`);
  }

  if (signUpError) {
    redirect(`/signup?message=${encodeURIComponent(signUpError.message ?? "Unable to create account.")}`);
  }

  // Best-effort provisioning for projects that require explicit organization bootstrap.
  if (signedUpUser) {
    await ensureUserOrganization({
      supabase,
      user: signedUpUser
    })
      .then(() => null)
      .catch(() => null);
  }

  redirect("/signup?message=Account created. Check your email if confirmation is enabled, then sign in.");
}

export async function sendMagicLink(formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirect("/login?message=Configure Supabase to enable magic link login.");
  }

  const supabase = (await createClient()) as any;
  const email = getField(formData, "email");
  let magicLinkError: { message?: string } | null = null;

  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback?next=/dashboard`
      }
    });
    magicLinkError = error;
  } catch (error) {
    const message = getActionErrorMessage(
      error,
      "Unable to send magic link right now. Please try again."
    );
    redirect(`/login?message=${encodeURIComponent(message)}`);
  }

  if (magicLinkError) {
    redirect(`/login?message=${encodeURIComponent(magicLinkError.message ?? "Unable to send magic link.")}`);
  }

  redirect("/login?message=Magic link sent. Check your inbox.");
}
