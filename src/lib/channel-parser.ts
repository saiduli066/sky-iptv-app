import rawCatalog from "../../channels.json";
import type { CatalogNode, ChannelRecord, RawChannel } from "@/types/channel";

const catalog = rawCatalog as unknown as CatalogNode;

export function slugify(value: string): string {
  return (
    value
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "channel"
  );
}

function isRawChannel(value: unknown): value is RawChannel {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.name === "string" && typeof item.url === "string";
}

function isChannelArray(value: unknown): value is RawChannel[] {
  return Array.isArray(value) && value.every(isRawChannel);
}

function findField(
  path: string[],
  field: "country" | "language" | "category",
): string | undefined {
  if (field === "country") return path.length >= 2 ? path[0] : undefined;
  if (field === "language") return path.length >= 3 ? path[1] : undefined;
  return path[path.length - 1];
}

function collect(node: unknown, path: string[], output: ChannelRecord[]): void {
  if (isChannelArray(node)) {
    node.forEach((channel) => {
      const id = slugify([...path, channel.name].join("-"));
      output.push({
        id,
        name: channel.name.trim(),
        url: channel.url.trim(),
        country: findField(path, "country"),
        language: findField(path, "language"),
        category: findField(path, "category"),
        groupPath: path,
      });
    });
    return;
  }

  if (!node || typeof node !== "object") return;
  Object.entries(node as Record<string, unknown>).forEach(([key, value]) => {
    collect(value, [...path, key], output);
  });
}

export function parseChannelCatalog(): ChannelRecord[] {
  const channels: ChannelRecord[] = [];
  collect(catalog, [], channels);
  return channels;
}

export const channels = parseChannelCatalog();

export function getTopLevelGroups(): string[] {
  if (!catalog || typeof catalog !== "object" || Array.isArray(catalog))
    return [];
  return Object.keys(catalog);
}

export function getGroupChannels(path: string[]): ChannelRecord[] {
  return channels.filter((channel) =>
    path.every((part, index) => channel.groupPath[index] === part),
  );
}
