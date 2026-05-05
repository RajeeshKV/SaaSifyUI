import React from 'react';

const UserToolbar = ({ 
  inviteEmail, 
  setInviteEmail, 
  inviteRole, 
  setInviteRole, 
  handleInviteUser, 
  apiLoading 
}) => {
  return (
    <div className="toolbar">
      <form className="toolbar__create" onSubmit={handleInviteUser}>
        <input
          type="email"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          placeholder="colleague@example.com"
          required
        />
        <select
          value={inviteRole}
          onChange={(e) => setInviteRole(e.target.value)}
          className="page-size-select"
          style={{ width: 'auto', marginRight: '0.5rem' }}
        >
          <option value="User">User</option>
          <option value="TenantAdmin">Admin</option>
        </select>
        <button
          className="button button--primary button--sm"
          disabled={apiLoading === "Invite user" || !inviteEmail.trim()}
        >
          {apiLoading === "Invite user" ? "Inviting..." : "Invite User"}
        </button>
      </form>
    </div>
  );
};

export default UserToolbar;
