import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, User, Building2, Hash, UserCheck } from "lucide-react";

interface PlayerExistsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingPlayer: {
    id: string;
    full_name: string;
    nik: string;
    club_name: string | null;
    current_club_id: string | null;
  } | null;
  onTransfer: () => void;
  onRecruitFreeAgent?: () => void;
}

export const PlayerExistsDialog = ({ 
  open, 
  onOpenChange, 
  existingPlayer,
  onTransfer,
  onRecruitFreeAgent
}: PlayerExistsDialogProps) => {
  if (!existingPlayer) return null;

  const isFreeAgent = !existingPlayer.current_club_id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="h-5 w-5" />
            Pemain Sudah Terdaftar
          </DialogTitle>
        </DialogHeader>

        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            NIK ini sudah terdaftar di database sistem.
          </AlertDescription>
        </Alert>

        <div className="space-y-3 py-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <User className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">Nama Pemain</p>
              <p className="text-base font-semibold">{existingPlayer.full_name}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">Klub Saat Ini</p>
              <div className="flex items-center gap-2">
                {isFreeAgent ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <UserCheck className="h-3 w-3 mr-1" />
                    Free Agent
                  </Badge>
                ) : (
                  <p className="text-base font-semibold">{existingPlayer.club_name}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Hash className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">NIK</p>
              <p className="text-base font-mono font-semibold">{existingPlayer.nik}</p>
            </div>
          </div>
        </div>

        {isFreeAgent ? (
          <Alert className="border-green-500/50 bg-green-500/10">
            <UserCheck className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-sm">
              Pemain ini adalah <strong>Free Agent</strong> dan dapat langsung direkrut ke klub Anda tanpa perlu persetujuan klub asal.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <AlertDescription className="text-sm">
              Untuk mendapatkan pemain ini, Anda harus melakukan <strong>proses transfer</strong> dari klub yang bersangkutan.
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Batal
          </Button>
          {isFreeAgent && onRecruitFreeAgent ? (
            <Button 
              type="button"
              onClick={onRecruitFreeAgent}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              <UserCheck className="h-4 w-4" />
              Rekrut Free Agent
            </Button>
          ) : (
            <Button 
              type="button"
              onClick={onTransfer}
              className="gap-2"
            >
              Ajukan Transfer
              <span aria-hidden="true">→</span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
