import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { name, email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const normalizedEmail = String(email).trim().toLowerCase()

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1)

  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
  }

  const hashed = await bcrypt.hash(password, 12)
  const [user] = await db
    .insert(users)
    .values({
      id: randomUUID(),
      name: name?.trim() || normalizedEmail.split('@')[0],
      email: normalizedEmail,
      password: hashed,
    })
    .returning({ id: users.id, email: users.email })

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 })
}
