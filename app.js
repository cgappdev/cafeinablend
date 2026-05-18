import { initializeApp } from "firebase/app";
import { 
    getFirestore, collection, doc, onSnapshot, setDoc, updateDoc, 
    addDoc, deleteDoc, getDocs, enableIndexedDbPersistence, query, orderBy, limit 
} from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyCuvsLsuCwif7Cya2w2HF8eIeGb9IYxw1w",
  authDomain: "cafeinablend-dc369.firebaseapp.com",
  projectId: "cafeinablend-dc369",
  storageBucket: "cafeinablend-dc369.firebasestorage.app",
  messagingSenderId: "1064087558945",
  appId: "1:1064087558945:web:ea0a0442ec9c87eb573c60",
  measurementId: "G-1HBYDY5HT0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);

// Enable Offline Persistence
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.");
    } else if (err.code == 'unimplemented') {
        console.warn("The current browser doesn't support all of the features required to enable persistence");
    }
});

// --- Initial Data Structures ---
const DEFAULT_CATEGORIES = [
    { id: 'cafes', name: 'Cafés', icon: 'fa-mug-hot' },
    { id: 'postres', name: 'Postres', icon: 'fa-cookie-bite' },
    { id: 'jugos', name: 'Jugos', icon: 'fa-glass-water' },
    { id: 'bebidas', name: 'Bebidas', icon: 'fa-wine-bottle' }
];

const DEFAULT_PRODUCTS = [
    { id: 'p1', name: 'Espresso', category: 'cafes', price: 2.50, grams: 10, image: './images/espresso_shot.png' },
    { id: 'p2', name: 'Cappuccino', category: 'cafes', price: 3.50, grams: 15, image: './images/cappuccino_art.png' },
    { id: 'p3', name: 'Cheesecake', category: 'postres', price: 4.00, stock: 20, image: './images/slice_cheesecake.png' },
    { id: 'p4', name: 'Jugo de Naranja', category: 'jugos', price: 2.00, stock: 50, image: './images/orange_juice.png' }
];

// --- App State ---
let appState = {
    products: [],
    tables: [],
    activeTable: null,
    currentCategory: 'cafes',
    globalCoffeeStock: 1000,
    sales: [],
    currentUserRole: null, // 'admin' or 'user'
    tableFilter: 'all',    // current active table status filter ('all', 'free', 'occupied')
    posSearchQuery: '',    // active search query in POS
    adminSearchQuery: ''   // active search query in Admin
};

// --- Helper Functions for Connection & Warnings ---
function updateConnectionStatus(isOnline) {
    const statusEl = document.getElementById('connection-status');
    if (!statusEl) return;
    
    if (isOnline) {
        statusEl.className = 'connection-status online';
        statusEl.querySelector('.status-text').textContent = 'En línea';
        statusEl.title = 'Sincronizado con la nube';
    } else {
        statusEl.className = 'connection-status offline';
        statusEl.querySelector('.status-text').textContent = 'Modo Local';
        statusEl.title = 'Operando sin conexión. Datos guardados localmente.';
    }
}

function loadLocalCacheFallback() {
    try {
        const cachedProducts = localStorage.getItem('cafeinablend_products');
        const cachedTables = localStorage.getItem('cafeinablend_tables');
        const cachedCoffeeStock = localStorage.getItem('cafeinablend_coffee_stock');
        
        if (cachedProducts && appState.products.length === 0) {
            appState.products = JSON.parse(cachedProducts);
            renderProducts();
            renderAdminProducts();
        }
        if (cachedTables && appState.tables.length === 0) {
            appState.tables = JSON.parse(cachedTables);
            renderTables();
        }
        if (cachedCoffeeStock && appState.globalCoffeeStock === 1000) {
            appState.globalCoffeeStock = parseInt(cachedCoffeeStock) || 1000;
            const globalInput = document.getElementById('global-coffee-input');
            if (globalInput) globalInput.value = appState.globalCoffeeStock;
            checkCoffeeStockAlert();
        }
    } catch (err) {
        console.warn("Failed to load local cache fallback:", err);
    }
}

function checkCoffeeStockAlert() {
    const alertEl = document.getElementById('low-coffee-alert');
    const gramsSpan = document.getElementById('low-coffee-grams');
    if (!alertEl) return;
    
    if (appState.globalCoffeeStock < 200) {
        if (gramsSpan) gramsSpan.textContent = appState.globalCoffeeStock;
        alertEl.classList.remove('hidden');
    } else {
        alertEl.classList.add('hidden');
    }
}

// --- Initialize App ---
function initApp() {
    setupEventListeners();
    renderCategories();
    updateClock();
    setInterval(updateClock, 1000);
    
    // Check session
    const savedRole = sessionStorage.getItem('cafeinablend_role');
    if (savedRole) {
        appState.currentUserRole = savedRole;
        document.getElementById('login-overlay').classList.add('hidden');
        applyRoleRestrictions();
    }

    // Monitor Online/Offline Status
    updateConnectionStatus(navigator.onLine);
    window.addEventListener('online', () => {
        updateConnectionStatus(true);
        syncPendingSales();
    });
    window.addEventListener('offline', () => {
        updateConnectionStatus(false);
    });
    
    // Try initial local cache load as fallback
    loadLocalCacheFallback();

    // Start Syncing from Firebase
    syncData();
}

// --- Data Sync with Firebase ---
function syncData() {
    // 1. Sync Products
    onSnapshot(collection(db, "products"), (snapshot) => {
        if (snapshot.empty) {
            // First time setup: upload defaults if Firestore is empty
            DEFAULT_PRODUCTS.forEach(p => {
                setDoc(doc(db, "products", p.id), p);
            });
        } else {
            appState.products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            localStorage.setItem('cafeinablend_products', JSON.stringify(appState.products));
            renderProducts();
            renderAdminProducts();
        }
    }, (error) => {
        console.error("Error syncing products:", error);
        // Fallback to cache on error
        loadLocalCacheFallback();
    });

    // 2. Sync Tables
    onSnapshot(collection(db, "tables"), (snapshot) => {
        if (snapshot.empty) {
            // Initialize 20 tables
            for (let i = 1; i <= 20; i++) {
                const table = {
                    id: `t${i}`,
                    number: i,
                    status: 'free',
                    order: []
                };
                setDoc(doc(db, "tables", table.id), table);
            }
        } else {
            appState.tables = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            appState.tables.sort((a, b) => a.number - b.number);
            localStorage.setItem('cafeinablend_tables', JSON.stringify(appState.tables));
            renderTables();
            if (appState.activeTable) renderCart();
        }
    }, (error) => {
        console.error("Error syncing tables:", error);
    });

    // 3. Sync Global Stock
    onSnapshot(doc(db, "config", "inventory"), (doc) => {
        if (doc.exists()) {
            appState.globalCoffeeStock = doc.data().globalCoffeeStock || 0;
            localStorage.setItem('cafeinablend_coffee_stock', appState.globalCoffeeStock);
            const globalInput = document.getElementById('global-coffee-input');
            if (globalInput) globalInput.value = appState.globalCoffeeStock;
            checkCoffeeStockAlert();
        } else {
            setDoc(doc.ref, { globalCoffeeStock: 1000 });
        }
    });

    // 4. Sync Sales (limited to last 100)
    const qSales = query(collection(db, "sales"), orderBy("date", "desc"), limit(100));
    onSnapshot(qSales, (snapshot) => {
        appState.sales = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        localStorage.setItem('cafeinablend_sales', JSON.stringify(appState.sales));
        // Update sales report if open
        if (!document.getElementById('sales-report-modal').classList.contains('hidden')) {
            showSalesReportModal();
        }
    });
}

// --- Persistence Wrappers ---
async function saveProductToFirebase(product) {
    try {
        await setDoc(doc(db, "products", product.id), product);
    } catch (e) {
        console.error("Error saving product:", e);
        alert("Error al guardar producto en la nube.");
    }
}

async function deleteProductFromFirebase(id) {
    try {
        await deleteDoc(doc(db, "products", id));
    } catch (e) {
        console.error("Error deleting product:", e);
    }
}

async function updateTableInFirebase(table) {
    try {
        await setDoc(doc(db, "tables", table.id), table);
    } catch (e) {
        console.error("Error updating table:", e);
    }
}

async function saveGlobalStockToFirebase(value) {
    try {
        await setDoc(doc(db, "config", "inventory"), { globalCoffeeStock: value });
    } catch (e) {
        console.error("Error saving global stock:", e);
    }
}

async function addSaleToFirebase(sale) {
    try {
        await addDoc(collection(db, "sales"), sale);
    } catch (e) {
        console.error("Error recording sale:", e);
        throw e;
    }
}

function enqueuePendingSale(sale) {
    try {
        const pending = JSON.parse(localStorage.getItem('cafeinablend_pending_sales') || '[]');
        pending.push(sale);
        localStorage.setItem('cafeinablend_pending_sales', JSON.stringify(pending));
    } catch (err) {
        console.error("Failed to enqueue pending sale:", err);
    }
}

async function syncPendingSales() {
    try {
        const pending = JSON.parse(localStorage.getItem('cafeinablend_pending_sales') || '[]');
        if (pending.length === 0) return;
        
        console.log(`Syncing ${pending.length} pending sales...`);
        
        for (const sale of pending) {
            await addSaleToFirebase(sale);
        }
        
        localStorage.removeItem('cafeinablend_pending_sales');
        console.log("All pending sales successfully synced to cloud!");
    } catch (err) {
        console.warn("Failed to sync pending sales:", err);
    }
}

// --- UI Logic ---
function showCustomConfirm(message, onConfirm) {
    const modal = document.getElementById('confirm-modal');
    if (!modal) {
        if (confirm(message)) onConfirm();
        return;
    }
    document.getElementById('confirm-message').textContent = message;
    
    const okBtn = document.getElementById('confirm-ok-btn');
    const cancelBtn = document.getElementById('confirm-cancel-btn');
    
    const newOkBtn = okBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(newOkBtn, okBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    
    newOkBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        if (onConfirm) onConfirm();
    });
    
    newCancelBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });
    
    modal.classList.remove('hidden');
}

function getFallbackImage(category) {
    const fallbacks = {
        'cafes': '<i class="fa-solid fa-mug-hot"></i>',
        'postres': '<i class="fa-solid fa-cookie-bite"></i>',
        'jugos': '<i class="fa-solid fa-glass-water"></i>',
        'bebidas': '<i class="fa-solid fa-wine-bottle"></i>'
    };
    return fallbacks[category] || fallbacks['cafes'];
}

function switchView(viewId) {
    if (viewId === 'admin-view' && appState.currentUserRole !== 'admin') {
        alert('Acceso restringido: Solo administradores.');
        return;
    }

    // Reset search queries and inputs on screen change
    appState.posSearchQuery = '';
    appState.adminSearchQuery = '';
    const posSearch = document.getElementById('pos-product-search');
    const adminSearch = document.getElementById('admin-product-search');
    if (posSearch) posSearch.value = '';
    if (adminSearch) adminSearch.value = '';

    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    
    document.querySelectorAll('.nav-links li').forEach(li => {
        if (li.dataset.target === viewId || (viewId === 'order-view' && li.dataset.target === 'pos-view')) {
            li.classList.add('active');
        } else {
            li.classList.remove('active');
        }
    });

    if(viewId === 'admin-view') {
        const globalInput = document.getElementById('global-coffee-input');
        if (globalInput) globalInput.value = appState.globalCoffeeStock;
        renderAdminProducts();
    } else if (viewId === 'pos-view') {
        renderTables();
    }
}

function applyRoleRestrictions() {
    const adminLink = document.querySelector('.nav-links li[data-target="admin-view"]');
    const exitBtnSpan = document.querySelector('#exit-app-btn span');
    const exitBtnIcon = document.querySelector('#exit-app-btn i');

    if (appState.currentUserRole === 'user') {
        if (adminLink) adminLink.style.display = 'none';
    } else {
        if (adminLink) adminLink.style.display = 'flex';
    }

    if (exitBtnSpan) exitBtnSpan.textContent = 'Cerrar Sesión';
    if (exitBtnIcon) exitBtnIcon.className = 'fa-solid fa-right-from-bracket';
}

function handleLogin(e) {
    e.preventDefault();
    const pin = document.getElementById('login-pin').value;
    const errorMsg = document.getElementById('login-error');
    
    let role = null;
    if (pin === '1105') role = 'admin';
    else if (pin === '1106') role = 'user';

    if (role) {
        appState.currentUserRole = role;
        sessionStorage.setItem('cafeinablend_role', role);
        document.getElementById('login-overlay').classList.add('hidden');
        document.getElementById('login-pin').value = '';
        errorMsg.style.display = 'none';
        applyRoleRestrictions();
        switchView('pos-view');
    } else {
        errorMsg.style.display = 'block';
        document.getElementById('login-pin').value = '';
        document.getElementById('login-pin').focus();
    }
}

function handleLogout() {
    showCustomConfirm('¿Estás seguro de cerrar la sesión?', () => {
        sessionStorage.removeItem('cafeinablend_role');
        appState.currentUserRole = null;
        document.getElementById('login-overlay').classList.remove('hidden');
        document.getElementById('login-pin').focus();
        switchView('pos-view');
    });
}

// --- Rendering ---
function renderTables() {
    const container = document.getElementById('tables-container');
    if (!container) return;
    container.innerHTML = '';
    
    let displayTables = appState.tables;
    if (appState.tableFilter !== 'all') {
        displayTables = displayTables.filter(t => t.status === appState.tableFilter);
    }
    
    if (displayTables.length === 0) {
        container.innerHTML = `<p style="color:var(--text-secondary); grid-column: 1/-1; text-align: center; padding: 2rem;">No hay mesas ${appState.tableFilter === 'free' ? 'libres' : 'ocupadas'} en este momento.</p>`;
        return;
    }
    
    displayTables.forEach(table => {
        const card = document.createElement('div');
        card.className = `table-card glass-effect ${table.status}`;
        card.innerHTML = `
            <h3>Mesa ${table.number}</h3>
            <span class="status">${table.status === 'free' ? 'Libre' : 'Ocupada'}</span>
        `;
        card.addEventListener('click', () => openTableOrder(table.id));
        container.appendChild(card);
    });
}

function renderCategories() {
    const container = document.getElementById('pos-categories');
    if (!container) return;
    container.innerHTML = '';
    
    DEFAULT_CATEGORIES.forEach(cat => {
        const tab = document.createElement('div');
        tab.className = `cat-tab ${appState.currentCategory === cat.id ? 'active' : ''}`;
        tab.innerHTML = `<i class="fa-solid ${cat.icon}"></i> ${cat.name}`;
        tab.addEventListener('click', () => {
            appState.currentCategory = cat.id;
            document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderProducts();
        });
        container.appendChild(tab);
    });
}

function renderProducts() {
    const container = document.getElementById('pos-products');
    if (!container) return;
    container.innerHTML = '';
    
    let filteredProducts = appState.products.filter(p => p.category === appState.currentCategory);
    
    if (appState.posSearchQuery) {
        const query = appState.posSearchQuery.toLowerCase().trim();
        filteredProducts = filteredProducts.filter(p => p.name.toLowerCase().includes(query));
    }
    
    if (filteredProducts.length === 0) {
        container.innerHTML = '<p style="color:var(--text-secondary); grid-column: 1/-1;">No se encontraron productos.</p>';
        return;
    }

    filteredProducts.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        let imgHtml = product.image ? `<div class="product-img" style="background-image: url('${product.image}')"></div>` 
                                    : `<div class="product-img">${getFallbackImage(product.category)}</div>`;
                                    
        let stockDisplay = '';
        let alertBadge = '';
        if (product.category === 'cafes') {
            stockDisplay = `<span style="font-size: 0.8rem; color: var(--text-secondary); margin-left: 0.5rem;">(${product.grams || 0}g c/u)</span>`;
        } else {
            if (product.stock === undefined || product.stock <= 0) {
                alertBadge = `<span class="stock-badge out">Agotado</span>`;
                stockDisplay = `<span style="font-size: 0.8rem; color: #ff4757; font-weight: bold; margin-left: 0.5rem;">Stock: 0</span>`;
            } else if (product.stock <= 5) {
                alertBadge = `<span class="stock-badge low">¡Poco stock!</span>`;
                stockDisplay = `<span style="font-size: 0.8rem; color: var(--primary-color); font-weight: bold; margin-left: 0.5rem;">Stock: ${product.stock}</span>`;
            } else {
                stockDisplay = `<span style="font-size: 0.8rem; color: var(--text-secondary); margin-left: 0.5rem;">Stock: ${product.stock}</span>`;
            }
        }

        card.innerHTML = `
            ${imgHtml}
            <div class="product-info">
                <div class="product-name" style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                    <span>${product.name}</span>
                    ${alertBadge}
                </div>
                <div class="product-price">$${Number(product.price).toFixed(2)} ${stockDisplay}</div>
            </div>
        `;
        
        card.addEventListener('click', () => addToCart(product));
        container.appendChild(card);
    });
}

function renderCart() {
    const container = document.getElementById('cart-items');
    if (!container) return;
    container.innerHTML = '';
    
    const table = appState.tables.find(t => t.id === appState.activeTable);
    if (!table || !table.order || table.order.length === 0) {
        container.innerHTML = '<p style="color:var(--text-secondary); text-align:center; margin-top:2rem;">La orden está vacía</p>';
        document.getElementById('cart-subtotal').textContent = '$0.00';
        document.getElementById('cart-total').textContent = '$0.00';
        return;
    }

    let total = 0;

    table.order.forEach((item, index) => {
        const itemTotal = item.product.price * item.quantity;
        total += itemTotal;
        
        let imgHtml = item.product.image ? `<div style="width: 40px; height: 40px; border-radius: 8px; background-image: url('${item.product.image}'); background-size: cover; background-position: center; margin-right: 12px; flex-shrink: 0;"></div>` 
                                    : `<div style="width: 40px; height: 40px; border-radius: 8px; background-color: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0; font-size: 1.2rem; color: rgba(255,255,255,0.5);">${getFallbackImage(item.product.category)}</div>`;

        const hasNote = item.note && item.note.trim() !== '';
        const noteDisplayHtml = hasNote 
            ? `<div class="item-note-display" style="padding-left: 52px;"><i class="fa-regular fa-comment"></i> <span>"${item.note}"</span></div>`
            : '';

        const div = document.createElement('div');
        div.className = 'cart-item-container';
        div.style.marginBottom = '1rem';
        div.style.display = 'block';
        div.innerHTML = `
            <div class="cart-item" style="border-bottom: none; padding-bottom: 0.25rem;">
                ${imgHtml}
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.product.name}</div>
                    <div class="cart-item-price">$${Number(item.product.price).toFixed(2)} c/u</div>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-right: 10px;">
                    <button class="cart-item-note-btn ${hasNote ? 'has-note' : ''}" data-index="${index}" title="Nota especial" style="background:none; border:none; cursor:pointer;">
                        <i class="fa-solid fa-note-sticky"></i>
                    </button>
                    <div class="cart-item-qty">
                        <button class="qty-btn" data-action="decrease" data-index="${index}"><i class="fa-solid fa-minus"></i></button>
                        <span style="min-width: 15px; text-align: center;">${item.quantity}</span>
                        <button class="qty-btn" data-action="increase" data-index="${index}"><i class="fa-solid fa-plus"></i></button>
                    </div>
                </div>
                <div style="font-weight:600; width: 60px; text-align:right;">
                    $${itemTotal.toFixed(2)}
                </div>
            </div>
            ${noteDisplayHtml}
            <div class="note-input-wrapper hidden" id="note-wrapper-${index}" style="padding-left: 52px; margin-bottom: 0.5rem;">
                <input type="text" class="item-note-input" placeholder="Ej: Sin azúcar, leche de coco..." value="${item.note || ''}" data-index="${index}">
            </div>
        `;
        
        // Add event listeners to qty buttons
        div.querySelectorAll('.qty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action === 'increase' ? 1 : -1;
                updateCartQty(index, action);
            });
        });

        // Note Toggle button click
        div.querySelector('.cart-item-note-btn').addEventListener('click', () => {
            const wrapper = div.querySelector(`#note-wrapper-${index}`);
            if (wrapper) {
                wrapper.classList.toggle('hidden');
                if (!wrapper.classList.contains('hidden')) {
                    wrapper.querySelector('input').focus();
                }
            }
        });

        // Note Input Blur or Enter to Save
        const noteInput = div.querySelector('.item-note-input');
        if (noteInput) {
            const saveNote = () => {
                const val = noteInput.value.trim();
                updateCartItemNote(index, val);
            };
            noteInput.addEventListener('blur', saveNote);
            noteInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    saveNote();
                }
            });
        }

        container.appendChild(div);
    });

    document.getElementById('cart-subtotal').textContent = `$${total.toFixed(2)}`;
    document.getElementById('cart-total').textContent = `$${total.toFixed(2)}`;
}

function updateCartItemNote(index, noteText) {
    const table = appState.tables.find(t => t.id === appState.activeTable);
    if (!table) return;
    
    if (!table.order[index]) return;
    table.order[index].note = noteText;
    updateTableInFirebase(table);
}

function renderAdminProducts() {
    const filterEl = document.getElementById('admin-category-filter');
    const filter = filterEl ? filterEl.value : 'all';
    const container = document.getElementById('admin-products-list');
    if (!container) return;
    container.innerHTML = '';
    
    let displayProducts = appState.products;
    if (filter !== 'all') {
        displayProducts = displayProducts.filter(p => p.category === filter);
    }
    
    if (appState.adminSearchQuery) {
        const query = appState.adminSearchQuery.toLowerCase().trim();
        displayProducts = displayProducts.filter(p => p.name.toLowerCase().includes(query));
    }
    
    displayProducts.forEach(product => {
        const catName = DEFAULT_CATEGORIES.find(c => c.id === product.category)?.name || product.category;
        const tr = document.createElement('tr');
        
        let imgHtml = product.image ? `<div class="img-thumb" style="background-image: url('${product.image}')"></div>` 
                                    : `<div class="img-thumb">${getFallbackImage(product.category)}</div>`;
                                    
        let stockDisplay = '';
        if (product.category === 'cafes') {
            stockDisplay = product.grams !== undefined ? product.grams + 'g/u' : '0g/u';
        } else {
            if (product.stock === undefined || product.stock <= 0) {
                stockDisplay = `<span style="color:#e63946; font-weight:bold;"><i class="fa-solid fa-circle-xmark"></i> Agotado (0)</span>`;
            } else if (product.stock <= 5) {
                stockDisplay = `<span style="color:var(--primary-color); font-weight:bold;"><i class="fa-solid fa-triangle-exclamation"></i> Bajo (${product.stock})</span>`;
            } else {
                stockDisplay = product.stock;
            }
        }
                                    
        tr.innerHTML = `
            <td>${imgHtml}</td>
            <td style="font-weight:600;">${product.name}</td>
            <td><span style="background:rgba(255,255,255,0.1); padding:0.25rem 0.5rem; border-radius:12px; font-size:0.8rem;">${catName}</span></td>
            <td>$${Number(product.price).toFixed(2)}</td>
            <td>${stockDisplay}</td>
            <td>
                <div class="action-btns">
                    <button class="action-btn edit-btn" data-id="${product.id}"><i class="fa-solid fa-pen"></i></button>
                    <button class="action-btn delete-btn" data-id="${product.id}"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        `;
        
        tr.querySelector('.edit-btn').addEventListener('click', () => editProduct(product.id));
        tr.querySelector('.delete-btn').addEventListener('click', () => deleteProduct(product.id));
        
        container.appendChild(tr);
    });
}

// --- Cart Actions ---
function openTableOrder(tableId) {
    appState.activeTable = tableId;
    const table = appState.tables.find(t => t.id === tableId);
    if (!table) return;
    
    document.getElementById('active-table-name').textContent = `Mesa ${table.number}`;
    updateTableBadge(table);
    switchView('order-view');
    renderCart();
}

function updateTableBadge(table) {
    const badge = document.querySelector('.table-status-badge');
    if (!badge) return;
    if (table.status === 'free') {
        badge.textContent = 'Libre';
        badge.className = 'table-status-badge badge-free';
    } else {
        badge.textContent = 'Ocupada';
        badge.className = 'table-status-badge badge-occupied';
    }
}

function addToCart(product) {
    if (!appState.activeTable) return;
    
    const table = appState.tables.find(t => t.id === appState.activeTable);
    if (!table.order) table.order = [];
    
    const existingItem = table.order.find(item => item.product.id === product.id);
    const currentProduct = appState.products.find(p => p.id === product.id) || product;
    
    // Validate stock
    if (currentProduct.category === 'cafes') {
        if (appState.globalCoffeeStock < (currentProduct.grams || 0)) {
            alert('Stock global de café insuficiente.');
            return;
        }
    } else {
        const currentQty = existingItem ? existingItem.quantity : 0;
        if (currentProduct.stock !== undefined && currentProduct.stock <= currentQty) {
            alert('Stock insuficiente para añadir más unidades.');
            return;
        }
    }
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        table.order.push({ product: currentProduct, quantity: 1 });
    }
    
    if (table.status === 'free') table.status = 'occupied';
    
    updateTableInFirebase(table);
}

function updateCartQty(index, change) {
    const table = appState.tables.find(t => t.id === appState.activeTable);
    if (!table) return;
    
    const item = table.order[index];
    
    if (change > 0) {
        const currentProduct = appState.products.find(p => p.id === item.product.id) || item.product;
        if (currentProduct.category === 'cafes') {
            if (appState.globalCoffeeStock < (currentProduct.grams || 0)) {
                alert('Stock global de café insuficiente.');
                return;
            }
        } else {
            if (currentProduct.stock !== undefined && currentProduct.stock <= item.quantity) {
                alert('Stock insuficiente.');
                return;
            }
        }
    }

    item.quantity += change;
    
    if (item.quantity <= 0) {
        table.order.splice(index, 1);
        if (table.order.length === 0) {
            table.status = 'free';
        }
    }
    
    updateTableInFirebase(table);
}

function clearTable() {
    if (!appState.activeTable) return;
    showCustomConfirm('¿Estás seguro de liberar esta mesa? Se borrará el pedido actual.', () => {
        const table = appState.tables.find(t => t.id === appState.activeTable);
        table.order = [];
        table.status = 'free';
        updateTableInFirebase(table);
        switchView('pos-view');
    });
}

async function payTable() {
    if (!appState.activeTable) return;
    const table = appState.tables.find(t => t.id === appState.activeTable);
    if (!table.order || table.order.length === 0) {
        alert('La mesa no tiene pedidos.');
        return;
    }
    
    showCustomConfirm(`¿Cobrar la Mesa ${table.number}?`, async () => {
        // Prepare Stock Updates
        let newCoffeeStock = appState.globalCoffeeStock;
        
        table.order.forEach(item => {
            const product = appState.products.find(p => p.id === item.product.id);
            if (product) {
                if (product.category === 'cafes' && product.grams !== undefined) {
                    newCoffeeStock = Math.max(0, newCoffeeStock - (item.quantity * product.grams));
                } else if (product.stock !== undefined) {
                    product.stock = Math.max(0, product.stock - item.quantity);
                    saveProductToFirebase(product);
                }
            }
        });
        
        if (newCoffeeStock !== appState.globalCoffeeStock) {
            saveGlobalStockToFirebase(newCoffeeStock);
        }
        
        // Record Sale (with notes appended to item names for backward compatibility)
        const totalAmount = table.order.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        const saleItems = table.order.map(item => ({
            name: item.product.name + (item.note ? ` (${item.note})` : ''),
            quantity: item.quantity,
            price: item.product.price
        }));
        
        const newSale = {
            date: new Date().toISOString(),
            total: totalAmount,
            items: saleItems,
            tableNumber: table.number
        };
        
        try {
            if (navigator.onLine) {
                await addSaleToFirebase(newSale);
            } else {
                enqueuePendingSale(newSale);
            }
            
            // Clear Table
            table.order = [];
            table.status = 'free';
            updateTableInFirebase(table);
            
            if (navigator.onLine) {
                alert('¡Cobro registrado con éxito en la nube!');
            } else {
                alert('¡Cobro registrado en Modo Local! Se sincronizará automáticamente cuando vuelva la conexión.');
            }
            switchView('pos-view');
        } catch (error) {
            console.warn("Failed to upload sale to Firebase, enqueuing locally:", error);
            enqueuePendingSale(newSale);
            
            // Clear Table
            table.order = [];
            table.status = 'free';
            updateTableInFirebase(table);
            
            alert('¡Cobro guardado localmente debido a una inestabilidad de red! Se sincronizará automáticamente al reconectar.');
            switchView('pos-view');
        }
    });
}

// --- Admin Actions ---
function toggleModal(show = true) {
    const modal = document.getElementById('product-modal');
    if (show) {
        modal.classList.remove('hidden');
    } else {
        modal.classList.add('hidden');
        document.getElementById('product-form').reset();
        document.getElementById('product-id').value = '';
        document.getElementById('product-image').value = '';
        document.getElementById('product-stock').value = '';
        document.getElementById('product-grams').value = '';
        toggleStockFields('cafes');
        const currentImageName = document.getElementById('current-image-name');
        if(currentImageName) currentImageName.textContent = '';
    }
}

function editProduct(id) {
    const product = appState.products.find(p => p.id === id);
    if (!product) return;
    
    document.getElementById('modal-title').textContent = 'Editar Producto';
    document.getElementById('product-id').value = product.id;
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-category').value = product.category;
    document.getElementById('product-price').value = product.price;
    
    if (product.category === 'cafes') {
        document.getElementById('product-grams').value = product.grams !== undefined ? product.grams : 0;
        document.getElementById('product-stock').value = '';
    } else {
        document.getElementById('product-stock').value = product.stock !== undefined ? product.stock : 0;
        document.getElementById('product-grams').value = '';
    }
    toggleStockFields(product.category);
    
    document.getElementById('product-image').value = product.image || '';
    
    const currentImageName = document.getElementById('current-image-name');
    if (product.image && currentImageName) {
        const fileName = product.image.split('/').pop();
        currentImageName.textContent = `Actual: ${fileName}`;
    } else if (currentImageName) {
        currentImageName.textContent = '';
    }
    
    toggleModal(true);
}

function deleteProduct(id) {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
        deleteProductFromFirebase(id);
    }
}

function saveProduct(e) {
    e.preventDefault();
    
    const id = document.getElementById('product-id').value;
    const name = document.getElementById('product-name').value;
    const category = document.getElementById('product-category').value;
    const price = parseFloat(document.getElementById('product-price').value);
    const stock = parseInt(document.getElementById('product-stock').value) || 0;
    const grams = parseInt(document.getElementById('product-grams').value) || 0;
    const image = document.getElementById('product-image').value;
    
    let productData = { 
        id: id || 'p' + Date.now(), 
        name, category, price, image 
    };

    if (category === 'cafes') {
        productData.grams = grams;
    } else {
        productData.stock = stock;
    }

    saveProductToFirebase(productData);
    toggleModal(false);
}

// --- Utilities ---
function toggleStockFields(category) {
    const stockGroup = document.getElementById('stock-group');
    const gramsGroup = document.getElementById('grams-group');
    if (!stockGroup || !gramsGroup) return;

    if (category === 'cafes') {
        stockGroup.classList.add('hidden');
        gramsGroup.classList.remove('hidden');
        document.getElementById('product-stock').required = false;
        document.getElementById('product-grams').required = true;
    } else {
        stockGroup.classList.remove('hidden');
        gramsGroup.classList.add('hidden');
        document.getElementById('product-stock').required = true;
        document.getElementById('product-grams').required = false;
    }
}

function updateClock() {
    const now = new Date();
    const clockEl = document.getElementById('current-time');
    if (clockEl) clockEl.textContent = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

function showSalesReportModal() {
    const modal = document.getElementById('sales-report-modal');
    const tbody = document.getElementById('sales-table-body');
    const dateSpan = document.getElementById('sales-report-date');
    const todaySpan = document.getElementById('sales-today');
    const monthSpan = document.getElementById('sales-month');

    tbody.innerHTML = '';
    let totalToday = 0;
    let totalMonth = 0;
    
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const monthStr = todayStr.substring(0, 7); 
    
    const sortedSales = [...appState.sales].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedSales.forEach(sale => {
        const saleDate = new Date(sale.date);
        const saleDateStr = sale.date.split('T')[0];
        const saleMonthStr = saleDateStr.substring(0, 7);
        
        if (saleDateStr === todayStr) totalToday += sale.total;
        if (saleMonthStr === monthStr) totalMonth += sale.total;
        
        const itemsList = sale.items.map(item => `${item.quantity}x ${item.name}`).join(', ');
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${saleDate.toLocaleDateString('es-ES')} ${saleDate.toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}</td>
            <td>Mesa ${sale.tableNumber || '-'}</td>
            <td>${itemsList}</td>
            <td>$${sale.total.toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
    });

    todaySpan.textContent = `$${totalToday.toFixed(2)}`;
    monthSpan.textContent = `$${totalMonth.toFixed(2)}`;
    dateSpan.textContent = now.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    modal.classList.remove('hidden');
}

// --- Event Listeners ---
function setupEventListeners() {
    document.querySelectorAll('.nav-links li').forEach(li => {
        li.addEventListener('click', () => {
            if (li.dataset.target) switchView(li.dataset.target);
        });
    });

    document.getElementById('exit-app-btn').addEventListener('click', handleLogout);
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('back-to-tables').addEventListener('click', () => switchView('pos-view'));
    document.getElementById('clear-table-btn').addEventListener('click', clearTable);
    document.getElementById('pay-btn').addEventListener('click', payTable);

    // Tables Filter Buttons
    document.querySelectorAll('.table-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.table-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            appState.tableFilter = btn.dataset.filter;
            renderTables();
        });
    });

    // POS Product Search Bar
    const posSearchInput = document.getElementById('pos-product-search');
    if (posSearchInput) {
        posSearchInput.addEventListener('input', (e) => {
            appState.posSearchQuery = e.target.value;
            renderProducts();
        });
    }

    // Admin Product Search Bar
    const adminSearchInput = document.getElementById('admin-product-search');
    if (adminSearchInput) {
        adminSearchInput.addEventListener('input', (e) => {
            appState.adminSearchQuery = e.target.value;
            renderAdminProducts();
        });
    }

    document.getElementById('admin-category-filter').addEventListener('change', renderAdminProducts);
    
    document.getElementById('view-report-btn').addEventListener('click', () => {
        // This would show inventory report, reuse sales logic or specific one
        const modal = document.getElementById('report-modal');
        const tbody = document.getElementById('report-table-body');
        tbody.innerHTML = '';
        appState.products.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${p.name}</td><td>${p.category}</td><td>$${p.price}</td><td>${p.grams || p.stock}</td>`;
            tbody.appendChild(tr);
        });
        document.getElementById('report-global-stock').textContent = appState.globalCoffeeStock;
        modal.classList.remove('hidden');
    });

    document.getElementById('close-report-btn').addEventListener('click', () => document.getElementById('report-modal').classList.add('hidden'));
    document.getElementById('view-sales-btn').addEventListener('click', showSalesReportModal);
    document.getElementById('close-sales-btn').addEventListener('click', () => document.getElementById('sales-report-modal').classList.add('hidden'));

    document.getElementById('save-global-stock-btn').addEventListener('click', () => {
        const val = parseInt(document.getElementById('global-coffee-input').value) || 0;
        saveGlobalStockToFirebase(val);
        alert('Stock global de café actualizado.');
    });

    document.getElementById('add-product-btn').addEventListener('click', () => {
        document.getElementById('modal-title').textContent = 'Añadir Producto';
        toggleModal(true);
    });
    
    document.getElementById('product-category').addEventListener('change', (e) => toggleStockFields(e.target.value));
    
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            toggleModal(false);
            document.getElementById('report-modal').classList.add('hidden');
            document.getElementById('sales-report-modal').classList.add('hidden');
        });
    });

    document.getElementById('product-form').addEventListener('submit', saveProduct);
    
    document.getElementById('product-image-file').addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const fileName = this.files[0].name;
            document.getElementById('product-image').value = `./images/${fileName}`;
            const currentImageName = document.getElementById('current-image-name');
            if(currentImageName) currentImageName.textContent = `Seleccionada: ${fileName}`;
        }
    });

    // Handle Exports/Imports (Keep local for now as it's a backup of current cloud state)
    document.getElementById('export-json-btn').addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ products: appState.products, tables: appState.tables, config: { globalCoffeeStock: appState.globalCoffeeStock } }));
        const link = document.createElement("a");
        link.setAttribute("href", dataStr);
        link.download = `cafeinablend_cloud_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    });

    // Handle CSV Export
    document.getElementById('report-csv-btn').addEventListener('click', () => {
        const headers = ['Producto', 'Categoría', 'Precio', 'Stock/Gramos'];
        const rows = appState.products.map(p => [
            p.name,
            p.category,
            p.price,
            p.category === 'cafes' ? p.grams : p.stock
        ]);
        
        let csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `inventario_cafeinablend_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // Handle JSON Import
    document.getElementById('import-system-file').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                if (confirm('¿Estás seguro de importar estos datos? Se sobrescribirán los productos actuales en la nube.')) {
                    if (importedData.products) {
                        importedData.products.forEach(p => saveProductToFirebase(p));
                        alert('Importación completada con éxito.');
                    }
                }
            } catch (err) {
                alert('Error al procesar el archivo JSON.');
            }
        };
        reader.readAsText(file);
    });

    // Handle Printing
    document.getElementById('print-report-btn').addEventListener('click', () => window.print());
    document.getElementById('print-sales-btn').addEventListener('click', () => window.print());
}

// Start app
document.addEventListener('DOMContentLoaded', initApp);

// Expose some for global access if needed
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.updateCartQty = updateCartQty;
