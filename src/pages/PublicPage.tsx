import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PublicNav } from "@/components/public/PublicNav";
import { PublicStandingsTab } from "@/components/public/PublicStandingsTab";
import { PublicMatchesTab } from "@/components/public/PublicMatchesTab";
import { PublicPlayersTab } from "@/components/public/PublicPlayersTab";
import { PublicLiveMatchesTab } from "@/components/public/PublicLiveMatchesTab";
import { Trophy, Calendar, Users, Zap } from "lucide-react";
import { useSwipeableTabs } from "@/hooks/useSwipeGesture";

export default function PublicPage() {
  const [currentTab, setCurrentTab] = useState("standings");
  const tabs = ["live", "standings", "matches", "players"];

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
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Portal Sepakbola Indonesia</h1>
          <p className="text-muted-foreground text-lg">
            Lihat klasemen, jadwal pertandingan, dan statistik pemain terkini
          </p>
        </div>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[800px]">
            <TabsTrigger value="live" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span>🔴 Live</span>
            </TabsTrigger>
            <TabsTrigger value="standings" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              <span>Klasemen</span>
            </TabsTrigger>
            <TabsTrigger value="matches" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Jadwal</span>
            </TabsTrigger>
            <TabsTrigger value="players" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Statistik</span>
            </TabsTrigger>
          </TabsList>

          <div id="public-tabs" className="touch-pan-y">
            <TabsContent value="live" className="space-y-4">
              <PublicLiveMatchesTab />
            </TabsContent>

            <TabsContent value="standings" className="space-y-4">
              <PublicStandingsTab />
            </TabsContent>

            <TabsContent value="matches" className="space-y-4">
              <PublicMatchesTab />
            </TabsContent>

            <TabsContent value="players" className="space-y-4">
              <PublicPlayersTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
