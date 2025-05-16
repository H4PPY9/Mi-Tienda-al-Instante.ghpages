require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const app = express();

// Configuración CORS mejorada
app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'file://'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Middleware para manejar preflight OPTIONS
app.options('*', cors());

app.use(bodyParser.json());

// Middleware para verificar Content-Type
app.use((req, res, next) => {
    if (req.method === 'POST' && !req.is('application/json')) {
        return res.status(400).json({
            success: false,
            message: 'Content-Type debe ser application/json'
        });
    }
    next();
});

// Middleware para debug
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Almacenamiento de códigos
const recoveryCodes = {};

// Configuración de correo
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false // Solo para desarrollo, quitar en producción
    }
});

// Endpoint para enviar código
app.post('/api/request-recovery-code', async (req, res) => {
    try {
        const { email } = req.body;

        // Validación robusta
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Por favor ingresa un email válido',
                errorCode: 'INVALID_EMAIL'
            });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        recoveryCodes[email] = {
            code,
            expires: Date.now() + 900000 // 15 minutos
        };

        // Plantilla de correo mejorada
        const mailOptions = {
            from: `"Soporte Mi Tienda" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Tu código de recuperación',
            text: `Tu código de recuperación es: ${code}\n\nEste código expirará en 15 minutos.`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Recuperación de contraseña</h2>
                    <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
                    <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #2c3e50; background: #f8f9fa; padding: 10px; border-radius: 5px; display: inline-block;">
                        ${code}
                    </p>
                    <p style="color: #7f8c8d; font-size: 14px;">Este código expirará en 15 minutos.</p>
                    <p>Si no solicitaste este cambio, por favor ignora este mensaje.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({
            success: true,
            message: `Código enviado a ${email}`,
            email: email,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error en el servidor:', error);
        res.status(500).json({
            success: false,
            message: 'Error al enviar el código. Por favor intenta nuevamente.',
            errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Endpoint para resetear contraseña
app.post('/api/reset-password', (req, res) => {
    try {
        const { email, code, newPassword, confirmPassword } = req.body;

        // Validación completa
        if (!email || !code || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos'
            });
        }

        const recoveryData = recoveryCodes[email];

        if (!recoveryData || recoveryData.code !== code) {
            return res.status(400).json({
                success: false,
                message: 'Código inválido o expirado'
            });
        }

        if (Date.now() > recoveryData.expires) {
            delete recoveryCodes[email];
            return res.status(400).json({
                success: false,
                message: 'El código ha expirado. Por favor solicita uno nuevo.'
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Las contraseñas no coinciden'
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 8 caracteres'
            });
        }

        // Simulación de actualización
        delete recoveryCodes[email];
        
        res.status(200).json({
            success: true,
            message: '¡Contraseña actualizada exitosamente!'
        });

    } catch (error) {
        console.error('Error en reset-password:', error);
        res.status(500).json({
            success: false,
            message: 'Error al restablecer la contraseña'
        });
    }
});

// Endpoint de salud
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Password Recovery Service',
        version: '1.0.0'
    });
});

// Manejo de errores 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint no encontrado'
    });
});

const PORT = process.env.PORT || 5500;
app.listen(PORT, () => {
    console.log(`Servidor listo en http://localhost:${PORT}`);
    console.log(`Modo: ${process.env.NODE_ENV || 'development'}`);
});