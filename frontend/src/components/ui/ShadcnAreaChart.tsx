"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts"

import Card, { CardContent, CardDescription, CardHeader, CardTitle } from "./Card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Select"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "./chart"

interface ShadcnAreaChartProps {
  data: Array<{ [key: string]: string | number }>
  config: ChartConfig
  title?: string
  description?: string
  className?: string
  height?: number
  showTimeRange?: boolean
}

export function ShadcnAreaChart({
  data,
  config,
  title,
  description,
  className,
  height = 300,
  showTimeRange = false
}: ShadcnAreaChartProps) {
  const [timeRange, setTimeRange] = React.useState("90d")

  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
              <p className="text-sm">No data available</p>
              <p className="text-xs text-muted-foreground">Chart data will appear here once available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Filter data based on time range if enabled
  const filteredData = showTimeRange ? data.filter((item) => {
    const dateKey = Object.keys(item).find(key => 
      typeof item[key] === 'string' && item[key].toString().includes('-')
    )
    if (!dateKey) return true
    
    const date = new Date(item[dateKey] as string)
    const referenceDate = new Date()
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  }) : data

  // Get the data keys (excluding the first key which is usually the label/key)
  const dataKeys = Object.keys(data[0]).filter(key => key !== 'date' && key !== 'month' && key !== 'name' && key !== 'label')
  
  return (
    <Card className={className}>
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {showTimeRange && (
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
              aria-label="Select a time range"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        )}
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={config} className="aspect-auto w-full">
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={filteredData}>
              <defs>
                {dataKeys.map((key, index) => (
                  <linearGradient key={key} id={`fill${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={config[key]?.color || `var(--chart-${(index % 3) + 1})`}
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor={config[key]?.color || `var(--chart-${(index % 3) + 1})`}
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey={Object.keys(data[0])[0]} // Use the first key as the x-axis
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickMargin={8}
                minTickGap={32}
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                tickFormatter={(value) => {
                  // If it's a date, format it nicely
                  if (typeof value === 'string' && value.includes('-')) {
                    const date = new Date(value)
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                  return value
                }}
              />
              <YAxis
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickMargin={8}
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                tickFormatter={(value) => {
                  return new Intl.NumberFormat("en-PH", {
                    style: "currency",
                    currency: "PHP",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(value)
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))'
                }}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      if (typeof value === 'string' && value.includes('-')) {
                        const date = new Date(value)
                        return date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      }
                      return value
                    }}
                    indicator="dot"
                  />
                }
              />
              {dataKeys.map((key, index) => (
                <Area
                  key={key}
                  dataKey={key}
                  type="natural"
                  fill={`url(#fill${key})`}
                  stroke={config[key]?.color || `var(--chart-${(index % 3) + 1})`}
                  stackId="a"
                />
              ))}
              <Legend 
                content={<ChartLegendContent />} 
                wrapperStyle={{
                  color: 'hsl(var(--foreground))',
                  fontSize: '12px'
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
} 