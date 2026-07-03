export type PrepTrack =
  | 'ml_technical'
  | 'ml_system_design'
  | 'stats_probability'
  | 'sql_coding'
  | 'behavioral_ds'
  | 'rag_llm'

export interface PrepTrackInfo {
  id: PrepTrack
  label: string
  icon: string
  description: string
  interviewType: 'behavioral' | 'dsa' | 'system_design' | 'case_study'
  persona: 'google' | 'amazon' | 'startup' | 'strict' | 'friendly'
  questionCount: number
  questions: string[]
}

export const PREP_TRACKS: PrepTrackInfo[] = [
  {
    id: 'ml_technical',
    label: 'ML & AI Concepts',
    icon: '🧠',
    description: 'Bias-variance, regularization, embeddings, transformers, evaluation metrics',
    interviewType: 'behavioral',
    persona: 'google',
    questionCount: 5,
    questions: [
      'Explain the bias-variance tradeoff and how you would diagnose high bias vs high variance on a real project.',
      'Walk me through how gradient descent works and why learning rate matters in practice.',
      'What is the difference between L1 and L2 regularization, and when would you choose each?',
      'How do you evaluate a classification model beyond accuracy? Which metrics would you pick for an imbalanced fraud detection problem?',
      'Explain how attention works in transformers at a level you would use in a technical interview.',
    ],
  },
  {
    id: 'rag_llm',
    label: 'RAG & LLM Systems',
    icon: '🔗',
    description: 'Retrieval, chunking, hallucination, agents — tailored for AI engineer roles',
    interviewType: 'system_design',
    persona: 'startup',
    questionCount: 5,
    questions: [
      'Design a RAG pipeline for an internal knowledge base. Cover ingestion, chunking, retrieval, and generation.',
      'How would you reduce hallucinations in a production LLM application while keeping latency acceptable?',
      'Explain your approach to chunking documents for retrieval. What trade-offs did you face on a real project?',
      'How do you evaluate RAG quality offline and in production? What metrics and guardrails would you implement?',
      'When would you fine-tune a model vs use RAG vs prompt engineering? Give a concrete decision framework.',
    ],
  },
  {
    id: 'ml_system_design',
    label: 'ML System Design',
    icon: '🏗️',
    description: 'Pipelines, deployment, monitoring, drift, A/B testing at scale',
    interviewType: 'system_design',
    persona: 'amazon',
    questionCount: 5,
    questions: [
      'Design a demand forecasting system for a global beverage company with thousands of SKUs and regional seasonality.',
      'How would you deploy a model that retrains weekly and serves predictions in near real time?',
      'What monitoring would you put in place after shipping an ML model to production? How do you detect data drift?',
      'Walk through how you would run an A/B test for a new recommendation model without harming core business metrics.',
      'Describe an ML pipeline from raw data to model registry to serving. Where have you seen bottlenecks in production?',
    ],
  },
  {
    id: 'stats_probability',
    label: 'Stats & Probability',
    icon: '📊',
    description: 'Hypothesis testing, distributions, Bayesian thinking, experiment design',
    interviewType: 'behavioral',
    persona: 'strict',
    questionCount: 4,
    questions: [
      'Explain p-values and confidence intervals to a stakeholder who thinks p=0.05 means the result is 95% likely to be true.',
      'When would you use a t-test vs Mann-Whitney vs chi-squared? Walk through a real example from your work.',
      'A forecast looks great in backtesting but fails in production. What statistical or methodological mistakes might explain that?',
      'How would you design an experiment to measure the impact of a pricing change with confounding seasonality?',
    ],
  },
  {
    id: 'sql_coding',
    label: 'SQL & Coding Talk-through',
    icon: '💻',
    description: 'Explain SQL logic, pandas workflows, and coding decisions out loud',
    interviewType: 'dsa',
    persona: 'google',
    questionCount: 4,
    questions: [
      'Talk through how you would write a SQL query to find the top 3 products by revenue per region for the last 90 days, including ties.',
      'Explain how you would detect and handle duplicate rows in a messy sales table before building a forecast.',
      'Describe out loud how you would implement a rolling 7-day average in SQL or pandas and why window functions help.',
      'You need to join a 500M-row events table to a users table efficiently. Walk through your approach and indexing strategy.',
    ],
  },
  {
    id: 'behavioral_ds',
    label: 'Behavioral (DS / AI Roles)',
    icon: '🎯',
    description: 'STAR stories for data science, ML impact, cross-functional work, failure',
    interviewType: 'behavioral',
    persona: 'amazon',
    questionCount: 5,
    questions: [
      'Tell me about a time you translated a vague business problem into a measurable ML or analytics solution.',
      'Describe a project where your model or analysis changed a business decision. What was the measurable impact?',
      'Tell me about a time an ML model failed or underperformed in production. What did you do?',
      'Give an example of pushing back on a stakeholder who wanted a solution that was not statistically sound.',
      'Tell me about a time you had to explain a complex technical result to a non-technical audience.',
    ],
  },
]

export function getPrepTrack(id: PrepTrack): PrepTrackInfo | undefined {
  return PREP_TRACKS.find((t) => t.id === id)
}
