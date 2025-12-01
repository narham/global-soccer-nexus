import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Trophy, ArrowLeft } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [intendedRole, setIntendedRole] = useState("");
  
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
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });

    // Fetch clubs for Admin Klub option
    fetchClubs();

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchClubs = async () => {
    const { data } = await supabase
      .from("clubs")
      .select("id, name")
      .eq("license_status", "approved")
      .order("name");
    setClubs(data || []);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Berhasil masuk!",
        description: "Selamat datang kembali di sistem manajemen sepakbola.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal masuk",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      // Update profile with phone number after signup
      if (data.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            full_name: fullName,
            phone: phone,
          })
          .eq("id", data.user.id);

        if (profileError) {
          console.error("Error updating profile:", profileError);
        }

        // Create role request if a role was selected
        if (intendedRole) {
          let reason = `Pendaftaran awal sebagai ${intendedRole}. `;
          
          if (intendedRole === "wasit") {
            reason += `Tipe Lisensi: ${licenseType}, Nomor Lisensi: ${licenseNumber}, Pengalaman: ${experienceYears} tahun`;
            if (specialization) reason += `, Spesialisasi: ${specialization}`;
          } else if (intendedRole === "panitia") {
            reason += `Organisasi: ${organizationName}, Pengalaman Event: ${eventExperience}`;
          } else if (intendedRole === "admin_klub") {
            reason += `Klub yang dipilih: ID ${selectedClubId}`;
          }

          const { error: roleRequestError } = await supabase
            .from("role_requests")
            .insert({
              user_id: data.user.id,
              requested_role: intendedRole as any,
              reason: reason,
              requested_club_id: intendedRole === "admin_klub" ? selectedClubId : null,
              status: "pending",
            });

          if (roleRequestError) {
            console.error("Error creating role request:", roleRequestError);
          }
        }
      }

      toast({
        title: "Akun berhasil dibuat!",
        description: "Anda dapat masuk sekarang. Permintaan role Anda akan diproses oleh admin.",
      });

      // Clear form
      setFullName("");
      setPhone("");
      setEmail("");
      setPassword("");
      setIntendedRole("");
      setLicenseType("");
      setLicenseNumber("");
      setExperienceYears("");
      setSpecialization("");
      setOrganizationName("");
      setEventExperience("");
      setSelectedClubId("");
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
            <Tabs defaultValue="login" className="w-full">
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
                    <Input
                      id="password-login"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Memproses..." : "Masuk"}
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
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password-signup">
                      Kata Sandi <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="password-signup"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
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
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="experience-years">
                            Tahun Pengalaman
                          </Label>
                          <Input
                            id="experience-years"
                            type="number"
                            value={experienceYears}
                            onChange={(e) => setExperienceYears(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="specialization">
                            Spesialisasi (Opsional)
                          </Label>
                          <Input
                            id="specialization"
                            value={specialization}
                            onChange={(e) => setSpecialization(e.target.value)}
                            placeholder="VAR, Asisten, dll"
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
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="event-exp">Pengalaman Event</Label>
                        <Input
                          id="event-exp"
                          value={eventExperience}
                          onChange={(e) => setEventExperience(e.target.value)}
                          placeholder="Deskripsi pengalaman event"
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
                        <Select
                          value={selectedClubId}
                          onValueChange={setSelectedClubId}
                        >
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
