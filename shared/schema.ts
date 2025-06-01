import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table per PRD specification
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  name: varchar("name").notNull(),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash").notNull(),
  role: varchar("role").notNull(), // "General User", "Department Member", "Administrator"
  department: varchar("department"), // null for General User, e.g., "IT", "HR", "Admin"
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tickets table
export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: varchar("status").notNull().default("open"), // open, in_progress, resolved, closed
  priority: varchar("priority").notNull().default("medium"), // low, medium, high, urgent
  department: varchar("department").notNull(), // IT, HR, Admin
  userId: varchar("user_id").notNull(),
  assignedTo: varchar("assigned_to"),
  aiRouted: boolean("ai_routed").default(false),
  aiConfidence: integer("ai_confidence"),
  attachments: text("attachments").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Comments table
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull(),
  userId: varchar("user_id").notNull(),
  content: text("content").notNull(),
  isInternal: boolean("is_internal").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Documents table for HelpBot knowledge base
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: varchar("category").notNull(), // IT, HR, Admin, General
  uploadedBy: varchar("uploaded_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI logs for tracking AI actions
export const aiLogs = pgTable("ai_logs", {
  id: serial("id").primaryKey(),
  action: varchar("action").notNull(), // route, suggest_reply, helpbot_response
  ticketId: integer("ticket_id"),
  input: text("input").notNull(),
  output: text("output").notNull(),
  confidence: integer("confidence"),
  accepted: boolean("accepted"),
  createdAt: timestamp("created_at").defaultNow(),
});

// FAQ entries
export const faqs = pgTable("faqs", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: varchar("category").notNull(),
  views: integer("views").default(0),
  helpful: integer("helpful").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Pattern Detector: Ticket Clusters
export const clusters = pgTable("clusters", {
  id: serial("id").primaryKey(),
  keywords: text("keywords").notNull(), // JSON array of extracted keywords
  centroidEmbedding: text("centroid_embedding").notNull(), // JSON array of embedding values
  memberTicketIds: text("member_ticket_ids").notNull(), // JSON array of ticket IDs
  department: varchar("department").notNull(),
  firstSeen: timestamp("first_seen").defaultNow().notNull(),
  lastSeen: timestamp("last_seen").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  alertSent: boolean("alert_sent").default(false).notNull(),
  incidentTicketId: integer("incident_ticket_id"), // Reference to created incident ticket
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Pattern Detector: Incident Tickets (special parent tickets for clusters)
export const incidentTickets = pgTable("incident_tickets", {
  id: serial("id").primaryKey(),
  clusterId: integer("cluster_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: varchar("status").notNull().default("open"), // open, investigating, resolved
  priority: varchar("priority").notNull().default("high"),
  department: varchar("department").notNull(),
  assignedTo: varchar("assigned_to"),
  impactedUsers: integer("impacted_users").default(0),
  estimatedResolution: timestamp("estimated_resolution"),
  publicStatement: text("public_statement"), // Optional public update
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Pattern Detector: Pattern Alerts
export const patternAlerts = pgTable("pattern_alerts", {
  id: serial("id").primaryKey(),
  clusterId: integer("cluster_id").notNull(),
  alertType: varchar("alert_type").notNull(), // threshold_exceeded, spam_detected, unusual_pattern
  severity: varchar("severity").notNull(), // low, medium, high, critical
  message: text("message").notNull(),
  department: varchar("department").notNull(),
  acknowledged: boolean("acknowledged").default(false),
  acknowledgedBy: varchar("acknowledged_by"),
  acknowledgedAt: timestamp("acknowledged_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Pattern Detector: Spam Detection
export const spamDetections = pgTable("spam_detections", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull(),
  userId: varchar("user_id").notNull(),
  reason: varchar("reason").notNull(), // rapid_submission, duplicate_content, suspicious_pattern
  confidence: integer("confidence").notNull(), // 0-100
  status: varchar("status").notNull().default("pending"), // pending, confirmed, dismissed
  reviewedBy: varchar("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  tickets: many(tickets),
  comments: many(comments),
  documents: many(documents),
  aiLogs: many(aiLogs),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  user: one(users, {
    fields: [tickets.userId],
    references: [users.id],
  }),
  assignee: one(users, {
    fields: [tickets.assignedTo],
    references: [users.id],
  }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  ticket: one(tickets, {
    fields: [comments.ticketId],
    references: [tickets.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  uploader: one(users, {
    fields: [documents.uploadedBy],
    references: [users.id],
  }),
}));

export const aiLogsRelations = relations(aiLogs, ({ one }) => ({
  ticket: one(tickets, {
    fields: [aiLogs.ticketId],
    references: [tickets.id],
  }),
}));

// Pattern Detector Relations
export const clustersRelations = relations(clusters, ({ one, many }) => ({
  incidentTicket: one(incidentTickets, {
    fields: [clusters.incidentTicketId],
    references: [incidentTickets.id],
  }),
  alerts: many(patternAlerts),
}));

export const incidentTicketsRelations = relations(incidentTickets, ({ one }) => ({
  cluster: one(clusters, {
    fields: [incidentTickets.clusterId],
    references: [clusters.id],
  }),
  assignee: one(users, {
    fields: [incidentTickets.assignedTo],
    references: [users.id],
  }),
}));

export const patternAlertsRelations = relations(patternAlerts, ({ one }) => ({
  cluster: one(clusters, {
    fields: [patternAlerts.clusterId],
    references: [clusters.id],
  }),
  acknowledgedByUser: one(users, {
    fields: [patternAlerts.acknowledgedBy],
    references: [users.id],
  }),
}));

export const spamDetectionsRelations = relations(spamDetections, ({ one }) => ({
  ticket: one(tickets, {
    fields: [spamDetections.ticketId],
    references: [tickets.id],
  }),
  user: one(users, {
    fields: [spamDetections.userId],
    references: [users.id],
  }),
  reviewedByUser: one(users, {
    fields: [spamDetections.reviewedBy],
    references: [users.id],
  }),
}));

// Schemas for validation per PRD specification
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  passwordHash: true,
  createdAt: true,
}).extend({
  password: z.string().min(6),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const departmentLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  department: z.string().min(1),
});

export const signupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  aiRouted: true,
  aiConfidence: true,
}).extend({
  attachments: z.array(z.string()).optional(),
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiLogSchema = createInsertSchema(aiLogs).omit({
  id: true,
  createdAt: true,
});

export const insertFaqSchema = createInsertSchema(faqs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  views: true,
  helpful: true,
});

// Pattern Detector Validation Schemas
export const insertClusterSchema = createInsertSchema(clusters).omit({
  id: true,
  createdAt: true,
  firstSeen: true,
  lastSeen: true,
  isActive: true,
  alertSent: true,
});

export const insertIncidentTicketSchema = createInsertSchema(incidentTickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPatternAlertSchema = createInsertSchema(patternAlerts).omit({
  id: true,
  createdAt: true,
  acknowledged: true,
});

export const insertSpamDetectionSchema = createInsertSchema(spamDetections).omit({
  id: true,
  createdAt: true,
  status: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Ticket = typeof tickets.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertAiLog = z.infer<typeof insertAiLogSchema>;
export type AiLog = typeof aiLogs.$inferSelect;
export type InsertFaq = z.infer<typeof insertFaqSchema>;
export type Faq = typeof faqs.$inferSelect;

// Pattern Detector Types
export type InsertCluster = z.infer<typeof insertClusterSchema>;
export type Cluster = typeof clusters.$inferSelect;
export type InsertIncidentTicket = z.infer<typeof insertIncidentTicketSchema>;
export type IncidentTicket = typeof incidentTickets.$inferSelect;
export type InsertPatternAlert = z.infer<typeof insertPatternAlertSchema>;
export type PatternAlert = typeof patternAlerts.$inferSelect;
export type InsertSpamDetection = z.infer<typeof insertSpamDetectionSchema>;
export type SpamDetection = typeof spamDetections.$inferSelect;
