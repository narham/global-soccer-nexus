import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EPlayerCard } from '@/components/players/EPlayerCard';
import { PlayerQRCode } from '@/components/players/PlayerQRCode';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getNationalityFlag } from '@/lib/nationality-flags';
import {
  ArrowLeft, Calendar, MapPin, Ruler, Weight, FootprintsIcon,
  Trophy, Target, Clock, CreditCard, Shield, TrendingUp,
  AlertTriangle, Download, FileText, User,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { generatePlayerIDCard, PlayerCardData } from '@/lib/player-card-generator';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';

const positionLabels: Record<string, string> = {
  GK: 'Penjaga Gawang',
  DF: 'Bek',
  MF: 'Gelandang',
  FW: 'Penyerang',
};

const statusMap: Record<string, { label: string; color: string }> = {
  approved: { label: 'Terverifikasi', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  pending: { label: 'Menunggu', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  rejected: { label: 'Ditolak', color: 'bg-red-500/20 text-red-300 border-red-500/40' },
};

const injuryStatusMap: Record<string, { label: string; icon: React.ReactNode }> = {
  fit: { label: 'Bugar', icon: <TrendingUp className="h-4 w-4 text-emerald-400" /> },
  injured: { label: 'Cedera', icon: <AlertTriangle className="h-4 w-4 text-red-400" /> },
  recovering: { label: 'Pemulihan', icon: <Clock className="h-4 w-4 text-amber-400" /> },
};

const EPlayerCardDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const cardRef = React.useRef<HTMLDivElement>(null);

  const { data: player, isLoading } = useQuery({
    queryKey: ['e-player-card-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('players')
        .select('*, clubs(name, logo_url, city)')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: statistics = [] } = useQuery({
    queryKey: ['player-stats-ecard', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('player_statistics')
        .select('*')
        .eq('player_id', id!)
        .order('season', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const { data: history = [] } = useQuery({
    queryKey: ['player-history-ecard', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('player_history')
        .select('*, clubs(name, logo_url)')
        .eq('player_id', id!)
        .order('from_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const calculateAge = (dob: string) => {
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
  };

  const totalStats = statistics.reduce(
    (acc, s) => ({
      matches: acc.matches + (s.matches_played || 0),
      goals: acc.goals + (s.goals || 0),
      assists: acc.assists + (s.assists || 0),
      yellows: acc.yellows + (s.yellow_cards || 0),
      reds: acc.reds + (s.red_cards || 0),
      minutes: acc.minutes + (s.minutes_played || 0),
    }),
    { matches: 0, goals: 0, assists: 0, yellows: 0, reds: 0, minutes: 0 }
  );

  const handleDownloadPDF = async () => {
    if (!player) return;
    try {
      const cardData: PlayerCardData = {
        fullName: player.full_name,
        dateOfBirth: format(new Date(player.date_of_birth), 'dd MMMM yyyy', { locale: idLocale }),
        nationality: player.nationality,
        position: player.position,
        clubName: player.clubs?.name || 'Free Agent',
        clubLogo: player.clubs?.logo_url || undefined,
        photoUrl: player.photo_url || undefined,
        shirtNumber: player.shirt_number || undefined,
        cardNumber: `PID-${player.id.substring(0, 8).toUpperCase()}`,
        validUntil: player.contract_end
          ? format(new Date(player.contract_end), 'dd MMMM yyyy', { locale: idLocale })
          : 'Tidak Terbatas',
      };
      await generatePlayerIDCard(cardData);
      toast.success('Kartu ID PDF berhasil didownload');
    } catch (e: any) {
      toast.error('Gagal download PDF: ' + e.message);
    }
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0f172a',
        scale: 3,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `ECard_${player?.full_name?.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Kartu berhasil didownload sebagai gambar');
    } catch {
      toast.error('Gagal download gambar');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 -m-6 p-6">
        <Skeleton className="h-10 w-40 bg-white/5 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-[450px] rounded-2xl bg-white/5" />
          <Skeleton className="h-[450px] rounded-2xl bg-white/5 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 -m-6 p-6 flex items-center justify-center">
        <div className="text-center text-white/40">
          <User className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg">Pemain tidak ditemukan</p>
          <Button variant="ghost" className="mt-4 text-white/60" onClick={() => navigate('/e-player-cards')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
          </Button>
        </div>
      </div>
    );
  }

  const flag = getNationalityFlag(player.nationality);
  const status = statusMap[player.registration_status] || statusMap.pending;
  const injury = injuryStatusMap[player.injury_status || 'fit'] || injuryStatusMap.fit;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 -m-6 p-6 relative overflow-hidden">
      {/* Ambient bg */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative flex items-center gap-3 mb-8">
        <Button
          variant="ghost"
          size="icon"
          className="text-white/60 hover:text-white hover:bg-white/10"
          onClick={() => navigate('/e-player-cards')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20">
            <CreditCard className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Detail E-Player Card</h1>
            <p className="text-white/40 text-sm">{player.full_name}</p>
          </div>
        </div>
      </div>

      <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Card Preview */}
        <div className="flex flex-col items-center gap-6">
          <div ref={cardRef}>
            <EPlayerCard player={player} />
          </div>

          {/* Download buttons */}
          <div className="flex gap-3">
            <Button
              size="sm"
              variant="outline"
              className="bg-white/5 border-white/15 text-white/70 hover:bg-white/10 hover:text-white"
              onClick={handleDownloadImage}
            >
              <Download className="mr-2 h-4 w-4" /> Download PNG
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-white/5 border-white/15 text-white/70 hover:bg-white/10 hover:text-white"
              onClick={handleDownloadPDF}
            >
              <FileText className="mr-2 h-4 w-4" /> Download PDF
            </Button>
          </div>

          {/* QR Code enlarged */}
          <div className="bg-white/[0.06] rounded-2xl border border-white/10 p-6 text-center space-y-3 w-full max-w-[300px]">
            <p className="text-white/50 text-xs font-medium uppercase tracking-widest">Scan QR Code</p>
            <div className="flex justify-center">
              <PlayerQRCode playerId={player.id} size={120} />
            </div>
            <p className="text-white/30 text-[10px] font-mono">PID-{player.id.substring(0, 8).toUpperCase()}</p>
          </div>
        </div>

        {/* Right: Player Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bio Card */}
          <div className="bg-white/[0.06] rounded-2xl border border-white/10 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold text-lg">Biodata Pemain</h2>
              <Badge variant="outline" className={status.color}>
                {status.label}
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              <InfoItem icon={<User className="h-4 w-4" />} label="Nama Lengkap" value={player.full_name} />
              <InfoItem icon={<Calendar className="h-4 w-4" />} label="Tanggal Lahir" value={`${format(new Date(player.date_of_birth), 'dd MMM yyyy', { locale: idLocale })} (${calculateAge(player.date_of_birth)} thn)`} />
              <InfoItem icon={<MapPin className="h-4 w-4" />} label="Tempat Lahir" value={player.place_of_birth || '-'} />
              <InfoItem icon={<span className="text-base">{flag}</span>} label="Kewarganegaraan" value={player.nationality} />
              <InfoItem icon={<Shield className="h-4 w-4" />} label="Posisi" value={positionLabels[player.position] || player.position} />
              {player.shirt_number && (
                <InfoItem icon={<span className="text-sm font-bold">#</span>} label="Nomor Punggung" value={String(player.shirt_number)} />
              )}
              {player.height_cm && (
                <InfoItem icon={<Ruler className="h-4 w-4" />} label="Tinggi Badan" value={`${player.height_cm} cm`} />
              )}
              {player.weight_kg && (
                <InfoItem icon={<Weight className="h-4 w-4" />} label="Berat Badan" value={`${player.weight_kg} kg`} />
              )}
              {player.preferred_foot && (
                <InfoItem icon={<FootprintsIcon className="h-4 w-4" />} label="Kaki Dominan" value={player.preferred_foot} />
              )}
            </div>

            {/* Club & Contract */}
            <div className="border-t border-white/10 pt-4 grid grid-cols-2 sm:grid-cols-3 gap-5">
              <InfoItem icon={<Shield className="h-4 w-4" />} label="Klub" value={player.clubs?.name || 'Free Agent'} />
              {player.clubs?.city && (
                <InfoItem icon={<MapPin className="h-4 w-4" />} label="Kota Klub" value={player.clubs.city} />
              )}
              <InfoItem
                icon={injury.icon}
                label="Status Kondisi"
                value={injury.label}
              />
              {player.contract_start && (
                <InfoItem icon={<Calendar className="h-4 w-4" />} label="Kontrak Mulai" value={format(new Date(player.contract_start), 'dd MMM yyyy', { locale: idLocale })} />
              )}
              {player.contract_end && (
                <InfoItem icon={<Calendar className="h-4 w-4" />} label="Kontrak Berakhir" value={format(new Date(player.contract_end), 'dd MMM yyyy', { locale: idLocale })} />
              )}
              {player.market_value && (
                <InfoItem icon={<TrendingUp className="h-4 w-4" />} label="Nilai Pasar" value={`Rp ${Number(player.market_value).toLocaleString('id-ID')}`} />
              )}
            </div>

            {/* Province / NIK */}
            {(player.nik_province || player.nik_city || player.nik_district) && (
              <div className="border-t border-white/10 pt-4 grid grid-cols-2 sm:grid-cols-3 gap-5">
                {player.nik_province && <InfoItem icon={<MapPin className="h-4 w-4" />} label="Provinsi" value={player.nik_province} />}
                {player.nik_city && <InfoItem icon={<MapPin className="h-4 w-4" />} label="Kota/Kabupaten" value={player.nik_city} />}
                {player.nik_district && <InfoItem icon={<MapPin className="h-4 w-4" />} label="Kecamatan" value={player.nik_district} />}
              </div>
            )}
          </div>

          {/* Statistics Card */}
          <div className="bg-white/[0.06] rounded-2xl border border-white/10 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-400" />
              <h2 className="text-white font-bold text-lg">Statistik Karir</h2>
            </div>

            {statistics.length === 0 ? (
              <p className="text-white/30 text-sm">Belum ada data statistik</p>
            ) : (
              <>
                {/* Total Stats */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  <StatBox label="Pertandingan" value={totalStats.matches} />
                  <StatBox label="Gol" value={totalStats.goals} color="text-emerald-400" />
                  <StatBox label="Assist" value={totalStats.assists} color="text-blue-400" />
                  <StatBox label="Kartu Kuning" value={totalStats.yellows} color="text-amber-400" />
                  <StatBox label="Kartu Merah" value={totalStats.reds} color="text-red-400" />
                  <StatBox label="Menit" value={totalStats.minutes} />
                </div>

                {/* Per Season */}
                <div className="space-y-2 mt-4">
                  <p className="text-white/40 text-xs uppercase tracking-widest font-medium">Per Musim</p>
                  {statistics.map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between bg-white/[0.04] rounded-lg px-4 py-2.5 text-sm">
                      <span className="text-white/60 font-medium">{s.season}</span>
                      <div className="flex gap-4 text-white/50 text-xs">
                        <span>{s.matches_played || 0} match</span>
                        <span className="text-emerald-400">{s.goals || 0} gol</span>
                        <span className="text-blue-400">{s.assists || 0} ast</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Club History */}
          <div className="bg-white/[0.06] rounded-2xl border border-white/10 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-400" />
              <h2 className="text-white font-bold text-lg">Riwayat Klub</h2>
            </div>

            {history.length === 0 ? (
              <p className="text-white/30 text-sm">Belum ada riwayat klub</p>
            ) : (
              <div className="space-y-3">
                {history.map((h: any) => (
                  <div key={h.id} className="flex items-center gap-4 bg-white/[0.04] rounded-lg px-4 py-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                      {h.clubs?.logo_url ? (
                        <img src={h.clubs.logo_url} alt="" className="w-6 h-6 object-contain" />
                      ) : (
                        <Shield className="h-4 w-4 text-white/40" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/80 font-medium text-sm truncate">{h.clubs?.name || 'Unknown'}</p>
                      <p className="text-white/40 text-xs">
                        {format(new Date(h.from_date), 'MMM yyyy', { locale: idLocale })} —{' '}
                        {h.to_date ? format(new Date(h.to_date), 'MMM yyyy', { locale: idLocale }) : 'Sekarang'}
                      </p>
                    </div>
                    {h.transfer_fee && (
                      <span className="text-white/30 text-xs">
                        Rp {Number(h.transfer_fee).toLocaleString('id-ID')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* Small sub-components */
const InfoItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-start gap-2.5">
    <span className="text-white/40 mt-0.5 flex-shrink-0">{icon}</span>
    <div className="min-w-0">
      <p className="text-white/40 text-[11px] uppercase tracking-wider font-medium">{label}</p>
      <p className="text-white/80 text-sm font-medium truncate">{value}</p>
    </div>
  </div>
);

const StatBox = ({ label, value, color = 'text-white' }: { label: string; value: number; color?: string }) => (
  <div className="bg-white/[0.04] rounded-xl p-3 text-center">
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
    <p className="text-white/40 text-[10px] uppercase tracking-wider mt-1">{label}</p>
  </div>
);

export default EPlayerCardDetail;
