import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import CheatSheet from "@/models/CheatSheet";
import PptxGenJS from "pptxgenjs";

const DARK_BG = "1a1a2e";
const AMBER = "f59e0b";
const BODY_TEXT = "e5e7eb";
const MAX_BULLETS = 12;

interface Section {
  title: string;
  bullets: string[];
  prose: string[];
}

function parseMarkdown(content: string): Section[] {
  const lines = content.split("\n");
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (line.startsWith("## ")) {
      if (current) sections.push(current);
      current = { title: line.replace(/^## /, "").trim(), bullets: [], prose: [] };
      continue;
    }

    if (!current) continue;

    // bullet lines
    if (/^[-*] /.test(line)) {
      const text = line.replace(/^[-*] /, "").replace(/\*\*(.*?)\*\*/g, "$1");
      current.bullets.push(text);
      continue;
    }

    // bold term — definition pattern at line start
    if (/^\*\*/.test(line)) {
      const text = line.replace(/\*\*(.*?)\*\*/g, "$1");
      current.bullets.push(text);
      continue;
    }

    // non-empty prose
    if (line.trim()) {
      current.prose.push(line.replace(/\*\*(.*?)\*\*/g, "$1").trim());
    }
  }

  if (current) sections.push(current);
  return sections;
}

function addContentSlide(
  pptx: PptxGenJS,
  title: string,
  bullets: string[],
  prose: string[]
) {
  const slide = pptx.addSlide();
  slide.background = { color: DARK_BG };

  // Title
  slide.addText(title, {
    x: 0.4,
    y: 0.25,
    w: 9.2,
    h: 0.7,
    fontSize: 24,
    bold: true,
    color: AMBER,
    fontFace: "Calibri",
  });

  // Amber rule
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.4,
    y: 0.95,
    w: 9.2,
    h: 0.03,
    fill: { color: AMBER },
    line: { color: AMBER },
  });

  const items: PptxGenJS.TextProps[] = [];

  for (const b of bullets) {
    items.push({
      text: b,
      options: {
        bullet: { type: "bullet" },
        fontSize: 14,
        color: BODY_TEXT,
        fontFace: "Calibri",
        paraSpaceAfter: 4,
      },
    });
  }

  for (const p of prose) {
    items.push({
      text: p,
      options: {
        bullet: false,
        fontSize: 13,
        color: BODY_TEXT,
        fontFace: "Calibri",
        italic: true,
        paraSpaceAfter: 4,
      },
    });
  }

  if (items.length > 0) {
    slide.addText(items, {
      x: 0.4,
      y: 1.1,
      w: 9.2,
      h: 4.2,
      valign: "top",
    });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const url = new URL(request.url);
    const format = url.searchParams.get("format");

    if (format !== "pptx") {
      return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
    }

    await connectDB();
    const sheet = await CheatSheet.findById(id);

    if (!sheet) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (sheet.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_WIDE";
    pptx.author = "StudySphere";
    pptx.title = sheet.title;

    // Title slide
    const titleSlide = pptx.addSlide();
    titleSlide.background = { color: DARK_BG };
    titleSlide.addText("Cheat Sheet", {
      x: 0.5,
      y: 1.6,
      w: 9,
      h: 0.6,
      fontSize: 18,
      color: AMBER,
      fontFace: "Calibri",
      align: "center",
    });
    titleSlide.addText(sheet.title, {
      x: 0.5,
      y: 2.2,
      w: 9,
      h: 1.0,
      fontSize: 32,
      bold: true,
      color: BODY_TEXT,
      fontFace: "Calibri",
      align: "center",
    });
    titleSlide.addText(
      new Date(sheet.createdAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      {
        x: 0.5,
        y: 3.3,
        w: 9,
        h: 0.4,
        fontSize: 13,
        color: "6b7280",
        fontFace: "Calibri",
        align: "center",
      }
    );

    const sections = parseMarkdown(sheet.content);

    if (sections.length === 0) {
      return NextResponse.json({ error: "Cheat sheet has no sections to export" }, { status: 422 });
    }

    for (const section of sections) {
      const allBullets = section.bullets;
      const prose = section.prose;

      if (allBullets.length === 0) {
        // Slide with title + prose only (or just title)
        addContentSlide(pptx, section.title, [], prose);
        continue;
      }

      // Split into chunks of MAX_BULLETS
      const chunks: string[][] = [];
      for (let i = 0; i < allBullets.length; i += MAX_BULLETS) {
        chunks.push(allBullets.slice(i, i + MAX_BULLETS));
      }

      for (let ci = 0; ci < chunks.length; ci++) {
        const slideTitle =
          ci === 0 ? section.title : `${section.title} (cont.)`;
        addContentSlide(
          pptx,
          slideTitle,
          chunks[ci],
          ci === chunks.length - 1 ? prose : []
        );
      }
    }

    const buffer = (await pptx.write({
      outputType: "nodebuffer",
    })) as Buffer;

    const safeTitle = sheet.title.replace(/[^a-z0-9]/gi, "-").toLowerCase();
    // Copy into a plain ArrayBuffer so NextResponse accepts it
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    ) as ArrayBuffer;

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${safeTitle}.pptx"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (error) {
    console.error("Cheat sheet export error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
