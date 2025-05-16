// Simulación de base de datos
let database = {
    users: [
        { id: 1, username: 'Admin', password: '1234', role: 'owner', name: 'Dueña' },
        { id: 2, username: 'cajero', password: '12345', role: 'cashier', name: 'Cajero 1' }
    ],
    products: [
        { id: 1, name: 'Arroz 1kg', price: 25.50, stock: 50, minStock: 10, category: 'Abarrotes' },
        { id: 2, name: 'Frijol 1kg', price: 32.00, stock: 30, minStock: 5, category: 'Abarrotes' }
    ],
    sales: [],
    purchases: [],
    suppliers: []
};

// Función para guardar datos en localStorage
function saveDatabase() {
    localStorage.setItem('laFeDatabase', JSON.stringify(database));
}

// Función para cargar datos desde localStorage
function loadDatabase() {
    const savedData = localStorage.getItem('laFeDatabase');
    if (savedData) {
        database = JSON.parse(savedData);
    } else {
        // Guardar la base de datos inicial si no existe
        saveDatabase();
    }
}

// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', function() {
    loadDatabase();
});