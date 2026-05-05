import React from 'react';

const SignOutOverlay = ({ signingOut }) => {
  if (!signingOut) return null;
  
  return (
    <div className="signout-overlay">
      <div className="signout-overlay__content">
        <svg className="signout-spinner" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
        <span>Signing out…</span>
      </div>
    </div>
  );
};

export default SignOutOverlay;
