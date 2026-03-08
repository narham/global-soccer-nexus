import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Trophy, ArrowLeft, Eye, EyeOff } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [intendedRole, setIntendedRole] = useState("");
  const [activeTab, setActiveTab] = useState("login");
  
  // Password reset states
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [resetPasswordMode, setResetPasswordMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Conditional fields for different roles
  const [licenseType, setLicenseType] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [eventExperience, setEventExperience] = useState("");
  const [selectedClubId, setSelectedClubId] = useState("");
  const [clubs, setClubs] = useState<any[]>([]);

  useEffect(() => {
    // Listen for auth changes FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setResetPasswordMode(true);
        return;
      }
      if (session && !resetPasswordMode) {
        navigate("/");
      }
    });

    // Then check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !resetPasswordMode) {
        // Check if this is a password recovery
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        if (hashParams.get("type") === "recovery") {
          setResetPasswordMode(true);
        } else {
          navigate("/");
        }
      }
    });

    fetchClubs();

    return () => subscription.unsubscribe();
  }, [navigate, resetPasswordMode]);

  const fetchClubs = async () => {
    const { data } = await supabase
      .from("clubs")
      .select("id, name")
      .eq("license_status", "approved")
      .order("name");
    setClubs(data || []);
  };

  // Validation helpers
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone: string) => /^[0-9+\-\s()]{8,15}$/.test(phone);
  const sanitizeInput = (input: string) => input.trim().replace(/[<>]/g, "");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      toast({ variant: "destructive", title: "Email tidak valid" });
      return;
    }
    if (password.length < 6) {
      toast({ variant: "destructive", title: "Kata sandi minimal 6 karakter" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      toast({
        title: "Berhasil masuk!",
        description: "Selamat datang kembali di sistem manajemen sepakbola.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal masuk",
        description: error.message === "Invalid login credentials" 
          ? "Email atau kata sandi salah" 
          : error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      toast({ variant: "destructive", title: "Masukkan email yang valid" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
      toast({
        title: "Email terkirim",
        description: "Cek inbox email Anda untuk link reset password.",
      });
      setForgotPasswordMode(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Gagal mengirim email", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({ variant: "destructive", title: "Kata sandi minimal 6 karakter" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Kata sandi tidak cocok" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "Kata sandi berhasil diubah", description: "Silakan login dengan kata sandi baru." });
      setResetPasswordMode(false);
      await supabase.auth.signOut();
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Gagal mengubah kata sandi", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanName = sanitizeInput(fullName);
    const cleanPhone = sanitizeInput(phone);
    
    if (cleanName.length < 2 || cleanName.length > 100) {
      toast({ variant: "destructive", title: "Nama harus 2-100 karakter" });
      return;
    }
    if (!validateEmail(email)) {
      toast({ variant: "destructive", title: "Email tidak valid" });
      return;
    }
    if (!validatePhone(cleanPhone)) {
      toast({ variant: "destructive", title: "Nomor telepon tidak valid" });
      return;
    }
    if (password.length < 6) {
      toast({ variant: "destructive", title: "Kata sandi minimal 6 karakter" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { full_name: cleanName },
        },
      });

      if (error) throw error;

      if (data.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            id: data.user.id,
            email: email.trim(),
            full_name: cleanName,
            phone: cleanPhone,
          }, { onConflict: "id" });

        if (profileError) {
          console.error("Error upserting profile:", profileError);
        }

        if (intendedRole) {
          let reason = `Pendaftaran awal sebagai ${intendedRole}. `;
          
          if (intendedRole === "wasit") {
            reason += `Tipe Lisensi: ${sanitizeInput(licenseType)}, Nomor Lisensi: ${sanitizeInput(licenseNumber)}, Pengalaman: ${sanitizeInput(experienceYears)} tahun`;
            if (specialization) reason += `, Spesialisasi: ${sanitizeInput(specialization)}`;
          } else if (intendedRole === "panitia") {
            reason += `Organisasi: ${sanitizeInput(organizationName)}, Pengalaman Event: ${sanitizeInput(eventExperience)}`;
          } else if (intendedRole === "admin_klub") {
            reason += `Klub yang dipilih: ID ${selectedClubId}`;
          }

          const { error: roleRequestError } = await supabase
            .from("role_requests")
            .insert({
              user_id: data.user.id,
              requested_role: intendedRole as any,
              reason: reason.substring(0, 500),
              requested_club_id: intendedRole === "admin_klub" && selectedClubId ? selectedClubId : null,
              status: "pending",
            });

          if (roleRequestError) {
            console.error("Error creating role request:", roleRequestError);
          }
        }
      }

      toast({
        title: "Akun berhasil dibuat!",
        description: "Cek email Anda untuk verifikasi akun. Permintaan role akan diproses oleh admin.",
      });

      // Clear form
      setFullName(""); setPhone(""); setEmail(""); setPassword("");
      setIntendedRole(""); setLicenseType(""); setLicenseNumber("");
      setExperienceYears(""); setSpecialization(""); setOrganizationName("");
      setEventExperience(""); setSelectedClubId("");
      setActiveTab("login");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal mendaftar",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset Password Mode
  if (resetPasswordMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-primary-glow p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-elegant">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-glow">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl">Reset Kata Sandi</CardTitle>
              <CardDescription>Masukkan kata sandi baru Anda</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Kata Sandi Baru</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Minimal 6 karakter"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Konfirmasi Kata Sandi</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Ulangi kata sandi"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Memproses..." : "Ubah Kata Sandi"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-primary-glow p-4">
      <div className="w-full max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/public")}
          className="mb-4 text-white hover:bg-white/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Portal Public
        </Button>

        <Card className="shadow-elegant">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-glow">
                <Trophy className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold">
              Sistem Manajemen Sepakbola
            </CardTitle>
            <CardDescription>
              Platform profesional untuk Organisasi, klub, dan pemain
            </CardDescription>
          </CardHeader>
          <CardContent>
            {forgotPasswordMode ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-center">Lupa Kata Sandi?</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Masukkan email Anda dan kami akan mengirimkan link untuk reset password.
                </p>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-forgot">Email</Label>
                    <Input
                      id="email-forgot"
                      type="email"
                      placeholder="nama@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Mengirim..." : "Kirim Link Reset"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setForgotPasswordMode(false)}
                  >
                    Kembali ke Login
                  </Button>
                </form>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Masuk</TabsTrigger>
                  <TabsTrigger value="signup">Daftar</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="email-login">Email</Label>
                      <Input
                        id="email-login"
                        type="email"
                        placeholder="nama@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password-login">Kata Sandi</Label>
                      <div className="relative">
                        <Input
                          id="password-login"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Memproses..." : "Masuk"}
                    </Button>
                    <Button
                      type="button"
                      variant="link"
                      className="w-full text-sm"
                      onClick={() => setForgotPasswordMode(true)}
                    >
                      Lupa kata sandi?
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullname-signup">
                          Nama Lengkap <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="fullname-signup"
                          type="text"
                          placeholder="Nama lengkap Anda"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                          maxLength={100}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone-signup">
                          Nomor Telepon <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="phone-signup"
                          type="tel"
                          placeholder="08123456789"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          maxLength={15}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email-signup">
                        Email <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="email-signup"
                        type="email"
                        placeholder="nama@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        maxLength={255}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password-signup">
                        Kata Sandi <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="password-signup"
                          type={showPassword ? "text" : "password"}
                          placeholder="Minimal 6 karakter"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={6}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="intended-role">
                        Role yang Diinginkan (Opsional)
                      </Label>
                      <Select value={intendedRole} onValueChange={setIntendedRole}>
                        <SelectTrigger id="intended-role">
                          <SelectValue placeholder="Pilih role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="wasit">Wasit</SelectItem>
                          <SelectItem value="panitia">Panitia</SelectItem>
                          <SelectItem value="admin_klub">Admin Klub</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Permintaan role akan ditinjau oleh admin
                      </p>
                    </div>

                    {/* Conditional fields for Wasit */}
                    {intendedRole === "wasit" && (
                      <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                        <h4 className="font-medium text-sm">Informasi Wasit</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="license-type">Tipe Lisensi</Label>
                            <Select value={licenseType} onValueChange={setLicenseType}>
                              <SelectTrigger id="license-type">
                                <SelectValue placeholder="Pilih tipe" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="FIFA">FIFA</SelectItem>
                                <SelectItem value="AFC">AFC</SelectItem>
                                <SelectItem value="Nasional">Nasional</SelectItem>
                                <SelectItem value="Provinsi">Provinsi</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="license-number">Nomor Lisensi</Label>
                            <Input
                              id="license-number"
                              value={licenseNumber}
                              onChange={(e) => setLicenseNumber(e.target.value)}
                              placeholder="Nomor lisensi"
                              maxLength={50}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="experience-years">Tahun Pengalaman</Label>
                            <Input
                              id="experience-years"
                              type="number"
                              value={experienceYears}
                              onChange={(e) => setExperienceYears(e.target.value)}
                              placeholder="0"
                              min={0}
                              max={50}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="specialization">Spesialisasi (Opsional)</Label>
                            <Input
                              id="specialization"
                              value={specialization}
                              onChange={(e) => setSpecialization(e.target.value)}
                              placeholder="VAR, Asisten, dll"
                              maxLength={100}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Conditional fields for Panitia */}
                    {intendedRole === "panitia" && (
                      <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                        <h4 className="font-medium text-sm">Informasi Panitia</h4>
                        <div className="space-y-2">
                          <Label htmlFor="organization">Nama Organisasi</Label>
                          <Input
                            id="organization"
                            value={organizationName}
                            onChange={(e) => setOrganizationName(e.target.value)}
                            placeholder="Nama organisasi Anda"
                            maxLength={100}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="event-exp">Pengalaman Event</Label>
                          <Input
                            id="event-exp"
                            value={eventExperience}
                            onChange={(e) => setEventExperience(e.target.value)}
                            placeholder="Deskripsi pengalaman event"
                            maxLength={200}
                          />
                        </div>
                      </div>
                    )}

                    {/* Conditional fields for Admin Klub */}
                    {intendedRole === "admin_klub" && (
                      <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                        <h4 className="font-medium text-sm">Pilih Klub</h4>
                        <div className="space-y-2">
                          <Label htmlFor="club-select">Klub</Label>
                          <Select value={selectedClubId} onValueChange={setSelectedClubId}>
                            <SelectTrigger id="club-select">
                              <SelectValue placeholder="Pilih klub" />
                            </SelectTrigger>
                            <SelectContent>
                              {clubs.map((club) => (
                                <SelectItem key={club.id} value={club.id}>
                                  {club.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Memproses..." : "Daftar"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
