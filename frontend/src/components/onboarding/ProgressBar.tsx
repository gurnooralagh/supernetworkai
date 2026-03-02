import { cn } from "@/lib/utils";

const STEP_LABELS = [
  "Basics",
  "Ikigai",
  "Collaboration",
  "Portfolio 1",
  "Portfolio 2",
  "Review",
];

interface ProgressBarProps {
  currentStep: number;
}

const ProgressBar = ({ currentStep }: ProgressBarProps) => {
  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-xs text-muted-foreground">
        {STEP_LABELS.map((label, i) => (
          <span
            key={label}
            className={cn(
              "transition-colors",
              i <= currentStep ? "text-primary font-medium" : ""
            )}
          >
            {label}
          </span>
        ))}
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${((currentStep + 1) / STEP_LABELS.length) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
