import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trophy, LogIn } from "lucide-react";

export const PublicNav = () => {
  const navigate = useNavigate();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/public" className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">Sistem Sepakbola</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/public")}>
              Beranda
            </Button>
            <Button onClick={() => navigate("/auth")}>
              <LogIn className="mr-2 h-4 w-4" />
              Login
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
