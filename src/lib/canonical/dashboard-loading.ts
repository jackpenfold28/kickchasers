export type DeferredDashboardSection = 'liveAroundMe' | 'leaderboard'

type DeferredState = {
  pendingSections?: DeferredDashboardSection[]
  sectionErrors?: Partial<Record<DeferredDashboardSection, string>>
}

// Merge only the section that completed: a late colour update must not undo a retry.
export function mergeDashboardUpdate<T extends DeferredState>(current: T | null, patch: Partial<T>, completed?: DeferredDashboardSection): T {
  if (!current) return patch as T
  if (!completed) return { ...current, ...patch }
  return {
    ...current,
    ...patch,
    pendingSections: current.pendingSections?.filter((key) => key !== completed),
    sectionErrors: { ...current.sectionErrors, [completed]: patch.sectionErrors?.[completed] },
  }
}
