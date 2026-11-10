import { describe, expect, it } from "vitest";
import { buildM3U, type PlaylistChannel } from "./playlist";

const base = (overrides: Partial<PlaylistChannel> = {}): PlaylistChannel => ({
  id: 1,
  name: "RedeTV!",
  slug: "redetv",
  category: "RedeTV!",
  groupTitle: "Canais | RedeTV!",
  tvgId: "redetv.br",
  logoUrl: null,
  officialPageUrl: "https://www.redetv.uol.com.br/aovivo",
  status: "online",
  enabled: true,
  lastCheckedAt: null,
  lastError: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  sources: [{
    id: 1,
    channelId: 1,
    label: "Fonte oficial",
    url: "https://example.com/live/index.m3u8",
    publishedByOfficial: true,
    enabled: true,
    status: "online",
    lastCheckedAt: new Date(),
    lastHttpStatus: 200,
    lastError: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }],
  ...overrides,
});

describe("buildM3U", () => {
  it("emite cabeçalho, grupo e somente a fonte online", () => {
    const output = buildM3U([base()]);
    expect(output).toContain("#EXTM3U");
    expect(output).toContain('group-title="Canais | RedeTV!"');
    expect(output).toContain("https://example.com/live/index.m3u8");
  });

  it("não emite canal sem fonte online ou desabilitado", () => {
    const offline = base({ status: "offline", sources: [{ ...base().sources[0], status: "offline" }] });
    const disabled = base({ enabled: false });
    expect(buildM3U([offline, disabled])).toBe("#EXTM3U\n");
  });

  it("escapa aspas de metadados sem alterar a URL", () => {
    const output = buildM3U([base({ name: 'Canal "Oficial"' })]);
    expect(output).toContain("Canal 'Oficial'");
    expect(output).toContain("https://example.com/live/index.m3u8");
  });
});
