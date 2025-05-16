// Funciones de notificación mejoradas
function showNotification(title, message, type = 'success') {
    const toastElement = document.getElementById('notificationToast');
    const toastTitle = document.getElementById('toastTitle');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');
    
    // Configurar según el tipo
    let iconClass, headerClass;
    switch(type) {
        case 'success':
            iconClass = 'bi-check-circle-fill';
            headerClass = 'bg-success text-white';
            break;
        case 'error':
            iconClass = 'bi-exclamation-triangle-fill';
            headerClass = 'bg-danger text-white';
            break;
        case 'warning':
            iconClass = 'bi-exclamation-circle-fill';
            headerClass = 'bg-warning text-dark';
            break;
        default:
            iconClass = 'bi-info-circle-fill';
            headerClass = 'bg-primary text-white';
    }
    
    // Aplicar estilos
    toastTitle.textContent = title;
    toastMessage.textContent = message;
    toastIcon.className = `bi ${iconClass}`;
    toastElement.querySelector('.toast-header').className = `toast-header ${headerClass}`;
    
    // Mostrar notificación
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
}

// Función para mostrar éxito
function showSuccess(message) {
    showNotification('Éxito', message, 'success');
}

// Función para mostrar error
function showError(message) {
    showNotification('Error', message, 'error');
}

// Función para mostrar advertencia
function showWarning(message) {
    showNotification('Advertencia', message, 'warning');
}

// Función para renderizar la tabla de inventario
function renderInventoryTable(products = database.products) {
    const tableBody = document.getElementById('inventoryTable');
    tableBody.innerHTML = '';
    
    products.forEach(product => {
        const stockStatus = product.stock < product.minStock ? 'danger' : 'success';
        const statusText = product.stock < product.minStock ? 'Bajo Stock' : 'Disponible';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>${product.category || 'Sin categoría'}</td>
            <td>$${product.price.toFixed(2)}</td>
            <td>${product.stock}</td>
            <td>${product.minStock}</td>
            <td><span class="badge bg-${stockStatus}">${statusText}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${product.id}">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-success adjust-btn" data-id="${product.id}">
                    <i class="bi bi-plus-slash-minus"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${product.id}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Agregar eventos a los botones
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = parseInt(this.getAttribute('data-id'));
            openEditModal(productId);
        });
    });
    
    document.querySelectorAll('.adjust-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = parseInt(this.getAttribute('data-id'));
            openAdjustModal(productId);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = parseInt(this.getAttribute('data-id'));
            const product = database.products.find(p => p.id === productId);
            if (product) {
                showDeleteConfirmation(productId, product.name);
            }
        });
    });
}

// Función para mostrar confirmación de eliminación
function showDeleteConfirmation(productId, productName) {
    const confirmModal = new bootstrap.Modal(document.getElementById('confirmDeleteModal'));
    
    // Configurar el evento del botón de confirmación
    document.getElementById('confirmDeleteBtn').onclick = function() {
        deleteProduct(productId);
        confirmModal.hide();
        showSuccess(`Producto "${productName}" eliminado correctamente`);
    };
    
    confirmModal.show();
}

// Función para abrir modal de edición
function openEditModal(productId) {
    const product = database.products.find(p => p.id === productId);
    if (product) {
        document.getElementById('editProductId').value = product.id;
        document.getElementById('editProductName').value = product.name;
        document.getElementById('editProductCategory').value = product.category || '';
        document.getElementById('editProductPrice').value = product.price;
        document.getElementById('editProductStock').value = product.stock;
        document.getElementById('editProductMinStock').value = product.minStock;
    
        const editModal = new bootstrap.Modal(document.getElementById('editProductModal'));
        editModal.show();
    }
}

// Función para abrir modal de ajuste de stock
function openAdjustModal(productId) {
    const product = database.products.find(p => p.id === productId);
    if (product) {
        document.getElementById('adjustProductId').value = product.id;
        document.getElementById('adjustProductName').value = product.name;
        document.getElementById('adjustCurrentStock').value = product.stock;
        document.getElementById('adjustQuantity').value = '';
        document.getElementById('adjustReason').value = '';
        
        const adjustModal = new bootstrap.Modal(document.getElementById('adjustStockModal'));
        adjustModal.show();
    }
}

// Función para eliminar producto
function deleteProduct(productId) {
    database.products = database.products.filter(p => p.id !== productId);
    saveDatabase();
    renderInventoryTable();
}

// Guardar nuevo producto
document.getElementById('saveProductBtn').addEventListener('click', function() {
    const newProduct = {
        id: database.products.length > 0 ? Math.max(...database.products.map(p => p.id)) + 1 : 1,
        name: document.getElementById('productName').value,
        category: document.getElementById('productCategory').value,
        price: parseFloat(document.getElementById('productPrice').value),
        stock: parseInt(document.getElementById('productStock').value),
        minStock: parseInt(document.getElementById('productMinStock').value)
    };
    
    // Validación mejorada
    if (!newProduct.name) {
        showError('El nombre del producto es requerido');
        return;
    }
    
    if (!newProduct.category) {
        showError('La categoría es requerida');
        return;
    }
    
    if (isNaN(newProduct.price) || newProduct.price <= 0) {
        showError('Ingrese un precio válido mayor a cero');
        return;
    }
    
    if (isNaN(newProduct.stock) || newProduct.stock < 0) {
        showError('Ingrese un stock válido');
        return;
    }
    
    if (isNaN(newProduct.minStock) || newProduct.minStock < 0) {
        showError('Ingrese un stock mínimo válido');
        return;
    }
    
    database.products.push(newProduct);
    saveDatabase();
    
    // Cerrar modal y limpiar formulario
    const addModal = bootstrap.Modal.getInstance(document.getElementById('addProductModal'));
    addModal.hide();
    document.getElementById('addProductForm').reset();
    
    // Actualizar tabla
    renderInventoryTable();
    showSuccess('Producto agregado correctamente');
});

// Actualizar producto
document.getElementById('updateProductBtn').addEventListener('click', function() {
    const productId = parseInt(document.getElementById('editProductId').value);
    const productIndex = database.products.findIndex(p => p.id === productId);
    
    if (productIndex !== -1) {
        const updatedProduct = {
            id: productId,
            name: document.getElementById('editProductName').value,
            category: document.getElementById('editProductCategory').value,
            price: parseFloat(document.getElementById('editProductPrice').value),
            stock: parseInt(document.getElementById('editProductStock').value),
            minStock: parseInt(document.getElementById('editProductMinStock').value)
        };

        // Validación mejorada
        if (!updatedProduct.name) {
            showError('El nombre del producto es requerido');
            return;
        }
        
        if (!updatedProduct.category) {
            showError('La categoría es requerida');
            return;
        }
        
        if (isNaN(updatedProduct.price) || updatedProduct.price <= 0) {
            showError('Ingrese un precio válido mayor a cero');
            return;
        }
        
        if (isNaN(updatedProduct.stock) || updatedProduct.stock < 0) {
            showError('Ingrese un stock válido');
            return;
        }
        
        if (isNaN(updatedProduct.minStock) || updatedProduct.minStock < 0) {
            showError('Ingrese un stock mínimo válido');
            return;
        }

        database.products[productIndex] = updatedProduct;
        saveDatabase();
        
        const editModal = bootstrap.Modal.getInstance(document.getElementById('editProductModal'));
        editModal.hide();
        
        renderInventoryTable();
        showSuccess('Producto actualizado correctamente');
    } else {
        showError('Error: Producto no encontrado');
    }
});

// Guardar ajuste de stock
document.getElementById('saveAdjustmentBtn').addEventListener('click', function() {
    const productId = parseInt(document.getElementById('adjustProductId').value);
    const productIndex = database.products.findIndex(p => p.id === productId);
    const action = document.getElementById('adjustAction').value;
    const quantity = parseInt(document.getElementById('adjustQuantity').value);
    const reason = document.getElementById('adjustReason').value;
    
    if (productIndex !== -1) {
        // Validación de cantidad
        if (isNaN(quantity) || quantity <= 0) {
            showError('Ingrese una cantidad válida mayor a cero');
            return;
        }
        
        let newStock = database.products[productIndex].stock;
        
        switch (action) {
            case 'add':
                newStock += quantity;
                break;
            case 'remove':
                if (quantity > database.products[productIndex].stock) {
                    showWarning('No puede quitar más stock del disponible');
                    return;
                }
                newStock = Math.max(0, newStock - quantity);
                break;
            case 'set':
                if (quantity < 0) {
                    showError('No puede establecer un stock negativo');
                    return;
                }
                newStock = quantity;
                break;
        }
        
        database.products[productIndex].stock = newStock;
        
        const movement = {
            productId: productId,
            date: new Date().toISOString(),
            type: action,
            quantity: quantity,
            previousStock: database.products[productIndex].stock,
            newStock: newStock,
            reason: reason,
            userId: JSON.parse(sessionStorage.getItem('currentUser')).id
        };
        
        if (!database.inventoryMovements) {
            database.inventoryMovements = [];
        }
        database.inventoryMovements.push(movement);
        
        saveDatabase();
        
        const adjustModal = bootstrap.Modal.getInstance(document.getElementById('adjustStockModal'));
        adjustModal.hide();
        document.getElementById('adjustStockForm').reset();
        
        renderInventoryTable();
        showSuccess('Stock ajustado correctamente');
    } else {
        showError('Producto no encontrado');
    }
});

// Filtros
document.getElementById('searchProduct').addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    const filteredProducts = database.products.filter(p => 
        p.name.toLowerCase().includes(searchTerm) ||
        p.category.toLowerCase().includes(searchTerm) ||
        p.id.toString().includes(searchTerm)
    );
    renderInventoryTable(filteredProducts);
});

document.getElementById('filterCategory').addEventListener('change', function() {
    const category = this.value;
    const stockFilter = document.getElementById('filterStock').value;
    
    let filteredProducts = database.products;
    
    if (category) {
        filteredProducts = filteredProducts.filter(p => p.category === category);
    }
    
    if (stockFilter === 'low') {
        filteredProducts = filteredProducts.filter(p => p.stock < p.minStock);
    } else if (stockFilter === 'normal') {
        filteredProducts = filteredProducts.filter(p => p.stock >= p.minStock);
    }
    
    renderInventoryTable(filteredProducts);
});

document.getElementById('filterStock').addEventListener('change', function() {
    const stockFilter = this.value;
    const category = document.getElementById('filterCategory').value;
    
    let filteredProducts = database.products;
    
    if (stockFilter === 'low') {
        filteredProducts = filteredProducts.filter(p => p.stock < p.minStock);
    } else if (stockFilter === 'normal') {
        filteredProducts = filteredProducts.filter(p => p.stock >= p.minStock);
    }
    
    if (category) {
        filteredProducts = filteredProducts.filter(p => p.category === category);
    }
    
    renderInventoryTable(filteredProducts);
});

// Inicializar la tabla al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar base de datos si no existe
    if (!database.products) {
        database.products = [];
    }
    
    if (!database.inventoryMovements) {
        database.inventoryMovements = [];
    }
    
    renderInventoryTable();
});