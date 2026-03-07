import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trophy, LogIn, Ticket, Home, Menu } from "lucide-react";
import { PublicGlobalSearch } from "./PublicGlobalSearch";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const PublicNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const navItems = [
    { label: "Beranda", path: "/public", icon: Home },
    { label: "Beli Tiket", path: "/public/tickets", icon: Ticket },
  ];

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between gap-3">
          <Link to="/public" className="flex items-center gap-2 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Trophy className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg hidden sm:inline">Sepakbola ID</span>
          </Link>

          <PublicGlobalSearch />
          
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Desktop nav */}
            {navItems.map((item) => (
              <Button 
                key={item.path}
                variant="ghost" 
                size="sm" 
                onClick={() => navigate(item.path)} 
                className={cn(
                  "hidden sm:inline-flex gap-1.5 text-sm",
                  location.pathname === item.path && "bg-muted"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            ))}
            <Button size="sm" onClick={() => navigate("/auth")} className="gap-1.5 text-sm">
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Login</span>
            </Button>

            {/* Mobile hamburger */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="sm:hidden h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 pt-10">
                <div className="flex flex-col gap-1">
                  {navItems.map((item) => (
                    <Button
                      key={item.path}
                      variant={location.pathname === item.path ? "secondary" : "ghost"}
                      className="justify-start gap-2"
                      onClick={() => { navigate(item.path); setOpen(false); }}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};
