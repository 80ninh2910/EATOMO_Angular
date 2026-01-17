document.addEventListener('DOMContentLoaded', function() {
    // Get order details from localStorage
    const orderDetails = JSON.parse(localStorage.getItem('lastOrder'));
    if (!orderDetails) {
        window.location.href = 'index.html';
        return;
    }

    // Display Order ID
    document.getElementById('displayOrderId').textContent = orderDetails.order_id || 'N/A';

    // Display Delivery Information
    const deliveryInfo = document.getElementById('deliveryInfo');
    const customerInfo = orderDetails.customerInfo;
    
    deliveryInfo.querySelector('.customer-name').textContent = customerInfo.fullName;
    deliveryInfo.querySelector('.delivery-address').textContent = customerInfo.address;
    deliveryInfo.querySelector('.contact-number').textContent = customerInfo.phone;

    // Display the exact same totals from the order page
    const orderTotal = orderDetails.orderTotal;  // Already formatted
    const shippingFee = orderDetails.shippingFee === 0 ? 'Free Shipping' : formatMoney(orderDetails.shippingFee);
    const finalTotal = orderDetails.totalAmount;  // Already formatted

    // Display all totals clearly
    document.getElementById('subtotal').textContent = orderTotal;
    document.getElementById('deliveryFee').textContent = shippingFee;
    document.getElementById('total').textContent = finalTotal;
    
    console.log('Displaying order totals:', {
        orderTotal,
        shippingFee,
        finalTotal
    });

    console.log('Order Summary:', {
        subtotal: orderDetails.orderTotal,
        shippingFee: orderDetails.shippingFee,
        total: orderDetails.totalAmount
    });

    // Optional: Clear lastOrder from localStorage if you don't need it anymore
    // localStorage.removeItem('lastOrder');
});

// Helper function to format money in VND
function formatMoney(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}