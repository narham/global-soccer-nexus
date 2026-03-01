import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlayerQRCode } from './PlayerQRCode';
import { cn } from '@/lib/utils';

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

const getNationalityFlag = (nationality: string): string => {
  const n = nationality.toLowerCase();
  if (n.includes('indonesia')) return '🇮🇩';
  if (n.includes('japan')) return '🇯🇵';
  if (n.includes('korea')) return '🇰🇷';
  if (n.includes('brazil')) return '🇧🇷';
  if (n.includes('argentina')) return '🇦🇷';
  if (n.includes('malaysia')) return '🇲🇾';
  if (n.includes('thailand')) return '🇹🇭';
  return '🏳️';
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'approved':
      return { label: 'VERIFIED', neonClass: 'neon-green', badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
    case 'pending':
      return { label: 'PENDING', neonClass: 'neon-yellow', badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    case 'rejected':
      return { label: 'REJECTED', neonClass: 'neon-red', badgeClass: 'bg-red-500/20 text-red-300 border-red-500/30' };
    default:
      return { label: status.toUpperCase(), neonClass: 'neon-green', badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
  }
};

const positionLabels: Record<string, string> = {
  GK: 'Goalkeeper',
  DF: 'Defender',
  MF: 'Midfielder',
  FW: 'Forward',
};

export const EPlayerCard: React.FC<EPlayerCardProps> = ({ player }) => {
  const statusConfig = getStatusConfig(player.registration_status);
  const ageCategory = getAgeCategory(player.date_of_birth);
  const flag = getNationalityFlag(player.nationality);
  const playerId = `PID-${player.id.substring(0, 8).toUpperCase()}`;
  const initials = player.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div
      className={cn(
        'relative w-[280px] rounded-2xl border p-5 backdrop-blur-xl bg-white/10',
        'transition-all duration-300 hover:scale-105 hover:bg-white/15',
        'flex flex-col items-center gap-3 select-none',
        statusConfig.neonClass
      )}
    >
      {/* Top Section: Status + QR */}
      <div className="flex items-start justify-between w-full">
        <Badge variant="outline" className={cn('text-xs font-bold tracking-wider', statusConfig.badgeClass)}>
          {statusConfig.label}
        </Badge>
        <PlayerQRCode playerId={player.id} size={48} />
      </div>

      {/* Middle Section: Photo + Name */}
      <Avatar className="h-24 w-24 border-2 border-white/30 shadow-lg">
        <AvatarImage src={player.photo_url || undefined} alt={player.full_name} />
        <AvatarFallback className="bg-white/10 text-white text-xl font-bold">{initials}</AvatarFallback>
      </Avatar>

      <div className="text-center">
        <h3 className="text-white font-bold text-lg leading-tight">{player.full_name}</h3>
        <p className="text-white/60 text-sm mt-0.5">{player.clubs?.name || 'Free Agent'}</p>
      </div>

      {/* Info Row */}
      <div className="flex items-center gap-2 text-sm">
        <Badge variant="outline" className="bg-white/10 text-white/80 border-white/20 text-xs">
          {positionLabels[player.position] || player.position}
        </Badge>
        <Badge variant="outline" className="bg-white/10 text-white/80 border-white/20 text-xs">
          {ageCategory}
        </Badge>
        <span className="text-lg">{flag}</span>
      </div>

      {/* Bottom Section */}
      <div className="w-full border-t border-white/10 pt-3 text-center space-y-1">
        {player.nik_province && (
          <p className="text-white/50 text-xs">{player.nik_province}</p>
        )}
        <p className="text-white/40 text-xs font-mono tracking-widest">{playerId}</p>
      </div>
    </div>
  );
};
