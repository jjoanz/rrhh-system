// frontend/src/components/modules/postulaciones/PostulacionesModule.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import postulacionesService from '../../../api/postulacionesService';
import {
  Users, Filter, Search, Eye, Edit, Trash2, Download, Star,
  CheckCircle, XCircle, Clock, Calendar, Mail, Phone, Linkedin,
  FileText, Upload, AlertCircle, TrendingUp, Award, MessageSquare,
  MoreVertical, ExternalLink, Briefcase, X, Loader
} from 'lucide-react';

const PostulacionesModule = () => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [postulaciones, setPostulaciones] = useState([]);
  const [estadisticas, setEstadisticas] = useState({});
  const [filtros, setFiltros] = useState({
    estado: '',
    tipo: '',
    busqueda: ''
  });
  const [postulacionSeleccionada, setPostulacionSeleccionada] = useState(null);
  const [modalDetalle, setModalDetalle] = useState(false);
  const [modalCalificar, setModalCalificar] = useState(false);
  const [modalCambiarEstado, setModalCambiarEstado] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!authLoading && user) {
      cargarDatos();
    }
  }, [user, authLoading, filtros]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const filtrosApi = {
        usuarioID: user.id,
        rol: user.role,
        ...filtros
      };

      const [postData, statsData] = await Promise.all([
        postulacionesService.getPostulaciones(filtrosApi),
        postulacionesService.getEstadisticas().catch(() => ({}))
      ]);

      setPostulaciones(postData || []);
      setEstadisticas(statsData || {});
    } catch (err) {
      console.error('Error al cargar postulaciones:', err);
      setError('Error al cargar las postulaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalle = async (postulacion) => {
    try {
      const detalle = await postulacionesService.getPostulacionById(postulacion.id);
      setPostulacionSeleccionada(detalle);
      setModalDetalle(true);
    } catch (err) {
      setError('Error al cargar los detalles');
    }
  };

  const handleCambiarEstado = async (nuevoEstado, comentarios = '') => {
    try {
      await postulacionesService.cambiarEstado(
        postulacionSeleccionada.id,
        nuevoEstado,
        comentarios,
        user.empleadoId
      );
      
      setPostulaciones(prev => prev.map(p =>
        p.id === postulacionSeleccionada.id ? { ...p, estado: nuevoEstado } : p
      ));
      
      setModalCambiarEstado(false);
      setSuccess(`Estado actualizado a: ${nuevoEstado}`);
      cargarDatos();
    } catch (err) {
      setError('Error al cambiar el estado');
    }
  };

  const handleCalificar = async (calificacion, comentarios) => {
    try {
      await postulacionesService.calificar(
        postulacionSeleccionada.id,
        calificacion,
        comentarios,
        user.empleadoId
      );
      
      setPostulaciones(prev => prev.map(p =>
        p.id === postulacionSeleccionada.id ? { ...p, calificacion } : p
      ));
      
      setModalCalificar(false);
      setSuccess('Calificación registrada exitosamente');
      cargarDatos();
    } catch (err) {
      setError('Error al calificar la postulación');
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar esta postulación?')) return;
    
    try {
      await postulacionesService.eliminar(id);
      setPostulaciones(prev => prev.filter(p => p.id !== id));
      setSuccess('Postulación eliminada exitosamente');
    } catch (err) {
      setError('Error al eliminar la postulación');
    }
  };

  const postulacionesFiltradas = postulaciones.filter(p => {
    const matchBusqueda = !filtros.busqueda || 
      p.nombreCandidato?.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      p.email?.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      p.vacanteTitle?.toLowerCase().includes(filtros.busqueda.toLowerCase());
    
    return matchBusqueda;
  });

  const esPersonalRRHH = ['rrhh', 'gerente_rrhh', 'director_rrhh', 'admin'].includes(
    user?.role?.toLowerCase().replace(/\s+/g, '_')
  );

  if (authLoading || loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', flexDirection: 'column', gap: '1rem' }}>
        <Loader size={48} style={{ color: '#3b82f6', animation: 'spin 1s linear infinite' }} />
        <p>Cargando postulaciones...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', marginBottom: '1.5rem' }}>
        <div style={{ background: 'linear-gradient(135deg, #1e40af 0%, #1e40af 100%)', color: 'white', padding: '2rem', borderRadius: '0.75rem 0.75rem 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Users size={44} />
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0 }}>
                  {esPersonalRRHH ? 'Gestión de Postulaciones' : 'Mis Postulaciones'}
                </h1>
                <p style={{ opacity: 0.9, margin: 0 }}>
                  {esPersonalRRHH ? 'Administración completa del proceso de selección' : 'Seguimiento de mis aplicaciones'}
                </p>
              </div>
            </div>
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: '0.75rem', padding: '1rem' }}>
              <div style={{ fontWeight: '600', fontSize: '1rem' }}>{user.name}</div>
              <div style={{ opacity: 0.9 }}>{user.role}</div>
            </div>
          </div>

          {/* Estadísticas */}
          {esPersonalRRHH && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <StatCard icon={Users} label="Total Postulaciones" value={estadisticas.total || 0} />
              <StatCard icon={Clock} label="En Revisión" value={estadisticas.porEstado?.find(e => e.Estado === 'En Revisión')?.cantidad || 0} />
              <StatCard icon={Calendar} label="Entrevistas" value={estadisticas.porEstado?.find(e => e.Estado?.includes('Entrevista'))?.cantidad || 0} />
              <StatCard icon={Award} label="Calificación Promedio" value={`${estadisticas.promedioCalificacion || 0}/10`} />
            </div>
          )}
        </div>

        {/* Filtros */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <Search size={20} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="text"
                placeholder="Buscar candidato, email o vacante..."
                value={filtros.busqueda}
                onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem 0.75rem 2.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            <select
              value={filtros.estado}
              onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
              style={{
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                backgroundColor: 'white'
              }}
            >
              <option value="">Todos los estados</option>
              <option value="Recibida">Recibida</option>
              <option value="En Revisión">En Revisión</option>
              <option value="Entrevista Programada">Entrevista Programada</option>
              <option value="Entrevista Realizada">Entrevista Realizada</option>
              <option value="Aprobada">Aprobada</option>
              <option value="Rechazada">Rechazada</option>
              <option value="Contratada">Contratada</option>
            </select>

            {esPersonalRRHH && (
              <select
                value={filtros.tipo}
                onChange={(e) => setFiltros(prev => ({ ...prev, tipo: e.target.value }))}
                style={{
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  backgroundColor: 'white'
                }}
              >
                <option value="">Todos los tipos</option>
                <option value="interno">Postulantes Internos</option>
                <option value="externo">Postulantes Externos</option>
              </select>
            )}

            <button
              onClick={cargarDatos}
              style={{
                backgroundColor: '#1e40af',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <Filter size={16} />
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Postulaciones */}
      <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
        {postulacionesFiltradas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7280' }}>
            <Users size={64} style={{ margin: '0 auto 1rem', color: '#d1d5db' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
              No hay postulaciones
            </h3>
            <p>No se encontraron postulaciones con los filtros seleccionados</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <tr>
                  <th style={thStyle}>Candidato</th>
                  <th style={thStyle}>Vacante</th>
                  <th style={thStyle}>Tipo</th>
                  <th style={thStyle}>Estado</th>
                  <th style={thStyle}>Calificación</th>
                  <th style={thStyle}>Fecha</th>
                  <th style={thStyle}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {postulacionesFiltradas.map((postulacion) => (
                  <tr key={postulacion.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={tdStyle}>
                      <div>
                        <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem' }}>
                          {postulacion.nombreCandidato}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Mail size={12} />
                          {postulacion.email}
                        </div>
                        {postulacion.telefono && (
                          <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                            <Phone size={12} />
                            {postulacion.telefono}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Briefcase size={16} style={{ color: '#1e40af' }} />
                        <span style={{ fontWeight: '500', color: '#374151' }}>{postulacion.vacanteTitle}</span>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: postulacion.tipoPostulante === 'Interno' ? '#dbeafe' : '#fef3c7',
                        color: postulacion.tipoPostulante === 'Interno' ? '#1e40af' : '#92400e'
                      }}>
                        {postulacion.tipoPostulante}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <EstadoBadge estado={postulacion.estado} />
                    </td>
                    <td style={tdStyle}>
                      {postulacion.calificacion ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Star size={16} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                          <span style={{ fontWeight: '600', color: '#374151' }}>{postulacion.calificacion}/10</span>
                        </div>
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Sin calificar</span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                        {postulacion.fechaPostulacion}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleVerDetalle(postulacion)}
                          style={actionButtonStyle('#3b82f6')}
                          title="Ver detalles"
                        >
                          <Eye size={16} />
                        </button>
                        {esPersonalRRHH && (
                          <>
                            <button
                              onClick={() => {
                                setPostulacionSeleccionada(postulacion);
                                setModalCambiarEstado(true);
                              }}
                              style={actionButtonStyle('#10b981')}
                              title="Cambiar estado"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setPostulacionSeleccionada(postulacion);
                                setModalCalificar(true);
                              }}
                              style={actionButtonStyle('#f59e0b')}
                              title="Calificar"
                            >
                              <Star size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modales */}
      {modalDetalle && <ModalDetalle postulacion={postulacionSeleccionada} onClose={() => setModalDetalle(false)} />}
      {modalCambiarEstado && <ModalCambiarEstado postulacion={postulacionSeleccionada} onClose={() => setModalCambiarEstado(false)} onConfirmar={handleCambiarEstado} />}
      {modalCalificar && <ModalCalificar postulacion={postulacionSeleccionada} onClose={() => setModalCalificar(false)} onConfirmar={handleCalificar} />}

      {/* Notificaciones */}
      {error && <Notificacion type="error" message={error} onClose={() => setError(null)} />}
      {success && <Notificacion type="success" message={success} onClose={() => setSuccess(null)} />}
    </div>
  );
};

// Componentes auxiliares
const StatCard = ({ icon: Icon, label, value }) => (
  <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '0.5rem', padding: '1rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
      <Icon size={20} />
      <span style={{ fontSize: '0.875rem' }}>{label}</span>
    </div>
    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{value}</div>
  </div>
);

const EstadoBadge = ({ estado }) => {
  const colores = {
    'Recibida': { bg: '#dbeafe', text: '#1e40af', border: '#60a5fa' },
    'En Revisión': { bg: '#fef3c7', text: '#92400e', border: '#fbbf24' },
    'Entrevista Programada': { bg: '#f3e8ff', text: '#1e40af', border: '#a78bfa' },
    'Entrevista Realizada': { bg: '#e0e7ff', text: '#4338ca', border: '#818cf8' },
    'Aprobada': { bg: '#dcfce7', text: '#166534', border: '#4ade80' },
    'Rechazada': { bg: '#fee2e2', text: '#991b1b', border: '#f87171' },
    'Contratada': { bg: '#d1fae5', text: '#065f46', border: '#34d399' }
  };

  const color = colores[estado] || { bg: '#f3f4f6', text: '#374151', border: '#9ca3af' };

  return (
    <span style={{
      backgroundColor: color.bg,
      color: color.text,
      border: `1px solid ${color.border}`,
      padding: '0.25rem 0.75rem',
      borderRadius: '1rem',
      fontSize: '0.75rem',
      fontWeight: '600',
      display: 'inline-block'
    }}>
      {estado}
    </span>
  );
};

const ModalDetalle = ({ postulacion, onClose }) => (
  <ModalBase titulo={`Postulación: ${postulacion.nombreCandidato}`} onClose={onClose} ancho="700px">
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {/* Información del candidato */}
      <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#1e293b' }}>
          Información del Candidato
        </h3>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <InfoRow icon={Mail} label="Email" value={postulacion.email} />
          <InfoRow icon={Phone} label="Teléfono" value={postulacion.telefono || 'No proporcionado'} />
          <InfoRow icon={Briefcase} label="Tipo" value={postulacion.tipoPostulante} />
          <InfoRow icon={Calendar} label="Fecha de postulación" value={postulacion.fechaPostulacion} />
          {postulacion.linkedinUrl && (
            <InfoRow 
              icon={Linkedin} 
              label="LinkedIn" 
              value={
                <a href={postulacion.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  Ver perfil <ExternalLink size={14} />
                </a>
              } 
            />
          )}
          {postulacion.cvUrl && (
            <InfoRow 
              icon={FileText} 
              label="CV" 
              value={
                <a href={postulacion.cvUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  Descargar CV <Download size={14} />
                </a>
              } 
            />
          )}
        </div>
      </div>

      {/* Vacante */}
      <div style={{ padding: '1rem', backgroundColor: '#f0f9ff', borderRadius: '0.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1e293b' }}>
          Vacante: {postulacion.vacanteTitle}
        </h3>
        {postulacion.vacanteDescripcion && (
          <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: '1.6' }}>
            {postulacion.vacanteDescripcion}
          </p>
        )}
      </div>

      {/* Experiencia y Educación */}
      {postulacion.experienciaLaboral && (
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1e293b' }}>
            Experiencia Laboral
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
            {postulacion.experienciaLaboral}
          </p>
        </div>
      )}

      {postulacion.educacion && (
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1e293b' }}>
            Educación
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
            {postulacion.educacion}
          </p>
        </div>
      )}

      {/* Observaciones */}
      {postulacion.observaciones && (
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1e293b' }}>
            Observaciones
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
            {postulacion.observaciones}
          </p>
        </div>
      )}

      {/* Notas de entrevista */}
      {postulacion.notasEntrevista && (
        <div style={{ padding: '1rem', backgroundColor: '#fef3c7', borderRadius: '0.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#92400e' }}>
            Notas/Comentarios
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#78350f', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
            {postulacion.notasEntrevista}
          </p>
        </div>
      )}

      {/* Calificación */}
      {postulacion.calificacion && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: '#dcfce7', borderRadius: '0.5rem' }}>
          <Star size={32} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
          <div>
            <div style={{ fontSize: '0.875rem', color: '#166534', marginBottom: '0.25rem' }}>Calificación</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#166534' }}>
              {postulacion.calificacion}/10
            </div>
          </div>
        </div>
      )}
    </div>
  </ModalBase>
);

const ModalCambiarEstado = ({ postulacion, onClose, onConfirmar }) => {
  const [estado, setEstado] = useState('');
  const [comentarios, setComentarios] = useState('');

  return (
    <ModalBase titulo="Cambiar Estado de Postulación" onClose={onClose} ancho="500px">
      <div style={{ display: 'grid', gap: '1rem' }}>
        <div>
          <label style={labelStyle}>Nuevo Estado *</label>
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            style={inputStyle}
            required
          >
            <option value="">Seleccionar estado</option>
            <option value="Recibida">Recibida</option>
            <option value="En Revisión">En Revisión</option>
            <option value="Entrevista Programada">Entrevista Programada</option>
            <option value="Entrevista Realizada">Entrevista Realizada</option>
            <option value="Aprobada">Aprobada</option>
            <option value="Rechazada">Rechazada</option>
            <option value="Contratada">Contratada</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>Comentarios (Opcional)</label>
          <textarea
            value={comentarios}
            onChange={(e) => setComentarios(e.target.value)}
            rows={4}
            style={inputStyle}
            placeholder="Agregar comentarios sobre el cambio de estado..."
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
          <button
            onClick={() => onConfirmar(estado, comentarios)}
            disabled={!estado}
            style={{
              flex: 1,
              backgroundColor: estado ? '#10b981' : '#9ca3af',
              color: 'white',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: estado ? 'pointer' : 'not-allowed',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}
          >
            Confirmar Cambio
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              backgroundColor: '#6b7280',
              color: 'white',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </ModalBase>
  );
};

const ModalCalificar = ({ postulacion, onClose, onConfirmar }) => {
  const [calificacion, setCalificacion] = useState(postulacion.calificacion || 0);
  const [comentarios, setComentarios] = useState('');

  return (
    <ModalBase titulo="Calificar Postulación" onClose={onClose} ancho="500px">
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <div>
          <label style={labelStyle}>Calificación (0-10) *</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <input
              type="range"
              min="0"
              max="10"
              value={calificacion}
              onChange={(e) => setCalificacion(parseInt(e.target.value))}
              style={{ flex: 1 }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '8px' }}>
              <Star size={24} style={{ color: '#f59e0b', fill: calificacion > 0 ? '#f59e0b' : 'none' }} />
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#374151' }}>{calificacion}</span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
            <span>Insuficiente</span>
            <span>Regular</span>
            <span>Bueno</span>
            <span>Excelente</span>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Comentarios (Opcional)</label>
          <textarea
            value={comentarios}
            onChange={(e) => setComentarios(e.target.value)}
            rows={4}
            style={inputStyle}
            placeholder="Agregar observaciones sobre la calificación..."
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
          <button
            onClick={() => onConfirmar(calificacion, comentarios)}
            style={{
              flex: 1,
              backgroundColor: '#f59e0b',
              color: 'white',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <Star size={16} />
            Guardar Calificación
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              backgroundColor: '#6b7280',
              color: 'white',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </ModalBase>
  );
};

const InfoRow = ({ icon: Icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
    <Icon size={16} style={{ color: '#1e40af' }} />
    <div style={{ flex: 1 }}>
      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{label}:</span>
      <div style={{ fontSize: '0.875rem', color: '#1e293b', fontWeight: '500' }}>{value}</div>
    </div>
  </div>
);

const ModalBase = ({ titulo, children, onClose, ancho = '500px' }) => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem'
  }}>
    <div style={{
      backgroundColor: 'white',
      borderRadius: '0.75rem',
      padding: '2rem',
      maxWidth: ancho,
      width: '100%',
      maxHeight: '90vh',
      overflow: 'auto',
      boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>{titulo}</h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.5rem',
            color: '#6b7280',
            padding: '0.25rem'
          }}
        >
          <X size={24} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

const Notificacion = ({ type, message, onClose }) => {
  const isError = type === 'error';
  const bgColor = isError ? '#fee2e2' : '#d1fae5';
  const textColor = isError ? '#dc2626' : '#065f46';
  const borderColor = isError ? '#f87171' : '#34d399';
  const Icon = isError ? AlertCircle : CheckCircle;

  return (
    <div style={{
      position: 'fixed',
      top: '1rem',
      right: '1rem',
      backgroundColor: bgColor,
      border: `1px solid ${borderColor}`,
      borderRadius: '0.75rem',
      padding: '1rem',
      maxWidth: '400px',
      zIndex: 1000,
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Icon size={20} style={{ color: textColor }} />
        <div style={{ flex: 1, color: textColor, fontSize: '0.875rem', lineHeight: '1.4' }}>{message}</div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: textColor,
            padding: '0.25rem'
          }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

// Estilos
const thStyle = {
  padding: '1rem',
  textAlign: 'left',
  fontSize: '0.75rem',
  fontWeight: '600',
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const tdStyle = {
  padding: '1rem',
  fontSize: '0.875rem',
  color: '#374151'
};

const actionButtonStyle = (color) => ({
  padding: '0.5rem',
  backgroundColor: color,
  color: 'white',
  border: 'none',
  borderRadius: '0.375rem',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'opacity 0.2s'
});

const labelStyle = {
  display: 'block',
  fontSize: '0.875rem',
  fontWeight: '600',
  marginBottom: '0.5rem',
  color: '#374151'
};

const inputStyle = {
  width: '100%',
  padding: '0.75rem',
  border: '1px solid #d1d5db',
  borderRadius: '0.5rem',
  fontSize: '0.875rem',
  backgroundColor: '#ffffff',
  outline: 'none'
};

export default PostulacionesModule;


