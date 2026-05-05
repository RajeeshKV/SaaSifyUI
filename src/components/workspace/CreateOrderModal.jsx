import React from 'react';
import OrderCreationForm from '../OrderCreationForm';

const CreateOrderModal = ({ 
  show, 
  onOrderCreated, 
  onClose 
}) => {
  if (!show) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="auth-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal__header">
          <div>
            <span className="eyebrow">ECOMMERCE</span>
            <h2>Create New Order</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose}>
            ×
          </button>
        </div>
        <OrderCreationForm onOrderCreated={onOrderCreated} />
      </div>
    </div>
  );
};

export default CreateOrderModal;
