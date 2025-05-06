
import { useState } from "react";
import { Upload, X, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import api from "@/services/api";

interface FileUploaderProps {
  onUploadComplete: (sourceId: string) => void;
  maxSize?: number; // in MB
  allowedTypes?: string[];
}

const FileUploader = ({
  onUploadComplete,
  maxSize = 16, // Default 16MB
  allowedTypes = ["csv", "xlsx", "xls", "json"],
}: FileUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Check file size
    if (selectedFile.size > maxSize * 1024 * 1024) {
      toast.error(`File size exceeds the maximum allowed size of ${maxSize}MB`);
      return;
    }

    // Check file type
    const fileExt = selectedFile.name.split(".").pop()?.toLowerCase();
    if (fileExt && !allowedTypes.includes(fileExt)) {
      toast.error(
        `File type not supported. Allowed types: ${allowedTypes.join(", ")}`
      );
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    // Create form data
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", file.name);
    formData.append(
      "description",
      `Uploaded file ${file.name} on ${new Date().toLocaleString()}`
    );

    setUploading(true);
    setProgress(0);

    try {
      // Upload with progress tracking
      const response = await api.post("/datasources", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent: any) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percentCompleted);
          }
        },
      });

      toast.success("File uploaded successfully");
      onUploadComplete(response.data.id);
      setFile(null);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.message || "Error uploading file");
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  return (
    <div className="w-full">
      {!file ? (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-md p-8 text-center">
          <Upload className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-1">Drag & drop your file here</h3>
          <p className="text-sm text-muted-foreground mb-4">
            or click to browse your files
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Supported formats: {allowedTypes.join(", ")} (Max size: {maxSize}MB)
          </p>
          <input
            type="file"
            className="hidden"
            id="fileInput"
            onChange={handleFileChange}
            accept={allowedTypes.map((type) => `.${type}`).join(",")}
          />
          <Button asChild>
            <label htmlFor="fileInput">Select File</label>
          </Button>
        </div>
      ) : (
        <div className="border rounded-md p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="p-2 rounded-md bg-primary/10 mr-3">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-medium">{file.name}</h4>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={removeFile}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {uploading && (
            <div className="mb-4">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {progress}%
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={removeFile}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload File"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
