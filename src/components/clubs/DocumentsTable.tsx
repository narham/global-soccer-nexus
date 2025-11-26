import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, FileText, CheckCircle, Clock, Eye, Download, File, FileImage } from "lucide-react";
import { TableActions } from "@/components/TableActions";
import { DocumentFormDialog } from "./DocumentFormDialog";
import { DocumentPreviewDialog } from "./DocumentPreviewDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DocumentsTableProps {
  clubId: string;
  documents: any[];
  onRefresh: () => void;
}

export const DocumentsTable = ({ clubId, documents, onRefresh }: DocumentsTableProps) => {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleDelete = async (id: string, documentUrl: string) => {
    try {
      // Delete file from storage if it's from our bucket
      if (documentUrl.includes("club-documents")) {
        const pathMatch = documentUrl.match(/club-documents\/(.+)$/);
        if (pathMatch) {
          const filePath = pathMatch[1];
          await supabase.storage.from("club-documents").remove([filePath]);
        }
      }

      // Delete document record
      const { error } = await supabase
        .from("club_documents")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Dokumen berhasil dihapus");
      onRefresh();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
  };

  const getFileIcon = (url: string) => {
    const extension = url.split(".").pop()?.toLowerCase() || "";
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) {
      return <FileImage className="w-4 h-4 text-blue-500" />;
    }
    return <File className="w-4 h-4 text-gray-500" />;
  };

  const getStatusBadge = (doc: any) => {
    if (doc.verified) {
      return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Terverifikasi</Badge>;
    }
    const validUntil = doc.valid_until ? new Date(doc.valid_until) : null;
    const today = new Date();
    if (validUntil && validUntil < today) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Dokumen & Legalitas</h3>
        <Button onClick={() => { setSelectedDoc(null); setFormOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Dokumen
        </Button>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/50">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Belum ada dokumen</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jenis Dokumen</TableHead>
                <TableHead>Berlaku Dari</TableHead>
                <TableHead>Berlaku Hingga</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>File</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.document_type}</TableCell>
                  <TableCell>
                    {doc.valid_from
                      ? new Date(doc.valid_from).toLocaleDateString("id-ID")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {doc.valid_until
                      ? new Date(doc.valid_until).toLocaleDateString("id-ID")
                      : "-"}
                  </TableCell>
                  <TableCell>{getStatusBadge(doc)}</TableCell>
                  <TableCell>
                    {doc.document_url && (
                      <div className="flex items-center gap-2">
                        {getFileIcon(doc.document_url)}
                        <span className="text-sm text-muted-foreground">
                          {doc.document_url.split("/").pop()?.substring(0, 20)}...
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {doc.document_url && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setPreviewDoc(doc);
                              setPreviewOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Preview
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(doc.document_url, doc.document_type)}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                        </>
                      )}
                      <TableActions
                        onEdit={() => { setSelectedDoc(doc); setFormOpen(true); }}
                        onDelete={() => handleDelete(doc.id, doc.document_url)}
                        itemName={doc.document_type}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <DocumentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        clubId={clubId}
        document={selectedDoc}
        onSuccess={onRefresh}
      />

      <DocumentPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        document={previewDoc}
      />
    </div>
  );
};
