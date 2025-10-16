import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useApp } from '../../../context/AppContext';
import vacacionesService from '../../../api/vacacionesService';
import { Calendar, Plus, Clock, Check, X, FileText, Users, ArrowRight, AlertTriangle, Edit, Package } from 'lucide-react';

const VacacionesModule = () => {
  const { user } = useAuth();
  const { showSuccessMessage, showErrorMessage } = useApp();
  console.log('🔍 ROL DEL USUARIO:', user.role);
  const [activeTab, setActiveTab] = useState('solicitar');
  const [loading, setLoading] = useState(false);
  
  // Estados principales
  const [solicitudes, setSolicitudes] = useState([]);
  const [estadisticas, setEstadisticas] = useState({
    diasTotales: 0,
    diasUsados: 0,
    diasDisponibles: 0
  });
  const [periodos, setPeriodos] = useState([]);

  // Modal de aprobación manual
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualApprovalData, setManualApprovalData] = useState({
    solicitudId: null,
    motivo: '',
    accion: 'aprobada'
  });

  // Modal de selección de períodos
  const [showPeriodosModal, setShowPeriodosModal] = useState(false);
  const [periodosSeleccionados, setPeriodosSeleccionados] = useState([]);

  // Formulario de solicitud
  const [solicitudForm, setSolicitudForm] = useState({
    fechaInicio: '',
    fechaFin: '',
    motivo: '',
    tipo: 'vacaciones'
  });

  // Roles con aprobación manual (RRHH)
  const ROLES_APROBACION_MANUAL = ['rrhh', 'gerente_rrhh', 'director_rrhh'];

  const ROLES_LABELS = {
  'gerente': 'Gerente',
  'director': 'Director',
  'gerente_rrhh': 'Gerente RRHH',
  'director_rrhh': 'Director RRHH',
  'rrhh': 'RRHH',
  'colaborador': 'Colaborador'
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
    
    const solicitudesData = await vacacionesService.getSolicitudes(user.id, user.role);
    setSolicitudes(solicitudesData);
    
    // CAMBIO: Siempre cargar detalladas
    const statsData = await vacacionesService.getEstadisticasDetalladas(user.empleadoId);
    console.log('Estadísticas:', statsData); // DEBUG: agrega esto para ver qué devuelve
    setEstadisticas(statsData.totales);
    setPeriodos(statsData.periodos || []); // AGREGAR: default a array vacío
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

  // Abrir modal de períodos
  const abrirModalPeriodos = () => {
    console.log('🔧 Ejecutando abrirModalPeriodos');
    console.log('Períodos recibidos:', periodos);
    console.log('ESTRUCTURA COMPLETA:', JSON.stringify(periodos[0], null, 2));
    
    try {
      const diasSolicitados = calcularDias();
      console.log('Días solicitados:', diasSolicitados);
      
      const seleccionInicial = [];
      let diasRestantes = diasSolicitados;
      
      for (const periodo of periodos) {
        console.log('📌 Procesando período:', periodo);
        
        // CORRECCIÓN: El backend puede devolver nombres diferentes de propiedades
        const balanceId = periodo.balanceId || periodo.BalanceID || periodo.id;
        const descripcion = periodo.descripcion || periodo.Descripcion || periodo.descripcion;
        const diasDisponibles = periodo.diasDisponibles || periodo.DiasDisponibles || 
                                (periodo.diasTotales - periodo.diasUsados - periodo.diasPendientes) ||
                                (periodo.DiasTotales - periodo.DiasUsados - periodo.DiasPendientes);
        
        console.log('   - balanceId:', balanceId);
        console.log('   - descripcion:', descripcion);
        console.log('   - diasDisponibles:', diasDisponibles);
        console.log('   - diasRestantes:', diasRestantes);
        
        if (diasRestantes <= 0) {
          console.log('   ⚠️ diasRestantes <= 0, saliendo del loop');
          break;
        }
        
        const diasAUsar = Math.min(diasRestantes, diasDisponibles);
        console.log('   - diasAUsar calculado:', diasAUsar);
        
        if (diasAUsar > 0) {
          console.log('   ✅ Agregando período a selección');
          seleccionInicial.push({
            balanceId: balanceId,
            descripcion: descripcion,
            diasDisponibles: diasDisponibles,
            dias: diasAUsar
          });
          diasRestantes -= diasAUsar;
        } else {
          console.log('   ❌ diasAUsar NO es mayor a 0');
        }
      }
      
      console.log('Selección inicial creada:', seleccionInicial);
      console.log('Cambiando showPeriodosModal a true');
      
      setPeriodosSeleccionados(seleccionInicial);
      setShowPeriodosModal(true);
      
      console.log('✅ Modal debería estar visible ahora');
    } catch (error) {
      console.error('❌ ERROR en abrirModalPeriodos:', error);
    }
  };

  // Actualizar días de un período seleccionado
  const actualizarDiasPeriodo = (balanceId, nuevosDias) => {
    setPeriodosSeleccionados(prev => 
      prev.map(p => p.balanceId === balanceId ? { ...p, dias: parseInt(nuevosDias) || 0 } : p)
    );
  };

  // Calcular total de días seleccionados
  const calcularTotalSeleccionado = () => {
    return periodosSeleccionados.reduce((sum, p) => sum + p.dias, 0);
  };

  // Crear solicitud con períodos
  const handleSubmitSolicitud = async (e) => {
  e.preventDefault();
  
  console.log('=== DEBUG SUBMIT ===');
  console.log('Tipo solicitud:', solicitudForm.tipo);
  console.log('Cantidad de períodos:', periodos.length);
  console.log('Períodos:', periodos);
  
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

  console.log('¿Abrir modal?', solicitudForm.tipo === 'vacaciones' && periodos.length > 1);
  
  // Si es vacaciones y hay múltiples períodos, abrir modal
  if (solicitudForm.tipo === 'vacaciones' && periodos.length > 1) {
    console.log('ABRIENDO MODAL');
    abrirModalPeriodos();
    return;
  }

  console.log('Crear solicitud directa');
  await crearSolicitudDirecta();
};

  const crearSolicitudDirecta = async () => {
    try {
      setLoading(true);
      const diasSolicitados = calcularDias();

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

const confirmarSolicitudConPeriodos = async () => {
  const diasSolicitados = calcularDias();
  const totalSeleccionado = calcularTotalSeleccionado();

  if (totalSeleccionado !== diasSolicitados) {
    showErrorMessage(`La suma de días seleccionados (${totalSeleccionado}) debe ser igual a los días solicitados (${diasSolicitados})`);
    return;
  }

  try {
    setLoading(true);

    await vacacionesService.crearSolicitudConPeriodos({
      empleadoId: user.empleadoId,
      tipo: solicitudForm.tipo,
      fechaInicio: solicitudForm.fechaInicio,
      fechaFin: solicitudForm.fechaFin,
      dias: diasSolicitados,
      diasHabiles: calcularDiasHabiles(),
      motivo: solicitudForm.motivo,
      periodosSeleccionados: periodosSeleccionados.map(p => ({
        balanceId: p.balanceId,
        dias: p.dias
      }))
    });

    // Resetear formulario ANTES de recargar datos
    setSolicitudForm({
      fechaInicio: '',
      fechaFin: '',
      motivo: '',
      tipo: 'vacaciones'
    });
    
    setShowPeriodosModal(false);
    setPeriodosSeleccionados([]);
    
    // Recargar datos al final
    await cargarDatos();
    
    // Mostrar mensaje de éxito
    if (showSuccessMessage) {
      showSuccessMessage(`Solicitud de ${diasSolicitados} días enviada correctamente.`);
    }
  } catch (error) {
    console.error('Error:', error);
    if (showErrorMessage) {
      showErrorMessage('Error al crear solicitud: ' + (error?.response?.data?.error || error?.message || 'Error desconocido'));
    }
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
    
    // Normalizar roles para comparación
    const rolNormalizado = user.role?.toLowerCase().replace(/\s+/g, '_');
    const rolActualNormalizado = solicitud.flujoAprobacion.actual?.toLowerCase().replace(/\s+/g, '_');
    
    if (rolActualNormalizado === rolNormalizado) {
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
                  {evento.fecha && evento.aprobadoPor ? (
                    <>Fecha: {new Date(evento.fecha).toLocaleString()}</> ) : (                     
                    <em style={{ color: '#9ca3af' }}>Pendiente de aprobación</em> )}                    
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
    <div style={{ padding: '1.5rem', background: '#f1eeeeff', minHeight: '100vh' }}>
      {/* Modal de Selección de Períodos */}
      {showPeriodosModal && (
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
            maxWidth: '40rem',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
              Seleccionar Períodos
            </h3>
            
            <div style={{
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <p style={{ fontSize: '0.875rem', color: '#0369a1', margin: 0, marginBottom: '0.5rem' }}>
                <strong>Días a solicitar:</strong> {calcularDias()} días
              </p>
              <p style={{ fontSize: '0.875rem', color: '#0369a1', margin: 0 }}>
                <strong>Días seleccionados:</strong> {calcularTotalSeleccionado()} días
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {periodosSeleccionados.map((periodo) => (
                <div key={periodo.balanceId} style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  background: '#f9fafb'
                }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong style={{ fontSize: '0.875rem', color: '#111827' }}>{periodo.descripcion}</strong>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                      Disponibles: {periodo.diasDisponibles} días
                    </p>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#374151', marginBottom: '0.25rem' }}>
                      Días a usar de este período:
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={periodo.diasDisponibles}
                      value={periodo.dias}
                      onChange={(e) => actualizarDiasPeriodo(periodo.balanceId, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {calcularTotalSeleccionado() !== calcularDias() && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                marginBottom: '1rem'
              }}>
                <p style={{ fontSize: '0.75rem', color: '#dc2626', margin: 0 }}>
                  ⚠️ La suma de días debe ser igual a {calcularDias()} días
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowPeriodosModal(false);
                  setPeriodosSeleccionados([]);
                }}
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
                onClick={() => {
                  console.log('🔴 BOTÓN CLICKEADO');
                  console.log('Función existe?', typeof confirmarSolicitudConPeriodos);
                  confirmarSolicitudConPeriodos();
                }}
                disabled={calcularTotalSeleccionado() !== calcularDias() || loading}
                style={{
                  padding: '0.5rem 1rem',
                  background: calcularTotalSeleccionado() === calcularDias() && !loading ? '#3b82f6' : '#9ca3af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: calcularTotalSeleccionado() === calcularDias() && !loading ? 'pointer' : 'not-allowed'
                }}
              >
                {loading ? 'Enviando...' : 'Confirmar Solicitud'}
              </button>
            </div>
          </div>
        </div>
      )}

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
          Sistema de Gestión de Autoservicio
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
              Días Disponibles de Vacaciones
            </h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981', margin: 0 }}>
              {estadisticas.diasDisponibles}
            </p>
            {periodos.length > 1 && (
              <button
                onClick={() => setActiveTab('periodos')}
                style={{
                  marginTop: '0.5rem',
                  fontSize: '0.75rem',
                  color: '#3b82f6',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Ver detalle por período
              </button>
            )}
          </div>

          <div style={{
            background: 'white',
            borderRadius: '0.75rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
            padding: '1.5rem'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
              Días de Vacaciones Usados
            </h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6b7280', margin: 0 }}>
              {estadisticas.diasUsados || 0}
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
          <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('solicitar')}
              style={{
                flex: 1,
                minWidth: '150px',
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
            
            {periodos.length > 1 && (
              <button
                onClick={() => setActiveTab('periodos')}
                style={{
                  flex: 1,
                  minWidth: '150px',
                  padding: '1rem',
                  border: 'none',
                  background: activeTab === 'periodos' ? '#f8fafc' : 'transparent',
                  color: activeTab === 'periodos' ? '#3b82f6' : '#6b7280',
                  fontWeight: activeTab === 'periodos' ? '600' : '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <Package style={{ width: '1rem', height: '1rem' }} />
                Períodos ({periodos.length})
              </button>
            )}
            
            <button
              onClick={() => setActiveTab('historial')}
              style={{
                flex: 1,
                minWidth: '150px',
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
            
            {['gerente', 'director', 'rrhh', 'gerente_rrhh', 'director_rrhh'].includes(user.role?.toLowerCase()) && (
              <button
                onClick={() => setActiveTab('aprobar')}
                style={{
                  flex: 1,
                  minWidth: '150px',
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
            {activeTab === 'periodos' && (
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  Detalle de Períodos
                </h3>
                
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {periodos.map((periodo) => (
                    <div key={periodo.balanceId} style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      padding: '1.5rem',
                      background: '#f9fafb'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                        <div>
                          <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0 }}>
                            {periodo.descripcion}
                          </h4>
                          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                            Año {periodo.anio}
                          </p>
                        </div>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          background: periodo.diasDisponibles > 0 ? '#dcfce7' : '#f3f4f6',
                          color: periodo.diasDisponibles > 0 ? '#166534' : '#6b7280'
                        }}>
                          {periodo.diasDisponibles} días disponibles
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(8rem, 1fr))', gap: '1rem' }}>
                        <div>
                          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>DÍAS TOTALES</p>
                          <p style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', margin: 0 }}>
                            {periodo.diasTotales}
                          </p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>DÍAS USADOS</p>
                          <p style={{ fontSize: '1.25rem', fontWeight: '600', color: '#dc2626', margin: 0 }}>
                            {periodo.diasUsados}
                          </p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>DÍAS PENDIENTES</p>
                          <p style={{ fontSize: '1.25rem', fontWeight: '600', color: '#f59e0b', margin: 0 }}>
                            {periodo.diasPendientes}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '0.5rem'
                }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0369a1', margin: 0, marginBottom: '0.5rem' }}>
                    📊 Resumen Total
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: '#0369a1', margin: 0 }}>
                    <strong>Total disponible:</strong> {estadisticas.diasDisponibles} días ({periodos.length} período{periodos.length > 1 ? 's' : ''})
                  </p>
                </div>
              </div>
            )}

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
                      <option value="permiso">Permiso del año</option>
                      <option value="cumpleaños">Permiso de cumpleaños</option>
                      <option value="Certificacion">Certificación Laboral</option>
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
                      
                      {solicitudForm.tipo === 'vacaciones' && periodos.length > 1 && calcularDias() <= estadisticas.diasDisponibles && (
                        <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '0.375rem' }}>
                          <p style={{ fontSize: '0.75rem', color: '#92400e', margin: 0 }}>
                            ℹ️ Tienes {periodos.length} períodos disponibles. Podrás seleccionar de cuál período usar días.
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
                                    alignItems: 'center',gap: '0.5rem',
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