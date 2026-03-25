import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

const BACKEND_URL = "https://supernetworkai-production.up.railway.app";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for Supabase to process the confirmation link (hash or PKCE code)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          subscription.unsubscribe();
          try {
            const res = await fetch(`${BACKEND_URL}/profile/${session.user.id}`);
            navigate(res.ok ? "/discover" : "/onboarding", { replace: true });
          } catch {
            navigate("/onboarding", { replace: true });
          }
        }
      }
    );

    // Also check if already signed in (e.g. session already processed)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        subscription.unsubscribe();
        fetch(`${BACKEND_URL}/profile/${session.user.id}`)
          .then((res) => navigate(res.ok ? "/discover" : "/onboarding", { replace: true }))
          .catch(() => navigate("/onboarding", { replace: true }));
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground text-sm">Confirming your account…</p>
    </div>
  );
};

export default AuthCallback;
