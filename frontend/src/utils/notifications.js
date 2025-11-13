// src/utils/notifications.js

/**
 * Muestra una notificación visual en la esquina superior derecha.
 * @param {string} message - El mensaje a mostrar.
 * @param {'success'|'error'|'info'} type - Tipo de mensaje.
 */
export const showNotification = (message, type = 'info') => {
  if (!message) return;

  const background =
    type === 'success'
      ? '#16a34a' // verde éxito
      : type === 'error'
      ? '#dc2626' // rojo error
      : '#2563eb'; // azul informativo

  // Crear el contenedor principal si no existe
  let container = document.querySelector('.notification-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'notification-container';
    Object.assign(container.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      zIndex: '9999',
    });
    document.body.appendChild(container);
  }

  // Crear notificación individual
  const notification = document.createElement('div');
  notification.textContent = message;

  Object.assign(notification.style, {
    backgroundColor: background,
    color: '#fff',
    padding: '12px 20px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    fontSize: '14px',
    fontWeight: '500',
    opacity: '1',
    transition: 'opacity 0.5s ease, transform 0.3s ease',
    transform: 'translateX(0)',
  });

  // Insertar la notificación en el contenedor
  container.appendChild(notification);

  // Desvanecer y eliminar tras 3 segundos
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(20px)';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }

      // Si el contenedor queda vacío, eliminarlo
      if (container.childElementCount === 0 && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    }, 500);
  }, 3000);
};

/**
 * Muestra una notificación de error.
 * @param {string} message
 */
export const showErrorMessage = (message) => {
  showNotification(message, 'error');
};

/**
 * Muestra una notificación de éxito.
 * @param {string} message
 */
export const showSuccessMessage = (message) => {
  showNotification(message, 'success');
};

/**
 * Muestra una notificación informativa.
 * @param {string} message
 */
export const showInfoMessage = (message) => {
  showNotification(message, 'info');
};
