
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { BarChart3, Database, LineChart, PieChart } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="py-16 text-center">
          <h1 className="text-5xl font-bold mb-6">Analytics Dashboard Platform</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            A powerful platform for data analysis, visualization, and insights. Transform your data into meaningful dashboards.
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild size="lg">
              <Link to="/login">Sign In</Link>
            </Button>
            <Button variant="outline" asChild size="lg">
              <Link to="/register">Register</Link>
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16">
          <h2 className="text-3xl font-bold mb-12 text-center">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="transition hover:shadow-lg">
              <CardHeader>
                <div className="mb-4">
                  <Database className="h-12 w-12 text-primary" />
                </div>
                <CardTitle>Data Integration</CardTitle>
                <CardDescription>
                  Connect to multiple data sources and bring all your data together.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Import data from CSV, Excel, JSON files or connect to databases and APIs.</p>
              </CardContent>
            </Card>

            <Card className="transition hover:shadow-lg">
              <CardHeader>
                <div className="mb-4">
                  <LineChart className="h-12 w-12 text-primary" />
                </div>
                <CardTitle>Rich Visualizations</CardTitle>
                <CardDescription>
                  Create beautiful and interactive charts and graphs.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Choose from bar charts, line charts, pie charts, maps, and more.</p>
              </CardContent>
            </Card>

            <Card className="transition hover:shadow-lg">
              <CardHeader>
                <div className="mb-4">
                  <BarChart3 className="h-12 w-12 text-primary" />
                </div>
                <CardTitle>Dashboard Builder</CardTitle>
                <CardDescription>
                  Create custom dashboards with drag-and-drop interface.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Combine multiple visualizations into interactive dashboards with filters.</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Index;
