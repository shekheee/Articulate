export interface BadgeDefinition {
  id: string
  name: string
  description: string
  icon: string
}

export const BADGES: BadgeDefinition[] = [
  { id: 'first_practice', name: 'First Steps', description: 'Complete your first practice session', icon: '🌱' },
  { id: 'accent_10', name: 'Accent Regular', description: 'Complete 10 accent sessions', icon: '🎙️' },
  { id: 'accent_50', name: 'Accent Pro', description: 'Complete 50 accent sessions', icon: '🏆' },
  { id: 'streak_3', name: 'On a Roll', description: '3-day practice streak', icon: '🔥' },
  { id: 'streak_7', name: 'Week Warrior', description: '7-day practice streak', icon: '⚡' },
  { id: 'streak_30', name: 'Unstoppable', description: '30-day practice streak', icon: '💎' },
  { id: 'interview_first', name: 'Interview Debut', description: 'Complete your first mock interview', icon: '💼' },
  { id: 'interview_prep', name: 'Prep Master', description: 'Complete an interview prep track session', icon: '🎯' },
  { id: 'level_5', name: 'Rising Star', description: 'Reach level 5', icon: '⭐' },
  { id: 'level_10', name: 'Elite Speaker', description: 'Reach level 10', icon: '👑' },
  { id: 'pronunciation_80', name: 'Crystal Clear', description: 'Score 80%+ on an accent attempt', icon: '✨' },
  { id: 'daily_goal', name: 'Daily Champion', description: 'Hit your daily practice goal', icon: '☀️' },
  { id: 'rp_apprentice', name: 'RP Apprentice', description: 'Complete your first RP feature practice', icon: '🇬🇧' },
  { id: 'rp_non_rhotic', name: 'Silent R Master', description: 'Master non-rhotic R in RP', icon: '🔇' },
  { id: 'rp_trap_bath', name: 'BATH Split', description: 'Master the TRAP–BATH split', icon: '🛁' },
  { id: 'rp_lot', name: 'LOT Locked In', description: 'Master the RP LOT vowel', icon: '🍊' },
  { id: 'rp_prosody', name: 'BBC Tone', description: 'Master RP intonation & stress', icon: '📻' },
  { id: 'rp_graduate', name: 'RP Graduate', description: 'Master all 11 RP features', icon: '🎓' },
]

export function getBadge(id: string): BadgeDefinition | undefined {
  return BADGES.find((b) => b.id === id)
}
