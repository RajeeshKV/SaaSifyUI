import { useState, useEffect, useCallback } from 'react';
import { orderWS } from '../services/orderWebSocketManager';
import { API_BASE_URL } from '../lib/api';

export function useOrderStatus(orderId, token) {
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleStatusUpdate = useCallback((update) => {
    if (update.status) {
      setStatus(update.status);
    }
  }, []);

  useEffect(() => {
    if (!orderId || !token) return;

    const fetchInitialStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/Orders/${orderId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Order not found');
        const order = await response.json();
        setStatus(order.status);
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };

    fetchInitialStatus();
    orderWS.subscribeToOrder(orderId, handleStatusUpdate);

    return () => {
      orderWS.unsubscribeFromOrder(orderId, handleStatusUpdate);
    };
  }, [orderId, token, handleStatusUpdate]);

  return { status, loading, error };
}
