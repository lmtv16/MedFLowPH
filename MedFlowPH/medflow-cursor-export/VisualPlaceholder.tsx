// VisualPlaceholder.tsx — styled chart/image placeholder card
// Drop into: src/components/ui/VisualPlaceholder.tsx
// Replace with <img src="..."> when your actual PNG assets are ready.

import { BarChart2, Image as ImageIcon, Table2 } from "lucide-react";

type IconType = "chart" | "image" | "table";

interface VisualPlaceholderProps {
  /** The PNG filename from your /public/results/ folder */
  filename: string;
  /** Human-readable description of what the chart shows */
  description: string;
  icon?: IconType;
  /** Optional CSS classes for sizing overrides */
  className?: string;
}

const icons: Record<IconType, typeof BarChart2> = {
  chart: BarChart2,
  image: ImageIcon,
  table: Table2,
};

export function VisualPlaceholder({
  filename,
  description,
  icon = "chart",
  className = "",
}: VisualPlaceholderProps) {
  const Icon = icons[icon];

  return (
    <div
      className={`w-full rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 dark:bg-primary/10
        p-8 flex flex-col items-center justify-center text-center my-6
        transition-colors hover:bg-primary/10 hover:border-primary/40 ${className}`}
    >
      {/* Icon circle */}
      <div className="w-14 h-14 rounded-full bg-background flex items-center justify-center mb-4 shadow-sm text-primary">
        <Icon className="w-7 h-7 opacity-75" />
      </div>

      {/* Filename badge */}
      <code className="text-xs font-mono text-muted-foreground bg-background px-2.5 py-1 rounded-md mb-3 border border-border/60">
        {filename}
      </code>

      {/* Description */}
      <p className="text-sm text-foreground/80 max-w-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}
