import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  LifeBuoy, 
  Plus, 
  FileText, 
  MessageSquare, 
  HelpCircle, 
  BarChart3, 
  AlertTriangle, 
  FileCheck, 
  Upload,
  LogOut,
  User,
  Settings,
  CheckSquare,
  Target
} from "lucide-react";

export default function Sidebar() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();

  const { logout } = useAuth();
  
  const handleLogout = () => {
    logout();
  };

  const isActive = (path: string) => {
    return location === path;
  };

  const navLinkClass = (path: string) => `
    group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200
    ${isActive(path) 
      ? 'text-primary-700 bg-primary-50' 
      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    }
  `;

  const getNavigationItems = () => {
    if (user?.role === "Administrator") {
      return [
        { path: "/", icon: BarChart3, label: "Admin Dashboard", description: "System overview" },
        { path: "/tickets", icon: FileText, label: "All Tickets", description: "Manage tickets" },
        { path: "/patterns", icon: Target, label: "Pattern Detector", description: "AI analytics" },
        { path: "/faqs", icon: HelpCircle, label: "FAQs", description: "Knowledge base" },
      ];
    }

    if (user?.role === "Department Member") {
      return [
        { path: "/", icon: BarChart3, label: "Dashboard", description: "Department overview" },
        { path: "/tickets", icon: FileText, label: "Department Tickets", description: "Assigned tickets" },
        { path: "/patterns", icon: Target, label: "Pattern Detector", description: "Department patterns" },
        { path: "/helpbot", icon: MessageSquare, label: "HelpBot", description: "AI assistance" },
        { path: "/faqs", icon: HelpCircle, label: "FAQs", description: "Knowledge base" },
      ];
    }

    return [
      { path: "/", icon: BarChart3, label: "Dashboard", description: "Your overview" },
      { path: "/tickets/new", icon: Plus, label: "New Ticket", description: "Create request" },
      { path: "/tickets", icon: FileText, label: "My Tickets", description: "View status" },
      { path: "/helpbot", icon: MessageSquare, label: "HelpBot", description: "AI assistance" },
      { path: "/faqs", icon: HelpCircle, label: "FAQs", description: "Common questions" },
    ];
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col h-0 flex-1 purple-gradient dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-800 border-r border-purple-300/20 dark:border-slate-700/50 shadow-lg">
          <div className="flex-1 flex flex-col pt-6 pb-4 overflow-y-auto custom-scrollbar">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0 px-4 mb-8">
              <div className="h-10 w-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-3 shadow-md">
                <LifeBuoy className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white tracking-wide">HelpDesk</h1>
            </div>

            {/* Navigation */}
            <nav className="space-y-2 px-3">
              {navigationItems.map((item) => (
                <Button
                  key={item.path}
                  variant="ghost"
                  className={`w-full justify-start text-left px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive(item.path) 
                      ? 'bg-white/20 text-white shadow-md backdrop-blur-sm border border-white/20' 
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                  onClick={() => setLocation(item.path)}
                >
                  <item.icon className={`mr-3 h-5 w-5 ${
                    isActive(item.path) ? 'text-white' : 'text-white/70'
                  }`} />
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-xs text-white/60">{item.description}</span>
                  </div>
                </Button>
              ))}
            </nav>
          </div>

          {/* User Profile */}
          <div className="flex-shrink-0 border-t border-white/20 p-4">
            <div className="flex items-center w-full bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center ring-2 ring-white/30">
                  {user?.profileImageUrl ? (
                    <img 
                      src={user.profileImageUrl} 
                      alt="Profile" 
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5 text-white" />
                  )}
                </div>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {(user as any)?.name || (user as any)?.email || "User"}
                </p>
                <p className="text-xs text-white/70 capitalize truncate">
                  {(user as any)?.role || "Employee"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="ml-auto text-white/70 hover:text-white hover:bg-white/10 rounded-lg"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
