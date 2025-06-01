import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Clock, 
  Shield,
  Target,
  Activity,
  Bell,
  CheckCircle
} from "lucide-react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Cluster {
  id: number;
  keywords: string;
  memberTicketIds: string;
  department: string;
  firstSeen: string;
  lastSeen: string;
  alertSent: boolean;
  incidentTicketId?: number;
}

interface PatternAlert {
  id: number;
  clusterId: number;
  alertType: string;
  severity: string;
  message: string;
  department: string;
  acknowledged: boolean;
  createdAt: string;
}

interface PatternAnalytics {
  activeClusters: Cluster[];
  recentAlerts: PatternAlert[];
  topRecurringIssues: Array<{
    keywords: string[];
    ticketCount: number;
    department: string;
    lastSeen: string;
  }>;
  spamDetections: Array<{
    id: number;
    ticketId: number;
    reason: string;
    confidence: number;
    status: string;
  }>;
}

export default function PatternDetector() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("overview");

  const { data: analytics, isLoading } = useQuery<PatternAnalytics>({
    queryKey: ["/api/patterns/analytics"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const acknowledgeAlertMutation = useMutation({
    mutationFn: async (alertId: number) => {
      return apiRequest("POST", `/api/patterns/alerts/${alertId}/acknowledge`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patterns/analytics"] });
      toast({
        title: "Alert Acknowledged",
        description: "The pattern alert has been acknowledged.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createIncidentMutation = useMutation({
    mutationFn: async (clusterId: number) => {
      return apiRequest("POST", "/api/patterns/incidents", { clusterId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patterns/analytics"] });
      toast({
        title: "Incident Created",
        description: "A new incident ticket has been created for this cluster.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading || !user) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          <Header title="Pattern Detector" />
          <main className="flex-1 relative overflow-y-auto focus:outline-none p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (user.role !== "Administrator" && user.role !== "Department Member") {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          <Header title="Pattern Detector" />
          <main className="flex-1 relative overflow-y-auto focus:outline-none p-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Access denied. Pattern Detector is available to administrators and department members only.
              </AlertDescription>
            </Alert>
          </main>
        </div>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case "threshold_exceeded":
        return <TrendingUp className="w-4 h-4" />;
      case "spam_detected":
        return <Shield className="w-4 h-4" />;
      case "unusual_pattern":
        return <Target className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <Header title="Pattern Detector" />
        <main className="flex-1 relative overflow-y-auto focus:outline-none p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Pattern Detection & Analytics</h1>
              <p className="text-gray-600">
                AI-powered analysis of ticket patterns, clustering, and incident management
              </p>
            </div>

            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="clusters">Active Clusters</TabsTrigger>
                <TabsTrigger value="alerts">Pattern Alerts</TabsTrigger>
                <TabsTrigger value="spam">Spam Detection</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active Clusters</CardTitle>
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics?.activeClusters?.length || 0}</div>
                      <p className="text-xs text-muted-foreground">Ticket groupings detected</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Pending Alerts</CardTitle>
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {analytics?.recentAlerts?.filter(a => !a.acknowledged).length || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">Requiring attention</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Top Issue</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {analytics?.topRecurringIssues?.[0]?.ticketCount || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {analytics?.topRecurringIssues?.[0]?.keywords?.[0] || "No patterns detected"}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Spam Detections</CardTitle>
                      <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {analytics?.spamDetections?.filter(s => s.status === "pending").length || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">Awaiting review</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Top Recurring Issues */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Recurring Issues</CardTitle>
                    <CardDescription>Most frequently reported issues across departments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics?.topRecurringIssues?.slice(0, 5).map((issue, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium">
                                {issue.keywords.slice(0, 3).join(", ")}
                              </p>
                              <p className="text-sm text-gray-500">{issue.department} Department</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold">{issue.ticketCount}</div>
                            <div className="text-xs text-gray-500">tickets</div>
                          </div>
                        </div>
                      ))}
                      {(!analytics?.topRecurringIssues || analytics.topRecurringIssues.length === 0) && (
                        <div className="text-center py-8 text-gray-500">
                          No recurring patterns detected yet
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="clusters" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Active Ticket Clusters</CardTitle>
                    <CardDescription>
                      Groups of similar tickets automatically detected by AI analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics?.activeClusters?.map((cluster) => {
                        const keywords = JSON.parse(cluster.keywords);
                        const memberTickets = JSON.parse(cluster.memberTicketIds);
                        return (
                          <div key={cluster.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center space-x-2 mb-2">
                                  <h3 className="font-semibold">
                                    Cluster #{cluster.id}
                                  </h3>
                                  <Badge variant="outline">{cluster.department}</Badge>
                                  {cluster.alertSent && (
                                    <Badge variant="destructive">Alert Sent</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                  Keywords: {keywords.join(", ")}
                                </p>
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  <span className="flex items-center">
                                    <Users className="w-3 h-3 mr-1" />
                                    {memberTickets.length} tickets
                                  </span>
                                  <span className="flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Last seen: {new Date(cluster.lastSeen).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                {!cluster.incidentTicketId && memberTickets.length >= 3 && (
                                  <Button
                                    size="sm"
                                    onClick={() => createIncidentMutation.mutate(cluster.id)}
                                    disabled={createIncidentMutation.isPending}
                                  >
                                    Create Incident
                                  </Button>
                                )}
                                {cluster.incidentTicketId && (
                                  <Badge variant="secondary">
                                    Incident #{cluster.incidentTicketId}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Progress 
                              value={Math.min((memberTickets.length / 10) * 100, 100)} 
                              className="h-2"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Threshold: {memberTickets.length}/10 tickets
                            </p>
                          </div>
                        );
                      })}
                      {(!analytics?.activeClusters || analytics.activeClusters.length === 0) && (
                        <div className="text-center py-8 text-gray-500">
                          No active clusters found
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="alerts" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Pattern Alerts</CardTitle>
                    <CardDescription>
                      Alerts triggered when patterns exceed thresholds or unusual activity is detected
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics?.recentAlerts?.map((alert) => (
                        <div 
                          key={alert.id} 
                          className={`border rounded-lg p-4 ${alert.acknowledged ? 'opacity-60' : ''}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              <div className="mt-1">
                                {getAlertTypeIcon(alert.alertType)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Badge className={getSeverityColor(alert.severity)}>
                                    {alert.severity}
                                  </Badge>
                                  <Badge variant="outline">{alert.department}</Badge>
                                  {alert.acknowledged && (
                                    <Badge variant="secondary">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Acknowledged
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm font-medium mb-1">{alert.message}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(alert.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            {!alert.acknowledged && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => acknowledgeAlertMutation.mutate(alert.id)}
                                disabled={acknowledgeAlertMutation.isPending}
                              >
                                Acknowledge
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      {(!analytics?.recentAlerts || analytics.recentAlerts.length === 0) && (
                        <div className="text-center py-8 text-gray-500">
                          No recent alerts
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="spam" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Spam Detection</CardTitle>
                    <CardDescription>
                      Automated detection of suspicious ticket patterns and rapid submissions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics?.spamDetections?.map((detection) => (
                        <div key={detection.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center space-x-2 mb-2">
                                <Badge variant="destructive">
                                  {detection.reason.replace(/_/g, " ")}
                                </Badge>
                                <Badge variant="outline">
                                  {detection.confidence}% confidence
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">
                                Ticket #{detection.ticketId}
                              </p>
                              <p className="text-xs text-gray-500">
                                Status: {detection.status}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline">
                                Review
                              </Button>
                              <Button size="sm" variant="destructive">
                                Confirm Spam
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {(!analytics?.spamDetections || analytics.spamDetections.length === 0) && (
                        <div className="text-center py-8 text-gray-500">
                          No spam detections
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}