import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// Dummy data for datasets
const datasets = [
  { id: "1", name: "Sales Data", description: "Monthly sales data", source: "PostgreSQL", columns: 12, rows: 1245 },
  { id: "2", name: "Customer Info", description: "Customer demographics", source: "MySQL", columns: 8, rows: 876 },
  { id: "3", name: "Product Catalog", description: "List of all products", source: "CSV", columns: 5, rows: 345 },
];

const Datasets = () => {
  const [search, setSearch] = useState("");

  // Filter datasets based on search term
  const filteredDatasets = datasets.filter(dataset =>
    dataset.name.toLowerCase().includes(search.toLowerCase()) ||
    dataset.description.toLowerCase().includes(search.toLowerCase()) ||
    dataset.source.toLowerCase().includes(search.toLowerCase())
  );

  // Fix the error in the getDataset function
  const getDataset = (id: string) => {
    // Convert the id parameter to a string if it's being passed as a number
    return datasets.find(dataset => dataset.id === id);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Datasets</h2>
        <Link to="/datasets/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Dataset
          </Button>
        </Link>
      </div>

      <div className="mb-4">
        <Input
          type="search"
          placeholder="Search datasets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <ScrollArea>
        <Table>
          <TableCaption>A list of your datasets.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Columns</TableHead>
              <TableHead>Rows</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDatasets.map((dataset) => (
              <TableRow key={dataset.id}>
                <TableCell>{dataset.name}</TableCell>
                <TableCell>{dataset.description}</TableCell>
                <TableCell>{dataset.source}</TableCell>
                <TableCell>{dataset.columns}</TableCell>
                <TableCell>{dataset.rows}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link to={`/datasets/edit/${dataset.id}`}>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
};

export default Datasets;
