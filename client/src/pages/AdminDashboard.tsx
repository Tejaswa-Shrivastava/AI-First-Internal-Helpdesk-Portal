import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, TrendingUp, CheckCircle, Clock, MessageSquare, Activity, AlertCircle, Eye, Plus } from "lucide-react";

export default function AdminDashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState("all");

  // Redirect to home if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "Administrator")) {
      toast({
        title: "Unauthorized",
        description: "Admin access required. Redirecting...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = user ? "/" : "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/analytics/stats"],
    retry: false,
    enabled: user?.role === "Administrator",
  });

  const { data: aiLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["/api/analytics/ai-logs"],
    retry: false,
    enabled: user?.role === "Administrator",
  });

  const { data: patterns, isLoading: patternsLoading } = useQuery({
    queryKey: ["/api/analytics/patterns"],
    retry: false,
    enabled: user?.role === "Administrator",
  });

  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ["/api/tickets"],
    retry: false,
    enabled: user?.role === "Administrator",
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: number; status: string }) => {
      const response = await apiRequest("PATCH", `/api/tickets/${ticketId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/stats"] });
      toast({
        title: "Status updated",
        description: "Ticket status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (user.role !== "Administrator") {
    return null;
  }

  const getPatternSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPatternIcon = (type: string) => {
    switch (type) {
      case "high_volume":
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case "trending":
        return <TrendingUp className="h-5 w-5 text-yellow-600" />;
      case "spam":
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "resolved":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-300";
    }
  };

  // Calculate real-time ticket stats from actual tickets data
  const ticketStats = {
    total: tickets.length,
    open: tickets.filter((t: any) => t.status === "open").length,
    inProgress: tickets.filter((t: any) => t.status === "in_progress").length,
    resolved: tickets.filter((t: any) => t.status === "resolved").length,
  };

  // Filter tickets based on status filter
  const filteredTickets = statusFilter === "all" 
    ? tickets 
    : tickets.filter((ticket: any) => ticket.status === statusFilter);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900">
      <Sidebar />
      
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <Header title="Admin Dashboard" />
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back, {user.name}</h1>
            <p className="text-gray-600 dark:text-slate-300">Monitor system performance and manage helpdesk operations</p>
          </div>

          {/* Key Metrics */}
          {analyticsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="border-gray-200 animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <MessageSquare className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {ticketStats.total}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-slate-400">Total Tickets</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">All time</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200 dark:border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                        <AlertCircle className="h-6 w-6 text-red-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {ticketStats.open}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-slate-400">Open Tickets</p>
                      <p className="text-xs text-red-600 dark:text-red-400">Needs attention</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <Clock className="h-6 w-6 text-yellow-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-2xl font-bold text-gray-900">
                        {analytics?.ticketStats?.open || 0}
                      </h3>
                      <p className="text-sm text-gray-500">Open Tickets</p>
                      <p className="text-xs text-gray-500">Awaiting response</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Activity className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-2xl font-bold text-gray-900">
                        {analytics?.ticketStats?.resolved || 0}
                      </h3>
                      <p className="text-sm text-gray-500">Resolved Tickets</p>
                      <p className="text-xs text-green-600">Completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Ticket Management Section */}
          <Card className="border-gray-200 dark:border-slate-700 mb-8">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-gray-900 dark:text-white">All Tickets</CardTitle>
                <div className="flex items-center space-x-4">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tickets</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={() => setLocation("/tickets/new")} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    New Ticket
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {ticketsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse p-4 border border-gray-200 dark:border-slate-700 rounded-lg">
                      <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : filteredTickets.length > 0 ? (
                <div className="space-y-4">
                  {filteredTickets.map((ticket: any) => (
                    <div key={ticket.id} className="p-4 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">#{ticket.id} {ticket.title}</h3>
                            <Badge className={getStatusColor(ticket.status)}>
                              {ticket.status.replace('_', ' ')}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {ticket.department}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-slate-300 mb-2">{ticket.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-slate-400">
                            <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                            {ticket.assignedTo && <span>Assigned to: {ticket.assignedTo}</span>}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Select 
                            value={ticket.status} 
                            onValueChange={(status) => updateStatusMutation.mutate({ ticketId: ticket.id, status })}
                            disabled={updateStatusMutation.isPending}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setLocation(`/tickets/${ticket.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 dark:text-slate-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {statusFilter === "all" ? "No tickets yet" : `No ${statusFilter.replace('_', ' ')} tickets`}
                  </h3>
                  <p className="text-gray-600 dark:text-slate-300 mb-4">
                    {statusFilter === "all" 
                      ? "Create your first support ticket to get started"
                      : `No tickets with ${statusFilter.replace('_', ' ')} status found`
                    }
                  </p>
                  {statusFilter === "all" && (
                    <Button onClick={() => setLocation("/tickets/new")}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Ticket
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pattern Detection Alerts */}
          <Card className="border-gray-200 mb-8">
            <CardHeader>
              <CardTitle>Pattern Detection Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {patternsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : patterns?.patterns && patterns.patterns.length > 0 ? (
                <div className="space-y-4">
                  {patterns.patterns.map((pattern: any, index: number) => (
                    <div key={index} className={`flex items-start space-x-3 p-4 rounded-lg border ${
                      pattern.severity === "high" ? "bg-red-50 border-red-200" :
                      pattern.severity === "medium" ? "bg-yellow-50 border-yellow-200" :
                      "bg-blue-50 border-blue-200"
                    }`}>
                      <div className="flex-shrink-0">
                        {getPatternIcon(pattern.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-sm font-medium text-gray-900">{pattern.topic}</h4>
                          <Badge className={getPatternSeverityColor(pattern.severity)}>
                            {pattern.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700">{pattern.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {pattern.count} occurrences detected
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts</h3>
                  <p className="text-gray-600">All systems are running normally.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Department Performance & Recent AI Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>Department Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(analytics?.ticketStats?.byDepartment || {}).map(([dept, count]) => (
                      <div key={dept} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`h-3 w-3 rounded-full ${
                            dept === "IT" ? "bg-blue-500" :
                            dept === "HR" ? "bg-green-500" :
                            "bg-purple-500"
                          }`}></div>
                          <span className="text-sm font-medium text-gray-900">{dept} Department</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium text-gray-900">{count} tickets</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>Recent AI Actions</CardTitle>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : aiLogs.length > 0 ? (
                  <div className="space-y-4">
                    {aiLogs.slice(0, 5).map((log: any) => (
                      <div key={log.id} className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          <div className={`h-2 w-2 rounded-full ${
                            log.action === "route" ? "bg-green-500" :
                            log.action === "suggest_reply" ? "bg-blue-500" :
                            "bg-yellow-500"
                          }`}></div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">
                            {log.action === "route" && `Auto-routed ticket #${log.ticketId}`}
                            {log.action === "suggest_reply" && `Generated reply suggestion for ticket #${log.ticketId}`}
                            {log.action === "helpbot_response" && "HelpBot answered user question"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(log.createdAt).toLocaleString()} • {log.confidence}% confidence
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No recent activity</h3>
                    <p className="text-gray-600">AI actions will appear here.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
