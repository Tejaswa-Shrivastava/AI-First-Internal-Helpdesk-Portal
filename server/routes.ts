import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupSession, isAuthenticated, requireRole, hashPassword, comparePassword } from "./auth";
import { loginSchema, departmentLoginSchema, signupSchema } from "@shared/schema";
import { routeTicket, generateReplyAISuggestion, helpbotResponse, detectPatterns } from "./openai";
import { analyzeTicketPattern, createIncidentTicket, getPatternAnalytics } from "./pattern-detector";
import { insertTicketSchema, insertCommentSchema, insertDocumentSchema, insertFaqSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  setupSession(app);

  // Authentication routes per PRD specification
  
  // General User Login (/auth/login)
  app.post('/auth/login', async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email/password." });
      }
      
      if (user.role !== "General User") {
        return res.status(403).json({ message: "Use the Department Login Portal." });
      }
      
      const isValid = await comparePassword(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid email/password." });
      }
      
      (req.session as any).userId = user.id;
      res.json({ message: "Login successful", redirectTo: "/dashboard/my-tickets" });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Invalid request" });
    }
  });

  // Department Login (/auth/login-department)  
  app.post('/auth/login-department', async (req, res) => {
    try {
      const { email, password, department } = departmentLoginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "No such user." });
      }
      
      if (!["Department Member", "Administrator"].includes(user.role)) {
        return res.status(403).json({ message: "You do not have access to this portal." });
      }
      
      if (user.role === "Department Member" && user.department !== department) {
        return res.status(403).json({ message: "Department mismatch." });
      }
      
      const isValid = await comparePassword(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid email/password." });
      }
      
      (req.session as any).userId = user.id;
      
      const redirectTo = user.role === "Administrator" 
        ? "/dashboard/admin-console"
        : `/dashboard/${department.toLowerCase()}-tickets`;
        
      res.json({ message: "Login successful", redirectTo });
    } catch (error) {
      console.error("Department login error:", error);
      res.status(400).json({ message: "Invalid request" });
    }
  });

  // General User Signup (/auth/signup-public)
  app.post('/auth/signup-public', async (req, res) => {
    try {
      const { name, email, password, confirmPassword } = signupSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "Email already registered." });
      }
      
      const passwordHash = await hashPassword(password);
      const user = await storage.createUser({
        name,
        email,
        passwordHash,
        role: "General User",
        department: null,
        isActive: true,
      });
      
      (req.session as any).userId = user.id;
      res.json({ message: "Account created successfully", redirectTo: "/dashboard/my-tickets" });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(400).json({ message: "Invalid request" });
    }
  });

  // Current user endpoint
  app.get('/api/auth/user', isAuthenticated, async (req, res) => {
    res.json(req.user);
  });

  // Logout
  app.post('/api/logout', (req, res) => {
    req.session?.destroy(() => {
      res.json({ message: "Logged out successfully" });
    });
  });

  // Ticket routes
  app.post("/api/tickets", isAuthenticated, upload.array('attachments'), async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Use AI to route the ticket first
      const routing = await routeTicket(req.body.title, req.body.description);
      
      const ticketData = insertTicketSchema.parse({
        ...req.body,
        userId,
        department: routing.department,
        attachments: req.files?.map((file: any) => file.filename) || [],
      });
      
      const ticket = await storage.createTicket(ticketData);

      // Log the AI routing action
      await storage.createAiLog({
        action: "route",
        ticketId: ticket.id,
        input: `${ticketData.title}: ${ticketData.description}`,
        output: `Department: ${routing.department}, Confidence: ${routing.confidence}%, Reasoning: ${routing.reasoning}`,
        confidence: routing.confidence,
        accepted: true,
      });

      // Pattern Detector: Analyze ticket for clustering and patterns
      try {
        await analyzeTicketPattern(ticket);
      } catch (error) {
        console.error('Pattern analysis error:', error);
        // Don't fail ticket creation if pattern analysis fails
      }

      res.json(ticket);
    } catch (error) {
      console.error("Error creating ticket:", error);
      res.status(500).json({ message: "Failed to create ticket" });
    }
  });

  app.get("/api/tickets", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      let tickets;
      if (user?.role === "Administrator") {
        tickets = await storage.getAllTickets();
      } else if (user?.role === "Department Member") {
        // Department Members see tickets routed to their department
        tickets = await storage.getTicketsByDepartment(user.department || "");
      } else {
        // General Users see only their own tickets
        tickets = await storage.getTicketsByUser(userId);
      }
      
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  app.get("/api/tickets/:id", isAuthenticated, async (req: any, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      if (isNaN(ticketId)) {
        return res.status(400).json({ message: "Invalid ticket ID" });
      }
      const ticket = await storage.getTicket(ticketId);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      const comments = await storage.getCommentsByTicket(ticketId);
      
      res.json({ ticket, comments });
    } catch (error) {
      console.error("Error fetching ticket:", error);
      res.status(500).json({ message: "Failed to fetch ticket" });
    }
  });

  app.patch("/api/tickets/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const { status } = req.body;
      
      await storage.updateTicketStatus(ticketId, status);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating ticket status:", error);
      res.status(500).json({ message: "Failed to update ticket status" });
    }
  });

  app.patch("/api/tickets/:id/assign", isAuthenticated, async (req: any, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const { assigneeId } = req.body;
      
      await storage.assignTicket(ticketId, assigneeId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error assigning ticket:", error);
      res.status(500).json({ message: "Failed to assign ticket" });
    }
  });

  // Update ticket status
  app.patch("/api/tickets/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!["open", "in_progress", "resolved"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      await storage.updateTicketStatus(ticketId, status);
      const updatedTicket = await storage.getTicket(ticketId);
      
      res.json(updatedTicket);
    } catch (error) {
      console.error("Error updating ticket status:", error);
      res.status(500).json({ message: "Failed to update ticket status" });
    }
  });

  // Comment routes
  app.post("/api/tickets/:id/comments", isAuthenticated, async (req: any, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const userId = req.user.id;
      
      const commentData = insertCommentSchema.parse({
        ticketId,
        userId,
        content: req.body.content,
        isInternal: req.body.isInternal || false,
      });

      const comment = await storage.createComment(commentData);
      res.json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // AI suggestion routes
  app.get("/api/tickets/:id/ai-suggestion", isAuthenticated, async (req: any, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const ticket = await storage.getTicket(ticketId);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      const comments = await storage.getCommentsByTicket(ticketId);
      const commentTexts = comments.map(c => c.content);
      
      const suggestion = await generateReplyAISuggestion(
        ticket.title,
        ticket.description,
        commentTexts
      );

      // Log the AI suggestion
      await storage.createAiLog({
        action: "suggest_reply",
        ticketId: ticket.id,
        input: `${ticket.title}: ${ticket.description}`,
        output: suggestion.suggestion,
        confidence: suggestion.confidence,
        accepted: null,
      });

      res.json(suggestion);
    } catch (error) {
      console.error("Error generating AI suggestion:", error);
      res.status(500).json({ message: "Failed to generate AI suggestion" });
    }
  });

  // HelpBot routes
  app.post("/api/helpbot", isAuthenticated, async (req: any, res) => {
    try {
      const { question } = req.body;
      
      // Get knowledge base documents
      const documents = await storage.getDocuments();
      const knowledgeBase = documents.map(doc => `${doc.title}: ${doc.content}`);
      
      const response = await helpbotResponse(question, knowledgeBase);

      // Log the helpbot interaction
      await storage.createAiLog({
        action: "helpbot_response",
        input: question,
        output: response.response,
        confidence: response.confidence,
        accepted: null,
      });

      res.json(response);
    } catch (error) {
      console.error("Error generating helpbot response:", error);
      res.status(500).json({ message: "Failed to generate helpbot response" });
    }
  });

  // Document routes (Admin only)
  app.post("/api/documents", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const documentData = insertDocumentSchema.parse({
        ...req.body,
        uploadedBy: userId,
      });

      const document = await storage.createDocument(documentData);
      res.json(document);
    } catch (error) {
      console.error("Error creating document:", error);
      res.status(500).json({ message: "Failed to create document" });
    }
  });

  app.get("/api/documents", isAuthenticated, async (req: any, res) => {
    try {
      const documents = await storage.getDocuments();
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // FAQ routes
  app.get("/api/faqs", async (req, res) => {
    try {
      const faqs = await storage.getFaqs();
      res.json(faqs);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      res.status(500).json({ message: "Failed to fetch FAQs" });
    }
  });

  app.post("/api/faqs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "Administrator") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const faqData = insertFaqSchema.parse(req.body);
      const faq = await storage.createFaq(faqData);
      res.json(faq);
    } catch (error) {
      console.error("Error creating FAQ:", error);
      res.status(500).json({ message: "Failed to create FAQ" });
    }
  });

  // Analytics routes (Admin only)
  app.get("/api/analytics/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "Administrator") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const stats = await storage.getTicketStats();
      const aiAccuracy = await storage.getAiAccuracy();
      const patterns = await storage.getPatternDetection();
      
      res.json({
        ticketStats: stats,
        aiAccuracy,
        patterns,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get("/api/analytics/ai-logs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "Administrator") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const logs = await storage.getAiLogs();
      res.json(logs);
    } catch (error) {
      console.error("Error fetching AI logs:", error);
      res.status(500).json({ message: "Failed to fetch AI logs" });
    }
  });

  app.get("/api/analytics/patterns", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "Administrator") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const tickets = await storage.getAllTickets(100);
      const formattedTickets = tickets.map(ticket => ({
        title: ticket.title,
        description: ticket.description,
        department: ticket.department,
        createdAt: ticket.createdAt || new Date(),
      }));
      const aiPatterns = await detectPatterns(formattedTickets);
      
      res.json(aiPatterns);
    } catch (error) {
      console.error("Error detecting patterns:", error);
      res.status(500).json({ message: "Failed to detect patterns" });
    }
  });

  // Pattern Detector API Routes (from PRD specification)
  
  // Get pattern analytics for dashboard
  app.get("/api/patterns/analytics", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== "Administrator" && user.role !== "Department Member")) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const department = user.role === "Department Member" ? user.department : undefined;
      const analytics = await getPatternAnalytics(department);
      
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching pattern analytics:", error);
      res.status(500).json({ message: "Failed to fetch pattern analytics" });
    }
  });

  // Create incident ticket from cluster
  app.post("/api/patterns/incidents", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== "Administrator" && user.role !== "Department Member")) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { clusterId } = req.body;
      if (!clusterId) {
        return res.status(400).json({ message: "Cluster ID required" });
      }
      
      const incident = await createIncidentTicket(clusterId, userId);
      res.json(incident);
    } catch (error) {
      console.error("Error creating incident ticket:", error);
      res.status(500).json({ message: "Failed to create incident ticket" });
    }
  });

  // Get active clusters for department
  app.get("/api/patterns/clusters", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== "Administrator" && user.role !== "Department Member")) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const department = user.role === "Department Member" ? user.department : undefined;
      const clusters = await storage.getActiveClusters(department);
      
      res.json(clusters);
    } catch (error) {
      console.error("Error fetching clusters:", error);
      res.status(500).json({ message: "Failed to fetch clusters" });
    }
  });

  // Get pattern alerts
  app.get("/api/patterns/alerts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== "Administrator" && user.role !== "Department Member")) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const department = user.role === "Department Member" ? user.department : undefined;
      const alerts = await storage.getRecentPatternAlerts(department, 24);
      
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching pattern alerts:", error);
      res.status(500).json({ message: "Failed to fetch pattern alerts" });
    }
  });

  // Acknowledge pattern alert
  app.post("/api/patterns/alerts/:id/acknowledge", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== "Administrator" && user.role !== "Department Member")) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const alertId = parseInt(req.params.id);
      await storage.acknowledgePatternAlert(alertId, userId);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error acknowledging alert:", error);
      res.status(500).json({ message: "Failed to acknowledge alert" });
    }
  });

  // File download route
  app.get("/api/files/:filename", isAuthenticated, (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);
    
    if (fs.existsSync(filePath)) {
      res.download(filePath);
    } else {
      res.status(404).json({ message: "File not found" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
