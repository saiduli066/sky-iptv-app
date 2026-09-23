import type { RecentChannel } from "@/types/channel";

const FAVORITES_KEY = "sky-ip-tv:favorites";
const RECENTS_KEY = "sky-ip-tv:recents";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(key) ?? "null");
    return value && typeof value === "object" ? (value as T) : fallback;
  } catch {
    return fallback;
  }
}

export function readFavorites(): string[] {
  const value = read<unknown>(FAVORITES_KEY, []);
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function writeFavorites(value: string[]): void {
  window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(value));
}

export function readRecents(): RecentChannel[] {
  const value = read<unknown>(RECENTS_KEY, []);
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is RecentChannel => Boolean(item && typeof item === "object" && "channelId" in item && "lastWatched" in item))
    .sort((a, b) => b.lastWatched - a.lastWatched)
    .slice(0, 20);
}

export function writeRecents(value: RecentChannel[]): void {
  window.localStorage.setItem(RECENTS_KEY, JSON.stringify(value.slice(0, 20)));
}
