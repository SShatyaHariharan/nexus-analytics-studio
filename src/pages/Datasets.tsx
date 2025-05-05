
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, FileSpreadsheet, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";
import SQLEditor from "@/components/datasets/SQLEditor";
import ResultsPreview from "@/components/datasets/ResultsPreview";

// Define the dataset schema
const datasetSchema = z.object({
  name: z.string().min(2, {
    message: "Dataset name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  source_id: z.string().min(1, {
    message: "Data source is required.",
  }),
  query: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Infer the type from the schema
type Dataset = {
  id: string;
  name: string;
  description?: string;
  source_id: string;
  source_name?: string;
  query?: string;
  tags?: string[];
  created_at?: string;
  created_by?: string;
};

type DataSource = {
  id: string;
  name: string;
  type: string;
};

type ResultData = {
  columns: string[];
  rows: any[][];
  total_rows?: number;
  schema?: any[];
};

const Datasets = () => {
  const { hasPermission } = useAuth();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sqlQuery, setSqlQuery] = useState("");
  const [queryResults, setQueryResults] = useState<ResultData | undefined>(undefined);
  const [executingQuery, setExecutingQuery] = useState(false);
  const [queryError, setQueryError] = useState<string | undefined>(undefined);
  const navigate = useNavigate();

  // Form for dataset creation/editing
  const form = useForm<z.infer<typeof datasetSchema>>({
    resolver: zodResolver(datasetSchema),
    defaultValues: {
      name: "",
      description: "",
      source_id: "",
      query: "",
      tags: [],
    },
  });

  // Fetch datasets and data sources on component mount
  useEffect(() => {
    fetchDatasets();
    fetchDataSources();
  }, []);

  // Function to fetch datasets
  const fetchDatasets = async () => {
    setLoading(true);
    try {
      const response = await api.get("/datasets");
      setDatasets(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch datasets");
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch data sources
  const fetchDataSources = async () => {
    try {
      const response = await api.get("/datasources");
      setDataSources(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch data sources");
    }
  };

  // Function to handle form submission
  const onSubmit = async (values: z.infer<typeof datasetSchema>) => {
    try {
      // Add query from SQL editor
      const dataToSubmit = {
        ...values,
        query: sqlQuery,
      };

      if (editMode && currentId) {
        // Update existing dataset
        await api.put(`/datasets/${currentId}`, dataToSubmit);
        toast.success("Dataset updated successfully");
      } else {
        // Create new dataset
        await api.post("/datasets", dataToSubmit);
        toast.success("Dataset created successfully");
      }
      fetchDatasets();
      setDialogOpen(false);
    } catch (error) {
      toast.error("Failed to save dataset");
    }
  };

  // Function to execute SQL query
  const executeQuery = async () => {
    if (!sqlQuery.trim() || !form.getValues("source_id")) return;

    setExecutingQuery(true);
    setQueryError(undefined);
    
    try {
      const response = await api.post("/datasets/execute-query", {
        source_id: form.getValues("source_id"),
        query: sqlQuery,
      });
      
      setQueryResults({
        columns: response.data.columns,
        rows: response.data.rows,
        total_rows: response.data.total_rows,
        schema: response.data.schema,
      });
    } catch (error: any) {
      setQueryError(error.response?.data?.message || "Failed to execute query");
      setQueryResults(undefined);
    } finally {
      setExecutingQuery(false);
    }
  };

  // Function to handle dataset deletion
  const deleteDataset = async (id: string) => {
    if (confirm("Are you sure you want to delete this dataset?")) {
      try {
        await api.delete(`/datasets/${id}`);
        toast.success("Dataset deleted successfully");
        fetchDatasets();
      } catch (error) {
        toast.error("Failed to delete dataset");
      }
    }
  };

  // Function to handle edit button click
  const handleEdit = async (id: string) => {
    try {
      const response = await api.get(`/datasets/${id}`);
      const dataset = response.data;
      form.reset({
        name: dataset.name,
        description: dataset.description || "",
        source_id: dataset.source_id,
        query: dataset.query || "",
        tags: dataset.tags || [],
      });
      setSqlQuery(dataset.query || "");
      setCurrentId(id);
      setEditMode(true);
      setDialogOpen(true);
      
      // Clear previous results
      setQueryResults(undefined);
      setQueryError(undefined);
    } catch (error) {
      toast.error("Failed to retrieve dataset details");
    }
  };

  // Function to handle create button click
  const handleCreate = () => {
    form.reset({
      name: "",
      description: "",
      source_id: "",
      query: "",
      tags: [],
    });
    setSqlQuery("");
    setCurrentId(null);
    setEditMode(false);
    setDialogOpen(true);
    
    // Clear previous results
    setQueryResults(undefined);
    setQueryError(undefined);
  };

  // Filter datasets based on search term
  const filteredDatasets = datasets.filter(
    (dataset) =>
      dataset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dataset.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dataset.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Datasets</h1>
          <p className="text-muted-foreground">
            Create and manage datasets from your data sources
          </p>
        </div>
        {hasPermission("edit_dataset") && (
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Dataset
          </Button>
        )}
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search datasets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredDatasets.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableCaption>A list of your datasets</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="hidden md:table-cell">Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDatasets.map((dataset) => (
                <TableRow key={dataset.id}>
                  <TableCell className="font-medium">{dataset.name}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {dataset.description || "No description"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      {dataset.source_name || "Unknown source"}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {dataset.created_at
                      ? new Date(dataset.created_at).toLocaleDateString()
                      : "Unknown"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      {hasPermission("edit_dataset") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(dataset.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {hasPermission("delete_dataset") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteDataset(dataset.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-10 border rounded-md bg-muted/20">
          <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium">No datasets found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm
              ? "No datasets match your search criteria"
              : "Get started by creating your first dataset"}
          </p>
          {hasPermission("edit_dataset") && !searchTerm && (
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create Dataset
            </Button>
          )}
        </div>
      )}

      {hasPermission("edit_dataset") && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                {editMode ? "Edit Dataset" : "Create Dataset"}
              </DialogTitle>
              <DialogDescription>
                {editMode
                  ? "Update your dataset details and SQL query"
                  : "Create a new dataset with an SQL query"}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-6">
              <Form {...form}>
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Dataset Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="source_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data Source</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a data source" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {dataSources.map((source) => (
                                <SelectItem key={source.id} value={source.id}>
                                  {source.name} ({source.type})
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
                          <Input placeholder="Dataset description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>

              <div className="space-y-4">
                <h3 className="text-sm font-medium">SQL Query</h3>
                <SQLEditor
                  value={sqlQuery}
                  onChange={setSqlQuery}
                  onExecute={executeQuery}
                  isExecuting={executingQuery}
                  placeholder="SELECT * FROM your_table WHERE condition"
                />
              </div>

              <ResultsPreview
                data={queryResults}
                loading={executingQuery}
                error={queryError}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="button"
                  onClick={form.handleSubmit(onSubmit)}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {editMode ? "Update Dataset" : "Save Dataset"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Datasets;
