import React from 'react';

const Pagination = ({ 
  pagination, 
  pageNumber, 
  pageSize, 
  setPageSize, 
  setPageNumber, 
  fetchProjects 
}) => {
  if (pagination.totalItems <= 0) return null;

  return (
    <div className="pagination-bar">
      <div className="pagination-bar__info">
        <strong>{pagination.totalItems}</strong> project{pagination.totalItems !== 1 ? "s" : ""}
        {" · "}Page <strong>{pageNumber}</strong> of <strong>{pagination.totalPages}</strong>
      </div>
      <div className="pagination-bar__controls">
        <select
          className="page-size-select"
          value={pageSize}
          onChange={(e) => {
            const newSize = Number(e.target.value);
            setPageSize(newSize);
            setPageNumber(1);
            fetchProjects(1, newSize);
          }}
        >
          <option value={10}>10 / page</option>
          <option value={25}>25 / page</option>
          <option value={50}>50 / page</option>
        </select>
        <div className="pagination-bar__pages">
          <button
            className="page-btn"
            type="button"
            disabled={!pagination.hasPreviousPage}
            onClick={() => fetchProjects(1, pageSize)}
          >
            ««
          </button>
          <button
            className="page-btn"
            type="button"
            disabled={!pagination.hasPreviousPage}
            onClick={() => fetchProjects(pageNumber - 1, pageSize)}
          >
            ‹
          </button>
          {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
            let start = Math.max(1, pageNumber - 2);
            if (start + 4 > pagination.totalPages) start = Math.max(1, pagination.totalPages - 4);
            const pg = start + i;
            if (pg > pagination.totalPages) return null;
            return (
              <button
                key={pg}
                className={`page-btn${pg === pageNumber ? " page-btn--active" : ""}`}
                type="button"
                onClick={() => fetchProjects(pg, pageSize)}
              >
                {pg}
              </button>
            );
          })}
          <button
            className="page-btn"
            type="button"
            disabled={!pagination.hasNextPage}
            onClick={() => fetchProjects(pageNumber + 1, pageSize)}
          >
            ›
          </button>
          <button
            className="page-btn"
            type="button"
            disabled={!pagination.hasNextPage}
            onClick={() => fetchProjects(pagination.totalPages, pageSize)}
          >
            »»
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
