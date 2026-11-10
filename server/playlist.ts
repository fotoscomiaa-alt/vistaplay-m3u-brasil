import { and, asc, desc, eq } from "drizzle-orm";
import { channelSources, channels, playlistRuns } from "../drizzle/schema";
import { getDb } from "./db";

const REQUEST_TIMEOUT_MS = 9000;

export type PlaylistChannel = typeof channels.$inferSelect & {
  sources: Array<typeof channelSources.$inferSelect>;
};

function escapeM3U(value: string | null | undefined) {
  return (value ?? "").replace(/"/g, "'").replace(/[\r\n]/g, " ").trim();
}

export function buildM3U(items: PlaylistChannel[]) {
  const lines = ["#EXTM3U"];
  for (const channel of items) {
    if (!channel.enabled || channel.status !== "online") continue;
    const source = channel.sources.find((item) => item.enabled && item.status === "online");
    if (!source) continue;
    const attrs = [
      `tvg-id="${escapeM3U(channel.tvgId ?? channel.slug)}"`,
      `tvg-name="${escapeM3U(channel.name)}"`,
      channel.logoUrl ? `tvg-logo="${escapeM3U(channel.logoUrl)}"` : "",
      `group-title="${escapeM3U(channel.groupTitle)}"`,
    ].filter(Boolean).join(" ");
    lines.push(`#EXTINF:-1 ${attrs},${escapeM3U(channel.name)}`);
    lines.push(source.url);
  }
  return `${lines.join("\n")}\n`;
}

export async function getPlaylistChannels(): Promise<PlaylistChannel[]> {
  const db = await getDb();
  if (!db) return [];
  const channelRows = await db.select().from(channels).orderBy(asc(channels.category), asc(channels.name));
  const sourceRows = await db.select().from(channelSources).orderBy(asc(channelSources.id));
  return channelRows.map((channel) => ({
    ...channel,
    sources: sourceRows.filter((source) => source.channelId === channel.id),
  }));
}

export async function getPublicM3U() {
  return buildM3U(await getPlaylistChannels());
}

export async function getAdminSnapshot() {
  const db = await getDb();
  if (!db) return { channels: [], sources: [], runs: [] };
  const [channelRows, sourceRows, runs] = await Promise.all([
    db.select().from(channels).orderBy(asc(channels.category), asc(channels.name)),
    db.select().from(channelSources).orderBy(asc(channelSources.channelId), asc(channelSources.id)),
    db.select().from(playlistRuns).orderBy(desc(playlistRuns.startedAt)).limit(20),
  ]);
  return { channels: channelRows, sources: sourceRows, runs };
}

async function checkHls(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { "User-Agent": "VistaPlay-Authorized-Playlist-Monitor/1.0", Range: "bytes=0-8191" },
      redirect: "follow",
      signal: controller.signal,
    });
    const body = (await response.text()).slice(0, 16000).toLowerCase();
    const looksLikeManifest = body.includes("#extm3u") || body.includes("#ext-x-");
    const ok = (response.status === 200 || response.status === 206) && looksLikeManifest;
    return { ok, status: response.status, error: ok ? null : "Resposta sem manifesto HLS válido" };
  } catch (error) {
    return { ok: false, status: 0, error: error instanceof Error ? error.message : "Falha de rede" };
  } finally {
    clearTimeout(timeout);
  }
}

export async function refreshPlaylist(trigger = "manual") {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados não configurado");
  const startedAt = new Date();
  const run = await db.insert(playlistRuns).values({ trigger, startedAt }).$returningId();
  const runId = run[0]?.id;
  const sourceRows = await db.select().from(channelSources).where(eq(channelSources.enabled, true));
  const checkedAt = new Date();
  let onlineCount = 0;
  let offlineCount = 0;
  for (const source of sourceRows) {
    const result = await checkHls(source.url);
    if (result.ok) onlineCount += 1; else offlineCount += 1;
    await db.update(channelSources).set({
      status: result.ok ? "online" : "offline",
      lastCheckedAt: checkedAt,
      lastHttpStatus: result.status || null,
      lastError: result.error,
      updatedAt: checkedAt,
    }).where(eq(channelSources.id, source.id));
  }

  const channelRows = await db.select().from(channels);
  let pageOnlyCount = 0;
  for (const channel of channelRows) {
    const sources = await db.select().from(channelSources).where(and(eq(channelSources.channelId, channel.id), eq(channelSources.enabled, true)));
    const hasDirectSources = sources.length > 0;
    const hasOnlineSource = sources.some((source) => source.status === "online");
    const status = hasOnlineSource ? "online" : hasDirectSources ? "offline" : "official_page_only";
    if (status === "official_page_only") pageOnlyCount += 1;
    await db.update(channels).set({ status, lastCheckedAt: checkedAt, lastError: status === "offline" ? "Nenhuma fonte direta autorizada respondeu" : null, updatedAt: checkedAt }).where(eq(channels.id, channel.id));
  }

  const finishedAt = new Date();
  if (runId) {
    await db.update(playlistRuns).set({ finishedAt, checkedCount: sourceRows.length, onlineCount, offlineCount, pageOnlyCount, notes: "Verificação limitada a URLs diretas publicadas por fontes autorizadas." }).where(eq(playlistRuns.id, runId));
  }
  return { checkedCount: sourceRows.length, onlineCount, offlineCount, pageOnlyCount, finishedAt };
}
