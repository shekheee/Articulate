import { cn } from '@/lib/utils'
import { Sparkles } from 'lucide-react'

interface AuthShellProps {
  children: React.ReactNode
  title: string
  subtitle: string
}

export function AuthShell({ children, title, subtitle }: AuthShellProps) {
  return (
    <div className="min-h-screen app-mesh-bg flex flex-col lg:flex-row">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-violet-500/10 to-cyan-400/10" />
        <div className="relative z-10 space-y-6 max-w-md">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
            <Sparkles className="h-7 w-7" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Articulate</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Level up your speaking. Practice DS/ML interviews, polish your accent, and earn XP as you improve.
          </p>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-2"><span>🎯</span> Interview prep with AI feedback</li>
            <li className="flex gap-2"><span>🇬🇧</span> British & Irish accent coaching</li>
            <li className="flex gap-2"><span>🔥</span> Streaks, badges & daily goals</li>
          </ul>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-sm space-y-6">
          <div className="lg:hidden text-center space-y-2 mb-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground mx-auto">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold">Articulate</h2>
          </div>
          <div className={cn('rounded-2xl border border-border/80 bg-card/95 backdrop-blur-sm shadow-xl p-6 space-y-1')}>
            <h2 className="text-xl font-bold text-center">{title}</h2>
            <p className="text-sm text-muted-foreground text-center mb-4">{subtitle}</p>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
