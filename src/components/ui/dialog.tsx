'use client';

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  return (
    <>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { open, onOpenChange } as any)
        }
        return child
      })}
    </>
  )
}

const DialogTrigger = ({ 
  children, 
  onOpenChange,
  asChild
}: { 
  children: React.ReactNode, 
  onOpenChange?: (open: boolean) => void,
  asChild?: boolean
}) => {
  if (React.isValidElement(children)) {
    const childProps = children.props as any;
    return React.cloneElement(children, {
      onClick: (e: React.MouseEvent) => {
        if (childProps?.onClick) childProps.onClick(e);
        onOpenChange?.(true);
      }
    } as any);
  }
  return <>{children}</>;
}

const DialogContent = ({
  children,
  open,
  onOpenChange,
  className
}: {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => onOpenChange?.(false)}
      />
      <div
        className={cn(
          "relative z-50 grid w-full max-w-lg gap-4 border border-slate-200 bg-white p-6 shadow-2xl duration-200 rounded-xl sm:rounded-2xl dark:border-slate-800 dark:bg-slate-950 animate-in zoom-in-95 duration-200 my-auto",
          className
        )}
      >
        <button
          className="absolute right-4 top-4 rounded-full p-1 text-slate-400 opacity-70 ring-offset-white transition-opacity hover:opacity-100 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:pointer-events-none dark:ring-offset-slate-950 dark:focus:ring-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          onClick={() => onOpenChange?.(false)}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        {children}
      </div>
    </div>
  )
}

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-slate-500 dark:text-slate-400", className)}
    {...props}
  />
))
DialogDescription.displayName = "DialogDescription"

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}