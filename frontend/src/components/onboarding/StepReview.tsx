import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

interface StepReviewProps {
  summary: string;
  onSummaryChange: (value: string) => void;
  loading: boolean;
}

const StepReview = ({ summary, loading, onSummaryChange }: StepReviewProps) => (
  <div className="space-y-5">
    <div>
      <h2 className="text-xl font-bold font-['Space_Grotesk']">Review & Confirm</h2>
      <p className="text-sm text-muted-foreground mt-1">
        This is your AI-generated profile summary. Edit it if you'd like, then confirm to start matching.
      </p>
    </div>

    {loading ? (
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/6" />
      </div>
    ) : (
      <div className="space-y-1.5">
        <Label>Profile Summary</Label>
        <Textarea
          value={summary}
          onChange={(e) => onSummaryChange(e.target.value)}
          rows={10}
          className="text-sm leading-relaxed"
        />
      </div>
    )}
  </div>
);

export default StepReview;
