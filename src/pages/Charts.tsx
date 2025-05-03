
import { useState, useEffect } from "react";
import { 
  BarChart, 
  LineChart, 
  PieChart, 
  Loader2, 
  PlusCircle, 
  Search,
  MoreHorizontal,
  Edit,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface Chart {
  id: string;
  name: string;
  description: string;
  chart_type: string;
  dataset_id: string;
  dataset_name?: string;
  created_at: string;
}

const Charts = () => {
  const { hasPermission } = useAuth();
  const [charts, setCharts] = useState<Chart[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const canCreateChart = hasPermission(0x07); // Analyst or higher
  
  useEffect(() => {
    fetchCharts();
  }, []);
  
  const fetchCharts = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/charts");
      
      // Enhance the charts with dataset information
      const enhancedCharts = response.data.data.map((chart: Chart) => {
        return {
          ...chart,
          dataset_name: "Dataset Name Placeholder"
        };
      });
      
      setCharts(enhancedCharts || []);
    } catch (error) {
      console.error("Error fetching charts:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const filteredCharts = charts.filter(chart => 
    chart.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chart.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this chart?")) {
      try {
        await api.delete(`/charts/${id}`);
        toast.success("Chart deleted successfully");
        fetchCharts();
      } catch (error) {
        console.error("Error deleting chart:", error);
      }
    }
  };
  
  const getChartIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'bar':
        return <BarChart className="h-8 w-8" />;
      case 'pie':
        return <PieChart className="h-8 w-8" />;
      case 'line':
      default:
        return <LineChart className="h-8 w-8" />;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Charts</h1>
          <p className="text-muted-foreground">
            Create and manage data visualizations
          </p>
        </div>
        {canCreateChart && (
          <Button asChild>
            <Link to="/charts/create">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Chart
            </Link>
          </Button>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search charts..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredCharts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCharts.map((chart) => (
            <Card key={chart.id} className="overflow-hidden">
              <CardHeader className="p-4 pb-2 flex flex-row justify-between items-start">
                <div>
                  <CardTitle className="text-base">{chart.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {chart.dataset_name}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to={`/charts/edit/${chart.id}`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(chart.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="p-6 flex justify-center items-center bg-muted/30">
                <div className="text-muted-foreground">
                  {getChartIcon(chart.chart_type)}
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-2 flex justify-between items-center">
                <span className="text-xs text-muted-foreground capitalize">
                  {chart.chart_type} chart
                </span>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/charts/${chart.id}`}>View</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6 text-center bg-muted/50">
          <div className="flex justify-center mb-4">
            <BarChart className="h-12 w-12 text-muted-foreground" />
          </div>
          <CardTitle className="mb-2">No charts found</CardTitle>
          {searchQuery ? (
            <CardDescription>No charts match your search query. Try a different search term.</CardDescription>
          ) : (
            <CardDescription className="mb-4">Create your first chart to visualize your data.</CardDescription>
          )}
          {!searchQuery && canCreateChart && (
            <div className="mt-4">
              <Button asChild>
                <Link to="/charts/create">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Chart
                </Link>
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default Charts;
