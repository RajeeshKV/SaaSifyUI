import React, { useState } from 'react';

const CreateProjectModal = ({ 
  show, 
  handleCreateProject, 
  apiLoading, 
  onClose 
}) => {
  const [projectName, setProjectName] = useState("");

  if (!show) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!projectName.trim()) return;
    handleCreateProject(projectName.trim());
    setProjectName("");
    onClose();
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="auth-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal__header">
          <div>
            <span className="eyebrow">PROJECTS</span>
            <h2>Create New Project</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose}>
            ×
          </button>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Project Name</label>
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. My Awesome Project"
              autoFocus
            />
          </div>
          <button
            className="button button--primary button--wide"
            type="submit"
            disabled={apiLoading === "Create project" || !projectName.trim()}
          >
            {apiLoading === "Create project" ? "Creating..." : "Create Project"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;
