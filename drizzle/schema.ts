import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const channels = mysqlTable("playlist_channels", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  category: varchar("category", { length: 100 }).notNull(),
  groupTitle: varchar("groupTitle", { length: 140 }).notNull(),
  tvgId: varchar("tvgId", { length: 180 }),
  logoUrl: text("logoUrl"),
  officialPageUrl: text("officialPageUrl").notNull(),
  status: mysqlEnum("status", ["online", "offline", "official_page_only", "pending"]).default("pending").notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  lastCheckedAt: timestamp("lastCheckedAt"),
  lastError: text("lastError"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const channelSources = mysqlTable("playlist_channel_sources", {
  id: int("id").autoincrement().primaryKey(),
  channelId: int("channelId").notNull(),
  label: varchar("label", { length: 160 }).notNull(),
  url: text("url").notNull(),
  publishedByOfficial: boolean("publishedByOfficial").default(false).notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  status: mysqlEnum("status", ["online", "offline", "pending"]).default("pending").notNull(),
  lastCheckedAt: timestamp("lastCheckedAt"),
  lastHttpStatus: int("lastHttpStatus"),
  lastError: text("lastError"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const playlistRuns = mysqlTable("playlist_runs", {
  id: int("id").autoincrement().primaryKey(),
  trigger: varchar("trigger", { length: 80 }).notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  finishedAt: timestamp("finishedAt"),
  checkedCount: int("checkedCount").default(0).notNull(),
  onlineCount: int("onlineCount").default(0).notNull(),
  offlineCount: int("offlineCount").default(0).notNull(),
  pageOnlyCount: int("pageOnlyCount").default(0).notNull(),
  notes: text("notes"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Channel = typeof channels.$inferSelect;
export type ChannelSource = typeof channelSources.$inferSelect;
export type PlaylistRun = typeof playlistRuns.$inferSelect;
