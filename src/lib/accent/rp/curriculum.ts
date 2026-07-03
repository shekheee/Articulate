import type { RPFeature } from './types'

export const ACCENT_TARGET: { id: 'rp'; label: string; flag: string; description: string } = {
  id: 'rp',
  label: 'British RP (Received Pronunciation)',
  flag: '🇬🇧',
  description:
    'Standard Southern British — non-rhotic, BATH-broadening, and crisp BBC-style intonation. Designed for fluent English speakers acquiring a new accent.',
}

export const RP_CURRICULUM: RPFeature[] = [
  {
    id: 'non_rhotic_r',
    order: 1,
    title: 'Non-rhotic R — drop coda R',
    shortTitle: 'Silent R',
    emoji: '🔇',
    rule: 'In RP, /r/ is only pronounced before a vowel (linking R). In syllable coda — after vowels in words like car, park, water — the R is not pronounced. The preceding vowel is lengthened or modified instead.',
    articulatoryTips: [
      'Do not curl the tongue tip for coda R — let the vowel finish cleanly.',
      'In "car", aim for /kɑː/ not /kɑr/.',
      'Keep lips neutral; American rhotic R often adds lip rounding.',
    ],
    targetIpa: 'Coda /r/ → ∅ (silent); linking /r/ before vowels only',
    exampleWords: [
      { word: 'car', ipa: '/kɑː/' },
      { word: 'park', ipa: '/pɑːk/' },
      { word: 'water', ipa: '/ˈwɔːtə/' },
      { word: 'better', ipa: '/ˈbetə/' },
    ],
    minimalPairs: [
      { rp: 'car', contrast: 'car (GA rhotic)', rpIpa: '/kɑː/', contrastIpa: '/kɑr/', note: 'No tongue curl at the end in RP' },
      { rp: 'hard', contrast: 'hard (GA)', rpIpa: '/hɑːd/', contrastIpa: '/hɑrd/', note: 'Final consonant is /d/ only' },
    ],
    practicePhrases: [
      { id: 'nr_1', text: 'Park the car near the harbour.', focusWords: ['park', 'car', 'harbour'] },
      { id: 'nr_2', text: 'Turn left at the corner of the first floor.', focusWords: ['turn', 'corner', 'first', 'floor'] },
      { id: 'nr_3', text: 'The actor wore a better sweater for the winter weather.', focusWords: ['actor', 'better', 'sweater', 'winter', 'weather'] },
    ],
    badgeId: 'rp_non_rhotic',
  },
  {
    id: 'trap_bath',
    order: 2,
    title: 'TRAP–BATH split — broad /ɑː/',
    shortTitle: 'BATH vowel',
    emoji: '🛁',
    rule: 'RP uses a long broad /ɑː/ in BATH words (bath, glass, dance, path, chance) while TRAP words (cat, trap, man) keep short /æ/. This is one of the most recognisable RP features.',
    articulatoryTips: [
      'Open the mouth wider and lower the jaw for /ɑː/ — think "ah" as in a doctor checking your throat.',
      'Hold the vowel slightly longer in BATH words.',
      'Do not use American /æ/ in bath, glass, or dance.',
    ],
    targetIpa: 'BATH set → /ɑː/ (not /æ/)',
    exampleWords: [
      { word: 'bath', ipa: '/bɑːθ/' },
      { word: 'glass', ipa: '/ɡlɑːs/' },
      { word: 'dance', ipa: '/dɑːns/' },
      { word: 'path', ipa: '/pɑːθ/' },
      { word: 'trap', ipa: '/træp/', note: 'TRAP — stays short /æ/' },
    ],
    minimalPairs: [
      { rp: 'bath', contrast: 'bat', rpIpa: '/bɑːθ/', contrastIpa: '/bæt/', note: 'Long open back vs short front' },
      { rp: 'glass', contrast: 'gas', rpIpa: '/ɡlɑːs/', contrastIpa: '/ɡæs/', note: 'BATH broadening' },
    ],
    practicePhrases: [
      { id: 'tb_1', text: 'The staff danced on the path after class.', focusWords: ['staff', 'danced', 'path', 'class'] },
      { id: 'tb_2', text: 'I cannot take a bath after half past four.', focusWords: ['cannot', 'bath', 'half', 'past'] },
      { id: 'tb_3', text: 'The glass of water was on the grass in the garden.', focusWords: ['glass', 'grass', 'garden'] },
    ],
    badgeId: 'rp_trap_bath',
  },
  {
    id: 'lot_vowel',
    order: 3,
    title: 'LOT vowel — /ɒ/',
    shortTitle: 'LOT /ɒ/',
    emoji: '🍊',
    rule: 'RP LOT words (hot, lot, dog, stop) use a rounded short /ɒ/ — back and slightly rounded, not American /ɑ/.',
    articulatoryTips: [
      'Round lips lightly for /ɒ/.',
      'Keep it short — do not turn it into /ɔː/.',
      'Compare: "cot" in RP vs American "caught" confusion — stay short.',
    ],
    targetIpa: 'LOT → /ɒ/',
    exampleWords: [
      { word: 'hot', ipa: '/hɒt/' },
      { word: 'lot', ipa: '/lɒt/' },
      { word: 'dog', ipa: '/dɒɡ/' },
      { word: 'stop', ipa: '/stɒp/' },
    ],
    minimalPairs: [
      { rp: 'cot', contrast: 'caught (GA)', rpIpa: '/kɒt/', contrastIpa: '/kɔt/', note: 'RP keeps LOT short' },
    ],
    practicePhrases: [
      { id: 'lot_1', text: 'Stop the dog from jumping on the hot pot.', focusWords: ['stop', 'dog', 'hot', 'pot'] },
      { id: 'lot_2', text: 'A lot of stock was lost in the shop.', focusWords: ['lot', 'stock', 'lost', 'shop'] },
    ],
    badgeId: 'rp_lot',
  },
  {
    id: 'thought_vowel',
    order: 4,
    title: 'THOUGHT vowel — /ɔː/',
    shortTitle: 'THOUGHT /ɔː/',
    emoji: '🎭',
    rule: 'THOUGHT words (thought, law, call, water) use a long /ɔː/ in RP. This is longer and more open than LOT /ɒ/.',
    articulatoryTips: [
      'Round lips and hold the vowel — /ɔː/ is long.',
      'In "water", first syllable is /wɔː/ with silent R (see non-rhotic unit).',
      'Do not confuse with short LOT /ɒ/.',
    ],
    targetIpa: 'THOUGHT → /ɔː/',
    exampleWords: [
      { word: 'thought', ipa: '/θɔːt/' },
      { word: 'law', ipa: '/lɔː/' },
      { word: 'call', ipa: '/kɔːl/' },
      { word: 'water', ipa: '/ˈwɔːtə/' },
    ],
    minimalPairs: [
      { rp: 'caught', contrast: 'cot', rpIpa: '/kɔːt/', contrastIpa: '/kɒt/', note: 'Long THOUGHT vs short LOT' },
    ],
    practicePhrases: [
      { id: 'th_1', text: 'I thought the law was called off.', focusWords: ['thought', 'law', 'called'] },
      { id: 'th_2', text: 'Draw a small dot on the board before the talk.', focusWords: ['draw', 'board', 'talk'] },
    ],
  },
  {
    id: 'goat_vowel',
    order: 5,
    title: 'GOAT diphthong — /əʊ/',
    shortTitle: 'GOAT /əʊ/',
    emoji: '🐐',
    rule: 'RP GOAT words use /əʊ/ — a diphthong starting with schwa and gliding to rounded /ʊ/. American /oʊ/ starts further back.',
    articulatoryTips: [
      'Start neutral (schwa) then glide to a short /ʊ/.',
      'Avoid a monophthongal American /o/.',
      'Words: go, home, open, know.',
    ],
    targetIpa: 'GOAT → /əʊ/ (not /oʊ/)',
    exampleWords: [
      { word: 'go', ipa: '/ɡəʊ/' },
      { word: 'home', ipa: '/həʊm/' },
      { word: 'open', ipa: '/ˈəʊpən/' },
      { word: 'know', ipa: '/nəʊ/' },
    ],
    minimalPairs: [],
    practicePhrases: [
      { id: 'go_1', text: 'Go home and open the window slowly.', focusWords: ['go', 'home', 'open', 'slowly'] },
      { id: 'go_2', text: 'I know the old boat will float.', focusWords: ['know', 'old', 'boat', 'float'] },
    ],
  },
  {
    id: 'face_price_mouth',
    order: 6,
    title: 'FACE, PRICE & MOUTH diphthongs',
    shortTitle: 'FACE/PRICE/MOUTH',
    emoji: '🎵',
    rule: 'RP uses /eɪ/ in FACE (day, make), /aɪ/ in PRICE (time, like), and /aʊ/ in MOUTH (now, house). Glides should be crisp but not exaggerated.',
    articulatoryTips: [
      'FACE /eɪ/: start mid-front, glide to close — "day", "make".',
      'PRICE /aɪ/: start open /a/, glide to /ɪ/ — avoid monophthong.',
      'MOUTH /aʊ/: start open, glide to rounded /ʊ/ — "now", "house".',
    ],
    targetIpa: 'FACE /eɪ/, PRICE /aɪ/, MOUTH /aʊ/',
    exampleWords: [
      { word: 'day', ipa: '/deɪ/' },
      { word: 'make', ipa: '/meɪk/' },
      { word: 'time', ipa: '/taɪm/' },
      { word: 'now', ipa: '/naʊ/' },
      { word: 'house', ipa: '/haʊs/' },
    ],
    minimalPairs: [
      { rp: 'late', contrast: 'let', rpIpa: '/leɪt/', contrastIpa: '/let/', note: 'FACE vs short vowel' },
    ],
    practicePhrases: [
      { id: 'fpm_1', text: 'Make time to buy a house by the lake today.', focusWords: ['make', 'time', 'house', 'lake', 'today'] },
      { id: 'fpm_2', text: 'I like the way you smile now and then.', focusWords: ['like', 'way', 'smile', 'now'] },
    ],
  },
  {
    id: 'clear_dark_l',
    order: 7,
    title: 'Clear L vs dark L',
    shortTitle: 'Clear/dark L',
    emoji: '👅',
    rule: 'RP has clear /l/ before vowels (light, leap) and dark /ɫ/ (velarised) in coda (ball, milk, people). Dark L has a thicker, back-tongue quality.',
    articulatoryTips: [
      'Clear L: tongue tip up, light contact — before vowels.',
      'Dark L: raise the back of the tongue toward the velum in coda.',
      'In "full" and "people", the final L is dark.',
    ],
    targetIpa: 'Clear /l/ vs dark /ɫ/ in coda',
    exampleWords: [
      { word: 'light', ipa: '/laɪt/', note: 'clear L' },
      { word: 'ball', ipa: '/bɔːɫ/' },
      { word: 'milk', ipa: '/mɪɫk/' },
      { word: 'people', ipa: '/ˈpiːpɫ/' },
    ],
    minimalPairs: [],
    practicePhrases: [
      { id: 'l_1', text: 'Little children love milk and apples.', focusWords: ['little', 'love', 'milk', 'apples'] },
      { id: 'l_2', text: 'The full bottle fell on the table.', focusWords: ['full', 'bottle', 'fell', 'table'] },
    ],
  },
  {
    id: 'crisp_t',
    order: 8,
    title: 'Crisp /t/ — clear T and glottal stops',
    shortTitle: 'Crisp T',
    emoji: '⚡',
    rule: 'RP often uses a clear alveolar /t/ in careful speech; in casual RP, intervocalic /t/ may become a glottal stop (ʔ) as in "better", "city". Avoid American flapped T.',
    articulatoryTips: [
      'For clear T: tongue tip touches alveolar ridge, release with a small burst.',
      'Glottal stop: hold breath briefly in the glottis between vowels.',
      'In "water", many RP speakers use a clear or lightly glottalised T.',
    ],
    targetIpa: '/t/ or glottal [ʔ] between vowels',
    exampleWords: [
      { word: 'water', ipa: '/ˈwɔːtə/' },
      { word: 'better', ipa: '/ˈbetə/' },
      { word: 'city', ipa: '/ˈsɪti/' },
      { word: 'little', ipa: '/ˈlɪtɫ/' },
    ],
    minimalPairs: [],
    practicePhrases: [
      { id: 't_1', text: 'I got a letter from the city centre.', focusWords: ['got', 'letter', 'city', 'centre'] },
      { id: 't_2', text: 'It is a little bit better than the last time.', focusWords: ['little', 'bit', 'better', 'last', 'time'] },
    ],
  },
  {
    id: 'linking_intrusive_r',
    order: 9,
    title: 'Linking & intrusive R',
    shortTitle: 'Linking R',
    emoji: '🔗',
    rule: 'When a word ends in /ɑː/, /ɔː/, /ə/ etc. and the next word starts with a vowel, RP inserts a linking /r/: "far away" → /fɑː rəweɪ/. Intrusive R also appears in "idea of" → /aɪdɪərəv/.',
    articulatoryTips: [
      'Only link when the next word starts with a vowel sound.',
      'Light tongue curl — a quick /r/ bridge between words.',
      'Practise with pauses removed: "far_away", "saw_it".',
    ],
    targetIpa: 'Linking/intrusive /r/ across word boundaries',
    exampleWords: [
      { word: 'far away', ipa: '/fɑː rəweɪ/' },
      { word: 'saw it', ipa: '/sɔː rɪt/' },
      { word: 'idea of', ipa: '/aɪdɪərəv/' },
    ],
    minimalPairs: [
      { rp: 'far away', contrast: 'far way (no link)', rpIpa: '/fɑː rəweɪ/', contrastIpa: '/fɑː weɪ/', note: 'Insert /r/ before vowel' },
    ],
    practicePhrases: [
      { id: 'lr_1', text: 'The car is over there near the area of the park.', focusWords: ['car', 'over', 'there', 'area', 'park'] },
      { id: 'lr_2', text: 'I saw a idea of how to draw it out.', focusWords: ['saw', 'idea', 'draw'] },
    ],
  },
  {
    id: 'happy_tensing',
    order: 10,
    title: 'happY-tensing — final /i/',
    shortTitle: 'happY /i/',
    emoji: '😊',
    rule: 'In modern RP, unstressed endings in happy, city, coffee often use /i/ (tense) rather than /ɪ/ (lax). This brightens the end of words.',
    articulatoryTips: [
      'Final vowel in "-y" words is closer and slightly longer — /i/ not /ɪ/.',
      'Do not reduce to schwa.',
      'Compare "city" /ˈsɪti/ vs older /ˈsɪtɪ/.',
    ],
    targetIpa: 'Unstressed final → /i/ (happY-tensing)',
    exampleWords: [
      { word: 'happy', ipa: '/ˈhæpi/' },
      { word: 'city', ipa: '/ˈsɪti/' },
      { word: 'coffee', ipa: '/ˈkɒfi/' },
      { word: 'easy', ipa: '/ˈiːzi/' },
    ],
    minimalPairs: [],
    practicePhrases: [
      { id: 'ht_1', text: 'The happy city feels easy and pretty.', focusWords: ['happy', 'city', 'easy', 'pretty'] },
      { id: 'ht_2', text: 'I drink coffee daily in the busy lobby.', focusWords: ['coffee', 'daily', 'busy', 'lobby'] },
    ],
  },
  {
    id: 'rp_prosody',
    order: 11,
    title: 'RP intonation & stress',
    shortTitle: 'RP prosody',
    emoji: '📻',
    rule: 'RP uses predictable stress on content words, falling tones on statements, and wider pitch range than flat American delivery. Nuclear stress falls on the last prominent syllable in a phrase.',
    articulatoryTips: [
      'Statements fall in pitch at the end — avoid uptalk unless asking.',
      'Stress content words (nouns, main verbs); reduce function words.',
      'Use slight pauses at phrase boundaries for clarity.',
    ],
    targetIpa: 'Falling tone; phrase-final stress',
    exampleWords: [
      { word: 'Absolutely.', ipa: 'falling tone' },
      { word: 'I see.', ipa: 'falling tone' },
    ],
    minimalPairs: [],
    practicePhrases: [
      { id: 'pro_1', text: 'That is absolutely correct, I completely agree.', focusWords: ['absolutely', 'correct', 'completely', 'agree'] },
      { id: 'pro_2', text: 'Would you like tea, or shall we begin the meeting?', focusWords: ['tea', 'begin', 'meeting'] },
    ],
    badgeId: 'rp_prosody',
  },
]

export function getRPFeature(id: string): RPFeature | undefined {
  return RP_CURRICULUM.find((f) => f.id === id)
}

export function getRPFeatureByOrder(order: number): RPFeature | undefined {
  return RP_CURRICULUM.find((f) => f.order === order)
}

export function getPracticePhrase(featureId: string, phraseId: string) {
  const feature = getRPFeature(featureId)
  return feature?.practicePhrases.find((p) => p.id === phraseId)
}
