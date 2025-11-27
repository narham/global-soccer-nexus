import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { parseFile, ParsedData } from "@/lib/data-parser";
import { downloadTemplate, EntityType, columnMapping } from "@/lib/import-templates";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DataImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: EntityType;
  onSuccess: () => void;
}

export const DataImportDialog = ({ open, onOpenChange, entityType, onSuccess }: DataImportDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [successCount, setSuccessCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const entityLabels = {
    clubs: 'Klub',
    players: 'Pemain',
    competitions: 'Kompetisi'
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setErrors([]);
    setLoading(true);

    try {
      const data = await parseFile(selectedFile);
      setParsedData(data);
      toast.success(`File berhasil dibaca: ${data.rows.length} baris data`);
    } catch (error: any) {
      toast.error(error.message);
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  const validateAndTransformData = (row: any, index: number): any | null => {
    const mapping = columnMapping[entityType];
    const transformed: any = {};
    const rowErrors: string[] = [];

    for (const [excelCol, dbCol] of Object.entries(mapping)) {
      const value = row[excelCol];
      
      // Check required fields
      if (excelCol.includes('*') && (!value || value === '')) {
        rowErrors.push(`Baris ${index + 2}: ${excelCol} tidak boleh kosong`);
        continue;
      }

      if (value !== undefined && value !== null && value !== '') {
        transformed[dbCol] = value;
      }
    }

    // Entity-specific validations
    if (entityType === 'players') {
      if (transformed.nik && transformed.nik.length !== 16) {
        rowErrors.push(`Baris ${index + 2}: NIK harus 16 digit`);
      }
      if (transformed.position && !['GK', 'DF', 'MF', 'FW'].includes(transformed.position)) {
        rowErrors.push(`Baris ${index + 2}: Posisi harus GK, DF, MF, atau FW`);
      }
    }

    if (entityType === 'competitions') {
      if (transformed.type && !['liga', 'piala', 'youth_league'].includes(transformed.type)) {
        rowErrors.push(`Baris ${index + 2}: Jenis harus liga, piala, atau youth_league`);
      }
      if (transformed.format && !['round_robin', 'knockout', 'group_knockout'].includes(transformed.format)) {
        rowErrors.push(`Baris ${index + 2}: Format harus round_robin, knockout, atau group_knockout`);
      }
    }

    if (rowErrors.length > 0) {
      setErrors(prev => [...prev, ...rowErrors]);
      return null;
    }

    return transformed;
  };

  const handleImport = async () => {
    if (!parsedData) return;

    setImporting(true);
    setErrors([]);
    setSuccessCount(0);
    setProgress(0);

    const validRows: any[] = [];
    
    // Validate all rows
    parsedData.rows.forEach((row, index) => {
      const transformed = validateAndTransformData(row, index);
      if (transformed) {
        validRows.push(transformed);
      }
    });

    if (validRows.length === 0) {
      toast.error("Tidak ada data valid untuk diimport");
      setImporting(false);
      return;
    }

    // Import in batches
    const batchSize = 10;
    let successfulImports = 0;

    for (let i = 0; i < validRows.length; i += batchSize) {
      const batch = validRows.slice(i, i + batchSize);
      
      try {
        const { error } = await supabase
          .from(entityType)
          .insert(batch);

        if (error) {
          setErrors(prev => [...prev, `Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`]);
        } else {
          successfulImports += batch.length;
        }
      } catch (error: any) {
        setErrors(prev => [...prev, `Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`]);
      }

      setProgress(Math.round(((i + batch.length) / validRows.length) * 100));
      setSuccessCount(successfulImports);
    }

    setImporting(false);

    if (successfulImports > 0) {
      toast.success(`${successfulImports} data berhasil diimport`);
      onSuccess();
      setTimeout(() => onOpenChange(false), 2000);
    } else {
      toast.error("Import gagal, periksa error di bawah");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Data {entityLabels[entityType]}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Download Template */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => downloadTemplate(entityType, 'xlsx')}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Template Excel
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => downloadTemplate(entityType, 'csv')}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Template CSV
            </Button>
          </div>

          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging ? 'border-primary bg-primary/5' : 'border-border'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
          >
            {!file ? (
              <div className="space-y-4">
                <FileSpreadsheet className="w-12 h-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag & drop file Excel atau CSV di sini, atau
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Pilih File
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Format yang didukung: .xlsx, .xls, .csv
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-green-500" />
                <p className="font-medium">{file.name}</p>
                {parsedData && (
                  <p className="text-sm text-muted-foreground">
                    {parsedData.rows.length} baris data terdeteksi
                  </p>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFile(null);
                    setParsedData(null);
                    setErrors([]);
                  }}
                >
                  Ganti File
                </Button>
              </div>
            )}
          </div>

          {/* Preview Data */}
          {parsedData && !importing && (
            <ScrollArea className="flex-1 border rounded-lg">
              <div className="p-4">
                <h4 className="font-medium mb-2">Preview Data (5 baris pertama)</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        {parsedData.headers.map((header, i) => (
                          <th key={i} className="text-left p-2 font-medium">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.rows.slice(0, 5).map((row, i) => (
                        <tr key={i} className="border-b">
                          {parsedData.headers.map((header, j) => (
                            <td key={j} className="p-2">
                              {row[header] || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </ScrollArea>
          )}

          {/* Import Progress */}
          {importing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Mengimport data...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground">
                {successCount} data berhasil diimport
              </p>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <ScrollArea className="max-h-48 border rounded-lg">
              <Alert variant="destructive" className="m-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">Error ditemukan:</div>
                  <ul className="list-disc pl-4 space-y-1 text-sm">
                    {errors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            </ScrollArea>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={importing}
            >
              Batal
            </Button>
            <Button
              onClick={handleImport}
              disabled={!parsedData || importing || loading}
            >
              {importing ? "Mengimport..." : `Import ${parsedData?.rows.length || 0} Data`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
