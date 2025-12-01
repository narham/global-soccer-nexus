import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ClubLayout } from "./components/clubs/ClubLayout";
import { PanitiaLayout } from "./components/panitia/PanitiaLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Clubs from "./pages/Clubs";
import ClubDetail from "./pages/ClubDetail";
import ClubDashboard from "./pages/ClubDashboard";
import ClubInfoPage from "./pages/ClubInfoPage";
import ClubPlayersPage from "./pages/ClubPlayersPage";
import ClubStaffPage from "./pages/ClubStaffPage";
import ClubMatchesPage from "./pages/ClubMatchesPage";
import ClubDocumentsPage from "./pages/ClubDocumentsPage";
import ClubMatchDetailPage from "./pages/ClubMatchDetailPage";
import ClubCompetitionsPage from "./pages/ClubCompetitionsPage";
import ClubCompetitionPlayersPage from "./pages/ClubCompetitionPlayersPage";
import Players from "./pages/Players";
import PlayerDetail from "./pages/PlayerDetail";
import Competitions from "./pages/Competitions";
import CompetitionDetail from "./pages/CompetitionDetail";
import Matches from "./pages/Matches";
import MatchDetail from "./pages/MatchDetail";
import Transfers from "./pages/Transfers";
import TransferDetail from "./pages/TransferDetail";
import TransferWindows from "./pages/TransferWindows";
import Stadiums from "./pages/Stadiums";
import Users from "./pages/Users";
import Referees from "./pages/Referees";
import RefereesDashboard from "./pages/RefereesDashboard";
import ProfileDashboard from "./pages/ProfileDashboard";
import NotFound from "./pages/NotFound";
import PanitiaDashboard from "./pages/panitia/PanitiaDashboard";
import PanitiaCompetitionsPage from "./pages/panitia/PanitiaCompetitionsPage";
import PanitiaCompetitionDetailPage from "./pages/panitia/PanitiaCompetitionDetailPage";
import PanitiaMatchesPage from "./pages/panitia/PanitiaMatchesPage";
import PanitiaMatchDetailPage from "./pages/panitia/PanitiaMatchDetailPage";
import PublicPage from "./pages/PublicPage";
import PublicClubDetailPage from "./components/public/PublicClubDetailPage";
import PublicPlayerDetailPage from "./components/public/PublicPlayerDetailPage";
import PublicCompetitionDetailPage from "./pages/PublicCompetitionDetailPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes - No Auth Required */}
          <Route path="/public" element={<PublicPage />} />
          <Route path="/public/clubs/:id" element={<PublicClubDetailPage />} />
          <Route path="/public/players/:id" element={<PublicPlayerDetailPage />} />
          <Route path="/public/competitions/:id" element={<PublicCompetitionDetailPage />} />
          
          {/* Auth Routes */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<Layout><Index /></Layout>} />
          <Route path="/clubs" element={<Layout><Clubs /></Layout>} />
          <Route path="/clubs/:id/*" element={<Layout><ClubLayout /></Layout>}>
            <Route index element={<ClubDashboard />} />
            <Route path="info" element={<ClubInfoPage />} />
            <Route path="players" element={<ClubPlayersPage />} />
            <Route path="staff" element={<ClubStaffPage />} />
            <Route path="competitions" element={<ClubCompetitionsPage />} />
            <Route path="competitions/:compId/players" element={<ClubCompetitionPlayersPage />} />
            <Route path="matches" element={<ClubMatchesPage />} />
            <Route path="matches/:matchId" element={<ClubMatchDetailPage />} />
            <Route path="documents" element={<ClubDocumentsPage />} />
          </Route>
          <Route path="/players" element={<Layout><Players /></Layout>} />
          <Route path="/players/:id" element={<Layout><PlayerDetail /></Layout>} />
          <Route path="/competitions" element={<Layout><Competitions /></Layout>} />
          <Route path="/competitions/:id" element={<Layout><CompetitionDetail /></Layout>} />
          <Route path="/matches" element={<Layout><Matches /></Layout>} />
          <Route path="/matches/:id" element={<Layout><MatchDetail /></Layout>} />
          <Route path="/transfers" element={<Layout><Transfers /></Layout>} />
          <Route path="/transfers/:id" element={<Layout><TransferDetail /></Layout>} />
          <Route path="/transfer-windows" element={<Layout><TransferWindows /></Layout>} />
          <Route path="/stadiums" element={<Layout><Stadiums /></Layout>} />
          <Route path="/referees" element={<Layout><Referees /></Layout>} />
          <Route path="/referees/dashboard" element={<Layout><RefereesDashboard /></Layout>} />
          <Route path="/users" element={<Layout><Users /></Layout>} />
          <Route path="/profile" element={<Layout><ProfileDashboard /></Layout>} />
          
          {/* Panitia Routes */}
          <Route path="/panitia" element={<PanitiaLayout />}>
            <Route index element={<PanitiaDashboard />} />
            <Route path="competitions" element={<PanitiaCompetitionsPage />} />
            <Route path="competitions/:id" element={<PanitiaCompetitionDetailPage />} />
            <Route path="matches" element={<PanitiaMatchesPage />} />
            <Route path="matches/:id" element={<PanitiaMatchDetailPage />} />
          </Route>
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
