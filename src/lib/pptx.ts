import AdmZip from "adm-zip";

function extractTextRuns(xml: string): string[] {
  const texts: string[] = [];
  const re = /<a:t[^>]*>([\s\S]*?)<\/a:t>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const t = m[1]
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
    if (t) texts.push(t);
  }
  return texts;
}

function isTitle(shapeXml: string): boolean {
  return /<p:ph[^>]*type="(?:title|ctrTitle)"/.test(shapeXml);
}

function extractShapes(slideXml: string): Array<{ title: boolean; text: string }> {
  const shapes: Array<{ title: boolean; text: string }> = [];
  const shapeRe = /<p:sp[\s\S]*?<\/p:sp>/g;
  let m: RegExpExecArray | null;
  while ((m = shapeRe.exec(slideXml)) !== null) {
    const texts = extractTextRuns(m[0]);
    if (texts.length > 0) {
      shapes.push({ title: isTitle(m[0]), text: texts.join(" ") });
    }
  }
  return shapes;
}

export function extractTextFromPPTX(buffer: Buffer): string {
  const zip = new AdmZip(buffer);

  const slideEntries = zip
    .getEntries()
    .filter((e) => /^ppt\/slides\/slide\d+\.xml$/.test(e.entryName))
    .sort((a, b) => {
      const n = (name: string) => parseInt(name.match(/slide(\d+)\.xml/)![1]);
      return n(a.entryName) - n(b.entryName);
    });

  const slides: string[] = [];

  for (let i = 0; i < slideEntries.length; i++) {
    const xml = slideEntries[i].getData().toString("utf-8");
    const shapes = extractShapes(xml);
    if (shapes.length === 0) continue;

    const titleShape = shapes.find((s) => s.title);
    const bodyShapes = shapes.filter((s) => !s.title);

    const lines: string[] = [
      `## Slide ${i + 1}${titleShape ? `: ${titleShape.text}` : ""}`,
    ];
    for (const s of bodyShapes) {
      if (s.text.trim()) lines.push(s.text);
    }

    slides.push(lines.join("\n"));
  }

  if (slides.length === 0) throw new Error("No text content found in presentation");
  return slides.join("\n\n");
}

export function isPPTXBuffer(buffer: Buffer): boolean {
  // PPTX is a ZIP — magic bytes PK\x03\x04
  return buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
}
