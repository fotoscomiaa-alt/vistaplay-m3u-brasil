import { useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";
import {
  ChevronRight,
  Heart,
  ListVideo,
  LoaderCircle,
  Play,
  Radio,
  Search,
  Settings2,
  Signal,
  SlidersHorizontal,
  Sparkles,
  Volume2,
  X,
} from "lucide-react";

const DEFAULT_PLAYLIST =
  "https://raw.githubusercontent.com/DEvmIb/famelack-channels-m3u/main/m3u/br.m3u";

interface Channel {
  name: string;
  url: string;
  group: string;
  logo?: string;
  number?: string;
}

const FALLBACK_CHANNELS: Channel[] = [
  { name: "AgroCanal", url: "https://aovivo.equipea.com.br:5443/aovivort/streams/pshRLrnv6isXq7RG4747567774043229.m3u8", group: "Canais Brasil", number: "01" },
  { name: "Amazon Sat", url: "https://amazonsat.brasilstream.com.br/hls/amazonsat/index.m3u8", group: "Canais Brasil", number: "02" },
  { name: "Araruna TV", url: "https://video05.logicahost.com.br/ararunatv/ararunatv/playlist.m3u8", group: "Canais Brasil", number: "03" },
  { name: "Aratu On", url: "https://cdn.live.br1.jmvstream.com/w/LVW-9359/LVW9359_XSyReL0QVf/playlist.m3u8", group: "Canais Brasil", number: "04" },
  { name: "AWTV", url: "https://awtv.nuvemplay.live/hls/stream.m3u8", group: "Canais Brasil", number: "05" },
  { name: "Band", url: "https://media.cdntvms.com.br/band_sat/index.m3u8", group: "Canais Brasil", number: "06" },
  { name: "Bem Mais TV", url: "https://d1wphzgkgc.map.azionedge.net/bemmaistv01/bemmaistv01/playlist.m3u8", group: "Canais Brasil", number: "07" },
  { name: "BR8 TV", url: "https://cdn.live.br1.jmvstream.com/w/LVW-11668/ngrp:LVW11668_wiJpjbMrks_all/playlist.m3u8", group: "Canais Brasil", number: "08" },
  { name: "Canal 25 Jundiai", url: "https://stream01.msolutionbrasil.com.br/hls/canal25/live.m3u8", group: "Canais Brasil", number: "09" },
  { name: "Canal Educação", url: "https://canaleducacao-stream.ebc.com.br/index.m3u8", group: "Canais Brasil", number: "10" },
  { name: "Canal Gov", url: "https://canalgov-stream.ebc.com.br/index.m3u8", group: "Canais Brasil", number: "11" },
  { name: "Cultura Fast", url: "https://fpa-gateway.tvcultura.com.br:8181/memfs/606caef0-a290-413d-9f1f-8fcdb3a73831.m3u8", group: "Canais Brasil", number: "12" },
];

function parseAttribute(line: string, key: string) {
  const match = line.match(new RegExp(`${key}="([^"]*)"`, "i"));
  return match?.[1] ?? "";
}

function parseM3U(text: string): Channel[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim());
  const parsed: Channel[] = [];
  let info: string | null = null;

  for (const line of lines) {
    if (line.startsWith("#EXTINF:")) {
      info = line;
      continue;
    }
    if (!line || line.startsWith("#") || !info) continue;
    if (!line.startsWith("http://") && !line.startsWith("https://")) continue;

    const comma = info.indexOf(",");
    const name = comma >= 0 ? info.slice(comma + 1).trim() : "Canal ao vivo";
    parsed.push({
      name: name || "Canal ao vivo",
      url: line,
      group: parseAttribute(info, "group-title") || "Canais Brasil",
      logo: parseAttribute(info, "tvg-logo") || undefined,
      number: String(parsed.length + 1).padStart(2, "0"),
    });
    info = null;
  }
  return parsed;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export default function Home() {
  const [channels, setChannels] = useState<Channel[]>(FALLBACK_CHANNELS);
  const [selected, setSelected] = useState<Channel>(FALLBACK_CHANNELS[0]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState("Todos");
  const [playlistUrl, setPlaylistUrl] = useState(DEFAULT_PLAYLIST);
  const [sourceStatus, setSourceStatus] = useState<"loading" | "ready" | "fallback">("loading");
  const [sourceMessage, setSourceMessage] = useState("Carregando lista");
  const [playerError, setPlayerError] = useState("");
  const [showSource, setShowSource] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const loadPlaylist = async (url = playlistUrl) => {
    setSourceStatus("loading");
    setSourceMessage("Lendo playlist M3U…");
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Não foi possível acessar a lista");
      const text = await response.text();
      const parsed = parseM3U(text);
      if (!parsed.length) throw new Error("A lista não contém canais válidos");
      setChannels(parsed);
      setSelected((current) => parsed.find((channel) => channel.url === current.url) ?? parsed[0]);
      setSourceStatus("ready");
      setSourceMessage(`${parsed.length} canais conectados`);
    } catch {
      setChannels(FALLBACK_CHANNELS);
      setSelected(FALLBACK_CHANNELS[0]);
      setSourceStatus("fallback");
      setSourceMessage("Amostra local carregada");
    }
  };

  useEffect(() => {
    void loadPlaylist();
  }, []);

  useEffect(() => {
    if (!selected || !videoRef.current) return;
    const video = videoRef.current;
    let hls: Hls | null = null;
    setPlayerError("");
    video.removeAttribute("src");
    video.load();

    const onError = () => setPlayerError("Este canal não respondeu. Tente outro canal da lista.");
    video.addEventListener("error", onError);

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = selected.url;
      void video.play().catch(() => undefined);
    } else if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hls.loadSource(selected.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => void video.play().catch(() => undefined));
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) setPlayerError("Não foi possível iniciar esta transmissão.");
      });
    } else {
      video.src = selected.url;
    }

    return () => {
      video.removeEventListener("error", onError);
      hls?.destroy();
    };
  }, [selected]);

  const groups = useMemo(() => ["Todos", ...Array.from(new Set(channels.map((channel) => channel.group)))], [channels]);
  const visibleChannels = useMemo(() => {
    const query = search.toLowerCase().trim();
    return channels.filter((channel) => {
      const matchesGroup = activeGroup === "Todos" || channel.group === activeGroup;
      const matchesSearch = !query || channel.name.toLowerCase().includes(query);
      return matchesGroup && matchesSearch;
    });
  }, [activeGroup, channels, search]);

  const toggleFavorite = (name: string) => {
    setFavorites((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name]);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand-mark">
            <div className="brand-orb"><Radio size={18} strokeWidth={2.4} /></div>
            <div>
              <div className="brand-name">VISTA<span>PLAY</span></div>
              <div className="brand-caption">live channels</div>
            </div>
          </div>
          <div className="topbar-actions">
            <div className="connection-pill"><span className={`status-dot ${sourceStatus}`} /> {sourceMessage}</div>
            <button className="icon-button" onClick={() => setShowSource((value) => !value)} aria-label="Configurar fonte"><Settings2 size={18} /></button>
          </div>
        </div>
      </header>

      <main className="page-container">
        <section className="hero-row">
          <div className="hero-copy">
            <div className="eyebrow"><Sparkles size={14} /> SUA CENTRAL AO VIVO</div>
            <h1>Assista ao que<br /><em>está acontecendo.</em></h1>
            <p>Um player leve para organizar sua lista M3U em uma experiência simples, rápida e sem distrações.</p>
          </div>
          <div className="hero-stat-card">
            <div className="stat-label">TRANSMISSÃO ATIVA</div>
            <div className="stat-main"><span className="live-pulse" /> AO VIVO</div>
            <div className="stat-footer"><span>{channels.length} canais disponíveis</span><Signal size={16} /></div>
          </div>
        </section>

        {showSource && (
          <section className="source-panel">
            <div>
              <div className="panel-kicker">FONTE DA PLAYLIST</div>
              <strong>Conecte sua lista M3U autorizada</strong>
              <p>O endereço é salvo apenas nesta sessão do navegador.</p>
            </div>
            <div className="source-form">
              <input value={playlistUrl} onChange={(event) => setPlaylistUrl(event.target.value)} aria-label="URL da playlist M3U" />
              <button onClick={() => void loadPlaylist()} className="primary-button">Carregar lista</button>
            </div>
          </section>
        )}

        <section className="player-grid">
          <div className="player-card">
            <div className="video-frame">
              <video ref={videoRef} controls playsInline poster="" />
              {!playerError && <div className="video-topline"><span className="live-tag">● LIVE</span><span>{selected.name}</span></div>}
              {playerError && <div className="player-empty"><div className="empty-icon"><Signal size={23} /></div><strong>Sinal indisponível</strong><span>{playerError}</span></div>}
              <div className="video-fade" />
            </div>
            <div className="player-meta">
              <div>
                <div className="now-playing-label"><span className="mini-live" /> NO AR AGORA</div>
                <h2>{selected.name}</h2>
                <div className="meta-sub"><span>{selected.group}</span><span className="meta-separator">•</span><span>Transmissão ao vivo</span></div>
              </div>
              <button className={`favorite-button ${favorites.includes(selected.name) ? "is-favorite" : ""}`} onClick={() => toggleFavorite(selected.name)} aria-label="Favoritar canal"><Heart size={19} fill={favorites.includes(selected.name) ? "currentColor" : "none"} /></button>
            </div>
          </div>

          <aside className="up-next-card">
            <div className="section-heading"><div><div className="panel-kicker">SUA PROGRAMAÇÃO</div><h3>Próximos canais</h3></div><ListVideo size={18} /></div>
            <div className="mini-channel-list">
              {channels.slice(0, 5).map((channel) => (
                <button key={channel.url} className={`mini-channel ${channel.url === selected.url ? "active" : ""}`} onClick={() => setSelected(channel)}>
                  <span className="mini-number">{channel.number}</span><span className="mini-channel-name">{channel.name}</span><ChevronRight size={15} />
                </button>
              ))}
            </div>
            <div className="up-next-footer"><Volume2 size={14} /> Selecione um canal para começar</div>
          </aside>
        </section>

        <section className="channel-section">
          <div className="channel-toolbar">
            <div><div className="panel-kicker">BIBLIOTECA AO VIVO</div><h2>Todos os canais</h2></div>
            <div className="search-wrap"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar canal" /><kbd>⌘ K</kbd>{search && <button onClick={() => setSearch("")} aria-label="Limpar busca"><X size={15} /></button>}</div>
          </div>
          <div className="filter-row">
            <div className="group-tabs">{groups.map((group) => <button key={group} className={activeGroup === group ? "active" : ""} onClick={() => setActiveGroup(group)}>{group}</button>)}</div>
            <div className="result-count"><SlidersHorizontal size={14} /> {visibleChannels.length} resultados</div>
          </div>
          {visibleChannels.length ? <div className="channel-grid">
            {visibleChannels.map((channel, index) => (
              <button key={`${channel.url}-${index}`} className={`channel-card ${selected.url === channel.url ? "selected" : ""}`} onClick={() => { setSelected(channel); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                <div className={`channel-art art-${index % 5}`}>
                  {channel.logo ? <img src={channel.logo} alt="" /> : <span>{initials(channel.name)}</span>}
                  <span className="art-live">LIVE</span>
                </div>
                <div className="channel-info"><span className="channel-index">{channel.number}</span><span className="channel-name">{channel.name}</span><span className="channel-type">{channel.group}</span></div>
                <span className="card-play"><Play size={14} fill="currentColor" /></span>
              </button>
            ))}
          </div> : <div className="no-results"><Search size={22} /><strong>Nenhum canal encontrado</strong><span>Tente outro nome ou categoria.</span></div>}
        </section>

        <footer className="footer-note"><span>VISTAPLAY / PLAYER DEMO</span><span>Use apenas listas e conteúdos com autorização.</span></footer>
      </main>
    </div>
  );
}
