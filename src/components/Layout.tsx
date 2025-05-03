
import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  BarChart3, 
  Database, 
  FileSpreadsheet, 
  Grid3X3, 
  Home, 
  LogOut, 
  Menu, 
  Settings, 
  User,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import UserAvatar from "@/components/UserAvatar";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Data Sources", href: "/data-sources", icon: Database },
    { name: "Datasets", href: "/datasets", icon: FileSpreadsheet },
    { name: "Charts", href: "/charts", icon: BarChart3 },
    { name: "Dashboards", href: "/dashboards", icon: Grid3X3 },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-10 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-200 ease-in-out md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="px-6 py-5 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
            <Link to="/dashboard" className="text-xl font-bold text-primary">
              Analytics Dashboard
            </Link>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleSidebar}
              className="md:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      location.pathname === item.href
                        ? "bg-gray-100 dark:bg-gray-700 text-primary"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    )}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* User Profile */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <UserAvatar />
              <div className="ml-3">
                <p className="text-sm font-medium">{user?.first_name} {user?.last_name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role?.name}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="w-full mt-4 flex items-center justify-center"
              onClick={logout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={cn(
        "flex-1 transition-all duration-200 ease-in-out",
        sidebarOpen ? "md:ml-64" : "ml-0"
      )}>
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
          <div className="px-4 py-4 flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleSidebar}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/settings">
                  <User className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
