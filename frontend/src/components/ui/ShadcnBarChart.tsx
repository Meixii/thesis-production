"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"

import Card, { CardContent, CardDescription, CardHeader, CardTitle } from "./Card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from "./chart"

interface ShadcnBarChartProps {
  data: Array<{ [key: string]: string | number }>
  config: ChartConfig
  title?: string
  description?: string
  className?: string
  height?: number
}

export function ShadcnBarChart({
  data,
  config,
  title,
  description,
  className,
  height = 300
}: ShadcnBarChartProps) {
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-sm">No data available</p>
              <p className="text-xs text-muted-foreground">Collection data will appear here once payments are made</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Get the data keys (excluding the first key which is usually the label/key)
  const dataKeys = Object.keys(data[0]).filter(key => key !== 'month' && key !== 'name' && key !== 'label')
  
  return (
    <Card className={className}>
      <CardHeader>
        {title && <CardTitle>{title}</CardTitle>}
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-auto w-full">
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey={Object.keys(data[0])[0]} // Use the first key as the x-axis
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickMargin={8}
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
                <Bar
                  key={key}
                  dataKey={key}
                  fill={config[key]?.color || `hsl(${200 + index * 30}, 70%, 60%)`}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
} 