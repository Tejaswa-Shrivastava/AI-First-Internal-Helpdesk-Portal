import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

export async function routeTicket(title: string, description: string): Promise<{
  department: string;
  confidence: number;
  reasoning: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant that routes support tickets to the correct department based on their content. 
          Analyze the ticket title and description and route to one of these departments:
          - IT: Technical issues, software problems, hardware issues, network problems, password resets, VPN, email technical issues
          - HR: Human resources questions, leave requests, benefits, employee policies, workplace issues, training requests
          - Admin: Administrative tasks, office supplies, facilities, general company procedures, expense reports
          
          Respond with JSON in this format: { "department": "IT|HR|Admin", "confidence": 0-100, "reasoning": "brief explanation" }`
        },
        {
          role: "user",
          content: `Title: ${title}\nDescription: ${description}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      department: result.department || "IT",
      confidence: Math.max(0, Math.min(100, result.confidence || 50)),
      reasoning: result.reasoning || "Default routing based on content analysis"
    };
  } catch (error) {
    console.error("Error routing ticket:", error);
    return {
      department: "IT",
      confidence: 50,
      reasoning: "Error occurred during routing, defaulted to IT"
    };
  }
}

export async function generateReplyAISuggestion(
  ticketTitle: string,
  ticketDescription: string,
  comments: string[]
): Promise<{
  suggestion: string;
  confidence: number;
}> {
  try {
    const conversationHistory = comments.join("\n");
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant helping support agents draft professional responses to customer tickets. 
          Based on the ticket information and conversation history, generate a helpful, professional response.
          
          Respond with JSON in this format: { "suggestion": "professional response text", "confidence": 0-100 }`
        },
        {
          role: "user",
          content: `Ticket: ${ticketTitle}\nDescription: ${ticketDescription}\nConversation: ${conversationHistory}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      suggestion: result.suggestion || "Thank you for contacting support. We're looking into your issue and will get back to you shortly.",
      confidence: Math.max(0, Math.min(100, result.confidence || 70))
    };
  } catch (error) {
    console.error("Error generating reply suggestion:", error);
    return {
      suggestion: "Thank you for contacting support. We're looking into your issue and will get back to you shortly.",
      confidence: 50
    };
  }
}

export async function helpbotResponse(
  question: string,
  knowledgeBase: string[]
): Promise<{
  response: string;
  confidence: number;
  suggestTicket: boolean;
}> {
  try {
    const context = knowledgeBase.join("\n\n");
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are HelpBot, a helpful AI assistant for company employees. Use the provided knowledge base to answer questions about company policies, procedures, and common issues.
          
          If you can answer the question well using the knowledge base, provide a helpful response.
          If the question is outside your knowledge or requires human assistance, suggest creating a support ticket.
          
          Respond with JSON in this format: { 
            "response": "your helpful response", 
            "confidence": 0-100, 
            "suggestTicket": true/false 
          }`
        },
        {
          role: "user",
          content: `Knowledge Base:\n${context}\n\nQuestion: ${question}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      response: result.response || "I'm not sure about that. Would you like me to create a support ticket for you?",
      confidence: Math.max(0, Math.min(100, result.confidence || 50)),
      suggestTicket: result.suggestTicket || false
    };
  } catch (error) {
    console.error("Error generating helpbot response:", error);
    return {
      response: "I'm having trouble processing your question right now. Would you like to create a support ticket?",
      confidence: 30,
      suggestTicket: true
    };
  }
}

export async function detectPatterns(ticketData: Array<{
  title: string;
  description: string;
  department: string;
  createdAt: Date;
}>): Promise<{
  patterns: Array<{
    type: "high_volume" | "trending" | "spam";
    topic: string;
    severity: "low" | "medium" | "high";
    description: string;
    count: number;
  }>;
}> {
  try {
    const recentTickets = ticketData
      .filter(ticket => 
        Date.now() - ticket.createdAt.getTime() < 24 * 60 * 60 * 1000
      )
      .map(ticket => `${ticket.title}: ${ticket.description}`)
      .join("\n");

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI that analyzes support ticket patterns to detect issues, trends, and potential problems.
          
          Analyze the ticket data and identify:
          - High volume issues that might indicate system problems
          - Trending topics that might need FAQ entries
          - Potential spam or misuse patterns
          
          Respond with JSON in this format: {
            "patterns": [
              {
                "type": "high_volume|trending|spam",
                "topic": "topic name",
                "severity": "low|medium|high",
                "description": "what this pattern indicates",
                "count": estimated_count
              }
            ]
          }`
        },
        {
          role: "user",
          content: `Recent Tickets:\n${recentTickets}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      patterns: result.patterns || []
    };
  } catch (error) {
    console.error("Error detecting patterns:", error);
    return {
      patterns: []
    };
  }
}
