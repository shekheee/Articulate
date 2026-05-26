'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type Step = 'company_round' | 'type' | 'persona' | 'difficulty' | 'resume' | 'questions'
const STEPS: Step[] = ['company_round', 'type', 'persona', 'difficulty', 'resume', 'questions']

const COMPANIES = [
  { id: 'generic', label: 'Generic / Other', icon: '🎯', description: 'General interview practice' },
  { id: 'deloitte', label: 'Deloitte', icon: '🟢', description: 'Consulting & advisory — Big 4' },
  { id: 'mckinsey', label: 'McKinsey & Co', icon: '⚫', description: 'Top-tier management consulting' },
  { id: 'bcg', label: 'BCG', icon: '🔴', description: 'Boston Consulting Group' },
  { id: 'bain', label: 'Bain & Company', icon: '🔵', description: 'Results-focused consulting' },
  { id: 'pwc', label: 'PwC', icon: '🟠', description: 'Professional services — Big 4' },
  { id: 'ey', label: 'EY', icon: '🟡', description: 'Ernst & Young — Big 4' },
  { id: 'kpmg', label: 'KPMG', icon: '🔷', description: 'Advisory & audit — Big 4' },
  { id: 'accenture', label: 'Accenture', icon: '🟣', description: 'Technology & consulting' },
  { id: 'google', label: 'Google', icon: '🔵', description: 'Big Tech — FAANG' },
  { id: 'amazon', label: 'Amazon', icon: '📦', description: 'Leadership Principles focus' },
  { id: 'microsoft', label: 'Microsoft', icon: '🪟', description: 'Big Tech — growth mindset' },
  { id: 'meta', label: 'Meta', icon: '🔵', description: 'Big Tech — impact & scale' },
  { id: 'goldman_sachs', label: 'Goldman Sachs', icon: '🏦', description: 'Investment banking & finance' },
  { id: 'jp_morgan', label: 'JPMorgan Chase', icon: '🏦', description: 'Financial services' },
]

const ROUNDS = [
  { id: 'recruiter_screen', label: 'Recruiter Screen', icon: '📞', description: 'Initial call — motivation, background, fit' },
  { id: 'hr', label: 'HR / Culture Fit', icon: '🤝', description: 'Values alignment, work style, soft skills' },
  { id: 'behavioral', label: 'Behavioral Round', icon: '🧠', description: 'STAR-based competency questions' },
  { id: 'technical', label: 'Technical Round', icon: '💻', description: 'Technical skills & problem solving' },
  { id: 'case_study', label: 'Case Study', icon: '📊', description: 'Structured business problem solving' },
  { id: 'managerial', label: 'Managerial Round', icon: '👔', description: 'Senior stakeholder / leadership interview' },
  { id: 'final_round', label: 'Final Round', icon: '🏁', description: 'Holistic assessment — high bar' },
  { id: 'partner', label: 'Partner Round', icon: '⭐', description: 'Partner / Principal interview (consulting)' },
  { id: 'general', label: 'General Practice', icon: '🎯', description: 'No specific round — mixed questions' },
]

const INTERVIEW_TYPES = [
  { id: 'behavioral', label: 'Behavioral', icon: '🧠', description: 'STAR method, leadership, teamwork, conflict' },
  { id: 'dsa', label: 'DSA / Coding', icon: '💻', description: 'Algorithms, data structures, problem-solving' },
  { id: 'system_design', label: 'System Design', icon: '🏗️', description: 'Scalability, architecture, trade-offs' },
  { id: 'case_study', label: 'Case Study', icon: '📊', description: 'Market sizing, profitability, business strategy' },
]

const PERSONAS = [
  { id: 'friendly', label: 'Friendly Mentor', icon: '😊', description: 'Encouraging, hints when stuck, calm' },
  { id: 'strict', label: 'Strict Interviewer', icon: '🎯', description: 'No hints, high pressure, precise answers' },
  { id: 'google', label: 'Google SWE Style', icon: '🔵', description: 'Technical depth, problem-solving process' },
  { id: 'amazon', label: 'Amazon Bar Raiser Style', icon: '📦', description: 'Leadership Principles, STAR method' },
  { id: 'startup', label: 'Startup Founder Style', icon: '🚀', description: 'Impact, ownership, scrappiness' },
]

const DIFFICULTIES = [
  { id: 'junior', label: 'Junior', description: '0–2 years experience', questions: 4 },
  { id: 'mid', label: 'Mid-level', description: '3–5 years experience', questions: 5 },
  { id: 'senior', label: 'Senior', description: '6+ years experience', questions: 6 },
]

const STEP_LABELS: Record<Step, string> = {
  company_round: 'Company & Round',
  type: 'Interview Type',
  persona: 'Interviewer Style',
  difficulty: 'Difficulty',
  resume: 'Resume (optional)',
  questions: 'Custom Questions',
}

// Which interview types make sense for each round
const ROUND_TYPE_FILTER: Record<string, string[]> = {
  recruiter_screen: ['behavioral'],
  hr: ['behavioral'],
  behavioral: ['behavioral'],
  technical: ['dsa', 'system_design'],
  case_study: ['case_study'],
  managerial: ['behavioral'],
  final_round: ['behavioral', 'dsa', 'system_design', 'case_study'],
  partner: ['behavioral', 'case_study'],
  general: ['behavioral', 'dsa', 'system_design', 'case_study'],
}

// Default type for single-option rounds (skip the type step)
const ROUND_DEFAULT_TYPE: Record<string, string> = {
  recruiter_screen: 'behavioral',
  hr: 'behavioral',
  behavioral: 'behavioral',
  case_study: 'case_study',
  managerial: 'behavioral',
}

export default function NewInterviewPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('company_round')
  const [company, setCompany] = useState('generic')
  const [round, setRound] = useState('general')
  const [type, setType] = useState('')
  const [persona, setPersona] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [loading, setLoading] = useState(false)
  const [customQuestions, setCustomQuestions] = useState<string[]>([])
  const [questionInput, setQuestionInput] = useState('')
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumeContext, setResumeContext] = useState<string | null>(null)
  const [parsedResumeName, setParsedResumeName] = useState<string | null>(null)
  const [resumeUploading, setResumeUploading] = useState(false)
  const [resumeError, setResumeError] = useState<string | null>(null)
  const [isSavedResume, setIsSavedResume] = useState(false)
  const [savedResumeChecked, setSavedResumeChecked] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Pre-load saved resume when the user reaches the resume step
  useEffect(() => {
    if (step !== 'resume' || savedResumeChecked) return
    setSavedResumeChecked(true)
    fetch('/api/resume')
      .then((r) => r.json())
      .then(({ resumeContext: saved }) => {
        if (saved && !resumeContext) {
          setResumeContext(saved)
          setParsedResumeName('Saved resume')
          setIsSavedResume(true)
        }
      })
      .catch(() => {})
  }, [step, savedResumeChecked, resumeContext])

  async function clearResume() {
    await fetch('/api/resume', { method: 'DELETE' })
    setResumeContext(null)
    setParsedResumeName(null)
    setIsSavedResume(false)
    setResumeFile(null)
  }

  const allowedTypes = ROUND_TYPE_FILTER[round] ?? ROUND_TYPE_FILTER.general
  const filteredTypes = INTERVIEW_TYPES.filter((t) => allowedTypes.includes(t.id))

  const stepIndex = STEPS.indexOf(step)

  async function handleResumeUpload(file: File) {
    setResumeFile(file)
    setResumeError(null)
    setResumeUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/resume', { method: 'POST', body: fd })
      if (!res.ok) {
        const err = await res.json()
        setResumeError(err.error ?? 'Failed to parse resume')
        setResumeUploading(false)
        return
      }
      const { parsed, resumeContext: ctx } = await res.json()
      setResumeContext(ctx)
      setParsedResumeName(parsed.name ?? file.name)
    } catch {
      setResumeError('Upload failed. Please try again.')
    } finally {
      setResumeUploading(false)
    }
  }

  async function startInterview() {
    const selectedDiff = DIFFICULTIES.find((d) => d.id === difficulty)
    setLoading(true)
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          persona,
          difficulty,
          questionCount: selectedDiff?.questions ?? 5,
          company,
          round,
          resumeContext,
          customQuestions: customQuestions.length > 0 ? customQuestions : undefined,
        }),
      })
      const session = await res.json()
      router.push(`/interview/${session.id}`)
    } catch {
      setLoading(false)
    }
  }

  function goBack() {
    const prev = STEPS[stepIndex - 1]
    if (prev) setStep(prev)
  }

  function goNext() {
    const next = STEPS[stepIndex + 1]
    if (next) setStep(next)
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">New Interview</h1>
          <p className="text-muted-foreground mt-1">Configure your mock interview session</p>
        </div>

        {/* Step progress */}
        <div className="space-y-2">
          <div className="flex gap-1.5">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i < stepIndex ? 'bg-primary/60' : i === stepIndex ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Step {stepIndex + 1} of {STEPS.length} — {STEP_LABELS[step]}
          </p>
        </div>

        {/* Step 1: Company & Round */}
        {step === 'company_round' && (
          <div className="space-y-4">
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Target Company</h2>
              <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1">
                {COMPANIES.map((c) => (
                  <Card
                    key={c.id}
                    className={`cursor-pointer transition-all hover:border-primary ${company === c.id ? 'border-primary bg-primary/5' : ''}`}
                    onClick={() => setCompany(c.id)}
                  >
                    <CardContent className="flex items-center gap-3 p-3">
                      <span className="text-xl">{c.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{c.label}</div>
                        <div className="text-xs text-muted-foreground">{c.description}</div>
                      </div>
                      {company === c.id && <Badge className="shrink-0">Selected</Badge>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Interview Round</h2>
              <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1">
                {ROUNDS.map((r) => (
                  <Card
                    key={r.id}
                    className={`cursor-pointer transition-all hover:border-primary ${round === r.id ? 'border-primary bg-primary/5' : ''}`}
                    onClick={() => setRound(r.id)}
                  >
                    <CardContent className="flex items-center gap-3 p-3">
                      <span className="text-xl">{r.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{r.label}</div>
                        <div className="text-xs text-muted-foreground">{r.description}</div>
                      </div>
                      {round === r.id && <Badge className="shrink-0">Selected</Badge>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Button className="w-full" onClick={() => {
              // If the round locks us to a single type, skip the type step
              const defaultType = ROUND_DEFAULT_TYPE[round]
              if (defaultType) {
                setType(defaultType)
                setStep('persona')
              } else {
                setType('')
                goNext()
              }
            }}>
              Next: Interview Type →
            </Button>
          </div>
        )}

        {/* Step 2: Type */}
        {step === 'type' && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Interview Type</h2>
            {filteredTypes.length < INTERVIEW_TYPES.length && (
              <p className="text-xs text-muted-foreground bg-muted rounded-md px-3 py-2">
                Showing types relevant to the <strong>{ROUNDS.find(r => r.id === round)?.label ?? round}</strong> round.
              </p>
            )}
            {filteredTypes.map((t) => (
              <Card
                key={t.id}
                className={`cursor-pointer transition-all hover:border-primary ${type === t.id ? 'border-primary bg-primary/5' : ''}`}
                onClick={() => setType(t.id)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <span className="text-3xl">{t.icon}</span>
                  <div className="flex-1">
                    <div className="font-semibold">{t.label}</div>
                    <div className="text-sm text-muted-foreground">{t.description}</div>
                  </div>
                  {type === t.id && <Badge>Selected</Badge>}
                </CardContent>
              </Card>
            ))}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={goBack}>← Back</Button>
              <Button className="flex-1" disabled={!type} onClick={goNext}>
                Next: Interviewer Style →
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Persona */}
        {step === 'persona' && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Interviewer Style</h2>
            {PERSONAS.map((p) => (
              <Card
                key={p.id}
                className={`cursor-pointer transition-all hover:border-primary ${persona === p.id ? 'border-primary bg-primary/5' : ''}`}
                onClick={() => setPersona(p.id)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <span className="text-3xl">{p.icon}</span>
                  <div className="flex-1">
                    <div className="font-semibold">{p.label}</div>
                    <div className="text-sm text-muted-foreground">{p.description}</div>
                  </div>
                  {persona === p.id && <Badge>Selected</Badge>}
                </CardContent>
              </Card>
            ))}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={goBack}>← Back</Button>
              <Button className="flex-1" disabled={!persona} onClick={goNext}>
                Next: Difficulty →
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Difficulty */}
        {step === 'difficulty' && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Difficulty Level</h2>
            {DIFFICULTIES.map((d) => (
              <Card
                key={d.id}
                className={`cursor-pointer transition-all hover:border-primary ${difficulty === d.id ? 'border-primary bg-primary/5' : ''}`}
                onClick={() => setDifficulty(d.id)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex-1">
                    <div className="font-semibold">{d.label}</div>
                    <div className="text-sm text-muted-foreground">{d.description}</div>
                  </div>
                  <Badge variant="secondary">{d.questions} questions</Badge>
                  {difficulty === d.id && <Badge>Selected</Badge>}
                </CardContent>
              </Card>
            ))}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={goBack}>← Back</Button>
              <Button className="flex-1" disabled={!difficulty} onClick={goNext}>
                Next: Resume →
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Resume (optional) */}
        {step === 'resume' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Upload Your Resume</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Optional — uploading your resume lets the interviewer ask questions tailored to your specific experience, projects, and skills.
              </p>
            </div>

            <Card
              className={`border-2 border-dashed cursor-pointer transition-colors hover:border-primary ${resumeContext ? 'border-primary bg-primary/5' : ''}`}
              onClick={() => !isSavedResume && fileInputRef.current?.click()}
            >
              <CardContent className="flex flex-col items-center justify-center gap-3 py-10">
                <span className="text-4xl">{resumeContext ? '✅' : '📄'}</span>
                {resumeContext ? (
                  <>
                    <p className="font-medium text-sm">{parsedResumeName ?? 'Resume uploaded'}</p>
                    {isSavedResume ? (
                      <p className="text-xs text-muted-foreground">Loaded from your profile</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Click to replace</p>
                    )}
                  </>
                ) : resumeUploading ? (
                  <p className="text-sm text-muted-foreground animate-pulse">Parsing resume...</p>
                ) : (
                  <>
                    <p className="font-medium text-sm">Click to upload PDF or text file</p>
                    <p className="text-xs text-muted-foreground">PDF, TXT · max 5MB</p>
                  </>
                )}
              </CardContent>
            </Card>

            {resumeContext && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => { setIsSavedResume(false); fileInputRef.current?.click() }}
                >
                  Replace resume
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-red-500 hover:text-red-600"
                  onClick={clearResume}
                >
                  Remove resume
                </Button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.doc,.docx"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleResumeUpload(f)
              }}
            />

            {resumeError && (
              <p className="text-sm text-red-500">{resumeError}</p>
            )}

            {resumeContext && (
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Parsed from resume</p>
                  <pre className="text-xs whitespace-pre-wrap text-foreground/80 max-h-40 overflow-y-auto">
                    {resumeContext}
                  </pre>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={goBack}>← Back</Button>
              <Button className="flex-1" disabled={resumeUploading} onClick={goNext}>
                Next: Custom Questions →
              </Button>
            </div>

            {!resumeContext && (
              <p className="text-center text-xs text-muted-foreground">
                You can skip the resume upload and continue
              </p>
            )}
          </div>
        )}

        {/* Step 6: Custom Questions (optional) */}
        {step === 'questions' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Custom Questions</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Optional — add specific questions you want the interviewer to ask you. Leave empty for auto-generated questions.
              </p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="e.g. Tell me about a time you led a team under pressure"
                value={questionInput}
                onChange={(e) => setQuestionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const q = questionInput.trim()
                    if (q && !customQuestions.includes(q)) {
                      setCustomQuestions([...customQuestions, q])
                      setQuestionInput('')
                    }
                  }
                }}
              />
              <Button
                variant="outline"
                onClick={() => {
                  const q = questionInput.trim()
                  if (q && !customQuestions.includes(q)) {
                    setCustomQuestions([...customQuestions, q])
                    setQuestionInput('')
                  }
                }}
              >
                Add
              </Button>
            </div>

            {customQuestions.length > 0 && (
              <div className="space-y-2">
                {customQuestions.map((q, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-md border bg-muted/40 px-3 py-2">
                    <span className="text-xs font-medium text-muted-foreground mt-0.5 shrink-0">Q{i + 1}</span>
                    <p className="flex-1 text-sm">{q}</p>
                    <button
                      className="text-muted-foreground hover:text-red-500 transition-colors shrink-0 text-xs"
                      onClick={() => setCustomQuestions(customQuestions.filter((_, idx) => idx !== i))}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {customQuestions.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                No custom questions added — the interviewer will choose questions based on your settings.
              </p>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={goBack}>← Back</Button>
              <Button
                className="flex-1"
                disabled={loading}
                onClick={startInterview}
              >
                {loading ? 'Setting up...' : 'Start Interview 🎤'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

