const ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'delivering', 'completed', 'cancelled'];

const ALLOWED_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['delivering', 'cancelled'],
  delivering: ['completed', 'cancelled'],
  completed: [],
  cancelled: []
};

function canTransitionOrderStatus(currentStatus, nextStatus) {
  if (currentStatus === nextStatus) return true;
  return (ALLOWED_TRANSITIONS[currentStatus] || []).includes(nextStatus);
}

module.exports = { ORDER_STATUSES, canTransitionOrderStatus };
