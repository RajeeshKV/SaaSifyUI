import React, { useState, useEffect } from 'react';
import { orderService } from '../services/orderService';
import OrderRow from './OrderRow';

const OrderList = ({ onViewDetails }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0
  });

  const fetchOrders = async (page = 1) => {
    setLoading(true);
    setError('');

    try {
      const response = await orderService.getOrders(page, pagination.pageSize);
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
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handlePageChange = (newPage) => {
    fetchOrders(newPage);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pending': return 'status-pending';
      case 'Processing': return 'status-processing';
      case 'Confirmed': return 'status-confirmed';
      case 'Completed': return 'status-completed';
      case 'Failed': return 'status-failed';
      default: return '';
    }
  };

  if (loading) {
    return <div className="loading card">Loading orders...</div>;
  }

  if (error) {
    return <div className="error card">Error: {error}</div>;
  }

  return (
    <div className="order-list card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3>Recent Orders</h3>
        <button className="button button--ghost button--small" onClick={() => fetchOrders(pagination.currentPage)}>Refresh</button>
      </div>
      
      {orders.length === 0 ? (
        <div className="no-orders" style={{ textAlign: 'center', padding: '2rem' }}>
          <p className="muted">No orders found</p>
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <OrderRow 
                    key={order.orderId} 
                    order={order} 
                    onViewDetails={onViewDetails} 
                    getStatusBadgeClass={getStatusBadgeClass}
                  />
                ))}
              </tbody>
            </table>
          </div>
          
          {pagination.totalPages > 1 && (
            <div className="pagination" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '1rem', alignItems: 'center' }}>
              <button 
                className="button button--ghost button--small"
                disabled={pagination.currentPage === 1}
                onClick={() => handlePageChange(pagination.currentPage - 1)}
              >
                Previous
              </button>
              
              <span className="page-info muted">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              
              <button 
                className="button button--ghost button--small"
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => handlePageChange(pagination.currentPage + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OrderList;
