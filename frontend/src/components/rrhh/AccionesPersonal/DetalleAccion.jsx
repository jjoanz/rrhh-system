import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { 
  X, CheckCircle, XCircle, Play, FileText, Calendar, 
  User, Building2, DollarSign, Clock, AlertCircle, Download
} from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://192.168.0.239:5000/api';

const DetalleAccion = ({ accionId, onClose, onSuccess }) => {
  // ... resto del código
  const [accion, setAccion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [comentariosAprobacion, setComentariosAprobacion] = useState('');
  const [mostrarModalRechazo, setMostrarModalRechazo] = useState(false);
  const [mostrarModalAprobar, setMostrarModalAprobar] = useState(false);
  const [mostrarModalEjecutar, setMostrarModalEjecutar] = useState(false);

  useEffect(() => {
    cargarAccion();
  }, [accionId]);

  const cargarAccion = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('rrhh_token')?.trim();      const response = await fetch(`${API_URL}/acciones-personal/${accionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setAccion(data.accion);
      } else {
        setMensaje({ tipo: 'error', texto: 'Error al cargar la acción' });
      }
    } catch (error) {
      console.error('Error:', error);
      setMensaje({ tipo: 'error', texto: 'Error al cargar los detalles' });
    } finally {
      setLoading(false);
    }
  };

  const aprobarAccion = async () => {
    try {
      setProcesando(true);
      setMensaje({ tipo: '', texto: '' });

      const token = localStorage.getItem('rrhh_token')?.trim();      const response = await fetch(`${API_URL}/acciones-personal/${accionId}/aprobar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ comentarios: comentariosAprobacion })
      });

      const data = await response.json();

      if (data.success) {
        setMensaje({ tipo: 'success', texto: 'Acción aprobada exitosamente' });
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setMensaje({ tipo: 'error', texto: data.message || 'Error al aprobar' });
      }
    } catch (error) {
      console.error('Error:', error);
      setMensaje({ tipo: 'error', texto: 'Error al aprobar la acción' });
    } finally {
      setProcesando(false);
      setMostrarModalAprobar(false);
    }
  };

  const rechazarAccion = async () => {
    if (!motivoRechazo.trim()) {
      setMensaje({ tipo: 'error', texto: 'Debe proporcionar un motivo de rechazo' });
      return;
    }

    try {
      setProcesando(true);
      setMensaje({ tipo: '', texto: '' });

      const token = localStorage.getItem('rrhh_token')?.trim();      const response = await fetch(`${API_URL}/acciones-personal/${accionId}/rechazar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ motivo: motivoRechazo })
      });

      const data = await response.json();

      if (data.success) {
        setMensaje({ tipo: 'success', texto: 'Acción rechazada' });
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setMensaje({ tipo: 'error', texto: data.message || 'Error al rechazar' });
      }
    } catch (error) {
      console.error('Error:', error);
      setMensaje({ tipo: 'error', texto: 'Error al rechazar la acción' });
    } finally {
      setProcesando(false);
      setMostrarModalRechazo(false);
    }
  };

  const ejecutarAccion = async () => {
    try {
      setProcesando(true);
      setMensaje({ tipo: '', texto: '' });

      const token = localStorage.getItem('rrhh_token')?.trim();      const response = await fetch(`${API_URL}/acciones-personal/${accionId}/ejecutar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setMensaje({ tipo: 'success', texto: 'Acción ejecutada exitosamente. Los cambios han sido aplicados.' });
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        setMensaje({ tipo: 'error', texto: data.message || 'Error al ejecutar la acción' });
      }
    } catch (error) {
      console.error('Error:', error);
      setMensaje({ tipo: 'error', texto: 'Error al ejecutar la acción' });
    } finally {
      setProcesando(false);
      setMostrarModalEjecutar(false);
    }
  };

  const obtenerNombreTipo = (codigo) => {
    const tipos = {
      'INGRESO': 'Ingreso de Personal',
      'REINGRESO': 'Reingreso',
      'PROMOCION': 'Promoción',
      'CAMBIO_DEPTO': 'Cambio de Departamento',
      'CAMBIO_PUESTO': 'Cambio de Puesto',
      'AJUSTE_SALARIAL': 'Ajuste Salarial',
      'TRANSFERENCIA': 'Transferencia',
      'CAMBIO_SUPERVISOR': 'Cambio de Supervisor',
      'CAMBIO_JORNADA': 'Cambio de Jornada',
      'CAMBIO_TURNO': 'Cambio de Turno',
      'RENOVACION_CONTRATO': 'Renovación de Contrato',
      'CAMBIO_TIPO_CONTRATO': 'Cambio de Tipo de Contrato',
      'EXTENSION_PRUEBA': 'Extensión de Prueba',
      'AMONESTACION': 'Amonestación',
      'SUSPENSION': 'Suspensión',
      'SANCION': 'Sanción',
      'TERMINACION': 'Terminación',
      'JUBILACION': 'Jubilación'
    };
    return tipos[codigo] || codigo;
  };

  const obtenerColorEstado = (estado) => {
    const colores = {
      'Pendiente': { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
      'Aprobada': { bg: '#d1fae5', text: '#065f46', border: '#86efac' },
      'Rechazada': { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
      'Ejecutada': { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe' }
    };
    return colores[estado] || { bg: '#f3f4f6', text: '#1f2937', border: '#d1d5db' };
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderDatosEspecificos = () => {
    if (!accion) return null;

    const datosNuevos = JSON.parse(accion.DatosNuevos || '{}');
    const datosAnteriores = JSON.parse(accion.DatosAnteriores || '{}');

    switch (accion.TipoAccion) {
      case 'INGRESO':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            <InfoItem icon={<User size={18} />} label="Nombre Completo" value={datosNuevos.nombre ? `${datosNuevos.nombre} ${datosNuevos.apellido || ''}` : 'N/A'} />
            <InfoItem icon={<FileText size={18} />} label="Cédula" value={datosNuevos.cedula} />
            <InfoItem icon={<Building2 size={18} />} label="Cargo" value={datosNuevos.cargo} />
            <InfoItem icon={<DollarSign size={18} />} label="Salario" value={`RD$ ${parseFloat(datosNuevos.salario || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`} />
            <InfoItem icon={<Calendar size={18} />} label="Tipo de Contrato" value={datosNuevos.tipoContrato} />
            <InfoItem icon={<Clock size={18} />} label="Jornada" value={datosNuevos.jornada} />
          </div>
        );

      case 'PROMOCION':
        return (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>Cargo Anterior</p>
                <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937', margin: '0.25rem 0 0' }}>
                  {datosAnteriores.cargo || 'N/A'}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>Nuevo Cargo</p>
                <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#059669', margin: '0.25rem 0 0' }}>
                  {datosNuevos.nuevoCargo || 'N/A'}
                </p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>Salario Anterior</p>
                <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937', margin: '0.25rem 0 0' }}>
                  RD$ {parseFloat(datosAnteriores.salario || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>Nuevo Salario</p>
                <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#059669', margin: '0.25rem 0 0' }}>
                  RD$ {parseFloat(datosNuevos.nuevoSalario || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        );

      case 'AJUSTE_SALARIAL':
        const salarioAnterior = parseFloat(datosAnteriores.salario || 0);
        const salarioNuevo = parseFloat(datosNuevos.nuevoSalario || 0);
        const incremento = salarioNuevo - salarioAnterior;
        const porcentaje = salarioAnterior > 0 ? ((incremento / salarioAnterior) * 100).toFixed(2) : 0;
        
        return (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>Salario Actual</p>
                <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937', margin: '0.25rem 0 0' }}>
                  RD$ {salarioAnterior.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>Nuevo Salario</p>
                <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#059669', margin: '0.25rem 0 0' }}>
                  RD$ {salarioNuevo.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <div style={{
              padding: '1rem',
              background: '#f0fdf4',
              borderRadius: '8px',
              border: '1px solid #86efac'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '0.75rem', color: '#166534', margin: 0 }}>Incremento</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#15803d', margin: '0.25rem 0 0' }}>
                    RD$ {incremento.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '0.75rem', color: '#166534', margin: 0 }}>Porcentaje</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#15803d', margin: '0.25rem 0 0' }}>
                    {porcentaje}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'CAMBIO_DEPTO':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>Departamento Anterior</p>
              <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937', margin: '0.25rem 0 0' }}>
                {datosAnteriores.departamento || 'N/A'}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>Nuevo Departamento</p>
              <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#059669', margin: '0.25rem 0 0' }}>
                {datosNuevos.nuevoDepartamento || 'N/A'}
              </p>
            </div>
          </div>
        );

      case 'CAMBIO_PUESTO':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>Puesto Anterior</p>
              <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937', margin: '0.25rem 0 0' }}>
                {datosAnteriores.puesto || 'N/A'}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>Nuevo Puesto</p>
              <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#059669', margin: '0.25rem 0 0' }}>
                {datosNuevos.nuevoCargo || 'N/A'}
              </p>
            </div>
          </div>
        );

      case 'TERMINACION':
        return (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <InfoItem icon={<Calendar size={18} />} label="Fecha de Salida" value={formatearFecha(datosNuevos.fechaSalida)} />
            <div>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>Motivo de Salida</p>
              <p style={{ fontSize: '0.875rem', color: '#1f2937', margin: '0.25rem 0 0', lineHeight: '1.5' }}>
                {datosNuevos.motivoSalida || 'No especificado'}
              </p>
            </div>
          </div>
        );

      default:
        return (
          <div style={{
            padding: '1rem',
            background: '#f9fafb',
            borderRadius: '8px',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <FileText size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: '0.875rem' }}>
              Detalles específicos no disponibles para este tipo de acción
            </p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '3rem',
          textAlign: 'center'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#6b7280' }}>Cargando detalles...</p>
        </div>
      </div>
    );
  }

  if (!accion) {
    return null;
  }

  const colorEstado = obtenerColorEstado(accion.Estado);

  return (
    <>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
        overflow: 'auto'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '900px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}>
          {/* Header */}
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: 'white',
            borderRadius: '12px 12px 0 0'
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {obtenerNombreTipo(accion.TipoAccion)}
                </h2>
                <span style={{
                  padding: '0.375rem 0.75rem',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  background: colorEstado.bg,
                  color: colorEstado.text,
                  border: `1px solid ${colorEstado.border}`
                }}>
                  {accion.Estado}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.9 }}>
                Acción #{accion.AccionID} • {accion.NombreEmpleado}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '6px',
                padding: '0.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: 'white'
              }}
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem'
          }}>
            {/* Mensajes */}
            {mensaje.texto && (
              <div style={{
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                background: mensaje.tipo === 'success' ? '#d1fae5' : '#fee2e2',
                color: mensaje.tipo === 'success' ? '#065f46' : '#991b1b',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertCircle size={20} />
                <span>{mensaje.texto}</span>
              </div>
            )}

            {/* Información del Empleado */}
            <div style={{
              padding: '1.5rem',
              background: '#f9fafb',
              borderRadius: '12px',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <User size={20} color="#3b82f6" />
                Información del Empleado
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <InfoItem label="Nombre" value={accion.NombreEmpleado} />
                <InfoItem label="Cédula" value={accion.CEDULA} />
                <InfoItem label="Email" value={accion.Email} />
                <InfoItem label="Teléfono" value={accion.Telefono} />
              </div>
            </div>

            {/* Detalles de la Acción */}
            <div style={{
              padding: '1.5rem',
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <FileText size={20} color="#3b82f6" />
                Detalles de la Acción
              </h3>
              {renderDatosEspecificos()}
            </div>

            {/* Fechas y Solicitante */}
            <div style={{
              padding: '1.5rem',
              background: '#f9fafb',
              borderRadius: '12px',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Calendar size={20} color="#3b82f6" />
                Información Administrativa
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <InfoItem label="Fecha de Solicitud" value={formatearFecha(accion.FechaSolicitud)} />
                <InfoItem label="Fecha Efectiva" value={formatearFecha(accion.FechaEfectiva)} />
                <InfoItem label="Solicitado por" value={accion.Solicitante} />
                {accion.AprobadoPor && (
                  <InfoItem label="Aprobado por" value={accion.AprobadoPor} />
                )}
                {accion.FechaAprobacion && (
                  <InfoItem label="Fecha de Aprobación" value={formatearFecha(accion.FechaAprobacion)} />
                )}
                {accion.EjecutadoPor && (
                  <InfoItem label="Ejecutado por" value={accion.EjecutadoPor} />
                )}
                {accion.FechaEjecucion && (
                  <InfoItem label="Fecha de Ejecución" value={formatearFecha(accion.FechaEjecucion)} />
                )}
              </div>
            </div>

            {/* Justificación */}
            {accion.Justificacion && (
              <div style={{
                padding: '1.5rem',
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#1f2937',
                  marginBottom: '0.75rem'
                }}>
                  Justificación
                </h3>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#4b5563',
                  lineHeight: '1.6',
                  margin: 0,
                  whiteSpace: 'pre-wrap'
                }}>
                  {accion.Justificacion}
                </p>
              </div>
            )}

            {/* Comentarios de Aprobación/Rechazo */}
            {accion.ComentariosAprobacion && (
              <div style={{
                padding: '1.5rem',
                background: accion.Estado === 'Rechazada' ? '#fef2f2' : '#f0fdf4',
                border: `1px solid ${accion.Estado === 'Rechazada' ? '#fecaca' : '#86efac'}`,
                borderRadius: '12px',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: accion.Estado === 'Rechazada' ? '#991b1b' : '#065f46',
                  marginBottom: '0.75rem'
                }}>
                  {accion.Estado === 'Rechazada' ? 'Motivo de Rechazo' : 'Comentarios de Aprobación'}
                </h3>
                <p style={{
                  fontSize: '0.875rem',
                  color: accion.Estado === 'Rechazada' ? '#7f1d1d' : '#14532d',
                  lineHeight: '1.6',
                  margin: 0
                }}>
                  {accion.ComentariosAprobacion}
                </p>
              </div>
            )}

            {/* Documentos */}
            {accion.documentos && accion.documentos.length > 0 && (
              <div style={{
                padding: '1.5rem',
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px'
              }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#1f2937',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <FileText size={20} color="#3b82f6" />
                  Documentos Adjuntos ({accion.documentos.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {accion.documentos.map(doc => (
                    <div
                      key={doc.DocumentoID}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',alignItems: 'center',
                        padding: '0.75rem',
                        background: '#f9fafb',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                      }}
                    >
                      <div>
                        <p style={{ fontWeight: '600', color: '#1f2937', margin: 0, fontSize: '0.875rem' }}>
                          {doc.NombreArchivo}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0.25rem 0 0' }}>
                          {doc.TipoDocumento} • {formatearFecha(doc.FechaCarga)}
                        </p>
                      </div>
                      <button
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 1rem',
                          background: '#eff6ff',
                          color: '#2563eb',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        <Download size={16} />
                        Descargar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer con Acciones */}
          <div style={{
            padding: '1.5rem',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1rem',
            background: '#f9fafb'
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '0.625rem 1.5rem',
                background: 'white',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Cerrar
            </button>

            {accion.Estado === 'Pendiente' && (
              <>
                <button
                  onClick={() => setMostrarModalRechazo(true)}
                  disabled={procesando}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.625rem 1.5rem',
                    background: procesando ? '#9ca3af' : 'white',
                    color: '#dc2626',
                    border: '1px solid #dc2626',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: procesando ? 'not-allowed' : 'pointer'
                  }}
                >
                  <XCircle size={18} />
                  Rechazar
                </button>
                <button
                  onClick={() => setMostrarModalAprobar(true)}
                  disabled={procesando}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.625rem 1.5rem',
                    background: procesando ? '#9ca3af' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: procesando ? 'not-allowed' : 'pointer',
                    boxShadow: procesando ? 'none' : '0 4px 6px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <CheckCircle size={18} />
                  Aprobar
                </button>
              </>
            )}

            {accion.Estado === 'Aprobada' && (
              <button
                onClick={() => setMostrarModalEjecutar(true)}
                disabled={procesando}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1.5rem',
                  background: procesando ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: procesando ? 'not-allowed' : 'pointer',
                  boxShadow: procesando ? 'none' : '0 4px 6px rgba(59, 130, 246, 0.3)'
                }}
              >
                <Play size={18} />
                Ejecutar Acción
              </button>
            )}
          </div>

          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>

      {/* Modal de Confirmación de Rechazo */}
      {mostrarModalRechazo && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#1f2937',
              marginTop: 0,
              marginBottom: '1rem'
            }}>
              Rechazar Acción de Personal
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem' }}>
              Por favor, proporcione un motivo detallado para el rechazo de esta acción.
            </p>
            <textarea
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
              placeholder="Explique el motivo del rechazo..."
              rows={4}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem',
                resize: 'vertical',
                marginBottom: '1.5rem',
                fontFamily: 'inherit'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button
                onClick={() => {
                  setMostrarModalRechazo(false);
                  setMotivoRechazo('');
                }}
                style={{
                  padding: '0.625rem 1.5rem',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={rechazarAccion}
                disabled={!motivoRechazo.trim() || procesando}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1.5rem',
                  background: (!motivoRechazo.trim() || procesando) ? '#9ca3af' : '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: (!motivoRechazo.trim() || procesando) ? 'not-allowed' : 'pointer'
                }}
              >
                {procesando ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid white',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Rechazando...
                  </>
                ) : (
                  <>
                    <XCircle size={18} />
                    Confirmar Rechazo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Aprobación */}
      {mostrarModalAprobar && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#1f2937',
              marginTop: 0,
              marginBottom: '1rem'
            }}>
              Aprobar Acción de Personal
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem' }}>
              ¿Está seguro que desea aprobar esta acción? Puede agregar comentarios opcionales.
            </p>
            <textarea
              value={comentariosAprobacion}
              onChange={(e) => setComentariosAprobacion(e.target.value)}
              placeholder="Comentarios adicionales (opcional)..."
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem',
                resize: 'vertical',
                marginBottom: '1.5rem',
                fontFamily: 'inherit'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button
                onClick={() => {
                  setMostrarModalAprobar(false);
                  setComentariosAprobacion('');
                }}
                style={{
                  padding: '0.625rem 1.5rem',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={aprobarAccion}
                disabled={procesando}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1.5rem',
                  background: procesando ? '#9ca3af' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: procesando ? 'not-allowed' : 'pointer',
                  boxShadow: procesando ? 'none' : '0 4px 6px rgba(16, 185, 129, 0.3)'
                }}
              >
                {procesando ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid white',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Aprobando...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Confirmar Aprobación
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Ejecución */}
      {mostrarModalEjecutar && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <AlertCircle size={32} color="#d97706" />
            </div>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#1f2937',
              marginTop: 0,
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              Ejecutar Acción de Personal
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem', textAlign: 'center', lineHeight: '1.6' }}>
              Esta acción aplicará los cambios permanentemente al registro del empleado. 
              <strong style={{ display: 'block', marginTop: '0.5rem', color: '#1f2937' }}>
                Esta operación no se puede deshacer.
              </strong>
            </p>
            <div style={{
              padding: '1rem',
              background: '#fef3c7',
              border: '1px solid #fde68a',
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              <p style={{ fontSize: '0.75rem', color: '#92400e', margin: 0, textAlign: 'center' }}>
                <strong>Tipo de Acción:</strong> {obtenerNombreTipo(accion.TipoAccion)}
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <button
                onClick={() => setMostrarModalEjecutar(false)}
                style={{
                  padding: '0.625rem 1.5rem',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={ejecutarAccion}
                disabled={procesando}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1.5rem',
                  background: procesando ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: procesando ? 'not-allowed' : 'pointer',
                  boxShadow: procesando ? 'none' : '0 4px 6px rgba(59, 130, 246, 0.3)'
                }}
              >
                {procesando ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid white',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Ejecutando...
                  </>
                ) : (
                  <>
                    <Play size={18} />
                    Confirmar Ejecución
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Componente auxiliar para mostrar información
const InfoItem = ({ icon, label, value }) => (
  <div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
      {icon && <span style={{ color: '#6b7280' }}>{icon}</span>}
      <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0, fontWeight: '500' }}>
        {label}
      </p>
    </div>
    <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
      {value || 'N/A'}
    </p>
  </div>
);

export default DetalleAccion;