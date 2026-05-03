import apiClient from './apiClient';

export class OrderStatusPoller {
  constructor(orderId, onUpdate, onComplete, onError) {
    this.orderId = orderId;
    this.onUpdate = onUpdate;
    this.onComplete = onComplete;
    this.onError = onError;
    this.pollingInterval = null;
    this.maxAttempts = 150; // Increased for longer processing times (5 mins @ 2s)
    this.attempts = 0;
  }

  start() {
    this.attempts = 0;
    this.poll();
  }

  poll = async () => {
    try {
      this.attempts++;
      
      const response = await apiClient.get(`/api/Orders/${this.orderId}`);
      const order = response.data;
      
      this.onUpdate(order);
      
      // Check if order is completed
      if (['Completed', 'Failed'].includes(order.status)) {
        this.onComplete(order);
        this.stop();
        return;
      }
      
      // Continue polling if not max attempts
      if (this.attempts < this.maxAttempts) {
        this.pollingInterval = setTimeout(this.poll, 2000); // Poll every 2 seconds
      } else {
        this.onError(new Error('Order processing timeout'));
        this.stop();
      }
    } catch (error) {
      this.onError(error);
      this.stop();
    }
  };

  stop() {
    if (this.pollingInterval) {
      clearTimeout(this.pollingInterval);
      this.pollingInterval = null;
    }
  }
}

export const startOrderStatusPolling = (orderId, onUpdate, onComplete, onError) => {
  const poller = new OrderStatusPoller(orderId, onUpdate, onComplete, onError);
  poller.start();
  return poller;
};
