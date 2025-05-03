
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Save } from "lucide-react";

const DashboardBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dashboardName, setDashboardName] = useState("Untitled Dashboard");
  const isEditing = !!id;
  
  const handleSave = () => {
    // In a real app, you would save the dashboard to the backend
    toast.success(`Dashboard ${isEditing ? 'updated' : 'created'} successfully`);
    navigate("/dashboard");
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isEditing ? "Edit" : "Create"} Dashboard</h1>
          <p className="text-muted-foreground">
            {isEditing 
              ? "Modify your existing dashboard layout and settings" 
              : "Design a new dashboard by adding and arranging visualizations"}
          </p>
        </div>
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Save Dashboard
        </Button>
      </div>
      
      <div className="flex items-center space-x-2 pb-4 border-b">
        <Input 
          value={dashboardName}
          onChange={(e) => setDashboardName(e.target.value)}
          className="text-xl font-bold h-auto py-2 max-w-md"
        />
      </div>
      
      <div className="bg-muted/30 border rounded-md p-8 min-h-[500px] flex flex-col items-center justify-center text-center">
        <h3 className="text-2xl font-medium text-muted-foreground mb-4">Dashboard Builder</h3>
        <p className="mb-6 max-w-md">
          This is a placeholder for the dashboard builder interface. In a complete implementation, 
          you would be able to drag and drop charts onto a grid layout.
        </p>
        <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
          <Card className="h-40 flex items-center justify-center bg-background cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="text-center p-6">
              <p className="font-medium mb-2">Add Chart</p>
              <p className="text-sm text-muted-foreground">Select from your existing charts</p>
            </CardContent>
          </Card>
          <Card className="h-40 flex items-center justify-center bg-background cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="text-center p-6">
              <p className="font-medium mb-2">Add Text</p>
              <p className="text-sm text-muted-foreground">Add titles, descriptions or notes</p>
            </CardContent>
          </Card>
          <Card className="h-40 flex items-center justify-center bg-background cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="text-center p-6">
              <p className="font-medium mb-2">Add Filter</p>
              <p className="text-sm text-muted-foreground">Add interactive filters to your dashboard</p>
            </CardContent>
          </Card>
          <Card className="h-40 flex items-center justify-center bg-background cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="text-center p-6">
              <p className="font-medium mb-2">Add Image</p>
              <p className="text-sm text-muted-foreground">Upload and display images</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardBuilder;
