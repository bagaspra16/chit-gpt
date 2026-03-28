import * as React from "react"
import { cn } from "@/lib/utils"

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  intensity?: "low" | "medium" | "high"
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, intensity = "medium", children, ...props }, ref) => {
    
    const blurMap = {
      low: "backdrop-blur-sm bg-card/40",
      medium: "backdrop-blur-md bg-card/60",
      high: "backdrop-blur-xl bg-card/80",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "glass-panel transition-all duration-300 ease-in-out",
          blurMap[intensity],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
GlassCard.displayName = "GlassCard"
