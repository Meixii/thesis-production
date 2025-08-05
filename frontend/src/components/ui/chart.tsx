"use client"

import * as React from "react"
import { Bar, BarChart, Line, LineChart, Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"

import { cn } from "../../lib/utils"

interface ChartConfig {
  [key: string]: {
    label: string
    color?: string
  }
}

interface ChartContainerProps {
  config: ChartConfig
  children: React.ReactNode
  className?: string
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  ChartContainerProps
>(({ config, children, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("space-y-4", className)}
      style={
        {
          "--color-desktop": "hsl(var(--chart-1))",
          "--color-mobile": "hsl(var(--chart-2))",
          "--color-tablet": "hsl(var(--chart-3))",
        } as React.CSSProperties
      }
      {...props}
    >
      {children}
    </div>
  )
})
ChartContainer.displayName = "ChartContainer"

interface ChartTooltipProps {
  children: React.ReactNode
  className?: string
}

const ChartTooltip = React.forwardRef<
  HTMLDivElement,
  ChartTooltipProps
>(({ children, className, ...props }, ref) => {
  return (
    <Tooltip
      ref={ref}
      className={cn("rounded-lg border bg-background p-2 shadow-sm", className)}
      {...props}
    >
      {children}
    </Tooltip>
  )
})
ChartTooltip.displayName = "ChartTooltip"

interface ChartTooltipContentProps {
  active?: boolean
  payload?: any[]
  label?: string
  labelFormatter?: (value: string) => string
  indicator?: "dot" | "line"
}

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  ChartTooltipContentProps
>(({ active, payload, label, labelFormatter, indicator = "dot", ...props }, ref) => {
  if (!active || !payload) {
    return null
  }

  return (
    <div
      ref={ref}
      className="space-y-2"
      {...props}
    >
      {label && (
        <p className="text-sm font-medium">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((item: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            {indicator === "dot" && (
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
            )}
            {indicator === "line" && (
              <div
                className="h-0.5 w-4"
                style={{ backgroundColor: item.color }}
              />
            )}
            <span className="text-sm text-muted-foreground">
              {item.name}:
            </span>
            <span className="text-sm font-medium">
              {typeof item.value === "number"
                ? new Intl.NumberFormat("en-PH", {
                    style: "currency",
                    currency: "PHP"
                  }).format(item.value)
                : item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
})
ChartTooltipContent.displayName = "ChartTooltipContent"

interface ChartLegendProps {
  children: React.ReactNode
  className?: string
}

const ChartLegend = React.forwardRef<
  HTMLDivElement,
  ChartLegendProps
>(({ children, className, ...props }, ref) => {
  return (
    <Legend
      ref={ref}
      className={cn("flex items-center justify-center gap-4", className)}
      {...props}
    >
      {children}
    </Legend>
  )
})
ChartLegend.displayName = "ChartLegend"

interface ChartLegendContentProps {
  payload?: any[]
}

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  ChartLegendContentProps
>(({ payload, ...props }, ref) => {
  if (!payload) {
    return null
  }

  return (
    <div
      ref={ref}
      className="flex items-center gap-4"
      {...props}
    >
      {payload.map((item: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-sm text-muted-foreground">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  )
})
ChartLegendContent.displayName = "ChartLegendContent"

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} 