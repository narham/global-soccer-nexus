import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Trophy, 
  Calendar,
  UserCog,
  FileText,
  Settings
} from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

interface CommandItem {
  title: string;
  url: string;
  icon: any;
  roles?: string[];
}

const commands: CommandItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Klub", url: "/clubs", icon: Building2 },
  { title: "Pemain", url: "/players", icon: Users },
  { title: "Kompetisi", url: "/competitions", icon: Trophy },
  { title: "Pertandingan", url: "/matches", icon: Calendar },
  { title: "Transfer", url: "/transfers", icon: FileText },
  { title: "Stadion", url: "/stadiums", icon: Building2 },
  { title: "Pengguna", url: "/users", icon: UserCog, roles: ["admin_federasi"] },
  { title: "Dashboard Panitia", url: "/panitia", icon: LayoutDashboard, roles: ["panitia"] },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { role } = useUserRole();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const filteredCommands = commands.filter(cmd => 
    !cmd.roles || cmd.roles.includes(role || "")
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Cari menu..." />
      <CommandList>
        <CommandEmpty>Tidak ditemukan.</CommandEmpty>
        <CommandGroup heading="Navigasi">
          {filteredCommands.map((cmd) => (
            <CommandItem
              key={cmd.url}
              onSelect={() => {
                navigate(cmd.url);
                setOpen(false);
              }}
            >
              <cmd.icon className="mr-2 h-4 w-4" />
              <span>{cmd.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
