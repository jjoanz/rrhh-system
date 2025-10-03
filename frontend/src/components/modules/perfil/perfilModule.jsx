import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, MapPin, Calendar, Briefcase, 
  Settings, Bell, Camera, Save, Edit, X, Shield,
  Building, Star, CheckCircle, AlertCircle, Key, Upload,
  GraduationCap, FileText, Target, Activity, TrendingUp,
  Award, Globe, Plus, Trash2, Eye, Download, DollarSign, Clock
} from 'lucide-react';

const PerfilModule = () => {
  const [perfil, setPerfil] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  
  const [formData, setFormData] = useState({
    telefono: '',
    emailPersonal: '',
    direccion: '',
    biografia: '',
    habilidades: [],
    idiomas: []
  });

  const [passwordData, setPasswordData] = useState({
    passwordActual: '',
    passwordNuevo: '',
    passwordConfirmar: ''
  });

  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [previewFoto, setPreviewFoto] = useState(null);
  const [historialLaboral, setHistorialLaboral] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [objetivos, setObjetivos] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [configuracion, setConfiguracion] = useState({
    notificaciones: {},
    privacidad: {},
    preferencias: {}
  });

  const [showAddExperience, setShowAddExperience] = useState(false);
  const [showAddObjetivo, setShowAddObjetivo] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [newExperience, setNewExperience] = useState({
    empresa: '',
    cargo: '',
    departamento: '',
    fechaInicio: '',
    fechaFin: '',
    descripcion: '',
    logros: ['']
  });

  const [newObjetivo, setNewObjetivo] = useState({
    titulo: '',
    descripcion: '',
    categoria: '',
    fechaInicio: '',
    fechaObjetivo: '',
    prioridad: 'Media'
  });

  const API_URL = process.env.REACT_APP_API_URL || 'http://192.168.0.239:5000/api';
  const getToken = () => localStorage.getItem('rrhh_token');

  useEffect(() => {
    cargarPerfil();
    cargarHistorialLaboral();
    cargarDocumentos();
    cargarObjetivos();
    cargarActividades();
    cargarConfiguracion();
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

      if (!response.ok) throw new Error('Error al cargar perfil');

      const data = await response.json();
      setPerfil(data.perfil);
      setFormData({
        telefono: data.perfil.telefono || '',
        emailPersonal: data.perfil.emailPersonal || '',
        direccion: data.perfil.direccion || '',
        biografia: data.perfil.biografia || '',
        habilidades: data.perfil.habilidades || [],
        idiomas: data.perfil.idiomas || []
      });

    } catch (error) {
      console.error('Error cargando perfil:', error);
      mostrarMensaje('error', 'Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const cargarHistorialLaboral = async () => {
    try {
      const response = await fetch(`${API_URL}/perfil/historial-laboral`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (response.ok) {
        const data = await response.json();
        setHistorialLaboral(data.historial || []);
      }
    } catch (error) {
      console.error('Error cargando historial:', error);
    }
  };

  const cargarDocumentos = async () => {
    try {
      const response = await fetch(`${API_URL}/perfil/documentos`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDocumentos(data.documentos || []);
      }
    } catch (error) {
      console.error('Error cargando documentos:', error);
    }
  };

  const cargarObjetivos = async () => {
    try {
      const response = await fetch(`${API_URL}/perfil/objetivos`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (response.ok) {
        const data = await response.json();
        setObjetivos(data.objetivos || []);
      }
    } catch (error) {
      console.error('Error cargando objetivos:', error);
    }
  };

  const cargarActividades = async () => {
    try {
      const response = await fetch(`${API_URL}/perfil/actividades`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (response.ok) {
        const data = await response.json();
        setActividades(data.actividades || []);
      }
    } catch (error) {
      console.error('Error cargando actividades:', error);
    }
  };

  const cargarConfiguracion = async () => {
    try {
      const response = await fetch(`${API_URL}/perfil/configuracion`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (response.ok) {
        const data = await response.json();
        setConfiguracion(data.configuracion || {
          notificaciones: {},
          privacidad: {},
          preferencias: {}
        });
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
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

      if (!response.ok) throw new Error('Error al actualizar perfil');

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
      reader.onloadend = () => setPreviewFoto(reader.result);
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
        headers: { 'Authorization': `Bearer ${getToken()}` },
        body: formData
      });

      if (!response.ok) throw new Error('Error al subir foto');

      await cargarPerfil();
      setFotoPerfil(null);
      setPreviewFoto(null);
      mostrarMensaje('success', '¡Foto actualizada exitosamente!');

    } catch (error) {
      console.error('Error subiendo foto:', error);
      mostrarMensaje('error', 'Error al subir la foto');
    }
  };

  const handleFileUpload = async (files) => {
    const formData = new FormData();
    Array.from(files).forEach(file => formData.append('documentos', file));

    try {
      const response = await fetch(`${API_URL}/perfil/documentos`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` },
        body: formData
      });

      if (!response.ok) throw new Error('Error al subir documentos');

      await cargarDocumentos();
      mostrarMensaje('success', 'Documentos subidos exitosamente');

    } catch (error) {
      console.error('Error subiendo documentos:', error);
      mostrarMensaje('error', 'Error al subir documentos');
    }
  };

  const handleDeleteDocumento = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este documento?')) return;

    try {
      const response = await fetch(`${API_URL}/perfil/documentos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });

      if (!response.ok) throw new Error('Error al eliminar documento');

      await cargarDocumentos();
      mostrarMensaje('success', 'Documento eliminado');

    } catch (error) {
      console.error('Error eliminando documento:', error);
      mostrarMensaje('error', 'Error al eliminar documento');
    }
  };

  const handleAddExperience = async () => {
    try {
      const response = await fetch(`${API_URL}/perfil/historial-laboral`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newExperience)
      });

      if (!response.ok) throw new Error('Error al agregar experiencia');

      await cargarHistorialLaboral();
      setNewExperience({
        empresa: '',
        cargo: '',
        departamento: '',
        fechaInicio: '',
        fechaFin: '',
        descripcion: '',
        logros: ['']
      });
      setShowAddExperience(false);
      mostrarMensaje('success', 'Experiencia agregada exitosamente');

    } catch (error) {
      console.error('Error agregando experiencia:', error);
      mostrarMensaje('error', 'Error al agregar experiencia');
    }
  };

  const handleAddObjetivo = async () => {
    try {
      const response = await fetch(`${API_URL}/perfil/objetivos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newObjetivo)
      });

      if (!response.ok) throw new Error('Error al agregar objetivo');

      await cargarObjetivos();
      setNewObjetivo({
        titulo: '',
        descripcion: '',
        categoria: '',
        fechaInicio: '',
        fechaObjetivo: '',
        prioridad: 'Media'
      });
      setShowAddObjetivo(false);
      mostrarMensaje('success', 'Objetivo agregado exitosamente');

    } catch (error) {
      console.error('Error agregando objetivo:', error);
      mostrarMensaje('error', 'Error al agregar objetivo');
    }
  };

  const handleUpdateProgreso = async (id, progreso) => {
    try {
      const response = await fetch(`${API_URL}/perfil/objetivos/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ progreso })
      });

      if (!response.ok) throw new Error('Error al actualizar progreso');

      await cargarObjetivos();
      mostrarMensaje('success', 'Progreso actualizado');

    } catch (error) {
      console.error('Error actualizando progreso:', error);
      mostrarMensaje('error', 'Error al actualizar progreso');
    }
  };

  const actualizarConfiguracion = async (seccion, config) => {
    try {
      const response = await fetch(`${API_URL}/perfil/configuracion`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ seccion, config })
      });

      if (!response.ok) throw new Error('Error al actualizar configuración');

      await cargarConfiguracion();
      mostrarMensaje('success', 'Configuración actualizada');

    } catch (error) {
      console.error('Error actualizando configuración:', error);
      mostrarMensaje('error', 'Error al actualizar configuración');
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
    { id: 'laboral', label: 'Historial Laboral', icon: Briefcase },
    { id: 'documentos', label: 'Documentos', icon: FileText },
    { id: 'objetivos', label: 'Objetivos y Metas', icon: Target },
    { id: 'actividad', label: 'Timeline', icon: Activity },
    { id: 'configuracion', label: 'Configuración', icon: Settings }
  ];

  return (
    <div style={styles.container}>
      <style>{styles.css}</style>

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

      <div style={styles.header}>
        <div style={styles.headerContent}>
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
                <input type="file" accept="image/*" onChange={handleFotoChange} style={{ display: 'none' }} />
              </label>
            </div>
            {previewFoto && (
              <button onClick={subirFoto} style={styles.uploadButton}>
                <Upload size={14} />
                Subir Foto
              </button>
            )}
          </div>

          <div style={styles.userInfo}>
            <h1 style={styles.userName}>{perfil.nombres} {perfil.apellidos}</h1>
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

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}><Target size={20} /></div>
            <div style={styles.statContent}>
              <div style={styles.statLabel}>Objetivos Activos</div>
              <div style={styles.statValue}>{objetivos.filter(o => o.estado === 'En progreso').length}</div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}><TrendingUp size={20} /></div>
            <div style={styles.statContent}>
              <div style={styles.statLabel}>Progreso Promedio</div>
              <div style={styles.statValue}>
                {objetivos.length > 0 ? Math.round(objetivos.reduce((acc, obj) => acc + obj.progreso, 0) / objetivos.length) : 0}%
              </div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}><FileText size={20} /></div>
            <div style={styles.statContent}>
              <div style={styles.statLabel}>Documentos</div>
              <div style={styles.statValue}>{documentos.length}</div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}><Star size={20} /></div>
            <div style={styles.statContent}>
              <div style={styles.statLabel}>Experiencia</div>
              <div style={styles.statValue}>{calcularAntiguedad(perfil.fechaIngreso)}</div>
            </div>
          </div>
        </div>
      </div>

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

      <div style={styles.content}>
        {activeTab === 'personal' && (
          <InformacionPersonal
            perfil={perfil}
            formData={formData}
            setFormData={setFormData}
            editMode={editMode}
            setEditMode={setEditMode}
            onSave={actualizarPerfil}
            guardando={guardando}
          />
        )}

        {activeTab === 'laboral' && (
          <HistorialLaboral
            historial={historialLaboral}
            showAddForm={showAddExperience}
            setShowAddForm={setShowAddExperience}
            newExperience={newExperience}
            setNewExperience={setNewExperience}
            onAdd={handleAddExperience}
          />
        )}

        {activeTab === 'documentos' && (
          <GestionDocumentos
            documentos={documentos}
            onUpload={handleFileUpload}
            onDelete={handleDeleteDocumento}
            dragOver={dragOver}
            setDragOver={setDragOver}
          />
        )}

        {activeTab === 'objetivos' && (
          <ObjetivosYMetas
            objetivos={objetivos}
            showAddForm={showAddObjetivo}
            setShowAddForm={setShowAddObjetivo}
            newObjetivo={newObjetivo}
            setNewObjetivo={setNewObjetivo}
            onAdd={handleAddObjetivo}
            onUpdateProgreso={handleUpdateProgreso}
          />
        )}

        {activeTab === 'actividad' && (
          <TimelineActividad actividades={actividades} />
        )}

        {activeTab === 'configuracion' && (
          <ConfiguracionPerfil
            configuracion={configuracion}
            onUpdate={actualizarConfiguracion}
            showPasswordModal={showPasswordModal}
            setShowPasswordModal={setShowPasswordModal}
            passwordData={passwordData}
            setPasswordData={setPasswordData}
            cambiarPassword={cambiarPassword}
            guardando={guardando}
          />
        )}
      </div>
    </div>
  );
};

// COMPONENTES INTERNOS

const InformacionPersonal = ({ perfil, formData, setFormData, editMode, setEditMode, onSave, guardando }) => {
  return (
    <div>
      <div style={styles.sectionHeader}>
        <div>
          <h2 style={styles.sectionTitle}>Información Personal</h2>
          <p style={styles.sectionSubtitle}>Gestiona tu información personal y de contacto</p>
        </div>
        {!editMode ? (
          <button onClick={() => setEditMode(true)} style={styles.buttonPrimary}>
            <Edit size={16} />
            Editar
          </button>
        ) : (
          <div style={styles.buttonGroup}>
            <button onClick={() => setEditMode(false)} style={styles.buttonSecondary}>
              Cancelar
            </button>
            <button onClick={onSave} disabled={guardando} style={styles.buttonSuccess}>
              <Save size={16} />
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        )}
      </div>

      <div style={styles.infoSection}>
        <h3 style={styles.infoSectionTitle}>Información Básica</h3>
        <div style={styles.infoGrid}>
          <div style={styles.infoField}>
            <label style={styles.label}>Nombres</label>
            <input type="text" value={perfil.nombres || ''} disabled style={styles.inputDisabled} />
          </div>
          <div style={styles.infoField}>
            <label style={styles.label}>Apellidos</label>
            <input type="text" value={perfil.apellidos || ''} disabled style={styles.inputDisabled} />
          </div>
          <div style={styles.infoField}>
            <label style={styles.label}>Cédula</label>
            <input type="text" value={perfil.cedula || ''} disabled style={styles.inputDisabled} />
          </div>
          <div style={styles.infoField}>
            <label style={styles.label}>Email Corporativo</label>
            <input type="email" value={perfil.email || ''} disabled style={styles.inputDisabled} />
          </div>
        </div>
      </div>

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

      <div style={styles.infoSection}>
        <h3 style={styles.infoSectionTitle}>Información Laboral</h3>
        <div style={styles.infoGrid}>
          <div style={styles.infoField}>
            <label style={styles.label}>Departamento</label>
            <input type="text" value={perfil.departamento || ''} disabled style={styles.inputDisabled} />
          </div>
          <div style={styles.infoField}>
            <label style={styles.label}>Cargo</label>
            <input type="text" value={perfil.cargo || ''} disabled style={styles.inputDisabled} />
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
            <input type="text" value={perfil.rol || ''} disabled style={styles.inputDisabled} />
          </div>
        </div>
      </div>
    </div>
  );
};

const HistorialLaboral = ({ historial, showAddForm, setShowAddForm, newExperience, setNewExperience, onAdd }) => {
  return (
    <div>
      <div style={styles.sectionHeader}>
        <div>
          <h2 style={styles.sectionTitle}>Historial Laboral</h2>
          <p style={styles.sectionSubtitle}>Tu experiencia profesional y trayectoria laboral</p>
        </div>
        <button onClick={() => setShowAddForm(true)} style={styles.buttonSuccess}>
          <Plus size={16} />
          Agregar Experiencia
        </button>
      </div>

      <div style={{ position: 'relative', paddingLeft: '2rem' }}>
        <div style={{
          position: 'absolute',
          left: '1rem',
          top: '1rem',
          bottom: '1rem',
          width: '2px',
          backgroundColor: '#e5e7eb'
        }} />

        {historial.map((experiencia) => (
          <div key={experiencia.id} style={{ position: 'relative', marginBottom: '2rem' }}>
            <div style={{
              position: 'absolute',
              left: '-2rem',
              top: '1rem',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: experiencia.fechaFin ? '#6b7280' : '#10b981',
              border: '3px solid white',
              boxShadow: '0 0 0 3px #e5e7eb'
            }} />

            <div style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '1.5rem',
              marginLeft: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0, marginBottom: '0.25rem', color: '#1f2937' }}>
                    {experiencia.cargo}</h3>
                  <p style={{ fontSize: '1rem', fontWeight: '500', color: '#3b82f6', margin: 0, marginBottom: '0.25rem' }}>
                    {experiencia.empresa}
                  </p>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                    {experiencia.departamento}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: experiencia.fechaFin ? '#f3f4f6' : '#dcfce7',
                    color: experiencia.fechaFin ? '#6b7280' : '#065f46',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    marginBottom: '0.25rem'
                  }}>
                    {experiencia.fechaFin ? 'Finalizado' : 'Actual'}
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                    {new Date(experiencia.fechaInicio).toLocaleDateString()} - {experiencia.fechaFin ? new Date(experiencia.fechaFin).toLocaleDateString() : 'Presente'}
                  </p>
                </div>
              </div>

              <p style={{ color: '#6b7280', marginBottom: '1rem', lineHeight: '1.5' }}>
                {experiencia.descripcion}
              </p>

              {experiencia.logros && experiencia.logros.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                    Logros Destacados:
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#6b7280' }}>
                    {experiencia.logros.map((logro, idx) => (
                      <li key={idx} style={{ marginBottom: '0.25rem' }}>{logro}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {historial.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          <Briefcase size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <p>No hay experiencias laborales registradas</p>
        </div>
      )}

      {showAddForm && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Agregar Experiencia Laboral</h3>
              <button onClick={() => setShowAddForm(false)} style={styles.closeButton}>
                <X size={24} />
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Empresa *</label>
                    <input
                      type="text"
                      required
                      value={newExperience.empresa}
                      onChange={(e) => setNewExperience({ ...newExperience, empresa: e.target.value })}
                      style={styles.input}
                      placeholder="Nombre de la empresa"
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Cargo *</label>
                    <input
                      type="text"
                      required
                      value={newExperience.cargo}
                      onChange={(e) => setNewExperience({ ...newExperience, cargo: e.target.value })}
                      style={styles.input}
                      placeholder="Tu cargo o posición"
                    />
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Departamento</label>
                  <input
                    type="text"
                    value={newExperience.departamento}
                    onChange={(e) => setNewExperience({ ...newExperience, departamento: e.target.value })}
                    style={styles.input}
                    placeholder="Departamento o área"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Fecha de Inicio *</label>
                    <input
                      type="date"
                      required
                      value={newExperience.fechaInicio}
                      onChange={(e) => setNewExperience({ ...newExperience, fechaInicio: e.target.value })}
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Fecha de Fin</label>
                    <input
                      type="date"
                      value={newExperience.fechaFin}
                      onChange={(e) => setNewExperience({ ...newExperience, fechaFin: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Descripción *</label>
                  <textarea
                    required
                    value={newExperience.descripcion}
                    onChange={(e) => setNewExperience({ ...newExperience, descripcion: e.target.value })}
                    rows={3}
                    style={{...styles.input, resize: 'vertical'}}
                    placeholder="Describe tus responsabilidades..."
                  />
                </div>

                <div style={styles.formGroup}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={styles.label}>Logros Destacados</label>
                    <button
                      type="button"
                      onClick={() => setNewExperience({ 
                        ...newExperience, 
                        logros: [...newExperience.logros, ''] 
                      })}
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  
                  {newExperience.logros.map((logro, index) => (
                    <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input
                        type="text"
                        value={logro}
                        onChange={(e) => {
                          const nuevosLogros = [...newExperience.logros];
                          nuevosLogros[index] = e.target.value;
                          setNewExperience({ ...newExperience, logros: nuevosLogros });
                        }}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '0.875rem'
                        }}
                        placeholder="Describe un logro..."
                      />
                      {newExperience.logros.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const nuevosLogros = newExperience.logros.filter((_, i) => i !== index);
                            setNewExperience({ ...newExperience, logros: nuevosLogros });
                          }}
                          style={{
                            padding: '0.5rem',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.modalActions}>
                <button onClick={() => setShowAddForm(false)} style={styles.buttonSecondary}>
                  Cancelar
                </button>
                <button onClick={onAdd} style={styles.buttonSuccess}>
                  Agregar Experiencia
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const GestionDocumentos = ({ documentos, onUpload, onDelete, dragOver, setDragOver }) => {
  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Vigente': return '#10b981';
      case 'Por Vencer': return '#f59e0b';
      case 'Vencido': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'Curriculum Vitae': return FileText;
      case 'Cédula de Identidad': return User;
      case 'Certificado Universitario': return GraduationCap;
      case 'Certificado de Capacitación': return Award;
      default: return FileText;
    }
  };

  return (
    <div>
      <div style={styles.sectionHeader}>
        <div>
          <h2 style={styles.sectionTitle}>Gestión de Documentos</h2>
          <p style={styles.sectionSubtitle}>Administra tus documentos personales y profesionales</p>
        </div>
      </div>

      <div 
        style={{
          border: `2px dashed ${dragOver ? '#3b82f6' : '#d1d5db'}`,
          borderRadius: '8px',
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: dragOver ? '#eff6ff' : '#f9fafb',
          marginBottom: '2rem',
          transition: 'all 0.2s'
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          onUpload(e.dataTransfer.files);
        }}
      >
        <Upload size={48} style={{ margin: '0 auto 1rem', color: '#6b7280' }} />
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
          Subir Documentos
        </h3>
        <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
          Arrastra archivos aquí o haz clic para seleccionar
        </p>
        <input
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          onChange={(e) => onUpload(e.target.files)}
          style={{ display: 'none' }}
          id="file-upload"
        />
        <label htmlFor="file-upload" style={styles.buttonPrimary}>
          Seleccionar Archivos
        </label>
        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
          Formatos soportados: PDF, DOC, DOCX, JPG, PNG (Max. 10MB)
        </p>
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {documentos.map((documento) => {
          const TipoIcon = getTipoIcon(documento.tipo);
          return (
            <div key={documento.id} style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '1.5rem',
              backgroundColor: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '8px',
                backgroundColor: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TipoIcon size={24} style={{ color: '#3b82f6' }} />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: 0, marginBottom: '0.25rem', color: '#1f2937' }}>
                      {documento.nombre}
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                      {documento.tipo}
                    </p>
                  </div>
                  <div style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: getEstadoColor(documento.estado),
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    {documento.estado}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                  <span>Subido: {new Date(documento.fechaSubida).toLocaleDateString()}</span>
                  <span>Tamaño: {documento.tamaño}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  style={{
                    padding: '0.5rem',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                  title="Ver documento"
                >
                  <Eye size={16} />
                </button>
                <button
                  style={{
                    padding: '0.5rem',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                  title="Descargar"
                >
                  <Download size={16} />
                </button>
                <button
                  onClick={() => onDelete(documento.id)}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {documentos.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <p>No tienes documentos subidos aún</p>
        </div>
      )}
    </div>
  );
};

const ObjetivosYMetas = ({ objetivos, showAddForm, setShowAddForm, newObjetivo, setNewObjetivo, onAdd, onUpdateProgreso }) => {
  const categorias = ['Profesional', 'Capacitación', 'Desarrollo Personal', 'Técnico', 'Liderazgo', 'Otro'];
  const prioridades = ['Baja', 'Media', 'Alta'];

  const getPrioridadColor = (prioridad) => {
    switch (prioridad) {
      case 'Baja': return '#6b7280';
      case 'Media': return '#f59e0b';
      case 'Alta': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'En progreso': return '#3b82f6';
      case 'Completado': return '#10b981';
      case 'Pausado': return '#f59e0b';
      case 'Cancelado': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div>
      <div style={styles.sectionHeader}>
        <div>
          <h2 style={styles.sectionTitle}>Objetivos y Metas</h2>
          <p style={styles.sectionSubtitle}>Define y da seguimiento a tus objetivos</p>
        </div>
        <button onClick={() => setShowAddForm(true)} style={styles.buttonSuccess}>
          <Plus size={16} />
          Nuevo Objetivo
        </button>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '1rem', 
        marginBottom: '2rem' 
      }}>
        <div style={{ backgroundColor: '#eff6ff', padding: '1rem', borderRadius: '8px', border: '1px solid #3b82f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Target size={20} style={{ color: '#3b82f6' }} />
            <span style={{ fontSize: '0.875rem', color: '#1e40af' }}>En Progreso</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e40af' }}>
            {objetivos.filter(o => o.estado === 'En progreso').length}
          </div>
        </div>

        <div style={{ backgroundColor: '#ecfdf5', padding: '1rem', borderRadius: '8px', border: '1px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <CheckCircle size={20} style={{ color: '#10b981' }} />
            <span style={{ fontSize: '0.875rem', color: '#065f46' }}>Completados</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#065f46' }}>
            {objetivos.filter(o => o.estado === 'Completado').length}
          </div>
        </div>

        <div style={{ backgroundColor: '#fef3c7', padding: '1rem', borderRadius: '8px', border: '1px solid #f59e0b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <TrendingUp size={20} style={{ color: '#f59e0b' }} />
            <span style={{ fontSize: '0.875rem', color: '#92400e' }}>Progreso Promedio</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#92400e' }}>
            {objetivos.length > 0 ? Math.round(objetivos.reduce((acc, obj) => acc + obj.progreso, 0) / objetivos.length) : 0}%
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {objetivos.map((objetivo) => (
          <div key={objetivo.id} style={{
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '1.5rem',
            backgroundColor: 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0, color: '#1f2937' }}>
                    {objetivo.titulo}
                  </h3>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: getPrioridadColor(objetivo.prioridad),
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    {objetivo.prioridad}
                  </span>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: getEstadoColor(objetivo.estado),
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    {objetivo.estado}
                  </span>
                </div>

                <p style={{ color: '#6b7280', marginBottom: '1rem', lineHeight: '1.5' }}>
                  {objetivo.descripcion}
                </p>

                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
                  <span><strong>Categoría:</strong> {objetivo.categoria}</span>
                  <span><strong>Inicio:</strong> {new Date(objetivo.fechaInicio).toLocaleDateString()}</span>
                  <span><strong>Meta:</strong> {new Date(objetivo.fechaObjetivo).toLocaleDateString()}</span>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                      Progreso
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                      {objetivo.progreso}%
                    </span>
                  </div>
                  <div style={{ 
                    width: '100%', 
                    height: '8px', 
                    backgroundColor: '#e5e7eb', 
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${objetivo.progreso}%`,
                      height: '100%',
                      backgroundColor: objetivo.progreso >= 100 ? '#10b981' : '#3b82f6',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <label style={{ fontSize: '0.875rem', color: '#374151' }}>
                    Actualizar progreso:
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={objetivo.progreso}
                    onChange={(e) => onUpdateProgreso(objetivo.id, parseInt(e.target.value))}
                    style={{ flex: 1 }}
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={objetivo.progreso}
                    onChange={(e) => onUpdateProgreso(objetivo.id, parseInt(e.target.value) || 0)}
                    style={{
                      width: '60px',
                      padding: '0.25rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      textAlign: 'center'
                    }}
                  />
                  <span style={{ fontSize: '0.875rem', color: '#374151' }}>%</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {objetivos.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          <Target size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <p>No tienes objetivos definidos aún</p>
        </div>
      )}

      {showAddForm && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Nuevo Objetivo</h3>
              <button onClick={() => setShowAddForm(false)} style={styles.closeButton}>
                <X size={24} />
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Título del Objetivo *</label>
                  <input
                    type="text"
                    required
                    value={newObjetivo.titulo}
                    onChange={(e) => setNewObjetivo({ ...newObjetivo, titulo: e.target.value })}
                    style={styles.input}
                    placeholder="ej. Obtener certificación"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Descripción *</label>
                  <textarea
                    required
                    value={newObjetivo.descripcion}
                    onChange={(e) => setNewObjetivo({ ...newObjetivo, descripcion: e.target.value })}
                    rows={3}
                    style={{...styles.input, resize: 'vertical'}}
                    placeholder="Describe tu objetivo..."
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Categoría *</label>
                    <select
                      required
                      value={newObjetivo.categoria}
                      onChange={(e) => setNewObjetivo({ ...newObjetivo, categoria: e.target.value })}
                      style={styles.input}
                    >
                      <option value="">Seleccionar</option>
                      {categorias.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Prioridad *</label>
                    <select
                      required
                      value={newObjetivo.prioridad}
                      onChange={(e) => setNewObjetivo({ ...newObjetivo, prioridad: e.target.value })}
                      style={styles.input}
                    >
                      {prioridades.map(pri => (
                        <option key={pri} value={pri}>{pri}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Fecha de Inicio *</label>
                    <input
                      type="date"
                      required
                      value={newObjetivo.fechaInicio}
                      onChange={(e) => setNewObjetivo({ ...newObjetivo, fechaInicio: e.target.value })}
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Fecha Objetivo *</label>
                    <input
                      type="date"
                      required
                      value={newObjetivo.fechaObjetivo}
                      onChange={(e) => setNewObjetivo({ ...newObjetivo, fechaObjetivo: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                </div>
              </div>

              <div style={styles.modalActions}>
                <button onClick={() => setShowAddForm(false)} style={styles.buttonSecondary}>
                  Cancelar
                </button>
                <button onClick={onAdd} style={styles.buttonSuccess}>
                  Crear Objetivo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TimelineActividad = ({ actividades }) => {
  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'Perfil': return User;
      case 'Vacaciones': return Calendar;
      case 'Capacitación': return GraduationCap;
      case 'Documentos': return FileText;
      case 'Objetivo': return Target;
      case 'Nomina': return DollarSign;
      case 'Asistencia': return Clock;
      default: return Activity;
    }
  };

  const getTipoColor = (tipo) => {
    switch (tipo) {
      case 'Perfil': return '#3b82f6';
      case 'Vacaciones': return '#10b981';
      case 'Capacitación': return '#8b5cf6';
      case 'Documentos': return '#f59e0b';
      case 'Objetivo': return '#ef4444';
      case 'Nomina':return '#06b6d4';
      case 'Asistencia': return '#84cc16';
      default: return '#6b7280';
    }
  };

  return (
    <div>
      <div style={styles.sectionHeader}>
        <div>
          <h2 style={styles.sectionTitle}>Timeline de Actividad</h2>
          <p style={styles.sectionSubtitle}>Historial de todas tus actividades</p>
        </div>
      </div>

      <div style={{ position: 'relative', paddingLeft: '2rem' }}>
        <div style={{
          position: 'absolute',
          left: '1rem',
          top: '1rem',
          bottom: '1rem',
          width: '2px',
          backgroundColor: '#e5e7eb'
        }} />

        {actividades.map((actividad) => {
          const TipoIcon = getTipoIcon(actividad.tipo);
          const tipoColor = getTipoColor(actividad.tipo);
          
          return (
            <div key={actividad.id} style={{ position: 'relative', marginBottom: '1.5rem' }}>
              <div style={{
                position: 'absolute',
                left: '-1.75rem',
                top: '0.5rem',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: tipoColor,
                border: '3px solid white',
                boxShadow: '0 0 0 3px #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TipoIcon size={14} style={{ color: 'white' }} />
              </div>

              <div style={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '1rem',
                marginLeft: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: '600', margin: 0, marginBottom: '0.25rem', color: '#1f2937' }}>
                      {actividad.accion}
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                      {actividad.detalles}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: tipoColor,
                      color: 'white',
                      borderRadius: '8px',
                      fontSize: '0.625rem',
                      fontWeight: '600',
                      marginBottom: '0.25rem'
                    }}>
                      {actividad.tipo}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                      {new Date(actividad.fecha).toLocaleDateString()} • {actividad.hora}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {actividades.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          <Activity size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <p>No hay actividades registradas</p>
        </div>
      )}
    </div>
  );
};

const ConfiguracionPerfil = ({ configuracion, onUpdate, showPasswordModal, setShowPasswordModal, passwordData, setPasswordData, cambiarPassword, guardando }) => {
  const Toggle = ({ checked, onChange }) => (
    <button
      onClick={onChange}
      style={{
        position: 'relative',
        width: '48px',
        height: '24px',
        borderRadius: '12px',
        border: 'none',
        backgroundColor: checked ? '#10b981' : '#d1d5db',
        cursor: 'pointer',
        transition: 'background-color 0.2s'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '2px',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: 'white',
          left: checked ? '26px' : '2px',
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
        }}
      />
    </button>
  );

  const handleToggle = (seccion, campo) => {
    const nuevaConfig = {
      ...configuracion[seccion],
      [campo]: !configuracion[seccion][campo]
    };
    onUpdate(seccion, nuevaConfig);
  };

  const secciones = [
    {
      id: 'notificaciones',
      titulo: 'Configuración de Notificaciones',
      descripcion: 'Gestiona cómo y cuándo recibir notificaciones',
      icon: Bell,
      campos: [
        { key: 'email', label: 'Notificaciones por Email', tipo: 'toggle' },
        { key: 'push', label: 'Notificaciones Push', tipo: 'toggle' },
        { key: 'vacaciones', label: 'Notificaciones de Vacaciones', tipo: 'toggle' },
        { key: 'nomina', label: 'Notificaciones de Nómina', tipo: 'toggle' },
        { key: 'capacitacion', label: 'Notificaciones de Capacitación', tipo: 'toggle' }
      ]
    },
    {
      id: 'privacidad',
      titulo: 'Configuración de Privacidad',
      descripcion: 'Controla la visibilidad de tu información',
      icon: Shield,
      campos: [
        { key: 'perfilPublico', label: 'Perfil Público Visible', tipo: 'toggle' },
        { key: 'mostrarEmail', label: 'Mostrar Email', tipo: 'toggle' },
        { key: 'mostrarTelefono', label: 'Mostrar Teléfono', tipo: 'toggle' }
      ]
    }
  ];

  return (
    <div>
      <div style={styles.sectionHeader}>
        <div>
          <h2 style={styles.sectionTitle}>Configuración del Perfil</h2>
          <p style={styles.sectionSubtitle}>Personaliza tu experiencia</p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '2rem' }}>
        {secciones.map((seccion) => {
          const Icon = seccion.icon;
          return (
            <div key={seccion.id} style={styles.infoSection}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <Icon size={24} style={{ color: '#3b82f6' }} />
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0, color: '#374151' }}>
                    {seccion.titulo}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                    {seccion.descripcion}
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '1rem' }}>
                {seccion.campos.map((campo) => (
                  <div key={campo.key} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    backgroundColor: 'white',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                      {campo.label}
                    </label>
                    <Toggle
                      checked={configuracion[seccion.id]?.[campo.key] || false}
                      onChange={() => handleToggle(seccion.id, campo.key)}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <div style={styles.infoSection}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Key size={24} style={{ color: '#3b82f6' }} />
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0, color: '#374151' }}>
                Seguridad
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                Gestiona la seguridad de tu cuenta
              </p>
            </div>
          </div>

          <div style={styles.securityItem}>
            <div>
              <h3 style={styles.securityTitle}>
                <Key size={20} />
                Cambiar Contraseña
              </h3>
              <p style={styles.securityDescription}>
                Actualiza tu contraseña regularmente
              </p>
            </div>
            <button onClick={() => setShowPasswordModal(true)} style={styles.buttonPrimary}>
              Cambiar
            </button>
          </div>
        </div>
      </div>

      {showPasswordModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Cambiar Contraseña</h3>
              <button onClick={() => setShowPasswordModal(false)} style={styles.closeButton}>
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
                  placeholder="Contraseña actual"
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
                  placeholder="Confirma la contraseña"
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
                <button onClick={() => setShowPasswordModal(false)} style={styles.buttonSecondary}>
                  Cancelar
                </button>
                <button onClick={cambiarPassword} disabled={guardando} style={styles.buttonSuccess}>
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

// ESTILOS
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
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
    marginBottom: '24px',
    flexWrap: 'wrap'
  },
  tab: {
    flex: '1 1 auto',
    padding: '12px 16px',
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
    transition: 'all 0.2s',
    minWidth: '120px'
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
    marginBottom: '32px',
    flexWrap: 'wrap',
    gap: '16px'
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
    maxWidth: '600px',
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
    input:focus, textarea:focus, select:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
  `
};

export default PerfilModule;