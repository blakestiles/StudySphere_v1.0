import pdfParse from "pdf-parse";

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text;
}

export async function extractTextWithPageMarkers(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  const pages = data.text.split('\f');
  if (pages.length > 1) {
    return pages.map((page: string, i: number) => `[PAGE ${i + 1}]\n${page.trim()}`).join('\n\n');
  }
  return data.text;
}
