import React from 'react';

const ProjectToolbar = ({ 
  newProjectName, 
  setNewProjectName, 
  handleCreateProject, 
  apiLoading, 
  selectedCount, 
  handleBulkUpdate, 
  handleBulkDelete 
}) => {
  return (
    <div className="toolbar">
      <form className="toolbar__create" onSubmit={handleCreateProject}>
        <input
          value={newProjectName}
          onChange={(event) => setNewProjectName(event.target.value)}
          placeholder="New project name..."
        />
        <button
          className="button button--primary button--sm"
          disabled={apiLoading === "Create project" || !newProjectName.trim()}
        >
          {apiLoading === "Create project" ? "Creating..." : "Add"}
        </button>
      </form>

      {selectedCount > 0 && (
        <div className="bulk-bar">
          <span className="bulk-bar__count">{selectedCount}</span> selected
          <button
            className="button button--ghost button--sm"
            type="button"
            onClick={handleBulkUpdate}
          >
            Update Selected
          </button>
          <button
            className="button button--danger button--sm"
            type="button"
            onClick={handleBulkDelete}
          >
            Delete Selected
          </button>
        </div>
      )}
    </div>
  );
};

export default ProjectToolbar;
