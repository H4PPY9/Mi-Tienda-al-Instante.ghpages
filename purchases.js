// Variables para la compra actual
let currentPurchase = {
    items: [],
    supplierId: null,
    date: new Date().toISOString().split('T')[0],
    total: 0
};

// Función para mostrar notificación de éxito
function showSuccessNotification(message) {
    const toastElement = document.getElementById('notificationToast');
    const toastMessage = document.getElementById('toastMessage');
    
    // Cambiar estilo para éxito
    toastElement.querySelector('.toast-header').className = 'toast-header bg-success text-white';
    toastMessage.innerHTML = `<i class="bi bi-check-circle-fill me-2"></i>${message}`;
    
    // Mostrar toast
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
}

// Función para mostrar notificación de error
function showErrorNotification(message) {
    const toastElement = document.getElementById('notificationToast');
    const toastMessage = document.getElementById('toastMessage');
    
    // Cambiar estilo para error
    toastElement.querySelector('.toast-header').className = 'toast-header bg-danger text-white';
    toastMessage.innerHTML = `<i class="bi bi-exclamation-triangle-fill me-2"></i>${message}`;
    
    // Mostrar toast
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
}

// Función para renderizar la tabla de compras
function renderPurchasesTable(purchases = database.purchases) {
    const tableBody = document.getElementById('purchasesTable');
    tableBody.innerHTML = '';
    
    purchases.forEach(purchase => {
        const supplier = database.suppliers.find(s => s.id === purchase.supplierId);
        const user = database.users.find(u => u.id === purchase.userId);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${purchase.id}</td>
            <td>${purchase.date}</td>
            <td>${supplier ? supplier.name : 'Proveedor no disponible'}</td>
            <td>${purchase.items.length} productos</td>
            <td>$${purchase.total.toFixed(2)}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary view-btn" data-id="${purchase.id}">
                    <i class="bi bi-eye"></i> Ver
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Agregar eventos a los botones
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const purchaseId = parseInt(this.getAttribute('data-id'));
            showPurchaseDetails(purchaseId);
        });
    });
}

// Función para mostrar detalles de compra
function showPurchaseDetails(purchaseId) {
    const purchase = database.purchases.find(p => p.id === purchaseId);
    if (purchase) {
        const supplier = database.suppliers.find(s => s.id === purchase.supplierId);
        const user = database.users.find(u => u.id === purchase.userId);
        
        document.getElementById('detailId').textContent = purchase.id;
        document.getElementById('detailDate').textContent = purchase.date;
        document.getElementById('detailSupplier').textContent = supplier ? supplier.name : 'Proveedor no disponible';
        document.getElementById('detailUser').textContent = user ? user.name : 'Usuario no disponible';
        document.getElementById('detailTotalAmount').textContent = `$${purchase.total.toFixed(2)}`;
        
        // Mostrar items
        const itemsBody = document.getElementById('detailItemsTable');
        itemsBody.innerHTML = '';
        
        purchase.items.forEach(item => {
            const product = database.products.find(p => p.id === item.productId);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product ? product.name : 'Producto no disponible'}</td>
                <td>${item.quantity}</td>
                <td>$${item.unitPrice.toFixed(2)}</td>
                <td>$${(item.unitPrice * item.quantity).toFixed(2)}</td>
            `;
            itemsBody.appendChild(row);
        });
        
        const detailModal = new bootstrap.Modal(document.getElementById('purchaseDetailModal'));
        detailModal.show();
    }
}

// Función para renderizar los items de la compra actual
function renderPurchaseItems() {
    const tableBody = document.getElementById('purchaseItemsTable');
    tableBody.innerHTML = '';
    
    currentPurchase.total = 0;
    
    currentPurchase.items.forEach((item, index) => {
        const product = database.products.find(p => p.id === item.productId);
        const subtotal = item.unitPrice * item.quantity;
        currentPurchase.total += subtotal;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product ? product.name : 'Producto no disponible'}</td>
            <td>${item.quantity}</td>
            <td>$${item.unitPrice.toFixed(2)}</td>
            <td>$${subtotal.toFixed(2)}</td>
            <td>
                <button class="btn btn-sm btn-outline-danger remove-purchase-item-btn" data-index="${index}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    document.getElementById('purchaseTotalAmount').textContent = `$${currentPurchase.total.toFixed(2)}`;
    
    // Agregar eventos a los botones
    document.querySelectorAll('.remove-purchase-item-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            currentPurchase.items.splice(index, 1);
            renderPurchaseItems();
        });
    });
}

// Función para agregar producto a la compra
function addProductToPurchase() {
    const productName = document.getElementById('productToAdd').value.trim();
    const quantity = parseInt(document.getElementById('productQuantity').value) || 1;
    const unitPrice = parseFloat(document.getElementById('productPrice').value) || 0;
    
    if (!productName) {
        showErrorNotification('Ingrese el nombre del producto');
        return;
    }
    
    if (unitPrice <= 0) {
        showErrorNotification('Ingrese un precio válido');
        return;
    }
    
    // Buscar si el producto ya existe en el inventario
    let product = database.products.find(p => p.name.toLowerCase() === productName.toLowerCase());
    
    // Si no existe, crear un nuevo producto
    if (!product) {
        product = {
            id: database.products.length > 0 ? Math.max(...database.products.map(p => p.id)) + 1 : 1,
            name: productName,
            stock: 0,
            price: unitPrice
        };
        database.products.push(product);
        saveDatabase();
    }
    
    // Agregar a la compra actual
    currentPurchase.items.push({
        productId: product.id,
        quantity: quantity,
        unitPrice: unitPrice
    });
    
    renderPurchaseItems();
    
    // Limpiar campos
    document.getElementById('productToAdd').value = '';
    document.getElementById('productQuantity').value = '1';
    document.getElementById('productPrice').value = '';
}

// Función para guardar la compra
function savePurchase() {
    if (currentPurchase.items.length === 0) {
        showErrorNotification('No hay productos en la compra');
        return;
    }
    
    if (!currentPurchase.supplierId) {
        showErrorNotification('Seleccione un proveedor');
        return;
    }
    
    // Verificar que el proveedor existe
    const supplierExists = database.suppliers.some(s => s.id === currentPurchase.supplierId);
    if (!supplierExists) {
        showErrorNotification('El proveedor seleccionado no existe');
        return;
    }
    
    // Registrar la compra
    const purchaseRecord = {
        id: database.purchases.length > 0 ? Math.max(...database.purchases.map(p => p.id)) + 1 : 1,
        date: document.getElementById('purchaseDate').value,
        supplierId: currentPurchase.supplierId,
        items: currentPurchase.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice
        })),
        total: currentPurchase.total,
        userId: JSON.parse(sessionStorage.getItem('currentUser')).id
    };
    
    database.purchases.push(purchaseRecord);
    
    // Actualizar inventario
    currentPurchase.items.forEach(item => {
        const product = database.products.find(p => p.id === item.productId);
        if (product) {
            product.stock += item.quantity;
            product.price = item.unitPrice;
        }
    });
    
    saveDatabase();
    
    // Cerrar modal y limpiar
    const purchaseModal = bootstrap.Modal.getInstance(document.getElementById('newPurchaseModal'));
    purchaseModal.hide();
    
    // Reiniciar compra actual
    currentPurchase = {
        items: [],
        supplierId: null,
        date: new Date().toISOString().split('T')[0],
        total: 0
    };
    
    // Actualizar vista
    renderPurchasesTable();
    showSuccessNotification('Compra registrada correctamente');
}

// Función para cargar proveedores en el select
function loadExistingSuppliers() {
    const select = document.getElementById('existingSuppliers');
    select.innerHTML = '<option value="">Seleccione un proveedor para editar/eliminar</option>';
    
    database.suppliers.forEach(supplier => {
        const option = document.createElement('option');
        option.value = supplier.id;
        option.textContent = supplier.name;
        select.appendChild(option);
    });
    
    // Habilitar/deshabilitar botón de eliminar
    select.addEventListener('change', function() {
        document.getElementById('deleteSupplierBtn').disabled = !this.value;
    });
}

// Función para cargar datos de proveedor en el formulario
function loadSupplierData(supplierId) {
    const supplier = database.suppliers.find(s => s.id === supplierId);
    if (supplier) {
        document.getElementById('supplierName').value = supplier.name;
        document.getElementById('supplierPhone').value = supplier.phone || '';
        document.getElementById('supplierAddress').value = supplier.address || '';
    }
}

// Función para eliminar proveedor
function deleteSupplier() {
    const supplierId = parseInt(document.getElementById('existingSuppliers').value);
    if (!supplierId) return;
    
    // Verificar si el proveedor tiene compras asociadas
    const hasPurchases = database.purchases.some(p => p.supplierId === supplierId);
    
    if (hasPurchases) {
        showErrorNotification('No se puede eliminar este proveedor porque tiene compras asociadas');
        return;
    }
    
    if (confirm('¿Está seguro que desea eliminar este proveedor?')) {
        const index = database.suppliers.findIndex(s => s.id === supplierId);
        if (index !== -1) {
            database.suppliers.splice(index, 1);
            saveDatabase();
            
            // Limpiar formulario y actualizar selects
            document.getElementById('newSupplierForm').reset();
            loadExistingSuppliers();
            updateSupplierSelects();
            showSuccessNotification('Proveedor eliminado correctamente');
        }
    }
}

// Función para guardar/actualizar proveedor
function saveSupplier() {
    const supplierId = parseInt(document.getElementById('existingSuppliers').value);
    const name = document.getElementById('supplierName').value;
    
    if (!name) {
        showErrorNotification('El nombre del proveedor es requerido');
        return;
    }
    
    let supplier;
    
    if (supplierId) {
        // Editar proveedor existente
        supplier = database.suppliers.find(s => s.id === supplierId);
        if (supplier) {
            supplier.name = name;
            supplier.phone = document.getElementById('supplierPhone').value || null;
            supplier.address = document.getElementById('supplierAddress').value || null;
        }
    } else {
        // Crear nuevo proveedor
        supplier = {
            id: database.suppliers.length > 0 ? Math.max(...database.suppliers.map(s => s.id)) + 1 : 1,
            name: name,
            phone: document.getElementById('supplierPhone').value || null,
            address: document.getElementById('supplierAddress').value || null
        };
        database.suppliers.push(supplier);
    }
    
    saveDatabase();
    
    // Limpiar y actualizar
    document.getElementById('existingSuppliers').value = '';
    document.getElementById('newSupplierForm').reset();
    loadExistingSuppliers();
    updateSupplierSelects();
    document.getElementById('deleteSupplierBtn').disabled = true;
    
    showSuccessNotification(`Proveedor ${supplierId ? 'actualizado' : 'registrado'} correctamente`);
}

// Función para actualizar selects de proveedores
function updateSupplierSelects() {
    const supplierSelects = [
        document.getElementById('filterSupplier'),
        document.getElementById('purchaseSupplier')
    ];
    
    supplierSelects.forEach(select => {
        if (select) {
            const currentValue = select.value;
            select.innerHTML = '';
            
            if (select.id === 'filterSupplier') {
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = 'Todos los proveedores';
                select.appendChild(defaultOption);
            } else if (select.id === 'purchaseSupplier') {
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = 'Seleccione un proveedor';
                select.appendChild(defaultOption);
            }
            
            database.suppliers.forEach(supplier => {
                const option = document.createElement('option');
                option.value = supplier.id;
                option.textContent = supplier.name;
                select.appendChild(option);
            });
            
            if (currentValue) {
                select.value = currentValue;
            }
        }
    });
}

// Función para aplicar filtros
function applyFilters() {
    const searchTerm = document.getElementById('searchPurchase').value.toLowerCase();
    const supplierId = document.getElementById('filterSupplier').value;
    const dateFilter = document.getElementById('filterDate').value;
    
    let filteredPurchases = database.purchases;
    
    if (searchTerm) {
        filteredPurchases = filteredPurchases.filter(purchase => {
            const supplier = database.suppliers.find(s => s.id === purchase.supplierId);
            return (
                purchase.id.toString().includes(searchTerm) ||
                (supplier && supplier.name.toLowerCase().includes(searchTerm))
            );
        });
    }
    
    if (supplierId) {
        filteredPurchases = filteredPurchases.filter(purchase => purchase.supplierId === parseInt(supplierId));
    }
    
    if (dateFilter) {
        filteredPurchases = filteredPurchases.filter(purchase => purchase.date === dateFilter);
    }
    
    renderPurchasesTable(filteredPurchases);
}

// Eventos
document.getElementById('addProductToPurchaseBtn').addEventListener('click', addProductToPurchase);
document.getElementById('savePurchaseBtn').addEventListener('click', savePurchase);
document.getElementById('saveSupplierBtn').addEventListener('click', saveSupplier);
document.getElementById('deleteSupplierBtn').addEventListener('click', deleteSupplier);
document.getElementById('applyFiltersBtn').addEventListener('click', applyFilters);

// Evento para capturar proveedor seleccionado
document.getElementById('purchaseSupplier').addEventListener('change', function() {
    currentPurchase.supplierId = parseInt(this.value);
});

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar base de datos si no existe
    if (!database.suppliers) {
        database.suppliers = [];
    }
    
    if (!database.purchases) {
        database.purchases = [];
    }
    
    // Actualizar selects
    updateSupplierSelects();
    loadExistingSuppliers();
    
    // Establecer fecha actual en el modal
    document.getElementById('purchaseDate').value = currentPurchase.date;
    
    // Renderizar tabla de compras
    renderPurchasesTable();
    
    // Evento para cargar datos de proveedor seleccionado
    document.getElementById('existingSuppliers').addEventListener('change', function() {
        const supplierId = parseInt(this.value);
        if (supplierId) {
            loadSupplierData(supplierId);
        } else {
            document.getElementById('newSupplierForm').reset();
        }
    });
    
    // Evento para nuevo proveedor (limpiar formulario)
    document.getElementById('newSupplierModal').addEventListener('show.bs.modal', function() {
        document.getElementById('existingSuppliers').value = '';
        document.getElementById('newSupplierForm').reset();
        document.getElementById('deleteSupplierBtn').disabled = true;
    });
});