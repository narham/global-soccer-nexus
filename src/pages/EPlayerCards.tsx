import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EPlayerCard } from '@/components/players/EPlayerCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, CreditCard, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import useEmblaCarousel from 'embla-carousel-react';

const EPlayerCards = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [posFilter, setPosFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const isMobile = useIsMobile();

  const { data: players = [], isLoading } = useQuery({
    queryKey: ['e-player-cards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('players')
        .select('id, full_name, photo_url, position, date_of_birth, nationality, nik_province, registration_status, shirt_number, height_cm, weight_kg, current_club_id, clubs(name)')
        .order('full_name');
      if (error) throw error;
      return data || [];
    },
  });

  const [emblaRef] = useEmblaCarousel({
    align: 'center',
    containScroll: 'trimSnaps',
    dragFree: true,
  });

  const filtered = players.filter((p: any) => {
    const matchSearch = p.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (p.clubs?.name || '').toLowerCase().includes(search.toLowerCase());
    const matchPos = posFilter === 'all' || p.position === posFilter;
    const matchStatus = statusFilter === 'all' || p.registration_status === statusFilter;
    return matchSearch && matchPos && matchStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 -m-6 p-6 relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20">
            <CreditCard className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">E-Player Cards</h1>
            <p className="text-white/40 text-sm">Kartu identitas digital pemain</p>
          </div>
        </div>
        {!isLoading && (
          <div className="flex items-center gap-2 text-white/40 text-sm">
            <Users className="h-4 w-4" />
            <span>{filtered.length} pemain</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="relative flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <Input
            placeholder="Cari nama pemain atau klub..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/[0.06] border-white/10 text-white placeholder:text-white/30 focus:border-emerald-500/40 focus:bg-white/[0.08] transition-all"
          />
        </div>
        <Select value={posFilter} onValueChange={setPosFilter}>
          <SelectTrigger className="w-full sm:w-[140px] bg-white/[0.06] border-white/10 text-white">
            <SelectValue placeholder="Posisi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Posisi</SelectItem>
            <SelectItem value="GK">GK</SelectItem>
            <SelectItem value="DF">DF</SelectItem>
            <SelectItem value="MF">MF</SelectItem>
            <SelectItem value="FW">FW</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px] bg-white/[0.06] border-white/10 text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="approved">Verified</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-items-center">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="w-[300px] h-[420px] rounded-2xl bg-white/5" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-24 text-white/30">
          <CreditCard className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">Tidak ada pemain ditemukan</p>
          <p className="text-sm mt-1">Coba ubah filter pencarian</p>
        </div>
      )}

      {/* Cards - Mobile Carousel */}
      {!isLoading && filtered.length > 0 && isMobile ? (
        <div className="overflow-hidden -mx-2" ref={emblaRef}>
          <div className="flex gap-5 px-6 pb-8">
            {filtered.map((player: any, i: number) => (
              <div
                key={player.id}
                className="flex-none"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="animate-fade-in">
                  <EPlayerCard player={player} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Cards - Desktop Grid */
        !isLoading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-items-center pb-8">
            {filtered.map((player: any, i: number) => (
              <div
                key={player.id}
                className="animate-fade-in"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <EPlayerCard player={player} />
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default EPlayerCards;
