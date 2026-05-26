import { auth } from '@/lib/auth/auth'
import { NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createGroq } from '@ai-sdk/groq'
import { z } from 'zod'
import { saveUserResume, getUserResume } from '@/lib/db/queries'

const resumeSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  summary: z.string().optional(),
  skills: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  experience: z.array(
    z.object({
      company: z.string(),
      role: z.string(),
      duration: z.string().optional(),
      highlights: z.array(z.string()).default([]),
    })
  ).default([]),
  education: z.array(
    z.object({
      institution: z.string(),
      degree: z.string(),
      year: z.string().optional(),
    })
  ).default([]),
  certifications: z.array(z.string()).default([]),
  projects: z.array(
    z.object({
      name: z.string(),
      description: z.string().optional(),
      technologies: z.array(z.string()).default([]),
    })
  ).default([]),
})

export type ParsedResume = z.infer<typeof resumeSchema>

// ── GET: return the user's saved resume context ──────────────────────────
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const resumeContext = await getUserResume(session.user.id)
  return NextResponse.json({ resumeContext })
}

// ── DELETE: clear saved resume ────────────────────────────────────────────
export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await saveUserResume(session.user.id, '')
  return NextResponse.json({ ok: true })
}

// ── POST: parse uploaded file + save to user profile ─────────────────────
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const allowedTypes = ['application/pdf', 'text/plain', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|txt|doc|docx)$/i)) {
    return NextResponse.json({ error: 'Unsupported file type. Upload a PDF or text file.' }, { status: 400 })
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large. Maximum 5MB.' }, { status: 400 })
  }

  const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  const hasGemini = !!process.env.GOOGLE_GENERATIVE_AI_API_KEY &&
    !process.env.GOOGLE_GENERATIVE_AI_API_KEY.startsWith('your_')
  const hasGroq = !!process.env.GROQ_API_KEY &&
    !process.env.GROQ_API_KEY.startsWith('your_')

  let parsed: ParsedResume

  if (isPDF && hasGemini) {
    // Send the PDF directly to Gemini — native multimodal, understands layout & columns.
    // Use gemini-2.5-flash (same model as evaluation, higher quota than 2.0-flash).
    const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY })
    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = buffer.toString('base64')

    try {
      const result = await generateObject({
        model: google('gemini-2.5-flash'),
        schema: resumeSchema,
        messages: [{
          role: 'user',
          content: [
            { type: 'file', data: base64, mediaType: 'application/pdf' },
            { type: 'text', text: 'Extract all structured information from this resume. Be thorough and accurate.' },
          ],
        }],
      })
      parsed = result.object as ParsedResume
    } catch (err) {
      // Quota hit — fall through to text fallback if possible
      if (!hasGroq) throw err
      console.warn('[resume] Gemini quota hit, falling back to Groq text parse')
      const text = await file.text()
      const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })
      const result = await generateObject({
        model: groq('llama-3.1-8b-instant'),
        schema: resumeSchema,
        system: 'You are a resume parser. Extract structured information. Be accurate and concise.',
        prompt: `Extract all structured information from this resume:\n\n${text.slice(0, 8000)}`,
      })
      parsed = result.object as ParsedResume
    }
  } else {
    // Text / docx — extract raw text then parse with LLM
    const rawText = (await file.text()).slice(0, 8000)
    if (!rawText.trim()) {
      return NextResponse.json({ error: 'Could not extract text from the file.' }, { status: 422 })
    }

    if (hasGemini) {
      const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY })
      try {
        const result = await generateObject({
          model: google('gemini-2.5-flash'),
          schema: resumeSchema,
          system: 'You are a resume parser. Extract structured information. Be accurate and concise.',
          prompt: `Extract all structured information from this resume:\n\n${rawText}`,
        })
        parsed = result.object as ParsedResume
      } catch (err) {
        if (!hasGroq) throw err
        console.warn('[resume] Gemini quota hit, falling back to Groq')
        const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })
        const result = await generateObject({
          model: groq('llama-3.1-8b-instant'),
          schema: resumeSchema,
          system: 'You are a resume parser. Extract structured information. Be accurate and concise.',
          prompt: `Extract all structured information from this resume:\n\n${rawText}`,
        })
        parsed = result.object as ParsedResume
      }
    } else if (hasGroq) {
      const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })
      const result = await generateObject({
        model: groq('llama-3.1-8b-instant'),
        schema: resumeSchema,
        system: 'You are a resume parser. Extract structured information. Be accurate and concise.',
        prompt: `Extract all structured information from this resume:\n\n${rawText}`,
      })
      parsed = result.object as ParsedResume
    } else {
      return NextResponse.json({ error: 'No AI provider configured.' }, { status: 500 })
    }
  }

  const resumeContext = buildResumeContext(parsed)

  // Save to user profile so it persists across sessions
  await saveUserResume(session.user.id, resumeContext)

  return NextResponse.json({ parsed, resumeContext })
}

function buildResumeContext(r: ParsedResume): string {
  const lines: string[] = []

  if (r.name) lines.push(`Name: ${r.name}`)
  if (r.location) lines.push(`Location: ${r.location}`)
  if (r.summary) lines.push(`Summary: ${r.summary}`)

  if (r.skills.length > 0) lines.push(`Skills: ${r.skills.join(', ')}`)
  if (r.languages.length > 0) lines.push(`Languages: ${r.languages.join(', ')}`)
  if (r.certifications.length > 0) lines.push(`Certifications: ${r.certifications.join(', ')}`)

  if (r.education.length > 0) {
    lines.push('Education:')
    r.education.forEach((e) => {
      lines.push(`  - ${e.degree} at ${e.institution}${e.year ? ` (${e.year})` : ''}`)
    })
  }

  if (r.experience.length > 0) {
    lines.push('Experience:')
    r.experience.forEach((exp) => {
      lines.push(`  - ${exp.role} at ${exp.company}${exp.duration ? ` (${exp.duration})` : ''}`)
      exp.highlights.slice(0, 3).forEach((h) => lines.push(`    • ${h}`))
    })
  }

  if (r.projects.length > 0) {
    lines.push('Projects:')
    r.projects.forEach((p) => {
      const tech = p.technologies.length > 0 ? ` [${p.technologies.join(', ')}]` : ''
      lines.push(`  - ${p.name}${tech}${p.description ? `: ${p.description}` : ''}`)
    })
  }

  return lines.join('\n')
}
