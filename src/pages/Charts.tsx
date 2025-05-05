
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, BarChart3, LineChart, PieChart, LayoutDashboard, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";
import ChartCreator from "@/components/charts/ChartCreator";
import ChartRenderer from "@/components/charts/ChartRenderer";

// Chart type icons mapping
const chartIcons: Record<string, React.ReactNode> = {
  bar: <BarChart3 className="h-5 w-5" />,
  line: <LineChart className="h-5 w-5" />,
  pie: <PieChart className="h-5 w-5" />,
  default: <BarChart3 className="h-5 w-5" />,
};

interface Chart {
  id: string;
  name: string;
  description?: string;
  chart_type: string;
  dataset_id: string;
  dataset_name?: string;
  configuration?: any;
  created_at?: string;
  created_by?: string;
}

const Charts = () => {
  const { hasPermission } = useAuth();
  const [charts, setCharts] = useState<Chart[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentChartData, setCurrentChartData] = useState<Chart | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // Fetch charts on component mount
  useEffect(() => {
    fetchCharts();
  }, []);

  // Function to fetch charts
  const fetchCharts = async () => {
    setLoading(true);
    try {
      const response = await api.get("/charts");
      setCharts(response.data.data || []);
    } catch (error) {
      toast.error("Failed to fetch charts");
    } finally {
      setLoading(false);
    }
  };

  // Function to handle chart save
  const handleSaveChart = async (chartData: any) => {
    if (!chartData) {
      setDialogOpen(false);
      setCurrentChartData(null);
      return;
    }

    try {
      if (editMode && currentChartData?.id) {
        // Update existing chart
        await api.put(`/charts/${currentChartData.id}`, chartData);
        toast.success("Chart updated successfully");
      } else {
        // Create new chart
        await api.post("/charts", chartData);
        toast.success("Chart created successfully");
      }
      fetchCharts();
      setDialogOpen(false);
      setCurrentChartData(null);
    } catch (error) {
      toast.error("Failed to save chart");
    }
  };

  // Function to handle chart deletion
  const deleteChart = async (id: string) => {
    if (confirm("Are you sure you want to delete this chart?")) {
      try {
        await api.delete(`/charts/${id}`);
        toast.success("Chart deleted successfully");
        fetchCharts();
      } catch (error) {
        toast.error("Failed to delete chart");
      }
    }
  };

  // Function to handle edit button click
  const handleEdit = async (chart: Chart) => {
    setCurrentChartData(chart);
    setEditMode(true);
    setDialogOpen(true);
  };

  // Function to handle create button click
  const handleCreate = () => {
    setCurrentChartData(null);
    setEditMode(false);
    setDialogOpen(true);
  };

  // Filter charts based on search term
  const filteredCharts = charts.filter(
    (chart) =>
      chart.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chart.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add chart to dashboard
  const addToDashboard = (chartId: string) => {
    navigate(`/dashboards/create?chart=${chartId}`);
  };

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Charts</h1>
          <p className="text-muted-foreground">
            Create and visualize data with interactive charts
          </p>
        </div>
        {hasPermission("edit_chart") && (
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Chart
          </Button>
        )}
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search charts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredCharts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCharts.map((chart) => (
            <Card key={chart.id} className="overflow-hidden">
              <CardHeader className="p-4 pb-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{chart.name}</CardTitle>
                  <div className="p-1.5 rounded-md bg-primary/10">
                    {chartIcons[chart.chart_type] || chartIcons.default}
                  </div>
                </div>
                {chart.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {chart.description}
                  </p>
                )}
              </CardHeader>
              <CardContent className="p-4 h-[240px]">
                <ChartRenderer
                  chartId={chart.id}
                  chartType={chart.chart_type}
                  height={200}
                />
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-between">
                <div className="flex gap-1">
                  {hasPermission("edit_chart") && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(chart)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {hasPermission("delete_chart") && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteChart(chart.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {hasPermission("edit_dashboard") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addToDashboard(chart.id)}
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Add to Dashboard
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 border rounded-md bg-muted/20">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium">No charts found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm
              ? "No charts match your search criteria"
              : "Get started by creating your first chart"}
          </p>
          {hasPermission("edit_chart") && !searchTerm && (
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create Chart
            </Button>
          )}
        </div>
      )}

      {/* Chart Creator Dialog */}
      {hasPermission("edit_chart") && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                {editMode ? "Edit Chart" : "Create Chart"}
              </DialogTitle>
              <DialogDescription>
                {editMode
                  ? "Update your chart settings and visualization"
                  : "Create a new chart from your dataset"}
              </DialogDescription>
            </DialogHeader>

            <ChartCreator
              onSave={handleSaveChart}
              initialData={currentChartData}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Charts;
