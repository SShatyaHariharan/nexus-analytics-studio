
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Shield, Database, Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { ThemeToggle } from "@/components/ThemeToggle";

const ROLES = [
  {
    name: 'Admin',
    description: 'Full access to all features',
    permissions: [
      'view_dashboard', 'edit_dashboard', 'delete_dashboard',
      'view_datasource', 'edit_datasource', 'delete_datasource',
      'view_dataset', 'edit_dataset', 'delete_dataset',
      'view_chart', 'edit_chart', 'delete_chart',
      'manage_users', 'view_settings', 'edit_settings'
    ]
  },
  {
    name: 'Manager',
    description: 'Can create and edit most content',
    permissions: [
      'view_dashboard', 'edit_dashboard',
      'view_datasource', 'edit_datasource',
      'view_dataset', 'edit_dataset',
      'view_chart', 'edit_chart',
      'view_settings'
    ]
  },
  {
    name: 'Analyst',
    description: 'Can create and edit analytical content',
    permissions: [
      'view_dashboard',
      'view_datasource', 'edit_datasource',
      'view_dataset', 'edit_dataset',
      'view_chart', 'edit_chart'
    ]
  },
  {
    name: 'User',
    description: 'Can view content only',
    permissions: [
      'view_dashboard',
      'view_datasource',
      'view_dataset',
      'view_chart'
    ]
  }
];

const Settings = () => {
  const { user, hasPermission, hasRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("appearance");

  // Check if user has admin permissions
  useEffect(() => {
    if (!hasPermission("view_settings")) {
      navigate("/dashboard");
    }
  }, [hasPermission, navigate]);

  // Format permission string for display
  const formatPermission = (permission: string) => {
    return permission
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-10">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="appearance" className="flex items-center">
            <Bell className="mr-2 h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger 
            value="roles" 
            className="flex items-center" 
            disabled={!hasPermission("manage_users")}
          >
            <Shield className="mr-2 h-4 w-4" />
            Roles &amp; Permissions
          </TabsTrigger>
          <TabsTrigger 
            value="cache" 
            className="flex items-center" 
            disabled={!hasRole("admin")}
          >
            <Database className="mr-2 h-4 w-4" />
            Cache Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Customize the look and feel of the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Theme</h3>
                <p className="text-sm text-muted-foreground">
                  Choose between light and dark mode
                </p>
                <div className="flex items-center gap-4">
                  <p className="text-sm">Current theme: <span className="font-medium">{theme === 'dark' ? 'Dark' : 'Light'}</span></p>
                  <ThemeToggle />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle>Roles &amp; Permissions</CardTitle>
              <CardDescription>
                View available roles and their permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ROLES.map((role) => (
                <div key={role.name} className="mb-8">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-medium">{role.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {role.description}
                      </p>
                    </div>
                    {user.role === role.name.toLowerCase() && (
                      <div className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">
                        Your Role
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Permissions:</h4>
                    <div className="flex flex-wrap gap-2">
                      {role.permissions.map((permission) => (
                        <div 
                          key={permission} 
                          className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs"
                        >
                          {formatPermission(permission)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cache">
          <Card>
            <CardHeader>
              <CardTitle>Cache Management</CardTitle>
              <CardDescription>
                View and control Redis cache settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Cache Status</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cache Type</TableHead>
                      <TableHead>Expiry Time</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Charts Data</TableCell>
                      <TableCell>5 minutes</TableCell>
                      <TableCell className="text-green-500">Active</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Dashboard Data</TableCell>
                      <TableCell>1 minute</TableCell>
                      <TableCell className="text-green-500">Active</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Dataset Preview</TableCell>
                      <TableCell>2 minutes</TableCell>
                      <TableCell className="text-green-500">Active</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline">Clear All Cache</Button>
                <Button variant="outline">Refresh Cache Stats</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
