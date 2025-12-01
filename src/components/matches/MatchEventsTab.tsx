import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Target, CreditCard, RefreshCw, Video } from "lucide-react";
import { EventFormDialog } from "./EventFormDialog";
import { TableActions } from "../TableActions";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MatchEventsTabProps {
  matchId: string;
  homeClub: any;
  awayClub: any;
}

export const MatchEventsTab = ({ matchId, homeClub, awayClub }: MatchEventsTabProps) => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();

    // Realtime subscription for events
    const channel = supabase
      .channel('match-events')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_events',
          filter: `match_id=eq.${matchId}`
        },
        () => {
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("match_events")
        .select(`
          *,
          player:players(full_name, shirt_number, position),
          club:clubs(name, home_color)
        `)
        .eq("match_id", matchId)
        .order("minute", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal memuat events",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (event: any) => {
    try {
      const { error } = await supabase.from("match_events").delete().eq("id", event.id);
      if (error) throw error;
      toast({ title: "Event berhasil dihapus" });
      fetchEvents();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal menghapus event",
        description: error.message,
      });
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "goal": return <Target className="h-5 w-5 text-green-600" />;
      case "yellow_card": return <CreditCard className="h-5 w-5 text-yellow-500" />;
      case "red_card": return <CreditCard className="h-5 w-5 text-red-600" />;
      case "substitution": return <RefreshCw className="h-5 w-5 text-blue-600" />;
      case "var": return <Video className="h-5 w-5 text-purple-600" />;
      default: return null;
    }
  };

  const getEventLabel = (type: string) => {
    switch (type) {
      case "goal": return "GOL";
      case "yellow_card": return "Kartu Kuning";
      case "red_card": return "Kartu Merah";
      case "substitution": return "Pergantian";
      case "var": return "VAR Check";
      default: return type;
    }
  };

  const isHomeEvent = (event: any) => {
    if (!homeClub?.id || !event?.club_id) return true;
    return event.club_id === homeClub.id;
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold">Timeline Pertandingan</h3>
            <p className="text-sm text-muted-foreground">
              Total: {events.length} events (sesuai FIFA Match Protocol)
            </p>
          </div>
          <Button onClick={() => { setSelectedEvent(null); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Event
          </Button>
        </div>

        <Alert className="mb-4">
          <AlertDescription>
            Semua events tercatat sesuai IFAB Laws of the Game. VAR decisions mengikuti FIFA VAR Protocol.
            Pergantian maksimal 5 per tim (3 untuk non-FIFA competitions).
          </AlertDescription>
        </Alert>

        {events.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Belum ada event dalam pertandingan ini
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => {
              const isHome = isHomeEvent(event);
              return (
                <div
                  key={event.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border ${
                    isHome ? "bg-blue-50/50" : "bg-red-50/50"
                  }`}
                >
                  {!isHome && <div className="flex-1" />}
                  
                  <div className={`flex items-center gap-3 ${!isHome ? "flex-row-reverse text-right" : ""}`}>
                    {getEventIcon(event.event_type)}
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">
                          {event.minute}'
                        </Badge>
                        <span className="font-semibold">{getEventLabel(event.event_type)}</span>
                      </div>
                      {event.player && (
                        <p className="text-sm mt-1">
                          <Badge variant="secondary" className="mr-1">#{event.player.shirt_number}</Badge>
                          {event.player.full_name}
                        </p>
                      )}
                      {event.description && (
                        <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                      )}
                    </div>
                  </div>

                  {isHome && <div className="flex-1" />}
                  
                  <TableActions
                    onEdit={() => { setSelectedEvent(event); setDialogOpen(true); }}
                    onDelete={() => handleDelete(event)}
                    itemName={`Event ${event.minute}'`}
                  />
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Event Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-2xl font-bold">
                {events.filter(e => e.event_type === "goal").length}
              </p>
              <p className="text-sm text-muted-foreground">Total Gol</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">
                {events.filter(e => e.event_type === "yellow_card").length}
              </p>
              <p className="text-sm text-muted-foreground">Kartu Kuning</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-2xl font-bold">
                {events.filter(e => e.event_type === "red_card").length}
              </p>
              <p className="text-sm text-muted-foreground">Kartu Merah</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">
                {events.filter(e => e.event_type === "substitution").length}
              </p>
              <p className="text-sm text-muted-foreground">Pergantian</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-2xl font-bold">
                {events.filter(e => e.event_type === "var").length}
              </p>
              <p className="text-sm text-muted-foreground">VAR Check</p>
            </div>
          </div>
        </Card>
      </div>

      <EventFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        matchId={matchId}
        homeClub={homeClub}
        awayClub={awayClub}
        event={selectedEvent}
        onSuccess={fetchEvents}
      />
    </div>
  );
};
