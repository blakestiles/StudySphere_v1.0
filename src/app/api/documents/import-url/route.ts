import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Document from "@/models/Document";
import { TAGS } from "@/lib/data-cache";
import dns from "dns";

class UserFacingError extends Error {}

function isPrivateIP(ip: string): boolean {
  // Block loopback, link-local (AWS IMDS), RFC-1918, IPv4-mapped loopback, and IPv6 locals
  return /^127\./.test(ip) ||
    ip === "0.0.0.0" ||  // routes to localhost on many OS/kernel configs
    /^169\.254\./.test(ip) ||
    /^10\./.test(ip) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ||
    /^192\.168\./.test(ip) ||
    ip === "::1" ||
    ip.startsWith("::ffff:127.") ||
    ip.startsWith("fc") ||
    ip.startsWith("fd");
}

async function assertPublicHost(hostname: string): Promise<void> {
  // NOTE: DNS pre-check does not prevent DNS rebinding attacks — the subsequent
  // fetch() re-resolves the hostname and could land on a different IP. Full
  // mitigation requires a proxy with connect-time IP inspection (e.g. undici
  // connect hooks). Acceptable risk for this context.
  const lower = hostname.toLowerCase();
  if (lower === "localhost" || lower.endsWith(".local") || lower.endsWith(".internal")) {
    throw new UserFacingError("URL not allowed");
  }
  let address: string;
  try {
    ({ address } = await dns.promises.lookup(hostname));
  } catch {
    throw new UserFacingError("Could not reach that URL. Check the address and try again.");
  }
  if (isPrivateIP(address)) throw new UserFacingError("URL not allowed");
}

function extractYouTubeId(url: string): string | null {
  const pattern = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
  const m = url.match(pattern);
  return m ? m[1] : null;
}

const YT_ANDROID_UA = "com.google.android.youtube/20.10.38 (Linux; U; Android 14)";

async function fetchYouTubeTranscript(videoId: string): Promise<{ title: string; text: string }> {
  // Use the InnerTube Android client — works server-side, no cookies required
  const playerRes = await fetch(
    "https://www.youtube.com/youtubei/v1/player?prettyPrint=false",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": YT_ANDROID_UA },
      body: JSON.stringify({
        context: { client: { clientName: "ANDROID", clientVersion: "20.10.38" } },
        videoId,
      }),
    }
  );

  if (!playerRes.ok) throw new UserFacingError("Could not reach YouTube. Try again later.");

  const playerData = await playerRes.json();

  // Check playability
  const playability = playerData?.playabilityStatus?.status;
  if (playability && playability !== "OK") {
    throw new UserFacingError("This video is unavailable or private.");
  }

  const title: string =
    playerData?.videoDetails?.title ?? `YouTube Video ${videoId}`;

  const tracks: any[] =
    playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];

  if (tracks.length === 0) {
    throw new UserFacingError(
      "No captions found for this video. Make sure the video has captions enabled."
    );
  }

  // Prefer manual English captions, fall back to auto-generated, then first available
  const track =
    tracks.find((t) => t.languageCode === "en" && t.kind !== "asr") ||
    tracks.find((t) => t.languageCode === "en") ||
    tracks[0];

  const capRes = await fetch(track.baseUrl, {
    headers: { "User-Agent": YT_ANDROID_UA },
  });
  const capXml = await capRes.text();

  if (!capXml.trim()) throw new UserFacingError("Could not fetch captions for this video.");

  // Parse <p t="..." d="...">text or <s>words</s></p> format
  function decodeEntities(s: string): string {
    return s
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
      .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
      .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)));
  }

  const lines: string[] = [];
  const pRe = /<p\s[^>]*>([\s\S]*?)<\/p>/g;
  let m: RegExpExecArray | null;
  while ((m = pRe.exec(capXml)) !== null) {
    // Strip inner <s> and other tags, decode entities
    const text = decodeEntities(m[1].replace(/<[^>]+>/g, "")).trim();
    if (text) lines.push(text);
  }

  // Fallback: old <text> format
  if (lines.length === 0) {
    const textRe = /<text[^>]*>([^<]*)<\/text>/g;
    while ((m = textRe.exec(capXml)) !== null) {
      const text = decodeEntities(m[1]).trim();
      if (text) lines.push(text);
    }
  }

  if (lines.length === 0) throw new UserFacingError("Could not parse captions from this video.");

  return { title, text: lines.join(" ") };
}

const MAX_FETCH_BYTES = 5 * 1024 * 1024; // 5MB cap before processing

async function fetchWebPage(url: string): Promise<{ title: string; text: string }> {
  const { hostname } = new URL(url);
  await assertPublicHost(hostname);

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; StudySphere/1.0)" },
  });
  if (!res.ok) throw new UserFacingError(`Failed to fetch URL: ${res.status}`);

  // Cap response size before reading into memory
  if (!res.body) throw new UserFacingError("Failed to read response from URL");
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    chunks.push(value);
    if (totalBytes > MAX_FETCH_BYTES) { reader.cancel(); break; }
  }
  const merged = new Uint8Array(totalBytes);
  let offset = 0;
  for (const c of chunks) { merged.set(c, offset); offset += c.byteLength; }
  const html = new TextDecoder().decode(merged);

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : url;

  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ").replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, " ").trim();

  if (stripped.length < 100) throw new UserFacingError("Could not extract meaningful text from this URL");
  return { title, text: stripped.slice(0, 200_000) };
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let { url } = await request.json();
    if (!url || typeof url !== "string") return NextResponse.json({ error: "URL is required" }, { status: 400 });

    // Auto-prepend https:// if scheme is missing
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;

    let urlObj: URL;
    try { urlObj = new URL(url); } catch { return NextResponse.json({ error: "Invalid URL" }, { status: 400 }); }

    if (!["http:", "https:"].includes(urlObj.protocol)) {
      return NextResponse.json({ error: "Only HTTP/HTTPS URLs are allowed" }, { status: 400 });
    }

    await connectDB();

    const ytId = extractYouTubeId(url);
    let title: string, text: string;

    if (ytId) {
      ({ title, text } = await fetchYouTubeTranscript(ytId));
    } else if (url.includes("docs.google.com/document/d/")) {
      // Handle Google Docs URLs regardless of which import tab was used
      const m = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
      const docId = m ? m[1] : null;
      if (!docId) return NextResponse.json({ error: "Invalid Google Docs URL" }, { status: 400 });
      const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
      const res = await fetch(exportUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/plain,text/html,*/*",
        },
        redirect: "follow",
      });
      if (!res.ok) return NextResponse.json({ error: "Could not access document. Make sure it's shared publicly ('Anyone with the link can view')." }, { status: 400 });
      const contentType = res.headers.get("content-type") ?? "";
      const rawText = await res.text();
      if (contentType.includes("text/html") || rawText.trimStart().startsWith("<!DOCTYPE") || rawText.trimStart().startsWith("<html")) {
        return NextResponse.json({ error: "Could not access document. Make sure it's shared publicly ('Anyone with the link can view')." }, { status: 400 });
      }
      if (!rawText.trim()) return NextResponse.json({ error: "Document appears to be empty" }, { status: 400 });
      const firstLine = rawText.split("\n").find((l) => l.trim().length > 0)?.trim();
      title = firstLine && firstLine.length <= 120 ? firstLine : `Google Docs Import (${new Date().toLocaleDateString()})`;
      text = rawText.slice(0, 200_000);
    } else {
      ({ title, text } = await fetchWebPage(url));
    }

    if (!text.trim()) return NextResponse.json({ error: "Could not extract content from URL" }, { status: 400 });

    const doc = await Document.create({
      userId: session.user.id, title,
      fileType: "url", rawText: text, status: "ready",
    });

    revalidateTag(TAGS.documents(session.user.id));
    revalidateTag(TAGS.dashboard(session.user.id));
    return NextResponse.json({ message: "Content imported successfully", document: doc }, { status: 201 });
  } catch (error: any) {
    const isUserError = error instanceof UserFacingError;
    if (!isUserError) console.error("URL import error:", error);
    return NextResponse.json(
      { error: isUserError ? error.message : "Import failed" },
      { status: isUserError ? 422 : 500 }
    );
  }
}
