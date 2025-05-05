
import React from "react";
import { Link } from "react-router-dom";
import { BarChart3, Database, FileSpreadsheet, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background">
        <div className="container mx-auto py-4 px-6 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold">VisualX</h1>
            <nav className="hidden md:flex items-center space-x-6">
              <Link to="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</Link>
              <Link to="#about" className="text-muted-foreground hover:text-foreground transition-colors">About</Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Link to="/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link to="/register">
              <Button>Register</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-20 px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                  Make Your Data <span className="text-primary">Actionable</span>
                </h1>
                <p className="mt-6 text-xl text-muted-foreground">
                  A powerful analytics platform for visualizing and understanding your data.
                  Create interactive dashboards with ease.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <Link to="/register">
                    <Button size="lg" className="w-full sm:w-auto">Get Started</Button>
                  </Link>
                  <Link to="/login">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto">Login to Dashboard</Button>
                  </Link>
                </div>
              </div>
              <div className="rounded-xl bg-muted/30 border p-6 lg:p-10">
                <div className="aspect-video bg-card rounded-lg shadow-lg overflow-hidden">
                  <img 
                    src="/placeholder.svg" 
                    alt="Dashboard Preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-6 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold">Powerful Features</h2>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                Everything you need to analyze, visualize, and share your data insights
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-background rounded-xl p-6 shadow-sm border">
                <div className="p-2 rounded-full bg-primary/10 w-fit mb-4">
                  <Database className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Data Sources</h3>
                <p className="mt-2 text-muted-foreground">
                  Connect to various data sources including databases and file uploads
                </p>
              </div>

              <div className="bg-background rounded-xl p-6 shadow-sm border">
                <div className="p-2 rounded-full bg-primary/10 w-fit mb-4">
                  <FileSpreadsheet className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">SQL Datasets</h3>
                <p className="mt-2 text-muted-foreground">
                  Create and manage datasets with custom SQL queries
                </p>
              </div>

              <div className="bg-background rounded-xl p-6 shadow-sm border">
                <div className="p-2 rounded-full bg-primary/10 w-fit mb-4">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Interactive Charts</h3>
                <p className="mt-2 text-muted-foreground">
                  Visualize your data with a variety of chart types and customizations
                </p>
              </div>

              <div className="bg-background rounded-xl p-6 shadow-sm border">
                <div className="p-2 rounded-full bg-primary/10 w-fit mb-4">
                  <LayoutDashboard className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Dynamic Dashboards</h3>
                <p className="mt-2 text-muted-foreground">
                  Build interactive dashboards with filtering capabilities
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-20 px-6">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold">About VisualX</h2>
            <p className="mt-6 text-muted-foreground">
              VisualX is an advanced analytics platform designed to help businesses and organizations 
              transform their data into actionable insights. Our platform combines powerful data processing
              with intuitive visualization tools, making it easy for anyone to understand complex data.
            </p>
            <p className="mt-4 text-muted-foreground">
              With role-based access control, real-time data processing, and Redis caching, VisualX
              is built for performance and security at scale.
            </p>
            <div className="mt-10">
              <Link to="/register">
                <Button>Get Started Now</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-auto bg-muted/30 border-t py-12 px-6">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h2 className="text-xl font-bold">VisualX</h2>
              <p className="text-sm text-muted-foreground mt-1">© {new Date().getFullYear()} VisualX Analytics. All rights reserved.</p>
            </div>
            <div className="flex items-center space-x-6">
              <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">Login</Link>
              <Link to="/register" className="text-sm text-muted-foreground hover:text-foreground">Register</Link>
              <Link to="#features" className="text-sm text-muted-foreground hover:text-foreground">Features</Link>
              <Link to="#about" className="text-sm text-muted-foreground hover:text-foreground">About</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
