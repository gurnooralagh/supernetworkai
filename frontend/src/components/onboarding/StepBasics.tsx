import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SkillsInput from "./SkillsInput";

interface StepBasicsProps {
  data: Record<string, any>;
  onChange: (field: string, value: any) => void;
}

const StepBasics = ({ data, onChange }: StepBasicsProps) => (
  <div className="space-y-5">
    <div>
      <h2 className="text-xl font-bold font-['Space_Grotesk']">The Basics</h2>
      <p className="text-sm text-muted-foreground mt-1">Tell us who you are.</p>
    </div>

    <div className="space-y-1.5">
      <Label>Name *</Label>
      <Input value={data.name || ""} onChange={(e) => onChange("name", e.target.value)} placeholder="Your full name" required />
    </div>

    <div className="space-y-1.5">
      <Label>Headline</Label>
      <Input value={data.headline || ""} onChange={(e) => onChange("headline", e.target.value)} placeholder="e.g. AI Engineer & Climate Tech Builder" />
    </div>

    <div className="space-y-1.5">
      <Label>Bio</Label>
      <Textarea value={data.bio || ""} onChange={(e) => onChange("bio", e.target.value)} placeholder="A short summary about yourself" rows={3} />
    </div>

    <div className="space-y-1.5">
      <Label>Location</Label>
      <Input value={data.location || ""} onChange={(e) => onChange("location", e.target.value)} placeholder="e.g. San Francisco, CA" />
    </div>

    <div className="space-y-1.5">
      <Label>Intent</Label>
      <Select value={data.intent || ""} onValueChange={(v) => onChange("intent", v)}>
        <SelectTrigger><SelectValue placeholder="What are you looking for?" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="cofounder">Cofounder</SelectItem>
          <SelectItem value="teammate">Teammate</SelectItem>
          <SelectItem value="top_management">Top Management</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div className="space-y-1.5">
      <Label>Availability</Label>
      <Input value={data.availability || ""} onChange={(e) => onChange("availability", e.target.value)} placeholder="e.g. Full-time, Part-time, Weekends" />
    </div>

    <div className="space-y-1.5">
      <Label>Working Style</Label>
      <Select value={data.working_style || ""} onValueChange={(v) => onChange("working_style", v)}>
        <SelectTrigger><SelectValue placeholder="How do you prefer to work?" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="async">Async</SelectItem>
          <SelectItem value="hybrid">Hybrid</SelectItem>
          <SelectItem value="sync">Sync</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div className="space-y-1.5">
      <Label>LinkedIn URL</Label>
      <Input value={data.linkedin_url || ""} onChange={(e) => onChange("linkedin_url", e.target.value)} placeholder="https://linkedin.com/in/yourprofile" />
    </div>

    <div className="space-y-1.5">
      <Label>Skills</Label>
      <SkillsInput skills={data.skills || []} onChange={(v) => onChange("skills", v)} />
    </div>
  </div>
);

export default StepBasics;
