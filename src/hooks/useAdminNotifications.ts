import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "./useUserRole";

export interface Notification {
  id: string;
  type: "competition" | "player_registration" | "role_request" | "transfer" | "player_document" | "player";
  title: string;
  description: string;
  createdAt: string;
  data?: any;
}

export function useAdminNotifications() {
  const { isAdminFederasi } = useUserRole();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAdminFederasi) return;

    // Fetch initial pending items
    fetchPendingItems();

    // Subscribe to realtime changes
    const competitionsChannel = supabase
      .channel('competitions-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'competitions',
          filter: 'approval_status=eq.pending'
        },
        (payload) => {
          const newNotif: Notification = {
            id: payload.new.id,
            type: 'competition',
            title: 'Kompetisi Baru Menunggu Approval',
            description: `${payload.new.name} perlu disetujui`,
            createdAt: payload.new.created_at,
            data: payload.new
          };
          setNotifications(prev => [newNotif, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    const playerRegsChannel = supabase
      .channel('player-regs-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'competition_player_registrations',
          filter: 'status=eq.pending'
        },
        (payload) => {
          const newNotif: Notification = {
            id: payload.new.id,
            type: 'player_registration',
            title: 'Registrasi Pemain Baru',
            description: 'Ada pendaftaran pemain kompetisi baru',
            createdAt: payload.new.created_at,
            data: payload.new
          };
          setNotifications(prev => [newNotif, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    const roleRequestsChannel = supabase
      .channel('role-requests-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'role_requests',
          filter: 'status=eq.pending'
        },
        (payload) => {
          const newNotif: Notification = {
            id: payload.new.id,
            type: 'role_request',
            title: 'Permintaan Role Baru',
            description: 'Ada permintaan role yang perlu direview',
            createdAt: payload.new.created_at,
            data: payload.new
          };
          setNotifications(prev => [newNotif, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    const playersChannel = supabase
      .channel('players-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'players',
          filter: 'registration_status=eq.pending'
        },
        (payload) => {
          const newNotif: Notification = {
            id: payload.new.id,
            type: 'player',
            title: 'Pemain Baru Menunggu Verifikasi',
            description: `${payload.new.full_name} perlu diverifikasi`,
            createdAt: payload.new.created_at,
            data: payload.new
          };
          setNotifications(prev => [newNotif, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    const playerDocsChannel = supabase
      .channel('player-docs-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'player_documents',
          filter: 'verified=eq.false'
        },
        (payload) => {
          const newNotif: Notification = {
            id: payload.new.id,
            type: 'player_document',
            title: 'Dokumen Pemain Baru',
            description: `Dokumen ${payload.new.document_type} perlu diverifikasi`,
            createdAt: payload.new.created_at,
            data: payload.new
          };
          setNotifications(prev => [newNotif, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    const transfersChannel = supabase
      .channel('transfers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'player_transfers',
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const transfer = payload.new;
            let title = '';
            let description = '';
            
            if (payload.eventType === 'INSERT') {
              title = 'Transfer Pemain Baru';
              description = 'Ada pengajuan transfer baru yang perlu ditinjau';
            } else if (transfer.status === 'pending') {
              title = 'Transfer Menunggu Approval';
              description = 'Ada transfer yang menunggu persetujuan';
            }

            if (title) {
              const newNotif: Notification = {
                id: transfer.id,
                type: 'transfer',
                title,
                description,
                createdAt: transfer.created_at,
                data: transfer
              };
              setNotifications(prev => [newNotif, ...prev]);
              setUnreadCount(prev => prev + 1);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(competitionsChannel);
      supabase.removeChannel(playerRegsChannel);
      supabase.removeChannel(roleRequestsChannel);
      supabase.removeChannel(playersChannel);
      supabase.removeChannel(playerDocsChannel);
      supabase.removeChannel(transfersChannel);
    };
  }, [isAdminFederasi]);

  async function fetchPendingItems() {
    try {
      const allNotifications: Notification[] = [];

      // Fetch pending competitions
      const { data: competitions } = await supabase
        .from('competitions')
        .select('*')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false });

      if (competitions) {
        competitions.forEach(comp => {
          allNotifications.push({
            id: comp.id,
            type: 'competition',
            title: 'Kompetisi Menunggu Approval',
            description: `${comp.name}`,
            createdAt: comp.created_at,
            data: comp
          });
        });
      }

      // Fetch pending player registrations
      const { data: playerRegs } = await supabase
        .from('competition_player_registrations')
        .select('*, players(full_name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (playerRegs) {
        playerRegs.forEach(reg => {
          allNotifications.push({
            id: reg.id,
            type: 'player_registration',
            title: 'Registrasi Pemain Pending',
            description: `${(reg.players as any)?.full_name || 'Pemain'}`,
            createdAt: reg.created_at || new Date().toISOString(),
            data: reg
          });
        });
      }

      // Fetch pending role requests
      const { data: roleReqs } = await supabase
        .from('role_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (roleReqs) {
        roleReqs.forEach(req => {
          allNotifications.push({
            id: req.id,
            type: 'role_request',
            title: 'Permintaan Role',
            description: `Role: ${req.requested_role}`,
            createdAt: req.created_at || new Date().toISOString(),
            data: req
          });
        });
      }

      // Fetch pending players
      const { data: players } = await supabase
        .from('players')
        .select('*')
        .eq('registration_status', 'pending')
        .order('created_at', { ascending: false });

      if (players) {
        players.forEach(player => {
          allNotifications.push({
            id: player.id,
            type: 'player',
            title: 'Pemain Baru',
            description: `${player.full_name}`,
            createdAt: player.created_at,
            data: player
          });
        });
      }

      // Fetch unverified documents
      const { data: docs } = await supabase
        .from('player_documents')
        .select('*, players(full_name)')
        .eq('verified', false)
        .order('created_at', { ascending: false });

      if (docs) {
        docs.forEach(doc => {
          allNotifications.push({
            id: doc.id,
            type: 'player_document',
            title: 'Dokumen Pemain',
            description: `${doc.document_type} - ${(doc.players as any)?.full_name}`,
            createdAt: doc.created_at,
            data: doc
          });
        });
      }

      // Fetch pending transfers
      const { data: transfers } = await supabase
        .from('player_transfers')
        .select('*, players(full_name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (transfers) {
        transfers.forEach(transfer => {
          allNotifications.push({
            id: transfer.id,
            type: 'transfer',
            title: 'Transfer Pending',
            description: `Transfer ${(transfer.players as any)?.full_name}`,
            createdAt: transfer.created_at,
            data: transfer
          });
        });
      }

      // Sort by created_at descending
      allNotifications.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setNotifications(allNotifications);
      setUnreadCount(allNotifications.length);
    } catch (error) {
      console.error('Error fetching pending items:', error);
    }
  }

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    clearNotification,
    clearAll,
    refresh: fetchPendingItems
  };
}
