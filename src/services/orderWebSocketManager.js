import * as signalR from "@microsoft/signalr";

class OrderWebSocketManager {
  constructor() {
    this.connection = null;
    this.orderCallbacks = new Map();
    this.subscriptionCallbacks = [];
  }

  async connect(token) {
    if (this.connection) return;

    try {
      const wsUrl = `https://saasifyapi.rajeesh.online/orderNotifications`;
      
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(wsUrl, {
          accessTokenFactory: () => token
        })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Order events
      this.connection.on("OrderStatusUpdate", (data) => this.handleOrderUpdate(data));
      this.connection.on("OrderCreated", (data) => this.handleOrderUpdate(data));
      this.connection.on("PaymentCompleted", (data) => this.handleOrderUpdate(data));
      this.connection.on("OrderCompleted", (data) => this.handleOrderUpdate(data));
      this.connection.on("OrderFailed", (data) => this.handleOrderUpdate(data));

      // Subscription events
      this.connection.on("SubscriptionStatusUpdate", (data) => this.handleSubscriptionUpdate(data));
      this.connection.on("SubscriptionCompleted", (data) => this.handleSubscriptionUpdate(data));
      this.connection.on("SubscriptionFailed", (data) => this.handleSubscriptionUpdate(data));

      await this.connection.start();
      console.log('WebSocket connected for real-time updates');
    } catch (error) {
      console.error('WebSocket connection failed:', error);
    }
  }

  handleOrderUpdate(data) {
    const callbacks = this.orderCallbacks.get(data.orderId) || [];
    callbacks.forEach(callback => callback(data));
  }

  handleSubscriptionUpdate(data) {
    this.subscriptionCallbacks.forEach(callback => callback(data));
  }

  subscribeToOrder(orderId, callback) {
    const id = String(orderId);
    if (!this.orderCallbacks.has(id)) {
      this.orderCallbacks.set(id, []);
    }
    this.orderCallbacks.get(id).push(callback);
    
    if (this.connection?.state === "Connected") {
      this.connection.invoke("JoinOrderGroup", id);
    }
  }

  unsubscribeFromOrder(orderId, callback) {
    const id = String(orderId);
    const callbacks = this.orderCallbacks.get(id) || [];
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
    
    if (this.connection?.state === "Connected" && callbacks.length === 0) {
      this.connection.invoke("LeaveOrderGroup", id);
    }
  }

  subscribeToSubscription(callback) {
    this.subscriptionCallbacks.push(callback);
    if (this.connection?.state === "Connected") {
      this.connection.invoke("JoinSubscriptionGroup");
    }
  }

  unsubscribeFromSubscription(callback) {
    this.subscriptionCallbacks = this.subscriptionCallbacks.filter(c => c !== callback);
    if (this.connection?.state === "Connected" && this.subscriptionCallbacks.length === 0) {
      this.connection.invoke("LeaveSubscriptionGroup");
    }
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
    }
  }
}

export const orderWS = new OrderWebSocketManager();
