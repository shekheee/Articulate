import Link from 'next/link'
import { loginAction } from '@/lib/auth/login'
import { signIn } from '@/lib/auth/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { AuthShell } from '@/components/layout/AuthShell'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue your streak and track your progress."
    >
      <form action={loginAction} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="you@example.com" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" placeholder="••••••••" required />
        </div>
        {error && (
          <p className="text-sm text-red-500" role="alert">
            {error === 'CredentialsSignin' ? 'Invalid email or password' : error}
          </p>
        )}
        <Button type="submit" className="w-full" size="lg">
          Sign in
        </Button>
      </form>

      <div className="flex items-center gap-2 my-4">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>

      <form
        action={async () => {
          'use server'
          await signIn('google', { redirectTo: '/dashboard' })
        }}
      >
        <Button type="submit" variant="outline" className="w-full" size="lg">
          Continue with Google
        </Button>
      </form>
      <p className="text-center text-xs text-muted-foreground pt-4">
        New here?{' '}
        <Link href="/signup" className="text-primary underline-offset-4 hover:underline font-medium">
          Create a free account
        </Link>
      </p>
    </AuthShell>
  )
}
