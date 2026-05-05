import React from 'react';

const ProjectsGrid = ({ 
  projects, 
  projectsLoading, 
  selectedProjectIds, 
  allSelected, 
  toggleSelectAll, 
  toggleProjectSelection, 
  projectDrafts, 
  setProjectDrafts, 
  handleInlineUpdate, 
  handleDeleteProject, 
  apiLoading 
}) => {
  if (projectsLoading && projects.length === 0) {
    return <div className="empty-state">Loading projects...</div>;
  }

  if (projects.length === 0) {
    return (
      <div className="empty-state">
        No projects yet. Create one above to populate the grid.
      </div>
    );
  }

  return (
    <div className="data-grid-wrap">
      <table className="data-grid">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                className="grid-checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                title="Select all"
              />
            </th>
            <th className="col-id">ID</th>
            <th className="col-name">Name</th>
            <th className="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr
              key={project.id}
              className={selectedProjectIds.includes(project.id) ? "row--selected" : ""}
            >
              <td>
                <input
                  type="checkbox"
                  className="grid-checkbox"
                  checked={selectedProjectIds.includes(project.id)}
                  onChange={() => toggleProjectSelection(project.id)}
                />
              </td>
              <td className="col-id">#{project.id}</td>
              <td className="col-name">
                <input
                  value={projectDrafts[project.id] ?? project.name}
                  onChange={(event) =>
                    setProjectDrafts((current) => ({
                      ...current,
                      [project.id]: event.target.value,
                    }))
                  }
                />
              </td>
              <td className="col-actions">
                <div className="row-actions">
                  <button
                    className="button button--ghost button--sm"
                    type="button"
                    onClick={() => handleInlineUpdate(project.id)}
                    disabled={apiLoading === `Update project #${project.id}`}
                  >
                    {apiLoading === `Update project #${project.id}` ? "Saving..." : "Save"}
                  </button>
                  <button
                    className="button button--danger button--sm"
                    type="button"
                    onClick={() => handleDeleteProject(project.id)}
                    disabled={apiLoading === `Delete project #${project.id}`}
                  >
                    {apiLoading === `Delete project #${project.id}` ? "..." : "Delete"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProjectsGrid;
