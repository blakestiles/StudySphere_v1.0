import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import CheatSheet from "@/models/CheatSheet";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default async function CheatSheetPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  await connectDB();

  const sheet = await CheatSheet.findById(id).lean<{
    _id: unknown;
    userId: { toString(): string };
    title: string;
    content: string;
    createdAt: Date;
  }>();

  if (!sheet) notFound();
  if (sheet.userId.toString() !== session.user.id) notFound();

  const dateStr = new Date(sheet.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Georgia, serif; color: #111; background: #fff; }
        .wrapper { max-width: 800px; margin: 0 auto; padding: 2rem 2.5rem; }
        .meta { margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 2px solid #111; }
        .meta h1 { font-size: 1.75rem; font-weight: 700; line-height: 1.2; }
        .meta p { font-size: 0.85rem; color: #555; margin-top: 0.25rem; }
        .content h1 { font-size: 1.5rem; font-weight: 700; margin: 1.5rem 0 0.5rem; }
        .content h2 { font-size: 1.2rem; font-weight: 700; margin: 1.25rem 0 0.4rem; border-bottom: 1px solid #ccc; padding-bottom: 0.2rem; }
        .content h3 { font-size: 1rem; font-weight: 700; margin: 1rem 0 0.3rem; }
        .content p { font-size: 0.9rem; line-height: 1.6; margin-bottom: 0.5rem; }
        .content ul, .content ol { margin: 0.4rem 0 0.75rem 1.4rem; }
        .content li { font-size: 0.9rem; line-height: 1.55; margin-bottom: 0.2rem; }
        .content strong { font-weight: 700; }
        .content em { font-style: italic; }
        .content code { font-family: monospace; background: #f3f3f3; padding: 0.1em 0.3em; border-radius: 3px; font-size: 0.85em; }
        .content pre { background: #f3f3f3; padding: 0.75rem; border-radius: 4px; overflow-x: auto; margin-bottom: 0.75rem; }
        .content pre code { background: none; padding: 0; }
        .content table { border-collapse: collapse; width: 100%; margin-bottom: 0.75rem; font-size: 0.85rem; }
        .content th, .content td { border: 1px solid #ccc; padding: 0.35rem 0.6rem; text-align: left; }
        .content th { background: #f5f5f5; font-weight: 700; }
        .content blockquote { border-left: 3px solid #ccc; padding-left: 0.75rem; color: #555; margin-bottom: 0.75rem; }
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
          .wrapper { padding: 0.5rem 1rem; }
          .content h2 { page-break-after: avoid; }
          .content ul, .content ol { page-break-inside: avoid; }
        }
      `}</style>

      <script
        dangerouslySetInnerHTML={{
          __html: `document.addEventListener("DOMContentLoaded", function() { setTimeout(window.print, 300); });`,
        }}
      />

      <div className="no-print" style={{ background: "#f59e0b", color: "#fff", padding: "0.5rem 1rem", fontSize: "0.8rem", textAlign: "center" }}>
        Print dialog will open automatically. Close this tab when done.
      </div>

      <div className="wrapper">
        <div className="meta">
          <h1>{sheet.title}</h1>
          <p>Generated {dateStr} · StudySphere</p>
        </div>
        <div className="content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{sheet.content}</ReactMarkdown>
        </div>
      </div>
    </>
  );
}
