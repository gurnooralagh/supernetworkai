import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface StepIkigaiProps {
  data: Record<string, any>;
  onChange: (field: string, value: any) => void;
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-3">
    <h3 className="text-sm font-semibold text-primary">{title}</h3>
    {children}
  </div>
);

const StepIkigai = ({ data, onChange }: StepIkigaiProps) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-bold font-['Space_Grotesk']">Your Ikigai</h2>
      <p className="text-sm text-muted-foreground mt-1">What drives you? Answer in your own words.</p>
    </div>

    <Section title="What do you love?">
      <div className="space-y-1.5">
        <Label>Passion 1</Label>
        <Textarea value={data.ikigai_passion_1 || ""} onChange={(e) => onChange("ikigai_passion_1", e.target.value)} rows={2} placeholder="e.g. I can talk about climate tech and carbon markets for hours without getting tired of it..." />
      </div>
      <div className="space-y-1.5">
        <Label>Passion 2</Label>
        <Textarea value={data.ikigai_passion_2 || ""} onChange={(e) => onChange("ikigai_passion_2", e.target.value)} rows={2} placeholder="e.g. The moment a product I built solves a real problem for a real person — that feeling never gets old..." />
      </div>
    </Section>

    <Section title="What are you good at?">
      <div className="space-y-1.5">
        <Label>Strength 1</Label>
        <Textarea value={data.ikigai_strength_1 || ""} onChange={(e) => onChange("ikigai_strength_1", e.target.value)} rows={2} placeholder="e.g. People come to me when they need a complex system designed from scratch — architecture, APIs, data models..." />
      </div>
      <div className="space-y-1.5">
        <Label>Strength 2</Label>
        <Textarea value={data.ikigai_strength_2 || ""} onChange={(e) => onChange("ikigai_strength_2", e.target.value)} rows={2} placeholder="e.g. I can write clean production code fast and ship things that don't fall over at scale..." />
      </div>
    </Section>

    <Section title="What does the world need?">
      <div className="space-y-1.5">
        <Label>Mission 1</Label>
        <Textarea value={data.ikigai_mission_1 || ""} onChange={(e) => onChange("ikigai_mission_1", e.target.value)} rows={2} placeholder="e.g. The fact that most small businesses have no idea what their carbon footprint is makes me genuinely angry..." />
      </div>
      <div className="space-y-1.5">
        <Label>Mission 2</Label>
        <Textarea value={data.ikigai_mission_2 || ""} onChange={(e) => onChange("ikigai_mission_2", e.target.value)} rows={2} placeholder="e.g. I want this technology to be as standard and accessible as accounting software..." />
      </div>
    </Section>

    <Section title="What can you be paid for?">
      <div className="space-y-1.5">
        <Label>Vocation 1</Label>
        <Textarea value={data.ikigai_vocation_1 || ""} onChange={(e) => onChange("ikigai_vocation_1", e.target.value)} rows={2} placeholder="e.g. I've been paid as a backend engineer at Stripe and Monzo for the past 4 years..." />
      </div>
      <div className="space-y-1.5">
        <Label>Vocation 2</Label>
        <Textarea value={data.ikigai_vocation_2 || ""} onChange={(e) => onChange("ikigai_vocation_2", e.target.value)} rows={2} placeholder="e.g. Someone would hire me today to design a data pipeline, architect a multi-tenant SaaS backend, or lead a platform team..." />
      </div>
    </Section>
  </div>
);

export default StepIkigai;
