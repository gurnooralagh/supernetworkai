import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface StepCollaborationProps {
  data: Record<string, any>;
  onChange: (field: string, value: any) => void;
}

const StepCollaboration = ({ data, onChange }: StepCollaborationProps) => (
  <div className="space-y-5">
    <div>
      <h2 className="text-xl font-bold font-['Space_Grotesk']">How You Collaborate</h2>
      <p className="text-sm text-muted-foreground mt-1">Help us understand your teamwork style.</p>
    </div>

    <div className="space-y-1.5">
      <Label>Who do you work best with?</Label>
      <Textarea value={data.collaboration_fit_1 || ""} onChange={(e) => onChange("collaboration_fit_1", e.target.value)} rows={3} placeholder="e.g. I work best with people who can hold a high bar without being precious about it. I want someone who will push back on my decisions if they see a better way..." />
    </div>

    <div className="space-y-1.5">
      <Label>What frustrates you most in a team?</Label>
      <Textarea value={data.collaboration_fit_2 || ""} onChange={(e) => onChange("collaboration_fit_2", e.target.value)} rows={3} placeholder="e.g. Vague ownership and 'someone should probably handle that' culture frustrates me most. I like it when people clearly own things and drive them to done..." />
    </div>

    <div className="space-y-1.5">
      <Label>What does successful collaboration look like for you?</Label>
      <Textarea value={data.collaboration_fit_3 || ""} onChange={(e) => onChange("collaboration_fit_3", e.target.value)} rows={3} placeholder="e.g. We disagree in private, commit in public, and move fast. Async by default, sync when something is genuinely blocked..." />
    </div>
  </div>
);

export default StepCollaboration;
