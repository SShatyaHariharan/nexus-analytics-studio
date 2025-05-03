
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  BarChart3,
  ChevronDown,
  Download, 
  Edit, 
  LineChart, 
  Loader2, 
  MessageSquare, 
  PieChart, 
  Share
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";
import { toast } from "sonner";

interface Dashboard {
  id: string;
  name: string;
  description: string;
  layout: any;
  created_at: string;
  updated_at: string;
  created_by: string;
}

interface DashboardChart {
  id: string;
  chart_id: string;
  position: any;
  chart_type: string;
  chart_name: string;
}

const DashboardView = () => {
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = useAuth();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [charts, setCharts] = useState<DashboardChart[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const canEditDashboard = hasPermission(0x07); // Analyst or higher
  
  useEffect(() => {
    if (id) {
      fetchDashboard(id);
    }
  }, [id]);
  
  const fetchDashboard = async (dashboardId: string) => {
    try {
      setIsLoading(true);
      
      // In a real application, fetch actual data from the API
      // For now, using placeholder data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setDashboard({
        id: dashboardId,
        name: "Sample Dashboard",
        description: "This is a sample dashboard view",
        layout: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: "1"
      });
      
      setCharts([
        {
          id: "1",
          chart_id: "1",
          position: { x: 0, y: 0, w: 6, h: 2 },
          chart_type: "bar",
          chart_name: "Monthly Sales"
        },
        {
          id: "2",
          chart_id: "2",
          position: { x: 6, y: 0, w: 6, h: 2 },
          chart_type: "line",
          chart_name: "User Growth"
        },
        {
          id: "3",
          chart_id: "3",
          position: { x: 0, y: 2, w: 4, h: 2 },
          chart_type: "pie",
          chart_name: "Revenue by Category"
        },
        {
          id: "4",
          chart_id: "4",
          position: { x: 4, y: 2, w: 8, h: 2 },
          chart_type: "bar",
          chart_name: "Geographic Distribution"
        }
      ]);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      toast.error("Failed to load dashboard");
    } finally {
      setIsLoading(false);
    }
  };
  
  const getChartIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'bar':
        return <BarChart3 className="h-8 w-8" />;
      case 'pie':
        return <PieChart className="h-8 w-8" />;
      case 'line':
      default:
        return <LineChart className="h-8 w-8" />;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!dashboard) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Dashboard not found or you don't have permission to view it.</p>
        <Button asChild>
          <Link to="/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div>
        <Link to="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboards
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{dashboard.name}</h1>
            <p className="text-muted-foreground">
              {dashboard.description || "No description provided"}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon">
              <MessageSquare className="h-4 w-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>
                  <Download className="mr-2 h-4 w-4" />
                  Export as PNG
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="mr-2 h-4 w-4" />
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button variant="outline">
              <Share className="mr-2 h-4 w-4" />
              Share
            </Button>
            
            {canEditDashboard && (
              <Button asChild>
                <Link to={`/dashboards/edit/${dashboard.id}`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-12 gap-4">
        {charts.map((chart) => (
          <Card 
            key={chart.id} 
            className="col-span-12 md:col-span-6 lg:col-span-6 xl:col-span-6"
            style={{
              gridColumn: `span ${chart.position.w || 6}`,
              gridRow: `span ${chart.position.h || 2}`
            }}
          >
            <CardContent className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium">{chart.chart_name}</h3>
              </div>
              <div className="flex items-center justify-center h-[200px] bg-muted/30 rounded-md">
                {getChartIcon(chart.chart_type)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DashboardView;
