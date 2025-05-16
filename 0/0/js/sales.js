// Variables para la venta actual
let currentSale = {
    items: [],
    date: new Date().toISOString().split('T')[0],
    subtotal: 0,
    total: 0,
    amountReceived: 0,
    change: 0
};

// Función para mostrar notificaciones
function showNotification(title, message, type = 'info') {
    const toastEl = document.getElementById('notificationToast');
    const toastTitle = document.getElementById('toastTitle');
    const toastMessage = document.getElementById('toastMessage');
    const toastTime = document.getElementById('toastTime');
    
    // Configurar colores según el tipo
    toastEl.classList.remove('bg-success', 'bg-danger', 'bg-warning', 'bg-info');
    switch(type) {
        case 'success':
            toastEl.classList.add('bg-success', 'text-white');
            break;
        case 'error':
            toastEl.classList.add('bg-danger', 'text-white');
            break;
        case 'warning':
            toastEl.classList.add('bg-warning');
            break;
        default:
            toastEl.classList.add('bg-info', 'text-white');
    }
    
    // Configurar contenido
    toastTitle.textContent = title;
    toastMessage.textContent = message;
    toastTime.textContent = new Date().toLocaleTimeString();
    
    // Mostrar el toast
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}

// Función para renderizar los items de la venta
function renderSaleItems() {
    const tableBody = document.getElementById('saleItemsTable');
    tableBody.innerHTML = '';
    
    currentSale.subtotal = 0;
    
    currentSale.items.forEach((item, index) => {
        const subtotal = item.price * item.quantity;
        currentSale.subtotal += subtotal;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.productId}</td>
            <td>${item.name}</td>
            <td>$${item.price.toFixed(2)}</td>
            <td>
                <div class="input-group input-group-sm">
                    <button class="btn btn-outline-secondary minus-btn" type="button" data-index="${index}">-</button>
                    <input type="number" class="form-control text-center quantity-input" value="${item.quantity}" min="1" data-index="${index}">
                    <button class="btn btn-outline-secondary plus-btn" type="button" data-index="${index}">+</button>
                </div>
            </td>
            <td>$${subtotal.toFixed(2)}</td>
            <td>
                <button class="btn btn-sm btn-outline-danger remove-btn" data-index="${index}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Calcular total (igual al subtotal)
    currentSale.total = currentSale.subtotal;
    
    // Actualizar resumen
    document.getElementById('subtotalAmount').textContent = `$${currentSale.subtotal.toFixed(2)}`;
    document.getElementById('totalAmount').textContent = `$${currentSale.total.toFixed(2)}`;
    
    // Calcular cambio
    calculateChange();
    
    // Agregar eventos a los botones
    document.querySelectorAll('.minus-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            if (currentSale.items[index].quantity > 1) {
                currentSale.items[index].quantity--;
                renderSaleItems();
            }
        });
    });
    
    document.querySelectorAll('.plus-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            currentSale.items[index].quantity++;
            renderSaleItems();
        });
    });
    
    document.querySelectorAll('.quantity-input').forEach(input => {
        input.addEventListener('change', function() {
            const index = parseInt(this.getAttribute('data-index'));
            const newQuantity = parseInt(this.value) || 1;
            currentSale.items[index].quantity = newQuantity;
            renderSaleItems();
        });
    });
    
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            currentSale.items.splice(index, 1);
            renderSaleItems();
            showNotification('Producto eliminado', 'El producto ha sido removido de la venta', 'info');
        });
    });
}

// Función para calcular el cambio
function calculateChange() {
    const amountReceived = parseFloat(document.getElementById('amountReceived').value) || 0;
    currentSale.amountReceived = amountReceived;
    currentSale.change = amountReceived - currentSale.total;
    
    document.getElementById('changeAmount').textContent = `$${Math.max(0, currentSale.change).toFixed(2)}`;
}

// Función para buscar productos
function searchProducts(query) {
    return database.products.filter(product => 
        product.name.toLowerCase().includes(query.toLowerCase())
    );
}

// Función para mostrar resultados de búsqueda en el modal
function showSearchResults(products) {
    const resultsBody = document.getElementById('productSearchResults');
    resultsBody.innerHTML = '';
    
    if (products.length === 0) {
        resultsBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted py-3">
                    No se encontraron productos con ese criterio de búsqueda
                </td>
            </tr>
        `;
        return;
    }
    
    products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>$${product.price.toFixed(2)}</td>
            <td>${product.stock}</td>
            <td>
                <button class="btn btn-sm btn-primary add-to-sale-btn" data-id="${product.id}">
                    <i class="bi bi-plus"></i> Agregar
                </button>
            </td>
        `;
        resultsBody.appendChild(row);
    });
    
    // Agregar eventos a los botones
    document.querySelectorAll('.add-to-sale-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = parseInt(this.getAttribute('data-id'));
            addProductToSale(productId);
            
            // Cerrar el modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('productSearchModal'));
            modal.hide();
        });
    });
}

// Función para agregar producto a la venta
function addProductToSale(productId) {
    const product = database.products.find(p => p.id === productId);
    
    if (product) {
        // Verificar si el producto ya está en la venta
        const existingItem = currentSale.items.find(item => item.productId === productId);
        
        if (existingItem) {
            existingItem.quantity++;
            showNotification('Producto actualizado', `Se aumentó la cantidad de ${product.name}`, 'info');
        } else {
            currentSale.items.push({
                productId: product.id,
                name: product.name,
                price: product.price,
                quantity: 1
            });
            showNotification('Producto agregado', `${product.name} se ha añadido a la venta`, 'success');
        }
        
        renderSaleItems();
    }
}

// Función para completar la venta
function completeSale() {
    if (currentSale.items.length === 0) {
        showNotification('Venta vacía', 'No hay productos en la venta', 'error');
        return;
    }
    
    if (currentSale.amountReceived < currentSale.total) {
        showNotification('Pago insuficiente', 'El monto recibido es menor al total', 'error');
        return;
    }
    
    // Verificar stock antes de completar la venta
    let outOfStockItems = [];
    
    currentSale.items.forEach(item => {
        const product = database.products.find(p => p.id === item.productId);
        if (product.stock < item.quantity) {
            outOfStockItems.push({
                name: product.name,
                available: product.stock,
                requested: item.quantity
            });
        }
    });
    
    if (outOfStockItems.length > 0) {
        let message = 'Los siguientes productos no tienen suficiente stock:\n';
        outOfStockItems.forEach(item => {
            message += `- ${item.name}: Disponibles ${item.available}, Solicitados ${item.requested}\n`;
        });
        showNotification('Stock insuficiente', message, 'error');
        return;
    }
    
    // Actualizar stock
    currentSale.items.forEach(item => {
        const product = database.products.find(p => p.id === item.productId);
        product.stock -= item.quantity;
    });
    
    // Registrar la venta
    const saleRecord = {
        id: database.sales.length > 0 ? Math.max(...database.sales.map(s => s.id)) + 1 : 1,
        date: currentSale.date,
        items: [...currentSale.items],
        subtotal: currentSale.subtotal,
        total: currentSale.total,
        paymentMethod: 'cash',
        amountReceived: currentSale.amountReceived,
        change: currentSale.change,
        userId: JSON.parse(sessionStorage.getItem('currentUser')).id
    };
    
    database.sales.push(saleRecord);
    saveDatabase();
    
    // Reiniciar la venta
    resetSale();
    
    showNotification('Venta completada', 'La venta se ha registrado correctamente', 'success');
}

// Función para reiniciar la venta
function resetSale() {
    currentSale = {
        items: [],
        date: new Date().toISOString().split('T')[0],
        subtotal: 0,
        total: 0,
        amountReceived: 0,
        change: 0
    };
    
    document.getElementById('saleDate').value = currentSale.date;
    document.getElementById('amountReceived').value = '0.00';
    
    renderSaleItems();
    
    showNotification('Venta reiniciada', 'Se ha limpiado la venta actual', 'info');
}

// Eventos
document.getElementById('searchProductBtn').addEventListener('click', function() {
    const query = document.getElementById('productSearch').value;
    if (query) {
        const results = searchProducts(query);
        showSearchResults(results);
        const searchModal = new bootstrap.Modal(document.getElementById('productSearchModal'));
        searchModal.show();
    } else {
        showNotification('Búsqueda vacía', 'Por favor ingrese un término de búsqueda', 'warning');
    }
});

document.getElementById('modalProductSearch').addEventListener('input', function() {
    const query = this.value;
    const results = searchProducts(query);
    showSearchResults(results);
});

document.getElementById('amountReceived').addEventListener('input', calculateChange);

document.getElementById('completeSaleBtn').addEventListener('click', completeSale);

document.getElementById('clearSaleBtn').addEventListener('click', resetSale);

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('saleDate').value = currentSale.date;
    renderSaleItems();
});