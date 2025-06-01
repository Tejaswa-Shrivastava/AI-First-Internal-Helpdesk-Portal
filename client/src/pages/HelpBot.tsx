import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import ChatMessage from "@/components/ChatMessage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, Plus } from "lucide-react";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  suggestTicket?: boolean;
}

export default function HelpBot() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: `Hi! I'm HelpBot, your AI assistant. I can help you with:
      
• Company policies and procedures
• IT troubleshooting guides
• HR-related questions
• Administrative processes

What can I help you with today?`,
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const helpbotMutation = useMutation({
    mutationFn: async (question: string) => {
      const response = await apiRequest("POST", "/api/helpbot", { question });
      return response.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: data.response,
        isUser: false,
        timestamp: new Date(),
        suggestTicket: data.suggestTicket,
      }]);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to get response from HelpBot. Please try again.",
        variant: "destructive",
      });
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: "I'm having trouble processing your question right now. Would you like to create a support ticket?",
        isUser: false,
        timestamp: new Date(),
        suggestTicket: true,
      }]);
    },
  });

  const sendMessage = () => {
    const question = input.trim();
    if (!question) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: question,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");

    // Get AI response
    helpbotMutation.mutate(question);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const askQuickQuestion = (topic: string) => {
    setInput(topic);
    setTimeout(() => sendMessage(), 100);
  };

  const createTicketFromChat = () => {
    setLocation("/tickets/new");
  };

  const quickQuestions = [
    {
      title: "How do I set up VPN?",
      description: "Step-by-step VPN configuration guide",
      topic: "How do I set up VPN on my computer?",
    },
    {
      title: "What's the leave policy?",
      description: "Annual and sick leave guidelines",
      topic: "What is the company leave policy?",
    },
    {
      title: "How to submit expense reports?",
      description: "Expense reporting process and requirements",
      topic: "How do I submit expense reports?",
    },
    {
      title: "How to request new software?",
      description: "Software licensing and approval process",
      topic: "How do I request new software licenses?",
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <Header title="HelpBot - AI Assistant" />
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">HelpBot - AI Assistant</h1>
              <p className="text-gray-600">Ask me anything about company policies, procedures, or common issues.</p>
            </div>

            <Card className="border-gray-200 shadow-sm mb-6">
              {/* Chat Messages */}
              <div className="h-96 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    onCreateTicket={message.suggestTicket ? createTicketFromChat : undefined}
                  />
                ))}
                {helpbotMutation.isPending && (
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-primary-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-100 rounded-lg p-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex space-x-3">
                  <div className="flex-1">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your question here..."
                      disabled={helpbotMutation.isPending}
                    />
                  </div>
                  <Button 
                    onClick={sendMessage}
                    disabled={!input.trim() || helpbotMutation.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>

            {/* Quick Questions */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Common Questions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickQuestions.map((question, index) => (
                  <Card
                    key={index}
                    className="border-gray-200 hover:border-primary-300 hover:shadow-md transition-all duration-200 cursor-pointer"
                    onClick={() => askQuickQuestion(question.topic)}
                  >
                    <CardContent className="p-4">
                      <h4 className="font-medium text-gray-900">{question.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">{question.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
