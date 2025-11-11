import {
   boolean,
   integer,
   pgTable,
   text,
   timestamp,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
   banExpires: timestamp("ban_expires"),
   banned: boolean("banned").default(false),
   banReason: text("ban_reason"),
   createdAt: timestamp("created_at").defaultNow().notNull(),
   email: text("email").notNull().unique(),
   emailVerified: boolean("email_verified").default(false).notNull(),
   id: text("id").primaryKey(),
   image: text("image"),
   name: text("name").notNull(),
   role: text("role"),
   updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
});

export const session = pgTable("session", {
   activeOrganizationId: text("active_organization_id"),
   activeTeamId: text("active_team_id"),
   createdAt: timestamp("created_at").defaultNow().notNull(),
   expiresAt: timestamp("expires_at").notNull(),
   id: text("id").primaryKey(),
   impersonatedBy: text("impersonated_by"),
   ipAddress: text("ip_address"),
   token: text("token").notNull().unique(),
   updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
   userAgent: text("user_agent"),
   userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
   accessToken: text("access_token"),
   accessTokenExpiresAt: timestamp("access_token_expires_at"),
   accountId: text("account_id").notNull(),
   createdAt: timestamp("created_at").defaultNow().notNull(),
   id: text("id").primaryKey(),
   idToken: text("id_token"),
   password: text("password"),
   providerId: text("provider_id").notNull(),
   refreshToken: text("refresh_token"),
   refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
   scope: text("scope"),
   updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
   userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
});

export const verification = pgTable("verification", {
   createdAt: timestamp("created_at").defaultNow().notNull(),
   expiresAt: timestamp("expires_at").notNull(),
   id: text("id").primaryKey(),
   identifier: text("identifier").notNull(),
   updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
   value: text("value").notNull(),
});

export const team = pgTable("team", {
   createdAt: timestamp("created_at").notNull(),
   description: text("description").default(""),
   id: text("id").primaryKey(),
   name: text("name").notNull(),
   organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
   updatedAt: timestamp("updated_at").$onUpdate(
      () => /* @__PURE__ */ new Date(),
   ),
});

export const teamMember = pgTable("team_member", {
   createdAt: timestamp("created_at"),
   id: text("id").primaryKey(),
   teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
   userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
});

export const organization = pgTable("organization", {
   createdAt: timestamp("created_at").notNull(),
   description: text("description").default(""),
   id: text("id").primaryKey(),
   logo: text("logo"),
   metadata: text("metadata"),
   name: text("name").notNull(),
   slug: text("slug").notNull().unique(),
});

export const member = pgTable("member", {
   createdAt: timestamp("created_at").notNull(),
   id: text("id").primaryKey(),
   organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
   role: text("role").default("member").notNull(),
   userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
});

export const invitation = pgTable("invitation", {
   email: text("email").notNull(),
   expiresAt: timestamp("expires_at").notNull(),
   id: text("id").primaryKey(),
   inviterId: text("inviter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
   organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
   role: text("role"),
   status: text("status").default("pending").notNull(),
   teamId: text("team_id"),
});

export const apikey = pgTable("apikey", {
   createdAt: timestamp("created_at").notNull(),
   enabled: boolean("enabled").default(true),
   expiresAt: timestamp("expires_at"),
   id: text("id").primaryKey(),
   key: text("key").notNull(),
   lastRefillAt: timestamp("last_refill_at"),
   lastRequest: timestamp("last_request"),
   metadata: text("metadata"),
   name: text("name"),
   permissions: text("permissions"),
   prefix: text("prefix"),
   rateLimitEnabled: boolean("rate_limit_enabled").default(true),
   rateLimitMax: integer("rate_limit_max").default(500),
   rateLimitTimeWindow: integer("rate_limit_time_window").default(3600000),
   refillAmount: integer("refill_amount"),
   refillInterval: integer("refill_interval"),
   remaining: integer("remaining"),
   requestCount: integer("request_count").default(0),
   start: text("start"),
   updatedAt: timestamp("updated_at").notNull(),
   userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
});
