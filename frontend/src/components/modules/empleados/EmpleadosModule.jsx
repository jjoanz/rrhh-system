import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Plus, Search, Download, Edit, Trash2, X, Save,
  CheckCircle, Building, Star, FileText
} from 'lucide-react';

const EmpleadosModule = () => {
  const [empleados, setEmpleados] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [puestos, setPuestos] = useState([]);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    departamento: '',
    estado: 'todos'
  });
  const [modalActivo, setModalActivo] = useState(null);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const empleadosPorPagina = 10;

  const API_URL = process.env.REACT_APP_API_URL || 'http://192.168.0.239:5000/api';
  const getToken = () => localStorage.getItem("rrhh_token");

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const token = getToken();
      
      if (!token) {
        alert("No hay sesión activa. Por favor inicia sesión.");
        return;
      }

      // Cargar empleados, departamentos y puestos en paralelo
      const [empleadosRes, departamentosRes, puestosRes] = await Promise.all([
        fetch(`${API_URL}/empleados/list`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${API_URL}/departamentos`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${API_URL}/puestos`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })
      ]);

      if (!empleadosRes.ok) {
        throw new Error(`Error ${empleadosRes.status}: ${await empleadosRes.text()}`);
      }

      const empleadosData = await empleadosRes.json();
      const departamentosData = await departamentosRes.json();
      const puestosData = await puestosRes.json();

      // Procesar empleados
      const empleadosRaw = Array.isArray(empleadosData) ? empleadosData : empleadosData.empleados || [];
      const empleadosMapeados = empleadosRaw.map(emp => ({
        id: emp.EmpleadoID,
        codigo: `EMP${String(emp.EmpleadoID).padStart(3, "0")}`,
        nombre: emp.NOMBRE || emp.Nombre || "",
        apellido: emp.APELLIDO || emp.Apellido || "",
        nombreCompleto: `${emp.NOMBRE || emp.Nombre || ""} ${emp.APELLIDO || emp.Apellido || ""}`.trim(),
        email: emp.Email || "",
        telefono: emp.Telefono || "",
        direccion: emp.Direccion || "",
        cedula: emp.CEDULA || "",
        departamento: emp.DEPARTAMENTO_NOMBRE || "Sin departamento",
        departamentoId: emp.DEPARTAMENTOID || null,
        puesto: emp.CARGO || "Sin puesto",
        puestoId: emp.PUESTOID || null,
        fechaIngreso: emp.FECHAINGRESO ? emp.FECHAINGRESO.split("T")[0] : "",
        fechaIngresoDisplay: emp.FECHAINGRESO 
          ? new Date(emp.FECHAINGRESO).toLocaleDateString("es-DO")
          : "Sin fecha",
        salario: emp.Salario || 0,
        estado: emp.ESTADO === true || emp.ESTADO === 1 ? "activo" : "inactivo",
        foto: "/api/placeholder/80/80"
      }));

      setEmpleados(empleadosMapeados);

      // Procesar departamentos desde BD
      const deptsBD = Array.isArray(departamentosData) ? departamentosData : departamentosData.departamentos || [];
      setDepartamentos(deptsBD.map(d => ({
        id: d.DepartamentoID || d.id,
        nombre: d.Nombre || d.nombre
      })));

      // Procesar puestos desde BD
      const puestosBD = Array.isArray(puestosData) ? puestosData : puestosData.puestos || [];
      setPuestos(puestosBD.map(p => ({
        id: p.PuestoID || p.id,
        nombre: p.NOMBRE || p.Nombre || p.nombre,
        departamentoId: p.DepartamentoID || p.departamentoId
      })));

    } catch (error) {
      console.error("Error cargando datos:", error);
      alert(`Error al cargar datos: ${error.message}`);
    } finally {
      setCargando(false);
    }
  };

  const actualizarEmpleado = async (empleadoEditado) => {
    try {
      setGuardando(true);
      const token = getToken();

      const response = await fetch(`${API_URL}/empleados/update/${empleadoEditado.id}`, {
        method: 'PUT',
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: empleadoEditado.nombre,
          apellido: empleadoEditado.apellido,
          cedula: empleadoEditado.cedula,
          email: empleadoEditado.email,
          telefono: empleadoEditado.telefono,
          direccion: empleadoEditado.direccion,
          cargo: empleadoEditado.puesto,
          salario: parseFloat(empleadoEditado.salario) || 0,
          fechaIngreso: empleadoEditado.fechaIngreso,
          estado: empleadoEditado.estado === 'activo' ? 1 : 0,
          departamentoID: parseInt(empleadoEditado.departamentoId) || null,
          puestoID: parseInt(empleadoEditado.puestoId) || null
        })
      });

      if (!response.ok) {
        throw new Error(`Error al actualizar: ${await response.text()}`);
      }

      alert('Empleado actualizado correctamente');
      await cargarDatos();
      setModalActivo(null);
      setEmpleadoSeleccionado(null);

    } catch (error) {
      console.error("Error actualizando empleado:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setGuardando(false);
    }
  };

  const eliminarEmpleado = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este empleado? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const token = getToken();

      const response = await fetch(`${API_URL}/empleados/delete/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Error al eliminar: ${await response.text()}`);
      }

      alert('Empleado eliminado correctamente');
      await cargarDatos();

    } catch (error) {
      console.error("Error eliminando empleado:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const verExpediente = (empleado) => {
    setEmpleadoSeleccionado(empleado);
    setModalActivo('expediente');
  };

  const empleadosFiltrados = useMemo(() => {
    return empleados.filter(empleado => {
      const terminoBusqueda = filtros.busqueda.toLowerCase().trim();
      const coincideBusqueda = terminoBusqueda === '' || [
        empleado.nombre,
        empleado.apellido,
        empleado.nombreCompleto,
        empleado.email,
        empleado.cedula,
        empleado.codigo
      ].some(campo => campo?.toLowerCase().includes(terminoBusqueda));

      const coincideDepartamento = filtros.departamento === '' || 
        empleado.departamento === filtros.departamento;

      const coincideEstado = filtros.estado === 'todos' || 
        empleado.estado === filtros.estado;

      return coincideBusqueda && coincideDepartamento && coincideEstado;
    });
  }, [empleados, filtros]);

  const estadisticas = useMemo(() => ({
    totalEmpleados: empleados.length,
    empleadosActivos: empleados.filter(e => e.estado === 'activo').length,
    departamentos: new Set(
      empleados.map(e => e.departamento).filter(d => d !== "Sin departamento")
    ).size,
    nuevosEsteMes: empleados.filter(emp => {
      if (!emp.fechaIngreso) return false;
      const [año, mes] = emp.fechaIngreso.split('-').map(Number);
      const hoy = new Date();
      return año === hoy.getFullYear() && mes === hoy.getMonth() + 1;
    }).length
  }), [empleados]);

  const totalPaginas = Math.ceil(empleadosFiltrados.length / empleadosPorPagina);
  const empleadosPaginados = empleadosFiltrados.slice(
    (paginaActual - 1) * empleadosPorPagina,
    paginaActual * empleadosPorPagina
  );

  const FormularioEmpleado = ({ empleado, onGuardar, onCancelar }) => {
    const [formData, setFormData] = useState(() => {
      if (empleado) {
        return {
          id: empleado.id,
          nombre: empleado.nombre,
          apellido: empleado.apellido,
          cedula: empleado.cedula,
          email: empleado.email,
          telefono: empleado.telefono,
          direccion: empleado.direccion,
          departamento: empleado.departamento,
          departamentoId: empleado.departamentoId,
          puesto: empleado.puesto,
          puestoId: empleado.puestoId,
          fechaIngreso: empleado.fechaIngreso,
          salario: empleado.salario,
          estado: empleado.estado
        };
      }
      return {
        nombre: '', apellido: '', cedula: '', email: '', telefono: '',
        direccion: '', departamento: '', departamentoId: null, 
        puesto: '', puestoId: null, fechaIngreso: '',
        salario: '', estado: 'activo'
      };
    });

    // Filtrar puestos según departamento seleccionado
    const puestosFiltrados = formData.departamentoId
      ? puestos.filter(p => p.departamentoId === parseInt(formData.departamentoId))
      : puestos;

    const handleGuardar = () => {
      if (!formData.nombre || !formData.apellido || !formData.email) {
        alert('Completa los campos obligatorios: Nombre, Apellido, Email');
        return;
      }
      onGuardar(formData);
    };

    return (
      <div style={styles.modal} onClick={onCancelar}>
        <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div style={styles.modalHeader}>
            <h3 style={styles.modalTitle}>Editar Empleado</h3>
            <button onClick={onCancelar} style={styles.closeButton}>
              <X size={24} />
            </button>
          </div>
          
          <div style={styles.modalBody}>
            <div style={styles.formGrid}>
              <div>
                <h4 style={styles.sectionTitle}>Información Personal</h4>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nombre *</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Apellido *</label>
                  <input
                    type="text"
                    value={formData.apellido}
                    onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Cédula</label>
                  <input
                    type="text"
                    value={formData.cedula}
                    onChange={(e) => setFormData({...formData, cedula: e.target.value})}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Teléfono</label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Dirección</label>
                  <textarea
                    value={formData.direccion}
                    onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                    style={styles.textarea}
                  />
                </div>
              </div>
              
              <div>
                <h4 style={styles.sectionTitle}>Información Laboral</h4>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Departamento *</label>
                  <select
                    value={formData.departamentoId || ''}
                    onChange={(e) => {
                      const deptId = e.target.value ? parseInt(e.target.value) : null;
                      const dept = departamentos.find(d => d.id === deptId);
                      setFormData({
                        ...formData, 
                        departamentoId: deptId,
                        departamento: dept?.nombre || '',
                        puestoId: null, // Resetear puesto al cambiar departamento
                        puesto: ''
                      });
                    }}
                    style={styles.select}
                  >
                    <option value="">Seleccionar departamento</option>
                    {departamentos.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.nombre}</option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Puesto *</label>
                  <select
                    value={formData.puestoId || ''}
                    onChange={(e) => {
                      const puestoId = e.target.value ? parseInt(e.target.value) : null;
                      const puesto = puestos.find(p => p.id === puestoId);
                      setFormData({
                        ...formData, 
                        puestoId: puestoId,
                        puesto: puesto?.nombre || ''
                      });
                    }}
                    style={styles.select}
                    disabled={!formData.departamentoId}
                  >
                    <option value="">Seleccionar puesto</option>
                    {puestosFiltrados.map(puesto => (
                      <option key={puesto.id} value={puesto.id}>{puesto.nombre}</option>
                    ))}
                  </select>
                  {!formData.departamentoId && (
                    <small style={{color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block'}}>
                      Primero selecciona un departamento
                    </small>
                  )}
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Fecha de Ingreso</label>
                  <input
                    type="date"
                    value={formData.fechaIngreso}
                    onChange={(e) => setFormData({...formData, fechaIngreso: e.target.value})}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Salario (RD$)</label>
                  <input
                    type="number"
                    value={formData.salario}
                    onChange={(e) => setFormData({...formData, salario: e.target.value})}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Estado</label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({...formData, estado: e.target.value})}
                    style={styles.select}
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div style={styles.modalActions}>
              <button onClick={onCancelar} style={{...styles.button, ...styles.buttonSecondary}}>
                Cancelar
              </button>
              <button 
                onClick={handleGuardar} 
                disabled={guardando}
                style={{...styles.button, ...styles.buttonPrimary}}
              >
                <Save size={16} />
                {guardando ? 'Guardando...' : 'Actualizar Empleado'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (cargando) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Cargando empleados...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>{styles.css}</style>

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            <Users size={32} />
            Gestión de Empleados
          </h1>
          <p style={styles.subtitle}>
            {empleados.length} empleados registrados
          </p>
        </div>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statContent}>
            <div>
              <div style={styles.statLabel}>Total Empleados</div>
              <div style={styles.statNumber}>{estadisticas.totalEmpleados}</div>
            </div>
            <div style={{...styles.statIcon, backgroundColor: '#dbeafe'}}>
              <Users size={24} color="#2563eb" />
            </div>
          </div>
        </div>
        
        <div style={styles.statCard}>
          <div style={styles.statContent}>
            <div>
              <div style={styles.statLabel}>Activos</div>
              <div style={{...styles.statNumber, color: '#059669'}}>
                {estadisticas.empleadosActivos}
              </div>
            </div>
            <div style={{...styles.statIcon, backgroundColor: '#d1fae5'}}>
              <CheckCircle size={24} color="#059669" />
            </div>
          </div>
        </div>
        
        <div style={styles.statCard}>
          <div style={styles.statContent}>
            <div>
              <div style={styles.statLabel}>Departamentos</div>
              <div style={{...styles.statNumber, color: '#7c3aed'}}>
                {estadisticas.departamentos}
              </div>
            </div>
            <div style={{...styles.statIcon, backgroundColor: '#e9d5ff'}}>
              <Building size={24} color="#7c3aed" />
            </div>
          </div>
        </div>
        
        <div style={styles.statCard}>
          <div style={styles.statContent}>
            <div>
              <div style={styles.statLabel}>Nuevos Este Mes</div>
              <div style={{...styles.statNumber, color: '#ea580c'}}>
                {estadisticas.nuevosEsteMes}
              </div>
            </div>
            <div style={{...styles.statIcon, backgroundColor: '#fed7aa'}}>
              <Star size={24} color="#ea580c" />
            </div>
          </div>
        </div>
      </div>

      <div style={styles.filtersCard}>
        <div style={styles.filtersContent}>
          <div style={styles.searchContainer}>
            <Search size={16} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Buscar por nombre, email, código..."
              value={filtros.busqueda}
              onChange={(e) => setFiltros({...filtros, busqueda: e.target.value})}
              style={styles.searchInput}
            />
          </div>

          <select
            value={filtros.departamento}
            onChange={(e) => setFiltros({...filtros, departamento: e.target.value})}
            style={styles.select}
          >
            <option value="">Todos los departamentos</option>
            {departamentos.map(dept => (
              <option key={dept.id} value={dept.nombre}>{dept.nombre}</option>
            ))}
          </select>

          <select
            value={filtros.estado}
            onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
            style={styles.select}
          >
            <option value="todos">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
        </div>
      </div>

      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead style={styles.tableHeader}>
            <tr>
              <th style={styles.th}>Empleado</th>
              <th style={styles.th}>Departamento</th>
              <th style={styles.th}>Puesto</th>
              <th style={styles.th}>Estado</th>
              <th style={styles.th}>Fecha Ingreso</th>
              <th style={styles.th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {empleadosPaginados.map((empleado) => (
              <tr key={empleado.id} style={styles.tr}>
                <td style={styles.td}>
                  <div style={styles.employeeInfo}>
                    <img src={empleado.foto} alt="" style={styles.employeePhoto} />
                    <div>
                      <div style={styles.employeeName}>
                        {empleado.nombreCompleto || `${empleado.nombre} ${empleado.apellido}`}
                      </div>
                      <div style={styles.employeeEmail}>{empleado.email}</div>
                    </div>
                  </div>
                </td>
                <td style={styles.td}>{empleado.departamento}</td>
                <td style={styles.td}>{empleado.puesto}</td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.badge,
                    ...(empleado.estado === 'activo' ? styles.badgeActive : styles.badgeInactive)
                  }}>
                    {empleado.estado === 'activo' ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td style={styles.td}>{empleado.fechaIngresoDisplay}</td>
                <td style={styles.td}>
                  <div style={styles.actionButtons}>
                    <button
                      onClick={() => verExpediente(empleado)}
                      style={{...styles.actionButton, color: '#2563eb'}}
                      title="Ver Expediente"
                    >
                      <FileText size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setEmpleadoSeleccionado(empleado);
                        setModalActivo('editar');
                      }}
                      style={{...styles.actionButton, color: '#059669'}}
                      title="Editar"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => eliminarEmpleado(empleado.id)}
                      style={{...styles.actionButton, color: '#dc2626'}}
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPaginas > 1 && (
          <div style={styles.pagination}>
            <div style={styles.paginationInfo}>
              Mostrando {((paginaActual - 1) * empleadosPorPagina) + 1} a {Math.min(paginaActual * empleadosPorPagina, empleadosFiltrados.length)} de {empleadosFiltrados.length}
            </div>
            <div style={styles.paginationButtons}>
              <button
                onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                disabled={paginaActual === 1}
                style={styles.paginationButton}
              >
                Anterior
              </button>
              {Array.from({length: totalPaginas}, (_, i) => i + 1).map(num => (
                <button
                  key={num}
                  onClick={() => setPaginaActual(num)}
                  style={{
                    ...styles.paginationButton,
                    ...(paginaActual === num ? styles.paginationButtonActive : {})
                  }}
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                disabled={paginaActual === totalPaginas}
                style={styles.paginationButton}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {modalActivo === 'editar' && empleadoSeleccionado && (
        <FormularioEmpleado
          empleado={empleadoSeleccionado}
          onGuardar={actualizarEmpleado}
          onCancelar={() => {
            setModalActivo(null);
            setEmpleadoSeleccionado(null);
          }}
        />
      )}

      {modalActivo === 'expediente' && empleadoSeleccionado && (
        <div style={styles.modal} onClick={() => {
          setModalActivo(null);
          setEmpleadoSeleccionado(null);
        }}>
          <div style={{...styles.modalContent, maxWidth: '1200px'}} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={{...styles.modalTitle, display: 'flex', alignItems: 'center'}}>
                <FileText size={24} style={{marginRight: '8px'}} />
                Expediente Digital - {empleadoSeleccionado.nombreCompleto || `${empleadoSeleccionado.nombre} ${empleadoSeleccionado.apellido}`}
              </h2>
              <button
                onClick={() => {
                  setModalActivo(null);
                  setEmpleadoSeleccionado(null);
                }}
                style={styles.closeButton}
              >
                <X size={24} />
              </button>
            </div>
            <div style={styles.modalBody}>
              <p style={{textAlign: 'center', padding: '40px', color: '#6b7280'}}>
                El módulo de expedientes digitales se cargará aquí...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { padding: '24px', backgroundColor: '#f9fafb', minHeight: '100vh' },
  header: { marginBottom: '32px' },
  title: { fontSize: '28px', fontWeight: 'bold', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '12px' },
  subtitle: { color: '#6b7280', marginTop: '8px', fontSize: '14px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' },
  statCard: { backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' },
  statContent: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  statNumber: { fontSize: '28px', fontWeight: 'bold', color: '#1f2937' },
  statLabel: { fontSize: '14px', color: '#6b7280', fontWeight: '500', marginBottom: '8px' },
  statIcon: { padding: '12px', borderRadius: '12px', display: 'flex' },
  filtersCard: { backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', padding: '20px', marginBottom: '24px' },
  filtersContent: { display: 'flex', gap: '16px', flexWrap: 'wrap' },
  searchContainer: { position: 'relative', flex: '1', minWidth: '250px' },
  searchInput: { width: '100%', padding: '10px 10px 10px 40px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' },
  searchIcon: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' },
  select: { padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', minWidth: '200px', backgroundColor: 'white' },
  tableCard: { backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeader: { backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' },
  th: { padding: '14px 16px', textAlign: 'left', fontWeight: '600', color: '#1f2937', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tr: { borderBottom: '1px solid #e5e7eb', transition: 'background-color 0.2s' },
  td: { padding: '16px', fontSize: '14px', color: '#1f2937' },
  employeeInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
  employeePhoto: { width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' },
  employeeName: { fontWeight: '600', color: '#1f2937', marginBottom: '2px' },
  employeeEmail: { fontSize: '13px', color: '#6b7280' },
  badge: { padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', display: 'inline-block' },
  badgeActive: { backgroundColor: '#dcfce7', color: '#166534' },
  badgeInactive: { backgroundColor: '#fee2e2', color: '#991b1b' },
  actionButtons: { display: 'flex', gap: '8px' },
  actionButton: { padding: '8px', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: '#f3f4f6', transition: 'all 0.2s' },
  pagination: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid #e5e7eb', backgroundColor: '#fafafa' },
  paginationInfo: { fontSize: '14px', color: '#6b7280' },
  paginationButtons: { display: 'flex', gap: '8px' },
  paginationButton: { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: '500', transition: 'all 0.2s' },
  paginationButtonActive: { backgroundColor: '#2563eb', color: 'white', borderColor: '#2563eb' },
  modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' },
  modalContent: { backgroundColor: 'white', borderRadius: '12px', maxWidth: '900px', width: '100%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' },
  modalHeader: { padding: '24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 10 },
  modalTitle: { fontSize: '20px', fontWeight: 'bold', color: '#1f2937' },
  closeButton: { padding: '8px', border: 'none', background: 'none', cursor: 'pointer', color: '#6b7280', borderRadius: '6px', transition: 'background-color 0.2s' },
  modalBody: { padding: '24px' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' },
  sectionTitle: { fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #e5e7eb' },
  formGroup: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', transition: 'border-color 0.2s, box-shadow 0.2s' },
  textarea: { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', resize: 'vertical', minHeight: '100px', transition: 'border-color 0.2s, box-shadow 0.2s' },
  button: { padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s' },
  buttonPrimary: { backgroundColor: '#2563eb', color: 'white' },
  buttonSecondary: { backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e5e7eb' },
  loadingContainer: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '400px', gap: '16px' },
  spinner: { width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  css: `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    tr:hover { background-color: #f9fafb; }
    button:hover { opacity: 0.9; transform: translateY(-1px); }
    button:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    input:focus, select:focus, textarea:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
    select:disabled {
      background-color: #f3f4f6;
      cursor: not-allowed;
      opacity: 0.6;
    }
    .actionButton:hover { background-color: #e5e7eb !important; }
    .closeButton:hover { background-color: #f3f4f6 !important; }
  `
};

export default EmpleadosModule;