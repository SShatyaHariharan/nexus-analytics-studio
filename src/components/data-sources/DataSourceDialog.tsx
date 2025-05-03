
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import api from "@/services/api";
import { toast } from "sonner";

interface DataSource {
  id: string;
  name: string;
  description: string;
  type: string;
  connection_params: Record<string, any>;
}

interface DataSourceDialogProps {
  open: boolean;
  onClose: (refreshData: boolean) => void;
  dataSource: DataSource | null;
}

const dataSourceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.string().min(1, "Type is required"),
  host: z.string().optional(),
  port: z.coerce.number().int().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  database: z.string().optional(),
  schema: z.string().optional(),
  api_key: z.string().optional(),
  api_url: z.string().optional(),
});

type FormValues = z.infer<typeof dataSourceSchema>;

const DataSourceDialog = ({ open, onClose, dataSource }: DataSourceDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!dataSource;

  const form = useForm<FormValues>({
    resolver: zodResolver(dataSourceSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "postgresql",
      host: "",
      port: 5432,
      username: "",
      password: "",
      database: "",
      schema: "",
      api_key: "",
      api_url: "",
    },
  });
  
  useEffect(() => {
    if (dataSource) {
      const { connection_params } = dataSource;
      form.reset({
        name: dataSource.name,
        description: dataSource.description || "",
        type: dataSource.type,
        host: connection_params?.host || "",
        port: connection_params?.port || 5432,
        username: connection_params?.username || "",
        password: "",  // Don't populate password for security
        database: connection_params?.database || "",
        schema: connection_params?.schema || "",
        api_key: connection_params?.api_key || "",
        api_url: connection_params?.api_url || "",
      });
    } else {
      form.reset({
        name: "",
        description: "",
        type: "postgresql",
        host: "",
        port: 5432,
        username: "",
        password: "",
        database: "",
        schema: "",
        api_key: "",
        api_url: "",
      });
    }
  }, [dataSource, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      
      // Prepare the connection parameters based on the type
      const connectionParams: Record<string, any> = {};
      
      if (values.type === "postgresql" || values.type === "mysql") {
        connectionParams.host = values.host;
        connectionParams.port = values.port;
        connectionParams.username = values.username;
        if (values.password) {
          connectionParams.password = values.password;
        }
        connectionParams.database = values.database;
        if (values.schema) {
          connectionParams.schema = values.schema;
        }
      } else if (values.type === "api") {
        connectionParams.api_url = values.api_url;
        connectionParams.api_key = values.api_key;
      }
      
      const payload = {
        name: values.name,
        description: values.description,
        type: values.type,
        connection_params: connectionParams,
      };
      
      if (isEditing && dataSource) {
        await api.put(`/datasources/${dataSource.id}`, payload);
        toast.success("Data source updated successfully");
      } else {
        await api.post("/datasources", payload);
        toast.success("Data source created successfully");
      }
      
      onClose(true);
    } catch (error) {
      console.error("Error saving data source:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderConnectionFields = () => {
    const type = form.watch("type");
    
    if (type === "postgresql" || type === "mysql") {
      return (
        <>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="host"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Host</FormLabel>
                  <FormControl>
                    <Input placeholder="localhost or IP address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="port"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Port</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormDescription>
                    {isEditing ? "Leave blank to keep current password" : ""}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="database"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Database Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="schema"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Schema (Optional)</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      );
    } else if (type === "api") {
      return (
        <>
          <FormField
            control={form.control}
            name="api_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>API URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://api.example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="api_key"
            render={({ field }) => (
              <FormItem>
                <FormLabel>API Key</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormDescription>
                  {isEditing ? "Leave blank to keep current API key" : ""}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      );
    }
    
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose(false)}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Data Source" : "Add Data Source"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modify the connection details for this data source"
              : "Create a new connection to your data"}
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
                    <Input placeholder="Data source name" {...field} />
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
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Brief description of this data source" {...field} />
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="postgresql">PostgreSQL</SelectItem>
                      <SelectItem value="mysql">MySQL</SelectItem>
                      <SelectItem value="api">REST API</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {renderConnectionFields()}
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onClose(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : isEditing ? (
                  "Update"
                ) : (
                  "Create"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default DataSourceDialog;
