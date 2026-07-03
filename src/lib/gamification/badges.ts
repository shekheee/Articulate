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
]

export function getBadge(id: string): BadgeDefinition | undefined {
  return BADGES.find((b) => b.id === id)
}
