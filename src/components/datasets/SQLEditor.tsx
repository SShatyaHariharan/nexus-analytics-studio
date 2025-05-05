
import React, { useState } from 'react';
import { Play, Copy, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface SQLEditorProps {
  value: string;
  onChange: (value: string) => void;
  onExecute: () => void;
  isExecuting?: boolean;
  placeholder?: string;
}

const SQLEditor: React.FC<SQLEditorProps> = ({
  value,
  onChange,
  onExecute,
  isExecuting = false,
  placeholder = 'Write your SQL query here...',
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast({
      title: "Query copied",
      description: "SQL query has been copied to clipboard",
    });
    
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="bg-muted/50 p-2 flex justify-between items-center border-b">
        <span className="text-sm font-medium">SQL Query</span>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            disabled={!value}
            title="Copy query"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button
            size="sm"
            onClick={onExecute}
            disabled={isExecuting || !value.trim()}
            className="flex items-center"
          >
            <Play className="mr-2 h-3 w-3" />
            {isExecuting ? "Executing..." : "Execute"}
          </Button>
        </div>
      </div>
      <textarea
        className="w-full h-40 p-3 font-mono text-sm bg-background resize-none focus:outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
      />
    </div>
  );
};

export default SQLEditor;
