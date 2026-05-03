import { useState, useEffect, useCallback } from 'react';
import { OrderWebSocket } from '../services/websocketService';

export const useRealTimeOrders = (token) => {
  const [ws, setWs] = useState(null);
  const [connected, setConnected] = useState(false);
  const [orderUpdates, setOrderUpdates] = useState([]);

  useEffect(() => {
    if (!token) return;

    const websocket = new OrderWebSocket(token);
    setWs(websocket);

    // Custom message handler
    websocket.handleMessage = (data) => {
      setOrderUpdates(prev => [...prev, data]);
    };

    // Override connect to update state
    const originalConnect = websocket.connect.bind(websocket);
    websocket.connect = () => {
      originalConnect();
      setConnected(true);
    };

    websocket.connect();

    return () => {
      websocket.disconnect();
      setConnected(false);
    };
  }, [token]);

  const sendOrderUpdate = useCallback((orderData) => {
    if (ws && connected && ws.ws && ws.ws.readyState === WebSocket.OPEN) {
      ws.ws.send(JSON.stringify({
        type: 'OrderUpdate',
        data: orderData
      }));
    }
  }, [ws, connected]);

  return {
    connected,
    orderUpdates,
    sendOrderUpdate,
    clearUpdates: () => setOrderUpdates([])
  };
};
