import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PublicNav } from "@/components/public/PublicNav";
import { PublicStandingsTab } from "@/components/public/PublicStandingsTab";
import { PublicMatchesTab } from "@/components/public/PublicMatchesTab";
import { PublicPlayersTab } from "@/components/public/PublicPlayersTab";
import { PublicLiveMatchesTab } from "@/components/public/PublicLiveMatchesTab";
import { Trophy, Calendar, Users, Zap, Ticket } from "lucide-react";
import { useSwipeableTabs } from "@/hooks/useSwipeGesture";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function PublicPage() {
  const [currentTab, setCurrentTab] = useState("standings");
  const tabs = ["live", "standings", "matches", "players"];
  const navigate = useNavigate();

  const currentIndex = tabs.indexOf(currentTab);
  const swipeHandlers = useSwipeableTabs(
    tabs.length, 
    currentIndex, 
    (index) => setCurrentTab(tabs[index])
  );

  useEffect(() => {
    const element = document.getElementById("public-tabs");
    if (!element) return;

    element.addEventListener("touchstart", swipeHandlers.handleTouchStart as any);
    element.addEventListener("touchmove", swipeHandlers.handleTouchMove as any);
    element.addEventListener("touchend", swipeHandlers.handleTouchEnd as any);

    return () => {
      element.removeEventListener("touchstart", swipeHandlers.handleTouchStart as any);
      element.removeEventListener("touchmove", swipeHandlers.handleTouchMove as any);
      element.removeEventListener("touchend", swipeHandlers.handleTouchEnd as any);
    };
  }, [currentTab]);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <PublicNav />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDIwMjAiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djJoLTR2LTJoNHptMC0zMHYyaC00VjRoNHpNNiAzNHYySDJ2LTJoNHptMC0zMHYySDJWNGg0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="container mx-auto px-4 py-10 md:py-14 relative">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-semibold text-primary uppercase tracking-wider">Portal Resmi</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 text-foreground">
                Sepakbola Indonesia
              </h1>
              <p className="text-muted-foreground text-base md:text-lg max-w-xl">
                Klasemen terkini, jadwal pertandingan, dan statistik pemain dalam satu portal
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate("/public/tickets")}
              className="self-start md:self-auto gap-2"
            >
              <Ticket className="h-4 w-4" />
              Beli Tiket Pertandingan
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
          <div className="sticky top-16 z-40 -mx-4 px-4 py-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b md:border-0 md:static md:bg-transparent md:backdrop-blur-none md:py-0">
            <TabsList className="grid w-full grid-cols-4 lg:w-[700px] h-11">
              <TabsTrigger value="live" className="flex items-center gap-1.5 text-xs sm:text-sm data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive">
                <div className="relative">
                  <Zap className="h-4 w-4" />
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-destructive rounded-full animate-pulse" />
                </div>
                <span className="hidden sm:inline">Live</span>
              </TabsTrigger>
              <TabsTrigger value="standings" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Trophy className="h-4 w-4" />
                <span>Klasemen</span>
              </TabsTrigger>
              <TabsTrigger value="matches" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Calendar className="h-4 w-4" />
                <span>Jadwal</span>
              </TabsTrigger>
              <TabsTrigger value="players" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Users className="h-4 w-4" />
                <span>Statistik</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div id="public-tabs" className="touch-pan-y">
            <TabsContent value="live" className="space-y-4 mt-0">
              <PublicLiveMatchesTab />
            </TabsContent>

            <TabsContent value="standings" className="space-y-4 mt-0">
              <PublicStandingsTab />
            </TabsContent>

            <TabsContent value="matches" className="space-y-4 mt-0">
              <PublicMatchesTab />
            </TabsContent>

            <TabsContent value="players" className="space-y-4 mt-0">
              <PublicPlayersTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
