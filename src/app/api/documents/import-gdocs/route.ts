import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Document from "@/models/Document";
import { TAGS } from "@/lib/data-cache";
import { extractTextFromPDF } from "@/lib/pdf";
import { readResponseBytesCapped, readResponseTextCapped } from "@/lib/fetch-utils";

const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function extractGDocsId(url: string): string | null {
  const m = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

function extractDriveFileId(url: string): string | null {
  const m = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let { url } = await request.json();
    if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;

    const driveFileId = extractDriveFileId(url);
    const docId = extractGDocsId(url);

    if (!docId && !driveFileId) {
      return NextResponse.json({ error: "Invalid Google Docs or Google Drive URL" }, { status: 400 });
    }

    let text: string;
    let title: string;

    if (docId) {
      // Google Docs — export as plain text
      const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
      const res = await fetch(exportUrl, {
        headers: { "User-Agent": BROWSER_UA, "Accept": "text/plain,text/html,*/*" },
        redirect: "follow",
      });
      if (!res.ok) {
        return NextResponse.json({
          error: "Could not access document. Make sure it's shared publicly ('Anyone with the link can view').",
        }, { status: 400 });
      }
      const contentType = res.headers.get("content-type") ?? "";
      text = await readResponseTextCapped(res);
      if (contentType.includes("text/html") || text.trimStart().startsWith("<!DOCTYPE") || text.trimStart().startsWith("<html")) {
        return NextResponse.json({
          error: "Could not access document. Make sure it's shared publicly ('Anyone with the link can view').",
        }, { status: 400 });
      }
      if (!text.trim()) return NextResponse.json({ error: "Document appears to be empty" }, { status: 400 });
      const firstLine = text.split("\n").find((l) => l.trim().length > 0)?.trim();
      title = firstLine && firstLine.length <= 120
        ? firstLine
        : `Google Docs Import (${new Date().toLocaleDateString()})`;
    } else {
      // Google Drive file — download directly
      const downloadUrl = `https://drive.google.com/uc?export=download&id=${driveFileId}`;
      const res = await fetch(downloadUrl, {
        headers: { "User-Agent": BROWSER_UA, "Accept": "*/*" },
        redirect: "follow",
      });
      if (!res.ok) {
        return NextResponse.json({
          error: "Could not download file. Make sure it's shared publicly ('Anyone with the link can view').",
        }, { status: 400 });
      }
      const contentType = res.headers.get("content-type") ?? "";

      if (contentType.includes("application/pdf")) {
        const bytes = await readResponseBytesCapped(res);
        text = await extractTextFromPDF(Buffer.from(bytes));
        if (!text.trim()) return NextResponse.json({ error: "Could not extract text from PDF" }, { status: 400 });
      } else if (contentType.includes("text/plain")) {
        text = await readResponseTextCapped(res);
        if (!text.trim()) return NextResponse.json({ error: "File appears to be empty" }, { status: 400 });
      } else if (contentType.includes("text/html")) {
        return NextResponse.json({
          error: "Could not access file. Make sure it's shared publicly ('Anyone with the link can view').",
        }, { status: 400 });
      } else {
        return NextResponse.json({
          error: `Unsupported file type (${contentType.split(";")[0].trim()}). Only PDF and plain text files are supported.`,
        }, { status: 400 });
      }

      const firstLine = text.split("\n").find((l) => l.trim().length > 0)?.trim();
      title = firstLine && firstLine.length <= 120
        ? firstLine
        : `Google Drive Import (${new Date().toLocaleDateString()})`;
    }

    await connectDB();
    const doc = await Document.create({
      userId: session.user.id, title,
      fileType: "gdocs", rawText: text.slice(0, 200_000), status: "ready",
    });

    revalidateTag(TAGS.documents(session.user.id));
    revalidateTag(TAGS.dashboard(session.user.id));
    return NextResponse.json({ message: "Google Doc imported successfully", document: doc }, { status: 201 });
  } catch (error: any) {
    console.error("Google Docs import error:", error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
