
import { useState, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ScatterChart, Scatter, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Loader2 } from "lucide-react";
import api from "@/services/api";

// Define color palette for charts
const COLORS = [
  "#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe",
  "#00C49F", "#FFBB28", "#FF8042", "#a4de6c", "#d0ed57"
];

interface ChartRendererProps {
  chartId: string;
  chartType: string;
  height?: number;
  width?: number;
  filters?: Record<string, any>;
}

const ChartRenderer: React.FC<ChartRendererProps> = ({
  chartId,
  chartType,
  height = 300,
  width = 500,
  filters = {},
}) => {
  const [chartData, setChartData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChartData();
  }, [chartId, filters]);

  const fetchChartData = async () => {
    if (!chartId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Add filters to request if provided
      const queryParams = new URLSearchParams();
      if (Object.keys(filters).length > 0) {
        queryParams.append('filters', JSON.stringify(filters));
      }
      
      const response = await api.get(
        `/charts/${chartId}/data?${queryParams.toString()}`
      );
      
      // Transform the data based on the chart type
      const { labels = [], datasets = [] } = response.data;
      
      if (chartType === "pie") {
        // For pie charts, transform to a format with name and value
        const pieData = labels.map((label: string, index: number) => ({
          name: label,
          value: datasets[0]?.data[index] || 0
        }));
        setChartData(pieData);
      } else if (chartType === "scatter") {
        // For scatter charts, data is already in {x, y} format
        setChartData(datasets[0]?.data || []);
      } else {
        // For bar, line, and area charts
        const transformedData = labels.map((label: string, index: number) => {
          const dataPoint: any = { name: label };
          datasets.forEach((dataset: any, datasetIndex: number) => {
            dataPoint[dataset.label || `Series ${datasetIndex + 1}`] = dataset.data[index];
          });
          return dataPoint;
        });
        setChartData(transformedData);
      }
    } catch (error) {
      setError("Failed to load chart data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  // Determine which keys to use for multi-series charts
  const dataKeys = chartData.length > 0 
    ? Object.keys(chartData[0]).filter(key => key !== "name") 
    : [];

  // Render chart based on chart type
  switch (chartType) {
    case "bar":
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {dataKeys.map((key, index) => (
              <Bar 
                key={key}
                dataKey={key} 
                fill={COLORS[index % COLORS.length]} 
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
      
    case "line":
      return (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {dataKeys.map((key, index) => (
              <Line 
                key={key}
                type="monotone" 
                dataKey={key} 
                stroke={COLORS[index % COLORS.length]} 
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      );
      
    case "area":
      return (
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {dataKeys.map((key, index) => (
              <Area 
                key={key}
                type="monotone" 
                dataKey={key} 
                stroke={COLORS[index % COLORS.length]}
                fill={COLORS[index % COLORS.length]}
                fillOpacity={0.3}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      );
      
    case "pie":
      return (
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
      
    case "scatter":
      return (
        <ResponsiveContainer width="100%" height={height}>
          <ScatterChart>
            <CartesianGrid />
            <XAxis type="number" dataKey="x" />
            <YAxis type="number" dataKey="y" />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Values" data={chartData} fill="#8884d8" />
          </ScatterChart>
        </ResponsiveContainer>
      );

    default:
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Unsupported chart type</p>
        </div>
      );
  }
};

export default ChartRenderer;
