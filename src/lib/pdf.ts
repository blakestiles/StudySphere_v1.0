import { PDFParse } from "pdf-parse";

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const pdfParser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await pdfParser.getText();
  return result.text;
}

export async function extractTextWithPageMarkers(buffer: Buffer): Promise<string> {
  const pdfParser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await pdfParser.getText();
  const pages = result.text.split('\f');
  if (pages.length > 1) {
    return pages.map((page: string, i: number) => `[PAGE ${i + 1}]\n${page.trim()}`).join('\n\n');
  }
  return result.text;
}
