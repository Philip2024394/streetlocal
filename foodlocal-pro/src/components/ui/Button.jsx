import styles from './Button.module.css'
import Spinner from './Spinner'

/**
 * @param {'primary'|'ghost'|'danger'|'otw'|'mutual'} variant
 * @param {'sm'|'md'|'lg'} size
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={[
        styles.btn,
        styles[variant],
        styles[size],
        fullWidth ? styles.fullWidth : '',
        loading ? styles.loading : '',
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {loading ? <Spinner size={16} /> : children}
    </button>
  )
}
