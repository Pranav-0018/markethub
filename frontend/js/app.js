/**
 * ===================================================================
 * MINI AMAZON / FLIPKART - SHARED JAVASCRIPT HELPERS (frontend/js/app.js)
 * Clean, simple vanilla JS for college viva explanation
 * ===================================================================
 */

// Backend Base API URL
const API_URL = '/api';

/**
 * 1. apiFetch: Generic wrapper around the browser's native fetch() API
 * - Automatically attaches Authorization: Bearer <token> from localStorage
 * - Sets JSON headers if body is a plain object (skips for FormData uploads)
 * - Returns parsed JSON response
 */
async function apiFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_URL}${path}`;
  const headers = options.headers || {};

  // Retrieve stored JWT token
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If body is NOT FormData, set Content-Type to application/json
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    if (typeof options.body === 'object') {
      options.body = JSON.stringify(options.body);
    }
  }

  options.headers = headers;

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error on [${options.method || 'GET'} ${path}]:`, error.message);
    throw error;
  }
}

/**
 * 2. AUTHENTICATION HELPERS
 */

// Get currently logged-in user object from localStorage
function getUser() {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
}

// Save authentication data (token + user object) on successful login
function saveLogin(data) {
  if (data.token) localStorage.setItem('token', data.token);
  if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
}

// Clear session and redirect to login page
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  showToast('Logged out successfully');
  setTimeout(() => {
    window.location.href = 'login.html';
  }, 400);
}

// Route Guard: Ensures the page is only viewed by users with the allowed role
function requireRole(allowedRole) {
  const user = getUser();
  if (!user) {
    alert('Please log in to continue.');
    window.location.href = 'login.html';
    return false;
  }

  if (allowedRole && user.role !== allowedRole) {
    alert(`Access Denied! This page requires '${allowedRole}' role. You are logged in as '${user.role}'.`);
    if (user.role === 'admin') window.location.href = 'admin.html';
    else if (user.role === 'seller') window.location.href = 'seller.html';
    else window.location.href = 'index.html';
    return false;
  }

  return true;
}

/**
 * 3. SHOPPING CART HELPERS (Using localStorage)
 */

function getCart() {
  const cartStr = localStorage.getItem('cart');
  if (!cartStr) return [];
  try {
    return JSON.parse(cartStr);
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateNavbarCartCount();
}

function addToCart(product, quantity = 1) {
  const cart = getCart();
  const existing = cart.find((item) => item.product === product._id);

  const availableStock = product.stock !== undefined ? product.stock : 999;

  if (existing) {
    if (existing.quantity + quantity > availableStock) {
      showToast(`Cannot add more. Available stock is only ${availableStock}`, 'error');
      return false;
    }
    existing.quantity += quantity;
  } else {
    if (quantity > availableStock) {
      showToast(`Cannot add. Available stock is only ${availableStock}`, 'error');
      return false;
    }
    cart.push({
      product: product._id,
      name: product.name,
      price: product.price,
      image: product.image,
      stock: availableStock,
      seller: product.seller?._id || product.seller,
      sellerName: product.seller?.shopName || product.seller?.name || 'Seller',
      quantity: quantity
    });
  }

  saveCart(cart);
  showToast(`Added "${product.name}" to cart!`);
  return true;
}

function updateQty(productId, quantity) {
  let cart = getCart();
  const item = cart.find((i) => i.product === productId);
  if (!item) return;

  const newQty = Number(quantity);
  if (newQty <= 0) {
    cart = cart.filter((i) => i.product !== productId);
  } else {
    if (newQty > item.stock) {
      showToast(`Only ${item.stock} units available in stock`, 'error');
      item.quantity = item.stock;
    } else {
      item.quantity = newQty;
    }
  }

  saveCart(cart);
}

function removeFromCart(productId) {
  let cart = getCart();
  cart = cart.filter((i) => i.product !== productId);
  saveCart(cart);
  showToast('Item removed from cart');
}

function clearCart() {
  localStorage.removeItem('cart');
  updateNavbarCartCount();
}

function getCartCount() {
  const cart = getCart();
  return cart.reduce((total, item) => total + item.quantity, 0);
}

function updateNavbarCartCount() {
  const badge = document.getElementById('navbar-cart-count');
  if (badge) {
    badge.textContent = getCartCount();
  }
}

/**
 * 4. NAVBAR BUILDER
 * Generates dynamic header navigation links based on user role (Guest / Customer / Seller / Admin)
 */
function renderNavbar() {
  const navContainer = document.getElementById('navbar');
  if (!navContainer) return;

  const user = getUser();
  const cartCount = getCartCount();

  let linksHtml = '';

  if (!user) {
    // Guest User
    linksHtml = `
      <ul class="nav-links">
        <li><a href="index.html">🛒 Browse Store</a></li>
        <li>
          <a href="cart.html">
            🛍️ Cart <span class="cart-badge" id="navbar-cart-count">${cartCount}</span>
          </a>
        </li>
        <li><a href="login.html" class="btn btn-sm btn-outline" style="color:white; border-color:white;">Login</a></li>
        <li><a href="register.html" class="btn btn-sm btn-secondary">Sign Up</a></li>
      </ul>
    `;
  } else if (user.role === 'customer') {
    // Logged-in Customer
    linksHtml = `
      <ul class="nav-links">
        <li><a href="index.html">🛒 Products</a></li>
        <li><a href="my-orders.html">📦 My Orders</a></li>
        <li>
          <a href="cart.html">
            🛍️ Cart <span class="cart-badge" id="navbar-cart-count">${cartCount}</span>
          </a>
        </li>
        <li><span class="user-badge">👤 ${user.name}</span></li>
        <li><a href="javascript:void(0)" onclick="logout()" class="btn btn-sm btn-outline" style="color:white; border-color:white;">Logout</a></li>
      </ul>
    `;
  } else if (user.role === 'seller') {
    // Logged-in Approved Seller
    linksHtml = `
      <ul class="nav-links">
        <li><a href="index.html">🛒 Storefront</a></li>
        <li><a href="seller.html" style="font-weight:700; color:#ffe500;">🏪 Seller Dashboard</a></li>
        <li><span class="user-badge">🏪 ${user.shopName || user.name} (Seller)</span></li>
        <li><a href="javascript:void(0)" onclick="logout()" class="btn btn-sm btn-outline" style="color:white; border-color:white;">Logout</a></li>
      </ul>
    `;
  } else if (user.role === 'admin') {
    // Logged-in Admin
    linksHtml = `
      <ul class="nav-links">
        <li><a href="index.html">🛒 Storefront</a></li>
        <li><a href="admin.html" style="font-weight:700; color:#ffe500;">⚙️ Admin Panel</a></li>
        <li><span class="user-badge">🛡️ Super Admin</span></li>
        <li><a href="javascript:void(0)" onclick="logout()" class="btn btn-sm btn-outline" style="color:white; border-color:white;">Logout</a></li>
      </ul>
    `;
  }

  navContainer.innerHTML = `
    <header class="navbar">
      <div class="nav-container">
        <a href="index.html" class="nav-brand">
          🛍️ Mini<span>Mart</span>
        </a>
        ${linksHtml}
      </div>
    </header>
  `;
}

/**
 * 5. UI TOAST NOTIFICATION HELPER
 */
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  if (type === 'error') {
    toast.style.background = '#dc2626';
  } else if (type === 'success') {
    toast.style.background = '#059669';
  }

  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3500);
}

// Auto-run navbar when script loads
document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
});
