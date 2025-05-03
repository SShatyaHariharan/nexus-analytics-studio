
import { useState, useEffect } from "react";
import { 
  FileSpreadsheet, 
  Loader2, 
  PlusCircle, 
  Search,
  UploadCloud
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface Dataset {
  id: string;
  name: string;
  description: string;
  source_id: string;
  created_at: string;
  created_by: string;
  source_name?: string;
}

const Datasets = () => {
  const { hasPermission } = useAuth();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const canCreateDataset = hasPermission(0x07); // Analyst or higher
  
  useEffect(() => {
    fetchDatasets();
  }, []);
  
  const fetchDatasets = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/datasets");
      
      // Enhance the dataset with source information
      const enhancedDatasets = response.data.data.map((dataset: Dataset) => {
        // In a real app, you might want to fetch the data source name separately
        // or include it in the API response
        return {
          ...dataset,
          source_name: "Source Name Placeholder"
        };
      });
      
      setDatasets(enhancedDatasets || []);
    } catch (error) {
      console.error("Error fetching datasets:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const filteredDatasets = datasets.filter(dataset => 
    dataset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dataset.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleFileUpload = () => {
    toast.info("File upload feature will be implemented in the future");
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Datasets</h1>
          <p className="text-muted-foreground">
            Manage your datasets for analysis and visualization
          </p>
        </div>
        {canCreateDataset && (
          <div className="flex space-x-2">
            <Button onClick={handleFileUpload}>
              <UploadCloud className="mr-2 h-4 w-4" />
              Upload File
            </Button>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Dataset
            </Button>
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search datasets..."
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
      ) : filteredDatasets.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDatasets.map((dataset) => (
                  <TableRow key={dataset.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <FileSpreadsheet className="h-5 w-5 mr-2 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{dataset.name}</p>
                          <p className="text-sm text-muted-foreground">{dataset.description}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{dataset.source_name}</TableCell>
                    <TableCell>{new Date(dataset.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link to={`/datasets/${dataset.id}/preview`}>Preview</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card className="p-6 text-center bg-muted/50">
          <div className="flex justify-center mb-4">
            <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
          </div>
          <CardTitle className="mb-2">No datasets found</CardTitle>
          {searchQuery ? (
            <CardDescription>No datasets match your search query. Try a different search term.</CardDescription>
          ) : (
            <CardDescription className="mb-4">Create your first dataset to start analyzing data.</CardDescription>
          )}
          {!searchQuery && canCreateDataset && (
            <div className="flex justify-center space-x-2 mt-4">
              <Button onClick={handleFileUpload}>
                <UploadCloud className="mr-2 h-4 w-4" />
                Upload File
              </Button>
              <Button variant="outline">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Dataset
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default Datasets;
