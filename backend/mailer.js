import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // false para 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Verificación opcional
transporter.verify((error, success) => {
  if (error) {
    console.error('Error con el transporte de correo:', error);
  } else {
    console.log('Servidor de correo listo para enviar mensajes');
  }
});
