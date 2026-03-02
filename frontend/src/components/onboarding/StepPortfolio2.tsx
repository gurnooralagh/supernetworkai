import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface StepPortfolio2Props {
  data: Record<string, any>;
  onChange: (field: string, value: any) => void;
}

const StepPortfolio2 = ({ data, onChange }: StepPortfolio2Props) => (
  <div className="space-y-5">
    <div>
      <h2 className="text-xl font-bold font-['Space_Grotesk']">Your Portfolio — Part 2</h2>
      <p className="text-sm text-muted-foreground mt-1">Reflect on the decisions and lessons.</p>
    </div>

    <div className="space-y-1.5">
      <Label>What was the hardest decision you made?</Label>
      <Textarea value={data.portfolio_decision || ""} onChange={(e) => onChange("portfolio_decision", e.target.value)} rows={3} placeholder="e.g. Deciding to cut the self-serve tier entirely after three months. I lost some customers but retention for hands-on customers was 100% vs 40% for self-serve..." />
    </div>

    <div className="space-y-1.5">
      <Label>What would you do differently?</Label>
      <Textarea value={data.portfolio_differently || ""} onChange={(e) => onChange("portfolio_differently", e.target.value)} rows={3} placeholder="e.g. I would talk to procurement teams at enterprise companies first, not ops managers at SMEs. The real buyer is the person demanding the data downstream..." />
    </div>

    <div className="space-y-1.5">
      <Label>What is the most important thing you learned?</Label>
      <Textarea value={data.portfolio_learning || ""} onChange={(e) => onChange("portfolio_learning", e.target.value)} rows={3} placeholder="e.g. Distribution is the product. My calculation engine was technically excellent but technical excellence doesn't get you customers..." />
    </div>

    <div className="space-y-1.5">
      <Label>How did it change how you think?</Label>
      <Textarea value={data.portfolio_thinking || ""} onChange={(e) => onChange("portfolio_thinking", e.target.value)} rows={3} placeholder="e.g. I now start every new feature by asking: who has the pain, who has the budget, and who makes the decision? These are sometimes three different people..." />
    </div>

    <div className="space-y-1.5">
      <Label>How do you behave under pressure?</Label>
      <Textarea value={data.portfolio_pressure || ""} onChange={(e) => onChange("portfolio_pressure", e.target.value)} rows={3} placeholder="e.g. Under pressure I get very focused and ship fast. The risk is I go quiet and build in isolation. I've started forcing myself to share work-in-progress even when it's embarrassing..." />
    </div>
  </div>
);

export default StepPortfolio2;
