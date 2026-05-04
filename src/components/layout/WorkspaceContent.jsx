import React from 'react';
import OrderList from '../OrderList';
import OrderStatusTracker from '../OrderStatusTracker';

const WorkspaceContent = ({ 
  activeTab, 
  session, 
  projects, 
  projectsLoading, 
  pagination, 
  onFetchProjects, 
  onOpenCreateProject,
  onOpenCreateOrder,
  selectedOrderId,
  setSelectedOrderId
}) => {
  if (activeTab === 'projects') {
    return (
      <div className="projects-workspace">
        <div className="workspace-main__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div className="section-heading">
            <span className="eyebrow">WORKSPACE</span>
            <h2>Project Portfolio</h2>
          </div>
          <button 
            className="button button--primary" 
            onClick={onOpenCreateProject}
            disabled={!session.isEmailVerified}
          >
            {session.isEmailVerified ? "+ Create Project" : "🔒 Verify Email to Create"}
          </button>
        </div>

        {projectsLoading ? (
          <div className="loading-container">Loading projects...</div>
        ) : (
          <>
            <div className="projects-grid">
              {projects.map(project => (
                <div key={project.id} className="project-card glass-card">
                  <h3>{project.name}</h3>
                  <p className="muted small">{project.description || 'No description'}</p>
                </div>
              ))}
            </div>
            {/* Pagination UI logic here */}
          </>
        )}
      </div>
    );
  }

  if (activeTab === 'orders') {
    return (
      <div className="orders-workspace" style={{ display: 'grid', gridTemplateColumns: selectedOrderId ? '1fr 1fr' : '1fr', gap: '1.5rem', height: '100%', overflow: 'hidden' }}>
        <div className="orders-left" style={{ overflowY: 'auto', paddingRight: '0.5rem' }}>
          <div className="workspace-main__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div className="section-heading">
              <span className="eyebrow">ECOMMERCE</span>
              <h2>Order Management</h2>
            </div>
            <button 
              className="button button--primary" 
              onClick={onOpenCreateOrder}
              disabled={!session.isEmailVerified}
            >
              {session.isEmailVerified ? "+ Create Order" : "🔒 Verify Email to Order"}
            </button>
          </div>
          <OrderList onViewDetails={setSelectedOrderId} />
        </div>
        {selectedOrderId && (
          <div className="orders-right" style={{ overflowY: 'auto' }}>
            <OrderStatusTracker orderId={selectedOrderId} />
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default WorkspaceContent;
