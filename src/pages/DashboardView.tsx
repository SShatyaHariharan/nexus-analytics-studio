import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Share2, Download, Edit } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import api from "@/services/api";

interface Chart {
  id: string;
  title: string;
  description: string;
  type: string;
  data: any;
  config: any;
  dataset_id: string;
  created_by: string;
  created_at: string;
}

interface Dashboard {
  id: string;
  title: string;
  description: string;
  layout: any[];
  charts: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

const DashboardView = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [charts, setCharts] = useState<Chart[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/dashboards/${id}`);
        setDashboard(response.data);
        
        // Fetch all charts for this dashboard
        if (response.data.charts && response.data.charts.length > 0) {
          const chartPromises = response.data.charts.map((chartId: string) => 
            api.get(`/charts/${chartId}`)
          );
          const chartResponses = await Promise.all(chartPromises);
          setCharts(chartResponses.map(res => res.data));
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load dashboard",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, [id, toast]);

  const getChart = (id: string) => {
    return charts.find(chart => chart.id === id);
  };

  const renderChart = (chartId: string, position: any) => {
    const chart = getChart(chartId);
    
    if (!chart) {
      return (
        <Card className="shadow-md h-full">
          <CardHeader>
            <CardTitle>Chart not found</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-400">
              Chart data unavailable
            </div>
          </CardContent>
        </Card>
      );
    }
    
    // Here you would render the actual chart based on its type
    // This is a placeholder for the chart rendering logic
    return (
      <Card className="shadow-md h-full">
        <CardHeader>
          <CardTitle>{chart.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-gray-100 rounded-md">
            {chart.type} Chart Placeholder
            <br />
            {chart.description}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Skeleton className="h-12 w-3/4 mb-2" />
          <Skeleton className="h-6 w-1/2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard not found</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{dashboard.title}</h1>
          <p className="text-gray-500">{dashboard.description}</p>
        </div>
        <div className="flex space-x-2 mt-4 md:mt-0">
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {user && dashboard.created_by === user.id && (
            <Button variant="default" size="sm" asChild>
              <a href={`/dashboards/edit/${dashboard.id}`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboard.layout && dashboard.layout.map((item: any, index: number) => (
          <div key={index} className="col-span-1" style={{
            gridColumn: `span ${item.w || 1} / span ${item.w || 1}`,
            gridRow: `span ${item.h || 1} / span ${item.h || 1}`,
          }}>
            {renderChart(item.i, item)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardView;
