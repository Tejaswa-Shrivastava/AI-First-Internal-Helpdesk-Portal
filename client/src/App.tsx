import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import AuthLogin from "@/pages/AuthLogin";
import AuthDepartmentLogin from "@/pages/AuthDepartmentLogin";
import AuthSignup from "@/pages/AuthSignup";
import Dashboard from "@/pages/Dashboard";
import NewTicket from "@/pages/NewTicket";
import TicketDetail from "@/pages/TicketDetail";
import TicketsList from "@/pages/TicketsList";
import FAQs from "@/pages/FAQs";
import HelpBot from "@/pages/HelpBot";
import AdminDashboard from "@/pages/AdminDashboard";
import PatternDetector from "@/pages/PatternDetector";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <Switch>
      {/* Authentication routes - always accessible */}
      <Route path="/auth/login" component={AuthLogin} />
      <Route path="/auth/login-department" component={AuthDepartmentLogin} />
      <Route path="/auth/signup" component={AuthSignup} />

      {/* Protected routes based on user role */}
      {isAuthenticated && user ? (
        <>
          {/* General User routes */}
          {(user as any).role === "General User" && (
            <>
              <Route path="/dashboard/my-tickets" component={Dashboard} />
              <Route path="/tickets" component={TicketsList} />
              <Route path="/tickets/new" component={NewTicket} />
              <Route path="/tickets/:id" component={TicketDetail} />
              <Route path="/faqs" component={FAQs} />
              <Route path="/helpbot" component={HelpBot} />
              <Route path="/">
                <Redirect to="/dashboard/my-tickets" />
              </Route>
            </>
          )}

          {/* Department Member routes */}
          {(user as any).role === "Department Member" && (
            <>
              <Route path="/dashboard/it-tickets" component={Dashboard} />
              <Route path="/dashboard/hr-tickets" component={Dashboard} />
              <Route path="/dashboard/admin-tickets" component={Dashboard} />
              <Route path="/dashboard/finance-tickets" component={Dashboard} />
              <Route path="/dashboard/facilities-tickets" component={Dashboard} />
              <Route path="/tickets" component={TicketsList} />
              <Route path="/tickets/:id" component={TicketDetail} />
              <Route path="/patterns" component={PatternDetector} />
              <Route path="/faqs" component={FAQs} />
              <Route path="/helpbot" component={HelpBot} />
              <Route path="/">
                <Redirect to={`/dashboard/${(user as any).department?.toLowerCase()}-tickets`} />
              </Route>
            </>
          )}

          {/* Administrator routes */}
          {(user as any).role === "Administrator" && (
            <>
              <Route path="/dashboard/admin-console" component={AdminDashboard} />
              <Route path="/admin" component={AdminDashboard} />
              <Route path="/tickets" component={TicketsList} />
              <Route path="/tickets/new" component={NewTicket} />
              <Route path="/tickets/:id" component={TicketDetail} />
              <Route path="/patterns" component={PatternDetector} />
              <Route path="/faqs" component={FAQs} />
              <Route path="/helpbot" component={HelpBot} />
              <Route path="/">
                <Redirect to="/dashboard/admin-console" />
              </Route>
            </>
          )}
        </>
      ) : (
        // Redirect unauthenticated users to login
        <Route path="/">
          <Redirect to="/auth/login" />
        </Route>
      )}

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="helpdesk-ui-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
