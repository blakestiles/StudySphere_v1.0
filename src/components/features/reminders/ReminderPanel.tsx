"use client";

import { useState } from "react";
import {
  RotateCw,
  AlertCircle,
  Clock,
  Trophy,
  Bell,
  Eye,
  RefreshCw,
  CheckCheck,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Reminder {
  _id: string;
  type: string;
  message: string;
  read: boolean;
  triggerDate: string;
  createdAt: string;
}

interface ReminderPanelProps {
  reminders: Reminder[];
  onRefresh: () => Promise<void>;
  onClose: () => void;
}

const typeIcons: Record<string, React.ReactNode> = {
  review_due: <RotateCw className="h-4 w-4 text-orange-500" />,
  inactive_topic: <AlertCircle className="h-4 w-4 text-yellow-500" />,
  exam_countdown: <Clock className="h-4 w-4 text-blue-500" />,
  goal_deadline: <Trophy className="h-4 w-4 text-purple-500" />,
  general: <Bell className="h-4 w-4 text-muted-foreground" />,
};

export default function ReminderPanel({
  reminders,
  onRefresh,
  onClose,
}: ReminderPanelProps) {
  const [generating, setGenerating] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const markRead = async (id: string) => {
    try {
      await fetch(`/api/reminders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      });
      await onRefresh();
    } catch {
      toast.error("Failed to mark as read");
    }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      const unread = reminders.filter((r) => !r.read);
      await Promise.all(
        unread.map((r) =>
          fetch(`/api/reminders/${r._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ read: true }),
          })
        )
      );
      await onRefresh();
    } catch {
      toast.error("Failed to mark all as read");
    } finally {
      setMarkingAll(false);
    }
  };

  const generateReminders = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/reminders/generate", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Generated ${data.created} new reminder${data.created !== 1 ? "s" : ""}`);
        await onRefresh();
      }
    } catch {
      toast.error("Failed to generate reminders");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border border-border bg-card shadow-xl z-50">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={markAllRead}
            disabled={markingAll}
            className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-xs"
            title="Mark all read"
          >
            {markingAll ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCheck className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {reminders.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          reminders.map((r) => (
            <div
              key={r._id}
              className={`flex items-start gap-3 p-3 border-b border-border/50 last:border-0 ${
                !r.read ? "bg-blue-500/5 border-l-2 border-l-blue-500" : ""
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {typeIcons[r.type] || typeIcons.general}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground leading-snug">{r.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                </p>
              </div>
              {!r.read && (
                <button
                  onClick={() => markRead(r._id)}
                  className="shrink-0 rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  title="Mark as read"
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <div className="p-3 border-t border-border">
        <button
          onClick={generateReminders}
          disabled={generating}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-3 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {generating ? "Generating..." : "Generate Reminders"}
        </button>
      </div>
    </div>
  );
}
