import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
export const users = sqliteTable("users", {
 id: text("id").primaryKey(), username: text("username").notNull().unique(), email: text("email").notNull().unique(),
 passwordHash: text("password_hash").notNull(), displayName: text("display_name").notNull(), participantId: text("participant_id").notNull().unique(),
 role: text("role", { enum: ["participant", "admin"] }).notNull().default("participant"), createdAt: integer("created_at").notNull(), startedAt: integer("started_at"),
});
export const sessions = sqliteTable("sessions", {
 tokenHash: text("token_hash").primaryKey(), userId: text("user_id").notNull().references(()=>users.id,{onDelete:"cascade"}),
 createdAt: integer("created_at").notNull(), expiresAt: integer("expires_at").notNull(),
}, t=>[index("sessions_user").on(t.userId),index("sessions_expiry").on(t.expiresAt)]);
export const challenges = sqliteTable("challenges", {
 id: text("id").primaryKey(), challengeCode: text("challenge_code").notNull().unique(), title: text("title").notNull(),
 category: text("category").notNull(), difficulty: text("difficulty").notNull(), description: text("description").notNull(),
 active: integer("active").notNull().default(0), starting: integer("starting").notNull().default(0),
});
export const participantChallenges = sqliteTable("participant_challenges", {
 userId: text("user_id").primaryKey().references(()=>users.id,{onDelete:"cascade"}), challengeId: text("challenge_id").notNull().references(()=>challenges.id),
 assignedAt: integer("assigned_at").notNull(), startedAt: integer("started_at").notNull(), solvedAt: integer("solved_at"),
});
export const announcements = sqliteTable("announcements", { id:text("id").primaryKey(), body:text("body").notNull(), publishedAt:integer("published_at").notNull() });
export const authLimits = sqliteTable("auth_limits", { key:text("key").primaryKey(), attempts:integer("attempts").notNull(), resetsAt:integer("resets_at").notNull() },t=>[index("auth_limits_expiry").on(t.resetsAt)]);
