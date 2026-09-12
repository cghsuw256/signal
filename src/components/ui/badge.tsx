import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase",
  {
    variants: {
      tone: {
        default: "bg-surface-2 text-muted",
        accent: "bg-accent/15 text-accent",
        critical: "bg-crit/15 text-crit",
        high: "bg-high/15 text-high",
        medium: "bg-med/15 text-med",
        low: "bg-low/15 text-low",
        kev: "bg-kev/15 text-kev",
        unknown: "bg-surface-2 text-subtle",
      },
    },
    defaultVariants: { tone: "default" },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
