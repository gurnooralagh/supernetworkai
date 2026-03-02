import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import AuthLayout from "@/components/AuthLayout";

const VerifyEmail = () => {
  return (
    <AuthLayout title="Check your inbox" subtitle="We sent you a confirmation email">
      <div className="flex flex-col items-center space-y-5 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Click the link in the email to verify your account.
          <br />
          If you don't see it, check your spam folder.
        </p>
        <Link to="/login">
          <Button variant="outline">Back to login</Button>
        </Link>
      </div>
    </AuthLayout>
  );
};

export default VerifyEmail;
