import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Clock, User, Building2, Paperclip, MessageSquare, Lightbulb } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
});

type CommentForm = z.infer<typeof commentSchema>;

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAiSuggestion, setShowAiSuggestion] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: [`/api/tickets/${id}`],
    enabled: !!id,
  });

  const { data: aiSuggestion } = useQuery({
    queryKey: [`/api/tickets/${id}/ai-suggestion`],
    enabled: !!id && user?.role === "agent" && showAiSuggestion,
  });

  const form = useForm<CommentForm>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: "",
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (data: CommentForm) => {
      return apiRequest("POST", `/api/tickets/${id}/comments`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${id}`] });
      form.reset();
      toast({
        title: "Comment Added",
        description: "Your comment has been added to the ticket.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      return apiRequest("PATCH", `/api/tickets/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/stats"] });
      toast({
        title: "Status Updated",
        description: "Ticket status has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          <Header title="Loading..." />
          <main className="flex-1 relative overflow-y-auto focus:outline-none p-6">
            <div className="max-w-4xl">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          <Header title="Ticket Not Found" />
          <main className="flex-1 relative overflow-y-auto focus:outline-none p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Ticket not found</h1>
              <Button onClick={() => setLocation("/")}>Go back to dashboard</Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const { ticket, comments = [] } = data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-100 text-red-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const onSubmit = (data: CommentForm) => {
    addCommentMutation.mutate(data);
  };

  const useAiSuggestion = () => {
    if (aiSuggestion?.suggestion) {
      form.setValue("content", aiSuggestion.suggestion);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <Header title="Ticket Details" />
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none p-6">
          <div className="max-w-4xl">
            {/* Back Button */}
            <div className="mb-6">
              <Button variant="ghost" onClick={() => setLocation("/")} className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>

            {/* Ticket Header */}
            <Card className="border-gray-200 mb-6">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h1 className="text-xl font-semibold text-gray-900">{ticket.title}</h1>
                      <Badge className={getStatusColor(ticket.status)}>
                        {ticket.status.replace("_", " ").toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        #{ticket.id}
                      </span>
                      <span className="flex items-center">
                        <Building2 className="h-4 w-4 mr-1" />
                        {ticket.department}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatDistanceToNow(new Date(ticket.createdAt))} ago
                      </span>
                      {ticket.assignedTo && (
                        <span className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          Assigned
                        </span>
                      )}
                    </div>
                  </div>
                  {(user?.role === "Department Member" || user?.role === "Administrator") && (
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateStatusMutation.mutate("in_progress")}
                        disabled={ticket.status === "in_progress"}
                      >
                        Mark In Progress
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateStatusMutation.mutate("resolved")}
                        disabled={ticket.status === "resolved"}
                      >
                        Mark Resolved
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Description</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
                </div>

                {/* Attachments */}
                {ticket.attachments && ticket.attachments.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Attachments</h3>
                    <div className="flex flex-wrap gap-2">
                      {ticket.attachments.map((filename: string, index: number) => (
                        <a
                          key={index}
                          href={`/api/files/${filename}`}
                          className="flex items-center p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <Paperclip className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-700">{filename}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card className="border-gray-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Activity & Comments</CardTitle>
                  {user?.role === "agent" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAiSuggestion(!showAiSuggestion)}
                    >
                      <Lightbulb className="h-4 w-4 mr-2" />
                      AI Suggestion
                    </Button>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6">
                {/* AI Suggestion */}
                {showAiSuggestion && user?.role === "agent" && aiSuggestion && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Lightbulb className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-blue-900 mb-1">AI Suggested Reply</h4>
                          <div className="text-sm text-blue-800 bg-white rounded p-3 border border-blue-200 mb-2">
                            {aiSuggestion.suggestion}
                          </div>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" onClick={useAiSuggestion}>
                              Use this reply
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setShowAiSuggestion(false)}>
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Comments List */}
                <div className="space-y-6">
                  {comments.map((comment: any) => (
                    <div key={comment.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-gray-900">User #{comment.userId}</h4>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(comment.createdAt))} ago
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                          {comment.content}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Comment Form */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                          <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Textarea
                                    rows={3}
                                    placeholder="Add a comment..."
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex justify-end">
                            <Button 
                              type="submit" 
                              disabled={addCommentMutation.isPending}
                            >
                              {addCommentMutation.isPending ? "Adding..." : "Add Comment"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
