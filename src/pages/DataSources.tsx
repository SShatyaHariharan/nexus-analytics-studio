import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/components/ui/use-toast";

// Define the data source schema
const dataSourceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, {
    message: "Data source name must be at least 2 characters.",
  }),
  type: z.string().min(2, {
    message: "Data source type must be at least 2 characters.",
  }),
  description: z.string().optional(),
  connectionParams: z.object({
    host: z.string().optional(),
    port: z.string().optional(),
    database: z.string().optional(),
    user: z.string().optional(),
    password: z.string().optional(),
  }).optional(),
});

// Infer the type from the schema
type DataSource = z.infer<typeof dataSourceSchema>;

const DataSources = () => {
  const [dataSources, setDataSources] = useState<DataSource[]>([
    {
      id: "1",
      name: "PostgreSQL",
      type: "Database",
      description: "Main production database",
    },
    {
      id: "2",
      name: "MongoDB",
      type: "NoSQL Database",
      description: "User activity logs",
    },
  ]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const { toast } = useToast();

  // Zod form for data source creation/editing
  const form = useForm<DataSource>({
    resolver: zodResolver(dataSourceSchema),
    defaultValues: {
      name: "",
      type: "",
      description: "",
    },
    mode: "onChange",
  });

  // Function to handle form submission
  const onSubmit = (values: DataSource) => {
    if (editMode) {
      // Update existing data source
      setDataSources(
        dataSources.map((dataSource) =>
          dataSource.id === values.id ? values : dataSource
        )
      );
      toast({
        title: "Success",
        description: "Data source updated successfully.",
      });
    } else {
      // Create new data source
      const newDataSource = { ...values, id: String(Date.now()) };
      setDataSources([...dataSources, newDataSource]);
      toast({
        title: "Success",
        description: "Data source created successfully.",
      });
    }
    setOpen(false);
    form.reset();
  };

  // Function to handle data source deletion
  const deleteDataSource = (id: string) => {
    setDataSources(dataSources.filter((dataSource) => dataSource.id !== id));
    toast({
      title: "Success",
      description: "Data source deleted successfully.",
    });
  };

  // Function to retrieve a data source by ID
  const getDataSource = (id: string) => {
    return dataSources.find(source => source.id === id);
  };

  // Function to handle edit button click
  const handleEdit = (id: string) => {
    const dataSourceToEdit = getDataSource(id);
    if (dataSourceToEdit) {
      form.reset(dataSourceToEdit);
      setEditMode(true);
      setOpen(true);
    }
  };

  // Function to handle create button click
  const handleCreate = () => {
    form.reset();
    setEditMode(false);
    setOpen(true);
  };

  return (
    <div>
      <div className="mb-4 flex justify-between">
        <h2 className="text-2xl font-bold">Data Sources</h2>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Data Source
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableCaption>
            A list of your data sources. Click on a data source to edit it.
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dataSources.map((dataSource) => (
              <TableRow key={dataSource.id}>
                <TableCell className="font-medium">{dataSource.id}</TableCell>
                <TableCell>{dataSource.name}</TableCell>
                <TableCell>{dataSource.type}</TableCell>
                <TableCell>{dataSource.description}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(dataSource.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteDataSource(dataSource.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                {dataSources.length} Data Sources
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">Open Dialog</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editMode ? "Edit Data Source" : "Create Data Source"}
            </DialogTitle>
            <DialogDescription>
              {editMode
                ? "Make changes to your data source here. Click save when you're done."
                : "Add a new data source to your list. Click save when you're done."}
            </DialogDescription>
          </DialogHeader>
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
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <Input placeholder="Data Source Type" {...field} />
                    </FormControl>
                    <FormMessage />
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
                      <Input
                        placeholder="Data Source Description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">
                {editMode ? "Update Data Source" : "Create Data Source"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DataSources;
