'use server'

import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { signIn } from '@/lib/auth/auth'
import { AuthError } from 'next-auth'
import { redirect } from 'next/navigation'

export async function signupAction(formData: FormData): Promise<void> {
  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    redirect(`/signup?error=${encodeURIComponent('Email and password are required')}`)
  }
  if (password.length < 8) {
    redirect(`/signup?error=${encodeURIComponent('Password must be at least 8 characters')}`)
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (existing) {
    redirect(`/signup?error=${encodeURIComponent('An account with this email already exists')}`)
  }

  const hashed = await bcrypt.hash(password, 12)
  await db.insert(users).values({
    id: randomUUID(),
    name: name || email.split('@')[0],
    email,
    password: hashed,
  })

  try {
    await signIn('credentials', { email, password, redirectTo: '/dashboard' })
  } catch (err) {
    if (err instanceof AuthError) {
      redirect(`/login?error=${encodeURIComponent('Account created — please sign in')}`)
    }
    throw err
  }
}
