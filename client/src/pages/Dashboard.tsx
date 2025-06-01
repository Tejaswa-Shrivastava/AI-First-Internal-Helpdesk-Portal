import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import TicketCard from "@/components/TicketCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, Clock, CheckCircle, AlertCircle } from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ["/api/tickets"],
    retry: false,
    enabled: !!user,
  });

  const { data: analytics } = useQuery({
    queryKey: ["/api/analytics/stats"],
    retry: false,
    enabled: user?.role === "Administrator",
  });

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  const getQuickActions = () => {
    if (user.role === "Administrator") {
      return [
        {
          title: "View Analytics",
          description: "Monitor system performance",
          icon: <AlertCircle className="h-6 w-6 text-blue-600" />,
          action: () => setLocation("/admin"),
          bgColor: "bg-blue-100",
        },
        {
          title: "Pattern Detection",
          description: "Review detected patterns",
          icon: <AlertCircle className="h-6 w-6 text-yellow-600" />,
          action: () => setLocation("/admin"),
          bgColor: "bg-yellow-100",
        },
      ];
    }

    return [
      {
        title: "New Ticket",
        description: "Create a new support request",
        icon: <Plus className="h-6 w-6 text-primary-600" />,
        action: () => setLocation("/tickets/new"),
        bgColor: "bg-primary-100",
      },
      {
        title: "Ask HelpBot",
        description: "Get instant AI assistance",
        icon: <MessageSquare className="h-6 w-6 text-green-600" />,
        action: () => setLocation("/helpbot"),
        bgColor: "bg-green-100",
      },
    ];
  };

  const getStatsCards = () => {
    if (user.role === "Administrator" && analytics) {
      return [
        {
          title: "Total Tickets",
          value: analytics.ticketStats?.total || 0,
          icon: <AlertCircle className="h-6 w-6 text-blue-600" />,
          change: "+12% this week",
          changeType: "positive",
        },
        {
          title: "AI Accuracy",
          value: `${analytics.aiAccuracy?.toFixed(1) || 0}%`,
          icon: <CheckCircle className="h-6 w-6 text-green-600" />,
          change: "+2.1% improvement",
          changeType: "positive",
        },
      ];
    }

    // For Department Members, show stats for their department tickets
    // For General Users, show stats for their own tickets
    const relevantTickets = user.role === "Department Member" 
      ? tickets 
      : tickets.filter((t: any) => t.userId === user.id);
    
    const pendingCount = relevantTickets.filter((t: any) => t.status === "open" || t.status === "in_progress").length;
    const resolvedCount = relevantTickets.filter((t: any) => t.status === "resolved").length;

    return [
      {
        title: "Pending Tickets",
        value: pendingCount,
        icon: <Clock className="h-6 w-6 text-yellow-600" />,
        change: "Active requests",
        changeType: "neutral",
      },
      {
        title: "Resolved Tickets",
        value: resolvedCount,
        icon: <CheckCircle className="h-6 w-6 text-green-600" />,
        change: "All time",
        changeType: "positive",
      },
    ];
  };

  const recentTickets = tickets.slice(0, 5);
  const quickActions = getQuickActions();
  const statsCards = getStatsCards();

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <Sidebar />
      
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <Header title="Dashboard" />
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none p-6 custom-scrollbar">
          <div className="mb-8 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-slate-700/30 card-shadow">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Welcome back, {user.firstName || user.email}!
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-lg mt-2">Here's what's happening with your support requests.</p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {quickActions.map((action, index) => (
              <div
                key={index}
                className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl p-6 border border-white/30 dark:border-slate-700/30 card-shadow hover:card-shadow-lg transition-all duration-300 cursor-pointer group card-hover"
                onClick={action.action}
              >
                <div className="flex items-center w-full">
                  <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-purple-500 to-blue-600 dark:from-purple-600 dark:to-blue-700 rounded-xl flex items-center justify-center shadow-md">
                    <div className="text-white">
                      {action.icon}
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{action.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{action.description}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Stats Cards */}
            {statsCards.map((stat, index) => (
              <Card key={index} className="border-gray-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                        {stat.icon}
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
                      <p className="text-sm text-gray-600 dark:text-slate-300">{stat.title}</p>
                      <p className={`text-xs ${
                        stat.changeType === "positive" ? "text-green-600 dark:text-green-400" : 
                        stat.changeType === "negative" ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-slate-400"
                      }`}>
                        {stat.change}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Tickets */}
          <Card className="border-gray-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-gray-900 dark:text-white">Recent Tickets</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setLocation("/tickets")} className="text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white">
                  View all
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {ticketsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : recentTickets.length > 0 ? (
                <div className="space-y-4">
                  {recentTickets.map((ticket: any) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      onClick={() => setLocation(`/tickets/${ticket.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <AlertCircle className="h-12 w-12 text-gray-400 dark:text-slate-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No tickets yet</h3>
                  <p className="text-gray-600 dark:text-slate-300 mb-4">Create your first support ticket to get started.</p>
                  <Button onClick={() => setLocation("/tickets/new")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Ticket
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
