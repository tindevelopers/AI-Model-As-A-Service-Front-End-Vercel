'use client'

import { useTenant } from '@/context/TenantContext'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Key, 
  BarChart3, 
  FileText, 
  DollarSign, 
  Settings, 
  Users, 
  Shield, 
  ChevronRight,
  Building2
} from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible/Collapsible'
import { useState } from 'react'

const iconMap = {
  dashboard: LayoutDashboard,
  api: Key,
  billing: DollarSign,
  configuration: Settings,
  analytics: BarChart3,
  documentation: FileText,
  usage: BarChart3,
  keys: Key,
  apikeys: Key,
  docs: FileText,
  team: Users,
  permissions: Shield,
  settings: Settings
}

interface MenuSection {
  id: string
  title: string
  icon: string
  path: string
  enabled: boolean
  subsections?: Array<{
    title: string
    path: string
  }>
}

export function TenantAdminSidebar() {
  const { tenantMenu, currentTenant } = useTenant()
  const pathname = usePathname()
  const [openSections, setOpenSections] = useState<string[]>([])

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  if (!currentTenant) {
    return (
      <div className="p-4">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <Building2 className="h-4 w-4" />
          <span className="text-sm">No tenant selected</span>
        </div>
      </div>
    )
  }

  if (!tenantMenu) {
    return (
      <div className="p-4">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <Building2 className="h-4 w-4" />
          <span className="text-sm">Loading menu...</span>
        </div>
      </div>
    )
  }

  const renderSubsectionIcon = (subsectionTitle: string) => {
    const iconKey = subsectionTitle.toLowerCase().replace(/\s+/g, '')
    const Icon = iconMap[iconKey as keyof typeof iconMap] || FileText
    return <Icon className="h-4 w-4" />
  }

  return (
    <div className="space-y-2 p-2">
      {/* Tenant Info */}
      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-center space-x-2">
          <Building2 className="h-4 w-4 text-primary" />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">
              {currentTenant.name}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {tenantMenu.user_role}
            </div>
          </div>
        </div>
      </div>

      {/* Menu Sections */}
      {tenantMenu.sections.map((section: MenuSection) => {
        const Icon = iconMap[section.icon as keyof typeof iconMap] || FileText
        const isActive = pathname === section.path
        const hasSubsections = section.subsections && section.subsections.length > 0
        const isOpen = openSections.includes(section.id)

        if (!section.enabled) {
          return null
        }

        return (
          <div key={section.id}>
            {hasSubsections ? (
              <Collapsible open={isOpen} onOpenChange={() => toggleSection(section.id)}>
                <CollapsibleTrigger asChild>
                  <button
                    className={cn(
                      "flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                      isActive && "bg-accent text-accent-foreground"
                    )}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="h-4 w-4" />
                      <span>{section.title}</span>
                    </div>
                    <ChevronRight 
                      className={cn(
                        "h-4 w-4 transition-transform",
                        isOpen && "rotate-90"
                      )} 
                    />
                  </button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="space-y-1 ml-6">
                  {section.subsections?.map((subsection) => {
                    const subsectionPath = `/tenant/${currentTenant.slug}${subsection.path}`
                    const isSubsectionActive = pathname === subsectionPath
                    
                    return (
                      <Link
                        key={subsection.path}
                        href={subsectionPath}
                        className={cn(
                          "flex items-center space-x-2 px-3 py-2 text-sm rounded-md transition-colors",
                          "hover:bg-accent hover:text-accent-foreground",
                          isSubsectionActive && "bg-accent text-accent-foreground"
                        )}
                      >
                        {renderSubsectionIcon(subsection.title)}
                        <span>{subsection.title}</span>
                      </Link>
                    )
                  })}
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <Link
                href={`/tenant/${currentTenant.slug}${section.path}`}
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  isActive && "bg-accent text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{section.title}</span>
              </Link>
            )}
          </div>
        )
      })}
    </div>
  )
}
