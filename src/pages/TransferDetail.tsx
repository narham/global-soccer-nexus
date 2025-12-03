import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, X, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { TransferDocumentsTab } from "@/components/transfers/TransferDocumentsTab";
import { TransferApprovalTimeline } from "@/components/transfers/TransferApprovalTimeline";

const TransferDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdminFederasi, isAdminKlub, clubId } = useUserRole();
  const [transfer, setTransfer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [approvalComment, setApprovalComment] = useState("");

  useEffect(() => {
    if (id) {
      fetchTransfer();
    }
  }, [id]);

  const fetchTransfer = async () => {
    try {
      const { data, error } = await supabase
        .from("player_transfers")
        .select(`
          *,
          player:player_id (id, full_name, position, photo_url, nationality),
          from_club:from_club_id (id, name, logo_url),
          to_club:to_club_id (id, name, logo_url),
          transfer_window:transfer_window_id (name, window_type)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setTransfer(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal memuat data transfer",
        description: error.message,
      });
      navigate("/transfers");
    } finally {
      setLoading(false);
    }
  };

  // Handler for origin club approval
  const handleFromClubApprove = async () => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("player_transfers")
        .update({
          status: "pending_club_to",
          from_club_approved_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
      toast({ 
        title: "Persetujuan klub asal berhasil",
        description: "Transfer sekarang menunggu persetujuan klub tujuan"
      });
      fetchTransfer();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal menyetujui transfer",
        description: error.message,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handler for destination club approval
  const handleToClubApprove = async () => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("player_transfers")
        .update({
          status: "pending_federation",
          to_club_approved_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
      toast({ 
        title: "Persetujuan klub tujuan berhasil",
        description: "Transfer sekarang menunggu persetujuan federasi"
      });
      fetchTransfer();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal menyetujui transfer",
        description: error.message,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handler for federation approval
  const handleFederationApprove = async () => {
    setActionLoading(true);
    try {
      const newStatus = transfer.requires_itc ? "awaiting_itc" : "approved";
      
      const { error } = await supabase
        .from("player_transfers")
        .update({
          status: newStatus,
          approved_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      // If approved and not requiring ITC, update player's club
      if (newStatus === "approved") {
        await supabase
          .from("players")
          .update({ current_club_id: transfer.to_club_id })
          .eq("id", transfer.player_id);
      }

      toast({ 
        title: "Transfer disetujui federasi",
        description: transfer.requires_itc ? "Menunggu ITC dari FIFA" : "Transfer selesai diproses"
      });
      fetchTransfer();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal menyetujui transfer",
        description: error.message,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!approvalComment.trim()) {
      toast({
        variant: "destructive",
        title: "Alasan penolakan wajib diisi",
      });
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("player_transfers")
        .update({
          status: "rejected",
          rejected_reason: approvalComment,
        })
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Transfer ditolak" });
      fetchTransfer();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal menolak transfer",
        description: error.message,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveITC = async () => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("player_transfers")
        .update({
          status: "approved",
          itc_status: "approved",
          itc_approved_date: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      // Update player's club
      await supabase
        .from("players")
        .update({ current_club_id: transfer.to_club_id })
        .eq("id", transfer.player_id);

      toast({ title: "ITC disetujui", description: "Transfer selesai diproses" });
      fetchTransfer();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal menyetujui ITC",
        description: error.message,
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!transfer) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "default";
      case "pending": return "secondary";
      case "pending_club_from": return "secondary";
      case "pending_club_to": return "secondary";
      case "pending_federation": return "outline";
      case "awaiting_itc": return "outline";
      case "rejected": return "destructive";
      default: return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved": return "Disetujui";
      case "pending": return "Menunggu Persetujuan";
      case "pending_club_from": return "Menunggu Klub Asal";
      case "pending_club_to": return "Menunggu Klub Tujuan";
      case "pending_federation": return "Menunggu Federasi";
      case "awaiting_itc": return "Menunggu ITC";
      case "rejected": return "Ditolak";
      default: return status;
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "Bebas Transfer";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Determine approval permissions
  const canFromClubApprove = transfer.status === "pending_club_from" && 
    isAdminKlub && clubId === transfer.from_club_id;
  const canToClubApprove = transfer.status === "pending_club_to" && 
    isAdminKlub && clubId === transfer.to_club_id;
  const canFederationApprove = transfer.status === "pending_federation" && isAdminFederasi;
  const canApproveITC = transfer.status === "awaiting_itc" && transfer.requires_itc && isAdminFederasi;
  const canUploadDocs = isAdminKlub && (clubId === transfer.from_club_id || clubId === transfer.to_club_id);
  const canVerifyDocs = isAdminFederasi;
  const requiresFromClub = !!transfer.from_club_id;

  // Determine current approval context
  const getCurrentApprovalContext = () => {
    if (canFromClubApprove) {
      return {
        title: "Persetujuan Klub Asal",
        description: "Sebagai admin klub asal, Anda dapat menyetujui atau menolak transfer pemain ini.",
        onApprove: handleFromClubApprove,
        approveLabel: "Setujui Transfer"
      };
    }
    if (canToClubApprove) {
      return {
        title: "Persetujuan Klub Tujuan", 
        description: "Sebagai admin klub tujuan, Anda dapat menyetujui atau menolak transfer pemain ini.",
        onApprove: handleToClubApprove,
        approveLabel: "Setujui Transfer"
      };
    }
    if (canFederationApprove) {
      return {
        title: "Persetujuan Federasi",
        description: "Sebagai admin federasi, Anda dapat menyetujui atau menolak transfer ini.",
        onApprove: handleFederationApprove,
        approveLabel: "Setujui Transfer"
      };
    }
    return null;
  };

  const approvalContext = getCurrentApprovalContext();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/transfers")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
        <Badge variant={getStatusColor(transfer.status)} className="text-sm px-3 py-1">
          {getStatusLabel(transfer.status)}
        </Badge>
      </div>

      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            <Avatar className="h-32 w-32">
              <AvatarImage src={transfer.player?.photo_url} />
              <AvatarFallback className="text-2xl">
                {transfer.player?.full_name?.split(" ").map((n: string) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{transfer.player?.full_name}</h1>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{transfer.player?.position}</Badge>
                <Badge variant="outline">{transfer.player?.nationality}</Badge>
                {transfer.requires_itc && (
                  <Badge>Transfer Internasional</Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Dari Klub</p>
                <p className="font-semibold">{transfer.from_club?.name || "Free Agent"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ke Klub</p>
                <p className="font-semibold">{transfer.to_club?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Jenis Transfer</p>
                <p className="font-semibold capitalize">{transfer.transfer_type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Biaya Transfer</p>
                <p className="font-semibold">{formatCurrency(transfer.transfer_fee)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Transfer Window</p>
                <p className="font-semibold">{transfer.transfer_window?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tanggal Pengajuan</p>
                <p className="font-semibold">
                  {format(new Date(transfer.created_at), "d MMM yyyy", { locale: idLocale })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs untuk berbagai informasi */}
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timeline">Timeline Approval</TabsTrigger>
          <TabsTrigger value="details">Detail Kontrak</TabsTrigger>
          <TabsTrigger value="documents">Dokumen</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-6">
          <TransferApprovalTimeline
            status={transfer.status}
            fromClubApprovedAt={transfer.from_club_approved_at}
            toClubApprovedAt={transfer.to_club_approved_at}
            approvedAt={transfer.approved_at}
            rejectedReason={transfer.rejected_reason}
            requiresFromClub={requiresFromClub}
          />
        </TabsContent>

        <TabsContent value="details" className="mt-6">
          <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detail Kontrak
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kontrak Mulai:</span>
              <span className="font-medium">
                {format(new Date(transfer.contract_start), "d MMM yyyy", { locale: idLocale })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kontrak Berakhir:</span>
              <span className="font-medium">
                {format(new Date(transfer.contract_end), "d MMM yyyy", { locale: idLocale })}
              </span>
            </div>
            {transfer.loan_end_date && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Akhir Pinjaman:</span>
                <span className="font-medium">
                  {format(new Date(transfer.loan_end_date), "d MMM yyyy", { locale: idLocale })}
                </span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Durasi Kontrak:</span>
              <span className="font-medium">
                {Math.ceil(
                  (new Date(transfer.contract_end).getTime() - new Date(transfer.contract_start).getTime()) /
                  (1000 * 60 * 60 * 24 * 365)
                )} tahun
              </span>
            </div>
          </div>
        </Card>

        {transfer.requires_itc && (
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Status ITC (FIFA TMS)</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status ITC:</span>
                <Badge variant={transfer.itc_status === "approved" ? "default" : "secondary"}>
                  {transfer.itc_status === "approved" ? "Disetujui" : 
                   transfer.itc_status === "pending" ? "Pending" : 
                   "Diminta"}
                </Badge>
              </div>
              {transfer.itc_request_date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tanggal Request:</span>
                  <span className="font-medium">
                    {format(new Date(transfer.itc_request_date), "d MMM yyyy HH:mm", { locale: idLocale })}
                  </span>
                </div>
              )}
              {transfer.itc_approved_date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tanggal Approval:</span>
                  <span className="font-medium">
                    {format(new Date(transfer.itc_approved_date), "d MMM yyyy HH:mm", { locale: idLocale })}
                  </span>
                </div>
              )}
              <Alert>
                <AlertDescription className="text-sm">
                  Transfer internasional memerlukan International Transfer Certificate (ITC) dari FIFA TMS 
                  sesuai FIFA Regulations on the Status and Transfer of Players.
                </AlertDescription>
              </Alert>
            </div>
          </Card>
        )}

        {!transfer.requires_itc && transfer.notes && (
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Catatan</h3>
            <p className="text-muted-foreground">{transfer.notes}</p>
          </Card>
        )}
          </div>
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <TransferDocumentsTab
            transferId={id!}
            canUpload={canUploadDocs}
            canVerify={canVerifyDocs}
          />
        </TabsContent>
      </Tabs>

      {transfer.rejected_reason && (
        <Alert variant="destructive">
          <AlertDescription>
            <strong>Alasan Penolakan:</strong> {transfer.rejected_reason}
          </AlertDescription>
        </Alert>
      )}

      {/* Club Approval Section */}
      {approvalContext && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">{approvalContext.title}</h3>
          <div className="space-y-4">
            <Alert>
              <AlertDescription>{approvalContext.description}</AlertDescription>
            </Alert>
            
            <Textarea
              placeholder="Komentar atau alasan penolakan..."
              value={approvalComment}
              onChange={(e) => setApprovalComment(e.target.value)}
              rows={3}
            />

            <div className="flex gap-2">
              <Button
                onClick={approvalContext.onApprove}
                disabled={actionLoading}
                className="flex-1"
              >
                <Check className="mr-2 h-4 w-4" />
                {approvalContext.approveLabel}
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={actionLoading}
                className="flex-1"
              >
                <X className="mr-2 h-4 w-4" />
                Tolak Transfer
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ITC Approval Section */}
      {canApproveITC && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Approval ITC (FIFA)</h3>
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                ITC approval diperlukan untuk menyelesaikan transfer internasional ini.
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleApproveITC}
              disabled={actionLoading}
              className="w-full"
            >
              <Check className="mr-2 h-4 w-4" />
              Setujui ITC
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default TransferDetail;