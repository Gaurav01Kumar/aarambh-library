'use client';

import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectContextType {
  value?: string
  onValueChange?: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
  labels: Record<string, React.ReactNode>
  registerLabel: (value: string, label: React.ReactNode) => void
}

const SelectContext = React.createContext<SelectContextType | null>(null)

interface SelectProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

const Select = ({ value: controlledValue, defaultValue, onValueChange, children }: SelectProps) => {
  const [open, setOpen] = React.useState(false)
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue || '')
  const [labels, setLabels] = React.useState<Record<string, React.ReactNode>>({})

  const isControlled = controlledValue !== undefined
  const value = isControlled ? controlledValue : uncontrolledValue

  const handleValueChange = React.useCallback((newValue: string) => {
    if (!isControlled) {
      setUncontrolledValue(newValue)
    }
    onValueChange?.(newValue)
  }, [isControlled, onValueChange])

  const registerLabel = React.useCallback((val: string, label: React.ReactNode) => {
    setLabels(prev => {
      if (prev[val] === label) return prev
      return { ...prev, [val]: label }
    })
  }, [])

  return (
    <SelectContext.Provider value={{ value, onValueChange: handleValueChange, open, setOpen, labels, registerLabel }}>
      <div className="relative inline-block w-full">
        {children}
      </div>
    </SelectContext.Provider>
  )
}

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const ctx = React.useContext(SelectContext)
  if (!ctx) return null

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "flex h-9 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus:ring-slate-300 transition-colors shadow-sm",
        className
      )}
      onClick={() => ctx.setOpen(!ctx.open)}
      {...props}
    >
      <div className="flex-1 text-left truncate mr-2">
        {children}
      </div>
      <ChevronDown className={cn("h-3.5 w-3.5 opacity-50 transition-transform duration-200 flex-shrink-0", ctx.open && "rotate-180")} />
    </button>
  )
})
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = ({ placeholder }: { placeholder?: string, value?: string }) => {
  const ctx = React.useContext(SelectContext)
  if (!ctx) return <span>{placeholder}</span>

  const currentLabel = ctx.value !== undefined && ctx.value !== '' ? ctx.labels[ctx.value] : null
  const displayContent = currentLabel !== undefined && currentLabel !== null ? currentLabel : (ctx.value || placeholder)
  const isSelected = Boolean(currentLabel || ctx.value)

  return (
    <span className={cn("block truncate text-left", isSelected ? "text-slate-900 dark:text-slate-100 font-medium" : "text-slate-500 dark:text-slate-400")}>
      {displayContent}
    </span>
  )
}

const SelectContent = ({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
  currentValue?: string
  open?: boolean
  setOpen?: (open: boolean) => void
  onValueChange?: (value: string) => void
  value?: string
}) => {
  const ctx = React.useContext(SelectContext)
  if (!ctx || !ctx.open) return null

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={() => ctx.setOpen(false)} />
      <div
        className={cn(
          "absolute left-0 top-full z-50 mt-1.5 min-w-[180px] w-full max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 text-slate-950 shadow-xl dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 animate-in fade-in zoom-in-95 duration-150",
          className
        )}
      >
        {children}
      </div>
    </>
  )
}

const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value: string
    onSelect?: (value: string) => void
    selected?: boolean
  }
>(({ className, children, value, ...props }, ref) => {
  const ctx = React.useContext(SelectContext)
  
  React.useEffect(() => {
    if (ctx && value !== undefined) {
      ctx.registerLabel(value, children)
    }
  }, [ctx, value, children])

  if (!ctx) return null
  const isSelected = ctx.value === value

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 pl-8 pr-2.5 text-xs outline-none transition-colors hover:bg-indigo-50 hover:text-indigo-900 dark:hover:bg-slate-800 dark:hover:text-slate-100 focus:bg-indigo-50 focus:text-indigo-900 dark:focus:bg-slate-800 dark:focus:text-slate-100",
        isSelected && "bg-indigo-50/80 text-indigo-700 font-semibold dark:bg-indigo-950/50 dark:text-indigo-300",
        className
      )}
      onClick={() => {
        ctx.onValueChange?.(value)
        ctx.setOpen(false)
      }}
      {...props}
    >
      {isSelected && (
        <span className="absolute left-2.5 flex h-3.5 w-3.5 items-center justify-center text-indigo-600 dark:text-indigo-400">
          <Check className="h-3.5 w-3.5" />
        </span>
      )}
      <span className="truncate">{children}</span>
    </div>
  )
})
SelectItem.displayName = "SelectItem"

const SelectLabel = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-xs font-bold uppercase tracking-wider text-slate-400", className)}
    {...props}
  />
))
SelectLabel.displayName = "SelectLabel"

const SelectSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-slate-100 dark:bg-slate-800", className)}
    {...props}
  />
))
SelectSeparator.displayName = "SelectSeparator"

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
}