import React from 'react';

const ProjectToolbar = ({ 
  selectedCount, 
  handleBulkUpdate, 
  handleBulkDelete 
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="toolbar">
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
    </div>
  );
};

export default ProjectToolbar;
