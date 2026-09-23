import { channels } from "@/lib/channel-parser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedOrigins = new Set(
  channels.map((channel) => {
    try {
      return new URL(channel.url).origin;
    } catch {
      return "";
    }
  }),
);

function isAllowedUrl(value: string): URL | undefined {
  try {
    const url = new URL(value);
    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      !allowedOrigins.has(url.origin)
    )
      return undefined;
    return url;
  } catch {
    return undefined;
  }
}

function proxyUrl(url: string): string {
  return `/api/stream?url=${encodeURIComponent(url)}`;
}

function rewritePlaylist(playlist: string, sourceUrl: URL): string {
  return playlist
    .split(/(\r?\n)/)
    .map((line) => {
      if (!line || line.startsWith("#")) {
        return line.replace(/URI="([^"]+)"/g, (_match, value: string) => {
          const resolved = isAllowedUrl(new URL(value, sourceUrl).toString());
          return resolved
            ? `URI="${proxyUrl(resolved.toString())}"`
            : `URI="${value}"`;
        });
      }

      const resolved = isAllowedUrl(new URL(line, sourceUrl).toString());
      return resolved ? proxyUrl(resolved.toString()) : line;
    })
    .join("");
}

export async function GET(request: Request) {
  const target = new URL(request.url).searchParams.get("url");
  const sourceUrl = target ? isAllowedUrl(target) : undefined;

  if (!sourceUrl) {
    return new Response("Stream URL is not allowed.", { status: 403 });
  }

  try {
    const upstream = await fetch(sourceUrl, {
      cache: "no-store",
      headers: {
        Accept: "application/vnd.apple.mpegurl, video/mp2t, video/*, */*",
      },
    });

    if (!upstream.ok || !upstream.body) {
      return new Response(`Upstream stream returned ${upstream.status}.`, {
        status: upstream.status || 502,
      });
    }

    const contentType = upstream.headers.get("content-type") ?? "";
    const isPlaylist =
      sourceUrl.pathname.toLowerCase().endsWith(".m3u8") ||
      contentType.includes("mpegurl");

    if (isPlaylist) {
      const playlist = rewritePlaylist(await upstream.text(), sourceUrl);
      return new Response(playlist, {
        headers: {
          "Cache-Control": "no-store",
          "Content-Type": "application/vnd.apple.mpegurl",
        },
      });
    }

    return new Response(upstream.body, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": contentType || "application/octet-stream",
      },
    });
  } catch {
    return new Response("Unable to connect to the upstream stream.", {
      status: 502,
    });
  }
}
