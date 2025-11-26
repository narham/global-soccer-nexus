import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";

interface DocumentPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: {
    document_type: string;
    document_url: string;
  } | null;
}

export const DocumentPreviewDialog = ({
  open,
  onOpenChange,
  document,
}: DocumentPreviewDialogProps) => {
  if (!document) return null;

  const getFileType = (url: string): string => {
    const extension = url.split(".").pop()?.toLowerCase() || "";
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) return "image";
    if (extension === "pdf") return "pdf";
    return "other";
  };

  const fileType = getFileType(document.document_url);

  const handleDownload = () => {
    const link = window.document.createElement("a");
    link.href = document.document_url;
    link.download = document.document_type;
    link.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{document.document_type}</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(document.document_url, "_blank")}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in New Tab
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {fileType === "image" && (
            <img
              src={document.document_url}
              alt={document.document_type}
              className="w-full h-auto"
            />
          )}

          {fileType === "pdf" && (
            <iframe
              src={document.document_url}
              className="w-full h-full min-h-[500px]"
              title={document.document_type}
            />
          )}

          {fileType === "other" && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <p className="text-muted-foreground">
                Preview not available for this file type
              </p>
              <Button onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download File
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
