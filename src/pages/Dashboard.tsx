
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  BarChart3, 
  ChevronRight, 
  Database, 
  FileSpreadsheet, 
  Grid3X3, 
  PlusCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";

interface StatsData {
  dataSources: number;
  datasets: number;
  charts: number;
  dashboards: number;
}

interface RecentDashboard {
  id: string;
  name: string;
  created_at: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatsData>({ dataSources: 0, datasets: 0, charts: 0, dashboards: 0 });
  const [recentDashboards, setRecentDashboards] = useState<RecentDashboard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // In a real application, you'd fetch this data from the backend
        // For now, we'll simulate loading some data
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Sample stats data
        setStats({
          dataSources: 5,
          datasets: 12,
          charts: 24,
          dashboards: 8
        });
        
        // Sample recent dashboards
        setRecentDashboards([
          { id: '1', name: 'Sales Overview', created_at: '2023-10-15T12:30:00Z' },
          { id: '2', name: 'Marketing Analytics', created_at: '2023-10-10T09:45:00Z' },
          { id: '3', name: 'User Engagement', created_at: '2023-10-05T15:20:00Z' },
        ]);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome, {user?.first_name}!</h1>
          <p className="text-muted-foreground">
            Here's an overview of your analytics platform
          </p>
        </div>
        <Button asChild>
          <Link to="/dashboards/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Dashboard
          </Link>
        </Button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Sources</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.dataSources}</div>
            <p className="text-xs text-muted-foreground">
              Connected data sources
            </p>
          </CardContent>
          <CardFooter>
            <Link to="/data-sources" className="text-xs text-blue-500 hover:underline inline-flex items-center">
              View all
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Datasets</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.datasets}</div>
            <p className="text-xs text-muted-foreground">
              Available datasets
            </p>
          </CardContent>
          <CardFooter>
            <Link to="/datasets" className="text-xs text-blue-500 hover:underline inline-flex items-center">
              View all
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Charts</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.charts}</div>
            <p className="text-xs text-muted-foreground">
              Created visualizations
            </p>
          </CardContent>
          <CardFooter>
            <Link to="/charts" className="text-xs text-blue-500 hover:underline inline-flex items-center">
              View all
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dashboards</CardTitle>
            <Grid3X3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.dashboards}</div>
            <p className="text-xs text-muted-foreground">
              Interactive dashboards
            </p>
          </CardContent>
          <CardFooter>
            <Link to="/dashboards" className="text-xs text-blue-500 hover:underline inline-flex items-center">
              View all
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </CardFooter>
        </Card>
      </div>
      
      {/* Recent Dashboards */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Dashboards</h2>
        {isLoading ? (
          <p>Loading recent dashboards...</p>
        ) : recentDashboards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentDashboards.map((dashboard) => (
              <Card key={dashboard.id}>
                <CardHeader>
                  <CardTitle>{dashboard.name}</CardTitle>
                  <CardDescription>
                    {new Date(dashboard.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Link to={`/dashboards/${dashboard.id}`}>
                    <Button variant="outline">View Dashboard</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center bg-muted/50">
            <p className="text-muted-foreground mb-4">No dashboards created yet.</p>
            <Button asChild>
              <Link to="/dashboards/create">Create Your First Dashboard</Link>
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
