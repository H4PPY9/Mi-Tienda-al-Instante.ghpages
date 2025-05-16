document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        const errorElement = document.getElementById('errorMessage');
        
        // Resetear mensajes de error
        errorElement.classList.add('d-none');
        errorElement.textContent = '';
        
        // Validar campos vacíos
        if (!username || !password) {
            showError('Por favor complete todos los campos');
            return;
        }
        
        // Buscar usuario en la base de datos
        const user = database.users.find(u => u.username === username && u.password === password);
        
        if (user) {
            // Guardar sesión
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            
            // Redirigir al dashboard
            window.location.href = 'dashboard.html';
        } else {
            showError('Usuario o contraseña incorrectos. Por favor intente nuevamente.');
            document.getElementById('password').value = '';
            document.getElementById('password').focus();
        }
    });
    
    function showError(message) {
        const errorElement = document.getElementById('errorMessage');
        errorElement.textContent = message;
        errorElement.classList.remove('d-none');
    }
});