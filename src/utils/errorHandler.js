// errorHandler.js
class ErrorHandler {
  static handle(error, context = '') {
    console.error(`Error in ${context}:`, error);
    
    if (error.response) {
      // HTTP Error
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          this.showAuthError();
          break;
        case 403:
          this.showPermissionError();
          break;
        case 404:
          this.showNotFoundError(data?.message);
          break;
        case 429:
          this.showRateLimitError();
          break;
        case 500:
          this.showServerError();
          break;
        default:
          this.showGenericError(data?.message || 'An error occurred');
      }
    } else if (error.request) {
      // Network Error
      this.showNetworkError();
    } else {
      // Other Error
      this.showGenericError(error.message);
    }
  }

  static showAuthError() {
    this.showNotification('Session expired. Please log in again.', 'warning');
    // Using a custom event or a callback might be better than window.location.href in a real app,
    // but following the guide's logic for now.
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }, 2000);
  }

  static showPermissionError() {
    this.showNotification('You don\'t have permission to perform this action.', 'error');
  }

  static showNotFoundError(message) {
    this.showNotification(message || 'Resource not found.', 'error');
  }

  static showRateLimitError() {
    this.showNotification('Too many requests. Please try again later.', 'warning');
  }

  static showServerError() {
    this.showNotification('Server error. Please try again later.', 'error');
  }

  static showNetworkError() {
    this.showNotification('Network error. Please check your connection.', 'error');
  }

  static showGenericError(message) {
    this.showNotification(message || 'An unexpected error occurred.', 'error');
  }

  static showNotification(message, type = 'info') {
    // Custom event to show notifications in the UI
    window.dispatchEvent(new CustomEvent('notification', { 
      detail: { message, type } 
    }));
    console.log(`${type.toUpperCase()}: ${message}`);
  }
}

export default ErrorHandler;
