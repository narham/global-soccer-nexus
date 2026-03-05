import React, { useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlayerQRCode } from './PlayerQRCode';
import { cn } from '@/lib/utils';
import { getNationalityFlag } from '@/lib/nationality-flags';
import { Download, Ruler, Weight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';

interface EPlayerCardProps {
  player: {
    id: string;
    full_name: string;
    photo_url: string | null;
    position: string;
    date_of_birth: string;
    nationality: string;
    nik_province: string | null;
    registration_status: string;
    shirt_number?: number | null;
    height_cm?: number | null;
    weight_kg?: number | null;
    clubs?: { name: string } | null;
  };
}

const getAgeCategory = (dob: string): string => {
  const birth = new Date(dob);
  const now = new Date();
  const age = now.getFullYear() - birth.getFullYear();
  if (age < 12) return 'U12';
  if (age < 15) return 'U15';
  if (age < 17) return 'U17';
  if (age < 20) return 'U20';
  return 'Senior';
};

const getAge = (dob: string): number => {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'approved':
      return { label: 'VERIFIED', neonClass: 'neon-green', badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', dotClass: 'bg-emerald-400' };
    case 'pending':
      return { label: 'PENDING', neonClass: 'neon-yellow', badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40', dotClass: 'bg-amber-400' };
    case 'rejected':
      return { label: 'REJECTED', neonClass: 'neon-red', badgeClass: 'bg-red-500/20 text-red-300 border-red-500/40', dotClass: 'bg-red-400' };
    default:
      return { label: status.toUpperCase(), neonClass: 'neon-green', badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', dotClass: 'bg-emerald-400' };
  }
};

const positionLabels: Record<string, string> = {
  GK: 'Goalkeeper',
  DF: 'Defender',
  MF: 'Midfielder',
  FW: 'Forward',
};

const positionColors: Record<string, string> = {
  GK: 'from-amber-500/30 to-amber-600/10 border-amber-500/30 text-amber-200',
  DF: 'from-blue-500/30 to-blue-600/10 border-blue-500/30 text-blue-200',
  MF: 'from-emerald-500/30 to-emerald-600/10 border-emerald-500/30 text-emerald-200',
  FW: 'from-rose-500/30 to-rose-600/10 border-rose-500/30 text-rose-200',
};

export const EPlayerCard: React.FC<EPlayerCardProps> = ({ player }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const statusConfig = getStatusConfig(player.registration_status);
  const ageCategory = getAgeCategory(player.date_of_birth);
  const age = getAge(player.date_of_birth);
  const flag = getNationalityFlag(player.nationality);
  const playerId = `PID-${player.id.substring(0, 8).toUpperCase()}`;
  const initials = player.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const posColor = positionColors[player.position] || positionColors.MF;

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0f172a',
        scale: 3,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `ECard_${player.full_name.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Kartu berhasil didownload!');
    } catch {
      toast.error('Gagal mendownload kartu');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="group relative">
      <div
        ref={cardRef}
        className={cn(
          'relative w-[300px] rounded-2xl border overflow-hidden',
          'backdrop-blur-xl bg-gradient-to-br from-white/[0.12] via-white/[0.06] to-white/[0.02]',
          'transition-all duration-500 ease-out',
          'group-hover:scale-[1.03] group-hover:from-white/[0.16] group-hover:via-white/[0.08] group-hover:to-white/[0.04]',
          'select-none',
          statusConfig.neonClass
        )}
      >
        {/* Shimmer overlay */}
        <div className="absolute inset-0 e-card-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        {/* Top gradient bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div className="p-5 flex flex-col items-center gap-4">
          {/* Top Section: Status + Shirt Number + QR */}
          <div className="flex items-start justify-between w-full">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn('text-[10px] font-bold tracking-widest', statusConfig.badgeClass)}>
                <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5 animate-neon-pulse', statusConfig.dotClass)} />
                {statusConfig.label}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {player.shirt_number && (
                <span className="text-2xl font-black text-white/80 font-mono leading-none">#{player.shirt_number}</span>
              )}
              <PlayerQRCode playerId={player.id} size={44} />
            </div>
          </div>

          {/* Photo with ring */}
          <div className="relative">
            <div className={cn('absolute -inset-1 rounded-full opacity-40 blur-md', statusConfig.neonClass)} />
            <Avatar className="h-28 w-28 border-2 border-white/20 shadow-2xl relative z-10">
              <AvatarImage src={player.photo_url || undefined} alt={player.full_name} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-white/15 to-white/5 text-white text-2xl font-bold">{initials}</AvatarFallback>
            </Avatar>
          </div>

          {/* Name + Club */}
          <div className="text-center space-y-1">
            <h3 className="text-white font-extrabold text-lg leading-tight tracking-tight">{player.full_name}</h3>
            <p className="text-white/50 text-sm font-medium">{player.clubs?.name || 'Free Agent'}</p>
          </div>

          {/* Position + Age Category + Flag */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <Badge variant="outline" className={cn('text-xs font-semibold bg-gradient-to-r border', posColor)}>
              {positionLabels[player.position] || player.position}
            </Badge>
            <Badge variant="outline" className="bg-white/10 text-white/70 border-white/15 text-xs font-semibold">
              {ageCategory} • {age} thn
            </Badge>
            <span className="text-lg leading-none">{flag}</span>
          </div>

          {/* Physical Stats Row */}
          {(player.height_cm || player.weight_kg) && (
            <div className="flex items-center gap-4 text-white/50 text-xs">
              {player.height_cm && (
                <div className="flex items-center gap-1">
                  <Ruler className="h-3 w-3" />
                  <span>{player.height_cm} cm</span>
                </div>
              )}
              {player.weight_kg && (
                <div className="flex items-center gap-1">
                  <Weight className="h-3 w-3" />
                  <span>{player.weight_kg} kg</span>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="w-full border-t border-white/10 pt-3 text-center space-y-1">
            {player.nik_province && (
              <p className="text-white/40 text-xs font-medium">{player.nik_province}</p>
            )}
            <p className="text-white/30 text-[10px] font-mono tracking-[0.2em]">{playerId}</p>
          </div>
        </div>
      </div>

      {/* Download button (appears on hover) */}
      <Button
        size="icon"
        variant="ghost"
        className="absolute -bottom-2 right-2 h-8 w-8 rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white opacity-0 group-hover:opacity-100 group-hover:-bottom-4 transition-all duration-300 backdrop-blur-sm border border-white/10"
        onClick={handleDownload}
        disabled={downloading}
      >
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
};
