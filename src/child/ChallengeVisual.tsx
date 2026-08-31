import type { ChallengeVisual as ChallengeVisualModel } from '../domain/types'

interface ChallengeVisualProps {
  visual: ChallengeVisualModel
  reveal?: boolean
}

function HundredField({ value, mode }: { value: number; mode: 'quantity' | 'complement' }) {
  return (
    <div className={`hundred-field hundred-field--${mode}`} role="img" aria-label={`${value} von 100 Punkten sind gefüllt`}>
      {Array.from({ length: 100 }, (_, index) => (
        <span
          key={index}
          className={index < value ? 'hundred-field__dot hundred-field__dot--filled' : 'hundred-field__dot'}
        />
      ))}
    </div>
  )
}

function PlaceValue({ value }: { value: number }) {
  const tens = Math.floor(value / 10)
  const ones = value % 10
  return (
    <div className="place-value" role="img" aria-label={`${tens} Zehner und ${ones} Einer`}>
      <div className="place-value__section">
        <div className="place-value__blocks">
          {Array.from({ length: tens }, (_, index) => (
            <span className="ten-rod" key={index}>
              {Array.from({ length: 10 }, (__, slot) => <i key={slot} />)}
            </span>
          ))}
        </div>
        <strong>{tens} Z</strong>
      </div>
      <div className="place-value__plus" aria-hidden="true">+</div>
      <div className="place-value__section">
        <div className="place-value__ones">
          {Array.from({ length: ones }, (_, index) => <span key={index} />)}
        </div>
        <strong>{ones} E</strong>
      </div>
    </div>
  )
}

function TenStrip({ filled, total }: { filled: number; total: 10 | 20 }) {
  return (
    <div className={`ten-strip ${total === 20 ? 'ten-strip--twenty' : ''}`} role="img" aria-label={`${filled} von ${total} Feldern sind gefüllt`}>
      {Array.from({ length: total }, (_, index) => (
        <span key={index} className={index < filled ? 'ten-strip__filled' : ''} />
      ))}
    </div>
  )
}

function NumberLine({
  minimum,
  maximum,
  start,
  end,
  jumps = [],
}: Extract<ChallengeVisualModel, { type: 'number-line' }>) {
  const left = 36
  const right = 564
  const width = right - left
  const position = (value: number) => left + ((value - minimum) / (maximum - minimum || 1)) * width
  const direction = end >= start ? 1 : -1
  let cursor = start
  const arcs = jumps.map((jump) => {
    const from = cursor
    cursor += jump * direction
    return { from, to: cursor, label: jump }
  })
  const ticks = Array.from({ length: 11 }, (_, index) => minimum + ((maximum - minimum) / 10) * index)

  return (
    <svg className="number-line" viewBox="0 0 600 138" role="img" aria-label={`Zahlenweg von ${minimum} bis ${maximum}, von ${start} zu ${end}`}>
      <line x1={left} y1="92" x2={right} y2="92" className="number-line__axis" />
      {ticks.map((tick, index) => (
        <g key={index}>
          <line x1={position(tick)} y1="84" x2={position(tick)} y2="101" className="number-line__tick" />
          {(index === 0 || index === 5 || index === 10) && (
            <text x={position(tick)} y="124" textAnchor="middle">{Math.round(tick)}</text>
          )}
        </g>
      ))}
      {arcs.map((arc, index) => {
        const x1 = position(arc.from)
        const x2 = position(arc.to)
        const middle = (x1 + x2) / 2
        const height = Math.max(24, Math.min(62, Math.abs(x2 - x1) * 0.35))
        return (
          <g key={`${arc.from}-${arc.to}-${index}`}>
            <path d={`M ${x1} 80 Q ${middle} ${80 - height} ${x2} 80`} className="number-line__jump" />
            <text x={middle} y={70 - height} textAnchor="middle" className="number-line__jump-label">{direction > 0 ? '+' : '−'}{arc.label}</text>
          </g>
        )
      })}
      <circle cx={position(start)} cy="92" r="8" className="number-line__start" />
      <text x={position(start)} y="76" textAnchor="middle" className="number-line__value">{start}</text>
      <circle cx={position(end)} cy="92" r="9" className="number-line__end" />
      <text x={position(end)} y="76" textAnchor="middle" className="number-line__value">{end}</text>
    </svg>
  )
}

function Sequence({ values }: { values: Array<number | null> }) {
  return (
    <div className="sequence-visual" aria-label={values.map((value) => value ?? 'fehlend').join(', ')}>
      {values.map((value, index) => (
        <span key={index} className={value === null ? 'sequence-visual__missing' : ''}>
          {value ?? '?'}
        </span>
      ))}
    </div>
  )
}

function Groups({ groups, crossedGroup }: { groups: number[]; crossedGroup?: number }) {
  return (
    <div className="groups-visual" role="img" aria-label={`${groups.length} Gruppen mit ${groups.join(' und ')} Punkten`}>
      {groups.map((count, groupIndex) => (
        <div className={`group-box ${crossedGroup === groupIndex ? 'group-box--crossed' : ''}`} key={groupIndex}>
          <div>
            {Array.from({ length: count }, (_, index) => <span key={index} />)}
          </div>
          <strong>{count}</strong>
        </div>
      ))}
    </div>
  )
}

function PartWhole({ whole, known, missing, reveal }: { whole: number; known: number; missing: number; reveal: boolean }) {
  return (
    <div className="part-whole" role="img" aria-label={`${whole} wird in ${known} und ${reveal ? missing : 'einen fehlenden Teil'} zerlegt`}>
      <div className="part-whole__whole"><small>Ganzes</small><strong>{whole}</strong></div>
      <span className="part-whole__branch part-whole__branch--left" />
      <span className="part-whole__branch part-whole__branch--right" />
      <div className="part-whole__part"><small>Teil</small><strong>{known}</strong></div>
      <div className="part-whole__part part-whole__part--missing"><small>Teil</small><strong>{reveal ? missing : '?'}</strong></div>
    </div>
  )
}

export function ChallengeVisual({ visual, reveal = false }: ChallengeVisualProps) {
  switch (visual.type) {
    case 'none': return null
    case 'hundred-field': return <HundredField value={visual.value} mode={visual.mode} />
    case 'ten-strip': return <TenStrip filled={visual.filled} total={visual.total} />
    case 'place-value': return <PlaceValue value={visual.value} />
    case 'number-line': return <NumberLine {...visual} />
    case 'sequence': return <Sequence values={visual.values} />
    case 'groups': return <Groups groups={visual.groups} crossedGroup={visual.crossedGroup} />
    case 'part-whole': return <PartWhole {...visual} reveal={reveal} />
  }
}
