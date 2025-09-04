import React, { useState, useEffect } from 'react';
import { getNominas, procesarNomina, getNominaById, marcarNominaPagada, getEmpleadosActivos } from '../../../api/nominaService';
import { 
  DollarSign, Download, Calendar, FileText, Eye, Calculator, CreditCard,
  PieChart, TrendingUp, Settings, AlertCircle, CheckCircle, Clock, User,
  Building, Users, Edit, Trash2, Plus, Search, Filter, Mail, Upload, Save,
  X, UserPlus, Briefcase, MapPin, Phone, FileBarChart, Banknote, Receipt,
  Send, Award, Gift, Zap, FileCheck, BarChart3, Target, ShieldCheck, ArrowRight
} from 'lucide-react';

const SistemaNominaCompleto = () => {
  // Estados principales
  const [activeTab, setActiveTab] = useState('empleados');
  const [nominasProcesadas, setNominasProcesadas] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Función para cargar empleados
  const cargarEmpleados = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getEmpleadosActivos();
      setEmpleados(data);
      console.log('Empleados cargados:', data);
    } catch (error) {
      console.error('Error al cargar empleados:', error);
      setError('Error al cargar empleados desde la base de datos');
    } finally {
      setLoading(false);
    }
  };

  // useEffect para cargar cuando cambie de tab
  useEffect(() => {
    if (activeTab === 'empleados') {
      cargarEmpleados();
    }
  }, [activeTab]);

  
  
  
  // resto de tu código...

// Modal de incidencias
const ModalIncidencia = ({ empleado, onClose, onSave, empleados, configNomina }) => {
  const [formData, setFormData] = useState({
    empleadoId: empleado?.id || '',
    tipo: 'horas_extra',
    fecha: new Date().toISOString().split('T')[0],
    fechaInicio: '',
    fechaFin: '',
    horas: 0,
    tipoRecargo: 'extra_normal',
    diasSolicitados: 0,
    conGoce: true,
    justificada: true,
    motivo: '',
    descripcion: '',
    aprobado: false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '0.75rem',
        boxShadow: '0 20px 25px rgba(0,0,0,0.1)',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827' }}>
            📋 Nueva Incidencia
          </h3>
          <button
            onClick={onClose}
            style={{
              padding: '0.25rem',
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}
          >
            <X style={{ width: '1rem', height: '1rem' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                Empleado *
              </label>
              <select
                value={formData.empleadoId}
                onChange={(e) => setFormData(prev => ({ ...prev, empleadoId: Number(e.target.value) }))}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
                required
              >
                <option value="">Seleccionar empleado</option>
                {empleados.filter(e => e.estado === 'activo').map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombre} {emp.apellidos} - {emp.cargo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                Tipo de Incidencia *
              </label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
                required
              >
                <option value="horas_extra">Horas Extra</option>
                <option value="falta">Falta</option>
                <option value="permiso">Permiso</option>
                <option value="vacaciones">Vacaciones</option>
                <option value="licencia">Licencia Médica</option>
              </select>
            </div>

            {formData.tipo === 'horas_extra' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Fecha *
                  </label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Horas Trabajadas *
                  </label>
                  <input
                    type="number"
                    value={formData.horas}
                    onChange={(e) => setFormData(prev => ({ ...prev, horas: Number(e.target.value) }))}
                    min="0"
                    max="12"
                    step="0.5"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Tipo de Recargo *
                  </label>
                  <select
                    value={formData.tipoRecargo}
                    onChange={(e) => setFormData(prev => ({ ...prev, tipoRecargo: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  >
                    {configNomina.recargosHorarios.map(recargo => (
                      <option key={recargo.tipo} value={recargo.tipo}>
                        {recargo.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {(formData.tipo === 'permiso' || formData.tipo === 'vacaciones' || formData.tipo === 'licencia') && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                      Fecha Inicio *
                    </label>
                    <input
                      type="date"
                      value={formData.fechaInicio}
                      onChange={(e) => setFormData(prev => ({ ...prev, fechaInicio: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem'
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                      Fecha Fin *
                    </label>
                    <input
                      type="date"
                      value={formData.fechaFin}
                      onChange={(e) => setFormData(prev => ({ ...prev, fechaFin: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem'
                      }}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Días Solicitados *
                  </label>
                  <input
                    type="number"
                    value={formData.diasSolicitados}
                    onChange={(e) => setFormData(prev => ({ ...prev, diasSolicitados: Number(e.target.value) }))}
                    min="1"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                    required
                  />
                </div>
                {formData.tipo === 'permiso' && (
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.conGoce}
                        onChange={(e) => setFormData(prev => ({ ...prev, conGoce: e.target.checked }))}
                      />
                      <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                        Con goce de sueldo
                      </span>
                    </label>
                  </div>
                )}
              </>
            )}

            {formData.tipo === 'falta' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Fecha de la Falta *
                  </label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.justificada}
                      onChange={(e) => setFormData(prev => ({ ...prev, justificada: e.target.checked }))}
                    />
                    <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                      Falta justificada
                    </span>
                  </label>
                </div>
              </>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                {formData.tipo === 'falta' ? 'Motivo/Justificación' : 'Motivo'}
              </label>
              <textarea
                value={formData.motivo}
                onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
                rows="3"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  resize: 'vertical'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                Descripción Adicional
              </label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                rows="2"
                placeholder="Detalles adicionales sobre la incidencia..."
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '1rem',
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid #e5e7eb'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '0.375rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '0.75rem',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Registrar Incidencia
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
  
  const [selectedPeriodo, setSelectedPeriodo] = useState('2024-07');
  const [user] = useState({ role: 'admin' }); // Usuario actual
  
  // Estados para modales
  const [modalEmpleado, setModalEmpleado] = useState({ open: false, empleado: null, modo: 'crear' });
  const [modalIncidencia, setModalIncidencia] = useState({ open: false, empleado: null });
  const [modalRecibo, setModalRecibo] = useState({ open: false, nomina: null });
  const [modalPrestaciones, setModalPrestaciones] = useState({ open: false, empleado: null });
  const [modalOperacionMasiva, setModalOperacionMasiva] = useState({ open: false, tipo: null });

  // Catálogo de empleados mejorado
  
 


  // Configuración avanzada
  const [configNomina, setConfigNomina] = useState({
    empresa: {
      nombre: 'Mi Empresa S.R.L.',
      rnc: '123456789',
      direccion: 'Av. Principal #100, Santo Domingo',
      telefono: '809-555-0000',
      representanteLegal: 'Director General'
    },
    periodicidad: 'mensual',
    moneda: 'DOP',
    horasLaboralesDia: 8,
    diasLaboralesSemana: 5,
    salarioMinimo: 21000,
    
    // Prestaciones laborales RD
    prestaciones: {
      vacaciones: {
        diasPorAno: 14,
        pagaDoble: true // Se paga doble cuando se toman
      },
      regaliaNavidena: {
        activada: true,
        fechaCalculo: '12-20', // 20 de diciembre
        minimoDias: 3 // Mínimo 3 meses trabajados
      },
      cesantia: {
        diasPorAno: 23,
        maxAnosCalcular: 15,
        baseSalarioPromedio: true
      },
      preaviso: {
        escalas: [
          { desdeAnosAntiguedad: 0, hastaAnosAntiguedad: 3, diasPreaviso: 0 },
          { desdeAnosAntiguedad: 3, hastaAnosAntiguedad: 5, diasPreaviso: 14 },
          { desdeAnosAntiguedad: 5, hastaAnosAntiguedad: 999, diasPreaviso: 28 }
        ]
      }
    },
    
    // Deducciones legales RD actualizadas
    deduccionesLegales: [
      { 
        codigo: 'TSS_EMPLEADO', 
        nombre: 'TSS - Empleado', 
        porcentaje: 2.87, 
        aplicaSobre: 'salario_cotizable',
        limite: 'salario_minimo_10_veces'
      },
      { 
        codigo: 'ISR', 
        nombre: 'Impuesto Sobre la Renta', 
        aplicaSobre: 'salario_gravable',
        escalas: [
          { desde: 0, hasta: 416220, porcentaje: 0 },
          { desde: 416221, hasta: 624329, porcentaje: 15 },
          { desde: 624330, hasta: 867123, porcentaje: 20 },
          { desde: 867124, hasta: 999999999, porcentaje: 25 }
        ]
      }
    ],

    // Aportes patronales
    aportesPatronales: [
      { codigo: 'TSS_PATRONAL', nombre: 'TSS - Patronal', porcentaje: 7.09 },
      { codigo: 'INFOTEP', nombre: 'INFOTEP', porcentaje: 1.0 }
    ],

    // Recargos horarios
    recargosHorarios: [
      { tipo: 'extra_normal', nombre: 'Horas Extras Diurnas (35%)', multiplicador: 1.35 },
      { tipo: 'extra_nocturna', nombre: 'Horas Nocturnas (75%)', multiplicador: 1.75 },
      { tipo: 'extra_dominical', nombre: 'Domingo/Feriado (100%)', multiplicador: 2.0 }
    ],

    // Bonificaciones
    bonificaciones: [
      { codigo: 'TRANSPORTE', nombre: 'Auxilio de Transporte', monto: 3000, tipo: 'fijo', activa: true },
      { codigo: 'ALIMENTACION', nombre: 'Auxilio de Alimentación', monto: 2500, tipo: 'fijo', activa: true },
      { codigo: 'RENDIMIENTO', nombre: 'Bono por Rendimiento', porcentaje: 5, tipo: 'variable', activa: false }
    ]
  });

  // Gestión de incidencias mejorada
  const [incidencias, setIncidencias] = useState([
    {
      id: 1,
      empleadoId: 1,
      tipo: 'horas_extra',
      fecha: '2024-07-15',
      horas: 3,
      tipoRecargo: 'extra_normal',
      descripcion: 'Trabajo adicional proyecto urgente',
      aprobado: true,
      apropadoPor: 2,
      fechaAprobacion: '2024-07-16'
    },
    {
      id: 2,
      empleadoId: 1,
      tipo: 'vacaciones',
      fechaInicio: '2024-07-22',
      fechaFin: '2024-07-26',
      diasSolicitados: 5,
      conGoce: true,
      motivo: 'Vacaciones familiares',
      aprobado: true,
      fechaAprobacion: '2024-07-10'
    }
  ]);

  // Nóminas procesadas

  const cargarNominas = async () => {
  try {
    setLoading(true);
    setError(null);
    const data = await getNominas(); 
    setNominasProcesadas(data);
    console.log('Nóminas cargadas:', data);
  } catch (error) {
    console.error('Error al cargar nóminas:', error);
    setError('Error al cargar nóminas desde la base de datos');
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  if (activeTab === 'nomina') {
    cargarNominas();
  }
}, [activeTab]);



  // Utilidades
  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 2
    }).format(valor);
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-DO');
  };

  const calcularEdad = (fechaNacimiento) => {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return edad;
  };

  const calcularAntiguedad = (fechaIngreso) => {
    const hoy = new Date();
    const ingreso = new Date(fechaIngreso);
    const diffTime = Math.abs(hoy - ingreso);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const años = Math.floor(diffDays / 365);
    const meses = Math.floor((diffDays % 365) / 30);
    return { años, meses, totalDias: diffDays };
  };

  // Validaciones de formularios
  const validarEmpleado = (empleado) => {
    const errores = [];
    
    if (!empleado.nombre?.trim()) errores.push('El nombre es requerido');
    if (!empleado.apellidos?.trim()) errores.push('Los apellidos son requeridos');
    if (!empleado.cedula?.trim()) errores.push('La cédula es requerida');
    
    // Validar formato de cédula dominicana
    const cedulaRegex = /^\d{3}-\d{7}-\d{1}$/;
    if (empleado.cedula && !cedulaRegex.test(empleado.cedula)) {
      errores.push('Formato de cédula inválido (000-0000000-0)');
    }
    
    if (!empleado.cargo?.trim()) errores.push('El cargo es requerido');
    if (!empleado.salarioBase || empleado.salarioBase <= 0) errores.push('El salario debe ser mayor a 0');
    if (empleado.salarioBase < configNomina.salarioMinimo) {
      errores.push(`El salario no puede ser menor al mínimo (${formatearMoneda(configNomina.salarioMinimo)})`);
    }
    
    return errores;
  };

  // Cálculo de prestaciones laborales
  const calcularPrestaciones = (empleado) => {
    const antiguedad = calcularAntiguedad(empleado.fechaIngreso);
    const salarioMensual = empleado.salarioBase;
    const salarioDiario = salarioMensual / 30;
    
    // Vacaciones (14 días por año)
    const vacacionesDias = Math.floor((antiguedad.totalDias / 365) * configNomina.prestaciones.vacaciones.diasPorAno);
    const vacacionesValor = vacacionesDias * salarioDiario * (configNomina.prestaciones.vacaciones.pagaDoble ? 2 : 1);
    
    // Cesantía (23 días por año, máximo 15 años)
    const añosParaCesantia = Math.min(antiguedad.años, configNomina.prestaciones.cesantia.maxAnosCalcular);
    const cesantiaDias = añosParaCesantia * configNomina.prestaciones.cesantia.diasPorAno;
    const cesantiaValor = cesantiaDias * salarioDiario;
    
    // Regalía navideña (salario completo si trabajó 12 meses, proporcional si menos)
    const mesesTrabajadosAnoActual = new Date().getMonth() + 1; // Simplificado
    const regaliaDiciembreValor = (mesesTrabajadosAnoActual / 12) * salarioMensual;
    
    // Preaviso según antigüedad
    const preaviso = configNomina.prestaciones.preaviso.escalas.find(
      escala => antiguedad.años >= escala.desdeAnosAntiguedad && antiguedad.años < escala.hastaAnosAntiguedad
    );
    const preavisoValor = preaviso ? (preaviso.diasPreaviso * salarioDiario) : 0;
    
    return {
      vacaciones: {
        dias: vacacionesDias,
        valor: vacacionesValor
      },
      cesantia: {
        dias: cesantiaDias,
        valor: cesantiaValor
      },
      regaliaDiciembre: {
        valor: regaliaDiciembreValor,
        proporcional: mesesTrabajadosAnoActual < 12
      },
      preaviso: {
        dias: preaviso?.diasPreaviso || 0,
        valor: preavisoValor
      },
      totalPrestaciones: vacacionesValor + cesantiaValor + regaliaDiciembreValor + preavisoValor
    };
  };

  // Cálculo mejorado de nómina
  const calcularNominaEmpleado = (empleadoId, periodo) => {
    const empleado = empleados.find(e => e.id === empleadoId);
    if (!empleado || empleado.estado !== 'activo') return null;

    // Obtener incidencias del período
    const incidenciasPeriodo = incidencias.filter(i => 
      i.empleadoId === empleadoId && 
      (i.fecha?.startsWith(periodo) || 
       (i.fechaInicio?.startsWith(periodo) || i.fechaFin?.startsWith(periodo)))
    );

    // Calcular salario base
    let salarioBase = empleado.salarioBase;
    if (empleado.tipoSalario === 'por_hora') {
      const horasNormales = 184; // Aproximado mensual
      salarioBase = empleado.salarioBase * horasNormales;
    }

    // Calcular horas extras
    const horasExtras = incidenciasPeriodo
      .filter(i => i.tipo === 'horas_extra' && i.aprobado)
      .reduce((total, incidencia) => {
        const valorHora = empleado.tipoSalario === 'por_hora' 
          ? empleado.salarioBase 
          : empleado.salarioBase / 184;
        const recargo = configNomina.recargosHorarios.find(r => r.tipo === incidencia.tipoRecargo);
        return total + (incidencia.horas * valorHora * (recargo?.multiplicador || 1));
      }, 0);

    // Calcular descuentos por faltas
    const faltas = incidenciasPeriodo.filter(i => i.tipo === 'falta' && !i.justificada);
    const descuentoFaltas = faltas.reduce((total, falta) => {
      const valorDia = salarioBase / 30;
      return total + valorDia;
    }, 0);

    // Calcular bonificaciones
    const bonificacionesFijas = configNomina.bonificaciones
      .filter(b => b.tipo === 'fijo' && b.activa)
      .reduce((total, b) => total + b.monto, 0);

    const bonificacionesVariables = configNomina.bonificaciones
      .filter(b => b.tipo === 'variable' && b.activa)
      .reduce((total, b) => total + (salarioBase * b.porcentaje / 100), 0);

    const totalBonificaciones = bonificacionesFijas + bonificacionesVariables;
    const totalDevengado = salarioBase + horasExtras + totalBonificaciones - descuentoFaltas;

    // Calcular deducciones legales
    const deduccionTSS = Math.min(
      totalDevengado * 2.87 / 100,
      (configNomina.salarioMinimo * 10) * 2.87 / 100
    );

    // Calcular ISR por escalas
    let deduccionISR = 0;
    const salarioAnual = totalDevengado * 12;
    for (const escala of configNomina.deduccionesLegales[1].escalas) {
      if (salarioAnual > escala.desde) {
        const baseImponible = Math.min(salarioAnual, escala.hasta) - escala.desde;
        deduccionISR += baseImponible * escala.porcentaje / 100;
      }
    }
    deduccionISR = deduccionISR / 12; // Mensual

    const totalDeducciones = deduccionTSS + deduccionISR;
    const salarioNeto = totalDevengado - totalDeducciones;

    return {
      empleado,
      periodo,
      conceptos: {
        salarioBase,
        horasExtras,
        bonificaciones: totalBonificaciones,
        descuentoFaltas,
        totalDevengado,
        deduccionTSS,
        deduccionISR,
        totalDeducciones,
        salarioNeto
      },
      incidencias: incidenciasPeriodo,
      prestaciones: calcularPrestaciones(empleado)
    };
  };

  // Operaciones masivas
  const ejecutarOperacionMasiva = (tipo, parametros) => {
    setLoading(true);
    
    setTimeout(() => {
      switch (tipo) {
        case 'aumento_salarial':
          const { porcentaje, empleadosSeleccionados } = parametros;
          setEmpleados(prev => prev.map(emp => {
            if (empleadosSeleccionados.includes(emp.id)) {
              return {
                ...emp,
                salarioBase: emp.salarioBase * (1 + porcentaje / 100)
              };
            }
            return emp;
          }));
          break;
          
        case 'regalia_navidena':
          // Calcular regalía para todos los empleados activos
          const empleadosActivos = empleados.filter(e => e.estado === 'activo');
          console.log(`Calculando regalía navideña para ${empleadosActivos.length} empleados`);
          break;
          
        case 'bonificacion_especial':
          const { monto, concepto } = parametros;
          // Agregar bonificación especial
          console.log(`Aplicando bonificación de ${formatearMoneda(monto)} por ${concepto}`);
          break;
      }
      
      setLoading(false);
      setModalOperacionMasiva({ open: false, tipo: null });
      showSuccessMessage('✅ Operación masiva completada exitosamente');
    }, 2000);
  };

  // Función para mostrar mensajes (simulada)
  const showSuccessMessage = (message) => {
    console.log('SUCCESS:', message);
  };

  const showErrorMessage = (message) => {
    console.log('ERROR:', message);
  };

  // Procesar nómina completa
    const procesarNominaCompleta = async () => {
    try {
      setLoading(true);
      const empleadosIds = empleados.filter(e => e.estado === 'activo').map(e => e.id);
      
      const resultado = await procesarNomina({
        periodo: selectedPeriodo,
        empleadosIds: empleadosIds
      });
      
      await cargarNominas(); // Recargar la lista
      showSuccessMessage(resultado.message);
    } catch (error) {
      showErrorMessage('Error al procesar nómina');
    } finally {
      setLoading(false);
    }
  };

  // Renderizado de empleados con CRUD completo
  const renderEmpleados = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>
          👥 Gestión de Empleados
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setModalEmpleado({ open: true, empleado: null, modo: 'crear' })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            <UserPlus style={{ width: '1rem', height: '1rem' }} />
            Nuevo Empleado
          </button>
          <button
            onClick={() => setModalOperacionMasiva({ open: true, tipo: 'aumento_salarial' })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            <TrendingUp style={{ width: '1rem', height: '1rem' }} />
            Operaciones Masivas
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div style={{
        background: 'white',
        borderRadius: '0.75rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb',
        padding: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
              Buscar empleado:
            </label>
            <input
              type="text"
              placeholder="Nombre, cédula o cargo..."
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
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
              Departamento:
            </label>
            <select style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.875rem'
            }}>
              <option value="">Todos</option>
              <option value="Tecnología">Tecnología</option>
              <option value="Recursos Humanos">Recursos Humanos</option>
              <option value="Finanzas">Finanzas</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
              Estado:
            </label>
            <select style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.875rem'
            }}>
              <option value="">Todos</option>
              <option value="activo">Activo</option>
              <option value="suspendido">Suspendido</option>
              <option value="terminado">Terminado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de empleados */}
      <div style={{
        background: 'white',
        borderRadius: '0.75rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f9fafb' }}>
              <tr>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                  Empleado
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                  Cargo
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                  Salario
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                  Antigüedad
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                  Estado
                  
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {empleados.map((empleado) => {
                const antiguedad = calcularAntiguedad(empleado.fechaIngreso);
                return (
                  <tr key={empleado.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <div>
                        <div style={{ fontWeight: '500', color: '#111827' }}>
                          {empleado.nombre} {empleado.apellidos}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {empleado.cedula} • {empleado.email}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div>
                        <div style={{ fontWeight: '500', color: '#111827' }}>
                          {empleado.cargo}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {empleado.departamento}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ fontWeight: '500', color: '#111827' }}>
                        {formatearMoneda(empleado.salarioBase)}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        {empleado.tipoSalario === 'mensual' ? 'Mensual' : 'Actual'}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      {antiguedad.años} años, {antiguedad.meses} meses
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        background: empleado.estado === 'activo' ? '#dcfce7' : 
                                   empleado.estado === 'suspendido' ? '#fef3c7' : '#b6daafff',
                        color: empleado.estado === 'activo' ? '#045523ff' : 
                               empleado.estado === 'suspendido' ? '#a7d891ff' : '#335803ff'
                      }}>
                        {empleado.estado}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button
                          onClick={() => setModalEmpleado({ open: true, empleado, modo: 'editar' })}
                          style={{
                            padding: '0.25rem',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: 'pointer'
                          }}
                          title="Editar"
                        >
                          <Edit style={{ width: '1rem', height: '1rem' }} />
                        </button>
                        <button
                          onClick={() => setModalPrestaciones({ open: true, empleado })}
                          style={{
                            padding: '0.25rem',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: 'pointer'
                          }}
                          title="Prestaciones"
                        >
                          <Award style={{ width: '1rem', height: '1rem' }} />
                        </button>
                        <button
                          onClick={() => setModalIncidencia({ open: true, empleado })}
                          style={{
                            padding: '0.25rem',
                            background: '#f59e0b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: 'pointer'
                          }}
                          title="Incidencias"
                        >
                          <Clock style={{ width: '1rem', height: '1rem' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de empleado */}
      {modalEmpleado.open && (
        <ModalEmpleado 
          empleado={modalEmpleado.empleado}
          modo={modalEmpleado.modo}
          onClose={() => setModalEmpleado({ open: false, empleado: null, modo: 'crear' })}
          onSave={(empleado) => {
            const errores = validarEmpleado(empleado);
            if (errores.length > 0) {
              showErrorMessage(errores.join(', '));
              return;
            }

            if (modalEmpleado.modo === 'crear') {
              setEmpleados(prev => [...prev, { ...empleado, id: Date.now() }]);
              showSuccessMessage('✅ Empleado creado exitosamente');
            } else {
              setEmpleados(prev => prev.map(e => e.id === empleado.id ? empleado : e));
              showSuccessMessage('✅ Empleado actualizado exitosamente');
            }
            setModalEmpleado({ open: false, empleado: null, modo: 'crear' });
          }}
          configNomina={configNomina}                                                                                                                                                                                                             
        />
      )}

      {/* Modal de prestaciones */}
      {modalPrestaciones.open && modalPrestaciones.empleado && (
        <ModalPrestaciones 
          empleado={modalPrestaciones.empleado}
          prestaciones={calcularPrestaciones(modalPrestaciones.empleado)}
          onClose={() => setModalPrestaciones({ open: false, empleado: null })}
          formatearMoneda={formatearMoneda}
        />
      )}

      {/* Modal de operaciones masivas */}
      {modalOperacionMasiva.open && (
        <ModalOperacionMasiva 
          tipo={modalOperacionMasiva.tipo}
          empleados={empleados}
          onClose={() => setModalOperacionMasiva({ open: false, tipo: null })}
          onExecute={ejecutarOperacionMasiva}
          formatearMoneda={formatearMoneda}
        />
      )}
    </div>
  );

  // Renderizado de incidencias mejorado
  const renderIncidencias = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>
          Gestión de Incidencias
        </h2>
        <button
          onClick={() => setModalIncidencia({ open: true, empleado: null })}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          <Plus style={{ width: '1rem', height: '1rem' }} />
          Nueva Incidencia
        </button>
      </div>

      {/* Resumen de incidencias */}
      <div style={{
        background: 'white',
        borderRadius: '0.75rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb',
        padding: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
          Resumen del Período
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem'
        }}>
          <div style={{ textAlign: 'center', padding: '1rem', background: '#f0f9ff', borderRadius: '0.5rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
              {incidencias.filter(i => i.tipo === 'horas_extra' && i.aprobado).length}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Horas Extra</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', background: '#fef3c7', borderRadius: '0.5rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#d97706' }}>
              {incidencias.filter(i => i.tipo === 'falta').length}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Faltas</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', background: '#f0fdf4', borderRadius: '0.5rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
              {incidencias.filter(i => i.tipo === 'vacaciones' && i.aprobado).length}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Vacaciones</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', background: '#fdf2f8', borderRadius: '0.5rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#be185d' }}>
              {incidencias.filter(i => !i.aprobado).length}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Pendientes</div>
          </div>
        </div>
      </div>

      {/* Tabla de incidencias */}
      <div style={{
        background: 'white',
        borderRadius: '0.75rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f9fafb' }}>
              <tr>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                  Empleado
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                  Tipo
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                  Fecha/Período
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                  Detalles
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                  Estado
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {incidencias.map((incidencia) => {
                const empleado = empleados.find(e => e.id === incidencia.empleadoId);
                return (
                  <tr key={incidencia.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ fontWeight: '500', color: '#111827' }}>
                        {empleado?.nombre} {empleado?.apellidos}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        background: incidencia.tipo === 'horas_extra' ? '#dbeafe' : 
                                   incidencia.tipo === 'falta' ? '#fee2e2' : 
                                   incidencia.tipo === 'vacaciones' ? '#dcfce7' : '#fef3c7',
                        color: incidencia.tipo === 'horas_extra' ? '#1e40af' : 
                               incidencia.tipo === 'falta' ? '#dc2626' : 
                               incidencia.tipo === 'vacaciones' ? '#166534' : '#d97706'
                      }}>
                        {incidencia.tipo.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      {incidencia.fecha || `${incidencia.fechaInicio} - ${incidencia.fechaFin}`}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      {incidencia.horas && `${incidencia.horas} horas`}
                      {incidencia.diasSolicitados && `${incidencia.diasSolicitados} días`}
                      {incidencia.descripcion && (
                        <div style={{ marginTop: '0.25rem', fontSize: '0.75rem' }}>
                          {incidencia.descripcion}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        background: incidencia.aprobado ? '#dcfce7' : '#fef3c7',
                        color: incidencia.aprobado ? '#166534' : '#d97706'
                      }}>
                        {incidencia.aprobado ? 'Aprobado' : 'Pendiente'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button
                          style={{
                            padding: '0.25rem',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: 'pointer'
                          }}
                          title="Editar"
                        >
                          <Edit style={{ width: '1rem', height: '1rem' }} />
                        </button>
                        {!incidencia.aprobado && (
                          <button
                            onClick={() => {
                              setIncidencias(prev => prev.map(i => 
                                i.id === incidencia.id ? { ...i, aprobado: true, fechaAprobacion: new Date().toISOString().split('T')[0] } : i
                              ));
                              showSuccessMessage('✅ Incidencia aprobada');
                            }}
                            style={{
                              padding: '0.25rem',
                              background: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.25rem',
                              cursor: 'pointer'
                            }}
                            title="Aprobar"
                          >
                            <CheckCircle style={{ width: '1rem', height: '1rem' }} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Renderizado de nómina mejorado
  const renderNomina = () => {
    const empleadosActivos = empleados.filter(e => e.estado === 'activo');
    const calculosNomina = empleadosActivos.map(emp => calcularNominaEmpleado(emp.id, selectedPeriodo)).filter(Boolean);
    const totalNomina = calculosNomina.reduce((total, calc) => total + calc.conceptos.salarioNeto, 0);
    const totalDeducciones = calculosNomina.reduce((total, calc) => total + calc.conceptos.totalDeducciones, 0);

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>
             Cálculo de Nómina
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={procesarNominaCompleta}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: loading ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              <Calculator style={{ width: '1rem', height: '1rem' }} />
              {loading ? 'Procesando...' : 'Procesar Nómina'}
            </button>
            <button
              onClick={() => setModalOperacionMasiva({ open: true, tipo: 'regalia_navidena' })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              <Gift style={{ width: '1rem', height: '1rem' }} />
              Regalía Navideña
            </button>
          </div>
        </div>

        {/* Resumen de nómina */}
        <div style={{
          background: 'white',
          borderRadius: '0.75rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb',
          padding: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
            Resumen General - {selectedPeriodo}
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <div style={{ textAlign: 'center', padding: '1rem', background: '#f0f9ff', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
                {empleadosActivos.length}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Empleados Activos</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: '#f0fdf4', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                {formatearMoneda(totalNomina)}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total Nómina Neta</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: '#fef2f2', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626' }}>
                {formatearMoneda(totalDeducciones)}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total Deducciones</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: '#fffbeb', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#d97706' }}>
                {formatearMoneda(totalNomina + totalDeducciones)}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total Bruto</div>
            </div>
          </div>
        </div>

        {/* Detalle por empleado */}
        <div style={{
          background: 'white',
          borderRadius: '0.75rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f9fafb' }}>
                <tr>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                    Empleado
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                    Salario Base
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                    Extras/Bonos
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                    Descuentos
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                    Deducciones
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                    Salario Neto
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {calculosNomina.map((calculo) => (
                  <tr key={calculo.empleado.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ fontWeight: '500', color: '#111827' }}>
                        {calculo.empleado.nombre} {calculo.empleado.apellidos}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        {calculo.empleado.cargo}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '500' }}>
                      {formatearMoneda(calculo.conceptos.salarioBase)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', color: '#10b981', fontWeight: '500' }}>
                      {formatearMoneda(calculo.conceptos.horasExtras + calculo.conceptos.bonificaciones)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', color: '#dc2626', fontWeight: '500' }}>
                      {formatearMoneda(calculo.conceptos.descuentoFaltas || 0)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', color: '#ef4444', fontWeight: '500' }}>
                      {formatearMoneda(calculo.conceptos.totalDeducciones)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold', color: '#10b981', fontSize: '1.125rem' }}>
                      {formatearMoneda(calculo.conceptos.salarioNeto)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <button
                        onClick={() => setModalRecibo({ open: true, nomina: { empleadoId: calculo.empleado.id, conceptos: calculo.conceptos, periodo: selectedPeriodo } })}
                        style={{
                          padding: '0.25rem',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.25rem',
                          cursor: 'pointer'
                        }}
                        title="Ver recibo"
                      >
                        <Eye style={{ width: '1rem', height: '1rem' }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Renderizado de reportes mejorado
  const renderReportes = () => (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827', marginBottom: '1.5rem' }}>
        Reportes y Análisis
      </h2>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {/* Métricas principales */}
        <div style={{
          background: 'white',
          borderRadius: '0.75rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb',
          padding: '1.5rem'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
            Métricas del Período Actual
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem'
          }}>
            <div style={{ textAlign: 'center', padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>
                {formatearMoneda(nominasProcesadas.reduce((total, n) => total + (n.conceptos?.totalDevengado || 0), 0))}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total Devengado</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>
                {formatearMoneda(nominasProcesadas.reduce((total, n) => total + (n.conceptos?.totalDeducciones || 0), 0))}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>TSS e ISR</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>
                {empleados.filter(e => e.estado === 'activo').length}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Empleados Activos</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>
                {(empleados.reduce((sum, emp) => sum + calcularAntiguedad(emp.fechaIngreso).años, 0) / empleados.length).toFixed(1)}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Antigüedad Promedio</div>
            </div>
          </div>
        </div>

        {/* Generadores de reportes */}
        <div style={{
          background: 'white',
          borderRadius: '0.75rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb',
          padding: '1.5rem'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
            Generar Reportes
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem'
          }}>
            <ReporteCard 
              icon={<FileBarChart style={{ width: '2rem', height: '2rem', color: '#3b82f6' }} />}
              titulo="Nómina Completa"
              descripcion="Reporte detallado de nómina por período"
              color="#f0f9ff"
              onClick={() => console.log('Generando reporte de nómina')}
            />
            <ReporteCard 
              icon={<Users style={{ width: '2rem', height: '2rem', color: '#10b981' }} />}
              titulo="Plantilla de Personal"
              descripcion="Listado completo de empleados y datos"
              color="#f0fdf4"
              onClick={() => console.log('Generando reporte de empleados')}
            />
            <ReporteCard 
              icon={<TrendingUp style={{ width: '2rem', height: '2rem', color: '#f59e0b' }} />}
              titulo="Aportes Patronales"
              descripcion="TSS, INFOTEP y contribuciones"
              color="#fffbeb"
              onClick={() => console.log('Generando reporte de aportes')}
            />
            <ReporteCard 
              icon={<Receipt style={{ width: '2rem', height: '2rem', color: '#ef4444' }} />}
              titulo="Deducciones Fiscales"
              descripcion="ISR y retenciones por empleado"
              color="#fef2f2"
              onClick={() => console.log('Generando reporte fiscal')}
            />
            <ReporteCard 
              icon={<Award style={{ width: '2rem', height: '2rem', color: '#8b5cf6' }} />}
              titulo="Prestaciones Laborales"
              descripcion="Vacaciones, cesantía y regalía"
              color="#faf5ff"
              onClick={() => console.log('Generando reporte de prestaciones')}
            />
            <ReporteCard 
              icon={<Clock style={{ width: '2rem', height: '2rem', color: '#06b6d4' }} />}
              titulo="Control de Tiempo"
              descripcion="Horas extra, faltas y permisos"
              color="#f0fdfa"
              onClick={() => console.log('Generando reporte de tiempo')}
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Componente para cards de reportes
  const ReporteCard = ({ icon, titulo, descripcion, color, onClick }) => (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '1.5rem',
        background: color,
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        cursor: 'pointer',
        textAlign: 'center',
        transition: 'transform 0.2s',
        ':hover': { transform: 'translateY(-2px)' }
      }}
    >
      {icon}
      <div style={{ fontWeight: '500', color: '#111827' }}>{titulo}</div>
      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{descripcion}</div>
    </button>
  );

  // Navegación por pestañas
  const tabs = [
    { id: 'empleados', label: '👥 Empleados', component: renderEmpleados },
    { id: 'incidencias', label: 'Incidencias', component: renderIncidencias },
    { id: 'nomina', label: 'Nómina', component: renderNomina },
    { id: 'reportes', label: 'Reportes', component: renderReportes }
  ];

  return (
    <div style={{ padding: '1.5rem', minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ maxWidth: '112rem', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
            Sistema Integral de Nómina RD
          </h1>
          <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>
            Gestión completa de empleados, prestaciones laborales y nómina para República Dominicana
          </p>
        </div>

        {/* Selector de período */}
        <div style={{
          background: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '0.75rem',
          padding: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Calendar style={{ width: '1.25rem', height: '1.25rem', color: '#0369a1' }} />
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#0369a1', marginBottom: '0.5rem', display: 'block' }}>
                Período de Nómina:
              </label>
              <select
                value={selectedPeriodo}
                onChange={(e) => setSelectedPeriodo(e.target.value)}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #bfdbfe',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  background: 'white',
                  fontWeight: '500'
                }}
              >
                <option value="2024-07">Julio 2024</option>
                <option value="2024-06">Junio 2024</option>
                <option value="2024-05">Mayo 2024</option>
                <option value="2024-04">Abril 2024</option>
              </select>
            </div>
            <div style={{
              padding: '0.5rem 1rem',
              background: '#dcfce7',
              color: '#166534',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              Sistema Operativo
            </div>
          </div>
        </div>

        {/* Navegación */}
        <div style={{
          background: 'white',
          borderRadius: '0.75rem 0.75rem 0 0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb',
          borderBottom: 'none'
        }}>
          <div style={{
            display: 'flex',
            overflowX: 'auto',
            borderBottom: '1px solid #e5e7eb'
          }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '1rem 1.5rem',
                  borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                  background: activeTab === tab.id ? '#f8fafc' : 'transparent',
                  color: activeTab === tab.id ? '#3b82f6' : '#6b7280',
                  border: 'none',
                  fontWeight: activeTab === tab.id ? '600' : '500',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenido */}
        <div style={{
          background: 'white',
          borderRadius: '0 0 0.75rem 0.75rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb',
          borderTop: 'none',
          padding: '2rem',
          minHeight: '500px'
        }}>
          {tabs.find(tab => tab.id === activeTab)?.component()}
        </div>
      </div>
    </div>
  );
};

// Modal de empleado
const ModalEmpleado = ({ empleado, modo, onClose, onSave, configNomina }) => {
  const [formData, setFormData] = useState(empleado || {
    nombre: '',
    apellidos: '',
    cedula: '',
    cargo: '',
    departamento: '',
    tipoContrato: 'fijo',
    salarioBase: configNomina.salarioMinimo,
    tipoSalario: 'mensual',
    fechaIngreso: new Date().toISOString().split('T')[0],
    fechaNacimiento: '',
    banco: '',
    numeroCuenta: '',
    estado: 'activo',
    telefono: '',
    email: '',
    direccion: '',
    sexo: 'M',
    estadoCivil: 'soltero',
    nacionalidad: 'dominicana',
    tipoDocumento: 'cedula',
    nivelEducativo: 'secundario',
    profesion: '',
    contactoEmergencia: {
      nombre: '',
      telefono: '',
      relacion: ''
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '0.75rem',
        boxShadow: '0 20px 25px rgba(0,0,0,0.1)',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827' }}>
            {modo === 'crear' ? '👤 Nuevo Empleado' : '✏️ Editar Empleado'}
          </h3>
          <button
            onClick={onClose}
            style={{
              padding: '0.25rem',
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}
          >
            <X style={{ width: '1rem', height: '1rem' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {/* Información personal */}
            <div>
              <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                Información Personal
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Nombres *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    value={formData.apellidos}
                    onChange={(e) => setFormData(prev => ({ ...prev, apellidos: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Cédula *
                  </label>
                  <input
                    type="text"
                    value={formData.cedula}
                    onChange={(e) => setFormData(prev => ({ ...prev, cedula: e.target.value }))}
                    placeholder="000-0000000-0"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Fecha de Nacimiento
                  </label>
                  <input
                    type="date"
                    value={formData.fechaNacimiento}
                    onChange={(e) => setFormData(prev => ({ ...prev, fechaNacimiento: e.target.value }))}
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

            {/* Información laboral */}
            <div>
              <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                💼 Información Laboral
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Cargo *
                  </label>
                  <input
                    type="text"
                    value={formData.cargo}
                    onChange={(e) => setFormData(prev => ({ ...prev, cargo: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Departamento
                  </label>
                  <select
                    value={formData.departamento}
                    onChange={(e) => setFormData(prev => ({ ...prev, departamento: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="">Seleccionar</option>
                    <option value="Tecnología">Tecnología</option>
                    <option value="Recursos Humanos">Recursos Humanos</option>
                    <option value="Finanzas">Finanzas</option>
                    <option value="Ventas">Ventas</option>
                    <option value="Operaciones">Operaciones</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Salario Base *
                  </label>
                  <input
                    type="number"
                    value={formData.salarioBase}
                    onChange={(e) => setFormData(prev => ({ ...prev, salarioBase: Number(e.target.value) }))}
                    min={configNomina.salarioMinimo}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                    required
                  />
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    Mínimo: {configNomina.salarioMinimo.toLocaleString('es-DO')} DOP
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Fecha de Ingreso *
                  </label>
                  <input
                    type="date"
                    value={formData.fechaIngreso}
                    onChange={(e) => setFormData(prev => ({ ...prev, fechaIngreso: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Información de contacto */}
            <div>
              <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                📞 Información de Contacto
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                    placeholder="809-555-0000"
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
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
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
          </div>

          <div style={{
            display: 'flex',
            gap: '1rem',
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid #e5e7eb'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '0.375rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '0.75rem',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              {modo === 'crear' ? 'Crear Empleado' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal de prestaciones
const ModalPrestaciones = ({ empleado, prestaciones, onClose, formatearMoneda }) => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem'
  }}>
    <div style={{
      background: 'white',
      borderRadius: '0.75rem',
      boxShadow: '0 20px 25px rgba(0,0,0,0.1)',
      maxWidth: '600px',
      width: '100%',
      maxHeight: '90vh',
      overflow: 'auto'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827' }}>
          Prestaciones Laborales - {empleado.nombre} {empleado.apellidos}
        </h3>
        <button
          onClick={onClose}
          style={{
            padding: '0.25rem',
            background: '#f3f4f6',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: 'pointer'
          }}
        >
          <X style={{ width: '1rem', height: '1rem' }} />
        </button>
      </div>

      <div style={{ padding: '1.5rem' }}>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{
            padding: '1rem',
            background: '#f0f9ff',
            borderRadius: '0.5rem',
            border: '1px solid #bae6fd'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '600', color: '#111827' }}>Vacaciones</div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  {prestaciones.vacaciones.dias} días acumulados
                </div>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#3b82f6' }}>
                {formatearMoneda(prestaciones.vacaciones.valor)}
              </div>
            </div>
          </div>

          <div style={{
            padding: '1rem',
            background: '#f0fdf4',
            borderRadius: '0.5rem',
            border: '1px solid #bbf7d0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '600', color: '#111827' }}>Cesantía</div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  {prestaciones.cesantia.dias} días acumulados
                </div>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981' }}>
                {formatearMoneda(prestaciones.cesantia.valor)}
              </div>
            </div>
          </div>

          <div style={{
            padding: '1rem',
            background: '#fef2f2',
            borderRadius: '0.5rem',
            border: '1px solid #fecaca'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '600', color: '#111827' }}>Regalía Navideña</div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  {prestaciones.regaliaDiciembre.proporcional ? 'Proporcional' : 'Completa'}
                </div>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#dc2626' }}>
                {formatearMoneda(prestaciones.regaliaDiciembre.valor)}
              </div>
            </div>
          </div>

          <div style={{
            padding: '1rem',
            background: '#fffbeb',
            borderRadius: '0.5rem',
            border: '1px solid #fde68a'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '600', color: '#111827' }}>Preaviso</div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  {prestaciones.preaviso.dias} días según antigüedad
                </div>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#d97706' }}>
                {formatearMoneda(prestaciones.preaviso.valor)}
              </div>
            </div>
          </div>

          <div style={{
            padding: '1rem',
            background: '#f8fafc',
            borderRadius: '0.5rem',
            border: '2px solid #374151'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '600', color: '#111827', fontSize: '1.125rem' }}>Total Prestaciones</div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Valor acumulado total
                </div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>
                {formatearMoneda(prestaciones.totalPrestaciones)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Modal de operaciones masivas
const ModalOperacionMasiva = ({ tipo, empleados, onClose, onExecute, formatearMoneda }) => {
  const [parametros, setParametros] = useState({
    porcentaje: 10,
    monto: 5000,
    concepto: 'Bonificación especial',
    empleadosSeleccionados: empleados.filter(e => e.estado === 'activo').map(e => e.id)
  });

  const handleExecute = () => {
    onExecute(tipo, parametros);
  };

  const getTituloOperacion = () => {
    switch (tipo) {
      case 'aumento_salarial': return 'Aumento Salarial Masivo';
      case 'regalia_navidena': return 'Cálculo de Regalía Navideña';
      case 'bonificacion_especial': return 'Bonificación Especial';
      default: return 'Operación Masiva';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '0.75rem',
        boxShadow: '0 20px 25px rgba(0,0,0,0.1)',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827' }}>
            {getTituloOperacion()}
          </h3>
          <button
            onClick={onClose}
            style={{
              padding: '0.25rem',
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}
          >
            <X style={{ width: '1rem', height: '1rem' }} />
          </button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {tipo === 'aumento_salarial' && (
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Porcentaje de Aumento (%)
                </label>
                <input
                  type="number"
                  value={parametros.porcentaje}
                  onChange={(e) => setParametros(prev => ({ ...prev, porcentaje: Number(e.target.value) }))}
                  min="0"
                  max="100"
                  step="0.5"
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
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Empleados Seleccionados ({parametros.empleadosSeleccionados.length})
                </label>
                <div style={{ 
                  maxHeight: '200px', 
                  overflowY: 'auto', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '0.375rem', 
                  padding: '0.5rem' 
                }}>
                  {empleados.filter(e => e.estado === 'activo').map(empleado => (
                    <label key={empleado.id} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem', 
                      padding: '0.25rem',
                      cursor: 'pointer' 
                    }}>
                      <input
                        type="checkbox"
                        checked={parametros.empleadosSeleccionados.includes(empleado.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setParametros(prev => ({
                              ...prev,
                              empleadosSeleccionados: [...prev.empleadosSeleccionados, empleado.id]
                            }));
                          } else {
                            setParametros(prev => ({
                              ...prev,
                              empleadosSeleccionados: prev.empleadosSeleccionados.filter(id => id !== empleado.id)
                            }));
                          }
                        }}
                      />
                      <span style={{ fontSize: '0.875rem' }}>
                        {empleado.nombre} {empleado.apellidos} - {formatearMoneda(empleado.salarioBase)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ 
                padding: '1rem', 
                background: '#f0f9ff', 
                borderRadius: '0.5rem',
                border: '1px solid #bae6fd' 
              }}>
                <div style={{ fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
                  Vista Previa del Aumento
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Empleados afectados: {parametros.empleadosSeleccionados.length}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Aumento total estimado: {formatearMoneda(
                    empleados
                      .filter(e => parametros.empleadosSeleccionados.includes(e.id))
                      .reduce((total, emp) => total + (emp.salarioBase * parametros.porcentaje / 100), 0)
                  )}
                </div>
              </div>
            </div>
          )}

          {tipo === 'regalia_navidena' && (
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ 
                padding: '1rem', 
                background: '#fef2f2', 
                borderRadius: '0.5rem',
                border: '1px solid #fecaca' 
              }}>
                <div style={{ fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
                  🎄 Cálculo de Regalía Navideña 2024
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
                  Se calculará la regalía navideña para todos los empleados activos que hayan trabajado 
                  al menos 3 meses durante el año.
                </div>
                
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {empleados.filter(e => e.estado === 'activo').map(empleado => (
                    <div key={empleado.id} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '0.5rem',
                      background: 'white',
                      borderRadius: '0.25rem'
                    }}>
                      <span style={{ fontSize: '0.875rem' }}>
                        {empleado.nombre} {empleado.apellidos}
                      </span>
                      <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#dc2626' }}>
                        {formatearMoneda(empleado.salarioBase)}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ 
                  marginTop: '1rem', 
                  paddingTop: '1rem', 
                  borderTop: '1px solid #f3f4f6',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: '600'
                }}>
                  <span>Total Regalía:</span>
                  <span style={{ color: '#dc2626' }}>
                    {formatearMoneda(
                      empleados
                        .filter(e => e.estado === 'activo')
                        .reduce((total, emp) => total + emp.salarioBase, 0)
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          {tipo === 'bonificacion_especial' && (
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Monto de Bonificación
                </label>
                <input
                  type="number"
                  value={parametros.monto}
                  onChange={(e) => setParametros(prev => ({ ...prev, monto: Number(e.target.value) }))}
                  min="0"
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
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Concepto de la Bonificación
                </label>
                <input
                  type="text"
                  value={parametros.concepto}
                  onChange={(e) => setParametros(prev => ({ ...prev, concepto: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div style={{ 
                padding: '1rem', 
                background: '#f0fdf4', 
                borderRadius: '0.5rem',
                border: '1px solid #bbf7d0' 
              }}>
                <div style={{ fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
                  Resumen de Bonificación
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Empleados beneficiados: {empleados.filter(e => e.estado === 'activo').length}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Monto total: {formatearMoneda(parametros.monto * empleados.filter(e => e.estado === 'activo').length)}
                </div>
              </div>
            </div>
          )}

          <div style={{
            display: 'flex',
            gap: '1rem',
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid #e5e7eb'
          }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '0.375rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleExecute}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Ejecutar Operación
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal de recibo de pago
const ModalRecibo = ({ nomina, empleados, onClose, formatearMoneda, configNomina }) => {
  const empleado = empleados.find(e => e.id === nomina.empleadoId);
  
  const generarReciboHTML = () => {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px;">
          <h1>${configNomina.empresa.nombre}</h1>
          <p>RNC: ${configNomina.empresa.rnc}</p>
          <p>${configNomina.empresa.direccion}</p>
          <h2>RECIBO DE PAGO</h2>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div>
            <h3>DATOS DEL EMPLEADO</h3>
            <p><strong>Nombre:</strong> ${empleado.nombre} ${empleado.apellidos}</p>
            <p><strong>Cédula:</strong> ${empleado.cedula}</p>
            <p><strong>Cargo:</strong> ${empleado.cargo}</p>
            <p><strong>Departamento:</strong> ${empleado.departamento}</p>
          </div>
          <div>
            <h3>PERÍODO DE PAGO</h3>
            <p><strong>Período:</strong> ${nomina.periodo}</p>
            <p><strong>Fecha Proceso:</strong> ${new Date().toLocaleDateString('es-DO')}</p>
            <p><strong>Estado:</strong> Procesado</p>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead style="background-color: #f0f0f0;">
            <tr>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">CONCEPTO</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">DEVENGADO</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">DEDUCIDO</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">Salario Base</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatearMoneda(nomina.conceptos.salarioBase)}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">-</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">Horas Extras</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatearMoneda(nomina.conceptos.horasExtras || 0)}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">-</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">Bonificaciones</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatearMoneda(nomina.conceptos.bonificaciones || 0)}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">-</td>
            </tr>
            <tr style="background-color: #f8f9fa;">
              <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">TOTAL DEVENGADO</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">${formatearMoneda(nomina.conceptos.totalDevengado)}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">-</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">TSS (2.87%)</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">-</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatearMoneda(nomina.conceptos.deduccionTSS)}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">ISR</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">-</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatearMoneda(nomina.conceptos.deduccionISR || 0)}</td>
            </tr>
            <tr style="background-color: #f8f9fa;">
              <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">TOTAL DEDUCCIONES</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">-</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">${formatearMoneda(nomina.conceptos.totalDeducciones)}</td>
            </tr>
            <tr style="background-color: #e8f5e8;">
              <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; font-size: 18px;">SALARIO NETO</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold; font-size: 18px;" colspan="2">${formatearMoneda(nomina.conceptos.salarioNeto)}</td>
            </tr>
          </tbody>
        </table>

        <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #666;">
          <p>Este documento ha sido generado electrónicamente y no requiere firma.</p>
          <p>Generado el ${new Date().toLocaleDateString('es-DO')} a las ${new Date().toLocaleTimeString('es-DO')}</p>
        </div>
      </div>
    `;
  };

  const descargarRecibo = () => {
    const htmlContent = generarReciboHTML();
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `recibo_${empleado.nombre}_${nomina.periodo}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '0.75rem',
        boxShadow: '0 20px 25px rgba(0,0,0,0.1)',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827' }}>
            🧾 Recibo de Pago
          </h3>
          <button
            onClick={onClose}
            style={{
              padding: '0.25rem',
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}
          >
            <X style={{ width: '1rem', height: '1rem' }} />
          </button>
        </div>
        
        <div style={{ padding: '1rem' }}>
          <div dangerouslySetInnerHTML={{ __html: generarReciboHTML() }} />
        </div>
        
        <div style={{
          display: 'flex',
          gap: '1rem',
          padding: '1rem',
          borderTop: '1px solid #e5e7eb'
        }}>
          <button
            onClick={descargarRecibo}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            <Download style={{ width: '1rem', height: '1rem' }} />
            Descargar PDF
          </button>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            <Send style={{ width: '1rem', height: '1rem' }} />
            Enviar por Email
          </button>
        </div>
      </div>
    </div>
  );
};

export default SistemaNominaCompleto;