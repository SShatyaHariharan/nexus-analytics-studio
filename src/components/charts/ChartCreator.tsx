
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BarChart, LineChart, PieChart, ScatterChart, AreaChart } from "recharts";
import { toast } from "sonner";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import api from "@/services/api";

// Chart types
const CHART_TYPES = [
  { id: "bar", name: "Bar Chart", icon: BarChart },
  { id: "line", name: "Line Chart", icon: LineChart },
  { id: "area", name: "Area Chart", icon: AreaChart },
  { id: "pie", name: "Pie Chart", icon: PieChart },
  { id: "scatter", name: "Scatter Plot", icon: ScatterChart },
];

// Form schema
const chartFormSchema = z.object({
  name: z.string().min(1, "Chart name is required"),
  description: z.string().optional(),
  dataset_id: z.string().min(1, "Dataset is required"),
  chart_type: z.string().min(1, "Chart type is required"),
  configuration: z.any().optional(),
});

type ChartFormValues = z.infer<typeof chartFormSchema>;

interface ChartPreviewData {
  labels: string[];
  datasets: {
    label?: string;
    data: number[] | { x: number; y: number }[];
  }[];
}

interface Dataset {
  id: string;
  name: string;
  source_name?: string;
}

interface ChartCreatorProps {
  onSave: (chartData: any) => void;
  initialData?: any;
}

const ChartCreator: React.FC<ChartCreatorProps> = ({ onSave, initialData }) => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<ChartPreviewData | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedTab, setSelectedTab] = useState("data");

  // Initialize form
  const form = useForm<ChartFormValues>({
    resolver: zodResolver(chartFormSchema),
    defaultValues: initialData || {
      name: "",
      description: "",
      dataset_id: "",
      chart_type: "bar",
      configuration: {},
    },
  });

  // Watch for form value changes
  const watchedType = form.watch("chart_type");
  const watchedDataset = form.watch("dataset_id");

  // Fetch datasets on mount
  useEffect(() => {
    fetchDatasets();
  }, []);

  // Fetch dataset columns when dataset changes
  useEffect(() => {
    if (watchedDataset) {
      fetchDatasetColumns(watchedDataset);
    }
  }, [watchedDataset]);

  // Fetch datasets from API
  const fetchDatasets = async () => {
    try {
      const response = await api.get("/datasets");
      setDatasets(response.data.data || []);
    } catch (error) {
      toast.error("Failed to fetch datasets");
    }
  };

  // Fetch dataset columns
  const fetchDatasetColumns = async (datasetId: string) => {
    try {
      const response = await api.get(`/datasets/${datasetId}/preview?limit=5`);
      if (response.data && response.data.columns) {
        setColumns(response.data.columns);
        
        // Generate sample preview data
        generatePreviewData(response.data.columns, response.data.rows);
      }
    } catch (error) {
      toast.error("Failed to fetch dataset preview");
      setColumns([]);
      setPreviewData(null);
    }
  };

  // Generate preview data based on dataset
  const generatePreviewData = (columns: string[], rows: any[][]) => {
    if (!columns.length || !rows.length) {
      setPreviewData(null);
      return;
    }

    // For simplicity, we'll use the first column as labels and second as data
    const labelColumn = columns[0];
    const dataColumn = columns.length > 1 ? columns[1] : columns[0];
    
    const labels = rows.map(row => String(row[columns.indexOf(labelColumn)]));
    const data = rows.map(row => Number(row[columns.indexOf(dataColumn)]) || 0);
    
    setPreviewData({
      labels,
      datasets: [
        {
          label: dataColumn,
          data: data
        }
      ]
    });
  };

  // Handle form submission
  const onSubmit = (values: ChartFormValues) => {
    setLoading(true);
    
    try {
      // Add any additional configuration
      const chartData = {
        ...values,
        configuration: {
          ...values.configuration,
          // Add any default configuration based on chart type
        }
      };
      
      onSave(chartData);
    } catch (error) {
      toast.error("Failed to create chart");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="data">Chart Data</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="data" className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chart Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My Chart" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="chart_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chart Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select chart type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CHART_TYPES.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              <div className="flex items-center">
                                <type.icon className="mr-2 h-4 w-4" />
                                {type.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your chart" 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dataset_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dataset</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a dataset" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {datasets.map((dataset) => (
                          <SelectItem key={dataset.id} value={dataset.id}>
                            {dataset.name}
                            {dataset.source_name && ` (${dataset.source_name})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </TabsContent>
        
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Chart Appearance</CardTitle>
              <CardDescription>
                Customize how your chart looks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Advanced appearance settings will be available in the future.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Chart Preview</h3>
        <div className="border rounded-lg p-6 min-h-[300px] bg-card">
          {previewData ? (
            <div className="h-full">
              {/* Chart preview will be implemented in the Charts.tsx component */}
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">
                  Preview will be available after saving
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-muted-foreground">
                Select a dataset to preview the chart
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={() => onSave(null)}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          onClick={form.handleSubmit(onSubmit)}
          disabled={loading}
        >
          {loading ? "Saving..." : initialData ? "Update Chart" : "Create Chart"}
        </Button>
      </div>
    </div>
  );
};

export default ChartCreator;
