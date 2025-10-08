import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useApp } from '../../../context/AppContext';
import { 
  Clock, 
  MapPin, 
  Camera, 
  Calendar, 
  DollarSign, 
  Settings, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Download,
  Edit,
  Save,
  Plus,
  Trash2
} from 'lucide-react';

const AsistenciaModule = () => {
  const { user } = useAuth();
  const { showSuccessMessage, showErrorMessage } = useApp();
  const [activeTab, setActiveTab] = useState('asistencia');
  const [loading, setLoading] = useState(false);

  // Estados principales
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [ubicacionActual, setUbicacionActual] = useState(null);

  // Configuración de horas extras (solo admin/gerente_rrhh)
  const [configHorasExtras, setConfigHorasExtras] = useState({
    horarioBase: {
      entrada: '08:00',
      salida: '17:00',
      horasPorDia: 8,
      diasPorSemana: 5,
      almuerzo: 60 // minutos
    },
    tiposHorasExtras: [
      {
        id: 1,
        nombre: 'Horas Extras Normales',
        descripcion: 'Primeras 2 horas después del horario base',
        multiplicador: 1.25,
        limite: 2,
        activo: true,
        color: '#f59e0b'
      },
      {
        id: 2,
        nombre: 'Horas Sobre Extras',
        descripcion: 'Después de las 2 primeras horas extras',
        multiplicador: 1.5,
        limite: 4,
        activo: true,
        color: '#ef4444'
      },
      {
        id: 3,
        nombre: 'Horas Nocturnas',
        descripcion: 'Entre 22:00 y 06:00',
        multiplicador: 1.35,
        limite: 8,
        activo: true,
        color: '#8b5cf6'
      },
      {
        id: 4,
        nombre: 'Horas Festivas',
        descripcion: 'Días festivos y domingos',
        multiplicador: 2.0,
        limite: 8,
        activo: true,
        color: '#10b981'
      }
    ],
    salarioBase: 15.00 // por hora
  });

  // Historial de asistencia
  const [historialAsistencia, setHistorialAsistencia] = useState([
    {
      id: 1,
      fecha: '2024-07-19',
      entrada: '07:45',
      salida: '19:30',
      horasNormales: 8,
      horasExtras: {
        normales: 2,
        sobreExtras: 1.5,
        nocturnas: 0,
        festivas: 0
      },
      ubicacion: 'Oficina Central - Santo Domingo Este',
      notas: 'Proyecto urgente - aprobado por gerencia',
      estado: 'completo'
    },
    {
      id: 2,
      fecha: '2024-07-18',
      entrada: '08:00',
      salida: '17:00',
      horasNormales: 8,
      horasExtras: {
        normales: 0,
        sobreExtras: 0,
        nocturnas: 0,
        festivas: 0
      },
      ubicacion: 'Oficina Central - Santo Domingo Este',
      notas: '',
      estado: 'completo'
    },
    {
      id: 3,
      fecha: '2024-07-17',
      entrada: '08:15',
      salida: '20:45',
      horasNormales: 8,
      horasExtras: {
        normales: 2,
        sobreExtras: 2.5,
        nocturnas: 0.75,
        festivas: 0
      },
      ubicacion: 'Oficina Central - Santo Domingo Este',
      notas: 'Cierre mensual - autorizado',
      estado: 'completo'
    }
  ]);

  // Estados para configuración
  const [editandoConfig, setEditandoConfig] = useState(false);
  const [nuevoTipoHora, setNuevoTipoHora] = useState({
    nombre: '',
    descripcion: '',
    multiplicador: 1.0,
    limite: 0,
    activo: true,
    color: '#3b82f6'
  });

  // Simular geolocalización
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUbicacionActual({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            direccion: 'Oficina Central - Santo Domingo Este, DO'
          });
        },
        () => {
          setUbicacionActual({
            lat: 18.4861,
            lng: -69.9312,
            direccion: 'Oficina Central - Santo Domingo Este, DO'
          });
        }
      );
    }
  }, []);

  // Verificar permisos de configuración
  const puedeConfigurar = ['admin', 'gerente_rrhh', 'director_rrhh'].includes(user.role);

  // Calcular horas trabajadas
  const calcularHoras = (entrada, salida) => {
    const inicio = new Date(`2024-01-01 ${entrada}`);
    const fin = new Date(`2024-01-01 ${salida}`);
    
    if (fin < inicio) {
      fin.setDate(fin.getDate() + 1); // Salida al día siguiente
    }
    
    const diff = fin - inicio;
    return diff / (1000 * 60 * 60); // Convertir a horas
  };

  // Calcular horas extras según configuración
  const calcularHorasExtras = (horasTotales, esFestivo = false, esNocturno = false) => {
    const horasBase = configHorasExtras.horarioBase.horasPorDia;
    const horasExtrasTotal = Math.max(0, horasTotales - horasBase);
    
    let resultado = {
      normales: 0,
      sobreExtras: 0,
      nocturnas: 0,
      festivas: 0
    };

    if (esFestivo) {
      resultado.festivas = Math.min(horasExtrasTotal, configHorasExtras.tiposHorasExtras[3].limite);
      return resultado;
    }

    if (esNocturno) {
      resultado.nocturnas = Math.min(horasExtrasTotal, configHorasExtras.tiposHorasExtras[2].limite);
      return resultado;
    }

    // Horas extras normales (primeras 2 horas)
    const limitNormales = configHorasExtras.tiposHorasExtras[0].limite;
    resultado.normales = Math.min(horasExtrasTotal, limitNormales);

    // Horas sobre extras (después de las normales)
    if (horasExtrasTotal > limitNormales) {
      const limitSobreExtras = configHorasExtras.tiposHorasExtras[1].limite;
      resultado.sobreExtras = Math.min(horasExtrasTotal - limitNormales, limitSobreExtras);
    }

    return resultado;
  };

  // Calcular pago total
  const calcularPago = (registro) => {
    const salarioBase = configHorasExtras.salarioBase;
    let pagoTotal = registro.horasNormales * salarioBase;

    // Sumar horas extras
    configHorasExtras.tiposHorasExtras.forEach((tipo, index) => {
      const tipoKeys = ['normales', 'sobreExtras', 'nocturnas', 'festivas'];
      const horas = registro.horasExtras[tipoKeys[index]] || 0;
      pagoTotal += horas * salarioBase * tipo.multiplicador;
    });

    return pagoTotal;
  };

  // Manejar check-in/check-out
  const handleCheckIn = async () => {
    setLoading(true);
    
    // Simular selfie
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const ahora = new Date();
    const nuevaSession = {
      id: Date.now(),
      fecha: ahora.toISOString().split('T')[0],
      entrada: ahora.toTimeString().slice(0, 5),
      ubicacion: ubicacionActual?.direccion || 'Ubicación no disponible'
    };
    
    setCurrentSession(nuevaSession);
    setIsCheckedIn(true);
    setLoading(false);
    
    showSuccessMessage('✅ Check-in registrado correctamente');
  };

  const handleCheckOut = async () => {
    if (!currentSession) return;
    
    setLoading(true);
    
    // Simular selfie de salida
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const ahora = new Date();
    const salida = ahora.toTimeString().slice(0, 5);
    const horasTotales = calcularHoras(currentSession.entrada, salida);
    const horasNormales = Math.min(horasTotales, configHorasExtras.horarioBase.horasPorDia);
    const horasExtrasCalculadas = calcularHorasExtras(horasTotales);
    
    const registroCompleto = {
      ...currentSession,
      salida,
      horasNormales,
      horasExtras: horasExtrasCalculadas,
      notas: '',
      estado: 'completo'
    };
    
    setHistorialAsistencia(prev => [registroCompleto, ...prev]);
    setCurrentSession(null);
    setIsCheckedIn(false);
    setLoading(false);
    
    showSuccessMessage(`✅ Check-out registrado. Horas trabajadas: ${horasTotales.toFixed(2)}`);
  };

  // Agregar nuevo tipo de hora extra
  const agregarTipoHora = () => {
    if (!nuevoTipoHora.nombre.trim()) {
      showErrorMessage('El nombre es requerido');
      return;
    }

    const nuevoTipo = {
      ...nuevoTipoHora,
      id: Date.now()
    };

    setConfigHorasExtras(prev => ({
      ...prev,
      tiposHorasExtras: [...prev.tiposHorasExtras, nuevoTipo]
    }));

    setNuevoTipoHora({
      nombre: '',
      descripcion: '',
      multiplicador: 1.0,
      limite: 0,
      activo: true,
      color: '#3b82f6'
    });

    showSuccessMessage('Tipo de hora extra agregado');
  };

  // Eliminar tipo de hora extra
  const eliminarTipoHora = (id) => {
    setConfigHorasExtras(prev => ({
      ...prev,
      tiposHorasExtras: prev.tiposHorasExtras.filter(tipo => tipo.id !== id)
    }));
    showSuccessMessage('Tipo de hora extra eliminado');
  };

  // Exportar reporte
  const exportarReporte = () => {
    const datos = {
      periodo: 'Julio 2024',
      empleado: user.name,
      registros: historialAsistencia,
      configuracion: configHorasExtras
    };
    
    console.log('Exportando reporte:', datos);
    showSuccessMessage('Reporte exportado (simulado)');
  };

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ maxWidth: '112rem', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fefeffff', marginBottom: '0.5rem' }}>
          Sistema de Asistencia y Horas Extras
        </h1>
        <p style={{ color: '#ffffffff', fontSize: '1.125rem', marginBottom: '2rem' }}>
          Control completo de asistencia con cálculo automático de horas extras parametrizables
        </p>

        {/* Información actual */}
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
              Estado Actual
            </h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: isCheckedIn ? '#10b981' : '#6b7280', margin: 0 }}>
              {isCheckedIn ? 'Activo' : 'Inactivo'}
            </p>
            {currentSession && (
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                Desde: {currentSession.entrada}
              </p>
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
              Horas Esta Semana
            </h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6', margin: 0 }}>
              {historialAsistencia.reduce((total, reg) => total + reg.horasNormales, 0)} hrs
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
              Horas Extras
            </h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b', margin: 0 }}>
              {historialAsistencia.reduce((total, reg) => 
                total + Object.values(reg.horasExtras).reduce((a, b) => a + b, 0), 0
              ).toFixed(1)} hrs
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
              Pago Estimado
            </h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981', margin: 0 }}>
              ${historialAsistencia.reduce((total, reg) => total + calcularPago(reg), 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          background: 'white',
          borderRadius: '0.75rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
            <button
              onClick={() => setActiveTab('asistencia')}
              style={{
                flex: 1,
                padding: '1rem',
                border: 'none',
                background: activeTab === 'asistencia' ? '#f8fafc' : 'transparent',
                color: activeTab === 'asistencia' ? '#3b82f6' : '#6b7280',
                fontWeight: activeTab === 'asistencia' ? '600' : '500',
                cursor: 'pointer'
              }}
            >
              Check-in / Check-out
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
              Historial
            </button>
            {puedeConfigurar && (
              <button
                onClick={() => setActiveTab('configuracion')}
                style={{
                  flex: 1,
                  padding: '1rem',
                  border: 'none',
                  background: activeTab === 'configuracion' ? '#f8fafc' : 'transparent',
                  color: activeTab === 'configuracion' ? '#3b82f6' : '#6b7280',
                  fontWeight: activeTab === 'configuracion' ? '600' : '500',
                  cursor: 'pointer'
                }}
              >
                Configuración HH.EE.
              </button>
            )}
            <button
              onClick={() => setActiveTab('reportes')}
              style={{
                flex: 1,
                padding: '1rem',
                border: 'none',
                background: activeTab === 'reportes' ? '#f8fafc' : 'transparent',
                color: activeTab === 'reportes' ? '#3b82f6' : '#6b7280',
                fontWeight: activeTab === 'reportes' ? '600' : '500',
                cursor: 'pointer'
              }}
            >
              Reportes
            </button>
          </div>

          <div style={{ padding: '2rem' }}>
            {/* Tab de Asistencia */}
            {activeTab === 'asistencia' && (
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1.5rem' }}>
                  Control de Asistencia
                </h3>

                {/* Estado actual y ubicación */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  padding: '1.5rem',
                  marginBottom: '2rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <MapPin style={{ width: '1.25rem', height: '1.25rem', color: '#3b82f6' }} />
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', margin: 0 }}>
                        Ubicación Actual
                      </h4>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                        {ubicacionActual?.direccion || 'Obteniendo ubicación...'}
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Clock style={{ width: '1.25rem', height: '1.25rem', color: '#10b981' }} />
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', margin: 0 }}>
                        Hora Actual
                      </h4>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                        {new Date().toLocaleString('es-DO')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Botones de acción */}
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  {!isCheckedIn ? (
                    <button
                      onClick={handleCheckIn}
                      disabled={loading}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '1rem 2rem',
                        background: loading ? '#9ca3af' : '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      <Camera style={{ width: '1.5rem', height: '1.5rem' }} />
                      {loading ? 'Procesando...' : 'Check-in'}
                    </button>
                  ) : (
                    <button
                      onClick={handleCheckOut}
                      disabled={loading}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '1rem 2rem',
                        background: loading ? '#9ca3af' : '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      <Camera style={{ width: '1.5rem', height: '1.5rem' }} />
                      {loading ? 'Procesando...' : 'Check-out'}
                    </button>
                  )}
                </div>

                {loading && (
                  <div style={{
                    marginTop: '1.5rem',
                    textAlign: 'center',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '0.5rem',
                    padding: '1rem'
                  }}>
                    <Camera style={{ width: '2rem', height: '2rem', color: '#3b82f6', margin: '0 auto 0.5rem' }} />
                    <p style={{ fontSize: '0.875rem', color: '#1d4ed8', margin: 0 }}>
                      Capturando selfie para verificación...
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tab de Historial */}
            {activeTab === 'historial' && (
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1.5rem' }}>
                  Historial de Asistencia
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {historialAsistencia.map(registro => (
                    <div
                      key={registro.id}
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.5rem',
                        padding: '1.5rem',
                        background: '#fafafa'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                        <div>
                          <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0, marginBottom: '0.5rem' }}>
                            {new Date(registro.fecha).toLocaleDateString('es-DO', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </h4>
                          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                            {registro.ubicacion}
                          </p>
                        </div>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          background: registro.estado === 'completo' ? '#f0fdf4' : '#fff7ed',
                          color: registro.estado === 'completo' ? '#166534' : '#ea580c',
                          border: registro.estado === 'completo' ? '1px solid #bbf7d0' : '1px solid #fed7aa'
                        }}>
                          {registro.estado === 'completo' ? '✅ Completo' : '⏳ En progreso'}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(10rem, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0, marginBottom: '0.25rem' }}>
                            ENTRADA
                          </p>
                          <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827', margin: 0 }}>
                            {registro.entrada}
                          </p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0, marginBottom: '0.25rem' }}>
                            SALIDA
                          </p>
                          <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827', margin: 0 }}>
                            {registro.salida || 'En progreso'}
                          </p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0, marginBottom: '0.25rem' }}>
                            HORAS NORMALES
                          </p>
                          <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827', margin: 0 }}>
                            {registro.horasNormales.toFixed(1)} hrs
                          </p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0, marginBottom: '0.25rem' }}>
                            PAGO ESTIMADO
                          </p>
                          <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#10b981', margin: 0 }}>
                            ${calcularPago(registro).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Desglose de horas extras */}
                      <div style={{
                        background: '#f0f9ff',
                        border: '1px solid #bae6fd',
                        borderRadius: '0.375rem',
                        padding: '1rem',
                        marginBottom: '1rem'
                      }}>
                        <h5 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0369a1', margin: 0, marginBottom: '0.75rem' }}>
                          Desglose de Horas Extras
                        </h5>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(8rem, 1fr))', gap: '0.75rem' }}>
                          {configHorasExtras.tiposHorasExtras.map((tipo, index) => {
                            const tipoKeys = ['normales', 'sobreExtras', 'nocturnas', 'festivas'];
                            const horas = registro.horasExtras[tipoKeys[index]] || 0;
                            return (
                              <div key={tipo.id} style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: '0.625rem', color: '#0369a1', margin: 0, marginBottom: '0.25rem' }}>
                                  {tipo.nombre.toUpperCase()}
                                </p>
                                <p style={{ fontSize: '1rem', fontWeight: 'bold', color: tipo.color, margin: 0 }}>
                                  {horas.toFixed(1)}h
                                </p>
                                <p style={{ fontSize: '0.625rem', color: '#6b7280', margin: 0 }}>
                                  x{tipo.multiplicador}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {registro.notas && (
                        <div style={{ marginBottom: '1rem' }}>
                          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0, marginBottom: '0.25rem' }}>
                            NOTAS
                          </p>
                          <p style={{ fontSize: '0.875rem', color: '#111827', margin: 0 }}>
                            {registro.notas}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab de Configuración (solo admin/gerente_rrhh) */}
            {activeTab === 'configuracion' && puedeConfigurar && (
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1.5rem' }}>
                  Configuración de Horas Extras
                </h3>

                {/* Configuración básica */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  padding: '1.5rem',
                  marginBottom: '2rem'
                }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                    Configuración Base
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(10rem, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                        Hora de Entrada
                      </label>
                      <input
                        type="time"
                        value={configHorasExtras.horarioBase.entrada}
                        onChange={(e) => setConfigHorasExtras(prev => ({
                          ...prev,
                          horarioBase: { ...prev.horarioBase, entrada: e.target.value }
                        }))}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                        Hora de Salida
                      </label>
                      <input
                        type="time"
                        value={configHorasExtras.horarioBase.salida}
                        onChange={(e) => setConfigHorasExtras(prev => ({
                          ...prev,
                          horarioBase: { ...prev.horarioBase, salida: e.target.value }
                        }))}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                        Horas por Día
                      </label>
                      <input
                        type="number"
                        value={configHorasExtras.horarioBase.horasPorDia}
                        onChange={(e) => setConfigHorasExtras(prev => ({
                          ...prev,
                          horarioBase: { ...prev.horarioBase, horasPorDia: parseInt(e.target.value) }
                        }))}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                        Salario Base ($/hora)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={configHorasExtras.salarioBase}
                        onChange={(e) => setConfigHorasExtras(prev => ({
                          ...prev,
                          salarioBase: parseFloat(e.target.value)
                        }))}
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
                </div>

                {/* Tipos de horas extras */}
                <div style={{
                  background: '#fefcbf',
                  border: '1px solid #fcd34d',
                  borderRadius: '0.5rem',
                  padding: '1.5rem',
                  marginBottom: '2rem'
                }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#92400e', marginBottom: '1rem' }}>
                    Tipos de Horas Extras Configurados
                  </h4>

                  {configHorasExtras.tiposHorasExtras.map(tipo => (
                    <div
                      key={tipo.id}
                      style={{
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.375rem',
                        padding: '1rem',
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <div
                            style={{
                              width: '1rem',
                              height: '1rem',
                              borderRadius: '50%',
                              background: tipo.color
                            }}
                          />
                          <h5 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827', margin: 0 }}>
                            {tipo.nombre}
                          </h5>
                          <span style={{
                            padding: '0.125rem 0.5rem',
                            borderRadius: '9999px',
                            fontSize: '0.625rem',
                            fontWeight: '500',
                            background: tipo.activo ? '#f0fdf4' : '#fef2f2',
                            color: tipo.activo ? '#166534' : '#dc2626'
                          }}>
                            {tipo.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0, marginBottom: '0.5rem' }}>
                          {tipo.descripcion}
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#374151' }}>
                          <span><strong>Multiplicador:</strong> x{tipo.multiplicador}</span>
                          <span><strong>Límite:</strong> {tipo.limite} horas</span>
                        </div>
                      </div>
                      <button
                        onClick={() => eliminarTipoHora(tipo.id)}
                        style={{
                          padding: '0.5rem',
                          background: '#fef2f2',
                          color: '#dc2626',
                          border: '1px solid #fecaca',
                          borderRadius: '0.375rem',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 style={{ width: '1rem', height: '1rem' }} />
                      </button>
                    </div>
                  ))}

                  {/* Agregar nuevo tipo */}
                  <div style={{
                    background: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: '0.375rem',
                    padding: '1rem'
                  }}>
                    <h5 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0369a1', marginBottom: '1rem' }}>
                      Agregar Nuevo Tipo de Hora Extra
                    </h5>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                          Nombre
                        </label>
                        <input
                          type="text"
                          value={nuevoTipoHora.nombre}
                          onChange={(e) => setNuevoTipoHora(prev => ({ ...prev, nombre: e.target.value }))}
                          placeholder="Ej: Horas Dominicales"
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                          Multiplicador
                        </label>
                        <input
                          type="number"
                          step="0.25"
                          value={nuevoTipoHora.multiplicador}
                          onChange={(e) => setNuevoTipoHora(prev => ({ ...prev, multiplicador: parseFloat(e.target.value) }))}
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
                    
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                        Descripción
                      </label>
                      <input
                        type="text"
                        value={nuevoTipoHora.descripcion}
                        onChange={(e) => setNuevoTipoHora(prev => ({ ...prev, descripcion: e.target.value }))}
                        placeholder="Descripción del tipo de hora extra"
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>
                    
                    <button
                      onClick={agregarTipoHora}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      <Plus style={{ width: '1rem', height: '1rem' }} />
                      Agregar Tipo
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab de Reportes */}
            {activeTab === 'reportes' && (
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1.5rem' }}>
                  Reportes y Análisis
                </h3>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                  <button
                    onClick={exportarReporte}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    <Download style={{ width: '1rem', height: '1rem' }} />
                    Exportar Reporte Excel
                  </button>
                </div>

                {/* Resumen semanal */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  padding: '1.5rem',
                  marginBottom: '2rem'
                }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                    Resumen de la Semana
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))', gap: '1rem' }}>
                    <div style={{ textAlign: 'center', padding: '1rem', background: 'white', borderRadius: '0.375rem' }}>
                      <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6', margin: 0 }}>
                        {historialAsistencia.reduce((total, reg) => total + reg.horasNormales, 0)}
                      </p>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Horas Normales</p>
                    </div>
                    
                    {configHorasExtras.tiposHorasExtras.map((tipo, index) => {
                      const tipoKeys = ['normales', 'sobreExtras', 'nocturnas', 'festivas'];
                      const totalHoras = historialAsistencia.reduce((total, reg) => 
                        total + (reg.horasExtras[tipoKeys[index]] || 0), 0
                      );
                      const totalPago = totalHoras * configHorasExtras.salarioBase * tipo.multiplicador;
                      
                      return (
                        <div key={tipo.id} style={{ textAlign: 'center', padding: '1rem', background: 'white', borderRadius: '0.375rem' }}>
                          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: tipo.color, margin: 0 }}>
                            {totalHoras.toFixed(1)}
                          </p>
                          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0, marginBottom: '0.25rem' }}>
                            {tipo.nombre}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: '#10b981', margin: 0 }}>
                            ${totalPago.toFixed(2)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AsistenciaModule;