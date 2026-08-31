import type { Challenge } from '../domain/types'

export function DotHint({ challenge }: { challenge: Challenge }) {
  return (
    <div className="dot-hint" aria-hidden="true">
      {challenge.visualGroups.map((count, groupIndex) => (
        <div
          className={`dot-group dot-group--${groupIndex + 1} ${challenge.kind === 'subtraction' && groupIndex === 1 ? 'dot-group--removed' : ''}`}
          key={`${challenge.id}-${groupIndex}`}
        >
          {Array.from({ length: count }, (_, index) => <span key={index} />)}
        </div>
      ))}
    </div>
  )
}
