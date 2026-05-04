import { useState, useCallback } from "react";
import { apiRequest, buildHeaders } from "../lib/api";
import ErrorHandler from "../utils/errorHandler";

export function useProjects(session) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
    pageNumber: 1
  });

  const fetchProjects = useCallback(async (page = 1, pageSize = 10) => {
    if (!session.token) return;
    setLoading(true);
    try {
      const data = await apiRequest(`/api/Projects?pageNumber=${page}&pageSize=${pageSize}`, {
        headers: buildHeaders({ token: session.token, tenantId: session.tenantId }),
      });
      setProjects(Array.isArray(data.items) ? data.items : []);
      setPagination({
        totalItems: data.totalItems,
        totalPages: data.totalPages,
        hasPreviousPage: data.hasPreviousPage,
        hasNextPage: data.hasNextPage,
        pageNumber: data.pageNumber
      });
    } catch (error) {
      ErrorHandler.showNotification("Failed to fetch projects", "error");
    } finally {
      setLoading(false);
    }
  }, [session.token, session.tenantId]);

  return {
    projects,
    setProjects,
    loading,
    pagination,
    fetchProjects
  };
}
