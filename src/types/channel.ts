export type RawChannel = {
  name: string;
  url: string;
};

export type CatalogNode = RawChannel[] | CatalogGroup;

export interface CatalogGroup {
  [key: string]: CatalogNode;
}

export type ChannelRecord = {
  id: string;
  name: string;
  url: string;
  country?: string;
  language?: string;
  category?: string;
  groupPath: string[];
};

export type RecentChannel = {
  channelId: string;
  lastWatched: number;
};
