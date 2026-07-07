const test = require('node:test');
const assert = require('node:assert/strict');

const { ORDER_STATUSES, canTransitionOrderStatus } = require('../utils/order-status');

test('order statuses expose the API contract', () => {
  assert.deepEqual(ORDER_STATUSES, [
    'pending',
    'confirmed',
    'preparing',
    'delivering',
    'completed',
    'cancelled'
  ]);
});

test('order status follows the fulfillment sequence', () => {
  assert.equal(canTransitionOrderStatus('pending', 'confirmed'), true);
  assert.equal(canTransitionOrderStatus('confirmed', 'preparing'), true);
  assert.equal(canTransitionOrderStatus('preparing', 'delivering'), true);
  assert.equal(canTransitionOrderStatus('delivering', 'completed'), true);
});

test('terminal and backward transitions are rejected', () => {
  assert.equal(canTransitionOrderStatus('completed', 'preparing'), false);
  assert.equal(canTransitionOrderStatus('cancelled', 'pending'), false);
  assert.equal(canTransitionOrderStatus('preparing', 'confirmed'), false);
});

test('repeating the current status is idempotent', () => {
  assert.equal(canTransitionOrderStatus('preparing', 'preparing'), true);
});
