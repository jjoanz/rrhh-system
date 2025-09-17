import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useApp } from '../../../context/AppContext';
import { Calendar, Plus, Clock, Check, X, FileText, Users, ArrowRight, AlertTriangle, Edit } from 'lucide-react';

const VacacionesModule = () => {
  const { user } = useAuth();
  const { showSuccessMessage, showErrorMessage } = useApp();
  const [activeTab, setActiveTab] = useState('solicitar');
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualApprovalData, setManualApprovalData] = useState({
    solicitudId: null,
    motivo: '',
    accion: 'aprobada'
  });

  // Estado del formulario de solicitud
  const [solicitudForm, setSolicitudForm] = useState({
    fechaInicio: '',
    fechaFin: '',
    motivo: '',
    tipo: 'vacaciones'
  });

  // Estado de loading
  const [loading, setLoading] = useState(false);

  // Roles que pueden hacer aprobaciones manuales
  const ROLES_APROBACION_MANUAL = ['rrhh', 'gerente_rrhh', 'director_rrhh'];

  // Jerarquía de aprobación estricta
  const JERARQUIA_APROBACION = {
    colaborador: ['gerente', 'director', 'director_rrhh'],
    gerente: ['director', 'director_rrhh'],
    director: ['director_rrhh'],
    rrhh: ['gerente_rrhh', 'director_rrhh'],
    gerente_rrhh: ['director_rrhh'],
    director_rrhh: [],
    admin: []
  };

  const ROLES_LABELS = {
    colaborador: 'Colaborador',
    gerente: 'Gerente',
    director: 'Director',
    rrhh: 'RRHH',
    gerente_rrhh: 'Gerente de RRHH',
    director_rrhh: 'Director de RRHH',
    admin: 'Administrador'
  };

  // ESTADO GLOBAL UNIFICADO - Todas las solicitudes de la empresa
  const [solicitudesGlobales, setSolicitudesGlobales] = useState([
    // Solicitudes del usuario actual
    {
      id: 1,
      empleado: user.name,
      empleadoId: user.id,
      empleadoRole: user.role,
      departamento: user.department || 'IT',
      puesto: user.position || 'Empleado',
      fechaInicio: '2024-08-15',
      fechaFin: '2024-08-25',
      dias: 10,
      motivo: 'Vacaciones familiares',
      tipo: 'vacaciones',
      estado: 'pendiente',
      fechaSolicitud: '2024-07-20',
      aprobadoPor: null,
      flujoAprobacion: {
        requeridos: JERARQUIA_APROBACION[user.role] || [],
        completados: [],
        actual: JERARQUIA_APROBACION[user.role]?.[0] || null,
        historial: []
      }
    },
    {
      id: 2,
      empleado: user.name,
      empleadoId: user.id,
      empleadoRole: user.role,
      departamento: user.department || 'IT',
      puesto: user.position || 'Empleado',
      fechaInicio: '2024-06-10',
      fechaFin: '2024-06-12',
      dias: 2,
      motivo: 'Asuntos personales',
      tipo: 'permiso',
      estado: 'aprobada',
      fechaSolicitud: '2024-06-01',
      aprobadoPor: 'Luis Martínez',
      flujoAprobacion: {
        requeridos: JERARQUIA_APROBACION[user.role] || [],
        completados: JERARQUIA_APROBACION[user.role] || [],
        actual: null,
        historial: [
          { 
            rol: 'gerente', 
            aprobadoPor: 'Luis Martínez', 
            fecha: '2024-06-01', 
            accion: 'aprobada',
            tipo: 'normal'
          }
        ]
      }
    },
    // =====================================================
    // 🏢 SOLICITUDES DE TODA LA EMPRESA (OTROS EMPLEADOS)
    // =====================================================
    // Colaboradores
    {
      id: 101,
      empleado: 'Pedro Ruiz',
      empleadoId: 101,
      empleadoRole: 'colaborador',
      departamento: 'Desarrollo',
      puesto: 'Desarrollador Backend',
      fechaInicio: '2024-08-20',
      fechaFin: '2024-08-30',
      dias: 10,
      motivo: 'Vacaciones de verano con familia',
      tipo: 'vacaciones',
      estado: 'pendiente',
      fechaSolicitud: '2024-07-25',
      flujoAprobacion: {
        requeridos: ['gerente', 'director', 'director_rrhh'],
        completados: [],
        actual: 'gerente',
        historial: []
      }
    },
    {
      id: 102,
      empleado: 'Sofia Chen',
      empleadoId: 102,
      empleadoRole: 'colaborador',
      departamento: 'Diseño',
      puesto: 'Diseñadora UX/UI',
      fechaInicio: '2024-08-05',
      fechaFin: '2024-08-07',
      dias: 3,
      motivo: 'Cita médica especializada',
      tipo: 'medico',
      estado: 'pendiente',
      fechaSolicitud: '2024-07-30',
      flujoAprobacion: {
        requeridos: ['gerente', 'director', 'director_rrhh'],
        completados: ['gerente'],
        actual: 'director',
        historial: [
          { 
            rol: 'gerente', 
            aprobadoPor: 'María González', 
            fecha: '2024-07-31', 
            accion: 'aprobada',
            tipo: 'normal'
          }
        ]
      }
    },
    {
      id: 103,
      empleado: 'Miguel Torres',
      empleadoId: 103,
      empleadoRole: 'colaborador',
      departamento: 'QA',
      puesto: 'QA Tester',
      fechaInicio: '2024-09-15',
      fechaFin: '2024-09-20',
      dias: 5,
      motivo: 'Emergencia familiar',
      tipo: 'permiso',
      estado: 'pendiente',
      fechaSolicitud: '2024-08-01',
      flujoAprobacion: {
        requeridos: ['gerente', 'director', 'director_rrhh'],
        completados: [],
        actual: 'gerente',
        historial: []
      }
    },
    // Gerentes
    {
      id: 201,
      empleado: 'Ana López',
      empleadoId: 201,
      empleadoRole: 'gerente',
      departamento: 'Ventas',
      puesto: 'Gerente de Ventas',
      fechaInicio: '2024-09-01',
      fechaFin: '2024-09-10',
      dias: 9,
      motivo: 'Vacaciones anuales',
      tipo: 'vacaciones',
      estado: 'aprobada',
      fechaSolicitud: '2024-08-01',
      aprobadoPor: 'Carlos Director',
      flujoAprobacion: {
        requeridos: ['director', 'director_rrhh'],
        completados: ['director', 'director_rrhh'],
        actual: null,
        historial: [
          { 
            rol: 'director', 
            aprobadoPor: 'Carlos Director', 
            fecha: '2024-08-02', 
            accion: 'aprobada',
            tipo: 'normal'
          },
          { 
            rol: 'director_rrhh', 
            aprobadoPor: 'Laura RRHH', 
            fecha: '2024-08-03', 
            accion: 'aprobada',
            tipo: 'normal'
          }
        ]
      }
    },
    {
      id: 202,
      empleado: 'Roberto Silva',
      empleadoId: 202,
      empleadoRole: 'gerente',
      departamento: 'Marketing',
      puesto: 'Gerente de Marketing',
      fechaInicio: '2024-08-12',
      fechaFin: '2024-08-16',
      dias: 5,
      motivo: 'Conferencia internacional',
      tipo: 'permiso',
      estado: 'pendiente',
      fechaSolicitud: '2024-08-05',
      flujoAprobacion: {
        requeridos: ['director', 'director_rrhh'],
        completados: [],
        actual: 'director',
        historial: []
      }
    },
    // Directores
    {
      id: 301,
      empleado: 'Carlos Mendoza',
      empleadoId: 301,
      empleadoRole: 'director',
      departamento: 'Operaciones',
      puesto: 'Director de Operaciones',
      fechaInicio: '2024-09-25',
      fechaFin: '2024-10-05',
      dias: 10,
      motivo: 'Vacaciones familiares',
      tipo: 'vacaciones',
      estado: 'pendiente',
      fechaSolicitud: '2024-08-10',
      flujoAprobacion: {
        requeridos: ['director_rrhh'],
        completados: [],
        actual: 'director_rrhh',
        historial: []
      }
    },
    // RRHH
    {
      id: 401,
      empleado: 'Lucia Morales',
      empleadoId: 401,
      empleadoRole: 'rrhh',
      departamento: 'Recursos Humanos',
      puesto: 'Especialista RRHH',
      fechaInicio: '2024-08-28',
      fechaFin: '2024-08-30',
      dias: 3,
      motivo: 'Asuntos personales',
      tipo: 'permiso',
      estado: 'pendiente',
      fechaSolicitud: '2024-08-15',
      flujoAprobacion: {
        requeridos: ['gerente_rrhh', 'director_rrhh'],
        completados: [],
        actual: 'gerente_rrhh',
        historial: []
      }
    }
  ]);

  // 🎯 FUNCIONES DE VISTA PERSONALIZADA POR JERARQUÍA
  const obtenerSolicitudesSegunJerarquia = () => {
    let solicitudesFiltradas = [];
    
    switch (user.role) {
      case 'director_rrhh':
        // Ve TODAS las solicitudes de toda la empresa
        solicitudesFiltradas = solicitudesGlobales;
        break;
        
      case 'gerente_rrhh':
        // Ve TODAS las solicitudes de toda la empresa
        solicitudesFiltradas = solicitudesGlobales;
        break;
        
      case 'rrhh':
        // Ve solicitudes de gerentes y colaboradores (no directores)
        solicitudesFiltradas = solicitudesGlobales.filter(s => 
          ['colaborador', 'gerente', 'rrhh'].includes(s.empleadoRole)
        );
        break;
        
      case 'director':
        // Ve solicitudes de gerentes y colaboradores bajo su área + sus propias
        solicitudesFiltradas = solicitudesGlobales.filter(s => 
          ['colaborador', 'gerente'].includes(s.empleadoRole) || s.empleadoId === user.id
        );
        break;
        
      case 'gerente':
        // Ve solicitudes de colaboradores directos y sus propias
        solicitudesFiltradas = solicitudesGlobales.filter(s => 
          s.empleadoRole === 'colaborador' || s.empleadoId === user.id
        );
        break;
        
      case 'colaborador':
      default:
        // Solo ve sus propias solicitudes
        solicitudesFiltradas = solicitudesGlobales.filter(s => s.empleadoId === user.id);
        break;
    }
    
    return solicitudesFiltradas;
  };

  // Verificar si el usuario puede aprobar una solicitud
  const puedeAprobar = (solicitud) => {
    const flujo = solicitud.flujoAprobacion;
    
    // Si es el rol actual en el flujo, puede aprobar
    if (flujo.actual === user.role) {
      return { puede: true, motivo: 'normal' };
    }
    
    // Si puede hacer aprobación manual
    if (ROLES_APROBACION_MANUAL.includes(user.role)) {
      return { puede: true, motivo: 'manual' };
    }
    
    return { puede: false, motivo: 'sin_permisos' };
  };

  // 👁️ FUNCIÓN PARA OBTENER ETIQUETA DE VISTA SEGÚN ROL
  const getEtiquetaVista = () => {
    switch (user.role) {
      case 'director_rrhh':
        return 'Vista Global Completa - Toda la Empresa';
      case 'gerente_rrhh':
        return 'Vista Global Completa - Toda la Empresa';
      case 'rrhh':
        return 'Vista RRHH - Gerentes y Colaboradores';
      case 'director':
        return 'Vista Directiva - Gerentes y Colaboradores';
      case 'gerente':
        return 'Vista Gerencial - Colaboradores Directos';
      case 'colaborador':
      default:
        return 'Vista Personal - Mis Solicitudes';
    }
  };

  // 🔄 FUNCIÓN PARA OBTENER SOLICITUDES PENDIENTES SEGÚN ROL
  const getSolicitudesPendientesPorRol = () => {
    return solicitudesGlobales.filter(solicitud => {
      if (solicitud.estado !== 'pendiente') return false;
      
      const permisos = puedeAprobar(solicitud);
      return permisos.puede;
    });
  };

  // Funciones de cálculo de días
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
        if (diaSemana !== 0 && diaSemana !== 6) { // No es domingo (0) ni sábado (6)
          diasHabiles++;
        }
      }
      return diasHabiles;
    }
    return 0;
  };

  // 📝 FUNCIÓN GLOBAL PARA CREAR NUEVA SOLICITUD
  const handleSubmitSolicitud = (e) => {
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
    const diasDisponibles = user.vacationDays - user.usedVacationDays;
    
    if (diasSolicitados > diasDisponibles && solicitudForm.tipo === 'vacaciones') {
      showErrorMessage(`No tienes suficientes días disponibles. Solicitas ${diasSolicitados} días pero solo tienes ${diasDisponibles} disponibles.`);
      return;
    }

    // 🌐 CREAR NUEVA SOLICITUD EN EL POOL GLOBAL
    const nuevaSolicitud = {
      id: Date.now(), // ID único temporal
      empleado: user.name,
      empleadoId: user.id,
      empleadoRole: user.role,
      departamento: user.department || 'General',
      puesto: user.position || user.role,
      fechaInicio: solicitudForm.fechaInicio,
      fechaFin: solicitudForm.fechaFin,
      dias: diasSolicitados,
      motivo: solicitudForm.motivo,
      tipo: solicitudForm.tipo,
      estado: 'pendiente',
      fechaSolicitud: new Date().toISOString(),
      aprobadoPor: null,
      flujoAprobacion: {
        requeridos: JERARQUIA_APROBACION[user.role] || [],
        completados: [],
        actual: JERARQUIA_APROBACION[user.role]?.[0] || null,
        historial: []
      }
    };

    // Agregar al pool global - todos la ven según su jerarquía
    setSolicitudesGlobales(prev => [nuevaSolicitud, ...prev]);

    showSuccessMessage(`Solicitud de ${diasSolicitados} días enviada correctamente. Visible para toda la jerarquía de aprobación.`);
    
    // Limpiar formulario
    setSolicitudForm({
      fechaInicio: '',
      fechaFin: '',
      motivo: '',
      tipo: 'vacaciones'
    });
  };

  // 🔄 FUNCIÓN GLOBAL DE APROBACIÓN
  const handleAprobarSolicitud = (solicitudId, accion, esManual = false, motivoManual = '') => {
    setSolicitudesGlobales(prev => 
      prev.map(solicitud => {
        if (solicitud.id === solicitudId) {
          const nuevoFlujo = { ...solicitud.flujoAprobacion };
          
          // Agregar al historial
          const evento = {
            rol: user.role,
            aprobadoPor: user.name,
            fecha: new Date().toISOString(),
            accion: accion,
            tipo: esManual ? 'manual' : 'normal',
            motivoManual: esManual ? motivoManual : undefined
          };
          
          nuevoFlujo.historial.push(evento);

          if (accion === 'aprobada') {
            if (esManual) {
              // Aprobación manual - saltar al final
              return {
                ...solicitud,
                flujoAprobacion: nuevoFlujo,
                estado: 'aprobada',
                fechaAprobacionFinal: new Date().toISOString(),
                aprobacionManual: true,
                aprobadoPor: user.name
              };
            } else {
              // Aprobación normal - seguir el flujo
              nuevoFlujo.completados.push(user.role);
              
              const siguienteIndex = nuevoFlujo.requeridos.indexOf(user.role) + 1;
              
              if (siguienteIndex < nuevoFlujo.requeridos.length) {
                nuevoFlujo.actual = nuevoFlujo.requeridos[siguienteIndex];
                return {
                  ...solicitud,
                  flujoAprobacion: nuevoFlujo,
                  estado: 'pendiente'
                };
              } else {
                return {
                  ...solicitud,
                  flujoAprobacion: nuevoFlujo,
                  estado: 'aprobada',
                  fechaAprobacionFinal: new Date().toISOString(),
                  aprobadoPor: user.name
                };
              }
            }
          } else {
            // Rechazada
            return {
              ...solicitud,
              flujoAprobacion: nuevoFlujo,
              estado: 'rechazada',
              fechaRechazo: new Date().toISOString(),
              aprobadoPor: user.name
            };
          }
        }
        return solicitud;
      })
    );
    
    if (esManual) {
      showSuccessMessage(`Aprobación manual registrada: ${accion} - Actualización global aplicada`);
    } else {
      const mensaje = accion === 'aprobada' 
        ? 'Solicitud aprobada y enviada al siguiente nivel - Actualización global aplicada' 
        : 'Solicitud rechazada - Actualización global aplicada';
      showSuccessMessage(mensaje);
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

  const FlujAprobacion = ({ flujo, estado, aprobacionManual }) => {
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
          {flujo.requeridos.map((rol, index) => {
            const isCompleted = flujo.completados.includes(rol);
            const isCurrent = flujo.actual === rol && estado === 'pendiente';
            const isRejected = estado === 'rechazada' && flujo.historial.some(h => h.rol === rol && h.accion === 'rechazada');
            const isBlocked = !isCompleted && !isCurrent && !isRejected && index > 0 && !flujo.completados.includes(flujo.requeridos[index - 1]);
            
            return (
              <React.Fragment key={rol}>
                <div style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  background: isCompleted ? '#f0fdf4' : 
                            isCurrent ? '#fff7ed' : 
                            isRejected ? '#fef2f2' : 
                            isBlocked ? '#f1f5f9' : '#f1f5f9',
                  color: isCompleted ? '#166534' : 
                         isCurrent ? '#ea580c' : 
                         isRejected ? '#dc2626' : 
                         isBlocked ? '#94a3b8' : '#64748b',
                  border: `1px solid ${isCompleted ? '#bbf7d0' : 
                                      isCurrent ? '#fed7aa' : 
                                      isRejected ? '#fecaca' : 
                                      isBlocked ? '#e2e8f0' : '#cbd5e1'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  opacity: isBlocked ? 0.6 : 1
                }}>
                  {isCompleted && <Check style={{ width: '0.75rem', height: '0.75rem' }} />}
                  {isCurrent && <Clock style={{ width: '0.75rem', height: '0.75rem' }} />}
                  {isRejected && <X style={{ width: '0.75rem', height: '0.75rem' }} />}
                  {isBlocked && <AlertTriangle style={{ width: '0.75rem', height: '0.75rem' }} />}
                  {ROLES_LABELS[rol]}
                </div>
                {index < flujo.requeridos.length - 1 && (
                  <ArrowRight style={{ width: '1rem', height: '1rem', color: '#9ca3af' }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
        
        {flujo.historial.length > 0 && (
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
                  <strong>{ROLES_LABELS[evento.rol]}</strong>: {evento.aprobadoPor}
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

  const solicitudesPendientes = getSolicitudesPendientesPorRol();
  const solicitudesParaHistorial = obtenerSolicitudesSegunJerarquia();

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
          Sistema Global de Vacaciones
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
              {user.vacationDays - user.usedVacationDays}
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
              Vista Global
            </h3>
            <p style={{ fontSize: '1rem', fontWeight: 'bold', color: '#3b82f6', margin: 0 }}>
              {solicitudesParaHistorial.length} solicitudes
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
              Historial Global ({solicitudesParaHistorial.length})
            </button>
            {['gerente', 'director', 'rrhh', 'gerente_rrhh', 'director_rrhh'].includes(user.role) && (
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
                  Nueva Solicitud de Vacaciones
                </h3>
                
                <div style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1d4ed8', margin: 0, marginBottom: '0.5rem' }}>
                    Flujo de Aprobación Requerido:
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {JERARQUIA_APROBACION[user.role]?.map((rol, index) => (
                      <React.Fragment key={rol}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          background: '#dbeafe',
                          color: '#1d4ed8',
                          border: '1px solid #bfdbfe'
                        }}>
                          {index + 1}. {ROLES_LABELS[rol]}
                        </span>
                        {index < JERARQUIA_APROBACION[user.role].length - 1 && (
                          <ArrowRight style={{ width: '1rem', height: '1rem', color: '#3b82f6' }} />
                        )}
                      </React.Fragment>
                    )) || (
                      <span style={{ fontSize: '0.875rem', color: '#1d4ed8' }}>
                        No requiere aprobación adicional
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#1d4ed8', margin: 0, marginTop: '0.5rem' }}>
                    🌐 Tu solicitud será visible para toda la jerarquía de aprobación inmediatamente
                  </p>
                </div>

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
                        fontSize: '1rem',
                        outline: 'none'
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
                        min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} // Mínimo mañana
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.5rem',
                          fontSize: '1rem',
                          outline: 'none'
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
                          fontSize: '1rem',
                          outline: 'none'
                        }}
                        required
                      />
                    </div>
                  </div>

                  {/* Información de días calculados */}
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
                              color: (user.vacationDays - user.usedVacationDays) >= calcularDias() ? '#0369a1' : '#dc2626', 
                              margin: 0 
                            }}>
                              {user.vacationDays - user.usedVacationDays}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {solicitudForm.tipo === 'vacaciones' && calcularDias() > (user.vacationDays - user.usedVacationDays) && (
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
                        outline: 'none',
                        resize: 'vertical'
                      }}
                      required
                    />
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
                      Proporciona una justificación clara para facilitar el proceso de aprobación
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={!solicitudForm.fechaInicio || !solicitudForm.fechaFin || !solicitudForm.motivo.trim() || loading}
                    style={{
                      background: (!solicitudForm.fechaInicio || !solicitudForm.fechaFin || !solicitudForm.motivo.trim()) ? '#9ca3af' : '#3b82f6',
                      color: 'white',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '0.5rem',
                      border: 'none',
                      fontSize: '1rem',
                      fontWeight: '500',
                      cursor: (!solicitudForm.fechaInicio || !solicitudForm.fechaFin || !solicitudForm.motivo.trim()) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Plus style={{ width: '1rem', height: '1rem' }} />
                    {loading ? 'Enviando...' : 'Enviar a Sistema Global'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'historial' && (
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  {getEtiquetaVista()}
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem' }}>
                  Mostrando {solicitudesParaHistorial.length} solicitudes según tu nivel de acceso jerárquico
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {solicitudesParaHistorial.sort((a, b) => new Date(b.fechaSolicitud) - new Date(a.fechaSolicitud)).map(solicitud => {
                    const estadoStyle = getEstadoColor(solicitud.estado);
                    const esMiaSolicitud = solicitud.empleadoId === user.id;
                    return (
                      <div
                        key={solicitud.id}
                        style={{
                          border: esMiaSolicitud ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                          borderRadius: '0.5rem',
                          padding: '1.5rem',
                          background: esMiaSolicitud ? '#f8fafc' : '#fafafa'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                          <div>
                            <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0, marginBottom: '0.5rem' }}>
                              {solicitud.empleado} - {getTipoLabel(solicitud.tipo)}
                              {esMiaSolicitud && (
                                <span style={{
                                  marginLeft: '0.5rem',
                                  padding: '0.125rem 0.5rem',
                                  borderRadius: '9999px',
                                  fontSize: '0.75rem',
                                  fontWeight: '500',
                                  background: '#dbeafe',
                                  color: '#1d4ed8'
                                }}>
                                  MIA
                                </span>
                              )}
                            </h4>
                            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                              {solicitud.puesto} • {solicitud.departamento} • 
                              Solicitado el {new Date(solicitud.fechaSolicitud).toLocaleDateString()}
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
                            <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0, marginBottom: '0.25rem' }}>
                              FECHA INICIO
                            </p>
                            <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827', margin: 0 }}>
                              {new Date(solicitud.fechaInicio).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0, marginBottom: '0.25rem' }}>
                              FECHA FIN
                            </p>
                            <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827', margin: 0 }}>
                              {new Date(solicitud.fechaFin).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0, marginBottom: '0.25rem' }}>
                              DÍAS
                            </p>
                            <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827', margin: 0 }}>
                              {solicitud.dias} días
                            </p>
                          </div>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0, marginBottom: '0.25rem' }}>
                            MOTIVO
                          </p>
                          <p style={{ fontSize: '0.875rem', color: '#111827', margin: 0 }}>
                            {solicitud.motivo}
                          </p>
                        </div>

                        {solicitud.aprobadoPor && (
                          <div style={{ marginBottom: '1rem' }}>
                            <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0, marginBottom: '0.25rem' }}>
                              APROBADO POR
                            </p>
                            <p style={{ fontSize: '0.875rem', color: '#111827', margin: 0 }}>
                              {solicitud.aprobadoPor}
                            </p>
                          </div>
                        )}

                        {/* Mostrar flujo de aprobación */}
                        {solicitud.flujoAprobacion && (
                          <FlujAprobacion 
                            flujo={solicitud.flujoAprobacion} 
                            estado={solicitud.estado}
                            aprobacionManual={solicitud.aprobacionManual}
                          />
                        )}
                      </div>
                    );
                  })}

                  {solicitudesParaHistorial.length === 0 && (
                    <div style={{
                      textAlign: 'center',
                      padding: '3rem',
                      background: '#f9fafb',
                      borderRadius: '0.5rem',
                      border: '1px solid #e5e7eb'
                    }}>
                      <FileText style={{ width: '3rem', height: '3rem', color: '#9ca3af', margin: '0 auto 1rem' }} />
                      <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0, marginBottom: '0.5rem' }}>
                        No hay solicitudes en tu vista
                      </h4>
                      <p style={{ color: '#6b7280', margin: 0 }}>
                        No tienes acceso a solicitudes en este momento según tu rol jerárquico.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'aprobar' && ['gerente', 'director', 'rrhh', 'gerente_rrhh', 'director_rrhh'].includes(user.role) && (
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  Solicitudes Pendientes de Aprobación ({solicitudesPendientes.length})
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
                      Como {ROLES_LABELS[user.role]}, puedes realizar aprobaciones manuales que saltan el flujo normal. 
                      Estas aprobaciones se reflejan globalmente y quedan registradas con motivo.
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
                    <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0, marginBottom: '0.5rem' }}>
                      No hay solicitudes pendientes en tu nivel
                    </h4>
                    <p style={{ color: '#6b7280', margin: 0 }}>
                      Todas las solicitudes han sido procesadas o están en otros niveles de aprobación.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {solicitudesPendientes.map(solicitud => {
                      const permisos = puedeAprobar(solicitud);
                      const esAprobacionNormal = permisos.motivo === 'normal';
                      
                      return (
                        <div
                          key={solicitud.id}
                          style={{
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.5rem',
                            padding: '1.5rem',
                            background: esAprobacionNormal ? '#fffbeb' : '#fef3c7'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                            <div>
                              <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0, marginBottom: '0.5rem' }}>
                                {solicitud.empleado} - {getTipoLabel(solicitud.tipo)}
                              </h4>
                              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                                {solicitud.puesto} • {solicitud.departamento} • {solicitud.dias} días • 
                                {new Date(solicitud.fechaInicio).toLocaleDateString()} - {new Date(solicitud.fechaFin).toLocaleDateString()}
                              </p>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'end', gap: '0.5rem' }}>
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '9999px',
                                fontSize: '0.75rem',
                                fontWeight: '500',
                                background: esAprobacionNormal ? '#fff7ed' : '#fef3c7',
                                color: esAprobacionNormal ? '#ea580c' : '#92400e',
                                border: `1px solid ${esAprobacionNormal ? '#fed7aa' : '#fcd34d'}`
                              }}>
                                {esAprobacionNormal ? 'Tu turno de aprobación' : 'Aprobación manual disponible'}
                              </span>
                              {!esAprobacionNormal && (
                                <span style={{
                                  fontSize: '0.625rem',
                                  color: '#92400e',
                                  fontStyle: 'italic'
                                }}>
                                  Saltará el flujo normal
                                </span>
                              )}
                            </div>
                          </div>

                          <div style={{ marginBottom: '1rem' }}>
                            <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0, marginBottom: '0.25rem' }}>
                              MOTIVO
                            </p>
                            <p style={{ fontSize: '0.875rem', color: '#111827', margin: 0 }}>
                              {solicitud.motivo}
                            </p>
                          </div>

                          <FlujAprobacion 
                            flujo={solicitud.flujoAprobacion} 
                            estado={solicitud.estado}
                            aprobacionManual={solicitud.aprobacionManual}
                          />

                          <div style={{ marginTop: '1.5rem' }}>
                            {esAprobacionNormal ? (
                              <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button
                                  onClick={() => handleAprobarSolicitud(solicitud.id, 'aprobada')}
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
                                    cursor: 'pointer'
                                  }}
                                >
                                  <Check style={{ width: '1rem', height: '1rem' }} />
                                  Aprobar y Enviar al Siguiente Nivel
                                </button>
                                <button
                                  onClick={() => handleAprobarSolicitud(solicitud.id, 'rechazada')}
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
                                    cursor: 'pointer'
                                  }}
                                >
                                  <X style={{ width: '1rem', height: '1rem' }} />
                                  Rechazar Solicitud
                                </button>
                              </div>
                            ) : (
                              <div>
                                <div style={{
                                  background: '#fef3c7',
                                  border: '1px solid #fcd34d',
                                  borderRadius: '0.375rem',
                                  padding: '0.75rem',
                                  marginBottom: '0.75rem'
                                }}>
                                  <p style={{ fontSize: '0.75rem', color: '#92400e', margin: 0 }}>
                                    ⚠️ Esta solicitud no está en tu nivel de aprobación normal, pero puedes hacer una aprobación manual que se reflejará globalmente.
                                  </p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                  <button
                                    onClick={() => openManualModal(solicitud.id, 'aprobada')}
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
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <Edit style={{ width: '1rem', height: '1rem' }} />
                                    Aprobación Manual Global
                                  </button>
                                  <button
                                    onClick={() => openManualModal(solicitud.id, 'rechazada')}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.5rem',
                                      padding: '0.5rem 1rem',
                                      background: '#6b7280',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '0.375rem',
                                      fontSize: '0.875rem',
                                      fontWeight: '500',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <X style={{ width: '1rem', height: '1rem' }} />
                                    Rechazo Manual Global
                                  </button>
                                </div>
                              </div>
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