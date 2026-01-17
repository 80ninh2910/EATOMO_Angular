/* Admin dashboard interactivity + iframe navigation */
document.addEventListener('DOMContentLoaded', async () => {
  // Check if admin is logged in - check localStorage first
  const userRole = localStorage.getItem('userRole');
  const adminInfo = localStorage.getItem('adminInfo');
  
  if (!userRole || userRole !== 'admin' || !adminInfo) {
    // Fallback to SessionManager if available
    if (!window.SessionManager || !window.SessionManager.isLoggedIn() || window.SessionManager.getUserRole() !== 'admin') {
      alert('Access denied. Please login as admin.');
      window.location.href = 'login.html';
      return;
    }
  }

  // Display admin info
  let adminData;
  if (window.SessionManager && window.SessionManager.getUserInfo) {
    adminData = window.SessionManager.getUserInfo();
  } else {
    adminData = JSON.parse(adminInfo);
  }
  console.log('Admin logged in:', adminData);
  
  // Update admin profile in sidebar
  const profileName = document.querySelector('.profile strong');
  const profileEmail = document.querySelector('.profile .muted');
  if (profileName) profileName.textContent = adminData.display_name || adminData.username;
  if (profileEmail) profileEmail.textContent = adminData.email;

  // Set year
  document.getElementById('year').textContent = new Date().getFullYear();

  // Initialize iframe navigation
  initIframeNavigation();

  // Theme toggle
  document.getElementById('theme-toggle').addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
  });
});

// Iframe navigation system
function initIframeNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const contentFrame = document.getElementById('contentFrame');
  
  // Page mapping
  const pageMap = {
    'dashboard': 'pages/dashboard.html',
    'orders': 'pages/orders.html',
    'customers': 'pages/customers.html',
    'menu': 'pages/menu.html',
    'analytics': 'pages/analytics.html',
    'settings': 'pages/settings.html'
  };

  // Add click event listeners to navigation items
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      // Remove active class from all items
      navItems.forEach(nav => nav.classList.remove('active'));
      
      // Add active class to clicked item
      item.classList.add('active');
      
      // Get page name from data attribute
      const pageName = item.getAttribute('data-page');
      
      // Load the corresponding page in iframe
      if (pageMap[pageName]) {
        contentFrame.src = pageMap[pageName];
      }
    });
  });
}

// Admin logout functionality
document.addEventListener('DOMContentLoaded', function() {
  // Add logout event listener to top header logout button
  const topLogoutBtn = document.getElementById('adminLogoutBtn');
  if (topLogoutBtn) {
    topLogoutBtn.addEventListener('click', async function() {
      if (confirm('Are you sure you want to logout?')) {
        if (window.SessionManager) {
          await window.SessionManager.logout();
        } else {
          // Fallback logout: remove only auth keys so cart or other data isn't lost
          try {
            localStorage.removeItem('userInfo');
            localStorage.removeItem('adminInfo');
            localStorage.removeItem('userRole');
          } catch (e) { /* ignore */ }
          window.location.href = 'login.html';
        }
      }
    });
  }

  // Add logout event listener to sidebar sign out button
  const signOutBtn = document.querySelector('.sidebar-footer .ghost');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', async function() {
      if (confirm('Are you sure you want to logout?')) {
        if (window.SessionManager) {
          await window.SessionManager.logout();
        } else {
          // Fallback logout: remove only auth keys so cart or other data isn't lost
          try {
            localStorage.removeItem('userInfo');
            localStorage.removeItem('adminInfo');
            localStorage.removeItem('userRole');
          } catch (e) { /* ignore */ }
          window.location.href = 'login.html';
        }
      }
    });
  }
});