interface ToggleProps {
  checked: boolean
  label: string
  description: string
  onChange: (checked: boolean) => void
}

export function Toggle({ checked, label, description, onChange }: ToggleProps) {
  return (
    <label className="toggle-row">
      <span>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="toggle" aria-hidden="true"><span /></span>
    </label>
  )
}
