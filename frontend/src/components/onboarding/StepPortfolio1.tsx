import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface StepPortfolio1Props {
  data: Record<string, any>;
  onChange: (field: string, value: any) => void;
}

const StepPortfolio1 = ({ data, onChange }: StepPortfolio1Props) => (
  <div className="space-y-5">
    <div>
      <h2 className="text-xl font-bold font-['Space_Grotesk']">Your Portfolio — Part 1</h2>
      <p className="text-sm text-muted-foreground mt-1">Tell us about your most meaningful project.</p>
    </div>

    <div className="space-y-1.5">
      <Label>What did you build or do?</Label>
      <Textarea value={data.portfolio_what || ""} onChange={(e) => onChange("portfolio_what", e.target.value)} rows={3} placeholder="e.g. I built a carbon accounting platform for UK SMEs — a SaaS tool that pulls in utility bills and outputs an emissions report automatically..." />
    </div>

    <div className="space-y-1.5">
      <Label>Who was it for and why did they need it?</Label>
      <Textarea value={data.portfolio_why || ""} onChange={(e) => onChange("portfolio_why", e.target.value)} rows={3} placeholder="e.g. For operations managers at companies with 20-200 employees who were being asked by enterprise customers to produce emissions data but had no idea where to start..." />
    </div>

    <div className="space-y-1.5">
      <Label>What did you know going in? What surprised you?</Label>
      <Textarea value={data.portfolio_knew || ""} onChange={(e) => onChange("portfolio_knew", e.target.value)} rows={3} placeholder="e.g. I knew how to build multi-tenant SaaS. I had no idea how emissions calculation methodologies worked — GHG Protocol, DEFRA conversion factors..." />
    </div>

    <div className="space-y-1.5">
      <Label>What assumption turned out to be wrong?</Label>
      <Textarea value={data.portfolio_assumptions || ""} onChange={(e) => onChange("portfolio_assumptions", e.target.value)} rows={3} placeholder="e.g. I assumed operations managers would love a self-serve tool. Wrong — they wanted someone to set it up for them and hand them a number..." />
    </div>

    <div className="space-y-1.5">
      <Label>What did you do first and why?</Label>
      <Textarea value={data.portfolio_start || ""} onChange={(e) => onChange("portfolio_start", e.target.value)} rows={3} placeholder="e.g. I built the integrations with utility providers first because that was the hardest technical piece and would determine whether the whole thing was viable..." />
    </div>

    <div className="space-y-1.5">
      <Label>What was your specific role?</Label>
      <Textarea value={data.portfolio_role || ""} onChange={(e) => onChange("portfolio_role", e.target.value)} rows={3} placeholder="e.g. Solo founder. I did the engineering, user research, sales calls, customer onboarding, and pitch deck. I outsourced bookkeeping..." />
    </div>
  </div>
);

export default StepPortfolio1;
