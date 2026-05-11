import { NavLink } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  ClipboardList,
  Cpu,
  Layers,
  LayoutDashboard,
  LineChart,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'

type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  highlight?: boolean
}

const navItems: NavItem[] = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/eda', label: 'Data Cleaning', icon: BarChart3 },
  { to: '/preprocessing', label: 'Preprocessing', icon: Layers },
  { to: '/clustering', label: 'Clustering', icon: Cpu },
  { to: '/evaluation', label: 'Evaluation', icon: LineChart },
  { to: '/interpretation', label: 'Interpretation', icon: ClipboardList },
  {
    to: '/comparison',
    label: 'Model Comparison',
    icon: ShieldCheck,
    highlight: true,
  },
]

type SidebarProps = {
  /** Desktop (md+): whether the docked rail is shown. */
  expanded: boolean
  /** Mobile: overlay open. */
  mobileOpen: boolean
  onClose: () => void
}

export function Sidebar({ expanded, mobileOpen, onClose }: SidebarProps) {
  const linkClass =
    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors'

  const railVisible = mobileOpen ? 'translate-x-0' : '-translate-x-full'
  const desktopVisible = expanded ? 'md:translate-x-0' : 'md:-translate-x-full'

  return (
    <>
      <div
        className={`medflow-sidebar fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm transition md:hidden ${
          mobileOpen ? 'block' : 'hidden'
        }`}
        aria-hidden={!mobileOpen}
        onClick={onClose}
      />
      <aside
        id="medflow-sidebar"
        className={`medflow-sidebar fixed inset-y-0 left-0 z-40 w-60 border-r border-slate-700 bg-mf-sidebar-bg text-mf-sidebar-text transition-transform duration-200 ease-out ${railVisible} ${desktopVisible}`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-700 px-4 py-5">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400">Thesis dashboard</p>
              <p className="text-lg font-semibold text-white">MedFlow PH</p>
            </div>
            <button
              type="button"
              className="rounded-md p-2 text-mf-sidebar-text hover:bg-slate-700 md:hidden"
              onClick={onClose}
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  [
                    linkClass,
                    isActive
                      ? 'bg-slate-700/80 text-mf-sidebar-active'
                      : 'text-mf-sidebar-text hover:bg-slate-700/60 hover:text-white',
                    item.highlight ? 'ring-1 ring-sky-400/40' : '',
                  ].join(' ')
                }
              >
                <item.icon className="h-4 w-4 shrink-0 opacity-80" />
                <span className="truncate">{item.label}</span>
                {item.highlight ? (
                  <Sparkles className="ml-auto h-4 w-4 text-sky-400" aria-hidden />
                ) : null}
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-slate-700 px-4 py-3 text-xs text-slate-400">
            Committee presentation build — PhilGEPS procurement ML.
          </div>
        </div>
      </aside>
    </>
  )
}
