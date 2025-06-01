import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, FileText } from "lucide-react";

const ticketSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

type TicketForm = z.infer<typeof ticketSchema>;

export default function NewTicket() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);
  const [aiRouting, setAiRouting] = useState<{
    department: string;
    confidence: number;
    reasoning: string;
  } | null>(null);

  const form = useForm<TicketForm>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data: TicketForm & { files: File[] }) => {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      
      data.files.forEach((file) => {
        formData.append("attachments", file);
      });

      const response = await fetch("/api/tickets", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status}: ${text}`);
      }

      return response.json();
    },
    onSuccess: (ticket) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({
        title: "Ticket Created",
        description: `Your ticket #${ticket.id} has been submitted and routed to ${ticket.department}.`,
      });
      setLocation("/");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data: TicketForm) => {
    createTicketMutation.mutate({ ...data, files });
  };

  // Show AI routing preview when description changes
  const watchDescription = form.watch("description");
  const watchTitle = form.watch("title");

  const previewRouting = () => {
    if (watchTitle && watchDescription && watchDescription.length > 20) {
      // Simulate AI routing preview (in real app, this would be a separate API call)
      const mockRouting = {
        department: watchDescription.toLowerCase().includes("password") ? "IT" : 
                   watchDescription.toLowerCase().includes("leave") ? "HR" : "IT",
        confidence: 85,
        reasoning: "Based on content analysis of the title and description"
      };
      setAiRouting(mockRouting);
    } else {
      setAiRouting(null);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <Header title="New Ticket" />
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none p-6">
          <div className="max-w-3xl">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Create New Ticket</h1>
              <p className="text-gray-600">Describe your issue and our AI will route it to the right team.</p>
            </div>

            <Card className="border-gray-200">
              <CardContent className="p-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Brief description of your issue"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                setTimeout(previewRouting, 500);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              rows={6}
                              placeholder="Please provide detailed information about your issue..."
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                setTimeout(previewRouting, 500);
                              }}
                            />
                          </FormControl>
                          <p className="text-sm text-gray-500">
                            Our AI will analyze your description to route this to the correct department.
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Attachments (Optional)
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors duration-200">
                        <div className="text-center">
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="mt-4">
                            <label htmlFor="file-upload" className="cursor-pointer">
                              <span className="mt-2 block text-sm font-medium text-primary-600 hover:text-primary-500">
                                Upload files
                              </span>
                              <input
                                id="file-upload"
                                name="file-upload"
                                type="file"
                                className="sr-only"
                                multiple
                                accept=".png,.jpg,.jpeg,.pdf,.doc,.docx,.txt"
                                onChange={handleFileUpload}
                              />
                            </label>
                            <p className="mt-1 text-sm text-gray-500">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">PNG, JPG, PDF up to 10MB each</p>
                        </div>
                      </div>

                      {/* File List */}
                      {files.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {files.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <FileText className="h-5 w-5 text-gray-400" />
                                <span className="text-sm font-medium text-gray-900">{file.name}</span>
                                <span className="text-xs text-gray-500">
                                  ({(file.size / 1024 / 1024).toFixed(1)} MB)
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end space-x-3">
                      <Button type="button" variant="outline" onClick={() => setLocation("/")}>
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createTicketMutation.isPending}
                      >
                        {createTicketMutation.isPending ? "Submitting..." : "Submit Ticket"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* AI Routing Preview */}
            {aiRouting && (
              <Card className="mt-6 border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-blue-900">AI Routing Suggestion</h4>
                      <p className="text-sm text-blue-700">
                        This ticket will be routed to <strong>{aiRouting.department} Department</strong> 
                        {" "}({aiRouting.confidence}% confidence) based on the content analysis.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
