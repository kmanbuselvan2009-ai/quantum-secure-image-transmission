import React from 'react'

/**
 * StepCard — base wrapper for each experiment step.
 * Props:
 *   state: 'active' | 'done' | 'future'
 *   number: display number string e.g. "01"
 *   title: step title
 *   summary: short text shown when collapsed (done state)
 *   children: full step body content
 */
export default function StepCard({ state, number, title, summary, children }) {
  const isDone = state === 'done'
  const isActive = state === 'active'
  const isFuture = state === 'future'

  return (
    <div className={`step-card ${state}`} aria-hidden={isFuture}>
      <div className="step-header">
        <span className="step-number">{isDone ? '✓' : number}</span>
        <span className="step-title">{title}</span>
        {isActive && (
          <span className="step-status-badge active">In progress</span>
        )}
        {isDone && (
          <span className="step-status-badge done">Complete</span>
        )}
      </div>

      {/* Collapsed summary for done steps */}
      {isDone && summary && (
        <div className="step-summary">{summary}</div>
      )}

      {/* Full body only when active */}
      {isActive && (
        <div className="step-body">
          {children}
        </div>
      )}
    </div>
  )
}
