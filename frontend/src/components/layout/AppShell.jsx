import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  X,
} from 'lucide-react';
import { ThemeToggle } from '../ui/theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { CommandPalette } from './CommandPalette';
import { cn } from '../../lib/utils';

const COLLAPSE_KEY = 'dineqr_sidebar_collapsed';

/**
 * Reusable SaaS app shell: collapsible grouped sidebar + top bar with
 * breadcrumb, ⌘K search, theme toggle and account menu.
 *
 * Props:
 *  - brand: { name, tagline, icon, to }
 *  - groups: [{ label, items: [{ to, end, label, icon, keywords }] }]
 *      `to` values are relative to `basePath`.
 *  - basePath: route prefix used to build absolute links/breadcrumbs (e.g. '/admin')
 *  - user: { name, role }
 *  - onLogout: () => void
 *  - children: page content (router outlet)
 */
export function AppShell({ brand, groups = [], basePath = '', user, onLogout, children }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSE_KEY) === '1'
  );
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  // Close the mobile drawer on navigation.
  useEffect(() => setMobileOpen(false), [location.pathname]);

  const allItems = useMemo(
    () => groups.flatMap((g) => g.items.map((it) => ({ ...it, group: g.label }))),
    [groups]
  );

  const abs = (to) => `${basePath}/${to}`.replace(/\/+$/, '') || basePath || '/';

  const paletteItems = useMemo(
    () =>
      allItems.map((it) => ({
        label: it.label,
        to: abs(it.to),
        icon: it.icon,
        group: it.group,
        keywords: it.keywords,
      })),
    [allItems]
  );

  // Active item → breadcrumb.
  const activeItem = useMemo(() => {
    const path = location.pathname.replace(/\/$/, '');
    let best = null;
    for (const it of allItems) {
      const target = abs(it.to).replace(/\/$/, '');
      if (path === target || (!it.end && target !== basePath && path.startsWith(target))) {
        if (!best || abs(it.to).length > abs(best.to).length) best = it;
      }
    }
    return best || allItems.find((it) => abs(it.to).replace(/\/$/, '') === basePath);
  }, [location.pathname, allItems]);

  const BrandIcon = brand?.icon;
  const sidebarWidth = collapsed ? 'lg:w-[68px]' : 'lg:w-60';

  const SidebarBody = ({ showLabels }) => (
    <>
      <div
        className={cn(
          'flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4',
          !showLabels && 'lg:justify-center lg:px-0'
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
          {BrandIcon ? <BrandIcon size={16} className="text-primary-foreground" /> : null}
        </div>
        {showLabels && (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-none">{brand?.name}</p>
            {brand?.tagline && (
              <p className="mt-0.5 truncate text-[10px] opacity-50">{brand.tagline}</p>
            )}
          </div>
        )}
        <button
          onClick={() => setMobileOpen(false)}
          className="ml-auto opacity-60 hover:opacity-100 lg:hidden"
          aria-label="Close menu"
        >
          <X size={16} />
        </button>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4 scrollbar-hide">
        {groups.map((group) => (
          <div key={group.label}>
            {showLabels && (
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider opacity-40">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={abs(item.to)}
                    end={item.end}
                    title={!showLabels ? item.label : undefined}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                        !showLabels && 'lg:justify-center lg:px-0',
                        isActive
                          ? 'bg-sidebar-accent text-white'
                          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                      )
                    }
                  >
                    {Icon ? <Icon size={17} className="shrink-0" /> : null}
                    {showLabels && item.label}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-20 bg-black/50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-60 flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 lg:static',
          sidebarWidth,
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <SidebarBody showLabels={!collapsed} />
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header
          data-theme-surface
          className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 hover:bg-accent lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="hidden rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground lg:inline-flex"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
            <span className="text-muted-foreground">{brand?.name}</span>
            {activeItem && (
              <>
                <ChevronRight size={14} className="text-muted-foreground/50" />
                <span className="font-medium text-foreground">{activeItem.label}</span>
              </>
            )}
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            {/* Search / command palette trigger */}
            <button
              onClick={() => setPaletteOpen(true)}
              className="hidden items-center gap-2 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent sm:flex"
            >
              <Search size={15} />
              <span>Search…</span>
              <kbd className="ml-2 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium">
                ⌘K
              </kbd>
            </button>
            <button
              onClick={() => setPaletteOpen(true)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground sm:hidden"
              aria-label="Search"
            >
              <Search size={18} />
            </button>

            <ThemeToggle />

            {/* Account menu */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors hover:bg-accent">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <span className="hidden text-sm font-medium md:block">{user?.name}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>
                  <div className="font-medium text-foreground">{user?.name}</div>
                  <div className="capitalize">{user?.role}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={onLogout} className="text-destructive">
                  <LogOut size={15} /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>

      <CommandPalette open={paletteOpen} setOpen={setPaletteOpen} items={paletteItems} />
    </div>
  );
}
