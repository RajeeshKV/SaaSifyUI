import React from 'react';

const WorkspaceTabs = ({ 
  activeWorkspaceTab, 
  setActiveWorkspaceTab, 
  session 
}) => {
  return (
    <div className="workspace-main__tabs" style={{ 
      display: 'flex', 
      gap: '1rem', 
      marginBottom: '1.5rem', 
      borderBottom: '1px solid var(--line)', 
      paddingBottom: '0rem',
      paddingLeft: '1rem'
    }}>
      <button
        className={`tab-btn ${activeWorkspaceTab === 'projects' ? 'active' : ''}`}
        style={{ 
          background: 'none', 
          border: 'none', 
          color: activeWorkspaceTab === 'projects' ? 'var(--primary)' : 'var(--text-dim)', 
          fontWeight: 'bold', 
          cursor: 'pointer', 
          padding: '0.8rem 1rem', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.4rem',
          position: 'relative',
          borderBottom: activeWorkspaceTab === 'projects' ? '2px solid var(--primary)' : '2px solid transparent',
          marginBottom: '-1px'
        }}
        onClick={() => setActiveWorkspaceTab('projects')}
      >
        Projects
        {session.isEmailVerified === false && <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>🔒</span>}
      </button>
      <button
        className={`tab-btn ${activeWorkspaceTab === 'orders' ? 'active' : ''}`}
        style={{ 
          background: 'none', 
          border: 'none', 
          color: activeWorkspaceTab === 'orders' ? 'var(--primary)' : 'var(--text-dim)', 
          fontWeight: 'bold', 
          cursor: 'pointer', 
          padding: '0.8rem 1rem', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.4rem',
          position: 'relative',
          borderBottom: activeWorkspaceTab === 'orders' ? '2px solid var(--primary)' : '2px solid transparent',
          marginBottom: '-1px'
        }}
        onClick={() => setActiveWorkspaceTab('orders')}
      >
        Orders
        {session.isEmailVerified === false && <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>🔒</span>}
      </button>
      {session.role === 'TenantAdmin' && (
        <button
          className={`tab-btn ${activeWorkspaceTab === 'users' ? 'active' : ''}`}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: activeWorkspaceTab === 'users' ? 'var(--primary)' : 'var(--text-dim)', 
            fontWeight: 'bold', 
            cursor: 'pointer', 
            padding: '0.8rem 1rem',
            position: 'relative',
            borderBottom: activeWorkspaceTab === 'users' ? '2px solid var(--primary)' : '2px solid transparent',
            marginBottom: '-1px'
          }}
          onClick={() => setActiveWorkspaceTab('users')}
        >
          Users
        </button>
      )}
    </div>
  );
};

export default WorkspaceTabs;
