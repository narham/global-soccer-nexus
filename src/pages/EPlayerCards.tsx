import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EPlayerCard } from '@/components/players/EPlayerCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, CreditCard } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import useEmblaCarousel from 'embla-carousel-react';

const EPlayerCards = () => {
  const [search, setSearch] = useState('');
  const [posFilter, setPosFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const isMobile = useIsMobile();

  const { data: players = [], isLoading } = useQuery({
    queryKey: ['e-player-cards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('players')
        .select('id, full_name, photo_url, position, date_of_birth, nationality, nik_province, registration_status, current_club_id, clubs(name)')
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 -m-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <CreditCard className="h-7 w-7 text-emerald-400" />
        <h1 className="text-2xl font-bold text-white">E-Player Cards</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Cari nama pemain atau klub..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
          />
        </div>
        <Select value={posFilter} onValueChange={setPosFilter}>
          <SelectTrigger className="w-full sm:w-[140px] bg-white/10 border-white/20 text-white">
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
          <SelectTrigger className="w-full sm:w-[160px] bg-white/10 border-white/20 text-white">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="w-[280px] h-[360px] rounded-2xl bg-white/5" />
          ))}
        </div>
      )}

      {/* Cards */}
      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-20 text-white/40">
          <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Tidak ada pemain ditemukan</p>
        </div>
      )}

      {!isLoading && filtered.length > 0 && isMobile ? (
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4 px-4">
            {filtered.map((player: any) => (
              <div key={player.id} className="flex-none animate-fade-in">
                <EPlayerCard player={player} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        !isLoading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
            {filtered.map((player: any) => (
              <div key={player.id} className="animate-fade-in">
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
