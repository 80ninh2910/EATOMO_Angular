// Cart Manager
(function(window) {
    'use strict';
    
    var CART_KEY = 'cart';

    // Constructor function
    function CartManager() {
        this.init();
    }

    // Define prototype methods
    CartManager.prototype = {
        constructor: CartManager,

        init: function() {
            this.renderCartOnOrdersPage();
            this.setupEventListeners();
        },

        getCart: function() {
            return JSON.parse(localStorage.getItem(CART_KEY)) || [];
        },

        saveCart: function(cart) {
            localStorage.setItem(CART_KEY, JSON.stringify(cart));
        },

        addToCart: function(item, quantity, note) {
            quantity = quantity || 1;
            var cart = this.getCart();
            var existing = cart.find(function(c) { return c.id === item.id; });
            if (existing) {
                existing.qty = Math.min((existing.qty || 0) + (quantity || 1), 99);
                if (note) {
                    existing.note = note;
                }
            } else {
                var copy = Object.assign({ 
                    qty: Math.max(1, Math.min(quantity || 1, 99)),
                    note: note
                }, item);
                cart.push(copy);
            }
            this.saveCart(cart);
            this.updateCart();
            this.showToast(item.name + ' đã thêm vào giỏ hàng');
        },

        // Giảm số lượng sản phẩm
        decreaseQuantity: function(id) {
            var cart = this.getCart();
            var item = cart.find(function(i) { return i.id === id; });
            if (!item) return;

            if (item.qty > 1) {
                item.qty--;
                this.saveCart(cart);
                this.updateCart();
                this.showToast(`Đã giảm số lượng ${item.name}`);
            } else {
                if (confirm('Bạn có muốn xóa món này khỏi giỏ hàng?')) {
                    this.removeFromCart(id);
                }
            }
        },

        // Tăng số lượng sản phẩm
        increaseQuantity: function(id) {
            var cart = this.getCart();
            var item = cart.find(function(i) { return i.id === id; });
            if (!item) return;

            if (item.qty < 99) {
                item.qty++;
                this.saveCart(cart);
                this.updateCart();
                this.showToast(`Đã tăng số lượng ${item.name}`);
            } else {
                this.showToast('Số lượng tối đa là 99');
            }
        },

        // Cập nhật toàn bộ giỏ hàng
        updateCart: function() {
            this.renderCartOnOrdersPage();
            this.updateTotalPrice();
        },

        removeFromCart: function(id) {
            var cart = this.getCart();
            cart = cart.filter(function(i) { return i.id !== id; });
            this.saveCart(cart);
            this.renderCartOnOrdersPage();
        },

        updateQuantity: function(id, newQty) {
            var cart = this.getCart();
            var item = cart.find(function(i) { return i.id === id; });
            if (!item) return;

            var oldQty = item.qty;
            newQty = Math.max(1, Math.min(newQty, 99));
            
            if (newQty === oldQty) return;

            item.qty = newQty;
            this.saveCart(cart);
            this.updateCart();

            this.showToast(
                newQty > oldQty 
                    ? `Đã tăng số lượng ${item.name}` 
                    : `Đã giảm số lượng ${item.name}`
            );
        },

        clearCart: function() {
            this.saveCart([]);
            this.renderCartOnOrdersPage();
            this.showToast('Đã xóa toàn bộ giỏ hàng');
            this.updateTotalPrice();
        },

        updateTotalPrice: function() {
            var cart = this.getCart();
            var subtotal = this.calculateSubtotal(cart);
            var deliveryFee = subtotal >= 300000 ? 0 : 30000;
            var total = subtotal + deliveryFee;

            // Cập nhật giao diện
            var subtotalEl = document.getElementById('subtotal');
            var shippingEl = document.getElementById('shipping');
            var totalEl = document.getElementById('total');
            var freeDeliveryMsg = document.getElementById('freeDeliveryMsg');

            if (subtotalEl) subtotalEl.textContent = this.formatMoney(subtotal);
            if (shippingEl) shippingEl.textContent = deliveryFee === 0 ? 'Miễn phí' : this.formatMoney(deliveryFee);
            if (totalEl) totalEl.textContent = this.formatMoney(total);

            // Hiển thị thông báo miễn phí giao hàng
            if (freeDeliveryMsg) {
                if (subtotal < 300000) {
                    var remaining = 300000 - subtotal;
                    freeDeliveryMsg.textContent = `Thêm ${this.formatMoney(remaining)} để được miễn phí giao hàng!`;
                    freeDeliveryMsg.style.display = 'block';
                } else {
                    freeDeliveryMsg.textContent = 'Bạn đã được miễn phí giao hàng!';
                    freeDeliveryMsg.style.display = 'block';
                }
            }
        },

        calculateSubtotal: function(cart) {
            return cart.reduce(function(sum, item) {
                // Convert any decimal prices to VND
                let price = Number(item.price) || 0;
                if (price > 0 && price < 1000) {
                    price = Math.round(price * 10000);
                }
                return sum + price * (item.qty || 1);
            }, 0);
        },

        formatMoney: function(v) {
            // Ensure v is a number and convert any decimal prices to VND
            let amount = Number(v) || 0;
            // If it looks like a unit price (e.g. 12.99), convert to VND
            if (amount > 0 && amount < 1000) {
                amount = Math.round(amount * 10000);
            }
            return new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
            }).format(amount);
        },

        renderCartOnOrdersPage: function() {
            var self = this;
            var cart = this.getCart();
            var cartItems = document.getElementById('cartItems');
            var cartCount = document.getElementById('cartCount');
            var subtotalEl = document.getElementById('subtotal');
            var totalEl = document.getElementById('totalAmount');
            var deliveryFee = 30000; // 30,000 VND delivery fee

            if (!cartItems) return;

            cartItems.innerHTML = '';

            if (cart.length === 0) {
                cartItems.innerHTML = `
                    <div class="empty-cart">
                        <img src="../images/orders/emty.jpg" width="200px" alt="Empty Cart" class="empty-cart-image">
                        <p class="empty">Giỏ hàng của bạn đang trống</p>
                        <a href="our-bowls.html" class="browse-button">Xem thực đơn</a>
                    </div>`;
                cartCount.textContent = '0';
                subtotalEl.textContent = this.formatMoney(0);
                totalEl.textContent = this.formatMoney(0);
                // Vô hiệu hóa nút tiến hành đặt hàng khi giỏ hàng trống
                var proceedBtn = document.getElementById('proceedBtn');
                if (proceedBtn) {
                    proceedBtn.disabled = true;
                    proceedBtn.classList.add('disabled');
                    proceedBtn.title = 'Vui lòng thêm món ăn vào giỏ hàng';
                }
                return;
            }

            cart.forEach(function(item) {
                var itemEl = document.createElement('div');
                itemEl.className = 'cart-item';
                var itemTotal = (item.price || 0) * (item.qty || 1);
                
                itemEl.innerHTML = `
                    <div class="cart-item-content">
                        <img src="${item.image || '../images/bowl/default-bowl.jpg'}" 
                             alt="${self.escapeHtml(item.name)}" 
                             class="item-img" />
                        <div class="item-info">
                            <div class="item-header">
                                <h2 class="item-name">${self.escapeHtml(item.name)}</h2>
                                <button class="delete-btn" data-id="${item.id}">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                            <div class="item-details">
                                <div class="price-info">
                                    <p class="item-price">${self.formatMoney(item.price || 0)}</p>
                                    <p class="item-total">${self.formatMoney(itemTotal)}</p>
                                </div>
                                <div class="quantity-control">
                                    <button class="qty-btn minus" data-id="${item.id}">−</button>
                                    <input class="qty-input" 
                                           data-id="${item.id}" 
                                           value="${item.qty}" 
                                           type="number" 
                                           min="1" 
                                           max="99" />
                                    <button class="qty-btn plus" data-id="${item.id}">+</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    ${item.note ? `<p class="item-note">${self.escapeHtml(item.note)}</p>` : ''}
                `;
                cartItems.appendChild(itemEl);
            });

            cartCount.textContent = String(cart.reduce(function(s, i) {
                return s + (i.qty || 0);
            }, 0));

            var subtotal = this.calculateSubtotal(cart);
            var deliveryFee = subtotal >= 300000 ? 0 : 30000; // Free delivery for orders over 300,000 VND
            var total = subtotal + deliveryFee;

            // Kích hoạt lại nút tiến hành đặt hàng khi có sản phẩm
            var proceedBtnActive = document.getElementById('proceedBtn');
            if (proceedBtnActive) {
                proceedBtnActive.disabled = false;
                proceedBtnActive.classList.remove('disabled');
                proceedBtnActive.title = '';
            }

            // Update summary section
            subtotalEl.textContent = this.formatMoney(subtotal);
            
            // Update delivery fee section
            var deliveryFeeEl = document.getElementById('deliveryFee');
            if (deliveryFeeEl) {
                deliveryFeeEl.textContent = deliveryFee === 0 ? 'Miễn phí' : this.formatMoney(deliveryFee);
            }

            // Update total with delivery fee
            totalEl.textContent = this.formatMoney(total);

            // Show free delivery message if applicable
            var freeDeliveryMsg = document.getElementById('freeDeliveryMsg');
            if (freeDeliveryMsg) {
                if (subtotal < 300000) {
                    var remaining = 300000 - subtotal;
                    freeDeliveryMsg.textContent = `Thêm ${this.formatMoney(remaining)} để được miễn phí giao hàng!`;
                    freeDeliveryMsg.style.display = 'block';
                } else {
                    freeDeliveryMsg.style.display = 'none';
                }
            }

            this.setupEventListeners(cartItems);
        },

        setupEventListeners: function(cartItems) {
            if (!cartItems) {
                cartItems = document.getElementById('cartItems');
            }
            if (!cartItems) return;

            var self = this;
            
            // Set up navigation buttons
            const proceedBtn = document.getElementById('proceedBtn');
            const backToCartBtn = document.querySelector('.back-to-cart');
            const backToDeliveryBtn = document.querySelector('.back-to-delivery');
            const confirmOrderBtn = document.getElementById('confirmOrderBtn');

            if (proceedBtn) {
                proceedBtn.addEventListener('click', function() {
                    const cart = self.getCart();
                    if (cart.length === 0) {
                        self.showToast('Vui lòng thêm món ăn vào giỏ hàng');
                        return;
                    }
                    document.getElementById('cartSection').classList.add('hidden');
                    document.getElementById('deliverySection').classList.remove('hidden');
                    // Update progress indicator
                    document.querySelector('[data-step="cart"]').classList.remove('active');
                    document.querySelector('[data-step="delivery"]').classList.add('active');
                });
            }

            if (backToCartBtn) {
                backToCartBtn.addEventListener('click', function() {
                    document.getElementById('deliverySection').classList.add('hidden');
                    document.getElementById('cartSection').classList.remove('hidden');
                    // Update progress indicator
                    document.querySelector('[data-step="delivery"]').classList.remove('active');
                    document.querySelector('[data-step="cart"]').classList.add('active');
                });
            }

            if (backToDeliveryBtn) {
                backToDeliveryBtn.addEventListener('click', function() {
                    document.getElementById('paymentSection').classList.add('hidden');
                    document.getElementById('deliverySection').classList.remove('hidden');
                    // Update progress indicator
                    document.querySelector('[data-step="payment"]').classList.remove('active');
                    document.querySelector('[data-step="delivery"]').classList.add('active');
                });
            }

            // Handle delivery form submission
            const deliveryForm = document.querySelector('.delivery-form');
            if (deliveryForm) {
                deliveryForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    // Store delivery info
                    const formData = new FormData(deliveryForm);
                    const deliveryInfo = Object.fromEntries(formData.entries());
                    localStorage.setItem('deliveryInfo', JSON.stringify(deliveryInfo));
                    
                    // Move to payment
                    document.getElementById('deliverySection').classList.add('hidden');
                    document.getElementById('paymentSection').classList.remove('hidden');
                    // Update progress
                    document.querySelector('[data-step="delivery"]').classList.remove('active');
                    document.querySelector('[data-step="payment"]').classList.add('active');
                });
            }

            // Handle final order confirmation
            if (confirmOrderBtn) {
                confirmOrderBtn.addEventListener('click', async function() {
                    const cart = self.getCart();
                    if (cart.length === 0) {
                        self.showToast('Giỏ hàng trống');
                        return;
                    }

                    const selectedPayment = document.querySelector('input[name="payment"]:checked');
                    if (!selectedPayment) {
                        self.showToast('Vui lòng chọn phương thức thanh toán');
                        return;
                    }

                    const deliveryInfo = JSON.parse(localStorage.getItem('deliveryInfo') || '{}');
                    if (!deliveryInfo.fullName || !deliveryInfo.phone || !deliveryInfo.address) {
                        self.showToast('Thiếu thông tin giao hàng');
                        return;
                    }

                    // Calculate final total
                    const subtotal = self.calculateSubtotal(cart);
                    const deliveryFee = subtotal >= 300000 ? 0 : 30000;
                    const total = subtotal + deliveryFee;

                    // Process the order
                    self.processOrder({
                        items: cart,
                        deliveryInfo: deliveryInfo,
                        paymentMethod: selectedPayment.value,
                        total: total
                    });
                });
            }

            // Thêm event listener cho nút xóa toàn bộ giỏ hàng
            var clearCartBtn = document.getElementById('clearCartBtn');
            if (clearCartBtn) {
                clearCartBtn.addEventListener('click', function() {
                    self.clearCart();
                });
            }

            cartItems.querySelectorAll('.qty-btn.minus').forEach(function(btn) {
                btn.addEventListener('click', function(e) {
                    var id = e.currentTarget.dataset.id;
                    var cart = self.getCart();
                    var it = cart.find(function(x) { return x.id === id; });
                    if (!it) return;
                    self.updateQuantity(id, (it.qty || 1) - 1);
                });
            });

            cartItems.querySelectorAll('.qty-btn.plus').forEach(function(btn) {
                btn.addEventListener('click', function(e) {
                    var id = e.currentTarget.dataset.id;
                    var cart = self.getCart();
                    var it = cart.find(function(x) { return x.id === id; });
                    if (!it) return;
                    self.updateQuantity(id, (it.qty || 1) + 1);
                });
            });

            cartItems.querySelectorAll('.delete-btn').forEach(function(btn) {
                btn.addEventListener('click', function(e) {
                    var id = e.currentTarget.dataset.id;
                    var item = self.getCart().find(i => i.id === id);
                    self.removeFromCart(id);
                    self.showToast('Đã xóa ' + (item ? item.name : 'sản phẩm') + ' khỏi giỏ hàng');
                    self.updateTotalPrice();
                });
            });

            cartItems.querySelectorAll('.qty-input').forEach(function(input) {
                input.addEventListener('change', function(e) {
                    var id = e.currentTarget.dataset.id;
                    var newQty = parseInt(e.currentTarget.value, 10) || 1;
                    if (newQty > 99) {
                        newQty = 99;
                        self.showToast('Số lượng tối đa là 99');
                    } else if (newQty < 1) {
                        newQty = 1;
                    }
                    self.updateQuantity(id, newQty);
                    e.target.value = newQty;
                });

                // Ngăn chặn nhập số âm hoặc ký tự không phải số
                input.addEventListener('keypress', function(e) {
                    if (e.key < '0' || e.key > '9') {
                        e.preventDefault();
                    }
                });
            });
        },

        showToast: function(message) {
            var t = document.createElement('div');
            t.className = 'gb-toast';
            t.textContent = message;
            document.body.appendChild(t);

            var that = this;
            requestAnimationFrame(function() {
                t.classList.add('visible');
            });

            setTimeout(function() {
                t.classList.remove('visible');
                setTimeout(function() {
                    t.remove();
                }, 350);
            }, 1800);
        },

        escapeHtml: function(s) {
            var map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            };
            return (s + '').replace(/[&<>"']/g, function(c) {
                return map[c];
            });
        },

        setupCheckoutHandlers: function() {
            var self = this;
            var checkoutBtn = document.getElementById('checkoutBtn');
            var paymentMethods = document.querySelectorAll('.payment-method');
            
            if (checkoutBtn) {
                checkoutBtn.addEventListener('click', function() {
                    var cart = self.getCart();
                    if (cart.length === 0) {
                        self.showToast('Vui lòng thêm món ăn vào giỏ hàng');
                        return;
                    }

                    var selectedPayment = document.querySelector('.payment-method.selected');
                    if (!selectedPayment) {
                        self.showToast('Vui lòng chọn phương thức thanh toán');
                        return;
                    }

                    // Validate delivery information
                    var deliveryAddress = document.getElementById('deliveryAddress');
                    var phoneNumber = document.getElementById('phoneNumber');
                    
                    if (!deliveryAddress || !deliveryAddress.value.trim()) {
                        self.showToast('Vui lòng nhập địa chỉ giao hàng');
                        return;
                    }

                    if (!phoneNumber || !phoneNumber.value.trim()) {
                        self.showToast('Vui lòng nhập số điện thoại');
                        return;
                    }

                    // Process the order
                    self.processOrder({
                        items: cart,
                        deliveryAddress: deliveryAddress.value,
                        phoneNumber: phoneNumber.value,
                        paymentMethod: selectedPayment.dataset.method,
                        total: self.calculateSubtotal(cart) + (self.calculateSubtotal(cart) >= 300000 ? 0 : 30000)
                    });
                });
            }
            
            // Payment method selection
            if (paymentMethods) {
                paymentMethods.forEach(function(method) {
                    method.addEventListener('click', function() {
                        paymentMethods.forEach(m => m.classList.remove('selected'));
                        method.classList.add('selected');
                    });
                });
            }
        },

        processOrder: async function(orderData) {
            var self = this;
            
            try {
                // Validate user is logged in according to client storage
                const userInfo = (window.SessionManager && window.SessionManager.getUserInfo && window.SessionManager.getUserInfo()) || JSON.parse(localStorage.getItem('userInfo') || 'null');
                console.log('Current user info (may be null for guests):', userInfo);

                // Proceed with order creation regardless of server-side session.
                // Include client-side user_id if available; backend will accept it as a dev fallback.
                self.showToast('Đang xử lý đơn hàng...');
                
                // Prepare order data (include client-side user_id as a development fallback)
                const orderPayload = {
                    items: self.getCart(),
                    total: orderData.total,
                    deliveryAddress: orderData.deliveryAddress,
                    phoneNumber: orderData.phoneNumber,
                    paymentMethod: orderData.paymentMethod,
                    user_id: (userInfo && userInfo.id) || null
                };
                
                console.log('Sending order payload:', orderPayload);
                
                const response = await fetch('http://localhost:5000/api/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify(orderPayload)
                });

                console.log('Order response:', response);
                const result = await response.json();
                console.log('Order result:', result);
                
                if (result.success) {
                    // Get delivery info and calculate totals
                    const deliveryInfo = JSON.parse(localStorage.getItem('deliveryInfo') || '{}');
                    
                    // Get the total that was displayed on the orders page
                    const displayedOrderTotal = document.getElementById('subtotal')?.textContent || '0đ';
                    const displayedTotal = document.getElementById('totalAmount')?.textContent || '0đ';
                    const cart = self.getCart();
                    
                    // Parse the displayed totals to get numeric values
                    const orderTotal = Number(displayedOrderTotal.replace(/[^\d]/g, ''));
                    const finalTotal = Number(displayedTotal.replace(/[^\d]/g, ''));
                    
                    // Calculate delivery fee
                    const deliveryFee = orderTotal >= 300000 ? 0 : 30000;

                    // Log order details for debugging
                    console.log('Order Details:', {
                        originalOrderTotal: displayedOrderTotal,
                        originalTotal: displayedTotal,
                        orderTotal,
                        deliveryFee,
                        finalTotal,
                        cartItems: cart
                    });

                    // Save complete order details for confirmation page
                    localStorage.setItem('lastOrder', JSON.stringify({
                        order_id: result.order_id,
                        customerInfo: {
                            fullName: deliveryInfo.fullName,
                            phone: deliveryInfo.phone,
                            email: deliveryInfo.email,
                            address: `${deliveryInfo.address}, ${deliveryInfo.district}, ${deliveryInfo.city}`,
                            notes: deliveryInfo.notes
                        },
                        orderTotal: displayedOrderTotal,  // Lưu giá trị đã format
                        shippingFee: deliveryFee,
                        totalAmount: displayedTotal,  // Lưu giá trị đã format
                        orderItems: cart.map(item => ({
                            name: item.name,
                            quantity: item.qty,
                            price: item.price,
                            total: item.price * item.qty
                        }))
                    }));

                    // Clear cart without confirmation
                    localStorage.removeItem('cart');
                    
                    // Redirect to confirmation page
                    window.location.href = 'order-confirmation.html';
                } else {
                    throw new Error(result.message || 'Lỗi khi đặt hàng');
                }
            } catch (error) {
                console.error('Order error:', error);
                self.showToast('Lỗi: ' + (error.message || 'Không thể đặt hàng. Vui lòng thử lại.'));
            }
        }
    };

    // Initialize cart manager and expose API globally
    var cartManager = new CartManager();

    window.GBCart = {
        addToCart: function(item, qty) { cartManager.addToCart(item, qty); },
        getCart: function() { return cartManager.getCart(); },
        clearCart: function() { cartManager.clearCart(); },
        updateQuantity: function(id, qty) { cartManager.updateQuantity(id, qty); },
        removeFromCart: function(id) { cartManager.removeFromCart(id); },
        renderCartOnOrdersPage: function() { cartManager.renderCartOnOrdersPage(); },
        processOrder: function(data) { cartManager.processOrder(data); }
    };

    // Setup cart when page loads
    document.addEventListener('DOMContentLoaded', function() {
        var cartManager = new CartManager();
        cartManager.init();

        // Sử dụng event delegation cho tất cả các nút trong giỏ hàng
        document.addEventListener('click', function(e) {
            const target = e.target;

            // Xử lý nút tăng/giảm số lượng
            if (target.classList.contains('qty-btn')) {
                const id = target.dataset.id;
                const item = cartManager.getCart().find(i => i.id === id);
                if (!item) return;

                if (target.classList.contains('minus')) {
                    if (item.qty > 1) {
                        cartManager.updateQuantity(id, item.qty - 1);
                    } else {
                        cartManager.removeFromCart(id);
                    }
                } else if (target.classList.contains('plus')) {
                    cartManager.updateQuantity(id, item.qty + 1);
                }
            }

            // Xử lý nút xóa sản phẩm
            if (target.classList.contains('delete-btn') || target.closest('.delete-btn')) {
                const id = target.dataset.id || target.closest('.delete-btn').dataset.id;
                cartManager.removeFromCart(id);
            }

            // Xử lý nút xóa toàn bộ giỏ hàng
            if (target.id === 'clearCartBtn') {
                cartManager.clearCart();
            }
        });

        // Setup proceed button
        const proceedBtn = document.getElementById('proceedBtn');
        if (proceedBtn) {
            proceedBtn.addEventListener('click', function() {
                const cart = cartManager.getCart();
                if (cart.length === 0) {
                    cartManager.showToast('Giỏ hàng của bạn đang trống');
                    return;
                }
                
                // Move to delivery section
                document.getElementById('cartSection').classList.add('hidden');
                document.getElementById('deliverySection').classList.remove('hidden');
                
                // Update progress indicator
                document.querySelector('[data-step="cart"]').classList.remove('active');
                document.querySelector('[data-step="delivery"]').classList.add('active');
            });
        }

        // Setup delivery form submission
        const deliveryForm = document.querySelector('.delivery-form');
        if (deliveryForm) {
            deliveryForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // Get form data
                const formData = new FormData(deliveryForm);
                const deliveryData = {
                    fullName: formData.get('fullName'),
                    phone: formData.get('phone'),
                    email: formData.get('email'),
                    city: formData.get('city'),
                    district: formData.get('district'),
                    address: formData.get('address'),
                    notes: formData.get('notes')
                };

                // Validate delivery data
                if (!deliveryData.fullName || !deliveryData.phone || !deliveryData.address) {
                    cartManager.showToast('Vui lòng điền đầy đủ thông tin giao hàng');
                    return;
                }

                // Move to payment section
                document.getElementById('deliverySection').classList.add('hidden');
                document.getElementById('paymentSection').classList.remove('hidden');
                
                // Update progress indicator
                document.querySelector('[data-step="delivery"]').classList.remove('active');
                document.querySelector('[data-step="payment"]').classList.add('active');

                // Store delivery data
                localStorage.setItem('deliveryInfo', JSON.stringify(deliveryData));
            });
        }

        // Setup payment method selection
        const paymentMethods = document.querySelectorAll('.payment-method input[type="radio"]');
        paymentMethods.forEach(method => {
            method.addEventListener('change', function() {
                document.querySelectorAll('.payment-method').forEach(pm => {
                    pm.classList.remove('selected');
                });
                this.closest('.payment-method').classList.add('selected');
            });
        });

        // Setup promo code
        const applyPromoBtn = document.querySelector('.apply-promo');
        const promoInput = document.querySelector('.promo-code input');
        if (applyPromoBtn && promoInput) {
            applyPromoBtn.addEventListener('click', function() {
                const promoCode = promoInput.value.trim().toUpperCase();
                if (promoCode === 'WELCOME') {
                    cartManager.applyDiscount(10); // 10% discount
                    cartManager.showToast('Mã giảm giá đã được áp dụng');
                } else {
                    cartManager.showToast('Mã giảm giá không hợp lệ');
                }
            });
        }

        // Setup city-district dependency
        const citySelect = document.querySelector('select[name="city"]');
        const districtSelect = document.querySelector('select[name="district"]');
        if (citySelect && districtSelect) {
            citySelect.addEventListener('change', function() {
                // Clear current districts
                districtSelect.innerHTML = '<option value="">Chọn quận/huyện</option>';
                
                // Add districts based on selected city
                if (this.value === 'hcm') {
                    ['Quận 1', 'Quận 2', 'Quận 3', 'Thủ Đức', 'Bình Thạnh'].forEach(district => {
                        const option = new Option(district, district.toLowerCase());
                        districtSelect.add(option);
                    });
                } else if (this.value === 'hanoi') {
                    ['Ba Đình', 'Hoàn Kiếm', 'Hai Bà Trưng', 'Đống Đa'].forEach(district => {
                        const option = new Option(district, district.toLowerCase());
                        districtSelect.add(option);
                    });
                }
            });
        }
    });

})(window);