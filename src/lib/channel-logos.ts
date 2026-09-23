import type { ChannelRecord } from "@/types/channel";

type LogoAsset = {
  country: string;
  name: string;
  file: string;
};

const logoAssets: LogoAsset[] = [
  { country: "Bangladesh", name: "ATN Bangla", file: "ATN Bangla.png" },
  { country: "Bangladesh", name: "Bangla Vision", file: "Bangla Vision.png" },
  { country: "Bangladesh", name: "Boishakhi TV", file: "Boishakhi TV.png" },
  { country: "Bangladesh", name: "Deshi TV", file: "Deshi TV.png" },
  { country: "Bangladesh", name: "DBC News", file: "DBC News.png" },
  { country: "Bangladesh", name: "Deen TV", file: "Deen TV.png" },
  { country: "Bangladesh", name: "Duronto TV", file: "Duronto TV.png" },
  { country: "Bangladesh", name: "Ekhon TV", file: "Ekhon TV.png" },
  { country: "Bangladesh", name: "Ekushey TV", file: "Ekushey TV.png" },
  { country: "Bangladesh", name: "Gazi TV", file: "Gazi TV.png" },
  { country: "Bangladesh", name: "Maasranga TV", file: "Maasranga TV.png" },
  {
    country: "Bangladesh",
    name: "Madani Channel Bangla",
    file: "Madani Channel Bangla.png",
  },
  { country: "Bangladesh", name: "Movie Bangla", file: "moviebangla.jpg" },
  { country: "Bangladesh", name: "My TV", file: "my TV.png" },
  { country: "Bangladesh", name: "NAN TV", file: "NAN-TV.png" },
  { country: "Bangladesh", name: "NTV", file: "N-TV.png" },
  { country: "Bangladesh", name: "Nexus TV", file: "Nexus TV.png" },
  {
    country: "Bangladesh",
    name: "Peace TV Bangla",
    file: "peace tv bangla.png",
  },
  {
    country: "Bangladesh",
    name: "Rajdhani TV SD",
    file: "Rajdhani TV SD.jpeg",
  },
  { country: "Bangladesh", name: "RTV", file: "R TV.png" },
  { country: "Bangladesh", name: "T Sports", file: "T sports.png" },
  { country: "India", name: "Aakaash Aath", file: "Aakaash Aath.png" },
  { country: "India", name: "Colors Bangla", file: "Colors Bangla.png" },
  {
    country: "India",
    name: "Colors Rishtey Americas",
    file: "Colors Rishtey Americas.png",
  },
  { country: "India", name: "Dangal 2", file: "Dangal 2.png" },
  { country: "India", name: "DD Bangla", file: "DD Bangla.png" },
  { country: "India", name: "Enterr 10 Bangla", file: "Enterr 10 Bangla.png" },
  { country: "India", name: "Goldmines", file: "Goldmines.png" },
  { country: "India", name: "Khushboo Bangla", file: "Khushboo Bangla.png" },
  { country: "India", name: "Pasand TV", file: "pasand tv.jfif" },
  { country: "India", name: "Sangeet Bangla", file: "Sangeet Bangla.png" },
  {
    country: "India",
    name: "Sony Entertainment Television",
    file: "Sony Entertainment Television HD.png",
  },
  { country: "India", name: "Sony Max", file: "Sony Max HD.png" },
  { country: "India", name: "Sony Pal", file: "Sony Pal.png" },
  { country: "India", name: "Sony SAB", file: "Sony SAB HD.png" },
  { country: "India", name: "Sony Wah", file: "Sony Wah.png" },
  { country: "India", name: "Star Jalsha", file: "Star Jalsha HD.png" },
  { country: "India", name: "Star Plus", file: "Star plus HD.png" },
  { country: "India", name: "Star Sports 2", file: "Star Sports 2.png" },
  { country: "India", name: "TV9 Bangla", file: "TV9 Bangla.png" },
  { country: "India", name: "Zee Bangla", file: "Zee Bangla HD.png" },
  { country: "India", name: "Zee Bangla Sonar", file: "Zee Bangla Sonar.png" },
  { country: "India", name: "Zee Cinema", file: "Zee cinema.png" },
];

function normalize(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b(hd|sd|fhd|uhd|1080i|720p)\b/g, " ")
    .replace(/\band\b/g, " ")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function logoUrl(asset: LogoAsset): string {
  return `/channel-logos/${encodeURIComponent(asset.country.toLowerCase())}/${encodeURIComponent(asset.file)}`;
}

const logoIndex = new Map<string, LogoAsset>();

logoAssets.forEach((asset) => {
  logoIndex.set(`${normalize(asset.country)}:${normalize(asset.name)}`, asset);
});

export function getChannelLogo(channel: ChannelRecord): string | undefined {
  const country = channel.country ?? channel.groupPath[0];
  if (!country) return undefined;

  const countryKey = normalize(country);
  const channelKey = normalize(channel.name);
  const direct = logoIndex.get(`${countryKey}:${channelKey}`);
  if (direct) return logoUrl(direct);

  const countryAssets = logoAssets.filter(
    (asset) => normalize(asset.country) === countryKey,
  );
  const fuzzy = countryAssets.find((asset) => {
    const assetKey = normalize(asset.name);
    return (
      assetKey === channelKey ||
      assetKey.includes(channelKey) ||
      channelKey.includes(assetKey)
    );
  });

  return fuzzy ? logoUrl(fuzzy) : undefined;
}
