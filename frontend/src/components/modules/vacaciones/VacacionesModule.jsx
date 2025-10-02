import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useApp } from '../../../context/AppContext';
import vacacionesService from '../../../api/vacacionesService';
import { Calendar, Plus, Clock, Check, X, FileText, Users, ArrowRight, AlertTriangle, Edit } from 'lucide-react';

const VacacionesModule = () => {
  const { user } = useAuth();
  const { showSuccessMessage, showErrorMessage } = useApp();
  const [activeTab, setActiveTab] = useState('solicitar');
  const [loading, setLoading] = useState(false);
  
  // Estados principales
  const [solicitudes, setSolicitudes] = useState([]);
  const [estadisticas, setEstadisticas] = useState({
    diasTotales: 0,
    diasUsados: 0,
    diasDisponibles: 0
  });

  // Modal de aprobación manual
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualApprovalData, setManualApprovalData] = useState({
    solicitudId: null,
    motivo: '',
    accion: 'aprobada'
  });

  // Formulario de solicitud
  const [solicitudForm, setSolicitudForm] = useState({
    fechaInicio: '',
    fechaFin: '',
    motivo: '',
    tipo: 'vacaciones'
  });

  // Roles con aprobación manual (RRHH)
  const ROLES_APROBACION_MANUAL = ['RRHH', 'Gerente RRHH', 'Director RRHH'];

  const ROLES_LABELS = {
    'Gerente': 'Gerente',
    'Director': 'Director',
    'Gerente RRHH': 'Gerente RRHH',
    'Director RRHH': 'Director RRHH',
    'RRHH': 'RRHH',
    'Colaborador': 'Colaborador'
  };

  // Cargar datos al montar
  useEffect(() => {
    if (user?.id && user?.empleadoId) {
      cargarDatos();
    }
  }, [user]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar solicitudes
      const solicitudesData = await vacacionesService.getSolicitudes(user.id, user.role);
      setSolicitudes(solicitudesData);
      
      // Cargar estadísticas
      const statsData = await vacacionesService.getEstadisticas(user.empleadoId);
      setEstadisticas(statsData);
    } catch (error) {
      showErrorMessage('Error al cargar datos de vacaciones');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular días
  const calcularDias = () => {
    if (solicitudForm.fechaInicio && solicitudForm.fechaFin) {
      const inicio = new Date(solicitudForm.fechaInicio);
      const fin = new Date(solicitudForm.fechaFin);
      const diffTime = fin - inicio;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays > 0 ? diffDays : 0;
    }
    return 0;
  };

  const calcularDiasHabiles = () => {
    if (solicitudForm.fechaInicio && solicitudForm.fechaFin) {
      const inicio = new Date(solicitudForm.fechaInicio);
      const fin = new Date(solicitudForm.fechaFin);
      let diasHabiles = 0;
      
      for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
        const diaSemana = d.getDay();
        if (diaSemana !== 0 && diaSemana !== 6) {
          diasHabiles++;
        }
      }
      return diasHabiles;
    }
    return 0;
  };

  // Crear solicitud
  const handleSubmitSolicitud = async (e) => {
    e.preventDefault();
    
    if (!solicitudForm.fechaInicio || !solicitudForm.fechaFin || !solicitudForm.motivo.trim()) {
      showErrorMessage('Por favor completa todos los campos obligatorios');
      return;
    }

    const inicio = new Date(solicitudForm.fechaInicio);
    const fin = new Date(solicitudForm.fechaFin);
    
    if (inicio >= fin) {
      showErrorMessage('La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }

    if (inicio <= new Date()) {
      showErrorMessage('La fecha de inicio debe ser futura');
      return;
    }

    const diasSolicitados = calcularDias();
    
    if (diasSolicitados > estadisticas.diasDisponibles && solicitudForm.tipo === 'vacaciones') {
      showErrorMessage(`No tienes suficientes días disponibles. Solicitas ${diasSolicitados} días pero solo tienes ${estadisticas.diasDisponibles} disponibles.`);
      return;
    }

    try {
      setLoading(true);

      await vacacionesService.crearSolicitud({
        empleadoId: user.empleadoId,
        tipo: solicitudForm.tipo,
        fechaInicio: solicitudForm.fechaInicio,
        fechaFin: solicitudForm.fechaFin,
        dias: diasSolicitados,
        diasHabiles: calcularDiasHabiles(),
        motivo: solicitudForm.motivo
      });

      await cargarDatos();

      showSuccessMessage(`Solicitud de ${diasSolicitados} días enviada correctamente.`);
      
      setSolicitudForm({
        fechaInicio: '',
        fechaFin: '',
        motivo: '',
        tipo: 'vacaciones'
      });
    } catch (error) {
      showErrorMessage('Error al crear solicitud: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Aprobar/Rechazar solicitud
  const handleAprobarSolicitud = async (solicitudId, accion, esManual = false, motivoManual = '') => {
    try {
      setLoading(true);

      await vacacionesService.procesarSolicitud(solicitudId, {
        accion,
        aprobadorId: user.empleadoId,
        rol: user.role,
        esManual,
        motivoManual
      });

      await cargarDatos();

      if (esManual) {
        showSuccessMessage(`Aprobación manual registrada: ${accion}`);
      } else {
        const mensaje = accion === 'aprobada' 
          ? 'Solicitud aprobada y enviada al siguiente nivel' 
          : 'Solicitud rechazada';
        showSuccessMessage(mensaje);
      }
    } catch (error) {
      showErrorMessage('Error al procesar solicitud: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleManualApproval = () => {
    if (!manualApprovalData.motivo.trim()) {
      showErrorMessage('Debes proporcionar un motivo para la aprobación manual');
      return;
    }

    handleAprobarSolicitud(
      manualApprovalData.solicitudId, 
      manualApprovalData.accion, 
      true, 
      manualApprovalData.motivo
    );

    setShowManualModal(false);
    setManualApprovalData({
      solicitudId: null,
      motivo: '',
      accion: 'aprobada'
    });
  };

  const openManualModal = (solicitudId, accion = 'aprobada') => {
    setManualApprovalData({
      solicitudId,
      motivo: '',
      accion
    });
    setShowManualModal(true);
  };

  // Verificar si puede aprobar
  const puedeAprobar = (solicitud) => {
    if (!solicitud.flujoAprobacion) return { puede: false };
    
    if (solicitud.flujoAprobacion.actual === user.role) {
      return { puede: true, motivo: 'normal' };
    }
    
    if (ROLES_APROBACION_MANUAL.includes(user.role)) {
      return { puede: true, motivo: 'manual' };
    }
    
    return { puede: false };
  };

  // Obtener solicitudes pendientes
  const solicitudesPendientes = solicitudes.filter(sol => {
    if (sol.estado !== 'pendiente') return false;
    const permisos = puedeAprobar(sol);
    return permisos.puede;
  });

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'aprobada': return { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' };
      case 'rechazada': return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
      case 'pendiente': return { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' };
      default: return { bg: '#f9fafb', color: '#374151', border: '#e5e7eb' };
    }
  };

  const getTipoLabel = (tipo) => {
    switch (tipo) {
      case 'vacaciones': return 'Vacaciones';
      case 'permiso': return 'Permiso Personal';
      case 'medico': return 'Permiso Médico';
      default: return tipo;
    }
  };

  const getEtiquetaVista = () => {
    switch (user.role) {
      case 'Director RRHH':
      case 'Gerente RRHH':
        return 'Vista Global Completa - Toda la Empresa';
      case 'RRHH':
        return 'Vista RRHH - Gerentes y Colaboradores';
      case 'Director':
        return 'Vista Directiva - Gerentes y Colaboradores';
      case 'Gerente':
        return 'Vista Gerencial - Colaboradores Directos';
      default:
        return 'Vista Personal - Mis Solicitudes';
    }
  };

  const FlujAprobacion = ({ flujo, estado, aprobacionManual }) => {
    if (!flujo) return null;
    
    return (
      <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <h5 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', margin: 0 }}>
            Flujo de Aprobación
          </h5>
          {aprobacionManual && (
            <span style={{
              padding: '0.25rem 0.5rem',
              borderRadius: '9999px',
              fontSize: '0.625rem',
              fontWeight: '600',
              background: '#fef3c7',
              color: '#92400e',
              border: '1px solid #fcd34d'
            }}>
              APROBACIÓN MANUAL
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {flujo.requeridos?.map((rol, index) => {
            const isCompleted = flujo.completados?.includes(rol);
            const isCurrent = flujo.actual === rol && estado === 'pendiente';
            
            return (
              <React.Fragment key={index}>
                <div style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  background: isCompleted ? '#f0fdf4' : isCurrent ? '#fff7ed' : '#f1f5f9',
                  color: isCompleted ? '#166534' : isCurrent ? '#ea580c' : '#64748b',
                  border: `1px solid ${isCompleted ? '#bbf7d0' : isCurrent ? '#fed7aa' : '#cbd5e1'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  {isCompleted && <Check style={{ width: '0.75rem', height: '0.75rem' }} />}
                  {isCurrent && <Clock style={{ width: '0.75rem', height: '0.75rem' }} />}
                  {ROLES_LABELS[rol] || rol}
                </div>
                {index < flujo.requeridos.length - 1 && (
                  <ArrowRight style={{ width: '1rem', height: '1rem', color: '#9ca3af' }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
        
        {flujo.historial && flujo.historial.length > 0 && (
          <div style={{ marginTop: '0.75rem' }}>
            <h6 style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', margin: 0, marginBottom: '0.5rem' }}>
              HISTORIAL DE APROBACIONES
            </h6>
            {flujo.historial.map((evento, index) => (
              <div key={index} style={{ 
                fontSize: '0.75rem', 
                color: '#6b7280', 
                marginBottom: '0.5rem',
                padding: '0.5rem',
                background: evento.tipo === 'manual' ? '#fef3c7' : 'transparent',
                borderRadius: '0.25rem',
                border: evento.tipo === 'manual' ? '1px solid #fcd34d' : 'none'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {evento.accion === 'aprobada' ? '✅' : '❌'} 
                  <strong>{ROLES_LABELS[evento.rol] || evento.rol}</strong>: {evento.aprobadoPor}
                  {evento.tipo === 'manual' && (
                    <span style={{
                      padding: '0.125rem 0.375rem',
                      borderRadius: '9999px',
                      fontSize: '0.625rem',
                      fontWeight: '600',
                      background: '#92400e',
                      color: '#fef3c7'
                    }}>
                      MANUAL
                    </span>
                  )}
                </div>
                <div style={{ marginLeft: '1.25rem', marginTop: '0.25rem' }}>
                  Fecha: {new Date(evento.fecha).toLocaleString()}
                  {evento.motivoManual && (
                    <div style={{ marginTop: '0.25rem', fontStyle: 'italic' }}>
                      Motivo: {evento.motivoManual}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: '1.5rem' }}>
      {/* Modal de Aprobación Manual */}
      {showManualModal && (
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
            borderRadius: '0.75rem',
            padding: '1.5rem',
            maxWidth: '28rem',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
              Aprobación Manual
            </h3>
            <div style={{
              background: '#fef3c7',
              border: '1px solid #fcd34d',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              marginBottom: '1rem'
            }}>
              <p style={{ fontSize: '0.875rem', color: '#92400e', margin: 0 }}>
                ⚠️ Esta acción saltará el flujo normal de aprobación y será registrada como aprobación manual.
              </p>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Acción
              </label>
              <select
                value={manualApprovalData.accion}
                onChange={(e) => setManualApprovalData(prev => ({ ...prev, accion: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }}
              >
                <option value="aprobada">Aprobar</option>
                <option value="rechazada">Rechazar</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Motivo de la aprobación manual *
              </label>
              <textarea
                value={manualApprovalData.motivo}
                onChange={(e) => setManualApprovalData(prev => ({ ...prev, motivo: e.target.value }))}
                placeholder="Ej: Aprobación urgente por emergencia familiar, autorización directa del CEO, etc."
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowManualModal(false)}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleManualApproval}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Confirmar Aprobación Manual
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '112rem', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
          Sistema de Gestión de Vacaciones
        </h1>
        <p style={{ color: '#6b7280', fontSize: '1.125rem', marginBottom: '2rem' }}>
          {getEtiquetaVista()}
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(15rem, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '0.75rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
            padding: '1.5rem'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
              Días Disponibles
            </h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981', margin: 0 }}>
              {estadisticas.diasDisponibles}
            </p>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '0.75rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
            padding: '1.5rem'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
              Pendientes en Mi Nivel
            </h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b', margin: 0 }}>
              {solicitudesPendientes.length}
            </p>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '0.75rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
            padding: '1.5rem'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
              Total Solicitudes
            </h3>
            <p style={{ fontSize: '1rem', fontWeight: 'bold', color: '#3b82f6', margin: 0 }}>
              {solicitudes.length} solicitudes
              {ROLES_APROBACION_MANUAL.includes(user.role) && (
                <span style={{ 
                  display: 'block', 
                  fontSize: '0.75rem', 
                  color: '#dc2626', 
                  fontWeight: '500' 
                }}>
                  + Aprobación Manual
                </span>
              )}
            </p>
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '0.75rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
            <button
              onClick={() => setActiveTab('solicitar')}
              style={{
                flex: 1,
                padding: '1rem',
                border: 'none',
                background: activeTab === 'solicitar' ? '#f8fafc' : 'transparent',
                color: activeTab === 'solicitar' ? '#3b82f6' : '#6b7280',
                fontWeight: activeTab === 'solicitar' ? '600' : '500',
                cursor: 'pointer'
              }}
            >
              Solicitar Vacaciones
            </button>
            <button
              onClick={() => setActiveTab('historial')}
              style={{
                flex: 1,
                padding: '1rem',
                border: 'none',
                background: activeTab === 'historial' ? '#f8fafc' : 'transparent',
                color: activeTab === 'historial' ? '#3b82f6' : '#6b7280',
                fontWeight: activeTab === 'historial' ? '600' : '500',
                cursor: 'pointer'
              }}
            >
              Historial ({solicitudes.length})
            </button>
            {['Gerente', 'Director', 'RRHH', 'Gerente RRHH', 'Director RRHH'].includes(user.role) && (
              <button
                onClick={() => setActiveTab('aprobar')}
                style={{
                  flex: 1,
                  padding: '1rem',
                  border: 'none',
                  background: activeTab === 'aprobar' ? '#f8fafc' : 'transparent',
                  color: activeTab === 'aprobar' ? '#3b82f6' : '#6b7280',
                  fontWeight: activeTab === 'aprobar' ? '600' : '500',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                Aprobar Solicitudes
                {solicitudesPendientes.length > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    background: '#dc2626',
                    color: 'white',
                    borderRadius: '50%',
                    width: '1.5rem',
                    height: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}>
                    {solicitudesPendientes.length}
                  </span>
                )}
              </button>
            )}
          </div>

          <div style={{ padding: '2rem' }}>
            {activeTab === 'solicitar' && (
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1.5rem' }}>
                  Nueva Solicitud
                </h3>

                <form onSubmit={handleSubmitSolicitud} style={{ maxWidth: '32rem' }}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                      Tipo de Solicitud *
                    </label>
                    <select
                      value={solicitudForm.tipo}
                      onChange={(e) => setSolicitudForm(prev => ({ ...prev, tipo: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '1rem'
                      }}
                      required
                    >
                      <option value="vacaciones">Vacaciones</option>
                      <option value="permiso">Permiso Personal</option>
                      <option value="medico">Permiso Médico</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                        Fecha de Inicio *
                      </label>
                      <input
                        type="date"
                        value={solicitudForm.fechaInicio}
                        onChange={(e) => setSolicitudForm(prev => ({ ...prev, fechaInicio: e.target.value }))}
                        min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.5rem',
                          fontSize: '1rem'
                        }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                        Fecha de Fin *
                      </label>
                      <input
                        type="date"
                        value={solicitudForm.fechaFin}
                        onChange={(e) => setSolicitudForm(prev => ({ ...prev, fechaFin: e.target.value }))}
                        min={solicitudForm.fechaInicio || new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.5rem',
                          fontSize: '1rem'
                        }}
                        required
                      />
                    </div>
                  </div>

                  {calcularDias() > 0 && (
                    <div style={{
                      background: '#f0f9ff',
                      border: '1px solid #bae6fd',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      marginBottom: '1.5rem'
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(8rem, 1fr))', gap: '1rem' }}>
                        <div>
                          <p style={{ fontSize: '0.75rem', color: '#0369a1', margin: 0, marginBottom: '0.25rem', fontWeight: '600' }}>
                            DÍAS TOTALES
                          </p>
                          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0369a1', margin: 0 }}>
                            {calcularDias()}
                          </p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.75rem', color: '#0369a1', margin: 0, marginBottom: '0.25rem', fontWeight: '600' }}>
                            DÍAS HÁBILES
                          </p>
                          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0369a1', margin: 0 }}>
                            {calcularDiasHabiles()}
                          </p>
                        </div>
                        {solicitudForm.tipo === 'vacaciones' && (
                          <div>
                            <p style={{ fontSize: '0.75rem', color: '#0369a1', margin: 0, marginBottom: '0.25rem', fontWeight: '600' }}>
                              DÍAS DISPONIBLES
                            </p>
                            <p style={{ 
                              fontSize: '1.5rem', 
                              fontWeight: 'bold', 
                              color: estadisticas.diasDisponibles >= calcularDias() ? '#0369a1' : '#dc2626', 
                              margin: 0 
                            }}>
                              {estadisticas.diasDisponibles}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {solicitudForm.tipo === 'vacaciones' && calcularDias() > estadisticas.diasDisponibles && (
                        <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.375rem' }}>
                          <p style={{ fontSize: '0.75rem', color: '#dc2626', margin: 0 }}>
                            ⚠️ No tienes suficientes días de vacaciones disponibles
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                      Motivo / Justificación *
                    </label>
                    <textarea
                      value={solicitudForm.motivo}
                      onChange={(e) => setSolicitudForm(prev => ({ ...prev, motivo: e.target.value }))}
                      placeholder="Describe el motivo de tu solicitud..."
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '1rem',
                        resize: 'vertical'
                      }}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      background: loading ? '#9ca3af' : '#3b82f6',
                      color: 'white',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '0.5rem',
                      border: 'none',
                      fontSize: '1rem',
                      fontWeight: '500',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Plus style={{ width: '1rem', height: '1rem' }} />
                    {loading ? 'Enviando...' : 'Enviar Solicitud'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'historial' && (
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  Historial de Solicitudes
                </h3>

                {loading ? (
                  <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <p>Cargando...</p>
                  </div>
                ) : solicitudes.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '3rem',
                    background: '#f9fafb',
                    borderRadius: '0.5rem',
                    border: '1px solid #e5e7eb'
                  }}>
                    <FileText style={{ width: '3rem', height: '3rem', color: '#9ca3af', margin: '0 auto 1rem' }} />
                    <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0, marginBottom: '0.5rem' }}>
                      No hay solicitudes
                    </h4>
                    <p style={{ color: '#6b7280', margin: 0 }}>
                      Aún no tienes solicitudes de vacaciones registradas.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {solicitudes.map(solicitud => {
                      const estadoStyle = getEstadoColor(solicitud.estado);
                      const esMia = solicitud.empleadoId === user.empleadoId;
                      
                      return (
                        <div
                          key={solicitud.id}
                          style={{
                            border: esMia ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                            borderRadius: '0.5rem',
                            padding: '1.5rem',
                            background: esMia ? '#f8fafc' : 'white'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                            <div>
                              <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0, marginBottom: '0.5rem' }}>
                                {solicitud.empleado} - {getTipoLabel(solicitud.tipo)}
                                {esMia && (
                                  <span style={{
                                    marginLeft: '0.5rem',
                                    padding: '0.125rem 0.5rem',
                                    borderRadius: '9999px',
                                    fontSize: '0.75rem',
                                    fontWeight: '500',
                                    background: '#dbeafe',
                                    color: '#1d4ed8'
                                  }}>
                                    MÍA
                                  </span>
                                )}
                              </h4>
                              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                                {solicitud.puesto} • {solicitud.departamento}
                              </p>
                            </div>
                            <span style={{
                              padding: '0.25rem 0.75rem',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              background: estadoStyle.bg,
                              color: estadoStyle.color,
                              border: `1px solid ${estadoStyle.border}`,
                              textTransform: 'capitalize'
                            }}>
                              {solicitud.estado === 'pendiente' && <Clock style={{ width: '0.75rem', height: '0.75rem', display: 'inline', marginRight: '0.25rem' }} />}
                              {solicitud.estado === 'aprobada' && <Check style={{ width: '0.75rem', height: '0.75rem', display: 'inline', marginRight: '0.25rem' }} />}
                              {solicitud.estado === 'rechazada' && <X style={{ width: '0.75rem', height: '0.75rem', display: 'inline', marginRight: '0.25rem' }} />}
                              {solicitud.estado}
                            </span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(10rem, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>FECHA INICIO</p>
                              <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827', margin: 0 }}>
                                {new Date(solicitud.fechaInicio).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>FECHA FIN</p>
                              <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827', margin: 0 }}>
                                {new Date(solicitud.fechaFin).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>DÍAS</p>
                              <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827', margin: 0 }}>
                                {solicitud.dias} días
                              </p>
                            </div>
                          </div>

                          <div style={{ marginBottom: '1rem' }}>
                            <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>MOTIVO</p>
                            <p style={{ fontSize: '0.875rem', color: '#111827', margin: 0 }}>
                              {solicitud.motivo}
                            </p>
                          </div>

                          <FlujAprobacion 
                            flujo={solicitud.flujoAprobacion} 
                            estado={solicitud.estado}
                            aprobacionManual={solicitud.aprobacionManual}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'aprobar' && (
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  Solicitudes Pendientes ({solicitudesPendientes.length})
                </h3>
                
                {ROLES_APROBACION_MANUAL.includes(user.role) && (
                  <div style={{
                    background: '#fef3c7',
                    border: '1px solid #fcd34d',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    marginBottom: '1.5rem'
                  }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#92400e', margin: 0, marginBottom: '0.5rem' }}>
                      🔑 Privilegios de Aprobación Manual
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: '#92400e', margin: 0 }}>
                      Puedes realizar aprobaciones manuales que saltan el flujo normal.
                    </p>
                  </div>
                )}

                {solicitudesPendientes.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '3rem',
                    background: '#f9fafb',
                    borderRadius: '0.5rem',
                    border: '1px solid #e5e7eb'
                  }}>
                    <Users style={{ width: '3rem', height: '3rem', color: '#9ca3af', margin: '0 auto 1rem' }} />
                    <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0 }}>
                      No hay solicitudes pendientes
                    </h4>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {solicitudesPendientes.map(solicitud => {
                      const permisos = puedeAprobar(solicitud);
                      const esNormal = permisos.motivo === 'normal';
                      
                      return (
                        <div key={solicitud.id} style={{
                          border: '1px solid #e5e7eb',
                          borderRadius: '0.5rem',
                          padding: '1.5rem',
                          background: esNormal ? '#fffbeb' : '#fef3c7'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div>
                              <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0 }}>
                                {solicitud.empleado} - {getTipoLabel(solicitud.tipo)}
                              </h4>
                              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                                {solicitud.dias} días • {new Date(solicitud.fechaInicio).toLocaleDateString()} - {new Date(solicitud.fechaFin).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div style={{ marginBottom: '1rem' }}>
                            <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>MOTIVO</p>
                            <p style={{ fontSize: '0.875rem', color: '#111827', margin: 0 }}>{solicitud.motivo}</p>
                          </div>

                          <FlujAprobacion flujo={solicitud.flujoAprobacion} estado={solicitud.estado} />

                          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
                            {esNormal ? (
                              <>
                                <button
                                  onClick={() => handleAprobarSolicitud(solicitud.id, 'aprobada')}
                                  disabled={loading}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.5rem 1rem',
                                    background: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    cursor: loading ? 'not-allowed' : 'pointer'
                                  }}
                                >
                                  <Check style={{ width: '1rem', height: '1rem' }} />
                                  Aprobar
                                </button>
                                <button
                                  onClick={() => handleAprobarSolicitud(solicitud.id, 'rechazada')}
                                  disabled={loading}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.5rem 1rem',
                                    background: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    cursor: loading ? 'not-allowed' : 'pointer'
                                  }}
                                >
                                  <X style={{ width: '1rem', height: '1rem' }} />
                                  Rechazar
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => openManualModal(solicitud.id, 'aprobada')}
                                  disabled={loading}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.5rem 1rem',
                                    background: '#dc2626',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    cursor: loading ? 'not-allowed' : 'pointer'
                                  }}
                                >
                                  <Edit style={{ width: '1rem', height: '1rem' }} />
                                  Aprobación Manual
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VacacionesModule;