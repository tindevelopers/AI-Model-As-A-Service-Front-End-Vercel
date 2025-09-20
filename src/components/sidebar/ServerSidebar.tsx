import React from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Users, 
  Key, 
  BarChart3, 
  Settings,
  ChevronDown,
  LayoutDashboard,
  Activity
} from 'lucide-react';

interface NavItem {
  name: string;
  icon: React.ReactNode;
  path?: string;
  new?: boolean;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
}

const navItems: NavItem[] = [
  {
    icon: <LayoutDashboard className="h-5 w-5" />,
    name: "Dashboard",
    path: "/dashboard",
  },
  {
    icon: <Building2 className="h-5 w-5" />,
    name: "Tenant Management",
    new: true,
    subItems: [
      { name: "View All Tenants", path: "/tenant-management" },
      { name: "Create Tenant", path: "/tenant-management/create" },
    ],
  },
  {
    icon: <Users className="h-5 w-5" />,
    name: "User Management",
    subItems: [
      { name: "All Users", path: "/admin/users" },
      { name: "Invite User", path: "/admin/users/invite" },
    ],
  },
  {
    icon: <Key className="h-5 w-5" />,
    name: "API Keys",
    subItems: [
      { name: "All API Keys", path: "/admin/api-keys" },
      { name: "Create API Key", path: "/admin/api-keys/create" },
    ],
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    name: "Analytics",
    subItems: [
      { name: "Usage Statistics", path: "/admin/analytics" },
      { name: "Revenue Reports", path: "/admin/analytics/revenue" },
    ],
  },
  {
    icon: <Activity className="h-5 w-5" />,
    name: "System Health",
    path: "/admin/health",
  },
  {
    icon: <Settings className="h-5 w-5" />,
    name: "Settings",
    path: "/admin/settings",
  },
];

interface ServerSidebarProps {
  currentPath?: string;
}

export default function ServerSidebar({ currentPath = "/dashboard" }: ServerSidebarProps) {
  return (
    <div className="fixed left-0 top-0 z-50 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-lg">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200 dark:border-gray-700">
        <Link href="/dashboard" className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            TailAdmin
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6">
        <div className="px-4">
          <h2 className="mb-4 text-xs uppercase font-semibold text-gray-400 tracking-wider">
            Menu
          </h2>
          
          <div className="space-y-2">
            {navItems.map((item, index) => (
              <NavItemComponent 
                key={index} 
                item={item} 
                currentPath={currentPath} 
              />
            ))}
          </div>
        </div>
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              Super Admin
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              superadmin@tin.info
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface NavItemComponentProps {
  item: NavItem;
  currentPath: string;
}

function NavItemComponent({ item, currentPath }: NavItemComponentProps) {
  const isActive = currentPath === item.path;
  const hasSubItems = item.subItems && item.subItems.length > 0;

  if (hasSubItems) {
    return (
      <CollapsibleNavItem item={item} currentPath={currentPath} />
    );
  }

  return (
    <Link
      href={item.path || "#"}
      className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
          : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
      }`}
    >
      <div className="flex items-center space-x-3">
        {item.icon}
        <span>{item.name}</span>
      </div>
      {item.new && (
        <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full dark:text-green-400 dark:bg-green-900/20">
          NEW
        </span>
      )}
    </Link>
  );
}

interface CollapsibleNavItemProps {
  item: NavItem;
  currentPath: string;
}

function CollapsibleNavItem({ item, currentPath }: CollapsibleNavItemProps) {
  // For SSR, we'll show the first submenu as expanded by default
  const isExpanded = true;
  const hasActiveSubItem = item.subItems?.some(subItem => currentPath === subItem.path);

  return (
    <div>
      <div className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        hasActiveSubItem
          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
          : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
      }`}>
        <div className="flex items-center space-x-3">
          {item.icon}
          <span>{item.name}</span>
        </div>
        <div className="flex items-center space-x-2">
          {item.new && (
            <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full dark:text-green-400 dark:bg-green-900/20">
              NEW
            </span>
          )}
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>
      
      {isExpanded && (
        <div className="ml-6 mt-1 space-y-1">
          {item.subItems?.map((subItem, subIndex) => {
            const isSubActive = currentPath === subItem.path;
            return (
              <Link
                key={subIndex}
                href={subItem.path}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  isSubActive
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                    : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700"
                }`}
              >
                <span>{subItem.name}</span>
                {subItem.new && (
                  <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full dark:text-green-400 dark:bg-green-900/20">
                    NEW
                  </span>
                )}
                {subItem.pro && (
                  <span className="px-2 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-full dark:text-purple-400 dark:bg-purple-900/20">
                    PRO
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
