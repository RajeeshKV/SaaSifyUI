import React from 'react';
import { useOrderStatus } from '../hooks/useOrderStatus';
import tokenManager from '../services/tokenManager';

const OrderRow = ({ order, onViewDetails, getStatusBadgeClass }) => {
  const token = tokenManager.getAccessToken();
  // This hook automatically subscribes to SignalR updates for this specific order
  const { status } = useOrderStatus(order.orderId, token);

  return (
    <tr>
      <td><code>{order.orderId}</code></td>
      <td>{order.description}</td>
      <td><strong>${order.amount.toFixed(2)}</strong></td>
      <td>
        <span className={`badge ${getStatusBadgeClass(status || order.status)}`}>
          {status || order.status}
        </span>
      </td>
      <td>{new Date(order.createdAt).toLocaleDateString()}</td>
      <td>
        <button 
          className="button button--primary button--small"
          onClick={() => onViewDetails(order.orderId)}
        >
          View Details
        </button>
      </td>
    </tr>
  );
};

export default OrderRow;
