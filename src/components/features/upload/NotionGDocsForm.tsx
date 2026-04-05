"use client";

import { useState } from "react";
import { BookOpen, FileText, Loader2, CheckCircle2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

type Tab = "gdocs" | "notion";

export default function NotionGDocsForm() {
  const [tab, setTab] = useState<Tab>("gdocs");

  // Google Docs state
  const [gdocsUrl, setGdocsUrl] = useState("");
  const [gdocsLoading, setGdocsLoading] = useState(false);
  const [gdocsDone, setGdocsDone] = useState(false);

  // Notion state
  const [notionToken, setNotionToken] = useState("");
  const [notionPageId, setNotionPageId] = useState("");
  const [notionLoading, setNotionLoading] = useState(false);
  const [notionDone, setNotionDone] = useState(false);

  const handleGDocsImport = async () => {
    if (!gdocsUrl.trim()) return;
    setGdocsLoading(true);
    setGdocsDone(false);
    try {
      const res = await fetch("/api/documents/import-gdocs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: gdocsUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Import failed"); return; }
      setGdocsDone(true);
      toast.success("Google Doc imported successfully!");
      setTimeout(() => { setGdocsUrl(""); setGdocsDone(false); }, 2000);
    } catch {
      toast.error("Import failed. Please try again.");
    } finally {
      setGdocsLoading(false);
    }
  };

  const handleNotionImport = async () => {
    if (!notionToken.trim() || !notionPageId.trim()) return;
    setNotionLoading(true);
    setNotionDone(false);
    try {
      const res = await fetch("/api/documents/import-notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: notionToken.trim(), pageId: notionPageId.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Import failed"); return; }
      setNotionDone(true);
      toast.success("Notion page imported successfully!");
      setTimeout(() => { setNotionToken(""); setNotionPageId(""); setNotionDone(false); }, 2000);
    } catch {
      toast.error("Import failed. Please try again.");
    } finally {
      setNotionLoading(false);
    }
  };

  const inputClass = "w-full rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm focus:border-amber-500/40 focus:outline-none focus:ring-2 focus:ring-amber-500/10 placeholder:text-muted-foreground/40";
  const btnClass = "w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_2px_10px_oklch(0.76_0.17_62_/_25%)] transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="rounded-2xl border-2 border-dashed border-border/60 bg-card transition-all duration-300">
      <div className="flex flex-col gap-5 px-8 py-8">
        {/* Tab toggle */}
        <div className="grid grid-cols-2 gap-2">
          {([
            { id: "gdocs" as Tab, label: "Google Docs", icon: FileText },
            { id: "notion" as Tab, label: "Notion", icon: BookOpen },
          ]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                tab === id
                  ? "border-amber-500/35 bg-amber-500/[0.06] text-foreground shadow-[0_0_0_1px_oklch(0.76_0.17_62_/_12%)]"
                  : "border-border/50 bg-muted/30 text-muted-foreground hover:border-border hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Google Docs section */}
        {tab === "gdocs" && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-base font-semibold text-foreground">Import from Google Docs</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Paste the share link to your document
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="url"
                value={gdocsUrl}
                onChange={e => setGdocsUrl(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleGDocsImport()}
                placeholder="https://docs.google.com/document/d/..."
                className={inputClass}
              />

              <p className="text-xs text-muted-foreground/50 text-center">
                The document must be shared publicly — "Anyone with the link can view"
              </p>

              <button
                onClick={handleGDocsImport}
                disabled={gdocsLoading || !gdocsUrl.trim() || gdocsDone}
                className={btnClass}
              >
                {gdocsDone ? (
                  <><CheckCircle2 className="h-4 w-4" /> Imported!</>
                ) : gdocsLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Importing…</>
                ) : (
                  <><FileText className="h-4 w-4" /> Import Document</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Notion section */}
        {tab === "notion" && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-base font-semibold text-foreground">Import from Notion</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Requires a Notion integration token
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">Integration Token</label>
                  <a
                    href="https://www.notion.so/my-integrations"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    Get your token
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <input
                  type="password"
                  value={notionToken}
                  onChange={e => setNotionToken(e.target.value)}
                  placeholder="secret_..."
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Page ID</label>
                <input
                  type="text"
                  value={notionPageId}
                  onChange={e => setNotionPageId(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleNotionImport()}
                  placeholder="32-character ID from the page URL"
                  className={inputClass}
                />
              </div>

              <p className="text-xs text-muted-foreground/50 text-center">
                Share your Notion page with your integration first
              </p>

              <button
                onClick={handleNotionImport}
                disabled={notionLoading || !notionToken.trim() || !notionPageId.trim() || notionDone}
                className={btnClass}
              >
                {notionDone ? (
                  <><CheckCircle2 className="h-4 w-4" /> Imported!</>
                ) : notionLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Importing…</>
                ) : (
                  <><BookOpen className="h-4 w-4" /> Import Page</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
