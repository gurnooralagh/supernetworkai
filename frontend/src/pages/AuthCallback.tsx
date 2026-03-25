import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

const BACKEND_URL = "https://supernetworkai-production.up.railway.app";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      // Supabase processes the URL hash automatically; wait for the session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Give it a moment for the hash to be processed
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const { data: { session: retried } } = await supabase.auth.getSession();
        if (!retried) {
          navigate("/login");
          return;
        }
      }

      const userId = session?.user.id ?? (await supabase.auth.getSession()).data.session?.user.id;
      if (!userId) {
        navigate("/login");
        return;
      }

      // Check if profile exists
      try {
        const res = await fetch(`${BACKEND_URL}/profile/${userId}`);
        if (res.ok) {
          navigate("/discover");
        } else {
          navigate("/onboarding");
        }
      } catch {
        navigate("/onboarding");
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground text-sm">Confirming your account…</p>
    </div>
  );
};

export default AuthCallback;
