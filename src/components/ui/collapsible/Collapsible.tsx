import React, { createContext, useContext, useState, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CollapsibleContextType {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CollapsibleContext = createContext<CollapsibleContextType | undefined>(undefined)

interface CollapsibleProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: ReactNode
  className?: string
}

export const Collapsible: React.FC<CollapsibleProps> = ({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  children,
  className
}) => {
  const [internalOpen, setInternalOpen] = useState(false)
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const onOpenChange = controlledOnOpenChange || setInternalOpen

  return (
    <CollapsibleContext.Provider value={{ open, onOpenChange }}>
      <div className={cn('w-full', className)}>
        {children}
      </div>
    </CollapsibleContext.Provider>
  )
}

interface CollapsibleTriggerProps {
  asChild?: boolean
  children: ReactNode
  className?: string
}

export const CollapsibleTrigger: React.FC<CollapsibleTriggerProps> = ({
  asChild = false,
  children,
  className
}) => {
  const context = useContext(CollapsibleContext)
  if (!context) {
    throw new Error('CollapsibleTrigger must be used within a Collapsible')
  }

  const { open, onOpenChange } = context

  const handleClick = () => {
    onOpenChange(!open)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: handleClick,
      className: cn(children.props.className, className)
    })
  }

  return (
    <button
      onClick={handleClick}
      className={cn('w-full', className)}
    >
      {children}
    </button>
  )
}

interface CollapsibleContentProps {
  children: ReactNode
  className?: string
}

export const CollapsibleContent: React.FC<CollapsibleContentProps> = ({
  children,
  className
}) => {
  const context = useContext(CollapsibleContext)
  if (!context) {
    throw new Error('CollapsibleContent must be used within a Collapsible')
  }

  const { open } = context

  if (!open) {
    return null
  }

  return (
    <div className={cn('w-full', className)}>
      {children}
    </div>
  )
}
