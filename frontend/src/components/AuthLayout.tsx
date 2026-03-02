import { Link } from "react-router-dom";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 text-center">
        <Link to="/" className="font-display text-2xl font-bold tracking-tight">
          Super<span className="gradient-text">Network</span>AI
        </Link>
      </div>
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="font-display text-2xl font-semibold">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
