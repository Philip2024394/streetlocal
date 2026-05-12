import React from 'react';
import styles from './SideDrawer.module.css';

export default function SideDrawer({ open, onClose, children }) {
  return (
    <>
      {open && (
        <>
          <div
            className={styles.drawerGlass}
            style={{
              transform: open ? 'translateX(0)' : 'translateX(100%)',
            }}
          >
            <button
              onClick={onClose}
              style={{ alignSelf: 'flex-end', background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', marginBottom: 12 }}
              aria-label="Close Drawer"
            >
              ×
            </button>
            {children}
          </div>
          <div
            onClick={onClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0,0,0,0.18)',
              zIndex: 19999,
            }}
          />
        </>
      )}
    </>
  );
}
