import { useState, useCallback } from "react";
import { orderService } from "../services/orderService";
import ErrorHandler from "../utils/errorHandler";

export function useOrders() {
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);

  const handleOrderCreated = useCallback((newOrder, onComplete) => {
    setShowCreateOrderModal(false);
    ErrorHandler.showNotification(`Order #${newOrder.orderId} created!`, "success");
    if (onComplete) onComplete(newOrder);
  }, []);

  return {
    selectedOrderId,
    setSelectedOrderId,
    showCreateOrderModal,
    setShowCreateOrderModal,
    handleOrderCreated
  };
}
