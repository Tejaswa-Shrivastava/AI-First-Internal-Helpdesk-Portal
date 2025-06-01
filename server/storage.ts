import {
  users,
  tickets,
  comments,
  documents,
  aiLogs,
  faqs,
  clusters,
  incidentTickets,
  patternAlerts,
  spamDetections,
  type User,
  type UpsertUser,
  type Ticket,
  type InsertTicket,
  type Comment,
  type InsertComment,
  type Document,
  type InsertDocument,
  type AiLog,
  type InsertAiLog,
  type Faq,
  type InsertFaq,
  type Cluster,
  type InsertCluster,
  type IncidentTicket,
  type InsertIncidentTicket,
  type PatternAlert,
  type InsertPatternAlert,
  type SpamDetection,
  type InsertSpamDetection,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, like, count, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (PRD specification)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User>;
  
  // Ticket operations
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  getTicket(id: number): Promise<Ticket | undefined>;
  getTicketsByUser(userId: string): Promise<Ticket[]>;
  getTicketsByAssignee(assigneeId: string): Promise<Ticket[]>;
  getTicketsByDepartment(department: string): Promise<Ticket[]>;
  getUnassignedTickets(): Promise<Ticket[]>;
  updateTicketStatus(id: number, status: string): Promise<void>;
  assignTicket(id: number, assigneeId: string): Promise<void>;
  getAllTickets(limit?: number): Promise<Ticket[]>;
  
  // Comment operations
  createComment(comment: InsertComment): Promise<Comment>;
  getCommentsByTicket(ticketId: number): Promise<Comment[]>;
  
  // Document operations
  createDocument(document: InsertDocument): Promise<Document>;
  getDocuments(): Promise<Document[]>;
  getDocumentsByCategory(category: string): Promise<Document[]>;
  
  // AI Log operations
  createAiLog(log: InsertAiLog): Promise<AiLog>;
  getAiLogs(limit?: number): Promise<AiLog[]>;
  
  // FAQ operations
  createFaq(faq: InsertFaq): Promise<Faq>;
  getFaqs(): Promise<Faq[]>;
  getFaqsByCategory(category: string): Promise<Faq[]>;
  
  // Pattern Detector operations
  createCluster(cluster: InsertCluster): Promise<Cluster>;
  getCluster(id: number): Promise<Cluster | undefined>;
  getActiveClusters(department?: string): Promise<Cluster[]>;
  updateCluster(id: number, updates: Partial<Cluster>): Promise<void>;
  
  createIncidentTicket(incident: InsertIncidentTicket): Promise<IncidentTicket>;
  getIncidentTickets(department?: string): Promise<IncidentTicket[]>;
  updateIncidentTicket(id: number, updates: Partial<IncidentTicket>): Promise<void>;
  
  createPatternAlert(alert: InsertPatternAlert): Promise<PatternAlert>;
  getRecentPatternAlerts(department?: string, hours?: number): Promise<PatternAlert[]>;
  acknowledgePatternAlert(id: number, userId: string): Promise<void>;
  
  createSpamDetection(spam: InsertSpamDetection): Promise<SpamDetection>;
  getPendingSpamDetections(department?: string): Promise<SpamDetection[]>;
  updateSpamDetection(id: number, status: string, reviewedBy: string): Promise<void>;
  
  getRecentTicketsByUser(userId: string, since: Date): Promise<Ticket[]>;

  // Analytics
  getTicketStats(): Promise<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    byDepartment: Record<string, number>;
  }>;
  getAiAccuracy(): Promise<number>;
  getPatternDetection(): Promise<{
    highVolumeTopics: Array<{ topic: string; count: number }>;
    trendingTopics: Array<{ topic: string; count: number }>;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const id = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const [user] = await db
      .insert(users)
      .values({
        id,
        ...userData,
      })
      .returning();
    return user;
  }

  // Ticket operations
  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    const [newTicket] = await db
      .insert(tickets)
      .values(ticket)
      .returning();
    return newTicket;
  }

  async getTicket(id: number): Promise<Ticket | undefined> {
    const [ticket] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, id));
    return ticket;
  }

  async getTicketsByUser(userId: string): Promise<Ticket[]> {
    return await db
      .select()
      .from(tickets)
      .where(eq(tickets.userId, userId))
      .orderBy(desc(tickets.createdAt));
  }

  async getTicketsByAssignee(assigneeId: string): Promise<Ticket[]> {
    return await db
      .select()
      .from(tickets)
      .where(eq(tickets.assignedTo, assigneeId))
      .orderBy(desc(tickets.createdAt));
  }

  async getUnassignedTickets(): Promise<Ticket[]> {
    return await db
      .select()
      .from(tickets)
      .where(sql`${tickets.assignedTo} IS NULL`)
      .orderBy(desc(tickets.createdAt));
  }

  async getTicketsByDepartment(department: string): Promise<Ticket[]> {
    return await db
      .select()
      .from(tickets)
      .where(eq(tickets.department, department))
      .orderBy(desc(tickets.createdAt));
  }

  async updateTicketStatus(id: number, status: string): Promise<void> {
    await db
      .update(tickets)
      .set({ status, updatedAt: new Date() })
      .where(eq(tickets.id, id));
  }

  async assignTicket(id: number, assigneeId: string): Promise<void> {
    await db
      .update(tickets)
      .set({ assignedTo: assigneeId, updatedAt: new Date() })
      .where(eq(tickets.id, id));
  }

  async getAllTickets(limit = 100): Promise<Ticket[]> {
    return await db
      .select()
      .from(tickets)
      .orderBy(desc(tickets.createdAt))
      .limit(limit);
  }

  // Comment operations
  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db
      .insert(comments)
      .values(comment)
      .returning();
    return newComment;
  }

  async getCommentsByTicket(ticketId: number): Promise<Comment[]> {
    return await db
      .select()
      .from(comments)
      .where(eq(comments.ticketId, ticketId))
      .orderBy(comments.createdAt);
  }

  // Document operations
  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db
      .insert(documents)
      .values(document)
      .returning();
    return newDocument;
  }

  async getDocuments(): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .orderBy(desc(documents.createdAt));
  }

  async getDocumentsByCategory(category: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.category, category))
      .orderBy(desc(documents.createdAt));
  }

  // AI Log operations
  async createAiLog(log: InsertAiLog): Promise<AiLog> {
    const [newLog] = await db
      .insert(aiLogs)
      .values(log)
      .returning();
    return newLog;
  }

  async getAiLogs(limit = 50): Promise<AiLog[]> {
    return await db
      .select()
      .from(aiLogs)
      .orderBy(desc(aiLogs.createdAt))
      .limit(limit);
  }

  // FAQ operations
  async createFaq(faq: InsertFaq): Promise<Faq> {
    const [newFaq] = await db
      .insert(faqs)
      .values(faq)
      .returning();
    return newFaq;
  }

  async getFaqs(): Promise<Faq[]> {
    return await db
      .select()
      .from(faqs)
      .orderBy(desc(faqs.views));
  }

  async getFaqsByCategory(category: string): Promise<Faq[]> {
    return await db
      .select()
      .from(faqs)
      .where(eq(faqs.category, category))
      .orderBy(desc(faqs.views));
  }

  // Analytics
  async getTicketStats(): Promise<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    byDepartment: Record<string, number>;
  }> {
    const [totalResult] = await db
      .select({ count: count() })
      .from(tickets);

    const [openResult] = await db
      .select({ count: count() })
      .from(tickets)
      .where(eq(tickets.status, "open"));

    const [inProgressResult] = await db
      .select({ count: count() })
      .from(tickets)
      .where(eq(tickets.status, "in_progress"));

    const [resolvedResult] = await db
      .select({ count: count() })
      .from(tickets)
      .where(eq(tickets.status, "resolved"));

    const departmentStats = await db
      .select({
        department: tickets.department,
        count: count(),
      })
      .from(tickets)
      .groupBy(tickets.department);

    const byDepartment: Record<string, number> = {};
    departmentStats.forEach(stat => {
      byDepartment[stat.department] = stat.count;
    });

    return {
      total: totalResult.count,
      open: openResult.count,
      inProgress: inProgressResult.count,
      resolved: resolvedResult.count,
      byDepartment,
    };
  }

  async getAiAccuracy(): Promise<number> {
    const [totalLogs] = await db
      .select({ count: count() })
      .from(aiLogs)
      .where(eq(aiLogs.action, "route"));

    const [acceptedLogs] = await db
      .select({ count: count() })
      .from(aiLogs)
      .where(and(
        eq(aiLogs.action, "route"),
        eq(aiLogs.accepted, true)
      ));

    if (totalLogs.count === 0) return 0;
    return (acceptedLogs.count / totalLogs.count) * 100;
  }

  async getPatternDetection(): Promise<{
    highVolumeTopics: Array<{ topic: string; count: number }>;
    trendingTopics: Array<{ topic: string; count: number }>;
  }> {
    // Simplified pattern detection based on ticket titles
    const highVolumeQuery = await db
      .select({
        topic: sql<string>`CASE 
          WHEN LOWER(${tickets.title}) LIKE '%password%' THEN 'Password Issues'
          WHEN LOWER(${tickets.title}) LIKE '%vpn%' THEN 'VPN Issues'
          WHEN LOWER(${tickets.title}) LIKE '%email%' THEN 'Email Issues'
          WHEN LOWER(${tickets.title}) LIKE '%software%' THEN 'Software Requests'
          ELSE 'Other'
        END`,
        count: count(),
      })
      .from(tickets)
      .where(sql`${tickets.createdAt} > NOW() - INTERVAL '24 hours'`)
      .groupBy(sql`CASE 
        WHEN LOWER(${tickets.title}) LIKE '%password%' THEN 'Password Issues'
        WHEN LOWER(${tickets.title}) LIKE '%vpn%' THEN 'VPN Issues'
        WHEN LOWER(${tickets.title}) LIKE '%email%' THEN 'Email Issues'
        WHEN LOWER(${tickets.title}) LIKE '%software%' THEN 'Software Requests'
        ELSE 'Other'
      END`)
      .having(sql`COUNT(*) > 5`)
      .orderBy(desc(count()));

    const trendingQuery = await db
      .select({
        topic: sql<string>`CASE 
          WHEN LOWER(${tickets.title}) LIKE '%password%' THEN 'Password Issues'
          WHEN LOWER(${tickets.title}) LIKE '%vpn%' THEN 'VPN Issues'
          WHEN LOWER(${tickets.title}) LIKE '%email%' THEN 'Email Issues'
          WHEN LOWER(${tickets.title}) LIKE '%software%' THEN 'Software Requests'
          ELSE 'Other'
        END`,
        count: count(),
      })
      .from(tickets)
      .where(sql`${tickets.createdAt} > NOW() - INTERVAL '7 days'`)
      .groupBy(sql`CASE 
        WHEN LOWER(${tickets.title}) LIKE '%password%' THEN 'Password Issues'
        WHEN LOWER(${tickets.title}) LIKE '%vpn%' THEN 'VPN Issues'
        WHEN LOWER(${tickets.title}) LIKE '%email%' THEN 'Email Issues'
        WHEN LOWER(${tickets.title}) LIKE '%software%' THEN 'Software Requests'
        ELSE 'Other'
      END`)
      .having(sql`COUNT(*) > 3`)
      .orderBy(desc(count()));

    return {
      highVolumeTopics: highVolumeQuery,
      trendingTopics: trendingQuery,
    };
  }

  // Pattern Detector implementations
  async createCluster(cluster: InsertCluster): Promise<Cluster> {
    const [newCluster] = await db
      .insert(clusters)
      .values(cluster)
      .returning();
    return newCluster;
  }

  async getCluster(id: number): Promise<Cluster | undefined> {
    const [cluster] = await db
      .select()
      .from(clusters)
      .where(eq(clusters.id, id));
    return cluster;
  }

  async getActiveClusters(department?: string): Promise<Cluster[]> {
    const conditions = [eq(clusters.isActive, true)];
    
    if (department) {
      conditions.push(eq(clusters.department, department));
    }
    
    return await db
      .select()
      .from(clusters)
      .where(and(...conditions))
      .orderBy(desc(clusters.lastSeen));
  }

  async updateCluster(id: number, updates: Partial<Cluster>): Promise<void> {
    await db
      .update(clusters)
      .set(updates)
      .where(eq(clusters.id, id));
  }

  async createIncidentTicket(incident: InsertIncidentTicket): Promise<IncidentTicket> {
    const [newIncident] = await db
      .insert(incidentTickets)
      .values(incident)
      .returning();
    return newIncident;
  }

  async getIncidentTickets(department?: string): Promise<IncidentTicket[]> {
    const conditions = [];
    
    if (department) {
      conditions.push(eq(incidentTickets.department, department));
    }
    
    const query = db.select().from(incidentTickets);
    
    if (conditions.length > 0) {
      return await query.where(and(...conditions)).orderBy(desc(incidentTickets.createdAt));
    } else {
      return await query.orderBy(desc(incidentTickets.createdAt));
    }
  }

  async updateIncidentTicket(id: number, updates: Partial<IncidentTicket>): Promise<void> {
    await db
      .update(incidentTickets)
      .set(updates)
      .where(eq(incidentTickets.id, id));
  }

  async createPatternAlert(alert: InsertPatternAlert): Promise<PatternAlert> {
    const [newAlert] = await db
      .insert(patternAlerts)
      .values(alert)
      .returning();
    return newAlert;
  }

  async getRecentPatternAlerts(department?: string, hours = 24): Promise<PatternAlert[]> {
    const conditions = [sql`${patternAlerts.createdAt} > NOW() - INTERVAL '${hours} hours'`];
    
    if (department) {
      conditions.push(eq(patternAlerts.department, department));
    }
    
    return await db
      .select()
      .from(patternAlerts)
      .where(and(...conditions))
      .orderBy(desc(patternAlerts.createdAt));
  }

  async acknowledgePatternAlert(id: number, userId: string): Promise<void> {
    await db
      .update(patternAlerts)
      .set({
        acknowledged: true,
        acknowledgedBy: userId,
        acknowledgedAt: new Date()
      })
      .where(eq(patternAlerts.id, id));
  }

  async createSpamDetection(spam: InsertSpamDetection): Promise<SpamDetection> {
    const [newSpam] = await db
      .insert(spamDetections)
      .values(spam)
      .returning();
    return newSpam;
  }

  async getPendingSpamDetections(department?: string): Promise<SpamDetection[]> {
    let query = db
      .select()
      .from(spamDetections)
      .where(eq(spamDetections.status, "pending"));
    
    if (department) {
      // Join with tickets to filter by department
      query = query
        .innerJoin(tickets, eq(spamDetections.ticketId, tickets.id))
        .where(and(
          eq(spamDetections.status, "pending"),
          eq(tickets.department, department)
        ));
    }
    
    return await query.orderBy(desc(spamDetections.createdAt));
  }

  async updateSpamDetection(id: number, status: string, reviewedBy: string): Promise<void> {
    await db
      .update(spamDetections)
      .set({
        status,
        reviewedBy,
        reviewedAt: new Date()
      })
      .where(eq(spamDetections.id, id));
  }

  async getRecentTicketsByUser(userId: string, since: Date): Promise<Ticket[]> {
    return await db
      .select()
      .from(tickets)
      .where(and(
        eq(tickets.userId, userId),
        sql`${tickets.createdAt} > ${since}`
      ))
      .orderBy(desc(tickets.createdAt));
  }
}

export const storage = new DatabaseStorage();
