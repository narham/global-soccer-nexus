import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

type TableName = 'clubs' | 'players' | 'competitions' | 'matches' | 'player_transfers' | 
  'match_events' | 'standings' | 'competition_player_registrations' | 'role_requests' |
  'player_documents' | 'club_documents' | 'ticket_orders' | 'tickets';

type EventType = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface UseRealtimeOptions {
  table: TableName;
  event?: EventType;
  filter?: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  onChange?: (payload: any) => void;
}

export function useRealtimeSubscription({
  table,
  event = '*',
  filter,
  onInsert,
  onUpdate,
  onDelete,
  onChange,
}: UseRealtimeOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  const handleChange = useCallback(
    (payload: any) => {
      const eventType = payload.eventType as EventType;
      
      onChange?.(payload);

      switch (eventType) {
        case 'INSERT':
          onInsert?.(payload);
          break;
        case 'UPDATE':
          onUpdate?.(payload);
          break;
        case 'DELETE':
          onDelete?.(payload);
          break;
      }
    },
    [onChange, onInsert, onUpdate, onDelete]
  );

  useEffect(() => {
    const channelName = `realtime-${table}-${Date.now()}`;
    
    const channelConfig: any = {
      event,
      schema: 'public',
      table,
    };

    if (filter) {
      channelConfig.filter = filter;
    }

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', channelConfig, handleChange)
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [table, event, filter, handleChange]);

  return channelRef.current;
}

// Hook untuk multiple subscriptions
export function useMultipleRealtimeSubscriptions(
  subscriptions: UseRealtimeOptions[]
) {
  const channelsRef = useRef<RealtimeChannel[]>([]);

  useEffect(() => {
    channelsRef.current = subscriptions.map((sub, index) => {
      const channelName = `realtime-multi-${sub.table}-${index}-${Date.now()}`;
      
      const channelConfig: any = {
        event: sub.event || '*',
        schema: 'public',
        table: sub.table,
      };

      if (sub.filter) {
        channelConfig.filter = sub.filter;
      }

      return supabase
        .channel(channelName)
        .on('postgres_changes', channelConfig, (payload) => {
          const eventType = payload.eventType;
          
          sub.onChange?.(payload);

          switch (eventType) {
            case 'INSERT':
              sub.onInsert?.(payload);
              break;
            case 'UPDATE':
              sub.onUpdate?.(payload);
              break;
            case 'DELETE':
              sub.onDelete?.(payload);
              break;
          }
        })
        .subscribe();
    });

    return () => {
      channelsRef.current.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
  }, [subscriptions]);

  return channelsRef.current;
}
