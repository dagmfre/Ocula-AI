import { auth } from "@/lib/auth";
import { getPlatformByUserId } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  // Check onboarding status — redirect to onboarding if no platform
  const platform = getPlatformByUserId(session.user.id);
  const pathname =
    (await headers()).get("x-next-pathname") ?? "";

  // If user has no platform and is NOT on the onboarding page, redirect there
  if (!platform && !pathname.includes("/onboarding")) {
    // We can't reliably get pathname from headers in all cases,
    // so we pass the platform status to the client via a data attribute
  }

  return (
    <div className="min-h-screen bg-[var(--background)]" data-has-platform={platform ? "true" : "false"}>
      {/* Dashboard Navbar */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[var(--background)]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand-purple)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="4" />
                </svg>
              </div>
              <span className="text-lg font-bold">Ocula AI</span>
            </a>
            {platform && (
              <span className="rounded-md bg-[var(--brand-purple)]/10 px-2 py-0.5 text-xs font-medium text-[var(--brand-purple-light)]">
                {platform.platformName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {platform && (
              <nav className="hidden items-center gap-6 md:flex">
                <a href="/dashboard" className="text-sm text-[var(--muted-foreground)] transition-colors hover:text-white">
                  Dashboard
                </a>
              </nav>
            )}
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-purple)]/20 text-sm font-medium text-[var(--brand-purple-light)]">
                {session.user.name?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium">{session.user.name}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{session.user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
