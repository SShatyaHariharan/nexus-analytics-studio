
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Database, FileText, Upload, Loader2 } from "lucide-react";
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
  DialogTrigger,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";
import FileUploader from "@/components/data-sources/FileUploader";

// Define the data source schema
const dataSourceSchema = z.object({
  name: z.string().min(2, {
    message: "Data source name must be at least 2 characters.",
  }),
  type: z.string().min(2, {
    message: "Data source type must be at least 2 characters.",
  }),
  description: z.string().optional(),
  connection_params: z.object({
    host: z.string().optional(),
    port: z.string().optional(),
    database: z.string().optional(),
    user: z.string().optional(),
    password: z.string().optional(),
  }).optional(),
});

// Infer the type from the schema
type DataSource = {
  id: string;
  name: string;
  type: string;
  description?: string;
  connection_params?: any;
  created_at?: string;
  created_by?: string;
};

const DataSources = () => {
  const { hasPermission } = useAuth();
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  // Zod form for data source creation/editing
  const form = useForm<z.infer<typeof dataSourceSchema>>({
    resolver: zodResolver(dataSourceSchema),
    defaultValues: {
      name: "",
      type: "database",
      description: "",
      connection_params: {
        host: "",
        port: "",
        database: "",
        user: "",
        password: "",
      }
    },
  });

  // Fetch data sources on component mount
  useEffect(() => {
    fetchDataSources();
  }, []);

  // Function to fetch data sources
  const fetchDataSources = async () => {
    setLoading(true);
    try {
      const response = await api.get("/datasources");
      setDataSources(response.data.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch data sources",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to handle form submission
  const onSubmit = async (values: z.infer<typeof dataSourceSchema>) => {
    try {
      if (editMode && currentId) {
        // Update existing data source
        await api.put(`/datasources/${currentId}`, values);
        toast({
          title: "Success",
          description: "Data source updated successfully.",
        });
      } else {
        // Create new data source
        await api.post("/datasources", values);
        toast({
          title: "Success",
          description: "Data source created successfully.",
        });
      }
      fetchDataSources();
      setOpen(false);
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save data source.",
        variant: "destructive",
      });
    }
  };

  // Function to handle data source deletion
  const deleteDataSource = async (id: string) => {
    if (confirm("Are you sure you want to delete this data source?")) {
      try {
        await api.delete(`/datasources/${id}`);
        toast({
          title: "Success",
          description: "Data source deleted successfully.",
        });
        fetchDataSources();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete data source.",
          variant: "destructive",
        });
      }
    }
  };

  // Function to handle edit button click
  const handleEdit = async (id: string) => {
    try {
      const response = await api.get(`/datasources/${id}`);
      const dataSource = response.data;
      form.reset({
        name: dataSource.name,
        type: dataSource.type,
        description: dataSource.description || "",
        connection_params: dataSource.connection_params || {
          host: "",
          port: "",
          database: "",
          user: "",
          password: "",
        },
      });
      setCurrentId(id);
      setEditMode(true);
      setOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to retrieve data source details.",
        variant: "destructive",
      });
    }
  };

  // Function to handle create button click
  const handleCreate = () => {
    form.reset({
      name: "",
      type: "database",
      description: "",
      connection_params: {
        host: "",
        port: "",
        database: "",
        user: "",
        password: "",
      },
    });
    setCurrentId(null);
    setEditMode(false);
    setOpen(true);
  };

  // Filter data sources based on search term
  const filteredDataSources = dataSources.filter(
    (source) =>
      source.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      source.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      source.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle file upload completion
  const handleUploadComplete = (sourceId: string) => {
    fetchDataSources();
    setOpen(false);
  };

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Sources</h1>
          <p className="text-muted-foreground">
            Manage your connected data sources
          </p>
        </div>
        {hasPermission("edit_datasource") && (
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Data Source
          </Button>
        )}
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search data sources..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredDataSources.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableCaption>A list of your data sources</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead className="hidden md:table-cell">Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDataSources.map((source) => (
                <TableRow key={source.id}>
                  <TableCell className="font-medium">{source.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {source.type === "file" ? (
                        <FileText className="h-4 w-4 mr-2" />
                      ) : (
                        <Database className="h-4 w-4 mr-2" />
                      )}
                      {source.type}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {source.description || "No description"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {source.created_at
                      ? new Date(source.created_at).toLocaleDateString()
                      : "Unknown"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      {hasPermission("edit_datasource") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(source.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {hasPermission("delete_datasource") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteDataSource(source.id)}
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
          <Database className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium">No data sources found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm
              ? "No data sources match your search criteria"
              : "Get started by adding your first data source"}
          </p>
          {hasPermission("edit_datasource") && !searchTerm && (
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Data Source
            </Button>
          )}
        </div>
      )}

      {hasPermission("edit_datasource") && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editMode ? "Edit Data Source" : "Add Data Source"}
              </DialogTitle>
              <DialogDescription>
                {editMode
                  ? "Update your data source details"
                  : "Connect to a database or upload a file"}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="database">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="database">Database Connection</TabsTrigger>
                <TabsTrigger value="file">File Upload</TabsTrigger>
              </TabsList>

              <TabsContent value="database">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Data Source Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., postgresql, mysql" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="connection_params.host"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Host</FormLabel>
                            <FormControl>
                              <Input placeholder="localhost" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="connection_params.port"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Port</FormLabel>
                            <FormControl>
                              <Input placeholder="5432" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="connection_params.database"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Database</FormLabel>
                            <FormControl>
                              <Input placeholder="database name" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="connection_params.user"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="username" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="connection_params.password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="password" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input placeholder="Data Source Description" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        {editMode ? "Update Data Source" : "Create Data Source"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="file">
                <FileUploader onUploadComplete={handleUploadComplete} />
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default DataSources;
