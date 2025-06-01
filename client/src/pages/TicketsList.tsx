import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import TicketCard from "@/components/TicketCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function TicketsList() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["/api/tickets"],
    retry: false,
    enabled: !!user,
  });

  const filteredTickets = tickets.filter((ticket: any) => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  const statusCounts = {
    all: tickets.length,
    open: tickets.filter((t: any) => t.status === "open").length,
    in_progress: tickets.filter((t: any) => t.status === "in_progress").length,
    resolved: tickets.filter((t: any) => t.status === "resolved").length,
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <Sidebar />
      
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <Header title="My Tickets" />
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none p-6 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="mb-8 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-slate-700/30 card-shadow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    My Support Tickets
                  </h1>
                  <p className="text-slate-600 dark:text-slate-300 mt-2">
                    Track and manage all your support requests
                  </p>
                </div>
                <Button 
                  onClick={() => setLocation("/tickets/new")}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Ticket
                </Button>
              </div>

              {/* Status Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm rounded-xl p-4 border border-white/30 dark:border-slate-600/30">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{statusCounts.all}</div>
                  <div className="text-sm text-gray-600 dark:text-slate-400">Total Tickets</div>
                </div>
                <div className="bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm rounded-xl p-4 border border-white/30 dark:border-slate-600/30">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{statusCounts.open}</div>
                  <div className="text-sm text-gray-600 dark:text-slate-400">Open</div>
                </div>
                <div className="bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm rounded-xl p-4 border border-white/30 dark:border-slate-600/30">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{statusCounts.in_progress}</div>
                  <div className="text-sm text-gray-600 dark:text-slate-400">In Progress</div>
                </div>
                <div className="bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm rounded-xl p-4 border border-white/30 dark:border-slate-600/30">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{statusCounts.resolved}</div>
                  <div className="text-sm text-gray-600 dark:text-slate-400">Resolved</div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="mb-6 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl p-4 border border-white/20 dark:border-slate-700/30 card-shadow">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
                    <Input
                      placeholder="Search tickets..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={statusFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("all")}
                  >
                    All ({statusCounts.all})
                  </Button>
                  <Button
                    variant={statusFilter === "open" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("open")}
                  >
                    Open ({statusCounts.open})
                  </Button>
                  <Button
                    variant={statusFilter === "in_progress" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("in_progress")}
                  >
                    In Progress ({statusCounts.in_progress})
                  </Button>
                  <Button
                    variant={statusFilter === "resolved" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("resolved")}
                  >
                    Resolved ({statusCounts.resolved})
                  </Button>
                </div>
              </div>
            </div>

            {/* Tickets List */}
            <Card className="border-gray-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">
                  Tickets ({filteredTickets.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : filteredTickets.length > 0 ? (
                  <div className="divide-y divide-gray-200 dark:divide-slate-700">
                    {filteredTickets.map((ticket: any) => (
                      <TicketCard
                        key={ticket.id}
                        ticket={ticket}
                        onClick={() => setLocation(`/tickets/${ticket.id}`)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 dark:text-slate-500 mb-4">
                      <Filter className="h-12 w-12 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      {searchTerm || statusFilter !== "all" ? "No tickets match your filters" : "No tickets yet"}
                    </h3>
                    <p className="text-gray-600 dark:text-slate-300 mb-4">
                      {searchTerm || statusFilter !== "all" 
                        ? "Try adjusting your search or filter criteria"
                        : "Create your first support ticket to get started"
                      }
                    </p>
                    {(!searchTerm && statusFilter === "all") && (
                      <Button onClick={() => setLocation("/tickets/new")}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Ticket
                      </Button>
                    )}
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