import styles from './Spinner.module.css'

export default function Spinner({ size = 24, color = 'currentColor' }) {
  return (
    <span
      className={styles.spinner}
      style={{ width: size, height: size, borderTopColor: color }}
      role="status"
      aria-label="Loading"
    />
  )
}
