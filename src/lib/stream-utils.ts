export function isHlsUrl(url: string): boolean {
  try {
    return new URL(url).pathname.toLowerCase().endsWith(".m3u8");
  } catch {
    return false;
  }
}

export function isHttpStream(url: string): boolean {
  try {
    return new URL(url).protocol === "http:" && typeof window !== "undefined" && window.location.protocol === "https:";
  } catch {
    return false;
  }
}
