import type { CSSProperties } from 'react'

const BONE_BASE: CSSProperties = { backgroundColor: 'var(--dash-card-inner)' }
const CARD_STYLE: CSSProperties = { backgroundColor: 'var(--dash-card)', borderColor: 'var(--dash-border)' }

function Bone({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <div
      className={`animate-pulse rounded-xl ${className ?? ''}`}
      style={{ ...BONE_BASE, ...style }}
    />
  )
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      {/* Section 1 – 4 KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Bone className="h-36 sm:col-span-2 xl:col-span-1" />
        <Bone className="h-36" />
        <Bone className="h-36" />
        <Bone className="h-36" />
      </div>

      {/* Section 2 – Course progress bars */}
      <div className="rounded-2xl border p-6" style={CARD_STYLE}>
        <Bone className="mb-6 h-6 w-48 rounded-lg" />
        <div className="space-y-5">
          {[100, 75, 60, 40].map((w) => (
            <div key={w} className="space-y-2">
              <div className="flex justify-between">
                <Bone className="h-4 rounded-lg" style={{ width: `${w}%` }} />
                <Bone className="h-4 w-10 rounded-lg" />
              </div>
              <Bone className="h-2.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Section 3 – Trend chart */}
      <Bone className="h-72 rounded-2xl" />

      {/* Section 4 – Performance cards */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Bone className="h-52" />
        <Bone className="h-52" />
        <Bone className="h-52" />
      </div>

      {/* Section 5 – Goals */}
      <div className="rounded-2xl border p-6" style={CARD_STYLE}>
        <Bone className="mb-5 h-6 w-40 rounded-lg" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Bone key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Section 6 – AI Insights */}
      <Bone className="h-48 rounded-2xl" />
    </div>
  )
}
