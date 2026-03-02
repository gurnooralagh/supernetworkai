import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 md:px-12">
        <span className="font-display text-xl font-bold tracking-tight">
          Super<span className="gradient-text">Network</span>AI
        </span>
        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm">Log in</Button>
          </Link>
          <Link to="/signup">
            <Button size="sm">Sign up</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="animate-fade-in max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI-Powered Matchmaking
          </div>

          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            Discover people aligned
            <br />
            <span className="gradient-text">with your goals.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
            Find cofounders, collaborators, teammates, and top management who share
            your motivations, skills, and ambitions — using AI-powered matching.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link to="/signup">
              <Button size="lg" className="glow-primary gap-2 px-6">
                Create Your Profile
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="px-6">
                Explore Matches
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} SuperNetworkAI
      </footer>
    </div>
  );
};

export default Index;
