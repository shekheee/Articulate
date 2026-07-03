import Link from 'next/link'
import { auth } from '@/lib/auth/auth'
import { getGamificationProfile } from '@/lib/gamification/award'
import { StreakBadge } from '@/components/gamification/StreakBadge'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Mic, Target, Sparkles } from 'lucide-react'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/interview/prep', label: 'Prep', icon: Target },
  { href: '/accent', label: 'RP Trainer', icon: Mic },
]

interface PageShellProps {
  children: React.ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl'
}

const MAX = { sm: 'max-w-2xl', md: 'max-w-3xl', lg: 'max-w-4xl', xl: 'max-w-5xl' }

export async function PageShell({ children, className, maxWidth = 'md' }: PageShellProps) {
  const session = await auth()
  let streak = 0
  let level = 1

  if (session?.user?.id) {
    try {
      const g = await getGamificationProfile(session.user.id)
      streak = g.currentStreak
      level = g.level
    } catch {
      /* profile optional */
    }
  }

  return (
    <div className={cn('min-h-screen app-mesh-bg', className)}>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className={cn('mx-auto px-4 py-3 flex items-center justify-between gap-4', MAX[maxWidth])}>
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg tracking-tight hover:opacity-90 transition-opacity">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            Articulate
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <StreakBadge current={streak} className="hidden sm:flex text-xs py-1 px-2" />
            <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold px-2">
              Lv.{level}
            </span>
          </div>
        </div>
      </header>
      <main className={cn('mx-auto px-4 py-8', MAX[maxWidth])}>{children}</main>
    </div>
  )
}
