import styles from './Modal.module.css'

export default function Modal({ open, onClose, children }) {
  if (!open) return null

  return (
    <div className={styles.wrapper}>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.modal}>
        {children}
      </div>
    </div>
  )
}
