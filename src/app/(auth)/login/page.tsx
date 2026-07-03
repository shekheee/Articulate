import { loginAction } from '@/lib/auth/login'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
    </AuthShell>
  )
}
