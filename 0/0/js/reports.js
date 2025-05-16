// Variables para gráficas
let salesChart = null;
let salesByCategoryChart = null;
let purchasesChart = null;

// Función para mostrar/ocultar controles de fecha según el tipo de reporte
function toggleDateControls(reportType, prefix) {
    const dateContainer = document.getElementById(`${prefix}DateContainer`);
    const startDateContainer = document.getElementById(`${prefix}StartDateContainer`);
    const endDateContainer = document.getElementById(`${prefix}EndDateContainer`);
    
    if (reportType === 'custom') {
        dateContainer.classList.add('d-none');
        startDateContainer.classList.remove('d-none');
        endDateContainer.classList.remove('d-none');
    } else {
        dateContainer.classList.remove('d-none');
        startDateContainer.classList.add('d-none');
        endDateContainer.classList.add('d-none');
        
        // Establecer fecha actual si es diario
        if (reportType === 'daily') {
            document.getElementById(`${prefix}Date`).value = new Date().toISOString().split('T')[0];
        }
        
        // Establecer mes actual si es mensual
        if (reportType === 'monthly' || prefix === 'purchases') {
            const today = new Date();
            document.getElementById(`${prefix}Month`).value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        }
    }
}

// Función para generar reporte de ventas
function generateSalesReport() {
    const reportType = document.getElementById('salesReportType').value;
    let sales = [...database.sales];
    
    // Filtrar por fecha según el tipo de reporte
    if (reportType === 'daily') {
        const date = document.getElementById('salesDate').value;
        sales = sales.filter(sale => sale.date === date);
    } else if (reportType === 'weekly') {
        // Implementar lógica para semana (ejemplo simplificado)
        const date = new Date(document.getElementById('salesDate').value);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        sales = sales.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= weekStart && saleDate <= weekEnd;
        });
    } else if (reportType === 'monthly') {
        const month = document.getElementById('salesDate').value.substring(0, 7);
        sales = sales.filter(sale => sale.date.startsWith(month));
    } else if (reportType === 'custom') {
        const startDate = document.getElementById('salesStartDate').value;
        const endDate = document.getElementById('salesEndDate').value;
        
        sales = sales.filter(sale => sale.date >= startDate && sale.date <= endDate);
    }
    
    // Renderizar tabla de ventas
    renderSalesTable(sales);
    
    // Generar gráficas
    generateSalesCharts(sales);
}

// Función para renderizar tabla de ventas
function renderSalesTable(sales) {
    const tableBody = document.getElementById('salesReportTable');
    tableBody.innerHTML = '';
    
    sales.forEach(sale => {
        const user = database.users.find(u => u.id === sale.userId);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${sale.id}</td>
            <td>${sale.date}</td>
            <td>${sale.items.length} productos</td>
            <td>$${sale.total.toFixed(2)}</td>
            <td>${sale.paymentMethod === 'cash' ? 'Efectivo' : sale.paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia'}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary view-sale-btn" data-id="${sale.id}">
                    <i class="bi bi-eye"></i> Ver
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Agregar eventos a los botones de ver
    document.querySelectorAll('.view-sale-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const saleId = parseInt(this.getAttribute('data-id'));
            showSaleDetails(saleId);
        });
    });
}

// Función para mostrar detalles de venta
function showSaleDetails(saleId) {
    const sale = database.sales.find(s => s.id === saleId);
    if (sale) {
        const user = database.users.find(u => u.id === sale.userId);
        
        document.getElementById('saleDetailId').textContent = sale.id;
        document.getElementById('saleDetailDate').textContent = sale.date;
        document.getElementById('saleDetailCustomer').textContent = sale.customer || 'Cliente no registrado';
        document.getElementById('saleDetailUser').textContent = user ? user.name : 'Usuario no disponible';
        document.getElementById('saleDetailPaymentMethod').textContent = 
            sale.paymentMethod === 'cash' ? 'Efectivo' : 
            sale.paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia';
        document.getElementById('saleDetailNotes').textContent = sale.notes || 'Sin notas';
        document.getElementById('saleDetailSubtotal').textContent = `$${sale.subtotal.toFixed(2)}`;
        document.getElementById('saleDetailTax').textContent = `$${sale.tax.toFixed(2)}`;
        document.getElementById('saleDetailTotal').textContent = `$${sale.total.toFixed(2)}`;
        document.getElementById('saleDetailAmountReceived').textContent = `$${sale.amountReceived.toFixed(2)}`;
        document.getElementById('saleDetailChange').textContent = `$${sale.change.toFixed(2)}`;
        
        // Mostrar items
        const itemsBody = document.getElementById('saleDetailItemsTable');
        itemsBody.innerHTML = '';
        
        sale.items.forEach(item => {
            const product = database.products.find(p => p.id === item.productId);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product ? product.name : 'Producto no disponible'}</td>
                <td>${item.quantity}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td>$${(item.price * item.quantity).toFixed(2)}</td>
            `;
            itemsBody.appendChild(row);
        });
        
        const detailModal = new bootstrap.Modal(document.getElementById('saleDetailModal'));
        detailModal.show();
    }
}

// Función para generar gráficas de ventas
function generateSalesCharts(sales) {
    const ctxSales = document.getElementById('salesChart').getContext('2d');
    const ctxByCategory = document.getElementById('salesByCategoryChart').getContext('2d');
    
    // Destruir gráficas existentes
    if (salesChart) salesChart.destroy();
    if (salesByCategoryChart) salesByCategoryChart.destroy();
    
    // Agrupar ventas por día
    const salesByDay = {};
    sales.forEach(sale => {
        if (!salesByDay[sale.date]) {
            salesByDay[sale.date] = 0;
        }
        salesByDay[sale.date] += sale.total;
    });
    
    const dates = Object.keys(salesByDay).sort();
    const amounts = dates.map(date => salesByDay[date]);
    
    // Gráfica de ventas por día
    salesChart = new Chart(ctxSales, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [{
                label: 'Ventas por día',
                data: amounts,
                backgroundColor: 'rgba(217, 83, 79, 0.7)',
                borderColor: 'rgba(217, 83, 79, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    
    // Agrupar ventas por categoría
    const salesByCategory = {};
    sales.forEach(sale => {
        sale.items.forEach(item => {
            const product = database.products.find(p => p.id === item.productId);
            if (product) {
                const category = product.category || 'Sin categoría';
                if (!salesByCategory[category]) {
                    salesByCategory[category] = 0;
                }
                salesByCategory[category] += item.price * item.quantity;
            }
        });
    });
    
    const categories = Object.keys(salesByCategory);
    const categoryAmounts = categories.map(cat => salesByCategory[cat]);
    
    // Gráfica de ventas por categoría
    salesByCategoryChart = new Chart(ctxByCategory, {
        type: 'pie',
        data: {
            labels: categories,
            datasets: [{
                data: categoryAmounts,
                backgroundColor: [
                    'rgba(217, 83, 79, 0.7)',
                    'rgba(91, 192, 222, 0.7)',
                    'rgba(92, 184, 92, 0.7)',
                    'rgba(240, 173, 78, 0.7)',
                    'rgba(66, 139, 202, 0.7)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true
        }
    });
}

// Función para generar reporte de inventario
function generateInventoryReport() {
    const reportType = document.getElementById('inventoryReportType').value;
    const category = document.getElementById('inventoryCategoryFilter').value;
    const stockFilter = document.getElementById('inventoryStockFilter').value;
    
    let products = [...database.products];
    
    // Aplicar filtros
    if (category) {
        products = products.filter(p => p.category === category);
    }
    
    if (stockFilter === 'low') {
        products = products.filter(p => p.stock < p.minStock);
    } else if (stockFilter === 'normal') {
        products = products.filter(p => p.stock >= p.minStock);
    }
    
    // Renderizar tabla de inventario
    renderInventoryTable(products);
    
    // Actualizar resumen
    updateInventorySummary(products);
}

// Función para renderizar tabla de inventario
function renderInventoryTable(products) {
    const tableBody = document.getElementById('inventoryReportTable');
    tableBody.innerHTML = '';
    
    products.forEach(product => {
        const stockStatus = product.stock < product.minStock ? 
            (product.stock === 0 ? 'danger' : 'warning') : 'success';
        const statusText = product.stock < product.minStock ? 
            (product.stock === 0 ? 'Agotado' : 'Bajo Stock') : 'Disponible';
        const value = product.price * product.stock;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>${product.category || 'Sin categoría'}</td>
            <td>$${product.price.toFixed(2)}</td>
            <td>${product.stock}</td>
            <td>${product.minStock}</td>
            <td>$${value.toFixed(2)}</td>
            <td><span class="badge bg-${stockStatus}">${statusText}</span></td>
        `;
        tableBody.appendChild(row);
    });
}

// Función para actualizar resumen de inventario
function updateInventorySummary(products) {
    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => p.stock < p.minStock && p.stock > 0).length;
    const outOfStockProducts = products.filter(p => p.stock === 0).length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
    
    document.getElementById('totalProductsCount').textContent = totalProducts;
    document.getElementById('lowStockProductsCount').textContent = lowStockProducts;
    document.getElementById('outOfStockProductsCount').textContent = outOfStockProducts;
    document.getElementById('totalInventoryValue').textContent = `$${totalValue.toFixed(2)}`;
}

// Función para generar reporte de compras
function generatePurchasesReport() {
    const reportType = document.getElementById('purchasesReportType').value;
    let purchases = [...database.purchases];
    
    // Filtrar por fecha según el tipo de reporte
    if (reportType === 'monthly') {
        const month = document.getElementById('purchasesMonth').value;
        purchases = purchases.filter(purchase => purchase.date.startsWith(month));
    } else if (reportType === 'quarterly') {
        // Implementar lógica para trimestre (ejemplo simplificado)
        const month = document.getElementById('purchasesMonth').value;
        const year = parseInt(month.substring(0, 4));
        const quarter = Math.floor(parseInt(month.substring(5, 7)) / 3);
        
        const quarterStartMonth = quarter * 3 + 1;
        const quarterEndMonth = quarterStartMonth + 2;
        
        purchases = purchases.filter(purchase => {
            const purchaseDate = new Date(purchase.date);
            const purchaseYear = purchaseDate.getFullYear();
            const purchaseMonth = purchaseDate.getMonth() + 1;
            
            return purchaseYear === year && purchaseMonth >= quarterStartMonth && purchaseMonth <= quarterEndMonth;
        });
    } else if (reportType === 'custom') {
        const startDate = document.getElementById('purchasesStartDate').value;
        const endDate = document.getElementById('purchasesEndDate').value;
        
        purchases = purchases.filter(purchase => purchase.date >= startDate && purchase.date <= endDate);
    }
    
    // Renderizar tabla de compras
    renderPurchasesTable(purchases);
    
    // Generar gráfica de compras
    generatePurchasesChart(purchases);
}

// Función para renderizar tabla de compras
function renderPurchasesTable(purchases) {
    const tableBody = document.getElementById('purchasesReportTable');
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
                <button class="btn btn-sm btn-outline-primary view-purchase-btn" data-id="${purchase.id}">
                    <i class="bi bi-eye"></i> Ver
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Agregar eventos a los botones de ver
    document.querySelectorAll('.view-purchase-btn').forEach(btn => {
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
        document.getElementById('detailNotes').textContent = purchase.notes || 'Sin notas';
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

// Función para generar gráfica de compras
function generatePurchasesChart(purchases) {
    const ctx = document.getElementById('purchasesChart').getContext('2d');
    
    // Destruir gráfica existente
    if (purchasesChart) purchasesChart.destroy();
    
    // Agrupar compras por día
    const purchasesByDay = {};
    purchases.forEach(purchase => {
        if (!purchasesByDay[purchase.date]) {
            purchasesByDay[purchase.date] = 0;
        }
        purchasesByDay[purchase.date] += purchase.total;
    });
    
    const dates = Object.keys(purchasesByDay).sort();
    const amounts = dates.map(date => purchasesByDay[date]);
    
    // Gráfica de compras por día
    purchasesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Compras por día',
                data: amounts,
                backgroundColor: 'rgba(91, 192, 222, 0.2)',
                borderColor: 'rgba(91, 192, 222, 1)',
                borderWidth: 2,
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Función para exportar datos
function exportData(type) {
    let data, filename, content;
    
    if (type === 'sales') {
        data = database.sales;
        filename = 'ventas.csv';
        content = convertToCSV(data, [
            { key: 'id', header: 'Folio' },
            { key: 'date', header: 'Fecha' },
            { key: 'items', header: 'Productos', transform: items => items.length },
            { key: 'total', header: 'Total', transform: total => `$${total.toFixed(2)}` },
            { key: 'paymentMethod', header: 'Método Pago', transform: method => 
                method === 'cash' ? 'Efectivo' : method === 'card' ? 'Tarjeta' : 'Transferencia' 
            }
        ]);
    } else if (type === 'inventory') {
        data = database.products;
        filename = 'inventario.csv';
        content = convertToCSV(data, [
            { key: 'id', header: 'Código' },
            { key: 'name', header: 'Producto' },
            { key: 'category', header: 'Categoría' },
            { key: 'price', header: 'Precio', transform: price => `$${price.toFixed(2)}` },
            { key: 'stock', header: 'Stock' },
            { key: 'minStock', header: 'Mínimo' },
            { key: null, header: 'Valor', transform: (_, product) => `$${(product.price * product.stock).toFixed(2)}` },
            { key: null, header: 'Estado', transform: (_, product) => 
                product.stock < product.minStock ? 
                (product.stock === 0 ? 'Agotado' : 'Bajo Stock') : 'Disponible' 
            }
        ]);
    } else if (type === 'purchases') {
        data = database.purchases;
        filename = 'compras.csv';
        content = convertToCSV(data, [
            { key: 'id', header: 'Folio' },
            { key: 'date', header: 'Fecha' },
            { key: 'supplierId', header: 'Proveedor', transform: id => {
                const supplier = database.suppliers.find(s => s.id === id);
                return supplier ? supplier.name : 'Proveedor no disponible';
            }},
            { key: 'items', header: 'Productos', transform: items => items.length },
            { key: 'total', header: 'Total', transform: total => `$${total.toFixed(2)}` }
        ]);
    }
    
    downloadCSV(content, filename);
}

// Función para convertir datos a CSV
function convertToCSV(data, columns) {
    const headers = columns.map(col => col.header).join(',');
    const rows = data.map(item => {
        return columns.map(col => {
            if (col.transform) {
                return col.transform(item[col.key], item);
            }
            return item[col.key] !== undefined ? item[col.key] : '';
        }).join(',');
    }).join('\n');
    
    return `${headers}\n${rows}`;
}

// Función para descargar CSV
function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Eventos
document.getElementById('salesReportType').addEventListener('change', function() {
    toggleDateControls(this.value, 'sales');
});
document.getElementById('purchasesReportType').addEventListener('change', function() {
    toggleDateControls(this.value, 'purchases');
});

document.getElementById('generateSalesReportBtn').addEventListener('click', generateSalesReport);
document.getElementById('generateInventoryReportBtn').addEventListener('click', generateInventoryReport);
document.getElementById('generatePurchasesReportBtn').addEventListener('click', generatePurchasesReport);

document.getElementById('exportSalesBtn').addEventListener('click', () => exportData('sales'));
document.getElementById('exportInventoryBtn').addEventListener('click', () => exportData('inventory'));
document.getElementById('exportPurchasesBtn').addEventListener('click', () => exportData('purchases'));

document.getElementById('printSaleDetailBtn').addEventListener('click', function() {
    window.print();
});

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    // Establecer fechas iniciales
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('salesDate').value = today;
    
    const currentMonth = `${today.substring(0, 7)}`;
    document.getElementById('purchasesMonth').value = currentMonth;
    
    // Generar reportes iniciales
    generateSalesReport();
    generateInventoryReport();
    generatePurchasesReport();
});