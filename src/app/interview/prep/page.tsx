import { PageShell } from '@/components/layout/PageShell'
import { PrepClient } from './PrepClient'

export default function InterviewPrepPage() {
  return (
    <PageShell maxWidth="md">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Interview Prep</h1>
          <p className="text-muted-foreground mt-1">
            DS / ML / AI tracks — speak aloud, get delivery + content feedback.
          </p>
        </div>
        <PrepClient />
      </div>
    </PageShell>
  )
}
