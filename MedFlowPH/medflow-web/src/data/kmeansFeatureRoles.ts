export type KMeansFeatureRole = {
  role: string
  meaning: string
  /** Tailwind border accent (left edge on legend cards). */
  accentClass: string
}

export const KMEANS_FEATURE_ROLES: readonly KMeansFeatureRole[] = [
  {
    role: 'numeric_ready',
    meaning: 'Numeric values already suitable for clustering after cleaning/scaling',
    accentClass: 'border-l-emerald-500/70 dark:border-l-emerald-400/60',
  },
  {
    role: 'low_cardinality_encodable',
    meaning: 'Categorical columns with small/moderate unique values',
    accentClass: 'border-l-sky-500/70 dark:border-l-sky-400/60',
  },
  {
    role: 'high_cardinality_text',
    meaning: 'Text columns with too many unique values',
    accentClass: 'border-l-amber-500/70 dark:border-l-amber-400/60',
  },
  {
    role: 'identifier_skip',
    meaning: 'Identifier/reference columns',
    accentClass: 'border-l-slate-500/60 dark:border-l-slate-400/50',
  },
  {
    role: 'date_derivable',
    meaning: 'Date columns that can generate time-based features',
    accentClass: 'border-l-violet-500/70 dark:border-l-violet-400/60',
  },
  {
    role: 'other_review',
    meaning: 'Columns requiring additional checking before use',
    accentClass: 'border-l-orange-500/70 dark:border-l-orange-400/60',
  },
] as const

export const KMEANS_FEATURE_ROLE_SET = new Set(KMEANS_FEATURE_ROLES.map((r) => r.role))
