import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Chart {
  id: string;
  name: string;
  description: string;
  type: string;
  datasetId: string;
  createdAt: string;
}

const Charts = () => {
  const [charts, setCharts] = useState<Chart[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // Simulate fetching charts from an API
    setTimeout(() => {
      const mockCharts: Chart[] = [
        {
          id: "1",
          name: "Sales Over Time",
          description: "A line chart showing sales trends over time.",
          type: "line",
          datasetId: "1",
          createdAt: "2024-01-28T12:00:00Z",
        },
        {
          id: "2",
          name: "Regional Sales Distribution",
          description: "A bar chart showing sales distribution across regions.",
          type: "bar",
          datasetId: "2",
          createdAt: "2024-01-27T18:30:00Z",
        },
        {
          id: "3",
          name: "Customer Demographics",
          description: "A pie chart showing the distribution of customer demographics.",
          type: "pie",
          datasetId: "3",
          createdAt: "2024-01-26T09:45:00Z",
        },
      ];
      setCharts(mockCharts);
      setIsLoading(false);
    }, 500);
  }, []);

  const filteredCharts = charts.filter((chart) =>
    chart.name.toLowerCase().includes(search.toLowerCase())
  );

  const deleteChart = (id: string) => {
    // Simulate deleting a chart
    setCharts(charts.filter((chart) => chart.id !== id));
    toast.success("Chart deleted successfully!");
  };

  const getChart = (id: string) => {
    return charts.find(chart => chart.id === id);
  };

  return (
    <div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Charts</CardTitle>
          <CardDescription>Manage your data visualizations</CardDescription>
          <Link to="/charts/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Chart
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              type="search"
              placeholder="Search charts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <>
                  {Array(3)
                    .fill(null)
                    .map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton />
                        </TableCell>
                        <TableCell>
                          <Skeleton />
                        </TableCell>
                        <TableCell>
                          <Skeleton />
                        </TableCell>
                        <TableCell>
                          <Skeleton />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="w-24" />
                        </TableCell>
                      </TableRow>
                    ))}
                </>
              ) : filteredCharts.length > 0 ? (
                filteredCharts.map((chart) => (
                  <TableRow key={chart.id}>
                    <TableCell>{chart.name}</TableCell>
                    <TableCell>{chart.description}</TableCell>
                    <TableCell>{chart.type}</TableCell>
                    <TableCell>
                      {new Date(chart.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="mr-2"
                      >
                        <Link to={`/charts/edit/${chart.id}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteChart(chart.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No charts found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Charts;
