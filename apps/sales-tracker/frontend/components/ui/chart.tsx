"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"
import { cn } from "@/lib/utils"

export type ChartConfig = {
  [key: string]: {
    label?: React.ReactNode
    color?: string
    icon?: React.ComponentType<{ className?: string }>
  }
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }
  return context
}

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const entries = Object.entries(config).filter(([, value]) => value.color)

  if (!entries.length) return null

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          [data-chart="${id}"] {
            ${entries
              .map(([key, value]) => `--color-${key}: ${value.color};`)
              .join("\n")}
          }
        `,
      }}
    />
  )
}

export function ChartContainer({
  id,
  className,
  children,
  config,
}: React.ComponentProps<"div"> & {
  config: ChartConfig
}) {
  const uniqueId = React.useId().replace(/:/g, "")
  const chartId = `chart-${id || uniqueId}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        className={cn("h-[260px] w-full text-xs", className)}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

export const ChartTooltip = RechartsPrimitive.Tooltip

type TooltipPayloadItem = {
  dataKey?: string | number
  name?: React.ReactNode
  value?: React.ReactNode
  color?: string
  payload?: Record<string, unknown>
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  className,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  formatter,
  labelFormatter,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: React.ReactNode
  className?: string
  formatter?: (
    value: React.ReactNode,
    name: React.ReactNode,
    item: TooltipPayloadItem,
    index: number,
    payload: Record<string, unknown> | undefined,
  ) => React.ReactNode
  labelFormatter?: (
    label: React.ReactNode,
    payload: TooltipPayloadItem[],
  ) => React.ReactNode
  hideLabel?: boolean
  hideIndicator?: boolean
  indicator?: "dot" | "line"
}) {
  const { config } = useChart()

  if (!active || !payload?.length) return null

  return (
    <div
      className={cn(
        "grid min-w-[8rem] gap-1.5 rounded-xl border bg-background px-3 py-2 text-xs shadow-xl",
        className,
      )}
    >
      {!hideLabel ? (
        <div className="font-medium">
          {labelFormatter ? labelFormatter(label, payload) : label}
        </div>
      ) : null}
      <div className="grid gap-1">
        {payload.map((item, index) => {
          const key = String(item.dataKey ?? item.name ?? index)
          const itemConfig = config[key]
          const itemColor = item.color || `var(--color-${key})`
          const formattedValue = formatter
            ? formatter(item.value, item.name, item, index, item.payload)
            : item.value

          return (
            <div key={key} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {!hideIndicator ? (
                  <span
                    className={cn(
                      "inline-block rounded-[2px]",
                      indicator === "dot" ? "size-2" : "h-0.5 w-3",
                    )}
                    style={{ backgroundColor: itemColor }}
                  />
                ) : null}
                <span className="text-muted-foreground">
                  {itemConfig?.label ?? item.name}
                </span>
              </div>
              <span className="font-medium">{formattedValue as React.ReactNode}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export const ChartLegend = RechartsPrimitive.Legend

type LegendPayloadItem = {
  dataKey?: string | number
  value?: string
  color?: string
}

export function ChartLegendContent({
  className,
  payload,
  verticalAlign = "bottom",
}: React.ComponentProps<"div"> & {
  payload?: LegendPayloadItem[]
  verticalAlign?: "top" | "bottom" | "middle"
}) {
  const { config } = useChart()

  if (!payload?.length) return null

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs",
        verticalAlign === "top" ? "pb-3" : "pt-3",
        className,
      )}
    >
      {payload.map((item) => {
        const key = String(item.dataKey ?? item.value)
        const itemConfig = config[key]

        return (
          <div key={key} className="flex items-center gap-1.5">
            <span
              className="size-2 rounded-[2px]"
              style={{
                backgroundColor: item.color || `var(--color-${key})`,
              }}
            />
            <span className="text-muted-foreground">
              {itemConfig?.label ?? item.value}
            </span>
          </div>
        )
      })}
    </div>
  )
}
