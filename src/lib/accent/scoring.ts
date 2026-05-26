/**
 * Word-level pronunciation scoring.
 * Compares Whisper transcription against expected text.
 * Returns per-word scores using normalised Levenshtein distance.
 */

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1])
    }
  }
  return dp[m][n]
}

function normalise(word: string): string {
  return word.toLowerCase().replace(/[^a-z']/g, '')
}

export interface WordScore {
  word: string       // expected word
  matched: boolean   // exact match after normalisation
  score: number      // 0–100
}

export interface PhraseScore {
  wordScores: WordScore[]
  accuracy: number   // 0–100 overall
  transcribed: string
}

export function scoreTranscription(expected: string, transcribed: string): PhraseScore {
  const expectedWords = expected.split(/\s+/).map(normalise).filter(Boolean)
  const transcribedWords = transcribed.split(/\s+/).map(normalise).filter(Boolean)

  // Align expected → transcribed using a greedy nearest-match approach
  const usedIndices = new Set<number>()
  const wordScores: WordScore[] = expectedWords.map((exp) => {
    // Find the best matching transcribed word not yet used
    let bestScore = 0
    let bestIdx = -1
    for (let i = 0; i < transcribedWords.length; i++) {
      if (usedIndices.has(i)) continue
      const tr = transcribedWords[i]
      const maxLen = Math.max(exp.length, tr.length)
      if (maxLen === 0) continue
      const dist = levenshtein(exp, tr)
      const score = Math.round(100 * (1 - dist / maxLen))
      if (score > bestScore) {
        bestScore = score
        bestIdx = i
      }
    }

    if (bestIdx !== -1 && bestScore >= 50) {
      usedIndices.add(bestIdx)
    }

    return {
      word: exp,
      matched: bestScore === 100,
      score: bestScore,
    }
  })

  const accuracy =
    wordScores.length > 0
      ? Math.round(wordScores.reduce((s, w) => s + w.score, 0) / wordScores.length)
      : 0

  return { wordScores, accuracy, transcribed }
}

/** Build a 16-bit PCM WAV buffer from raw Int16 samples at the given sample rate. */
export function buildWav(pcmChunks: Int16Array[], sampleRate: number): ArrayBuffer {
  const totalSamples = pcmChunks.reduce((s, c) => s + c.length, 0)
  const dataBytes = totalSamples * 2
  const buffer = new ArrayBuffer(44 + dataBytes)
  const view = new DataView(buffer)

  const write = (offset: number, value: number, bytes: number, le = true) => {
    if (bytes === 4) view.setUint32(offset, value, le)
    else if (bytes === 2) view.setUint16(offset, value, le)
    else view.setUint8(offset, value)
  }

  // RIFF header
  ;[0x52, 0x49, 0x46, 0x46].forEach((b, i) => write(i, b, 1)) // "RIFF"
  write(4, 36 + dataBytes, 4)
  ;[0x57, 0x41, 0x56, 0x45].forEach((b, i) => write(8 + i, b, 1)) // "WAVE"
  ;[0x66, 0x6d, 0x74, 0x20].forEach((b, i) => write(12 + i, b, 1)) // "fmt "
  write(16, 16, 4)       // chunk size
  write(20, 1, 2)        // PCM
  write(22, 1, 2)        // mono
  write(24, sampleRate, 4)
  write(28, sampleRate * 2, 4) // byte rate
  write(32, 2, 2)        // block align
  write(34, 16, 2)       // bits per sample
  ;[0x64, 0x61, 0x74, 0x61].forEach((b, i) => write(36 + i, b, 1)) // "data"
  write(40, dataBytes, 4)

  const int16View = new Int16Array(buffer, 44)
  let offset = 0
  for (const chunk of pcmChunks) {
    int16View.set(chunk, offset)
    offset += chunk.length
  }

  return buffer
}
