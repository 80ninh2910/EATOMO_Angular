// Mobile Menu Toggle
const menuToggle = document.getElementById("menuToggle")
const nav = document.querySelector(".nav")

menuToggle.addEventListener("click", () => {
  nav.classList.toggle("active")

  // Animate hamburger menu
  const spans = menuToggle.querySelectorAll("span")
  if (nav.classList.contains("active")) {
    spans[0].style.transform = "rotate(45deg) translateY(10px)"
    spans[1].style.opacity = "0"
    spans[2].style.transform = "rotate(-45deg) translateY(-10px)"
  } else {
    spans[0].style.transform = "none"
    spans[1].style.opacity = "1"
    spans[2].style.transform = "none"
  }
})

// Sticky Header Effect
let lastScroll = 0
const header = document.querySelector(".header")

window.addEventListener("scroll", () => {
  const currentScroll = window.pageYOffset

  if (currentScroll > 100) {
    header.style.padding = "10px 0"
    header.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.15)"
  } else {
    header.style.padding = "20px 0"
    header.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.08)"
  }

  lastScroll = currentScroll
})

// Utility function for formatting money as VND
function formatMoney(amount) {
  try {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  } catch (e) {
    return amount + ' VND';
  }
}

// Cart Management
let cart = [];

// Load cart from localStorage when page loads
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize modal elements
    initializeModal();
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }

    // Load menu items
    const categories = await MenuManager.getMenuItems();
    const menuContainer = document.querySelector('.menu-items-container');
    if (menuContainer) {
        categories.forEach(category => {
            const categorySection = document.createElement('section');
            categorySection.classList.add('menu-category');
            categorySection.innerHTML = `
                <h2>${category.name}</h2>
                <div class="menu-grid">
                    ${category.items.map(item => `
                        <div class="menu-item" data-id="${item.id}">
                            <img src="${item.image}" alt="${item.name}">
                            <h3>${item.name}</h3>
                            <p>${item.description}</p>
                            <div class="price-add">
                                <span class="price">${MenuManager.formatPrice(item.price)}</span>
                                <button class="add-to-cart">Add to Cart</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            menuContainer.appendChild(categorySection);
        });
    }
});

// Added to Bag Modal Functionality
let modal;
let closeBtn;
let continueShoppingBtn;
let viewBagBtn;
let cartItemsContainer;

function initializeModal() {
    modal = document.getElementById('addedToBagModal');
    if (!modal) {
        console.error('Modal element not found');
        return;
    }
    closeBtn = modal.querySelector('.close-btn');
    continueShoppingBtn = modal.querySelector('.continue-shopping');
    viewBagBtn = modal.querySelector('.view-bag');
    cartItemsContainer = modal.querySelector('.cart-items');

    // Add click handlers for modal buttons
    closeBtn.addEventListener('click', hideModal);
    continueShoppingBtn.addEventListener('click', hideModal);
    viewBagBtn.addEventListener('click', () => {
        window.location.href = 'orders.html';
    });

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideModal();
        }
    });
}

// Listen for cart reset events (dispatched after successful login) and clear UI selections
window.addEventListener('cart:reset', function () {
  try {
    cart = [];
    localStorage.setItem('cart', JSON.stringify([]));
    // Update modal display if present
    if (typeof updateCartDisplay === 'function') updateCartDisplay();
    // Hide modal if open
    if (typeof hideModal === 'function') hideModal();
    // Remove any visual 'in-cart' or 'selected' markers on bowl cards/buttons
    document.querySelectorAll('.bowl-card, .add-to-bag-btn, .add-to-cart, .add-to-bag-btn').forEach(el => {
      el.classList.remove('in-cart');
      el.classList.remove('selected');
    });
  } catch (e) {
    console.error('Error handling cart:reset', e);
  }
});

function addToBag(product) {
    // Lấy giỏ hàng từ localStorage
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Kiểm tra sản phẩm đã tồn tại
  // Normalize price to integer VND. If product.price looks like a small decimal (e.g. 12.99)
  // assume it's a unit price in some currency and convert by *10000 => 129900 VND.
  const rawPrice = Number(product.price) || 0;
  const priceVND = (rawPrice > 0 && rawPrice < 1000) ? Math.round(rawPrice * 10000) : Math.round(rawPrice || 0);

  const existingItem = cart.find(item => item.id === product.id);
  if (existingItem) {
    existingItem.qty = Math.min((existingItem.qty || 1) + 1, 99);
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: priceVND,
      image: product.image,
      qty: 1
    });
  }

    // Lưu vào localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Show the cart modal
    showCartModal();
}

function showCartModal() {
    if (!modal) return;
    updateCartDisplay();
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function updateCartDisplay() {
    // Clear existing items
    cartItemsContainer.innerHTML = '';
    
    // Get latest cart from localStorage
    const cart = JSON.parse(localStorage.getItem('cart')) || [];

    // Add each item to the display
    cart.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-details">
                <h3 class="cart-item-name">${item.name}</h3>
                <p class="cart-item-price">${formatMoney(item.price * item.qty)}</p>
                <p class="cart-item-quantity">Số lượng: ${item.qty}</p>
            </div>
            <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">×</button>
        `;
        cartItemsContainer.appendChild(itemElement);
    });

    // Update totals
    const totalItems = cart.reduce((sum, item) => sum + (item.qty || 0), 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    
    document.getElementById('totalItems').textContent = totalItems;
    document.getElementById('totalPrice').textContent = totalPrice.toFixed(2);
}

function removeFromCart(id) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart = cart.filter(item => item.id !== id);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
    
    // Hide modal if cart is empty
    if (cart.length === 0) {
        hideModal();
    }
}

function hideModal() {
    if (!modal) return;
    modal.classList.remove('show');
    document.body.style.overflow = '';
}


// Add "Add to Bag" buttons to all bowls
function addAddToBagButtons() {
    const bowlCards = document.querySelectorAll('.bowl-card');
    bowlCards.forEach(card => {
        // Skip if button already exists
        if (card.querySelector('.add-to-bag-btn')) return;
        
        const bowlName = card.querySelector('.bowl-name').textContent;
        const bowlImage = card.querySelector('.bowl-image img').src;
        const button = document.createElement('button');
        button.className = 'add-to-bag-btn';
        button.textContent = 'Add to Bag';
        button.onclick = () => addToBag({
            id: 'bowl-' + bowlName.toLowerCase().replace(/\s+/g, '-'),
            name: bowlName + ' Bowl',
            image: bowlImage,
            price: 12.99
        });

        // Insert before bowl-macros
        const macrosDiv = card.querySelector('.bowl-macros');
        macrosDiv.parentNode.insertBefore(button, macrosDiv);
    });
}

// Call function when page loads
document.addEventListener('DOMContentLoaded', addAddToBagButtons);

// Filter Tabs Functionality
const filterTabs = document.querySelectorAll(".filter-tab")
const bowlSections = document.querySelectorAll(".bowls-section")

filterTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    // Add click animation
    tab.style.transform = "scale(0.95)"
    setTimeout(() => {
      tab.style.transform = ""
    }, 150)

    // Remove active class from all tabs
    filterTabs.forEach((t) => t.classList.remove("active"))

    // Add active class to clicked tab
    tab.classList.add("active")

    // Get filter value
    const filterValue = tab.getAttribute("data-filter")

    // Show/hide sections based on filter
    bowlSections.forEach((section, index) => {
      if (filterValue === "all") {
        section.style.display = "block"
        setTimeout(() => {
          section.style.opacity = "1"
          section.style.transform = "translateY(0)"
        }, index * 100)
      } else {
        const sectionId = section.getAttribute("id")
        if (sectionId === filterValue) {
          section.style.display = "block"
          setTimeout(() => {
            section.style.opacity = "1"
            section.style.transform = "translateY(0)"
          }, 100)
        } else {
          section.style.opacity = "0"
          section.style.transform = "translateY(20px)"
          setTimeout(() => {
            section.style.display = "none"
          }, 300)
        }
      }
    })

    // Scroll to first visible section
    if (filterValue !== "all") {
      const targetSection = document.getElementById(filterValue)
      if (targetSection) {
        setTimeout(() => {
          targetSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
          })
        }, 400)
      }
    }
  })
})

// Download Recipe Function
function downloadRecipe(bowlName) {
  const bowlCard = document.querySelector(`[data-bowl="${bowlName}"]`)
  if (!bowlCard) return

  const bowlDescription = bowlCard.querySelector(".bowl-description").textContent
  const calories = bowlCard.querySelector(".calories-badge").textContent
  const macros = bowlCard.querySelectorAll(".macro")
  
  let macroInfo = ""
  macros.forEach((macro, index) => {
    const value = macro.querySelector(".macro-value").textContent
    const label = macro.querySelector(".macro-label").textContent
    macroInfo += `${value} ${label}`
    if (index < macros.length - 1) macroInfo += " | "
  })

  const recipeInfo = `📋 **${bowlName} Recipe**\n\n` +
    `🥗 **Ingredients:**\n${bowlDescription}\n\n` +
    `📊 **Nutrition:**\n${calories}\n${macroInfo}\n\n` +
    `👨‍🍳 **Instructions:**\n` +
    `1. Prepare all ingredients fresh\n` +
    `2. Cook protein using sous-vide technique\n` +
    `3. Steam vegetables until tender\n` +
    `4. Cook rice/carbs according to package\n` +
    `5. Assemble bowl with love\n` +
    `6. Add sauce and enjoy!\n\n` +
    `💡 **Pro tip:** For best results, follow our exact cooking times!`

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(recipeInfo));
    element.setAttribute('download', `${bowlName}-recipe.txt`);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();
    document.body.removeChild(element);
}

// View Full Menu Function
function viewFullMenu() {
  const menuInfo = `📋 **Soumaki Full Menu:**\n\n` +
    `🥗 **Low Calories (L1-L10):**\n` +
    `• Less than 350kcal\n` +
    `• Perfect for weight loss\n` +
    `• High protein, low fat\n\n` +
    `⚖️ **Balanced (B1-B15):**\n` +
    `• 350-550kcal range\n` +
    `• Perfect macronutrient balance\n` +
    `• Ideal for daily nutrition\n\n` +
    `💪 **High Protein (H1-H10):**\n` +
    `• Over 550kcal\n` +
    `• Great for muscle building\n` +
    `• Post-workout recovery\n\n` +
    `🌱 **Vegetarian (V1-V5):**\n` +
    `• Plant-based goodness\n` +
    `• Balanced nutrition\n` +
    `• Flavorful and healthy\n\n` +
    `📞 **Order now:** 0326238700\n` +
    `🌐 **Online:** Grab, Now, Baemin`

  alert(menuInfo)
}

// Navigation Functions (from main script)
function navigateToPage(page) {
  console.log(`Navigating to: ${page}`)
  
  switch(page) {
    case 'about':
      window.location.href = 'about-us.html'
      break
    case 'bowls':
      // Already on bowls page
      break
    case 'stores':
      showStoreLocations()
      break
    case 'delivery':
      showDeliveryOptions()
      break
    case 'contact':
      scrollToSection('.footer')
      break
    case 'calculator':
      openCaloriesCalculator()
      break
    case 'catering':
      showCateringInfo()
      break
    default:
      console.log(`Page ${page} not found`)
  }
}



// Delivery Options Function
function showDeliveryOptions() {
  const deliveryInfo = `🚚 **Delivery Options:**\n\n` +
    `📱 **Available on:**\n` +
    `• Grab Food\n` +
    `• Now (Foody)\n` +
    `• Baemin\n\n` +
    `⏰ **Delivery Hours:**\n` +
    `10AM - 9PM Daily\n\n` +
    `📞 **Hotline:** 0326238700\n\n` +
    `💡 **Tip:** Order through your preferred delivery app for the best experience!`
  // Avoid blocking alert; navigate the user to the Cart/Orders page
  try { sessionStorage.setItem('deliveryInfoPreview', deliveryInfo); } catch (e) { /* ignore */ }
  window.location.href = 'orders.html';
}

// Catering Information Function
function showCateringInfo() {
  const cateringInfo = `🍽️ **Soumaki Catering Services:**\n\n` +
    `✨ **Perfect for:**\n` +
    `• Corporate events\n` +
    `• Team meetings\n` +
    `• Private parties\n` +
    `• Health-focused gatherings\n\n` +
    `🥗 **What we offer:**\n` +
    `• Custom bowl selections\n` +
    `• Bulk orders\n` +
    `• Dietary accommodations\n` +
    `• Professional presentation\n\n` +
    `📞 **Contact for catering:**\n` +
    `Phone: 0326238700\n` +
    `Email: info@soumaki.com.vn\n\n` +
    `💼 **Minimum order:** 20 bowls\n` +
    `📅 **Advance notice:** 48 hours`
  
  alert(cateringInfo)
}

// Calories Calculator Function
function openCaloriesCalculator() {
  const calculatorInfo = `🧮 **Soumaki Calories Calculator:**\n\n` +
    `📊 **How it works:**\n` +
    `1. Choose your protein\n` +
    `2. Select your carbs\n` +
    `3. Pick your vegetables\n` +
    `4. Add your sauce\n` +
    `5. Get instant calorie count!\n\n` +
    `🎯 **Features:**\n` +
    `• Real-time calculation\n` +
    `• Macronutrient breakdown\n` +
    `• Custom portion sizes\n` +
    `• Save your favorites\n\n` +
    `🌐 **Access calculator at:**\n` +
    `soumaki.com.vn/calculator\n\n` +
    `💡 **Coming soon:** Mobile app with advanced features!`
  
  alert(calculatorInfo)
}

// Social Media Functions
function openSocialMedia(platform) {
  const platformInfo = {
    facebook: '📘 **Follow us on Facebook:**\n\nGet updates on new bowls, promotions, and healthy eating tips!\n\n🌐 Opening Facebook...',
    instagram: '📸 **Follow us on Instagram:**\n\nSee beautiful bowl photos, behind-the-scenes content, and customer stories!\n\n🌐 Opening Instagram...',
    tiktok: '🎵 **Follow us on TikTok:**\n\nWatch fun cooking videos, bowl assembly tutorials, and healthy lifestyle content!\n\n🌐 Opening TikTok...'
  }
  
  alert(platformInfo[platform])
}

// FAQ Function
function showFAQs() {
  const faqInfo = `❓ **Frequently Asked Questions:**\n\n` +
    `🥗 **Q: What makes Soumaki bowls healthy?**\n` +
    `A: We use fresh ingredients, sous-vide cooking, and balanced macronutrients.\n\n` +
    `⏰ **Q: What are your opening hours?**\n` +
    `A: We're open 10AM - 9PM daily at all locations.\n\n` +
    `🚚 **Q: Do you deliver?**\n` +
    `A: Yes! We're available on Grab, Now, and Baemin.\n\n` +
    `🍽️ **Q: Do you offer catering?**\n` +
    `A: Absolutely! Contact us for events and bulk orders.\n\n` +
    `📊 **Q: How do I calculate calories?**\n` +
    `A: Use our online calculator or ask our staff for help.\n\n` +
    `💳 **Q: What payment methods do you accept?**\n` +
    `A: Cash, card, and all major digital wallets.\n\n` +
    `📞 **Need more help? Call us: 0326238700**`
  
  alert(faqInfo)
}

// Utility Functions
function scrollToSection(selector) {
  const element = document.querySelector(selector)
  if (element) {
    element.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    })
  }
}

// Intersection Observer for Animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, index) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.style.opacity = "1"
        entry.target.style.transform = "translateY(0)"
        entry.target.classList.add("animate-fade-up")
      }, index * 100)
    }
  })
}, observerOptions)

// Observe all bowl sections
document.querySelectorAll(".bowls-section").forEach((section) => {
  section.style.opacity = "0"
  section.style.transform = "translateY(50px)"
  section.style.transition = "opacity 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275), transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
  observer.observe(section)
})

// Bowl Card Animation on Scroll
const bowlObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, index) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.style.opacity = "1"
        entry.target.style.transform = "translateY(0) scale(1)"
        entry.target.classList.add("animate-bounce-in")
      }, index * 100)
    }
  })
}, observerOptions)

document.querySelectorAll(".bowl-card").forEach((card) => {
  card.style.opacity = "0"
  card.style.transform = "translateY(50px) scale(0.9)"
  card.style.transition = "opacity 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275), transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
  bowlObserver.observe(card)
})

// Enhanced hover effect to cards
const cards = document.querySelectorAll(".bowl-card")
cards.forEach((card) => {
  card.addEventListener("mouseenter", function () {
    this.style.transform = "translateY(-20px) scale(1.02)"
    this.style.boxShadow = "0 25px 50px rgba(76, 175, 80, 0.25)"
  })

  card.addEventListener("mouseleave", function () {
    this.style.transform = "translateY(0) scale(1)"
    this.style.boxShadow = ""
  })
})

// Smooth Scroll for Links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault()
    const target = document.querySelector(this.getAttribute("href"))
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  })
})

// Page Load Animation
window.addEventListener("load", () => {
  document.body.style.opacity = "0"
  document.body.style.transition = "opacity 0.5s ease-in"

  setTimeout(() => {
    document.body.style.opacity = "1"
  }, 100)
})

// Console Welcome Message
console.log("%c🥗 Welcome to Soumaki Our Bowls! ", "background: #4CAF50; color: white; font-size: 20px; padding: 10px;")
console.log("%cYour healthy food soulmate 💚", "color: #4CAF50; font-size: 14px;")

