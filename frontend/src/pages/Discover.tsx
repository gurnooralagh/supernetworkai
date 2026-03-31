import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, User, Zap, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import ConnectModal from "@/components/ConnectModal";

const BACKEND_URL = "https://supernetworkai-production.up.railway.app";

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

interface SearchProfile {
  user_id: string;
  name: string;
  headline: string | null;
  avatar_url: string | null;
  location: string | null;
  profile_summary: string | null;
}

interface PairScore {
  overall_score: number;
  best_category: string | null;
  explanation: string | null;
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

  // My Matches state
  const [matches, setMatches] = useState<Match[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connectTarget, setConnectTarget] = useState<{ id: string; name: string } | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchProfile[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [pairScores, setPairScores] = useState<Record<string, PairScore | null>>({});
  const [checkingPair, setCheckingPair] = useState<string | null>(null);

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
    setLoadingMatches(true);
    const { data, error } = await supabase
      .from("matches")
      .select("id, matched_user_id, overall_score, best_category, explanation, cofounder_score, teammate_score, top_management_score")
      .eq("user_id", uid)
      .order("overall_score", { ascending: false });

    if (error) {
      toast.error("Failed to load matches");
      setLoadingMatches(false);
      return;
    }

    if (!data || data.length === 0) {
      setMatches([]);
      setLoadingMatches(false);
      return;
    }

    const matchedIds = data.map((m) => m.matched_user_id);
    const profileResults = await Promise.all(
      matchedIds.map((id) =>
        fetch(`${BACKEND_URL}/profile/${id}`).then((r) => r.ok ? r.json() : null).catch(() => null)
      )
    );
    const profileMap = new Map(
      profileResults.filter(Boolean).map((p: any) => [p.user_id, p])
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
    setLoadingMatches(false);
  };

  const handleRefresh = async () => {
    if (!userId) return;
    setIsRefreshing(true);
    try {
      const res = await fetch(`${BACKEND_URL}/match/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_user_id: userId }),
      });
      if (!res.ok) throw new Error("Refresh failed");
      const data = await res.json();
      const newCount: number = data.new_count ?? 0;

      // Re-fetch enriched matches from DB
      await fetchMatches(userId);

      if (newCount > 0) {
        toast.success(`${newCount} new match${newCount === 1 ? "" : "es"} found!`);
      } else {
        toast.info("You're up to date — no new profiles to score.");
      }
    } catch {
      toast.error("Refresh failed. Try again.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !userId) return;

    setIsSearching(true);
    setHasSearched(true);
    setPairScores({});

    try {
      const res = await fetch(`${BACKEND_URL}/match/search-profiles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_user_id: userId, search_query: searchQuery.trim() }),
      });

      if (!res.ok) throw new Error("Search failed");

      const profiles: any[] = await res.json();
      setSearchResults(profiles.map((p) => ({
        user_id: p.user_id,
        name: p.name,
        headline: p.headline ?? null,
        avatar_url: p.avatar_url ?? null,
        location: p.location ?? null,
        profile_summary: p.profile_summary ?? null,
      })));
    } catch {
      toast.error("Search failed. Is the backend running?");
    } finally {
      setIsSearching(false);
    }
  };

  const handleCheckMatch = async (targetUserId: string) => {
    if (!userId) return;
    setCheckingPair(targetUserId);
    try {
      const res = await fetch(`${BACKEND_URL}/match/score-pair`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_user_id: userId, target_user_id: targetUserId }),
      });
      if (!res.ok) throw new Error("Scoring failed");
      const data = await res.json();
      setPairScores((prev) => ({
        ...prev,
        [targetUserId]: {
          overall_score: data.overall_score,
          best_category: data.best_category,
          explanation: data.explanation,
        },
      }));
    } catch {
      toast.error("Could not score this match. Try again.");
    } finally {
      setCheckingPair(null);
    }
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

      <main className="max-w-5xl mx-auto px-6 py-8">
        <Tabs defaultValue="my-matches">
          <TabsList className="mb-6">
            <TabsTrigger value="my-matches">My Matches</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
          </TabsList>

          {/* ── MY MATCHES TAB ── */}
          <TabsContent value="my-matches" className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight font-['Space_Grotesk']">Your Matches</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  People aligned with your goals, ranked by compatibility.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing || loadingMatches}
                className="shrink-0 mt-1"
              >
                {isRefreshing ? (
                  <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Refreshing…</>
                ) : (
                  <><RefreshCw className="h-4 w-4 mr-1.5" /> Refresh Matches</>
                )}
              </Button>
            </div>

            {loadingMatches ? (
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
                  Your matches are being computed. Check back shortly.
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Once your profile is processed, AI-ranked matches will appear here automatically.
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
          </TabsContent>

          {/* ── SEARCH TAB ── */}
          <TabsContent value="search" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight font-['Space_Grotesk']">Search Profiles</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Find people by keyword. Then tap "Check Match" on anyone you like.
              </p>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="e.g. 'technical cofounder in climate tech'"
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={isSearching || !searchQuery.trim()}>
                {isSearching ? (
                  <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Searching…</>
                ) : (
                  "Search"
                )}
              </Button>
            </form>

            {isSearching ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-xl border border-border bg-card p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                    <Skeleton className="h-12 w-full" />
                  </div>
                ))}
              </div>
            ) : hasSearched && searchResults.length === 0 ? (
              <div className="text-center py-20 space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <Search className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium font-['Space_Grotesk']">No results found</h3>
                <p className="text-sm text-muted-foreground">Try a different search query.</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {searchResults.map((profile) => (
                  <SearchProfileCard
                    key={profile.user_id}
                    profile={profile}
                    pairScore={pairScores[profile.user_id]}
                    isChecking={checkingPair === profile.user_id}
                    onCardClick={() => navigate(`/profile/${profile.user_id}`)}
                    onCheckMatch={() => handleCheckMatch(profile.user_id)}
                    onConnect={() =>
                      setConnectTarget({ id: profile.user_id, name: profile.name })
                    }
                  />
                ))}
              </div>
            ) : !hasSearched ? (
              <div className="text-center py-20 text-muted-foreground text-sm">
                Enter a keyword above to find people.
              </div>
            ) : null}
          </TabsContent>
        </Tabs>
      </main>

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
              <p className="text-sm text-muted-foreground break-words">{match.profile.headline}</p>
            )}
            {match.profile?.location && (
              <p className="text-xs text-muted-foreground/70 break-words">📍 {match.profile.location}</p>
            )}
          </div>
        </div>
        <div className="text-right shrink-0 ml-3">
          <span className="text-2xl font-bold gradient-text font-['Space_Grotesk']">
            {Math.round(match.overall_score)}%
          </span>
        </div>
      </div>

      <Badge variant="outline" className={`text-xs ${colorClass}`}>{label}</Badge>

      {match.explanation && (
        <p className="text-sm text-muted-foreground leading-relaxed">{match.explanation}</p>
      )}

      <Button
        className="w-full glow-primary"
        size="sm"
        onClick={(e) => { e.stopPropagation(); onConnect(); }}
      >
        Connect
      </Button>
    </div>
  );
};

const SearchProfileCard = ({
  profile,
  pairScore,
  isChecking,
  onCardClick,
  onCheckMatch,
  onConnect,
}: {
  profile: SearchProfile;
  pairScore: PairScore | null | undefined;
  isChecking: boolean;
  onCardClick: () => void;
  onCheckMatch: () => void;
  onConnect: () => void;
}) => {
  const category = pairScore?.best_category || "teammate";
  const label = CATEGORY_LABELS[category] || category;
  const colorClass = CATEGORY_COLORS[category] || CATEGORY_COLORS.teammate;

  return (
    <div
      onClick={onCardClick}
      className="rounded-xl border border-border bg-card p-6 space-y-4 hover:border-primary/30 transition-colors overflow-hidden cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3 overflow-hidden">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.name}
              className="h-12 w-12 rounded-full object-cover border border-border"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-foreground break-words">{profile.name}</p>
            {profile.headline && (
              <p className="text-sm text-muted-foreground break-words">{profile.headline}</p>
            )}
            {profile.location && (
              <p className="text-xs text-muted-foreground/70 break-words">📍 {profile.location}</p>
            )}
          </div>
        </div>

        {pairScore && (
          <div className="text-right shrink-0 ml-3">
            <span className="text-2xl font-bold gradient-text font-['Space_Grotesk']">
              {Math.round(pairScore.overall_score)}%
            </span>
          </div>
        )}
      </div>

      {profile.profile_summary && !pairScore && (
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
          {profile.profile_summary}
        </p>
      )}

      {pairScore && (
        <>
          <Badge variant="outline" className={`text-xs ${colorClass}`}>{label}</Badge>
          {pairScore.explanation && (
            <p className="text-sm text-muted-foreground leading-relaxed">{pairScore.explanation}</p>
          )}
        </>
      )}

      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        {!pairScore && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            disabled={isChecking}
            onClick={onCheckMatch}
          >
            {isChecking ? (
              <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Checking…</>
            ) : (
              "Check Match"
            )}
          </Button>
        )}
        <Button
          className={`glow-primary ${pairScore ? "w-full" : "flex-1"}`}
          size="sm"
          onClick={onConnect}
        >
          Connect
        </Button>
      </div>
    </div>
  );
};

export default Discover;
