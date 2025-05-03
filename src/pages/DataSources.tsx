
import { useState, useEffect } from "react";
import { 
  Database,
  Edit,
  Loader2,
  MoreHorizontal,
  PlusCircle, 
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";
import { toast } from "sonner";
import DataSourceDialog from "@/components/data-sources/DataSourceDialog";

interface DataSource {
  id: string;
  name: string;
  description: string;
  type: string;
  connection_params: Record<string, any>;
  created_at: string;
}

const DataSources = () => {
  const { hasPermission } = useAuth();
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDataSource, setSelectedDataSource] = useState<DataSource | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const canCreateDataSource = hasPermission(0x0F); // Developer or higher
  
  useEffect(() => {
    fetchDataSources();
  }, []);
  
  const fetchDataSources = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/datasources");
      setDataSources(response.data.data || []);
    } catch (error) {
      console.error("Error fetching data sources:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCreate = () => {
    setSelectedDataSource(null);
    setIsDialogOpen(true);
  };
  
  const handleEdit = (dataSource: DataSource) => {
    setSelectedDataSource(dataSource);
    setIsDialogOpen(true);
  };
  
  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this data source?")) {
      try {
        await api.delete(`/datasources/${id}`);
        toast.success("Data source deleted successfully");
        fetchDataSources();
      } catch (error) {
        console.error("Error deleting data source:", error);
      }
    }
  };
  
  const handleDialogClose = (refreshData: boolean) => {
    setIsDialogOpen(false);
    if (refreshData) {
      fetchDataSources();
    }
  };
  
  const getTypeIcon = (type: string) => {
    return <Database className="h-5 w-5" />;
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Sources</h1>
          <p className="text-muted-foreground">
            Manage your data connections
          </p>
        </div>
        {canCreateDataSource && (
          <Button onClick={handleCreate}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Data Source
          </Button>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : dataSources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dataSources.map((dataSource) => (
            <Card key={dataSource.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="flex items-center space-x-2">
                  {getTypeIcon(dataSource.type)}
                  <div>
                    <CardTitle>{dataSource.name}</CardTitle>
                    <CardDescription className="text-xs uppercase">
                      {dataSource.type}
                    </CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(dataSource)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(dataSource.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {dataSource.description || "No description provided."}
                </p>
              </CardContent>
              <CardFooter className="text-xs text-gray-500">
                Created {new Date(dataSource.created_at).toLocaleDateString()}
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6 text-center bg-muted/50">
          <p className="text-muted-foreground mb-4">No data sources found.</p>
          {canCreateDataSource && (
            <Button onClick={handleCreate}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Your First Data Source
            </Button>
          )}
        </Card>
      )}
      
      <DataSourceDialog 
        open={isDialogOpen} 
        onClose={handleDialogClose}
        dataSource={selectedDataSource}
      />
    </div>
  );
};

export default DataSources;
