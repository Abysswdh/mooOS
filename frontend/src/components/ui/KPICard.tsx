import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LoadingSpinner } from "./LoadingSpinner"
import { ErrorState } from "./ErrorState"

export interface KPICardProps {
  title: string
  value: React.ReactNode
  icon?: React.ReactNode
  description?: React.ReactNode
  trend?: {
    value: number
    label: string
    isPositive?: boolean
  }
  isLoading?: boolean
  error?: string | null
  className?: string
}

export function KPICard({
  title,
  value,
  icon,
  description,
  trend,
  isLoading,
  error,
  className,
}: KPICardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[60px] items-center justify-center">
            <LoadingSpinner size={20} />
          </div>
        ) : error ? (
          <div className="py-2 text-sm text-destructive">{error}</div>
        ) : (
          <div className="flex flex-col gap-1">
            <div className="text-2xl font-bold">{value}</div>
            
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            
            {trend && (
              <div className="flex items-center gap-1 text-xs">
                <span
                  className={cn(
                    "font-medium",
                    trend.isPositive === true
                      ? "text-emerald-600 dark:text-emerald-500"
                      : trend.isPositive === false
                      ? "text-destructive"
                      : "text-muted-foreground"
                  )}
                >
                  {trend.isPositive ? "+" : ""}
                  {trend.value}%
                </span>
                <span className="text-muted-foreground">{trend.label}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
