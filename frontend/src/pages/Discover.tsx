import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, X, User, Zap } from "lucide-react";
import { toast } from "sonner";
import ConnectModal from "@/components/ConnectModal";

interface MatchProfile {
  id: string;
  name: string;
  headline: string | null;
  avatar_url: string | null;
  location: string | null;
}

interface Match {
  id: string;
  matched_user_id: string;
  overall_score: number;
  best_category: string | null;
  explanation: string | null;
  cofounder_score: number | null;
  teammate_score: number | null;
  top_management_score: number | null;
  profile: MatchProfile | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  cofounder: "Cofounder",
  teammate: "Teammate",
  top_management: "Top Management",
};

const CATEGORY_COLORS: Record<string, string> = {
  cofounder: "bg-primary/20 text-primary border-primary/30",
  teammate: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  top_management: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

const Discover = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [connectTarget, setConnectTarget] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      setUserId(session.user.id);
      fetchMatches(session.user.id);
    };
    checkAuth();
  }, [navigate]);

  const fetchMatches = async (uid: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("matches")
      .select("id, matched_user_id, overall_score, best_category, explanation, cofounder_score, teammate_score, top_management_score")
      .eq("user_id", uid)
      .order("overall_score", { ascending: false });

    if (error) {
      toast.error("Failed to load matches");
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setMatches([]);
      setLoading(false);
      return;
    }

    const matchedIds = data.map((m) => m.matched_user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, name, headline, avatar_url, location")
      .in("user_id", matchedIds);

    if (profilesError) {
      console.error("Profiles fetch error:", profilesError);
    }

    const profileMap = new Map(
      (profiles || []).map((p: any) => [p.user_id, p])
    );

    const enriched: Match[] = data.map((m) => ({
      ...m,
      profile: profileMap.get(m.matched_user_id)
        ? {
            id: m.matched_user_id,
            name: profileMap.get(m.matched_user_id)!.name,
            headline: profileMap.get(m.matched_user_id)!.headline,
            avatar_url: profileMap.get(m.matched_user_id)!.avatar_url,
            location: profileMap.get(m.matched_user_id)!.location,
          }
        : null,
    }));

    setMatches(enriched);
    setLoading(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !userId) return;

    setIsSearching(true);
    setIsSearchActive(true);

    try {
      const res = await fetch("https://supernetworkai-production.up.railway.app/match/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_user_id: userId,
          search_query: searchQuery.trim(),
        }),
      });

      if (!res.ok) throw new Error("Search failed");

      const results = await res.json();

      const matchedIds = results.map((r: any) => r.matched_user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, headline, avatar_url")
        .in("user_id", matchedIds);

      const profileMap = new Map(
        (profiles || []).map((p: any) => [p.user_id, p])
      );

      const enriched: Match[] = results.map((r: any) => ({
        ...r,
        profile: profileMap.get(r.matched_user_id)
          ? {
              id: r.matched_user_id,
              name: profileMap.get(r.matched_user_id)!.name,
              headline: profileMap.get(r.matched_user_id)!.headline,
              avatar_url: profileMap.get(r.matched_user_id)!.avatar_url,
            }
          : null,
      }));

      setMatches(enriched);
    } catch {
      toast.error("Search failed. Is the backend running?");
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setIsSearchActive(false);
    if (userId) fetchMatches(userId);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight font-['Space_Grotesk']">
            <span className="gradient-text">Super</span>NetworkAI
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/profile/me")}>
              My Profile
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate("/login");
              }}
              className="text-muted-foreground"
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Title + Search */}
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight font-['Space_Grotesk']">
              Your Matches
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              People aligned with your goals, ranked by compatibility.
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search e.g. 'technical cofounder in climate tech'"
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={isSearching || !searchQuery.trim()}>
              {isSearching ? "Searching…" : "Search"}
            </Button>
            {isSearchActive && (
              <Button type="button" variant="outline" onClick={clearSearch}>
                <X className="h-4 w-4 mr-1" /> Clear
              </Button>
            )}
          </form>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Zap className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium font-['Space_Grotesk']">
              {isSearchActive
                ? "No results found"
                : "Your matches are being computed. Check back shortly."}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {isSearchActive
                ? "Try a different search query."
                : "Once your profile is processed, AI-ranked matches will appear here automatically."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {matches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                onCardClick={() => navigate(`/profile/${match.matched_user_id}`)}
                onConnect={() =>
                  setConnectTarget({
                    id: match.matched_user_id,
                    name: match.profile?.name || "Unknown",
                  })
                }
              />
            ))}
          </div>
        )}
      </main>

      {/* Connect modal */}
      {connectTarget && userId && (
        <ConnectModal
          open={!!connectTarget}
          onOpenChange={(open) => { if (!open) setConnectTarget(null); }}
          requesterId={userId}
          receiverId={connectTarget.id}
          receiverName={connectTarget.name}
        />
      )}
    </div>
  );
};

const MatchCard = ({
  match,
  onCardClick,
  onConnect,
}: {
  match: Match;
  onCardClick: () => void;
  onConnect: () => void;
}) => {
  const category = match.best_category || "teammate";
  const label = CATEGORY_LABELS[category] || category;
  const colorClass = CATEGORY_COLORS[category] || CATEGORY_COLORS.teammate;

  return (
    <div
      onClick={onCardClick}
      className="rounded-xl border border-border bg-card p-6 space-y-4 hover:border-primary/30 transition-colors overflow-hidden cursor-pointer"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 overflow-hidden">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {match.profile?.avatar_url ? (
            <img
              src={match.profile.avatar_url}
              alt={match.profile.name}
              className="h-12 w-12 rounded-full object-cover border border-border"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-foreground break-words">
              {match.profile?.name || "Unknown"}
            </p>
            {match.profile?.headline && (
              <p className="text-sm text-muted-foreground break-words">
                {match.profile.headline}
              </p>
            )}
            {match.profile?.location && (
              <p className="text-xs text-muted-foreground/70 break-words">
                📍 {match.profile.location}
              </p>
            )}
          </div>
        </div>

        <div className="text-right shrink-0 ml-3">
          <span className="text-2xl font-bold gradient-text font-['Space_Grotesk']">
            {Math.round(match.overall_score)}%
          </span>
        </div>
      </div>

      {/* Badge */}
      <Badge variant="outline" className={`text-xs ${colorClass}`}>
        {label}
      </Badge>

      {/* Explanation */}
      {match.explanation && (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {match.explanation}
        </p>
      )}

      {/* Connect */}
      <Button
        className="w-full glow-primary"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onConnect();
        }}
      >
        Connect
      </Button>
    </div>
  );
};

export default Discover;
