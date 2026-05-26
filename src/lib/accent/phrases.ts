export type Accent = 'british' | 'irish'
export type AccentMode = 'shadowing' | 'drill' | 'coach'
export type PhraseLevel = 1 | 2 | 3 // 1=beginner, 2=intermediate, 3=advanced

export interface AccentPhrase {
  id: string
  accent: Accent
  level: PhraseLevel
  feature: string        // phonetic feature being trained
  featureLabel: string   // human-readable
  text: string
  tip: string            // pronunciation tip shown after attempt
}

// ─── British RP ────────────────────────────────────────────────────────────

const BRITISH: AccentPhrase[] = [
  // Level 1 — BATH/TRAP split (most distinctive RP feature)
  {
    id: 'brit_bath_01',
    accent: 'british', level: 1,
    feature: 'BATH vowel',
    featureLabel: 'BATH vowel (broad ɑː)',
    text: 'The staff danced on the path after class.',
    tip: 'In RP, words like "bath", "path", "staff", "dance" use a long broad "aː" sound — like the "a" in "father". Avoid the short American "æ".',
  },
  {
    id: 'brit_bath_02',
    accent: 'british', level: 1,
    feature: 'BATH vowel',
    featureLabel: 'BATH vowel (broad ɑː)',
    text: 'I can\'t take a bath after half past four.',
    tip: '"Bath", "can\'t", "half", "after" all take the long "ɑː" in RP. Hold the vowel slightly longer.',
  },
  {
    id: 'brit_bath_03',
    accent: 'british', level: 1,
    feature: 'BATH vowel',
    featureLabel: 'BATH vowel (broad ɑː)',
    text: 'The glass of water was on the grass in the garden.',
    tip: '"Glass" and "grass" use the broad "aː" in RP. "Garden" uses the same vowel in the first syllable.',
  },
  // Level 1 — non-rhotic
  {
    id: 'brit_rhotic_01',
    accent: 'british', level: 1,
    feature: 'non-rhotic',
    featureLabel: 'Non-rhotic (silent r)',
    text: 'Park the car near the harbour.',
    tip: 'RP is non-rhotic: the "r" in "park", "car", and "harbour" is silent unless followed by a vowel. The vowel stretches instead: "caː", "paːk".',
  },
  {
    id: 'brit_rhotic_02',
    accent: 'british', level: 1,
    feature: 'non-rhotic',
    featureLabel: 'Non-rhotic (silent r)',
    text: 'Turn left at the corner of the first floor.',
    tip: '"Turn", "corner", "first", "floor" — the "r" is not pronounced unless a vowel follows. Say "tɜːn", "fɜːst".',
  },
  // Level 1 — GOAT vowel (monophthong)
  {
    id: 'brit_goat_01',
    accent: 'british', level: 1,
    feature: 'GOAT vowel',
    featureLabel: 'GOAT vowel (əʊ)',
    text: 'Go home and open the window.',
    tip: 'In RP, "go", "home", "open" use a "əʊ" diphthong starting with a neutral schwa. Avoid the American "oʊ" which starts further back.',
  },
  // Level 2 — T-glottaling and linking
  {
    id: 'brit_t_01',
    accent: 'british', level: 2,
    feature: 'glottal T',
    featureLabel: 'Glottal stop / T',
    text: 'I got a letter from the city centre.',
    tip: 'In casual RP, the "t" in "got", "letter", "city" can become a glottal stop (ʔ) between vowels. This is very natural in British speech.',
  },
  {
    id: 'brit_link_01',
    accent: 'british', level: 2,
    feature: 'linking R',
    featureLabel: 'Linking R',
    text: 'There are four of us here at the door.',
    tip: '"There are" links with an "r": "thəˈrɑː". A linking R appears when a word ends in a vowel sound and the next word starts with a vowel.',
  },
  {
    id: 'brit_yod_01',
    accent: 'british', level: 2,
    feature: 'yod',
    featureLabel: 'Yod (retained "ew" sound)',
    text: 'The student was due to report on Tuesday.',
    tip: 'RP retains the "yod" (j sound): "stjuːdənt", "djuː", "tjuːzdeɪ". American English drops this "y" sound.',
  },
  {
    id: 'brit_schedule_01',
    accent: 'british', level: 2,
    feature: 'sch-',
    featureLabel: '"Schedule" pronunciation',
    text: 'Check the schedule before the scheme begins.',
    tip: '"Schedule" in RP is "ʃɛdjuːl" (sh-), not "skɛdjuːl". "Scheme" is "skiːm" (hard k). Get both right in one sentence.',
  },
  // Level 3 — connected speech + rhythm
  {
    id: 'brit_rhythm_01',
    accent: 'british', level: 3,
    feature: 'rhythm',
    featureLabel: 'Stress-timed rhythm',
    text: 'I was wondering whether it would be better to write a letter.',
    tip: 'RP is stress-timed: stressed syllables come at roughly equal intervals. Unstressed words like "was", "it", "to", "a" get reduced to schwa sounds — "wəz", "ɪt", "tə".',
  },
  {
    id: 'brit_rhythm_02',
    accent: 'british', level: 3,
    feature: 'rhythm',
    featureLabel: 'Weak forms',
    text: 'Can you tell me what time it is at the moment?',
    tip: 'Weak forms: "can" → "kən", "to" → "tə", "at" → "ət", "the" → "ðə". Only "CAN" and "TIME" carry primary stress here.',
  },
  {
    id: 'brit_intonation_01',
    accent: 'british', level: 3,
    feature: 'intonation',
    featureLabel: 'Falling intonation on statements',
    text: 'I think it is quite likely that he will come tomorrow.',
    tip: 'RP statements end with a falling tone starting on the last stressed syllable ("to-MOR-row" falls). Avoid the rising intonation pattern common in other varieties.',
  },
]

// ─── Irish English ─────────────────────────────────────────────────────────

const IRISH: AccentPhrase[] = [
  // Level 1 — fully rhotic
  {
    id: 'irish_rhotic_01',
    accent: 'irish', level: 1,
    feature: 'rhotic',
    featureLabel: 'Rhotic r (pronounced everywhere)',
    text: 'The girl heard the birds stirring early in the morning.',
    tip: 'Irish English is fully rhotic — every "r" is pronounced. "Girl", "heard", "birds", "stirring", "early", "morning" all have a clear "r" sound.',
  },
  {
    id: 'irish_rhotic_02',
    accent: 'irish', level: 1,
    feature: 'rhotic',
    featureLabel: 'Rhotic r',
    text: 'Turn right at the first corner near the park.',
    tip: 'Roll or tap every "r" lightly. "Turn" → "tʊrn", "first" → "fɪrst", "corner" → "kɔːrnər". The r colours the vowel before it.',
  },
  // Level 1 — BATH stays short (no split)
  {
    id: 'irish_bath_01',
    accent: 'irish', level: 1,
    feature: 'BATH vowel',
    featureLabel: 'BATH vowel (short a, no split)',
    text: 'The path through the grass was fast and flat.',
    tip: 'Unlike RP, Irish English does NOT have the BATH/TRAP split. "Path", "grass", "fast" all use the same short "a" as "cat". Avoid lengthening these vowels.',
  },
  // Level 1 — th → t/d
  {
    id: 'irish_th_01',
    accent: 'irish', level: 1,
    feature: 'th→t/d',
    featureLabel: 'th → t/d (dental stops)',
    text: 'There are thirty three trees in the garden.',
    tip: 'In Irish English, "th" is often pronounced as dental "t" or "d": "dere" (there), "tirty" (thirty), "tree" (three). The tongue touches the back of the teeth.',
  },
  {
    id: 'irish_th_02',
    accent: 'irish', level: 1,
    feature: 'th→t/d',
    featureLabel: 'th → t/d',
    text: 'I think that the weather is with us today.',
    tip: '"Think" → "tink", "that" → "dat", "the" → "de", "weather" → "wedder", "with" → "wit". Both voiced (ð) and voiceless (θ) th shift.',
  },
  // Level 1 — GOAT vowel difference
  {
    id: 'irish_goat_01',
    accent: 'irish', level: 1,
    feature: 'GOAT vowel',
    featureLabel: 'GOAT vowel (Irish oh)',
    text: 'Go over to the road and close the door.',
    tip: 'Irish "goat" vowel is a pure monophthong "oː" (like French "eau"), with no diphthong glide. Avoid the RP "əʊ" glide.',
  },
  // Level 2 — FACE vowel
  {
    id: 'irish_face_01',
    accent: 'irish', level: 2,
    feature: 'FACE vowel',
    featureLabel: 'FACE vowel (Irish eː)',
    text: 'They say the same name came from the lake.',
    tip: 'Irish "face" vowel is a long monophthong "eː", not the diphthong "eɪ" of RP or GA. "Same", "name", "came", "lake" → hold the "e" steady.',
  },
  {
    id: 'irish_yod_01',
    accent: 'irish', level: 2,
    feature: 'yod',
    featureLabel: 'Retained yod',
    text: 'A new student is due on Tuesday afternoon.',
    tip: 'Like RP, Irish retains the yod: "njuː" (new), "stjuːdənt" (student), "djuː" (due), "tjuːzdeɪ" (Tuesday).',
  },
  {
    id: 'irish_intonation_01',
    accent: 'irish', level: 2,
    feature: 'intonation',
    featureLabel: 'Irish rising intonation',
    text: 'I was just wondering if you\'d like a cup of tea.',
    tip: 'Irish English often uses a raised, melodic intonation — sentences tend to rise slightly before the end rather than fall sharply as in RP.',
  },
  // Level 3
  {
    id: 'irish_h_01',
    accent: 'irish', level: 3,
    feature: 'h-dropping',
    featureLabel: '"h" in question words',
    text: 'Where did he go and why did he leave so early?',
    tip: 'In fast Irish speech, "he" → "e", "her" → "er", "him" → "im". The "h" is often dropped on unstressed pronouns.',
  },
  {
    id: 'irish_rhythm_01',
    accent: 'irish', level: 3,
    feature: 'rhythm',
    featureLabel: 'Irish syllable-timed rhythm',
    text: 'I was thinking about it and I said to myself that it was grand.',
    tip: 'Irish English tends to be more syllable-timed than British — each syllable gets more equal weight. Avoid swallowing unstressed syllables the way GA does.',
  },
  {
    id: 'irish_connected_01',
    accent: 'irish', level: 3,
    feature: 'connected speech',
    featureLabel: 'Connected speech (Irish)',
    text: 'Will you have a bit of bread and butter with your tea?',
    tip: '"Will you" → "wilja", "bit of" → "birov", "and" → "ən". Irish connected speech is fluid — words run together naturally without the hard stops of American English.',
  },
]

// ─── Exports ──────────────────────────────────────────────────────────────

export const PHRASES: AccentPhrase[] = [...BRITISH, ...IRISH]

export function getPhrases(accent: Accent, level?: PhraseLevel): AccentPhrase[] {
  return PHRASES.filter((p) => p.accent === accent && (level === undefined || p.level === level))
}

export function getPhrase(id: string): AccentPhrase | undefined {
  return PHRASES.find((p) => p.id === id)
}

/** Compute user's unlocked level for a given accent based on best scores. */
export function computeAccentLevel(
  bestScores: Record<string, number>, // phraseId → bestScore
  accent: Accent
): PhraseLevel {
  const l1 = getPhrases(accent, 1)
  const l2 = getPhrases(accent, 2)

  const avgL1 = l1.length > 0
    ? l1.reduce((s, p) => s + (bestScores[p.id] ?? 0), 0) / l1.length
    : 0
  const avgL2 = l2.length > 0
    ? l2.reduce((s, p) => s + (bestScores[p.id] ?? 0), 0) / l2.length
    : 0

  if (avgL1 >= 75 && avgL2 >= 75) return 3
  if (avgL1 >= 75) return 2
  return 1
}
