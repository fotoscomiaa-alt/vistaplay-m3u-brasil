import type { Express } from "express";
import { getPublicM3U } from "../playlist";

export function registerPlaylistRoute(app: Express) {
  app.get(["/lista.m3u", "/lista.m3u8", "/api/playlist.m3u"], async (_req, res) => {
    try {
      const body = await getPublicM3U();
      res.setHeader("Content-Type", "audio/x-mpegurl; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=120, must-revalidate");
      res.setHeader("Content-Disposition", 'inline; filename="lista.m3u"');
      res.status(200).send(body);
    } catch {
      res.status(503).type("text/plain").send("Playlist temporariamente indisponível");
    }
  });
}
