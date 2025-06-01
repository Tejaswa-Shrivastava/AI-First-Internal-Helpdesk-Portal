import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Menu, Bell } from "lucide-react";

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-white/80 backdrop-blur-sm border-b border-white/20 dark:bg-slate-900/80 dark:border-slate-700/50">
      <Button
        variant="ghost"
        className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden dark:border-slate-700 dark:text-slate-400"
      >
        <Menu className="h-6 w-6" />
      </Button>
      <div className="flex-1 px-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
        <div className="flex items-center space-x-3">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-500 dark:text-slate-400 dark:hover:text-slate-300"
          >
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
