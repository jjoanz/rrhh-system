import React, { useState, useEffect } from 'react';
import { 
  getNominas, 
  procesarNomina, 
  getEmpleadosActivos,
  getConfiguracion,
  actualizarConfiguracion 
} from '../../../api/nominaService';
import { 
  DollarSign, Download, Calendar, Eye, Calculator, Settings, 
  AlertCircle, CheckCircle, User, Users, Edit, Plus, Save, X, 
  UserPlus, TrendingUp, FileText, Award
} from 'lucide-react';

const SistemaNominaCompleto = () => {
  // Estados principales
  const [activeTab, setActiveTab] = useState('empleados');
  const [nominasProcesadas, setNominasProcesadas] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPeriodo, setSelectedPeriodo] = useState('2025-01');

  // Estados de configuración
  const [configuracion, setConfiguracion] = useState({
    deducciones: [],
    aportesPatronales: [],
    escalasISR: []
  });

  // Cargar empleados
  const cargarEmpleados = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getEmpleadosActivos();
      setEmpleados(data);
    } catch (error) {
      console.error('Error al cargar empleados:', error);
      setError('Error al cargar empleados');
    } finally {
      setLoading(false);
    }
  };

  // Cargar nóminas
  const cargarNominas = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getNominas({ periodo: selectedPeriodo });
      setNominasProcesadas(data);
    } catch (error) {
      console.error('Error al cargar nóminas:', error);
      setError('Error al cargar nóminas');
    } finally {
      setLoading(false);
    }
  };

  // Cargar configuración
  const cargarConfiguracion = async () => {
    try {
      const data = await getConfiguracion();
      const deducciones = data.filter(c => c.TipoConfiguracion === 'DEDUCCION');
      const aportesPatronales = data.filter(c => c.TipoConfiguracion === 'APORTE_PATRONAL');
      const escalasISR = data.filter(c => c.TipoConfiguracion === 'ISR').sort((a, b) => a.LimiteInferior - b.LimiteInferior);
      
      setConfiguracion({ deducciones, aportesPatronales, escalasISR });
    } catch (error) {
      console.error('Error al cargar configuración:', error);
    }
  };

  // useEffect para cargar datos según pestaña
  useEffect(() => {
    if (activeTab === 'empleados') {
      cargarEmpleados();
    } else if (activeTab === 'nomina') {
      cargarNominas();
    } else if (activeTab === 'ajustes') {
      cargarConfiguracion();
    }
  }, [activeTab, selectedPeriodo]);

  // Utilidades
  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 2
    }).format(valor || 0);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-DO');
  };

  // Procesar nómina completa
  const procesarNominaCompleta = async () => {
    try {
      setLoading(true);
      const empleadosIds = empleados.map(e => e.id);
      
      const resultado = await procesarNomina({
        periodo: selectedPeriodo,
        empleadosIds: empleadosIds
      });
      
      alert(`✅ ${resultado.message}`);
      await cargarNominas();
    } catch (error) {
      console.error('Error al procesar nómina:', error);
      alert('❌ Error al procesar nómina');
    } finally {
      setLoading(false);
    }
  };

  // Guardar configuración
  const guardarConfiguracion = async () => {
    try {
      setLoading(true);
      
      const configuraciones = [
        ...configuracion.deducciones.map(d => ({
          codigo: d.Codigo,
          porcentaje: d.Porcentaje
        })),
        ...configuracion.aportesPatronales.map(a => ({
          codigo: a.Codigo,
          porcentaje: a.Porcentaje
        })),
        ...configuracion.escalasISR.map(e => ({
          codigo: e.Codigo,
          porcentaje: e.Porcentaje,
          limiteInferior: e.LimiteInferior,
          limiteSuperior: e.LimiteSuperior,
          montoFijo: e.MontoFijo
        }))
      ];

      await actualizarConfiguracion(configuraciones);
      alert('✅ Configuración actualizada correctamente');
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      alert('❌ Error al guardar configuración');
    } finally {
      setLoading(false);
    }
  };

  // Renderizado de empleados
  const renderEmpleados = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>
          👥 Gestión de Empleados
        </h2>
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
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Empleado</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Cédula</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Cargo</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Salario</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {empleados.map((empleado) => (
                <tr key={empleado.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ fontWeight: '500', color: '#111827' }}>
                      {empleado.nombre} {empleado.apellidos}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                    {empleado.cedula}
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                    {empleado.cargo}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '500' }}>
                    {formatearMoneda(empleado.salarioBase)}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      background: '#dcfce7',
                      color: '#166534'
                    }}>
                      {empleado.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Renderizado de nómina (COMO EN LA IMAGEN)
  const renderNomina = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>
          💰 Cálculo de Nómina
        </h2>
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
      </div>

      {/* Tabla de nómina */}
      <div style={{
        background: 'white',
        borderRadius: '0.75rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead style={{ background: '#f9fafb' }}>
              <tr>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Colaborador (a)</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Cédula</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Cargo</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Fecha de Ingreso</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#374151' }}>Salario Nómina</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#374151' }}>2.87%</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#374151' }}>3.04%</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#374151' }}>Total Retención TSS</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#374151' }}>Savica</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#374151' }}>Total Salario (Retención TSS)</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#374151' }}>IRS</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#374151', background: '#dcfce7' }}>Salario Neto</th>
              </tr>
            </thead>
            <tbody>
              {nominasProcesadas.map((nomina) => (
                <tr key={nomina.NominaID} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem', fontWeight: '500' }}>
                    {nomina.NOMBRE} {nomina.APELLIDO}
                  </td>
                  <td style={{ padding: '0.75rem', color: '#6b7280' }}>
                    {nomina.CEDULA}
                  </td>
                  <td style={{ padding: '0.75rem', color: '#6b7280' }}>
                    {nomina.CARGO}
                  </td>
                  <td style={{ padding: '0.75rem', color: '#6b7280' }}>
                    {formatearFecha(nomina.FECHAINGRESO)}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '500' }}>
                    {formatearMoneda(nomina.SalarioBase)}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', color: '#dc2626' }}>
                    {formatearMoneda(nomina.TSS_AFP)}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', color: '#dc2626' }}>
                    {formatearMoneda(nomina.TSS_SFS)}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '500', color: '#dc2626' }}>
                    {formatearMoneda(nomina.TotalTSS)}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', color: '#dc2626' }}>
                    {formatearMoneda(nomina.Savica)}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '500' }}>
                    {formatearMoneda(nomina.SalarioBase - nomina.TotalTSS)}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', color: '#dc2626' }}>
                    {formatearMoneda(nomina.ISR)}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold', color: '#10b981', background: '#f0fdf4' }}>
                    {formatearMoneda(nomina.SalarioNeto)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Renderizado de ajustes de nómina
  const renderAjustes = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>
          ⚙️ Configuración de Nómina
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={cargarConfiguracion}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            <Settings style={{ width: '1rem', height: '1rem' }} />
            Restablecer
          </button>
          <button
            onClick={guardarConfiguracion}
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
            <Save style={{ width: '1rem', height: '1rem' }} />
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {/* TABLA ISR */}
        <div style={{ background: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
            Tabla ISR - DGII
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f9fafb' }}>
              <tr>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151', border: '1px solid #e5e7eb' }}>Escala</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151', border: '1px solid #e5e7eb' }}>Límite Inferior</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151', border: '1px solid #e5e7eb' }}>Límite Superior</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151', border: '1px solid #e5e7eb' }}>Tasa ISR</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151', border: '1px solid #e5e7eb' }}>Monto Fijo</th>
              </tr>
            </thead>
            <tbody>
              {configuracion.escalasISR.map((escala, index) => (
                <tr key={escala.ConfigID}>
                  <td style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #e5e7eb', fontWeight: '500' }}>{index + 1}</td>
                  <td style={{ padding: '0.5rem', border: '1px solid #e5e7eb' }}>
                    <input
                      type="number"
                      value={escala.LimiteInferior}
                      onChange={(e) => {
                        const nuevasEscalas = [...configuracion.escalasISR];
                        nuevasEscalas[index].LimiteInferior = Number(e.target.value);
                        setConfiguracion({...configuracion, escalasISR: nuevasEscalas});
                      }}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', fontSize: '0.875rem' }}
                    />
                  </td>
                  <td style={{ padding: '0.5rem', border: '1px solid #e5e7eb' }}>
                    <input
                      type="number"
                      value={escala.LimiteSuperior}
                      onChange={(e) => {
                        const nuevasEscalas = [...configuracion.escalasISR];
                        nuevasEscalas[index].LimiteSuperior = Number(e.target.value);
                        setConfiguracion({...configuracion, escalasISR: nuevasEscalas});
                      }}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', fontSize: '0.875rem' }}
                    />
                  </td>
                  <td style={{ padding: '0.5rem', border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <input
                        type="number"
                        value={escala.Porcentaje}
                        onChange={(e) => {
                          const nuevasEscalas = [...configuracion.escalasISR];
                          nuevasEscalas[index].Porcentaje = Number(e.target.value);
                          setConfiguracion({...configuracion, escalasISR: nuevasEscalas});
                        }}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', fontSize: '0.875rem' }}
                      />
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>%</span>
                    </div>
                  </td>
                  <td style={{ padding: '0.5rem', border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>$</span>
                      <input
                        type="number"
                        value={escala.MontoFijo}
                        onChange={(e) => {
                          const nuevasEscalas = [...configuracion.escalasISR];
                          nuevasEscalas[index].MontoFijo = Number(e.target.value);
                          setConfiguracion({...configuracion, escalasISR: nuevasEscalas});
                        }}
                        step="0.01"
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', fontSize: '0.875rem' }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* CUOTAS TSS EMPLEADO */}
        <div style={{ background: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
            Cuotas TSS Empleado
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f9fafb' }}>
              <tr>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151', border: '1px solid #e5e7eb' }}>ID</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151', border: '1px solid #e5e7eb' }}>Descripción</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151', border: '1px solid #e5e7eb' }}>Porcentaje</th>
              </tr>
            </thead>
            <tbody>
              {configuracion.deducciones.map((item, index) => (
                <tr key={item.ConfigID}>
                  <td style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #e5e7eb', fontWeight: '500' }}>{index + 1}</td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e5e7eb' }}>{item.Nombre}</td>
                  <td style={{ padding: '0.5rem', border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'center' }}>
                      <input
                        type="number"
                        value={item.Porcentaje}
                        onChange={(e) => {
                          const nuevasDeducciones = [...configuracion.deducciones];
                          nuevasDeducciones[index].Porcentaje = Number(e.target.value);
                          setConfiguracion({...configuracion, deducciones: nuevasDeducciones});
                        }}
                        step="0.01"
                        style={{ width: '80px', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', fontSize: '0.875rem', textAlign: 'center' }}
                      />
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* APORTES PATRONALES */}
        <div style={{ background: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
            Aportes de la Empresa (TSS)
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f9fafb' }}>
              <tr>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151', border: '1px solid #e5e7eb' }}>ID</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151', border: '1px solid #e5e7eb' }}>Descripción</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151', border: '1px solid #e5e7eb' }}>Porcentaje</th>
              </tr>
            </thead>
            <tbody>
              {configuracion.aportesPatronales.map((item, index) => (
                <tr key={item.ConfigID}>
                  <td style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #e5e7eb', fontWeight: '500' }}>{index + 1}</td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e5e7eb' }}>{item.Nombre}</td>
                  <td style={{ padding: '0.5rem', border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'center' }}>
                      <input
                        type="number"
                        value={item.Porcentaje}
                        onChange={(e) => {
                          const nuevosAportes = [...configuracion.aportesPatronales];
                          nuevosAportes[index].Porcentaje = Number(e.target.value);
                          setConfiguracion({...configuracion, aportesPatronales: nuevosAportes});
                        }}
                        step="0.01"
                        style={{ width: '80px', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', fontSize: '0.875rem', textAlign: 'center' }}
                      />
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ALERTA IMPORTANTE */}
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '0.5rem', padding: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'start' }}>
            <AlertCircle style={{ width: '1.25rem', height: '1.25rem', color: '#d97706', flexShrink: 0, marginTop: '0.125rem' }} />
            <div>
              <div style={{ fontWeight: '600', color: '#92400e', marginBottom: '0.5rem' }}>
                ⚠️ Importante
              </div>
              <ul style={{ fontSize: '0.875rem', color: '#78350f', margin: 0, paddingLeft: '1.25rem' }}>
                <li>Los cambios afectarán todos los cálculos de nómina futuros</li>
                <li>Use "Restablecer" para volver a los valores oficiales de DGII</li>
                <li>Verifique los montos fijos del ISR según la tabla oficial</li>
                <li>El total TSS empleado será: AFP (2.87%) + SFS (3.04%) = 5.91%</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Navegación por pestañas
  const tabs = [
    { id: 'empleados', label: '👥 Empleados', component: renderEmpleados },
    { id: 'nomina', label: '💰 Nómina', component: renderNomina },
    { id: 'ajustes', label: '⚙️ Ajustes Nómina', component: renderAjustes }
  ];

  // RETURN PRINCIPAL
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
                <option value="2025-01">Enero 2025</option>
                <option value="2025-02">Febrero 2025</option>
                <option value="2025-03">Marzo 2025</option>
                <option value="2025-04">Abril 2025</option>
                <option value="2025-05">Mayo 2025</option>
                <option value="2025-06">Junio 2025</option>
                <option value="2025-07">Julio 2025</option>
                <option value="2025-08">Agosto 2025</option>
                <option value="2025-09">Septiembre 2025</option>
                <option value="2025-10">Octubre 2025</option>
                <option value="2025-11">Noviembre 2025</option>
                <option value="2025-12">Diciembre 2025</option>

                <option value="2026-01">Enero 2026</option>
                <option value="2026-02">Febrero 2026</option>
                <option value="2026-03">Marzo 2026</option>
                <option value="2026-04">Abril 2026</option>
                <option value="2026-05">Mayo 2026</option>
                <option value="2026-06">Junio 2026</option>
                <option value="2026-07">Julio 2026</option>
                <option value="2026-08">Agosto 2026</option>
                <option value="2026-09">Septiembre 2026</option>
                <option value="2026-10">Octubre 2026</option>
                <option value="2026-11">Noviembre 2026</option>
                <option value="2026-12">Diciembre 2026</option>

                <option value="2027-01">Enero 2027</option>
                <option value="2027-02">Febrero 2027</option>
                <option value="2027-03">Marzo 2027</option>
                <option value="2027-04">Abril 2027</option>
                <option value="2027-05">Mayo 2027</option>
                <option value="2027-06">Junio 2027</option>
                <option value="2027-07">Julio 2027</option>
                <option value="2027-08">Agosto 2027</option>
                <option value="2027-09">Septiembre 2027</option>
                <option value="2027-10">Octubre 2027</option>
                <option value="2027-11">Noviembre 2027</option>
                <option value="2027-12">Diciembre 2027</option>

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
              ✅ Sistema Operativo
            </div>
          </div>
        </div>

        {/* Navegación por pestañas */}
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

        {/* Contenido de la pestaña activa */}
        <div style={{
          background: 'white',
          borderRadius: '0 0 0.75rem 0.75rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb',
          borderTop: 'none',
          padding: '2rem',
          minHeight: '500px'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ fontSize: '1.25rem', color: '#6b7280' }}>⏳ Cargando...</div>
            </div>
          ) : error ? (
            <div style={{ 
              background: '#fef2f2', 
              border: '1px solid #fecaca', 
              borderRadius: '0.5rem', 
              padding: '1rem',
              color: '#dc2626'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle style={{ width: '1.25rem', height: '1.25rem' }} />
                <span style={{ fontWeight: '600' }}>Error:</span>
                <span>{error}</span>
              </div>
            </div>
          ) : (
            tabs.find(tab => tab.id === activeTab)?.component()
          )}
        </div>
      </div>
    </div>
  );
};

export default SistemaNominaCompleto;