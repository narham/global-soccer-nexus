import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type RoleType = "admin_klub" | "wasit" | "panitia";

export function RoleRequestForm() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<RoleType | "">("");
  const [selectedClubId, setSelectedClubId] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { data: clubs } = useQuery({
    queryKey: ["clubs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clubs")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: existingRequest } = useQuery({
    queryKey: ["my-role-request"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("role_requests")
        .select(`
          *,
          clubs (name)
        `)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const { data: userProfile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, email, phone, created_at")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const handleEdit = () => {
    if (!existingRequest) return;
    
    setIsEditing(true);
    setSelectedRole(existingRequest.requested_role as RoleType);
    setSelectedClubId(existingRequest.requested_club_id || "");
    
    // Extract license number if wasit
    if (existingRequest.requested_role === "wasit" && existingRequest.reason) {
      const match = existingRequest.reason.match(/Nomor Lisensi: (.+?)(\n|$)/);
      if (match) {
        setLicenseNumber(match[1]);
        setReason(existingRequest.reason.replace(/Nomor Lisensi: .+?\n/, ""));
      } else {
        setReason(existingRequest.reason);
      }
    } else {
      setReason(existingRequest.reason || "");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSelectedRole("");
    setSelectedClubId("");
    setLicenseNumber("");
    setReason("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRole) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: "Mohon pilih role yang diinginkan",
      });
      return;
    }

    if (selectedRole === "admin_klub" && !selectedClubId) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: "Mohon pilih klub",
      });
      return;
    }

    if (selectedRole === "wasit" && !licenseNumber.trim()) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: "Mohon isi nomor lisensi wasit",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const requestData: any = {
        requested_role: selectedRole,
        reason: reason.trim() || null,
        status: "pending",
        reviewed_at: null,
        reviewer_id: null,
        reviewer_notes: null,
      };

      if (selectedRole === "admin_klub") {
        requestData.requested_club_id = selectedClubId;
      } else {
        requestData.requested_club_id = null;
      }

      if (selectedRole === "wasit") {
        requestData.reason = `Nomor Lisensi: ${licenseNumber}\n${reason}`;
      }

      if (isEditing && existingRequest) {
        // Update existing request
        const { error } = await supabase
          .from("role_requests")
          .update(requestData)
          .eq("id", existingRequest.id);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Permintaan role telah diperbarui dan diajukan kembali.",
        });
      } else {
        // Insert new request
        requestData.user_id = user.id;
        const { error } = await supabase
          .from("role_requests")
          .insert(requestData);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Permintaan role telah diajukan. Menunggu persetujuan admin federasi.",
        });
      }

      // Refresh to show status
      window.location.reload();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin_klub":
        return "Admin Klub";
      case "wasit":
        return "Wasit";
      case "panitia":
        return "Panitia";
      default:
        return role;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Menunggu Persetujuan</Badge>;
      case "approved":
        return <Badge variant="default">Disetujui</Badge>;
      case "rejected":
        return <Badge variant="destructive">Ditolak</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // If user already has a request, show status or edit form
  if (existingRequest && !isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Status Permintaan Role</CardTitle>
          <CardDescription>
            Permintaan role Anda sedang diproses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Informasi Pemohon */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
            <h4 className="font-semibold text-sm">Informasi Pemohon</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-muted-foreground text-xs">Nama Lengkap</Label>
                <div className="text-sm font-medium">{userProfile?.full_name || "-"}</div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Email</Label>
                <div className="text-sm">{userProfile?.email || "-"}</div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Nomor Telepon</Label>
                <div className="text-sm">{userProfile?.phone || "-"}</div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Tanggal Registrasi</Label>
                <div className="text-sm">
                  {userProfile?.created_at 
                    ? new Date(userProfile.created_at).toLocaleDateString('id-ID')
                    : "-"}
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-muted-foreground">Role yang Diminta</Label>
            <div className="mt-1">
              <Badge variant="outline">{getRoleLabel(existingRequest.requested_role)}</Badge>
            </div>
          </div>

          {existingRequest.clubs && (
            <div>
              <Label className="text-muted-foreground">Klub</Label>
              <div className="mt-1 font-medium">{existingRequest.clubs.name}</div>
            </div>
          )}

          <div>
            <Label className="text-muted-foreground">Tanggal Pengajuan</Label>
            <div className="mt-1 text-sm">
              {new Date(existingRequest.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>

          {existingRequest.reason && (
            <div>
              <Label className="text-muted-foreground">Alasan</Label>
              <div className="mt-1 p-3 bg-muted rounded-md text-sm">
                {existingRequest.reason}
              </div>
            </div>
          )}

          <div>
            <Label className="text-muted-foreground">Status</Label>
            <div className="mt-1">{getStatusBadge(existingRequest.status || "pending")}</div>
          </div>

          {existingRequest.reviewed_at && (
            <div>
              <Label className="text-muted-foreground">Tanggal Review</Label>
              <div className="mt-1 text-sm">
                {new Date(existingRequest.reviewed_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          )}

          {existingRequest.reviewer_notes && (
            <div>
              <Label className="text-muted-foreground">Catatan Reviewer</Label>
              <div className="mt-1 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm">
                {existingRequest.reviewer_notes}
              </div>
            </div>
          )}

          {existingRequest.status === "rejected" && (
            <Button onClick={handleEdit} className="w-full" variant="default">
              Edit & Ajukan Ulang
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Permintaan Role" : "Permintaan Role"}</CardTitle>
        <CardDescription>
          {isEditing 
            ? "Perbaiki data dan ajukan kembali permintaan Anda"
            : "Pilih role yang sesuai dengan posisi Anda dalam sistem"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role">Role <span className="text-destructive">*</span></Label>
            <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as RoleType)}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Pilih role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin_klub">Admin Klub</SelectItem>
                <SelectItem value="wasit">Wasit</SelectItem>
                <SelectItem value="panitia">Panitia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedRole === "admin_klub" && (
            <div className="space-y-2">
              <Label htmlFor="club">Klub <span className="text-destructive">*</span></Label>
              <Select value={selectedClubId} onValueChange={setSelectedClubId}>
                <SelectTrigger id="club">
                  <SelectValue placeholder="Pilih klub" />
                </SelectTrigger>
                <SelectContent>
                  {clubs?.map((club) => (
                    <SelectItem key={club.id} value={club.id}>
                      {club.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedRole === "wasit" && (
            <div className="space-y-2">
              <Label htmlFor="license">Nomor Lisensi <span className="text-destructive">*</span></Label>
              <Input
                id="license"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="Masukkan nomor lisensi wasit"
              />
            </div>
          )}

          {selectedRole && (
            <div className="space-y-2">
              <Label htmlFor="reason">Alasan / Keterangan Tambahan</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Jelaskan alasan Anda mengajukan role ini..."
                rows={4}
              />
            </div>
          )}

          <div className="flex gap-2">
            {isEditing && (
              <Button type="button" variant="outline" onClick={handleCancelEdit} className="flex-1">
                Batal
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Mengirim..." : isEditing ? "Perbarui & Ajukan Ulang" : "Ajukan Permintaan"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
