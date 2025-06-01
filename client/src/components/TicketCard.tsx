import { Badge } from "@/components/ui/badge";
import { Clock, Building2, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface TicketCardProps {
  ticket: {
    id: number;
    title: string;
    status: string;
    department: string;
    createdAt: string;
    assignedTo?: string;
  };
  onClick: () => void;
}

export default function TicketCard({ ticket, onClick }: TicketCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300";
      case "resolved":
        return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300";
      case "closed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300";
    }
  };

  return (
    <div
      className="p-6 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors duration-200 border-b border-gray-100 dark:border-slate-700/50 last:border-b-0"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <Badge className={getStatusColor(ticket.status)}>
              {ticket.status.replace("_", " ").toUpperCase()}
            </Badge>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{ticket.title}</p>
            <div className="flex items-center space-x-4 mt-1">
              <span className="flex items-center text-sm text-gray-500 dark:text-slate-400">
                <Building2 className="h-4 w-4 mr-1" />
                {ticket.department}
              </span>
              {ticket.assignedTo && (
                <span className="flex items-center text-sm text-gray-500 dark:text-slate-400">
                  <User className="h-4 w-4 mr-1" />
                  Assigned
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-900 dark:text-white">#{ticket.id}</p>
          <p className="flex items-center text-sm text-gray-500 dark:text-slate-400">
            <Clock className="h-4 w-4 mr-1" />
            {formatDistanceToNow(new Date(ticket.createdAt))} ago
          </p>
        </div>
      </div>
    </div>
  );
}
