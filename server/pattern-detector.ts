import OpenAI from "openai";
import { storage } from "./storage";
import { 
  type Ticket, 
  type InsertCluster, 
  type InsertPatternAlert, 
  type InsertSpamDetection,
  type InsertIncidentTicket 
} from "@shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Configuration constants from PRD
const SIMILARITY_THRESHOLD = 0.85;
const CLUSTER_SIZE_THRESHOLDS: { [key: string]: number } = {
  IT: 5,
  HR: 3,
  Finance: 3,
  Admin: 4,
  Facilities: 4,
  default: 3
};
const TIME_WINDOW_MINUTES = 10;
const SPAM_RAPID_SUBMISSION_THRESHOLD = 3; // tickets per 5 minutes
const SPAM_TIME_WINDOW_MINUTES = 5;

// Text preprocessing as specified in PRD
function preprocessText(text: string): string {
  // Normalize: lowercase, strip punctuation, remove stop words
  const stopWords = new Set([
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 
    'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 
    'after', 'above', 'below', 'between', 'among', 'is', 'was', 'are', 
    'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 
    'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
    'a', 'an', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she',
    'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their'
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
    .join(' ');
}

// Extract domain-specific keywords
function extractKeywords(text: string): string[] {
  const processedText = preprocessText(text);
  const words = processedText.split(/\s+/);
  
  // Identify domain-specific terms and important nouns/verbs
  const techTerms = [
    'vpn', 'printer', 'computer', 'laptop', 'password', 'email', 'wifi', 
    'internet', 'software', 'hardware', 'network', 'server', 'database',
    'login', 'access', 'permission', 'account', 'system', 'application',
    'error', 'bug', 'crash', 'freeze', 'slow', 'install', 'update',
    'payroll', 'salary', 'expense', 'invoice', 'budget', 'leave', 'vacation',
    'policy', 'procedure', 'meeting', 'room', 'booking', 'schedule'
  ];
  
  const keywords = words.filter(word => 
    word.length > 3 || techTerms.includes(word)
  );
  
  // Return unique keywords, limited to top 10 by frequency
  const frequency: { [key: string]: number } = {};
  keywords.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });
  
  return Object.entries(frequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
}

// Compute text embedding using OpenAI
async function computeEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: preprocessText(text),
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error computing embedding:', error);
    throw new Error('Failed to compute text embedding');
  }
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Main pattern detection function called when new ticket is created
export async function analyzeTicketPattern(ticket: Ticket): Promise<void> {
  try {
    // Step 1: Check for spam patterns first
    await checkSpamPatterns(ticket);
    
    // Step 2: Compute embedding for the new ticket
    const ticketText = `${ticket.title} ${ticket.description}`;
    const embedding = await computeEmbedding(ticketText);
    const keywords = extractKeywords(ticketText);
    
    // Step 3: Find existing active clusters for the same department
    const existingClusters = await storage.getActiveClusters(ticket.department);
    
    let matchedCluster = null;
    let maxSimilarity = 0;
    
    // Step 4: Check similarity against existing clusters
    for (const cluster of existingClusters) {
      const clusterEmbedding = JSON.parse(cluster.centroidEmbedding);
      const similarity = cosineSimilarity(embedding, clusterEmbedding);
      
      if (similarity >= SIMILARITY_THRESHOLD && similarity > maxSimilarity) {
        matchedCluster = cluster;
        maxSimilarity = similarity;
      }
    }
    
    if (matchedCluster) {
      // Add ticket to existing cluster
      await addTicketToCluster(matchedCluster, ticket, embedding);
    } else {
      // Create new cluster
      await createNewCluster(ticket, embedding, keywords);
    }
    
  } catch (error) {
    console.error('Error in pattern analysis:', error);
    // Don't throw - pattern detection failure shouldn't break ticket creation
  }
}

// Add ticket to existing cluster and check thresholds
async function addTicketToCluster(cluster: any, ticket: Ticket, embedding: number[]): Promise<void> {
  const memberTicketIds = JSON.parse(cluster.memberTicketIds);
  memberTicketIds.push(ticket.id);
  
  // Recompute centroid embedding
  const existingCentroid = JSON.parse(cluster.centroidEmbedding);
  const newCentroid = existingCentroid.map((val: number, idx: number) => 
    (val * (memberTicketIds.length - 1) + embedding[idx]) / memberTicketIds.length
  );
  
  // Update cluster
  await storage.updateCluster(cluster.id, {
    memberTicketIds: JSON.stringify(memberTicketIds),
    centroidEmbedding: JSON.stringify(newCentroid),
    lastSeen: new Date()
  });
  
  // Check if threshold exceeded
  const threshold = CLUSTER_SIZE_THRESHOLDS[ticket.department] || CLUSTER_SIZE_THRESHOLDS.default;
  
  if (memberTicketIds.length >= threshold && !cluster.alertSent) {
    await createThresholdAlert(cluster, memberTicketIds.length, ticket.department);
  }
}

// Create new cluster for unmatched ticket
async function createNewCluster(ticket: Ticket, embedding: number[], keywords: string[]): Promise<void> {
  const clusterData: InsertCluster = {
    keywords: JSON.stringify(keywords),
    centroidEmbedding: JSON.stringify(embedding),
    memberTicketIds: JSON.stringify([ticket.id]),
    department: ticket.department,
    incidentTicketId: null
  };
  
  await storage.createCluster(clusterData);
}

// Create threshold exceeded alert
async function createThresholdAlert(cluster: any, ticketCount: number, department: string): Promise<void> {
  const keywords = JSON.parse(cluster.keywords);
  const alertData: InsertPatternAlert = {
    clusterId: cluster.id,
    alertType: "threshold_exceeded",
    severity: ticketCount >= 10 ? "critical" : ticketCount >= 7 ? "high" : "medium",
    message: `${ticketCount} similar tickets detected in ${department} department regarding: ${keywords.slice(0, 3).join(', ')}`,
    department: department,
    acknowledgedBy: null,
    acknowledgedAt: null
  };
  
  await storage.createPatternAlert(alertData);
  await storage.updateCluster(cluster.id, { alertSent: true });
}

// Check for spam patterns
async function checkSpamPatterns(ticket: Ticket): Promise<void> {
  const timeWindow = new Date(Date.now() - SPAM_TIME_WINDOW_MINUTES * 60 * 1000);
  const recentTickets = await storage.getRecentTicketsByUser(ticket.userId, timeWindow);
  
  // Check rapid submission
  if (recentTickets.length >= SPAM_RAPID_SUBMISSION_THRESHOLD) {
    const spamData: InsertSpamDetection = {
      ticketId: ticket.id,
      userId: ticket.userId,
      reason: "rapid_submission",
      confidence: Math.min(100, 60 + (recentTickets.length - SPAM_RAPID_SUBMISSION_THRESHOLD) * 20),
      reviewedBy: null,
      reviewedAt: null
    };
    
    await storage.createSpamDetection(spamData);
  }
  
  // Check duplicate content
  const duplicateThreshold = 0.95;
  for (const recentTicket of recentTickets) {
    const similarity = await computeTextSimilarity(
      `${ticket.title} ${ticket.description}`,
      `${recentTicket.title} ${recentTicket.description}`
    );
    
    if (similarity >= duplicateThreshold) {
      const spamData: InsertSpamDetection = {
        ticketId: ticket.id,
        userId: ticket.userId,
        reason: "duplicate_content",
        confidence: Math.round(similarity * 100),
        reviewedBy: null,
        reviewedAt: null
      };
      
      await storage.createSpamDetection(spamData);
      break;
    }
  }
}

// Helper function to compute text similarity
async function computeTextSimilarity(text1: string, text2: string): Promise<number> {
  try {
    const [embedding1, embedding2] = await Promise.all([
      computeEmbedding(text1),
      computeEmbedding(text2)
    ]);
    
    return cosineSimilarity(embedding1, embedding2);
  } catch (error) {
    console.error('Error computing text similarity:', error);
    return 0;
  }
}

// Create incident ticket for a cluster
export async function createIncidentTicket(clusterId: number, userId: string): Promise<any> {
  const cluster = await storage.getCluster(clusterId);
  if (!cluster) {
    throw new Error('Cluster not found');
  }
  
  const keywords = JSON.parse(cluster.keywords);
  const memberTicketIds = JSON.parse(cluster.memberTicketIds);
  
  const incidentData: InsertIncidentTicket = {
    clusterId: clusterId,
    title: `Incident: Multiple reports of ${keywords.slice(0, 2).join(' and ')} issues`,
    description: `This incident encompasses ${memberTicketIds.length} related tickets reporting similar issues. Keywords: ${keywords.join(', ')}`,
    priority: memberTicketIds.length >= 10 ? "urgent" : "high",
    department: cluster.department,
    assignedTo: null,
    impactedUsers: memberTicketIds.length,
    estimatedResolution: null,
    publicStatement: null
  };
  
  const incident = await storage.createIncidentTicket(incidentData);
  
  // Link cluster to incident
  await storage.updateCluster(clusterId, { incidentTicketId: incident.id });
  
  return incident;
}

// Get pattern analytics for dashboard
export async function getPatternAnalytics(department?: string): Promise<{
  activeClusters: any[];
  recentAlerts: any[];
  topRecurringIssues: any[];
  spamDetections: any[];
}> {
  const [activeClusters, recentAlerts, spamDetections] = await Promise.all([
    storage.getActiveClusters(department),
    storage.getRecentPatternAlerts(department, 24), // Last 24 hours
    storage.getPendingSpamDetections(department)
  ]);
  
  // Calculate top recurring issues
  const topRecurringIssues = activeClusters
    .map(cluster => ({
      keywords: JSON.parse(cluster.keywords),
      ticketCount: JSON.parse(cluster.memberTicketIds).length,
      department: cluster.department,
      lastSeen: cluster.lastSeen
    }))
    .sort((a, b) => b.ticketCount - a.ticketCount)
    .slice(0, 10);
  
  return {
    activeClusters,
    recentAlerts,
    topRecurringIssues,
    spamDetections
  };
}