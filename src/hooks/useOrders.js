import { useState, useEffect, useCallback } from 'react';
import { orderService } from '../services/orderService';

export const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0
  });

  const fetchOrders = useCallback(async (page = 1, status = null) => {
    setLoading(true);
    setError('');

    try {
      const response = await orderService.getOrders(page, pagination.pageSize, status);
      setOrders(response.orders || []);
      setPagination(response.pagination || {
        currentPage: page,
        pageSize: pagination.pageSize,
        totalItems: 0,
        totalPages: 0
      });
    } catch (error) {
      setError(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  }, [pagination.pageSize]);

  const createNewOrder = useCallback(async (orderData) => {
    setLoading(true);
    setError('');

    try {
      const response = await orderService.createOrder(orderData);
      // Refresh orders list
      await fetchOrders(pagination.currentPage);
      return response;
    } catch (error) {
      setError(error.response?.data?.message || error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchOrders, pagination.currentPage]);

  const getOrderById = useCallback(async (orderId) => {
    setLoading(true);
    setError('');

    try {
      const response = await orderService.getOrder(orderId);
      return response;
    } catch (error) {
      setError(error.response?.data?.message || error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    orders,
    loading,
    error,
    pagination,
    fetchOrders,
    createNewOrder,
    getOrderById
  };
};
