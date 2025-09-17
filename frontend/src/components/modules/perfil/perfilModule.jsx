import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Briefcase, 
  GraduationCap, 
  FileText, 
  Settings, 
  Bell, 
  Target, 
  Clock, 
  Award, 
  Upload, 
  Download, 
  Edit, 
  Save, 
  Camera,
  Shield,
  Key,
  Globe,
  Heart,
  Home,
  UserCheck,
  Building,
  Star,
  TrendingUp,
  Activity,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  DollarSign
} from 'lucide-react';

const PerfilModule = () => {
  // Simulando useAuth y useApp para la demo
  const user = { name: 'Juan', lastName: 'Pérez', email: 'juan.perez@empresa.com', department: 'Tecnología', position: 'Desarrollador Senior' };
  const addNotification = (message, type) => console.log(`${type}: ${message}`);
  
  const [activeTab, setActiveTab] = useState('personal');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});

  // Estados para las diferentes secciones
  const [perfilPersonal, setPerfilPersonal] = useState({});
  const [historialLaboral, setHistorialLaboral] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [configuracion, setConfiguracion] = useState({});
  const [objetivos, setObjetivos] = useState([]);
  const [actividades, setActividades] = useState([]);

  // Tabs de navegación
  const tabs = [
    { id: 'personal', label: 'Información Personal', icon: User },
    { id: 'laboral', label: 'Historial Laboral', icon: Briefcase },
    { id: 'documentos', label: 'Documentos', icon: FileText },
    { id: 'objetivos', label: 'Objetivos y Metas', icon: Target },
    { id: 'actividad', label: 'Timeline', icon: Activity },
    { id: 'configuracion', label: 'Configuración', icon: Settings }
  ];

  // Cargar datos del perfil
  useEffect(() => {
    // Datos personales del usuario actual
    const perfilEjemplo = {
      // Información básica
      nombres: user?.name || '',
      apellidos: user?.lastName || '',
      cedula: '001-1234567-8',
      fechaNacimiento: '1990-05-15',
      genero: 'Masculino',
      estadoCivil: 'Soltero',
      nacionalidad: 'Dominicana',
      
      // Contacto
      email: user?.email || '',
      emailPersonal: 'personal@email.com',
      telefonoOficina: '(809) 555-0100',
      telefonoPersonal: '(809) 555-0101',
      telefonoEmergencia: '(809) 555-0102',
      
      // Dirección
      direccion: 'Calle Principal #123',
      sector: 'Zona Colonial',
      ciudad: 'Santo Domingo',
      provincia: 'Distrito Nacional',
      codigoPostal: '10210',
      
      // Información laboral
      empleadoDesde: '2022-01-15',
      departamento: user?.department || '',
      posicion: user?.position || '',
      supervisor: 'María González',
      ubicacionOficina: 'Edificio Principal - Piso 3',
      
      // Emergencia
      contactoEmergenciaNombre: 'Ana Pérez',
      contactoEmergenciaRelacion: 'Madre',
      contactoEmergenciaTelefono: '(809) 555-0102',
      
      // Educación
      nivelEducacion: 'Universitario',
      institucionEducativa: 'Universidad Autónoma de Santo Domingo',
      tituloObtenido: 'Ingeniero en Sistemas',
      anioGraduacion: '2015',
      
      // Información adicional
      biografia: 'Profesional con más de 8 años de experiencia en desarrollo de software y gestión de proyectos tecnológicos.',
      habilidades: ['JavaScript', 'React', 'Node.js', 'Python', 'Project Management'],
      idiomas: [
        { idioma: 'Español', nivel: 'Nativo' },
        { idioma: 'Inglés', nivel: 'Avanzado' },
        { idioma: 'Francés', nivel: 'Básico' }
      ]
    };

    const historialEjemplo = [
      {
        id: 1,
        empresa: 'ProDominicana',
        cargo: 'Desarrollador Senior',
        departamento: 'Tecnología',
        fechaInicio: '2022-01-15',
        fechaFin: null,
        descripcion: 'Desarrollo de aplicaciones web y móviles, liderazgo de equipo técnico.',
        logros: ['Implementación de nuevo sistema de gestión', 'Reducción del 40% en tiempo de desarrollo']
      },
      {
        id: 2,
        empresa: 'TechSolutions',
        cargo: 'Desarrollador Frontend',
        departamento: 'Desarrollo',
        fechaInicio: '2020-03-01',
        fechaFin: '2021-12-31',
        descripcion: 'Desarrollo de interfaces de usuario modernas y responsivas.',
        logros: ['Mejora del 60% en experiencia de usuario', 'Implementación de design system']
      }
    ];

    const documentosEjemplo = [
      {
        id: 1,
        tipo: 'Curriculum Vitae',
        nombre: 'CV_Juan_Perez_2025.pdf',
        fechaSubida: '2025-01-15',
        tamaño: '2.3 MB',
        estado: 'Vigente'
      },
      {
        id: 2,
        tipo: 'Cédula de Identidad',
        nombre: 'Cedula_001-1234567-8.pdf',
        fechaSubida: '2025-01-10',
        tamaño: '1.2 MB',
        estado: 'Vigente'
      },
      {
        id: 3,
        tipo: 'Certificado Universitario',
        nombre: 'Titulo_Ingeniero_Sistemas.pdf',
        fechaSubida: '2025-01-08',
        tamaño: '1.8 MB',
        estado: 'Vigente'
      }
    ];

    const configuracionEjemplo = {
      // Notificaciones
      notificaciones: {
        email: true,
        push: true,
        vacaciones: true,
        nomina: false,
        capacitacion: true,
        vacantes: true,
        recordatorios: true
      },
      
      // Privacidad
      privacidad: {
        perfilPublico: false,
        mostrarEmail: false,
        mostrarTelefono: false,
        permitirContacto: true
      },
      
      // Preferencias
      preferencias: {
        idioma: 'Español',
        zona_horaria: 'America/Santo_Domingo',
        tema: 'Claro',
        formato_fecha: 'DD/MM/YYYY',
        formato_hora: '12h'
      },
      
      // Seguridad
      seguridad: {
        autenticacion_2fa: false,
        cambio_password_requerido: false,
        sesiones_activas: 3,
        ultimo_cambio_password: '2024-12-15'
      }
    };

    const objetivosEjemplo = [
      {
        id: 1,
        titulo: 'Certificación en Cloud Computing',
        descripcion: 'Obtener certificación AWS Solutions Architect',
        categoria: 'Capacitación',
        fechaInicio: '2025-01-01',
        fechaObjetivo: '2025-06-30',
        progreso: 35,
        estado: 'En progreso',
        prioridad: 'Alta'
      },
      {
        id: 2,
        titulo: 'Liderar Proyecto de Digitalización',
        descripcion: 'Liderar la migración de sistemas legacy a la nube',
        categoria: 'Profesional',
        fechaInicio: '2025-02-01',
        fechaObjetivo: '2025-12-31',
        progreso: 15,
        estado: 'En progreso',
        prioridad: 'Alta'
      },
      {
        id: 3,
        titulo: 'Mejorar Habilidades de Comunicación',
        descripcion: 'Completar curso de presentaciones ejecutivas',
        categoria: 'Desarrollo Personal',
        fechaInicio: '2025-01-15',
        fechaObjetivo: '2025-04-15',
        progreso: 60,
        estado: 'En progreso',
        prioridad: 'Media'
      }
    ];

    const actividadesEjemplo = [
      {
        id: 1,
        tipo: 'Perfil',
        accion: 'Actualizó información personal',
        fecha: '2025-07-20',
        hora: '10:30 AM',
        detalles: 'Actualizó número de teléfono'
      },
      {
        id: 2,
        tipo: 'Vacaciones',
        accion: 'Solicitó vacaciones',
        fecha: '2025-07-18',
        hora: '2:15 PM',
        detalles: 'Vacaciones del 15 al 25 de agosto'
      },
      {
        id: 3,
        tipo: 'Capacitación',
        accion: 'Completó curso',
        fecha: '2025-07-15',
        hora: '4:45 PM',
        detalles: 'Curso de React Avanzado'
      },
      {
        id: 4,
        tipo: 'Documentos',
        accion: 'Subió documento',
        fecha: '2025-07-12',
        hora: '9:20 AM',
        detalles: 'Nuevo CV actualizado'
      },
      {
        id: 5,
        tipo: 'Objetivo',
        accion: 'Actualizó progreso',
        fecha: '2025-07-10',
        hora: '11:15 AM',
        detalles: 'Certificación Cloud Computing - 35%'
      }
    ];

    setPerfilPersonal(perfilEjemplo);
    setHistorialLaboral(historialEjemplo);
    setDocumentos(documentosEjemplo);
    setConfiguracion(configuracionEjemplo);
    setObjetivos(objetivosEjemplo);
    setActividades(actividadesEjemplo);
    setFormData(perfilEjemplo);
  }, [user]);

  // Funciones para manejar las acciones
  const handleSaveProfile = () => {
    setPerfilPersonal(formData);
    setEditMode(false);
    addNotification('¡Perfil actualizado exitosamente!', 'success');
  };

  const handleAddObjetivo = (objetivo) => {
    const nuevoObjetivo = {
      id: Date.now(),
      ...objetivo,
      progreso: 0,
      estado: 'En progreso'
    };
    setObjetivos([...objetivos, nuevoObjetivo]);
    addNotification('¡Objetivo agregado exitosamente!', 'success');
  };

  const handleUpdateConfig = (seccion, config) => {
    setConfiguracion(prev => ({
      ...prev,
      [seccion]: config
    }));
    addNotification('¡Configuración actualizada!', 'success');
  };

  return (
    <div style={{ 
      backgroundColor: 'white', 
      borderRadius: '12px', 
      overflow: 'hidden', 
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)' 
    }}>
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        padding: '2rem',
        color: 'white'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '1.5rem' }}>
          {/* Avatar */}
          <div style={{ 
            position: 'relative',
            width: '80px', 
            height: '80px', 
            borderRadius: '50%', 
            backgroundColor: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            fontWeight: 'bold'
          }}>
            {user?.avatar || user?.name?.charAt(0)}
            <button style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#3b82f6',
              border: '2px solid white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}>
              <Camera size={12} />
            </button>
          </div>

          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', margin: '0 0 0.25rem 0' }}>
              {perfilPersonal.nombres} {perfilPersonal.apellidos}
            </h1>
            <p style={{ opacity: 0.9, margin: '0 0 0.5rem 0', fontSize: '1.125rem' }}>
              {perfilPersonal.posicion}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', opacity: 0.8 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Building size={14} />
                {perfilPersonal.departamento}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Calendar size={14} />
                Desde {new Date(perfilPersonal.empleadoDesde || '2022-01-15').toLocaleDateString()}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <MapPin size={14} />
                {perfilPersonal.ubicacionOficina}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem' 
        }}>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Target size={20} />
              <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>Objetivos Activos</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              {objetivos.filter(o => o.estado === 'En progreso').length}
            </div>
          </div>

          <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <TrendingUp size={20} />
              <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>Progreso Promedio</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              {objetivos.length > 0 ? Math.round(objetivos.reduce((acc, obj) => acc + obj.progreso, 0) / objetivos.length) : 0}%
            </div>
          </div>

          <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <FileText size={20} />
              <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>Documentos</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              {documentos.length}
            </div>
          </div>

          <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Star size={20} />
              <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>Experiencia</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              {historialLaboral.length > 0 ? 
                new Date().getFullYear() - new Date(historialLaboral[historialLaboral.length - 1].fechaInicio).getFullYear() 
                : 0} años
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
        <div style={{ display: 'flex', overflowX: 'auto', padding: '0 2rem' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '1rem 1.5rem',
                  borderBottom: activeTab === tab.id ? '2px solid #667eea' : '2px solid transparent',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: activeTab === tab.id ? '#667eea' : '#6b7280',
                  fontWeight: activeTab === tab.id ? '600' : '500',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '2rem' }}>
        
        {/* Información Personal */}
        {activeTab === 'personal' && (
          <InformacionPersonal
            perfil={perfilPersonal}
            formData={formData}
            setFormData={setFormData}
            editMode={editMode}
            setEditMode={setEditMode}
            onSave={handleSaveProfile}
          />
        )}

        {/* Historial Laboral */}
        {activeTab === 'laboral' && (
          <HistorialLaboral
            historial={historialLaboral}
            setHistorial={setHistorialLaboral}
          />
        )}

        {/* Documentos */}
        {activeTab === 'documentos' && (
          <GestionDocumentos
            documentos={documentos}
            setDocumentos={setDocumentos}
          />
        )}

        {/* Objetivos y Metas */}
        {activeTab === 'objetivos' && (
          <ObjetivosYMetas
            objetivos={objetivos}
            setObjetivos={setObjetivos}
            onAdd={handleAddObjetivo}
          />
        )}

        {/* Timeline de Actividad */}
        {activeTab === 'actividad' && (
          <TimelineActividad
            actividades={actividades}
          />
        )}

        {/* Configuración */}
        {activeTab === 'configuracion' && (
          <ConfiguracionPerfil
            configuracion={configuracion}
            onUpdate={handleUpdateConfig}
          />
        )}

      </div>
    </div>
  );
};

// Componente Información Personal
const InformacionPersonal = ({ perfil, formData, setFormData, editMode, setEditMode, onSave }) => {
  const secciones = [
    {
      titulo: 'Información Básica',
      campos: [
        { key: 'nombres', label: 'Nombres', tipo: 'text', icon: User },
        { key: 'apellidos', label: 'Apellidos', tipo: 'text', icon: User },
        { key: 'cedula', label: 'Cédula', tipo: 'text', icon: FileText },
        { key: 'fechaNacimiento', label: 'Fecha de Nacimiento', tipo: 'date', icon: Calendar },
        { key: 'genero', label: 'Género', tipo: 'select', opciones: ['Masculino', 'Femenino', 'Otro'], icon: User },
        { key: 'estadoCivil', label: 'Estado Civil', tipo: 'select', opciones: ['Soltero', 'Casado', 'Divorciado', 'Viudo'], icon: Heart },
        { key: 'nacionalidad', label: 'Nacionalidad', tipo: 'text', icon: Globe }
      ]
    },
    {
      titulo: 'Información de Contacto',
      campos: [
        { key: 'email', label: 'Email Corporativo', tipo: 'email', icon: Mail, readonly: true },
        { key: 'emailPersonal', label: 'Email Personal', tipo: 'email', icon: Mail },
        { key: 'telefonoOficina', label: 'Teléfono Oficina', tipo: 'tel', icon: Phone },
        { key: 'telefonoPersonal', label: 'Teléfono Personal', tipo: 'tel', icon: Phone },
        { key: 'direccion', label: 'Dirección', tipo: 'text', icon: Home },
        { key: 'sector', label: 'Sector', tipo: 'text', icon: MapPin },
        { key: 'ciudad', label: 'Ciudad', tipo: 'text', icon: MapPin },
        { key: 'provincia', label: 'Provincia', tipo: 'text', icon: MapPin }
      ]
    },
    {
      titulo: 'Información Laboral',
      campos: [
        { key: 'empleadoDesde', label: 'Empleado Desde', tipo: 'date', icon: Calendar, readonly: true },
        { key: 'departamento', label: 'Departamento', tipo: 'text', icon: Building, readonly: true },
        { key: 'posicion', label: 'Posición', tipo: 'text', icon: Briefcase, readonly: true },
        { key: 'supervisor', label: 'Supervisor', tipo: 'text', icon: UserCheck, readonly: true },
        { key: 'ubicacionOficina', label: 'Ubicación de Oficina', tipo: 'text', icon: MapPin }
      ]
    },
    {
      titulo: 'Contacto de Emergencia',
      campos: [
        { key: 'contactoEmergenciaNombre', label: 'Nombre', tipo: 'text', icon: User },
        { key: 'contactoEmergenciaRelacion', label: 'Relación', tipo: 'text', icon: Heart },
        { key: 'contactoEmergenciaTelefono', label: 'Teléfono', tipo: 'tel', icon: Phone }
      ]
    },
    {
      titulo: 'Educación',
      campos: [
        { key: 'nivelEducacion', label: 'Nivel de Educación', tipo: 'select', opciones: ['Secundaria', 'Técnico', 'Universitario', 'Postgrado', 'Maestría', 'Doctorado'], icon: GraduationCap },
        { key: 'institucionEducativa', label: 'Institución Educativa', tipo: 'text', icon: GraduationCap },
        { key: 'tituloObtenido', label: 'Título Obtenido', tipo: 'text', icon: Award },
        { key: 'anioGraduacion', label: 'Año de Graduación', tipo: 'number', icon: Calendar }
      ]
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1f2937' }}>
            Información Personal
          </h2>
          <p style={{ color: '#6b7280' }}>
            Gestiona tu información personal y de contacto
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {editMode ? (
            <>
              <button
                onClick={() => {
                  setEditMode(false);
                  setFormData(perfil);
                }}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={onSave}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Save size={16} />
                Guardar
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Edit size={16} />
              Editar
            </button>
          )}
        </div>
      </div>

      {/* Secciones del formulario */}
      <div style={{ display: 'grid', gap: '2rem' }}>
        {secciones.map((seccion, index) => (
          <div key={index} style={{ 
            backgroundColor: '#f9fafb', 
            padding: '1.5rem', 
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
              {seccion.titulo}
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '1rem' 
            }}>
              {seccion.campos.map((campo) => {
                const Icon = campo.icon;
                return (
                  <div key={campo.key}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                      <Icon size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                      {campo.label}
                    </label>
                    {campo.tipo === 'select' ? (
                      <select
                        disabled={!editMode || campo.readonly}
                        value={formData[campo.key] || ''}
                        onChange={(e) => setFormData({ ...formData, [campo.key]: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          backgroundColor: (!editMode || campo.readonly) ? '#f9fafb' : 'white'
                        }}
                      >
                        <option value="">Seleccionar...</option>
                        {campo.opciones?.map(opcion => (
                          <option key={opcion} value={opcion}>{opcion}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={campo.tipo}
                        disabled={!editMode || campo.readonly}
                        value={formData[campo.key] || ''}
                        onChange={(e) => setFormData({ ...formData, [campo.key]: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          backgroundColor: (!editMode || campo.readonly) ? '#f9fafb' : 'white'
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Biografía e información adicional */}
        <div style={{ 
          backgroundColor: '#f9fafb', 
          padding: '1.5rem', 
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
            Información Adicional
          </h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
              <FileText size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
              Biografía Profesional
            </label>
            <textarea
              disabled={!editMode}
              value={formData.biografia || ''}
              onChange={(e) => setFormData({ ...formData, biografia: e.target.value })}
              rows={4}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem',
                backgroundColor: !editMode ? '#f9fafb' : 'white',
                resize: 'vertical'
              }}
              placeholder="Describe tu experiencia profesional y logros..."
            />
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '1rem' 
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                <Award size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                Habilidades
              </label>
              <div style={{ 
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: '#f9fafb',
                minHeight: '2.5rem'
              }}>
                {perfil.habilidades?.map((habilidad, index) => (
                  <span
                    key={index}
                    style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      margin: '0.25rem 0.25rem 0.25rem 0'
                    }}
                  >
                    {habilidad}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                <Globe size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                Idiomas
              </label>
              <div style={{ 
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: '#f9fafb'
              }}>
                {perfil.idiomas?.map((idioma, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: index < perfil.idiomas.length - 1 ? '0.5rem' : 0
                  }}>
                    <span style={{ fontSize: '0.875rem', color: '#374151' }}>{idioma.idioma}</span>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      padding: '0.25rem 0.5rem',
                      backgroundColor: '#10b981',
                      color: 'white',
                      borderRadius: '8px'
                    }}>
                      {idioma.nivel}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente Historial Laboral
const HistorialLaboral = ({ historial, setHistorial }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newExperience, setNewExperience] = useState({
    empresa: '',
    cargo: '',
    departamento: '',
    fechaInicio: '',
    fechaFin: '',
    descripcion: '',
    logros: ['']
  });

  const handleAddExperience = () => {
    const nuevaExperiencia = {
      id: Date.now(),
      ...newExperience,
      logros: newExperience.logros.filter(logro => logro.trim() !== '')
    };
    setHistorial([nuevaExperiencia, ...historial]);
    setNewExperience({
      empresa: '',
      cargo: '',
      departamento: '',
      fechaInicio: '',
      fechaFin: '',
      descripcion: '',
      logros: ['']
    });
    setShowAddForm(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1f2937' }}>
            Historial Laboral
          </h2>
          <p style={{ color: '#6b7280' }}>
            Tu experiencia profesional y trayectoria laboral
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Plus size={16} />
          Agregar Experiencia
        </button>
      </div>

      {/* Timeline de experiencias */}
      <div style={{ position: 'relative', paddingLeft: '2rem' }}>
        {/* Línea vertical */}
        <div style={{
          position: 'absolute',
          left: '1rem',
          top: '1rem',
          bottom: '1rem',
          width: '2px',
          backgroundColor: '#e5e7eb'
        }} />

        {historial.map((experiencia, index) => (
          <div key={experiencia.id} style={{ position: 'relative', marginBottom: '2rem' }}>
            {/* Punto en la timeline */}
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
                    {experiencia.cargo}
                  </h3>
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

      {/* Modal para agregar experiencia */}
      {showAddForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
              Agregar Experiencia Laboral
            </h3>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                    Empresa *
                  </label>
                  <input
                    type="text"
                    required
                    value={newExperience.empresa}
                    onChange={(e) => setNewExperience({ ...newExperience, empresa: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}
                    placeholder="Nombre de la empresa"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                    Cargo *
                  </label>
                  <input
                    type="text"
                    required
                    value={newExperience.cargo}
                    onChange={(e) => setNewExperience({ ...newExperience, cargo: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}
                    placeholder="Tu cargo o posición"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Departamento
                </label>
                <input
                  type="text"
                  value={newExperience.departamento}
                  onChange={(e) => setNewExperience({ ...newExperience, departamento: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}
                  placeholder="Departamento o área"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                    Fecha de Inicio *
                  </label>
                  <input
                    type="date"
                    required
                    value={newExperience.fechaInicio}
                    onChange={(e) => setNewExperience({ ...newExperience, fechaInicio: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                    Fecha de Fin (opcional)
                  </label>
                  <input
                    type="date"
                    value={newExperience.fechaFin}
                    onChange={(e) => setNewExperience({ ...newExperience, fechaFin: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Descripción *
                </label>
                <textarea
                  required
                  value={newExperience.descripcion}
                  onChange={(e) => setNewExperience({ ...newExperience, descripcion: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    resize: 'vertical'
                  }}
                  placeholder="Describe tus responsabilidades y funciones..."
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontWeight: '500', color: '#374151' }}>
                    Logros Destacados
                  </label>
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
                      placeholder="Describe un logro o resultado importante..."
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

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewExperience({
                      empresa: '',
                      cargo: '',
                      departamento: '',
                      fechaInicio: '',
                      fechaFin: '',
                      descripcion: '',
                      logros: ['']
                    });
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddExperience}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}
                >
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

// Componente Gestión de Documentos
const GestionDocumentos = ({ documentos, setDocumentos }) => {
  const [dragOver, setDragOver] = useState(false);

  const handleFileUpload = (files) => {
    Array.from(files).forEach(file => {
      const nuevoDocumento = {
        id: Date.now() + Math.random(),
        tipo: 'Otro',
        nombre: file.name,
        fechaSubida: new Date().toISOString().split('T')[0],
        tamaño: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        estado: 'Vigente',
        archivo: file
      };
      setDocumentos(prev => [...prev, nuevoDocumento]);
    });
  };

  const handleDelete = (id) => {
    setDocumentos(prev => prev.filter(doc => doc.id !== id));
  };

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
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1f2937' }}>
          Gestión de Documentos
        </h2>
        <p style={{ color: '#6b7280' }}>
          Administra tus documentos personales y profesionales
        </p>
      </div>

      {/* Área de subida de archivos */}
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
          handleFileUpload(e.dataTransfer.files);
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
          onChange={(e) => handleFileUpload(e.target.files)}
          style={{ display: 'none' }}
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '600',
            display: 'inline-block'
          }}
        >
          Seleccionar Archivos
        </label>
        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
          Formatos soportados: PDF, DOC, DOCX, JPG, PNG (Max. 10MB por archivo)
        </p>
      </div>

      {/* Lista de documentos */}
      <div style={{ display: 'grid', gap: '1rem' }}>
        {documentos.map((documento) => {
          const TipoIcon = getTipoIcon(documento.tipo);
          return (
            <div
              key={documento.id}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '1.5rem',
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}
            >
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
                  onClick={() => handleDelete(documento.id)}
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
          <p style={{ fontSize: '0.875rem' }}>
            Sube tus documentos importantes para tenerlos siempre disponibles
          </p>
        </div>
      )}
    </div>
  );
};

// Componente Objetivos y Metas
const ObjetivosYMetas = ({ objetivos, setObjetivos, onAdd }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newObjetivo, setNewObjetivo] = useState({
    titulo: '',
    descripcion: '',
    categoria: '',
    fechaInicio: '',
    fechaObjetivo: '',
    prioridad: 'Media'
  });

  const categorias = [
    'Profesional',
    'Capacitación',
    'Desarrollo Personal',
    'Técnico',
    'Liderazgo',
    'Otro'
  ];

  const prioridades = ['Baja', 'Media', 'Alta'];

  const handleAddObjetivo = () => {
    onAdd(newObjetivo);
    setNewObjetivo({
      titulo: '',
      descripcion: '',
      categoria: '',
      fechaInicio: '',
      fechaObjetivo: '',
      prioridad: 'Media'
    });
    setShowAddForm(false);
  };

  const handleUpdateProgreso = (id, progreso) => {
    setObjetivos(prev => 
      prev.map(obj => 
        obj.id === id 
          ? { 
              ...obj, 
              progreso, 
              estado: progreso >= 100 ? 'Completado' : 'En progreso' 
            }
          : obj
      )
    );
  };

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1f2937' }}>
            Objetivos y Metas
          </h2>
          <p style={{ color: '#6b7280' }}>
            Define y da seguimiento a tus objetivos profesionales y personales
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Plus size={16} />
          Nuevo Objetivo
        </button>
      </div>

      {/* Resumen de objetivos */}
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

      {/* Lista de objetivos */}
      <div style={{ display: 'grid', gap: '1rem' }}>
        {objetivos.map((objetivo) => (
          <div
            key={objetivo.id}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '1.5rem',
              backgroundColor: 'white'
            }}
          >
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

                {/* Barra de progreso */}
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

                {/* Control de progreso */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <label style={{ fontSize: '0.875rem', color: '#374151' }}>
                    Actualizar progreso:
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={objetivo.progreso}
                    onChange={(e) => handleUpdateProgreso(objetivo.id, parseInt(e.target.value))}
                    style={{ flex: 1 }}
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={objetivo.progreso}
                    onChange={(e) => handleUpdateProgreso(objetivo.id, parseInt(e.target.value) || 0)}
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
          <p style={{ fontSize: '0.875rem' }}>
            Define tus metas profesionales y personales para dar seguimiento a tu crecimiento
          </p>
        </div>
      )}

      {/* Modal para agregar objetivo */}
      {showAddForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
              Nuevo Objetivo
            </h3>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Título del Objetivo *
                </label>
                <input
                  type="text"
                  required
                  value={newObjetivo.titulo}
                  onChange={(e) => setNewObjetivo({ ...newObjetivo, titulo: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}
                  placeholder="ej. Obtener certificación en Cloud Computing"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Descripción *
                </label>
                <textarea
                  required
                  value={newObjetivo.descripcion}
                  onChange={(e) => setNewObjetivo({ ...newObjetivo, descripcion: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    resize: 'vertical'
                  }}
                  placeholder="Describe detalladamente tu objetivo..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                    Categoría *
                  </label>
                  <select
                    required
                    value={newObjetivo.categoria}
                    onChange={(e) => setNewObjetivo({ ...newObjetivo, categoria: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="">Seleccionar categoría</option>
                    {categorias.map(categoria => (
                      <option key={categoria} value={categoria}>{categoria}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                    Prioridad *
                  </label>
                  <select
                    required
                    value={newObjetivo.prioridad}
                    onChange={(e) => setNewObjetivo({ ...newObjetivo, prioridad: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}
                  >
                    {prioridades.map(prioridad => (
                      <option key={prioridad} value={prioridad}>{prioridad}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                    Fecha de Inicio *
                  </label>
                  <input
                    type="date"
                    required
                    value={newObjetivo.fechaInicio}
                    onChange={(e) => setNewObjetivo({ ...newObjetivo, fechaInicio: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                    Fecha Objetivo *
                  </label>
                  <input
                    type="date"
                    required
                    value={newObjetivo.fechaObjetivo}
                    onChange={(e) => setNewObjetivo({ ...newObjetivo, fechaObjetivo: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewObjetivo({
                      titulo: '',
                      descripcion: '',
                      categoria: '',
                      fechaInicio: '',
                      fechaObjetivo: '',
                      prioridad: 'Media'
                    });
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddObjetivo}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}
                >
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

// Componente Timeline de Actividad
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
      case 'Nomina': return '#06b6d4';
      case 'Asistencia': return '#84cc16';
      default: return '#6b7280';
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1f2937' }}>
          Timeline de Actividad
        </h2>
        <p style={{ color: '#6b7280' }}>
          Historial de todas tus actividades en el sistema
        </p>
      </div>

      {/* Timeline */}
      <div style={{ position: 'relative', paddingLeft: '2rem' }}>
        {/* Línea vertical */}
        <div style={{
          position: 'absolute',
          left: '1rem',
          top: '1rem',
          bottom: '1rem',
          width: '2px',
          backgroundColor: '#e5e7eb'
        }} />

        {actividades.map((actividad, index) => {
          const TipoIcon = getTipoIcon(actividad.tipo);
          const tipoColor = getTipoColor(actividad.tipo);
          
          return (
            <div key={actividad.id} style={{ position: 'relative', marginBottom: '1.5rem' }}>
              {/* Icono en la timeline */}
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
          <p>No hay actividades registradas aún</p>
          <p style={{ fontSize: '0.875rem' }}>
            Tus actividades en el sistema aparecerán aquí
          </p>
        </div>
      )}
    </div>
  );
};

// Componente Configuración del Perfil
const ConfiguracionPerfil = ({ configuracion, onUpdate }) => {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    actual: '',
    nueva: '',
    confirmar: ''
  });

  const handleToggle = (seccion, campo) => {
    const nuevaConfig = {
      ...configuracion[seccion],
      [campo]: !configuracion[seccion][campo]
    };
    onUpdate(seccion, nuevaConfig);
  };

  const handleSelectChange = (seccion, campo, valor) => {
    const nuevaConfig = {
      ...configuracion[seccion],
      [campo]: valor
    };
    onUpdate(seccion, nuevaConfig);
  };

  const handlePasswordChange = () => {
    if (passwordData.nueva !== passwordData.confirmar) {
      alert('Las contraseñas no coinciden');
      return;
    }
    // Aquí se haría la petición para cambiar la contraseña
    console.log('Cambiar contraseña:', passwordData);
    setPasswordData({ actual: '', nueva: '', confirmar: '' });
    setShowPasswordForm(false);
    alert('Contraseña cambiada exitosamente');
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
        { key: 'capacitacion', label: 'Notificaciones de Capacitación', tipo: 'toggle' },
        { key: 'vacantes', label: 'Notificaciones de Vacantes', tipo: 'toggle' },
        { key: 'recordatorios', label: 'Recordatorios Generales', tipo: 'toggle' }
      ]
    },
    {
      id: 'privacidad',
      titulo: 'Configuración de Privacidad',
      descripcion: 'Controla la visibilidad de tu información',
      icon: Shield,
      campos: [
        { key: 'perfilPublico', label: 'Perfil Público Visible', tipo: 'toggle' },
        { key: 'mostrarEmail', label: 'Mostrar Email a Otros', tipo: 'toggle' },
        { key: 'mostrarTelefono', label: 'Mostrar Teléfono a Otros', tipo: 'toggle' },
        { key: 'permitirContacto', label: 'Permitir Contacto Directo', tipo: 'toggle' }
      ]
    },
    {
      id: 'preferencias',
      titulo: 'Preferencias del Sistema',
      descripcion: 'Personaliza tu experiencia en la plataforma',
      icon: Settings,
      campos: [
        { 
          key: 'idioma', 
          label: 'Idioma', 
          tipo: 'select', 
          opciones: ['Español', 'Inglés', 'Francés'] 
        },
        { 
          key: 'zona_horaria', 
          label: 'Zona Horaria', 
          tipo: 'select', 
          opciones: ['America/Santo_Domingo', 'America/New_York', 'Europe/Madrid'] 
        },
        { 
          key: 'tema', 
          label: 'Tema', 
          tipo: 'select', 
          opciones: ['Claro', 'Oscuro', 'Automático'] 
        },
        { 
          key: 'formato_fecha', 
          label: 'Formato de Fecha', 
          tipo: 'select', 
          opciones: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] 
        },
        { 
          key: 'formato_hora', 
          label: 'Formato de Hora', 
          tipo: 'select', 
          opciones: ['12h', '24h'] 
        }
      ]
    }
  ];

  // Componente Toggle
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

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1f2937' }}>
          Configuración del Perfil
        </h2>
        <p style={{ color: '#6b7280' }}>
          Personaliza tu experiencia y configuraciones de privacidad
        </p>
      </div>

      {/* Secciones de configuración */}
      <div style={{ display: 'grid', gap: '2rem' }}>
        {secciones.map((seccion) => {
          const Icon = seccion.icon;
          return (
            <div key={seccion.id} style={{ 
              backgroundColor: '#f9fafb', 
              padding: '1.5rem', 
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
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
                    <div>
                      <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', display: 'block' }}>
                        {campo.label}
                      </label>
                    </div>
                    
                    {campo.tipo === 'toggle' ? (
                      <Toggle
                        checked={configuracion[seccion.id]?.[campo.key] || false}
                        onChange={() => handleToggle(seccion.id, campo.key)}
                      />
                    ) : campo.tipo === 'select' ? (
                      <select
                        value={configuracion[seccion.id]?.[campo.key] || ''}
                        onChange={(e) => handleSelectChange(seccion.id, campo.key, e.target.value)}
                        style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '0.875rem',
                          minWidth: '150px'
                        }}
                      >
                        {campo.opciones?.map(opcion => (
                          <option key={opcion} value={opcion}>{opcion}</option>
                        ))}
                      </select>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Sección de Seguridad */}
        <div style={{ 
          backgroundColor: '#f9fafb', 
          padding: '1.5rem', 
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Key size={24} style={{ color: '#3b82f6' }} />
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0, color: '#374151' }}>
                Configuración de Seguridad
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                Gestiona la seguridad de tu cuenta
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {/* Cambio de contraseña */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem',
              backgroundColor: 'white',
              borderRadius: '6px',
              border: '1px solid #e5e7eb'
            }}>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', display: 'block' }}>
                  Cambiar Contraseña
                </label>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                  Último cambio: {configuracion.seguridad?.ultimo_cambio_password ? 
                    new Date(configuracion.seguridad.ultimo_cambio_password).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <button
                onClick={() => setShowPasswordForm(true)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}
              >
                Cambiar
              </button>
            </div>

            {/* Autenticación 2FA */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem',
              backgroundColor: 'white',
              borderRadius: '6px',
              border: '1px solid #e5e7eb'
            }}>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', display: 'block' }}>
                  Autenticación de Dos Factores
                </label>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                  Agrega una capa extra de seguridad a tu cuenta
                </p>
              </div>
              <Toggle
                checked={configuracion.seguridad?.autenticacion_2fa || false}
                onChange={() => handleToggle('seguridad', 'autenticacion_2fa')}
              />
            </div>

            {/* Sesiones activas */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem',
              backgroundColor: 'white',
              borderRadius: '6px',
              border: '1px solid #e5e7eb'
            }}>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', display: 'block' }}>
                  Sesiones Activas
                </label>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                  Tienes {configuracion.seguridad?.sesiones_activas || 0} sesiones activas
                </p>
              </div>
              <button
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}
              >
                Cerrar Todas
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para cambiar contraseña */}
      {showPasswordForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
              Cambiar Contraseña
            </h3>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Contraseña Actual *
                </label>
                <input
                  type="password"
                  required
                  value={passwordData.actual}
                  onChange={(e) => setPasswordData({ ...passwordData, actual: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}
                  placeholder="Ingresa tu contraseña actual"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Nueva Contraseña *
                </label>
                <input
                  type="password"
                  required
                  value={passwordData.nueva}
                  onChange={(e) => setPasswordData({ ...passwordData, nueva: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}
                  placeholder="Ingresa tu nueva contraseña"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Confirmar Nueva Contraseña *
                </label>
                <input
                  type="password"
                  required
                  value={passwordData.confirmar}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmar: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}
                  placeholder="Confirma tu nueva contraseña"
                />
              </div>

              {/* Criterios de seguridad */}
              <div style={{ 
                padding: '1rem', 
                backgroundColor: '#f3f4f6', 
                borderRadius: '6px', 
                fontSize: '0.75rem', 
                color: '#6b7280' 
              }}>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600' }}>La contraseña debe tener:</p>
                <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                  <li>Al menos 8 caracteres</li>
                  <li>Una letra mayúscula</li>
                  <li>Una letra minúscula</li>
                  <li>Un número</li>
                  <li>Un carácter especial (!@#$%^&*)</li>
                </ul>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
                <button
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordData({ actual: '', nueva: '', confirmar: '' });
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handlePasswordChange}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}
                >
                  Cambiar Contraseña
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerfilModule;