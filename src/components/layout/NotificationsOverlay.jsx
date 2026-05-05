import React from 'react';

const NotificationsOverlay = ({ notifications }) => {
  if (!notifications || notifications.length === 0) return null;
  
  return (
    <div className="notifications-container" style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {notifications.map(n => (
        <div key={n.id} className={`notice notice--${n.type === 'error' ? 'error' : n.type === 'warning' ? 'warning' : 'success'}`} style={{ margin: 0, boxShadow: 'var(--shadow)', minWidth: '250px' }}>
          {n.message}
        </div>
      ))}
    </div>
  );
};

export default NotificationsOverlay;
