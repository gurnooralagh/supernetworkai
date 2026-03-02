import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MessageSquare, User } from "lucide-react";
import ConnectModal from "@/components/ConnectModal";

const INTENT_LABELS: Record<string, string> = {
  cofounder: "Cofounder",
  teammate: "Teammate",
  top_management: "Top Management",
};

const Profile = () => {
  const { userId: paramUserId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectOpen, setConnectOpen] = useState(false);

  const isOwnProfile = paramUserId === "me" || paramUserId === currentUserId;

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      setCurrentUserId(session.user.id);

      const targetId = paramUserId === "me" ? session.user.id : paramUserId;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", targetId)
        .single();

      if (error || !data) {
        setProfile(null);
      } else {
        setProfile(data);
      }
      setLoading(false);
    };
    init();
  }, [paramUserId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-6 py-4">
            <Skeleton className="h-6 w-40" />
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-32 w-full" />
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <User className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Profile not found.</p>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Go back
          </Button>
        </div>
      </div>
    );
  }

  const skills: string[] = Array.isArray(profile.skills)
    ? profile.skills
    : typeof profile.skills === "string"
    ? JSON.parse(profile.skills || "[]")
    : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight font-['Space_Grotesk']">
            <span className="gradient-text">Super</span>NetworkAI
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/discover")}>
              Discover
            </Button>
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

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* Back */}
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1 -ml-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        {/* Top */}
        <div className="space-y-2">
          <h2 className="text-3xl font-bold font-['Space_Grotesk'] tracking-tight">{profile.name}</h2>
          {profile.headline && <p className="text-muted-foreground">{profile.headline}</p>}
          {profile.location && <p className="text-sm text-muted-foreground/70">📍 {profile.location}</p>}
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-2">
          {profile.intent && (
            <Badge variant="outline" className="text-xs">{INTENT_LABELS[profile.intent] || profile.intent}</Badge>
          )}
          {profile.working_style && (
            <Badge variant="secondary" className="text-xs capitalize">{profile.working_style}</Badge>
          )}
          {profile.availability && (
            <Badge variant="secondary" className="text-xs">{profile.availability}</Badge>
          )}
        </div>

        {/* AI Summary */}
        {profile.profile_summary && (
          <div className="rounded-lg border border-border bg-card p-5 space-y-2">
            <h3 className="text-lg font-semibold font-['Space_Grotesk'] text-primary">About</h3>
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{profile.profile_summary}</p>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {skills.map((s: string) => (
              <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
            ))}
          </div>
        )}

        {/* LinkedIn */}
        {profile.linkedin_url && (
          <div>
            <a
              href={profile.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              View LinkedIn Profile →
            </a>
          </div>
        )}
      </main>

      {/* Connect button for other users */}
      {!isOwnProfile && currentUserId && (
        <>
          <div className="fixed bottom-6 right-6 z-20">
            <Button onClick={() => setConnectOpen(true)} size="lg" className="glow-primary gap-2 shadow-lg">
              <MessageSquare className="h-4 w-4" /> Connect
            </Button>
          </div>
          <ConnectModal
            open={connectOpen}
            onOpenChange={setConnectOpen}
            requesterId={currentUserId}
            receiverId={profile.user_id}
            receiverName={profile.name}
          />
        </>
      )}
    </div>
  );
};

export default Profile;
