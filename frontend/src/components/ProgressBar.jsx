import React from 'react'

export default function ProgressBar({ steps, currentStepIndex }) {
  return (
    <nav className="progress-bar" aria-label="Experiment progress">
      {steps.map((step, idx) => {
        let state = 'future'
        if (currentStepIndex < 0) state = 'future'
        else if (idx < currentStepIndex) state = 'done'
        else if (idx === currentStepIndex) state = 'active'

        return (
          <div
            key={step.id}
            className={`progress-step ${state}`}
            aria-current={state === 'active' ? 'step' : undefined}
          >
            <div className="step-dot">
              {state === 'done' ? '✓' : step.number}
            </div>
            <div className="step-label">{step.label}</div>
          </div>
        )
      })}
    </nav>
  )
}
