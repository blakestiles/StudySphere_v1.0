import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Document from "@/models/Document";
import { TAGS } from "@/lib/data-cache";

function extractTextFromBlocks(blocks: any[]): string {
  const lines: string[] = [];
  for (const block of blocks) {
    const type = block.type;
    const content = block[type];
    if (content?.rich_text) {
      const text = content.rich_text.map((rt: any) => rt.plain_text).join("");
      if (text) lines.push(text);
    }
    if (block.has_children && block[type]?.children) {
      lines.push(extractTextFromBlocks(block[type].children));
    }
  }
  return lines.join("\n");
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { pageId, token } = await request.json();
    if (!pageId || !token) return NextResponse.json({ error: "pageId and token are required" }, { status: 400 });

    const cleanId = pageId.replace(/[^a-zA-Z0-9-]/g, "").replace(/-/g, "");
    if (cleanId.length < 32) return NextResponse.json({ error: "Invalid Notion page ID" }, { status: 400 });
    const formattedId = `${cleanId.slice(0,8)}-${cleanId.slice(8,12)}-${cleanId.slice(12,16)}-${cleanId.slice(16,20)}-${cleanId.slice(20)}`;

    const headers = {
      "Authorization": `Bearer ${token}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    };

    const pageRes = await fetch(`https://api.notion.com/v1/pages/${formattedId}`, { headers, signal: AbortSignal.timeout(15_000) });
    if (!pageRes.ok) return NextResponse.json({ error: "Could not access Notion page. Check your token and page ID." }, { status: 400 });
    const page = await pageRes.json();

    const titleProp = Object.values(page.properties || {}).find((p: any) => p.type === "title") as any;
    const title = titleProp?.title?.[0]?.plain_text || "Notion Import";

    const blocksRes = await fetch(`https://api.notion.com/v1/blocks/${formattedId}/children?page_size=100`, { headers, signal: AbortSignal.timeout(15_000) });
    if (!blocksRes.ok) return NextResponse.json({ error: "Could not read page content" }, { status: 400 });
    const blocksData = await blocksRes.json();
    // Note: Notion API does not inline nested blocks — only top-level block text is extracted.
    // Deeply nested content (toggle children, sub-bullets) is not fetched.
    const text = extractTextFromBlocks(blocksData.results || []);

    if (!text.trim()) return NextResponse.json({ error: "Page appears to be empty" }, { status: 400 });

    await connectDB();
    const doc = await Document.create({
      userId: session.user.id, title,
      fileType: "notion", rawText: text, status: "ready",
    });

    revalidateTag(TAGS.documents(session.user.id), "");
    revalidateTag(TAGS.dashboard(session.user.id), "");
    return NextResponse.json({
      message: "Notion page imported successfully",
      document: doc,
      warning: "Only top-level block content was imported. Nested toggle/sub-bullet content is not included.",
    }, { status: 201 });
  } catch (error: any) {
    console.error("Notion import error:", error?.message ?? "unknown error");
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
