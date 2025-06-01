import { Button } from "@/components/ui/button";
import { MessageSquare, User, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  suggestTicket?: boolean;
}

interface ChatMessageProps {
  message: Message;
  onCreateTicket?: () => void;
}

export default function ChatMessage({ message, onCreateTicket }: ChatMessageProps) {
  return (
    <div className={`flex items-start space-x-3 ${message.isUser ? 'justify-end' : ''}`}>
      {!message.isUser && (
        <div className="flex-shrink-0">
          <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-primary-600" />
          </div>
        </div>
      )}
      
      <div className={`flex-1 ${message.isUser ? 'max-w-xs' : ''}`}>
        <div className={`rounded-lg p-3 ${
          message.isUser 
            ? 'bg-primary-600 text-white ml-auto' 
            : 'bg-gray-100'
        }`}>
          <div className={`text-sm ${message.isUser ? 'text-white' : 'text-gray-900'}`}>
            {message.content.split('\n').map((line, index) => {
              if (line.startsWith('•')) {
                return (
                  <div key={index} className="ml-4">
                    <span className="inline-block w-2 h-2 bg-current rounded-full mr-2 opacity-70"></span>
                    {line.substring(1).trim()}
                  </div>
                );
              }
              return (
                <div key={index} className={index > 0 ? 'mt-2' : ''}>
                  {line}
                </div>
              );
            })}
          </div>
          
          {/* Suggest ticket button for bot messages */}
          {!message.isUser && message.suggestTicket && onCreateTicket && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-2">Was this helpful?</p>
              <Button
                size="sm"
                variant="outline"
                onClick={onCreateTicket}
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Still need help? Create a ticket
              </Button>
            </div>
          )}
        </div>
        
        {/* Timestamp */}
        <p className={`text-xs text-gray-500 mt-1 ${message.isUser ? 'text-right' : ''}`}>
          {formatDistanceToNow(message.timestamp)} ago
        </p>
      </div>

      {message.isUser && (
        <div className="flex-shrink-0">
          <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-gray-600" />
          </div>
        </div>
      )}
    </div>
  );
}
