import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { and, asc, eq } from "drizzle-orm";
import { channelSources, channels } from "../drizzle/schema";
import { getAdminSnapshot, getPublicM3U, refreshPlaylist } from "./playlist";
import { getDb } from "./db";

const channelInput = z.object({
  name: z.string().min(1).max(160),
  slug: z.string().min(1).max(180).regex(/^[a-z0-9-]+$/),
  category: z.string().min(1).max(100),
  groupTitle: z.string().min(1).max(140),
  tvgId: z.string().max(180).optional().nullable(),
  logoUrl: z.string().url().optional().nullable().or(z.literal("")),
  officialPageUrl: z.string().url(),
  enabled: z.boolean().default(true),
});

const sourceInput = z.object({
  channelId: z.number().int().positive(),
  label: z.string().min(1).max(160),
  url: z.string().url(),
  publishedByOfficial: z.boolean().default(false),
  enabled: z.boolean().default(true),
});

export const appRouter = router({
  system: router({
    health: publicProcedure.query(() => ({ ok: true, service: "vistaplay-playlist" })),
  }),
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  playlist: router({
    publicText: publicProcedure.query(() => getPublicM3U()),
    snapshot: adminProcedure.query(() => getAdminSnapshot()),
    createChannel: adminProcedure.input(channelInput).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Banco de dados não configurado");
      const created = await db.insert(channels).values({ ...input, logoUrl: input.logoUrl || null, tvgId: input.tvgId || null }).$returningId();
      return created[0];
    }),
    updateChannel: adminProcedure.input(channelInput.extend({ id: z.number().int().positive() })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Banco de dados não configurado");
      const { id, ...values } = input;
      await db.update(channels).set({ ...values, logoUrl: values.logoUrl || null, tvgId: values.tvgId || null, updatedAt: new Date() }).where(eq(channels.id, id));
      return { success: true };
    }),
    deleteChannel: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Banco de dados não configurado");
      await db.delete(channelSources).where(eq(channelSources.channelId, input.id));
      await db.delete(channels).where(eq(channels.id, input.id));
      return { success: true };
    }),
    createSource: adminProcedure.input(sourceInput).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Banco de dados não configurado");
      const created = await db.insert(channelSources).values(input).$returningId();
      return created[0];
    }),
    updateSource: adminProcedure.input(sourceInput.extend({ id: z.number().int().positive() })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Banco de dados não configurado");
      const { id, ...values } = input;
      await db.update(channelSources).set({ ...values, updatedAt: new Date() }).where(eq(channelSources.id, id));
      return { success: true };
    }),
    deleteSource: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Banco de dados não configurado");
      await db.delete(channelSources).where(eq(channelSources.id, input.id));
      return { success: true };
    }),
    refresh: adminProcedure.input(z.object({ trigger: z.string().default("manual") })).mutation(({ input }) => refreshPlaylist(input.trigger)),
  }),
});

export type AppRouter = typeof appRouter;
