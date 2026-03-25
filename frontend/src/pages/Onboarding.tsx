import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import ProgressBar from "@/components/onboarding/ProgressBar";
import StepBasics from "@/components/onboarding/StepBasics";
import StepIkigai from "@/components/onboarding/StepIkigai";
import StepCollaboration from "@/components/onboarding/StepCollaboration";
import StepPortfolio1 from "@/components/onboarding/StepPortfolio1";
import StepPortfolio2 from "@/components/onboarding/StepPortfolio2";
import StepReview from "@/components/onboarding/StepReview";

const BACKEND_URL = "https://supernetworkai-production.up.railway.app";

const Onboarding = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [profileSummary, setProfileSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      setUserId(session.user.id);
      // Pre-fill contact_email so Connect emails can reach the user
      if (session.user.email) {
        setFormData((prev) => ({ ...prev, contact_email: session.user.email }));
      }
    };
    checkAuth();
  }, [navigate]);

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const next = () => {
    if (step === 0 && !formData.name?.trim()) {
      toast.error("Name is required");
      return;
    }
    if (step < 5) setStep(step + 1);
  };

  const back = () => {
    if (step > 0) setStep(step - 1);
  };

  // When entering step 5 (Review), save profile and fetch summary
  useEffect(() => {
    if (step === 5 && userId) {
      console.log("[Onboarding] Step 5 reached with userId:", userId, "— calling saveAndFetchSummary");
      saveAndFetchSummary();
    }
  }, [step, userId]);

  const saveAndFetchSummary = async () => {
    if (!userId) return;
    setSummaryLoading(true);
    try {
      // Step 1: Save profile data
      const saveRes = await fetch(`${BACKEND_URL}/profile/?user_id=${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(formData),
      });
      if (!saveRes.ok) throw new Error("Failed to save profile");
      const saveData = await saveRes.json();
      console.log("[Onboarding] /profile response:", saveData);

      // Step 2: Trigger AI summary generation
      const summaryRes = await fetch(`${BACKEND_URL}/profile/${userId}/confirm-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ profile_summary: "" }),
      });
      if (!summaryRes.ok) throw new Error("Failed to generate summary");

      const summaryData = await summaryRes.json();
      console.log("[Onboarding] /confirm-summary response:", summaryData);
      const summaryValue = summaryData.profile_summary || "";
      console.log("[Onboarding] Setting textarea to:", summaryValue);
      setProfileSummary(summaryValue);
    } catch {
      toast.error("Failed to generate profile summary. Is the backend running?");
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!userId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/profile/${userId}/confirm-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ profile_summary: profileSummary }),
      });
      if (!res.ok) throw new Error("Failed to confirm summary");

      toast.success("Profile confirmed! Finding your matches…");
      navigate("/discover");
    } catch {
      toast.error("Failed to confirm profile. Is the backend running?");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0: return <StepBasics data={formData} onChange={updateField} />;
      case 1: return <StepIkigai data={formData} onChange={updateField} />;
      case 2: return <StepCollaboration data={formData} onChange={updateField} />;
      case 3: return <StepPortfolio1 data={formData} onChange={updateField} />;
      case 4: return <StepPortfolio2 data={formData} onChange={updateField} />;
      case 5: return <StepReview summary={profileSummary} onSummaryChange={setProfileSummary} loading={summaryLoading} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <h1 className="text-xl font-semibold tracking-tight font-['Space_Grotesk']">
            <span className="gradient-text">Super</span>NetworkAI
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        <ProgressBar currentStep={step} />

        {renderStep()}

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button
            variant="ghost"
            onClick={back}
            disabled={step === 0}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>

          {step < 5 ? (
            <Button onClick={next} className="gap-1 glow-primary">
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleConfirm}
              disabled={submitting || summaryLoading}
              className="glow-primary"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Confirming…
                </>
              ) : (
                "Confirm and Find Matches"
              )}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
};

export default Onboarding;
