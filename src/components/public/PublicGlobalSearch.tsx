import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, X, Users, Shield, Trophy } from "lucide-react";

interface SearchResult {
  type: 'player' | 'club' | 'competition';
  id: string;
  name: string;
  subtitle?: string;
  imageUrl?: string;
}

export const PublicGlobalSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const timeout = setTimeout(() => search(query), 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const search = async (q: string) => {
    setLoading(true);
    const term = `%${q}%`;

    const [playersRes, clubsRes, compsRes] = await Promise.all([
      supabase.from("players_public").select("id, full_name, photo_url, position").ilike("full_name", term).limit(5),
      supabase.from("clubs").select("id, name, logo_url, city").ilike("name", term).limit(5),
      supabase.from("competitions").select("id, name, season, status").eq("approval_status", "approved").ilike("name", term).limit(5),
    ]);

    const items: SearchResult[] = [
      ...(playersRes.data || []).map(p => ({ type: 'player' as const, id: p.id, name: p.full_name, subtitle: p.position, imageUrl: p.photo_url })),
      ...(clubsRes.data || []).map(c => ({ type: 'club' as const, id: c.id, name: c.name, subtitle: c.city, imageUrl: c.logo_url })),
      ...(compsRes.data || []).map(c => ({ type: 'competition' as const, id: c.id, name: c.name, subtitle: `${c.season} • ${c.status}` })),
    ];
    setResults(items);
    setOpen(true);
    setLoading(false);
  };

  const getLink = (r: SearchResult) => {
    if (r.type === 'player') return `/public/players/${r.id}`;
    if (r.type === 'club') return `/public/clubs/${r.id}`;
    return `/public/competitions/${r.id}`;
  };

  const getIcon = (type: string) => {
    if (type === 'player') return <Users className="h-3 w-3" />;
    if (type === 'club') return <Shield className="h-3 w-3" />;
    return <Trophy className="h-3 w-3" />;
  };

  const typeLabel = (type: string) => {
    if (type === 'player') return 'Pemain';
    if (type === 'club') return 'Klub';
    return 'Kompetisi';
  };

  return (
    <div ref={ref} className="relative w-full max-w-sm">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari pemain, klub, kompetisi..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
          className="pl-9 pr-8 h-9"
        />
        {query && (
          <button onClick={() => { setQuery(""); setResults([]); setOpen(false); }} className="absolute right-2 top-1/2 -translate-y-1/2">
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>

      {open && (query.length >= 2) && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-popover border rounded-lg shadow-lg z-50 max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Mencari...</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Tidak ada hasil untuk "{query}"</div>
          ) : (
            <div className="py-1">
              {results.map((r) => (
                <Link
                  key={`${r.type}-${r.id}`}
                  to={getLink(r)}
                  onClick={() => { setOpen(false); setQuery(""); }}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={r.imageUrl || ""} />
                    <AvatarFallback className="text-xs">{r.name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.name}</p>
                    {r.subtitle && <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>}
                  </div>
                  <Badge variant="outline" className="text-xs gap-1 shrink-0">
                    {getIcon(r.type)}
                    {typeLabel(r.type)}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
