import React from 'react';

const TopBar = ({ authenticated, signingOut, onRefreshProjects, onRevokeSession, onOpenAuthModal }) => {
  return (
    <header className="topbar">
      <a className="brand" href="#home">Saasify</a>
      <nav className="topbar__nav">
        {authenticated ? (
          <>
            <button className="nav-icon" type="button" onClick={onRefreshProjects} title="Refresh projects">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
            </button>
            <button className={`nav-icon${signingOut ? " nav-icon--loading" : ""}`} type="button" onClick={onRevokeSession} disabled={signingOut} title="Sign out">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            </button>
          </>
        ) : (
          <button className="nav-icon" type="button" onClick={() => onOpenAuthModal("login")} title="Sign in / Register">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
          </button>
        )}
      </nav>
    </header>
  );
};

export default TopBar;
