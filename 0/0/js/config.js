// Variables para controlar qué se va a eliminar
let deleteType = null;
let deleteId = null;

// Función para confirmar eliminación
function confirmDelete(type, id, message) {
    deleteType = type;
    deleteId = id;
    document.getElementById('confirmDeleteMessage').textContent = message;

    const modal = new bootstrap.Modal(document.getElementById('confirmDeleteModal'));
    modal.show();
}

// Función para ejecutar la eliminación
function executeDelete() {
    if (deleteType === 'user') {
        // Evitar eliminar al admin principal (ID 1)
        if (deleteId === 1) {
            alert('No puedes eliminar al usuario administrador principal');
            return;
        }

        // Evitar eliminarse a sí mismo
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
        if (currentUser && currentUser.id === deleteId) {
            alert('No puedes eliminarte a ti mismo');
            return;
        }

        // Eliminar de database
        database.users = database.users.filter(user => user.id !== deleteId);

        // Eliminar de localStorage
        const storedUsers = JSON.parse(localStorage.getItem('users')) || [];
        const updatedUsers = storedUsers.filter(user => user.id !== deleteId);
        localStorage.setItem('users', JSON.stringify(updatedUsers));

        // Guardar cambios en base de datos simulada
        saveDatabase();

        // Actualizar tabla
        loadUsers();

        // Ocultar modal de confirmación
        const confirmModal = bootstrap.Modal.getInstance(document.getElementById('confirmDeleteModal'));
        confirmModal.hide();

        // Mostrar modal de éxito
        const successModal = new bootstrap.Modal(document.getElementById('successModal'));
        document.getElementById('successMessage').textContent = 'Usuario eliminado correctamente';
        successModal.show();
    }
}

// Función para sincronizar usuarios entre localStorage y database
function syncUsers() {
    const storedUsers = JSON.parse(localStorage.getItem('users')) || [];

    if (storedUsers.length > 0 && (!database.users || database.users.length === 0)) {
        database.users = storedUsers;
        saveDatabase();
    }

    if (database.users && database.users.length > 0 && (!JSON.parse(localStorage.getItem('users')) || JSON.parse(localStorage.getItem('users')).length === 0)) {
        localStorage.setItem('users', JSON.stringify(database.users));
    }
}

// Función para cambiar entre paneles
function showPanel(panelId) {
    document.getElementById('generalSettingsPanel').classList.add('d-none');
    document.getElementById('usersPanel').classList.add('d-none');
    document.getElementById('categoriesPanel').classList.add('d-none');
    document.getElementById('backupPanel').classList.add('d-none');
    document.getElementById('aboutPanel').classList.add('d-none');

    document.querySelectorAll('#generalSettingsTab, #usersTab, #categoriesTab, #backupTab, #aboutTab').forEach(tab => {
        tab.classList.remove('active');
    });

    document.getElementById(panelId + 'Panel').classList.remove('d-none');
    document.getElementById(panelId + 'Tab').classList.add('active');

    if (panelId === 'users') {
        loadUsers();
    } else if (panelId === 'categories') {
        loadCategories();
    } else if (panelId === 'generalSettings') {
        loadGeneralSettings();
    }
}

function loadGeneralSettings() {
    if (!database.settings) {
        database.settings = {
            storeName: 'Mi Tienda al Instante',
            storeAddress: '',
            storePhone: ''
        };
        saveDatabase();
    }

    document.getElementById('storeName').value = database.settings.storeName;
    document.getElementById('storeAddress').value = database.settings.storeAddress;
    document.getElementById('storePhone').value = database.settings.storePhone;
}

function saveGeneralSettings() {
    database.settings = {
        storeName: document.getElementById('storeName').value,
        storeAddress: document.getElementById('storeAddress').value,
        storePhone: document.getElementById('storePhone').value
    };

    saveDatabase();
    alert('Configuración guardada correctamente');
}

function loadUsers() {
    syncUsers();

    const tableBody = document.getElementById('usersTable');
    tableBody.innerHTML = '';

    database.users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.username}</td>
            <td>${user.name}</td>
            <td>${user.role === 'admin' ? 'Administrador' : user.role === 'cashier' ? 'Cajero' : 'Inventario'}</td>
            <td>${user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Nunca'}</td>
            <td>${user.actions ? user.actions.join(', ') : 'Ninguna'}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary edit-user-btn" data-id="${user.id}">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-user-btn" data-id="${user.id}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    document.querySelectorAll('.edit-user-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const userId = parseInt(this.getAttribute('data-id'));
            openEditUserModal(userId);
        });
    });

    document.querySelectorAll('.delete-user-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const userId = parseInt(this.getAttribute('data-id'));
            confirmDelete('user', userId, '¿Está seguro que desea eliminar este usuario?');
        });
    });
}

function openEditUserModal(userId) {
    const user = database.users.find(u => u.id === userId);
    if (user) {
        document.getElementById('editUserId').value = user.id;
        document.getElementById('editUsername').value = user.username;
        document.getElementById('editUserFullname').value = user.name;
        document.getElementById('editUserRole').value = user.role;

        const editModal = new bootstrap.Modal(document.getElementById('editUserModal'));
        editModal.show();
    }
}

function updateUser() {
    const userId = parseInt(document.getElementById('editUserId').value);
    const username = document.getElementById('editUsername').value;
    const fullname = document.getElementById('editUserFullname').value;
    const role = document.getElementById('editUserRole').value;

    const userIndex = database.users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
        if (database.users.some(u => u.username === username && u.id !== userId)) {
            alert('El nombre de usuario ya existe');
            return;
        }

        database.users[userIndex] = {
            ...database.users[userIndex],
            username: username,
            name: fullname,
            role: role
        };

        const storedUsers = JSON.parse(localStorage.getItem('users')) || [];
        const storedUserIndex = storedUsers.findIndex(u => u.id === userId);
        if (storedUserIndex !== -1) {
            storedUsers[storedUserIndex] = database.users[userIndex];
            localStorage.setItem('users', JSON.stringify(storedUsers));
        }

        saveDatabase();

        const editModal = bootstrap.Modal.getInstance(document.getElementById('editUserModal'));
        editModal.hide();

        loadUsers();
        alert('Usuario actualizado correctamente');
    }
}

// Eventos
document.getElementById('generalSettingsTab').addEventListener('click', () => showPanel('generalSettings'));
document.getElementById('usersTab').addEventListener('click', () => showPanel('users'));
document.getElementById('categoriesTab').addEventListener('click', () => showPanel('categories'));
document.getElementById('backupTab').addEventListener('click', () => showPanel('backup'));
document.getElementById('aboutTab').addEventListener('click', () => showPanel('about'));

document.getElementById('generalSettingsForm').addEventListener('submit', function (e) {
    e.preventDefault();
    saveGeneralSettings();
});

document.getElementById('updateUserBtn').addEventListener('click', updateUser);
document.getElementById('saveCategoryBtn').addEventListener('click', saveCategory);
document.getElementById('confirmDeleteBtn').addEventListener('click', executeDelete);
document.getElementById('createBackupBtn').addEventListener('click', createBackup);
document.getElementById('restoreBackupBtn').addEventListener('click', restoreBackup);

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', function () {
    syncUsers();
    showPanel('generalSettings');

    if (!database.settings) {
        database.settings = {
            storeName: 'Mi Tienda al Instante',
            storeAddress: '',
            storePhone: ''
        };
        saveDatabase();
    }

    if (!database.categories) {
        database.categories = [
            { id: 1, name: 'Abarrotes' },
            { id: 2, name: 'Lácteos' },
            { id: 3, name: 'Bebidas' },
            { id: 4, name: 'Limpieza' },
            { id: 5, name: 'Otros' }
        ];
        saveDatabase();
    }
});
