"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";

const companySizes = [
  { value: "1-10", label: "1–10 employees" },
  { value: "11-50", label: "11–50 employees" },
  { value: "51-200", label: "51–200 employees" },
  { value: "200+", label: "200+ employees" },
];

const industries = [
  "SaaS / Software",
  "E-commerce",
  "FinTech",
  "HealthTech",
  "EdTech",
  "Marketing / AdTech",
  "HR / Recruiting",
  "Logistics / Supply Chain",
  "Real Estate",
  "Other",
];

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [form, setForm] = useState({
    platformName: "",
    platformUrl: "",
    contactName: "",
    contactRole: "",
    companySize: "",
    industry: "",
    useCase: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 2 steps

  const updateField = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("An unexpected error occurred.");
      setLoading(false);
    }
  };

  if (isPending) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-[var(--muted-foreground)]">Loading...</div>
      </div>
    );
  }

  const canAdvance =
    step === 1
      ? form.platformName.trim() && form.platformUrl.trim()
      : form.contactName.trim() &&
        form.contactRole.trim() &&
        form.companySize &&
        form.industry;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <div className="text-center">
        <Link href="/" className="mb-6 inline-flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-purple)]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="4" />
            </svg>
          </div>
          <span className="text-xl font-bold">Ocula AI</span>
        </Link>
        <h1 className="text-3xl font-bold">Set up your platform</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          Tell us about your SaaS product so we can tailor the AI assistant to your users.
        </p>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--secondary)]">
            <div
              className="h-full rounded-full bg-[var(--brand-purple)] transition-all duration-500"
              style={{ width: step === 1 ? "50%" : "100%" }}
            />
          </div>
        </div>
        <span className="text-xs text-[var(--muted-foreground)]">Step {step} of 2</span>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit}>
        <div className="glass-card rounded-2xl p-8">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Platform Details</h2>

              {/* Platform Name */}
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Platform Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.platformName}
                  onChange={(e) => updateField("platformName", e.target.value)}
                  placeholder="e.g. Acme CRM"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-3 text-sm transition-colors focus:border-[var(--brand-purple)] focus:outline-none"
                  required
                />
              </div>

              {/* Platform URL */}
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Platform URL <span className="text-red-400">*</span>
                </label>
                <input
                  type="url"
                  value={form.platformUrl}
                  onChange={(e) => updateField("platformUrl", e.target.value)}
                  placeholder="https://your-platform.com"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-3 text-sm transition-colors focus:border-[var(--brand-purple)] focus:outline-none"
                  required
                />
              </div>

              {/* Use Case (optional) */}
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Use Case <span className="text-[var(--muted-foreground)]">(optional)</span>
                </label>
                <textarea
                  value={form.useCase}
                  onChange={(e) => updateField("useCase", e.target.value)}
                  placeholder="Describe how you'd like to use the Ocula widget..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-3 text-sm transition-colors focus:border-[var(--brand-purple)] focus:outline-none"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Contact & Company</h2>

              {/* Contact Name */}
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Contact Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.contactName}
                  onChange={(e) => updateField("contactName", e.target.value)}
                  placeholder={session?.user.name ?? "Your full name"}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-3 text-sm transition-colors focus:border-[var(--brand-purple)] focus:outline-none"
                  required
                />
              </div>

              {/* Contact Role */}
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Your Role <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.contactRole}
                  onChange={(e) => updateField("contactRole", e.target.value)}
                  placeholder="e.g. CTO, Product Manager, Founder"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-3 text-sm transition-colors focus:border-[var(--brand-purple)] focus:outline-none"
                  required
                />
              </div>

              {/* Company Size */}
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Company Size <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {companySizes.map((size) => (
                    <button
                      key={size.value}
                      type="button"
                      onClick={() => updateField("companySize", size.value)}
                      className={`rounded-xl border px-4 py-3 text-sm transition-all ${
                        form.companySize === size.value
                          ? "border-[var(--brand-purple)] bg-[var(--brand-purple)]/10 text-[var(--brand-purple-light)]"
                          : "border-[var(--border)] bg-[var(--secondary)] text-[var(--muted-foreground)] hover:border-[var(--brand-purple)]/40"
                      }`}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Industry */}
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Industry <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.industry}
                  onChange={(e) => updateField("industry", e.target.value)}
                  className="w-full appearance-none rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-3 text-sm transition-colors focus:border-[var(--brand-purple)] focus:outline-none"
                  required
                >
                  <option value="">Select industry…</option>
                  {industries.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex items-center justify-between">
            {step === 2 ? (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-xl border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-[var(--muted-foreground)] transition-all hover:text-white"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {step === 1 ? (
              <button
                type="button"
                disabled={!canAdvance}
                onClick={() => setStep(2)}
                className="rounded-xl bg-[var(--brand-purple)] px-8 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[var(--brand-purple-light)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                disabled={!canAdvance || loading}
                className="rounded-xl bg-[var(--brand-purple)] px-8 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[var(--brand-purple-light)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Setting up…" : "Complete Setup"}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
