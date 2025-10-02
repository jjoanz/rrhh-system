import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, MapPin, Calendar, Briefcase, 
  Settings, Bell, Camera, Save, Edit, X, Shield,
  Building, Star, CheckCircle, AlertCircle, Key, Upload
} from 'lucide-react';

const PerfilModule = () => {
  const [perfil, setPerfil] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  
  const [formData, setFormData] = useState({
    telefono: '',
    emailPersonal: '',
    direccion: ''
  });

  const [passwordData, setPasswordData] = useState({
    passwordActual: '',
    passwordNuevo: '',
    passwordConfirmar: ''
  });

  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [previewFoto, setPreviewFoto] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://192.168.0.239:5000/api';
  const getToken = () => localStorage.getItem('rrhh_token');

  // Cargar perfil al montar
  useEffect(() => {
    cargarPerfil();
    cargarEstadisticas();
  }, []);

  const cargarPerfil = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/perfil`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar perfil');
      }

      const data = await response.json();
      setPerfil(data.perfil);
      setFormData({
        telefono: data.perfil.telefono || '',
        emailPersonal: data.perfil.emailPersonal || '',
        direccion: data.perfil.direccion || ''
      });

    } catch (error) {
      console.error('Error cargando perfil:', error);
      mostrarMensaje('error', 'Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const response = await fetch(`${API_URL}/perfil/estadisticas`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEstadisticas(data.estadisticas);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const actualizarPerfil = async () => {
    try {
      setGuardando(true);

      const response = await fetch(`${API_URL}/perfil`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Error al actualizar perfil');
      }

      await cargarPerfil();
      setEditMode(false);
      mostrarMensaje('success', '¡Perfil actualizado exitosamente!');

    } catch (error) {
      console.error('Error actualizando perfil:', error);
      mostrarMensaje('error', 'Error al actualizar el perfil');
    } finally {
      setGuardando(false);
    }
  };

  const cambiarPassword = async () => {
    if (passwordData.passwordNuevo !== passwordData.passwordConfirmar) {
      mostrarMensaje('error', 'Las contraseñas no coinciden');
      return;
    }

    if (passwordData.passwordNuevo.length < 6) {
      mostrarMensaje('error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setGuardando(true);

      const response = await fetch(`${API_URL}/perfil/cambiar-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          passwordActual: passwordData.passwordActual,
          passwordNuevo: passwordData.passwordNuevo
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al cambiar contraseña');
      }

      setShowPasswordModal(false);
      setPasswordData({ passwordActual: '', passwordNuevo: '', passwordConfirmar: '' });
      mostrarMensaje('success', '¡Contraseña actualizada exitosamente!');

    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      mostrarMensaje('error', error.message);
    } finally {
      setGuardando(false);
    }
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        mostrarMensaje('error', 'La imagen no debe superar 5MB');
        return;
      }
      
      setFotoPerfil(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewFoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const subirFoto = async () => {
    if (!fotoPerfil) return;

    try {
      const formData = new FormData();
      formData.append('foto', fotoPerfil);

      const response = await fetch(`${API_URL}/perfil/foto`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Error al subir foto');
      }

      await cargarPerfil();
      setFotoPerfil(null);
      setPreviewFoto(null);
      mostrarMensaje('success', '¡Foto actualizada exitosamente!');

    } catch (error) {
      console.error('Error subiendo foto:', error);
      mostrarMensaje('error', 'Error al subir la foto');
    }
  };

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 5000);
  };

  const calcularAntiguedad = (fechaIngreso) => {
    if (!fechaIngreso) return '0 años';
    const inicio = new Date(fechaIngreso);
    const hoy = new Date();
    const años = Math.floor((hoy - inicio) / (365.25 * 24 * 60 * 60 * 1000));
    return `${años} año${años !== 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Cargando perfil...</p>
      </div>
    );
  }

  if (!perfil) {
    return (
      <div style={styles.errorContainer}>
        <AlertCircle size={48} color="#ef4444" />
        <p>Error al cargar el perfil</p>
      </div>
    );
  }

  const tabs = [
    { id: 'personal', label: 'Información Personal', icon: User },
    { id: 'seguridad', label: 'Seguridad', icon: Shield }
  ];

  return (
    <div style={styles.container}>
      <style>{styles.css}</style>

      {/* Mensaje de notificación */}
      {mensaje.texto && (
        <div style={{
          ...styles.mensaje,
          backgroundColor: mensaje.tipo === 'success' ? '#dcfce7' : '#fee2e2',
          color: mensaje.tipo === 'success' ? '#166534' : '#991b1b',
          border: `1px solid ${mensaje.tipo === 'success' ? '#86efac' : '#fca5a5'}`
        }}>
          {mensaje.tipo === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {mensaje.texto}
        </div>
      )}

      {/* Header con gradient */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          {/* Avatar */}
          <div style={styles.avatarContainer}>
            <div style={styles.avatar}>
              {previewFoto ? (
                <img src={previewFoto} alt="Preview" style={styles.avatarImage} />
              ) : perfil.fotoUrl ? (
                <img src={perfil.fotoUrl} alt="Perfil" style={styles.avatarImage} />
              ) : (
                <span style={styles.avatarText}>
                  {perfil.nombres?.charAt(0)}{perfil.apellidos?.charAt(0)}
                </span>
              )}
              <label style={styles.avatarButton}>
                <Camera size={14} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFotoChange}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
            {previewFoto && (
              <button onClick={subirFoto} style={styles.uploadButton}>
                <Upload size={14} />
                Subir Foto
              </button>
            )}
          </div>

          {/* Info principal */}
          <div style={styles.userInfo}>
            <h1 style={styles.userName}>
              {perfil.nombres} {perfil.apellidos}
            </h1>
            <p style={styles.userPosition}>{perfil.cargo || 'Sin cargo asignado'}</p>
            <div style={styles.userMeta}>
              <span style={styles.metaItem}>
                <Building size={14} />
                {perfil.departamento}
              </span>
              <span style={styles.metaItem}>
                <Calendar size={14} />
                {perfil.fechaIngreso ? new Date(perfil.fechaIngreso).toLocaleDateString() : 'N/A'}
              </span>
              <span style={styles.metaItem}>
                <Star size={14} />
                {calcularAntiguedad(perfil.fechaIngreso)}
              </span>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        {estadisticas && (
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                <Briefcase size={20} />
              </div>
              <div style={styles.statContent}>
                <div style={styles.statLabel}>Experiencia</div>
                <div style={styles.statValue}>
                  {calcularAntiguedad(perfil.fechaIngreso)}
                </div>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                <CheckCircle size={20} />
              </div>
              <div style={styles.statContent}>
                <div style={styles.statLabel}>Estado</div>
                <div style={styles.statValue}>Activo</div>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                <Mail size={20} />
              </div>
              <div style={styles.statContent}>
                <div style={styles.statLabel}>Email</div>
                <div style={styles.statValue}>Verificado</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={styles.tabsContainer}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...styles.tab,
                ...(activeTab === tab.id ? styles.tabActive : {})
              }}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Contenido */}
      <div style={styles.content}>
        {activeTab === 'personal' && (
          <div>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Información Personal</h2>
                <p style={styles.sectionSubtitle}>
                  Gestiona tu información personal y de contacto
                </p>
              </div>
              {!editMode ? (
                <button onClick={() => setEditMode(true)} style={styles.buttonPrimary}>
                  <Edit size={16} />
                  Editar
                </button>
              ) : (
                <div style={styles.buttonGroup}>
                  <button
                    onClick={() => {
                      setEditMode(false);
                      setFormData({
                        telefono: perfil.telefono || '',
                        emailPersonal: perfil.emailPersonal || '',
                        direccion: perfil.direccion || ''
                      });
                    }}
                    style={styles.buttonSecondary}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={actualizarPerfil}
                    disabled={guardando}
                    style={styles.buttonSuccess}
                  >
                    <Save size={16} />
                    {guardando ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              )}
            </div>

            {/* Información Básica - Solo lectura */}
            <div style={styles.infoSection}>
              <h3 style={styles.infoSectionTitle}>Información Básica</h3>
              <div style={styles.infoGrid}>
                <div style={styles.infoField}>
                  <label style={styles.label}>Nombres</label>
                  <input
                    type="text"
                    value={perfil.nombres || ''}
                    disabled
                    style={styles.inputDisabled}
                  />
                </div>
                <div style={styles.infoField}>
                  <label style={styles.label}>Apellidos</label>
                  <input
                    type="text"
                    value={perfil.apellidos || ''}
                    disabled
                    style={styles.inputDisabled}
                  />
                </div>
                <div style={styles.infoField}>
                  <label style={styles.label}>Cédula</label>
                  <input
                    type="text"
                    value={perfil.cedula || ''}
                    disabled
                    style={styles.inputDisabled}
                  />
                </div>
                <div style={styles.infoField}>
                  <label style={styles.label}>Email Corporativo</label>
                  <input
                    type="email"
                    value={perfil.email || ''}
                    disabled
                    style={styles.inputDisabled}
                  />
                </div>
              </div>
            </div>

            {/* Información Editable */}
            <div style={styles.infoSection}>
              <h3 style={styles.infoSectionTitle}>Información de Contacto</h3>
              <div style={styles.infoGrid}>
                <div style={styles.infoField}>
                  <label style={styles.label}>Teléfono</label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                    disabled={!editMode}
                    style={editMode ? styles.input : styles.inputDisabled}
                    placeholder="(809) 000-0000"
                  />
                </div>
                <div style={styles.infoField}>
                  <label style={styles.label}>Email Personal</label>
                  <input
                    type="email"
                    value={formData.emailPersonal}
                    onChange={(e) => setFormData({...formData, emailPersonal: e.target.value})}
                    disabled={!editMode}
                    style={editMode ? styles.input : styles.inputDisabled}
                    placeholder="email@personal.com"
                  />
                </div>
                <div style={{...styles.infoField, gridColumn: '1 / -1'}}>
                  <label style={styles.label}>Dirección</label>
                  <textarea
                    value={formData.direccion}
                    onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                    disabled={!editMode}
                    style={{
                      ...(editMode ? styles.input : styles.inputDisabled),
                      resize: 'vertical',
                      minHeight: '80px'
                    }}
                    placeholder="Tu dirección completa"
                  />
                </div>
              </div>
            </div>

            {/* Información Laboral - Solo lectura */}
            <div style={styles.infoSection}>
              <h3 style={styles.infoSectionTitle}>Información Laboral</h3>
              <div style={styles.infoGrid}>
                <div style={styles.infoField}>
                  <label style={styles.label}>Departamento</label>
                  <input
                    type="text"
                    value={perfil.departamento || ''}
                    disabled
                    style={styles.inputDisabled}
                  />
                </div>
                <div style={styles.infoField}>
                  <label style={styles.label}>Cargo</label>
                  <input
                    type="text"
                    value={perfil.cargo || ''}
                    disabled
                    style={styles.inputDisabled}
                  />
                </div>
                <div style={styles.infoField}>
                  <label style={styles.label}>Fecha de Ingreso</label>
                  <input
                    type="text"
                    value={perfil.fechaIngreso ? new Date(perfil.fechaIngreso).toLocaleDateString() : ''}
                    disabled
                    style={styles.inputDisabled}
                  />
                </div>
                <div style={styles.infoField}>
                  <label style={styles.label}>Rol en el Sistema</label>
                  <input
                    type="text"
                    value={perfil.rol || ''}
                    disabled
                    style={styles.inputDisabled}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'seguridad' && (
          <div>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Configuración de Seguridad</h2>
                <p style={styles.sectionSubtitle}>
                  Gestiona la seguridad de tu cuenta
                </p>
              </div>
            </div>

            <div style={styles.infoSection}>
              <div style={styles.securityItem}>
                <div>
                  <h3 style={styles.securityTitle}>
                    <Key size={20} />
                    Cambiar Contraseña
                  </h3>
                  <p style={styles.securityDescription}>
                    Actualiza tu contraseña regularmente para mantener tu cuenta segura
                  </p>
                </div>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  style={styles.buttonPrimary}
                >
                  Cambiar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de cambio de contraseña */}
      {showPasswordModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Cambiar Contraseña</h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                style={styles.closeButton}
              >
                <X size={24} />
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Contraseña Actual *</label>
                <input
                  type="password"
                  value={passwordData.passwordActual}
                  onChange={(e) => setPasswordData({...passwordData, passwordActual: e.target.value})}
                  style={styles.input}
                  placeholder="Ingresa tu contraseña actual"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Nueva Contraseña *</label>
                <input
                  type="password"
                  value={passwordData.passwordNuevo}
                  onChange={(e) => setPasswordData({...passwordData, passwordNuevo: e.target.value})}
                  style={styles.input}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Confirmar Nueva Contraseña *</label>
                <input
                  type="password"
                  value={passwordData.passwordConfirmar}
                  onChange={(e) => setPasswordData({...passwordData, passwordConfirmar: e.target.value})}
                  style={styles.input}
                  placeholder="Repite la nueva contraseña"
                />
              </div>

              <div style={styles.passwordHelp}>
                <p style={{margin: 0, fontWeight: '600', marginBottom: '8px'}}>
                  La contraseña debe tener:
                </p>
                <ul style={{margin: 0, paddingLeft: '20px'}}>
                  <li>Al menos 6 caracteres</li>
                  <li>Se recomienda usar mayúsculas, minúsculas y números</li>
                </ul>
              </div>

              <div style={styles.modalActions}>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  style={styles.buttonSecondary}
                >
                  Cancelar
                </button>
                <button
                  onClick={cambiarPassword}
                  disabled={guardando}
                  style={styles.buttonSuccess}
                >
                  {guardando ? 'Cambiando...' : 'Cambiar Contraseña'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    padding: '24px'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '400px',
    gap: '16px'
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '400px',
    gap: '16px',
    color: '#6b7280'
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #f3f3f3',
    borderTop: '3px solid #2563eb',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  mensaje: {
    position: 'fixed',
    top: '24px',
    right: '24px',
    padding: '16px 24px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    zIndex: 1000,
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    maxWidth: '400px'
  },
  header: {
    background: 'linear-gradient(135deg, #0f38ecff 0%, #4b71a2ff 100%)',
    borderRadius: '12px',
    padding: '32px',
    color: 'white',
    marginBottom: '24px'
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '32px',
    marginBottom: '24px'
  },
  avatarContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  avatar: {
    position: 'relative',
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2.5rem',
    fontWeight: 'bold',
    overflow: 'hidden'
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  avatarText: {
    color: 'white'
  },
  avatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
    border: '3px solid white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'white'
  },
  uploadButton: {
    padding: '8px 16px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    justifyContent: 'center'
  },
  userInfo: {
    flex: 1
  },
  userName: {
    fontSize: '32px',
    fontWeight: 'bold',
    margin: 0,
    marginBottom: '8px'
  },
  userPosition: {
    fontSize: '18px',
    opacity: 0.9,
    margin: 0,
    marginBottom: '16px'
  },
  userMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    fontSize: '14px',
    opacity: 0.8
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px'
  },
  statCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: '16px',
    borderRadius: '8px',
    display: 'flex',
    gap: '12px'
  },
  statIcon: {
    width: '40px',
    height: '40px',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  statContent: {
    flex: 1
  },
  statLabel: {
    fontSize: '14px',
    opacity: 0.9,
    marginBottom: '4px'
  },
  statValue: {
    fontSize: '18px',
    fontWeight: 'bold'
  },
  tabsContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '8px',
    display: 'flex',
    gap: '8px',
    marginBottom: '24px'
  },
  tab: {
    flex: 1,
    padding: '12px 24px',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#6b7280',
    transition: 'all 0.2s'
  },
  tabActive: {
    backgroundColor: '#2563eb',
    color: 'white'
  },
  content: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '32px'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px'
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: 0,
    marginBottom: '4px'
  },
  sectionSubtitle: {
    color: '#6b7280',
    margin: 0
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px'
  },
  buttonPrimary: {
    padding: '10px 20px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  buttonSecondary: {
    padding: '10px 20px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  buttonSuccess: {
    padding: '10px 20px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
 infoSection: {
    backgroundColor: '#f9fafb',
    padding: '24px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    marginBottom: '24px'
  },
  infoSectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '2px solid #e5e7eb'
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px'
  },
  infoField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151'
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: 'white'
  },
  inputDisabled: {
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: '#f9fafb',
    color: '#6b7280'
  },
  securityItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e5e7eb'
  },
  securityTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  securityDescription: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '24px'
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '12px',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto'
  },
  modalHeader: {
    padding: '24px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: 0
  },
  closeButton: {
    padding: '4px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    color: '#6b7280'
  },
  modalBody: {
    padding: '24px'
  },
  formGroup: {
    marginBottom: '20px'
  },
  passwordHelp: {
    backgroundColor: '#f3f4f6',
    padding: '16px',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#6b7280',
    marginTop: '16px'
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px',
    paddingTop: '24px',
    borderTop: '1px solid #e5e7eb'
  },
  css: `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    button:hover:not(:disabled) {
      opacity: 0.9;
      transform: translateY(-1px);
    }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    input:focus, textarea:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
  `
};

export default PerfilModule;