import type { LoggedInUserProfile } from "@/lib/getUserProfile";

function formatLastLogin(lastLoginAt: string | null) {
  if (!lastLoginAt) {
    return "Not available";
  }

  return new Date(lastLoginAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

export function UserProfileCard({
  profile,
  fallbackOrganizationName
}: {
  profile: LoggedInUserProfile | null;
  fallbackOrganizationName: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
        User Profile
      </p>
      <h3 className="mt-2 text-2xl font-semibold">
        {profile ? `Welcome ${profile.name}` : "Welcome"}
      </h3>
      <div className="mt-3 space-y-1 text-sm text-slate-700">
        <p>Email: {profile?.email ?? "Not available"}</p>
        <p>Role: {profile?.role ?? "Not available"}</p>
        <p>Organization: {profile?.organizationName ?? fallbackOrganizationName}</p>
        <p>Last login: {formatLastLogin(profile?.lastLoginAt ?? null)}</p>
      </div>
    </div>
  );
}
