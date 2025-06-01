import { storage } from "./storage";

async function seedFAQs() {
  try {
    const sampleFAQs = [
      {
        question: "How do I reset my password?",
        answer: "To reset your password, click on the 'Forgot Password' link on the login page. Enter your email address and follow the instructions sent to your email. If you don't receive an email within 5 minutes, check your spam folder or contact IT support.",
        category: "account"
      },
      {
        question: "How do I submit a new ticket?",
        answer: "To submit a new ticket, click on the 'New Ticket' button in the sidebar. Fill out the form with your issue details, select the appropriate department, and click 'Submit'. You'll receive a confirmation email with your ticket number.",
        category: "general"
      },
      {
        question: "Why is my computer running slowly?",
        answer: "Slow computer performance can be caused by several factors: too many programs running at startup, insufficient RAM, malware, or a full hard drive. Try restarting your computer, closing unnecessary programs, and running a virus scan. If the issue persists, submit an IT ticket.",
        category: "technical"
      },
      {
        question: "How do I access company WiFi?",
        answer: "Connect to the 'CompanyWiFi' network and enter your employee credentials. If you're having trouble connecting, ensure you're using your full email address as the username. For guests, use the 'CompanyGuest' network with the password provided by your host.",
        category: "technical"
      },
      {
        question: "Who do I contact for HR issues?",
        answer: "For HR-related questions including benefits, payroll, time off requests, or workplace concerns, you can submit an HR ticket through the portal or contact the HR department directly at hr@company.com or extension 2345.",
        category: "general"
      },
      {
        question: "How do I request time off?",
        answer: "Time off requests should be submitted through the HR portal at least 2 weeks in advance. Log into the system, navigate to 'Time Off', select your dates, and submit for manager approval. Emergency time off can be requested by calling HR directly.",
        category: "general"
      },
      {
        question: "What should I do if I can't access my email?",
        answer: "If you can't access your email, first try clearing your browser cache and cookies. If using Outlook, try restarting the application. Check if you can access webmail from a different browser. If the issue continues, submit an IT ticket with details about when the problem started.",
        category: "technical"
      },
      {
        question: "How do I expense business purchases?",
        answer: "Submit expense reports through the Finance portal within 30 days of purchase. Include receipts for all expenses over $25. Approved expenses are typically reimbursed within 2 business days. For questions about expense policies, contact the Finance department.",
        category: "billing"
      }
    ];

    console.log("Seeding FAQ data...");
    
    for (const faqData of sampleFAQs) {
      await storage.createFaq(faqData);
      console.log(`Created FAQ: ${faqData.question}`);
    }
    
    console.log("FAQ seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding FAQs:", error);
  }
}

// Run if this file is executed directly
seedFAQs().then(() => process.exit(0));

export { seedFAQs };