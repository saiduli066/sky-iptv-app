"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";
import { channels, getGroupChannels, getTopLevelGroups, slugify } from "@/lib/channel-parser";
import { getChannelLogo } from "@/lib/channel-logos";
import { isHlsUrl, isHttpStream } from "@/lib/stream-utils";
import { readFavorites, readRecents, writeFavorites, writeRecents } from "@/lib/storage";
import type { ChannelRecord, RecentChannel } from "@/types/channel";

const groupTone = ["green", "rose", "amber", "cyan", "violet", "blue"];
const topGroups = getTopLevelGroups();
const knownGroupNames = [...new Set(channels.flatMap((channel) => channel.groupPath))];

type View = { kind: "home" } | { kind: "browse"; path: string[] } | { kind: "watch"; channel: ChannelRecord };
type IconName = "back" | "bookmark" | "check" | "chevron" | "folder" | "home" | "play" | "search" | "star" | "tv";

function Icon({ name, filled = false }: { name: IconName; filled?: boolean }) {
  const common = { fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2 } as const;

  return (
    <svg aria-hidden="true" className="icon" viewBox="0 0 24 24">
      {name === "back" && <path {...common} d="m15 18-6-6 6-6" />}
      {name === "bookmark" && <path {...common} d="M6 4h12v17l-6-4-6 4z" fill={filled ? "currentColor" : "none"} />}
      {name === "check" && <path {...common} d="m5 12 4 4L19 6" />}
      {name === "chevron" && <path {...common} d="m9 18 6-6-6-6" />}
      {name === "folder" && <path {...common} d="M3 7h7l2 2h9v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />}
      {name === "home" && <path {...common} d="M4 11 12 4l8 7v9H5v-7h14" />}
      {name === "play" && <path {...common} d="M8 5v14l11-7z" fill="currentColor" stroke="none" />}
      {name === "search" && <><circle {...common} cx="11" cy="11" r="7" /><path {...common} d="m16.5 16.5 3.5 3.5" /></>}
      {name === "star" && <path {...common} d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" fill={filled ? "currentColor" : "none"} />}
      {name === "tv" && <><rect {...common} x="3" y="6" width="18" height="12" rx="2" /><path {...common} d="M8 21h8M12 18v3" /></>}
    </svg>
  );
}

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  const seed = parts.length > 1 ? [parts[0], parts[1]] : [name.slice(0, 2)];
  return seed.map((part) => part[0]).join("").toUpperCase();
}

function channelMatches(channel: ChannelRecord, query: string): boolean {
  const haystack = [channel.name, channel.country, channel.language, channel.category, ...channel.groupPath]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function viewFromLocation(): View {
  const segments = window.location.pathname.split("/").filter(Boolean);

  if (segments[0] === "watch") {
    const channel = channels.find((item) => item.id === segments[1]);
    if (channel) return { kind: "watch", channel };
  }

  if (segments[0] === "browse") {
    const path = segments.slice(1).map((segment) => knownGroupNames.find((name) => slugify(name) === segment) ?? segment);
    return { kind: "browse", path };
  }

  return { kind: "home" };
}

function plural(value: number, word: string): string {
  return `${value} ${word}${value === 1 ? "" : "s"}`;
}

function pathLabel(path: string[]): string {
  return path.length ? path.join(" / ") : "Home";
}

function groupChildren(path: string[]): string[] {
  return [
    ...new Set(
      channels
        .filter((channel) => path.every((part, index) => channel.groupPath[index] === part) && channel.groupPath.length > path.length)
        .map((channel) => channel.groupPath[path.length])
    ),
  ];
}

function ChannelLogo({ channel, compact = false }: { channel: ChannelRecord; compact?: boolean }) {
  const logo = getChannelLogo(channel);

  if (logo) {
    return (
      <span className={compact ? "mini-logo has-image" : "logo-frame"}>
        <img src={logo} alt="" loading="lazy" />
      </span>
    );
  }

  return <span className={compact ? "mini-logo" : "logo-fallback"}>{initials(channel.name)}</span>;
}

function Player({ channel }: { channel: ChannelRecord }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [status, setStatus] = useState<"loading" | "playing" | "error">("loading");
  const [message, setMessage] = useState("Connecting...");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let disposed = false;
    const fail = (text: string) => {
      if (!disposed) {
        setStatus("error");
        setMessage(text);
      }
    };

    setStatus("loading");
    setMessage(`Connecting to ${channel.name}...`);
    const streamUrl = isHttpStream(channel.url) ? `/api/stream?url=${encodeURIComponent(channel.url)}` : channel.url;

    const onPlaying = () => {
      setStatus("playing");
      setMessage("");
    };
    const onWaiting = () => {
      if (!disposed) {
        setStatus("loading");
        setMessage("Buffering...");
      }
    };
    const onError = () => fail("The stream may be offline, blocked, or incompatible with this browser.");

    video.addEventListener("playing", onPlaying);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("error", onError);

    if (isHlsUrl(channel.url) && !video.canPlayType("application/vnd.apple.mpegurl")) {
      if (!Hls.isSupported()) {
        fail("This browser does not support this live stream format.");
        return () => {
          disposed = true;
          video.removeEventListener("playing", onPlaying);
          video.removeEventListener("waiting", onWaiting);
          video.removeEventListener("error", onError);
        };
      }

      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hlsRef.current = hls;
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) fail("The stream could not be loaded. It may be offline or blocked.");
      });
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
    } else {
      video.src = streamUrl;
      video.load();
    }

    void video.play().catch(() => undefined);

    return () => {
      disposed = true;
      hlsRef.current?.destroy();
      hlsRef.current = null;
      video.pause();
      video.removeAttribute("src");
      video.load();
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("error", onError);
    };
  }, [channel, attempt]);

  return (
    <div className="player-wrap">
      <video ref={videoRef} className="video" controls playsInline aria-label={`${channel.name} live stream`} />
      {status !== "playing" && (
        <div className="player-message" role={status === "error" ? "alert" : "status"}>
          <div className="player-status-icon">
            <Icon name={status === "error" ? "back" : "play"} />
          </div>
          <strong>{status === "error" ? "Unable to play this channel" : message}</strong>
          <p>{status === "error" ? message : "Live TV will start when the source responds."}</p>
          {status === "error" && (
            <button className="primary-button compact" onClick={() => setAttempt((value) => value + 1)}>
              Try again
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ChannelCard({
  channel,
  isFavorite,
  onOpen,
  onToggleFavorite,
}: {
  channel: ChannelRecord;
  isFavorite: boolean;
  onOpen: (channel: ChannelRecord) => void;
  onToggleFavorite: (channelId: string) => void;
}) {
  return (
    <article className="channel-card">
      <button className="channel-main" onClick={() => onOpen(channel)} aria-label={`Watch ${channel.name}`}>
        <span className="channel-logo" aria-hidden="true">
          <ChannelLogo channel={channel} />
        </span>
        <span className="channel-copy">
          <span className="live-pill">
            <Icon name="play" />
            Live
          </span>
          <span className="channel-name" title={channel.name}>
            {channel.name}
          </span>
          <span className="channel-meta">{pathLabel(channel.groupPath)}</span>
        </span>
      </button>
      <button
        className={`save-button ${isFavorite ? "is-saved" : ""}`}
        aria-label={`${isFavorite ? "Remove" : "Add"} ${channel.name} ${isFavorite ? "from" : "to"} saved channels`}
        onClick={() => onToggleFavorite(channel.id)}
        title={isFavorite ? "Saved" : "Save"}
      >
        <Icon name="star" filled={isFavorite} />
      </button>
    </article>
  );
}

export default function HomePage() {
  const [view, setView] = useState<View>({ kind: "home" });
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recents, setRecents] = useState<RecentChannel[]>([]);
  const [query, setQuery] = useState("");
  const [ready, setReady] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFavorites(readFavorites());
    setRecents(readRecents());
    setView(viewFromLocation());
    setReady(true);
  }, []);

  useEffect(() => {
    const onPopState = () => setView(viewFromLocation());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";

      if (event.key === "/" && !isTyping) {
        event.preventDefault();
        searchRef.current?.focus();
      }

      if (event.key === "Escape") setQuery("");
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const navigate = (next: View) => {
    setView(next);
    const path = next.kind === "home" ? "/" : next.kind === "watch" ? `/watch/${next.channel.id}` : `/browse/${next.path.map(slugify).join("/")}`;
    window.history.pushState({}, "", path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    navigate({ kind: "home" });
  };

  const openChannel = (channel: ChannelRecord) => {
    const next = [{ channelId: channel.id, lastWatched: Date.now() }, ...recents.filter((item) => item.channelId !== channel.id)].slice(0, 20);
    setRecents(next);
    writeRecents(next);
    navigate({ kind: "watch", channel });
  };

  const toggleFavorite = (channelId: string) => {
    const next = favorites.includes(channelId) ? favorites.filter((id) => id !== channelId) : [...favorites, channelId];
    setFavorites(next);
    writeFavorites(next);
  };

  const recentChannels = recents.map((item) => channels.find((channel) => channel.id === item.channelId)).filter((channel): channel is ChannelRecord => Boolean(channel));
  const favoriteChannels = favorites.map((id) => channels.find((channel) => channel.id === id)).filter((channel): channel is ChannelRecord => Boolean(channel));
  const searchTerm = query.trim();
  const searchResults = useMemo(() => (searchTerm ? channels.filter((channel) => channelMatches(channel, searchTerm)).slice(0, 10) : []), [searchTerm]);
  const browseChannels = view.kind === "browse" ? getGroupChannels(view.path) : [];
  const browseChildren = view.kind === "browse" ? groupChildren(view.path) : [];
  const visibleBrowseChannels = browseChannels;
  const currentGroupChannels = view.kind === "watch" ? getGroupChannels(view.channel.groupPath) : [];
  const currentIndex = view.kind === "watch" ? currentGroupChannels.findIndex((channel) => channel.id === view.channel.id) : -1;
  const previousChannel = currentIndex > 0 ? currentGroupChannels[currentIndex - 1] : undefined;
  const nextChannel = currentIndex >= 0 && currentIndex < currentGroupChannels.length - 1 ? currentGroupChannels[currentIndex + 1] : undefined;

  if (!ready) {
    return (
      <div className="splash">
        <div className="brand-mark">
          <img src="/sky-iptv-logo-5.png" alt="Sky IPTV" />
        </div>
        <strong>Sky IPTV</strong>
      </div>
    );
  }

  const renderChannelCard = (channel: ChannelRecord) => (
    <ChannelCard
      key={channel.id}
      channel={channel}
      isFavorite={favorites.includes(channel.id)}
      onOpen={openChannel}
      onToggleFavorite={toggleFavorite}
    />
  );

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={() => navigate({ kind: "home" })} aria-label="Go to home">
          <span className="brand-mark">
            <img src="/sky-iptv-logo-5.png" alt="" />
          </span>
          <span>
            <strong>Sky IPTV</strong>
            <small>Live TV made simple</small>
          </span>
        </button>

        <div className="search-wrap">
          <Icon name="search" />
          <input
            ref={searchRef}
            className="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search any channel"
            aria-label="Search channels"
          />
          {searchTerm && (
            <div className="search-results" role="listbox" aria-label="Search results">
              {searchResults.length > 0 ? (
                searchResults.map((channel) => (
                  <button
                    className="search-result"
                    key={channel.id}
                    onClick={() => {
                      setQuery("");
                      openChannel(channel);
                    }}
                  >
                    <ChannelLogo channel={channel} compact />
                    <span>
                      <strong>{channel.name}</strong>
                      <small>{pathLabel(channel.groupPath)}</small>
                    </span>
                    <Icon name="chevron" />
                  </button>
                ))
              ) : (
                <div className="search-empty">No matching channels found.</div>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="main">
        {view.kind === "home" && (
          <>
            <section className="hero-panel" aria-labelledby="home-title">
              <div>
                <p className="eyebrow">Live TV</p>
                <h1 id="home-title">Your channels are ready.</h1>
                <p className="lede">Open a collection, search a channel, or continue watching from your personal TV shelf.</p>
              </div>
              <div className="hero-stats" aria-label="Library summary">
                <span>
                  <strong>{channels.length}</strong>
                  Live channels
                </span>
                <span>
                  <strong>{favoriteChannels.length}</strong>
                  Saved
                </span>
                <span>
                  <strong>{recentChannels.length}</strong>
                  Recent
                </span>
              </div>
            </section>

            {(recentChannels.length > 0 || favoriteChannels.length > 0) && (
              <section className="quick-strip" aria-label="Quick access">
                {recentChannels[0] && (
                  <button className="quick-action" onClick={() => openChannel(recentChannels[0])}>
                    <Icon name="play" />
                    <span>
                      <strong>Keep watching</strong>
                      <small>{recentChannels[0].name}</small>
                    </span>
                  </button>
                )}
                {favoriteChannels[0] && (
                  <button className="quick-action" onClick={() => openChannel(favoriteChannels[0])}>
                    <Icon name="star" filled />
                    <span>
                      <strong>Open saved</strong>
                      <small>{favoriteChannels[0].name}</small>
                    </span>
                  </button>
                )}
              </section>
            )}

            <section className="section" aria-labelledby="countries-title">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Collections</p>
                  <h2 id="countries-title">Browse live TV</h2>
                </div>
                <span className="section-note">{plural(topGroups.length, "choice")}</span>
              </div>
              <div className="group-grid">
                {topGroups.map((group, index) => {
                  const count = channels.filter((channel) => channel.groupPath[0] === group).length;
                  const tone = groupTone[index % groupTone.length];

                  return (
                    <button className={`group-card tone-${tone}`} key={group} onClick={() => navigate({ kind: "browse", path: [group] })}>
                      <span className="group-icon">
                        <Icon name="folder" />
                      </span>
                      <span>
                        <strong>{group}</strong>
                        <small>{plural(count, "channel")}</small>
                      </span>
                      <Icon name="chevron" />
                    </button>
                  );
                })}
              </div>
            </section>

            {recentChannels.length > 0 && (
              <section className="section" aria-labelledby="recent-title">
                <div className="section-head">
                  <div>
                    <p className="eyebrow">Jump back in</p>
                    <h2 id="recent-title">Recently watched</h2>
                  </div>
                  <span className="section-note">Last {recentChannels.length}</span>
                </div>
                <div className="channel-grid">{recentChannels.slice(0, 8).map(renderChannelCard)}</div>
              </section>
            )}

            {favoriteChannels.length > 0 && (
              <section className="section" aria-labelledby="saved-title">
                <div className="section-head">
                  <div>
                    <p className="eyebrow">Your picks</p>
                    <h2 id="saved-title">Saved channels</h2>
                  </div>
                  <span className="section-note">{plural(favoriteChannels.length, "channel")}</span>
                </div>
                <div className="channel-grid">{favoriteChannels.map(renderChannelCard)}</div>
              </section>
            )}
          </>
        )}

        {view.kind === "browse" && (
          <section className="browse-view">
            <nav className="breadcrumb" aria-label="Current location">
              <button onClick={() => navigate({ kind: "home" })}>
                <Icon name="home" />
                Home
              </button>
              {view.path.map((part, index) => (
                <button key={`${part}-${index}`} onClick={() => navigate({ kind: "browse", path: view.path.slice(0, index + 1) })}>
                  <Icon name="chevron" />
                  {part}
                </button>
              ))}
            </nav>

            <section className="hero-panel browse-hero" aria-labelledby="browse-title">
              <div>
                <p className="eyebrow">Channel collection</p>
                <h1 id="browse-title">{view.path[view.path.length - 1]}</h1>
                <p className="lede">Folders are on top. Every channel in this collection is ready below.</p>
              </div>
              <div className="hero-stats">
                <span>
                  <strong>{browseChannels.length}</strong>
                  Channels here
                </span>
                <span>
                  <strong>{browseChildren.length}</strong>
                  Folders
                </span>
              </div>
            </section>

            {browseChildren.length > 0 && (
              <section className="section" aria-labelledby="folders-title">
                <div className="section-head">
                  <div>
                    <p className="eyebrow">Folders</p>
                    <h2 id="folders-title">Channel folders</h2>
                  </div>
                  <span className="section-note">{plural(browseChildren.length, "choice")}</span>
                </div>
                <div className="folder-grid">
                  {browseChildren.map((child, index) => {
                    const nextPath = [...view.path, child];
                    const count = getGroupChannels(nextPath).length;
                    const tone = groupTone[index % groupTone.length];

                    return (
                      <button className={`folder-card tone-${tone}`} key={child} onClick={() => navigate({ kind: "browse", path: nextPath })}>
                        <span className="group-icon">
                          <Icon name="folder" />
                        </span>
                        <span>
                          <strong>{child}</strong>
                          <small>{plural(count, "channel")}</small>
                        </span>
                        <Icon name="chevron" />
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            <section className="section" aria-labelledby="channels-title">
              <div className="section-head">
                <div>
                  <p className="eyebrow">On now</p>
                  <h2 id="channels-title">All channels</h2>
                </div>
                <span className="section-note">{plural(visibleBrowseChannels.length, "channel")}</span>
              </div>
              {visibleBrowseChannels.length > 0 ? (
                <div className="channel-grid">{visibleBrowseChannels.map(renderChannelCard)}</div>
              ) : (
                <div className="empty">
                  <Icon name="tv" />
                  <strong>No channels here yet</strong>
                  <p>Go back home or choose another collection.</p>
                  <button className="secondary-button" onClick={() => navigate({ kind: "home" })}>
                    Go home
                  </button>
                </div>
              )}
            </section>
          </section>
        )}

        {view.kind === "watch" && (
          <section className="watch-view">
            <div className="watch-topline">
              <button className="secondary-button" onClick={goBack}>
                <Icon name="back" />
                Back
              </button>
              <button
                className={`secondary-button ${favorites.includes(view.channel.id) ? "is-saved" : ""}`}
                onClick={() => toggleFavorite(view.channel.id)}
                aria-label={`${favorites.includes(view.channel.id) ? "Remove" : "Add"} ${view.channel.name} ${favorites.includes(view.channel.id) ? "from" : "to"} saved channels`}
              >
                <Icon name="star" filled={favorites.includes(view.channel.id)} />
                {favorites.includes(view.channel.id) ? "Saved" : "Save"}
              </button>
            </div>

            <section className="watch-hero" aria-labelledby="watch-title">
              <div className="watch-logo" aria-hidden="true">
                <ChannelLogo channel={view.channel} />
              </div>
              <div>
                <p className="eyebrow">{pathLabel(view.channel.groupPath)}</p>
                <h1 id="watch-title">{view.channel.name}</h1>
              </div>
              <button className="primary-button" onClick={() => navigate({ kind: "browse", path: view.channel.groupPath })}>
                More like this
              </button>
            </section>

            <Player channel={view.channel} />

            <div className="watch-info">
              <div className="now-playing">
                <span className="live-pill">
                  <Icon name="play" />
                  Live now
                </span>
                <span>{view.channel.country ?? "Live TV"}</span>
              </div>
              <div className="watch-nav" aria-label="Channel navigation">
                <button className="secondary-button" disabled={!previousChannel} onClick={() => previousChannel && openChannel(previousChannel)}>
                  <Icon name="back" />
                  Previous
                </button>
                <button className="secondary-button" disabled={!nextChannel} onClick={() => nextChannel && openChannel(nextChannel)}>
                  Next
                  <Icon name="chevron" />
                </button>
              </div>
            </div>

            {currentGroupChannels.length > 1 && (
              <section className="section nearby-section" aria-labelledby="nearby-title">
                <div className="section-head">
                  <div>
                    <p className="eyebrow">Same folder</p>
                    <h2 id="nearby-title">Other channels</h2>
                  </div>
                </div>
                <div className="channel-grid compact-grid">
                  {currentGroupChannels.filter((channel) => channel.id !== view.channel.id).slice(0, 6).map(renderChannelCard)}
                </div>
              </section>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
