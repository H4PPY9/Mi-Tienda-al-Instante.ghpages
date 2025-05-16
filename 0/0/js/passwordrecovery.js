document.addEventListener('DOMContentLoaded', () => {
    // Elementos UI
    const recoveryForm = document.getElementById('passwordRecoveryForm');
    const resetForm = document.getElementById('resetPasswordForm');
    const messageBox = document.getElementById('recoveryMessage');
    const sendBtn = document.getElementById('sendCodeBtn');
    const resetBtn = document.getElementById('resetPasswordBtn');
    const modal = new bootstrap.Modal('#forgotPasswordModal');
    const emailInput = document.getElementById('recoveryEmail');

    // Configuración
    const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:5500/api'
        : '/api';

    // Estado
    let countdownInterval;
    let countdownTime = 15 * 60; // 15 minutos en segundos

    // Eventos
    recoveryForm.addEventListener('submit', handleRecoveryRequest);
    resetForm.addEventListener('submit', handlePasswordReset);
    modal._element.addEventListener('hidden.bs.modal', resetForms);
    emailInput.addEventListener('input', validateEmailInput);

    // Validación de email en tiempo real
    function validateEmailInput() {
        const email = emailInput.value.trim();
        if (email && !validateEmail(email)) {
            emailInput.classList.add('is-invalid');
        } else {
            emailInput.classList.remove('is-invalid');
        }
    }

    async function handleRecoveryRequest(e) {
        e.preventDefault();
        const email = emailInput.value.trim();
        
        if (!validateEmail(email)) {
            showMessage('Por favor ingresa un email válido', 'danger');
            emailInput.classList.add('is-invalid');
            emailInput.focus();
            return;
        }

        setLoading(sendBtn, true);
        showMessage('Enviando código...', 'info');
        
        try {
            const response = await fetch(`${API_URL}/request-recovery-code`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            // Primero verificar el estado de la respuesta
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Error en la solicitud al servidor');
            }

            // Luego intentar parsear como JSON
            const data = await response.json().catch(() => {
                throw new Error('La respuesta del servidor no es válida');
            });

            if (data.success) {
                showMessage(`Código enviado a ${email}`, 'success');
                showResetForm(email);
                startCountdown();
            } else {
                showMessage(data.message || 'Error inesperado', 'warning');
            }
        } catch (error) {
            console.error('Error en handleRecoveryRequest:', error);
            
            // Intentar extraer el mensaje de error si es JSON
            try {
                const errorObj = JSON.parse(error.message);
                showMessage(errorObj.message || 'Error al contactar al servidor', 'danger');
            } catch (e) {
                // Si no es JSON, mostrar el mensaje directo
                showMessage(error.message || 'Error al contactar al servidor. Intenta nuevamente.', 'danger');
            }
        } finally {
            setLoading(sendBtn, false);
        }
    }

    async function handlePasswordReset(e) {
        e.preventDefault();
        const formData = new FormData(resetForm);
        const data = Object.fromEntries(formData.entries());

        if (data.newPassword !== data.confirmPassword) {
            showMessage('Las contraseñas no coinciden', 'danger');
            return;
        }

        if (data.newPassword.length < 8) {
            showMessage('La contraseña debe tener al menos 8 caracteres', 'danger');
            return;
        }

        setLoading(resetBtn, true);
        showMessage('Procesando...', 'info');

        try {
            const response = await fetch(`${API_URL}/reset-password`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Error en la solicitud al servidor');
            }

            const result = await response.json().catch(() => {
                throw new Error('La respuesta del servidor no es válida');
            });

            if (result.success) {
                showMessage('¡Contraseña actualizada correctamente!', 'success');
                setTimeout(() => {
                    modal.hide();
                    resetForms();
                }, 2000);
            } else {
                showMessage(result.message || 'Error al actualizar la contraseña', 'danger');
            }
        } catch (error) {
            console.error('Error en handlePasswordReset:', error);
            
            try {
                const errorObj = JSON.parse(error.message);
                showMessage(errorObj.message || 'Error al procesar la solicitud', 'danger');
            } catch (e) {
                showMessage(error.message || 'Error al procesar la solicitud', 'danger');
            }
        } finally {
            setLoading(resetBtn, false);
        }
    }

    // Helpers
    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function setLoading(button, isLoading) {
        button.disabled = isLoading;
        button.innerHTML = isLoading
            ? '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Procesando...'
            : button.dataset.originalText;
    }

    function showMessage(text, type) {
        messageBox.textContent = text;
        messageBox.className = `alert alert-${type} mt-3 ${text ? '' : 'd-none'}`;
        messageBox.setAttribute('role', 'alert');
        
        // Auto-ocultar mensajes de éxito después de 5 segundos
        if (type === 'success') {
            setTimeout(() => {
                if (messageBox.textContent === text) {
                    showMessage('', '');
                }
            }, 5000);
        }
    }

    function showResetForm(email) {
        recoveryForm.classList.add('d-none');
        resetForm.classList.remove('d-none');
        document.getElementById('hiddenEmail').value = email;
        document.getElementById('codeInput').focus();
    }

    function startCountdown() {
        clearInterval(countdownInterval);
        countdownTime = 15 * 60; // Resetear a 15 minutos
        
        const timerElement = document.createElement('div');
        timerElement.id = 'countdownTimer';
        timerElement.className = 'text-center small text-muted my-2';
        resetForm.prepend(timerElement);

        updateCountdownDisplay(timerElement);

        countdownInterval = setInterval(() => {
            countdownTime--;
            updateCountdownDisplay(timerElement);

            if (countdownTime <= 0) {
                clearInterval(countdownInterval);
                timerElement.textContent = '¡El código ha expirado!';
                timerElement.className = 'text-center small text-danger my-2';
            }
        }, 1000);
    }

    function updateCountdownDisplay(timerElement) {
        const minutes = Math.floor(countdownTime / 60);
        const seconds = countdownTime % 60;
        timerElement.textContent = `Código válido por ${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    function resetForms() {
        recoveryForm.reset();
        resetForm.reset();
        recoveryForm.classList.remove('d-none');
        resetForm.classList.add('d-none');
        showMessage('', '');
        clearInterval(countdownInterval);
        document.getElementById('countdownTimer')?.remove();
        emailInput.classList.remove('is-invalid');
    }

    // Inicialización
    document.querySelectorAll('[data-original-text]').forEach(el => {
        el.dataset.originalText = el.textContent;
    });

    // Verificar conexión con el servidor al cargar
    checkServerConnection();
    
    async function checkServerConnection() {
        try {
            const response = await fetch(`${API_URL}/health`);
            if (!response.ok) {
                console.warn('El servidor no está respondiendo correctamente');
                showMessage('Advertencia: Problema de conexión con el servidor', 'warning');
            }
        } catch (error) {
            console.error('Error conectando con el servidor:', error);
            showMessage('Error: No se pudo conectar con el servidor', 'danger');
        }
    }
});