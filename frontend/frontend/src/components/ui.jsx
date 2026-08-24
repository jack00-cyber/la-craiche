import { formatInitials } from '../utils/formatters'

export function Card({ children, className = '', ...props }) {
  return (
    <section className={`card ${className}`.trim()} {...props}>
      {children}
    </section>
  )
}

export function Field({ label, hint, error, children, required = false, className = '' }) {
  return (
    <label className={`field ${className}`.trim()}>
      <div className="field__label-row">
        <span className="field__label">
          {label}
          {required ? <span className="field__required">*</span> : null}
        </span>
        {hint ? <span className="field__hint">{hint}</span> : null}
      </div>
      {children}
      {error ? <span className="field__error">{error}</span> : null}
    </label>
  )
}

export function Input(props) {
  return <input className="control" {...props} />
}

export function Select(props) {
  return <select className="control" {...props} />
}

export function Textarea(props) {
  return <textarea className="control control--textarea" {...props} />
}

export function Button({ as, variant = 'primary', className = '', ...props }) {
  const Component = as || 'button'

  return <Component className={`button button--${variant} ${className}`.trim()} {...props} />
}

export function Badge({ tone = 'neutral', children }) {
  return <span className={`badge badge--${tone}`}>{children}</span>
}

export function Loader({ label = 'Loading...' }) {
  return (
    <div className="loader" role="status" aria-live="polite">
      <span className="loader__spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action ? <div className="empty-state__action">{action}</div> : null}
    </div>
  )
}

export function ErrorBanner({ message, onRetry }) {
  if (!message) {
    return null
  }

  return (
    <div className="error-banner" role="alert">
      <div>
        <strong>We could not load this section.</strong>
        <p>{message}</p>
      </div>
      {onRetry ? (
        <Button variant="secondary" type="button" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  )
}

export function StatCard({ label, value, detail, tone = 'neutral' }) {
  return (
    <Card className={`stat-card stat-card--${tone}`}>
      <p className="stat-card__label">{label}</p>
      <div className="stat-card__value">{value}</div>
      {detail ? <p className="stat-card__detail">{detail}</p> : null}
    </Card>
  )
}

export function Avatar({ name }) {
  return <span className="avatar">{formatInitials(name)}</span>
}
