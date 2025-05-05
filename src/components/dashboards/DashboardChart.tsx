
import { useState } from 'react';
import { Trash2, Move, Maximize2, Minimize2 } from 'lucide-react';
import ChartRenderer from '@/components/charts/ChartRenderer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from "@/contexts/AuthContext";

interface DashboardChartProps {
  id: string;
  chartId: string;
  title: string;
  chartType: string;
  onRemove?: (id: string) => void;
  filters?: Record<string, any>;
  isEditing: boolean;
  position: { x: number; y: number; w: number; h: number };
}

const DashboardChart: React.FC<DashboardChartProps> = ({
  id,
  chartId,
  title,
  chartType,
  onRemove,
  filters = {},
  isEditing,
  position,
}) => {
  const { hasPermission } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const canEdit = hasPermission("edit_dashboard");

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  return (
    <Card className={`h-full overflow-hidden ${expanded ? 'fixed inset-0 z-50' : ''}`}>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" onClick={toggleExpand}>
              {expanded ? 
                <Minimize2 className="h-4 w-4" /> : 
                <Maximize2 className="h-4 w-4" />
              }
            </Button>
            {isEditing && canEdit && onRemove && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onRemove(id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            {isEditing && canEdit && (
              <Button 
                variant="ghost" 
                size="icon"
                className="cursor-move drag-handle"
              >
                <Move className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 px-4 pb-4">
        <div className={expanded ? 'h-[calc(100vh-100px)]' : 'h-[240px]'}>
          <ChartRenderer
            chartId={chartId}
            chartType={chartType}
            filters={filters}
            height={expanded ? window.innerHeight - 140 : 240}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardChart;
