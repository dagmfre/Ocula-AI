"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";

interface Platform {
  id: string;
  platformName: string;
  platformUrl: string;
  contactName: string;
  contactRole: string;
  companySize: string;
  industry: string;
  useCase: string | null;
  createdAt: string;
}

interface PlatformDocument {
  id: string;
  platformId: string;
  type: "pdf" | "image" | "markdown";
  cloudinaryUrl: string;
  filename: string;
  sizeBytes: number;
  analysis: string | null;
  createdAt: string;
}

const FILE_TYPE_ICONS: Record<string, string> = {
  pdf: "📄",
  image: "🖼️",
  markdown: "📝",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [loadingPlatform, setLoadingPlatform] = useState(true);
  const [copied, setCopied] = useState(false);
  const [documents, setDocuments] = useState<PlatformDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPlatform = useCallback(async () => {
    try {
      const res = await fetch("/api/platform");
      const data = await res.json();
      if (data.platform) {
        setPlatform(data.platform);
      } else {
        // No platform, redirect to onboarding
        router.push("/onboarding");
        return;
      }
    } catch {
      // on error, still try onboarding
    } finally {
      setLoadingPlatform(false);
    }
  }, [router]);

  useEffect(() => {
    if (!isPending && session) {
      fetchPlatform();
    }
  }, [isPending, session, fetchPlatform]);

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      if (data.documents) setDocuments(data.documents);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (platform) fetchDocuments();
  }, [platform, fetchDocuments]);

  // Upload handler
  const handleUpload = async (files: FileList | File[]) => {
    if (!files.length || uploading) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const data = await res.json();
          alert(data.error ?? "Upload failed");
        }
      } catch {
        alert(`Failed to upload ${file.name}`);
      }
    }

    setUploading(false);
    fetchDocuments();
  };

  // Delete handler
  const handleDeleteDocument = async (docId: string) => {
    if (!confirm("Delete this document?")) return;
    try {
      await fetch(`/api/documents?id=${docId}`, { method: "DELETE" });
      fetchDocuments();
    } catch {
      alert("Failed to delete document");
    }
  };

  // Drag handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) handleUpload(e.dataTransfer.files);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const embedScript = platform
    ? `<script src="https://ocula.ai/widget.js"\n  data-platform-id="${platform.id}"\n  data-server="wss://api.ocula.ai/ws">\n</script>`
    : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(embedScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isPending || loadingPlatform) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-[var(--muted-foreground)]">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--brand-purple)] border-t-transparent" />
          Loading…
        </div>
      </div>
    );
  }

  if (!platform) return null;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="glass-card rounded-2xl p-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold">
              Welcome back, {session?.user.name ?? "User"}!
            </h1>
            <p className="mt-1 text-[var(--muted-foreground)]">
              Manage your AI widget, upload knowledge, and view analytics.
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="shrink-0 rounded-xl border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-[var(--muted-foreground)] transition-all hover:border-red-500/40 hover:text-red-400"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Platform Overview */}
      <div className="glass-card rounded-2xl p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold">Platform Overview</h2>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Active
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Platform Name", value: platform.platformName },
            { label: "URL", value: platform.platformUrl },
            { label: "Industry", value: platform.industry },
            { label: "Company Size", value: platform.companySize },
            { label: "Contact", value: `${platform.contactName} (${platform.contactRole})` },
            { label: "Created", value: new Date(platform.createdAt).toLocaleDateString() },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-[var(--border)] bg-[var(--secondary)] p-4">
              <p className="mb-1 text-xs text-[var(--muted-foreground)]">{item.label}</p>
              <p className="text-sm font-medium truncate" title={item.value}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Support Sessions", value: "0", icon: "💬", change: "—" },
          { label: "Queries Handled", value: "0", icon: "🔍", change: "—" },
          { label: "Avg. Resolution", value: "—", icon: "⚡", change: "—" },
          { label: "User Satisfaction", value: "—", icon: "⭐", change: "—" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="glass-card glass-card-hover rounded-xl p-6 transition-all"
          >
            <div className="mb-3 text-2xl">{stat.icon}</div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-[var(--muted-foreground)]">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Embed Script Section */}
      <div className="glass-card rounded-2xl p-8">
        <h2 className="mb-2 text-lg font-bold">Embed Script</h2>
        <p className="mb-4 text-sm text-[var(--muted-foreground)]">
          Add this script tag to your SaaS platform to enable the Ocula AI widget.
          Your platform ID is <code className="rounded bg-[var(--secondary)] px-1.5 py-0.5 text-xs text-[var(--brand-purple-light)]">{platform.id}</code>.
        </p>
        <div className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--secondary)]">
          <pre className="overflow-x-auto p-4 text-sm">
            <code className="text-[var(--brand-purple-light)]">{embedScript}</code>
          </pre>
          <button
            onClick={handleCopy}
            className="absolute right-3 top-3 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] transition-all hover:text-white"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* Knowledge Base — File Upload */}
      <div className="glass-card rounded-2xl p-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Knowledge Base</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Upload documents and screenshots to train your AI assistant on your platform.
            </p>
          </div>
          <span className="rounded-full bg-[var(--secondary)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)]">
            {documents.length} file{documents.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex h-36 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
            dragOver
              ? "border-[var(--brand-purple)] bg-[var(--brand-purple)]/5"
              : "border-[var(--border)] hover:border-[var(--brand-purple)]/30"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.webp,.md"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) handleUpload(e.target.files);
              e.target.value = "";
            }}
          />
          {uploading ? (
            <div className="flex items-center gap-3 text-[var(--muted-foreground)]">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--brand-purple)] border-t-transparent" />
              Uploading…
            </div>
          ) : (
            <div className="text-center text-[var(--muted-foreground)]">
              <p className="text-sm font-medium">
                {dragOver ? "Drop files to upload" : "Drop files here or click to upload"}
              </p>
              <p className="mt-1 text-xs opacity-60">
                PDF, PNG, JPG, WEBP, MD — up to 10 MB each
              </p>
            </div>
          )}
        </div>

        {/* Document list */}
        {documents.length > 0 && (
          <div className="mt-4 space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-3 transition-colors hover:border-[var(--brand-purple)]/20"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="text-lg">{FILE_TYPE_ICONS[doc.type] ?? "📎"}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium" title={doc.filename}>
                      {doc.filename}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {formatFileSize(doc.sizeBytes)} · {doc.type.toUpperCase()} · {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <a
                    href={doc.cloudinaryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] transition-all hover:text-white"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View
                  </a>
                  <button
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] transition-all hover:border-red-500/40 hover:text-red-400"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
