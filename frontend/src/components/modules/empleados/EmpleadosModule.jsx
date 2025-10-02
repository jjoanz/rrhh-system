import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Plus, Search, Download, Edit, Trash2, X, Save,
  CheckCircle, Building, Star
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

  // Cargar datos iniciales
  useEffect(() => {
    cargarEmpleados();
  }, []);

  const cargarEmpleados = async () => {
    try {
      setCargando(true);
      const token = getToken();
      
      if (!token) {
        alert("No hay sesión activa. Por favor inicia sesión.");
        return;
      }

      const response = await fetch(`${API_URL}/empleados/list`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      const empleadosRaw = Array.isArray(data) ? data : data.empleados || [];

      const empleadosMapeados = empleadosRaw.map(emp => ({
        id: emp.EmpleadoID,
        codigo: `EMP${String(emp.EmpleadoID).padStart(3, "0")}`,
        nombre: emp.NOMBRE || "",
        apellido: emp.APELLIDO || "",
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

      // Extraer departamentos y puestos únicos
      const depts = [...new Set(empleadosMapeados
        .map(emp => emp.departamento)
        .filter(dept => dept && dept !== "Sin departamento")
      )].map((nombre, index) => ({ id: index + 1, nombre }));

      const psts = [...new Set(empleadosMapeados
        .map(emp => emp.puesto)
        .filter(puesto => puesto && puesto !== "Sin puesto")
      )].map((nombre, index) => ({ id: index + 1, nombre }));

      setDepartamentos(depts);
      setPuestos(psts);

    } catch (error) {
      console.error("Error cargando empleados:", error);
      alert(`Error al cargar empleados: ${error.message}`);
    } finally {
      setCargando(false);
    }
  };

  // Actualizar empleado
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
          departamentoID: parseInt(empleadoEditado.departamentoId) || null
        })
      });

      if (!response.ok) {
        throw new Error(`Error al actualizar: ${await response.text()}`);
      }

      alert('Empleado actualizado correctamente');
      await cargarEmpleados();
      setModalActivo(null);
      setEmpleadoSeleccionado(null);

    } catch (error) {
      console.error("Error actualizando empleado:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setGuardando(false);
    }
  };

  // Eliminar empleado
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
      await cargarEmpleados();

    } catch (error) {
      console.error("Error eliminando empleado:", error);
      alert(`Error: ${error.message}`);
    }
  };

  // Filtrado
  const empleadosFiltrados = useMemo(() => {
    return empleados.filter(empleado => {
      const terminoBusqueda = filtros.busqueda.toLowerCase().trim();
      const coincideBusqueda = terminoBusqueda === '' || [
        empleado.nombre, empleado.apellido, empleado.email,
        empleado.codigo, empleado.cedula, empleado.puesto, empleado.departamento
      ].some(campo => (campo || '').toLowerCase().includes(terminoBusqueda));
      
      const coincideDepartamento = filtros.departamento === '' || 
        empleado.departamento === filtros.departamento;
      
      const coincideEstado = filtros.estado === 'todos' || 
        empleado.estado === filtros.estado;
      
      return coincideBusqueda && coincideDepartamento && coincideEstado;
    });
  }, [empleados, filtros]);

  // Estadísticas
  const estadisticas = useMemo(() => ({
    totalEmpleados: empleados.length,
    empleadosActivos: empleados.filter(emp => emp.estado === 'activo').length,
    departamentos: new Set(empleados
      .map(emp => emp.departamento)
      .filter(dept => dept && dept !== 'Sin departamento')
    ).size,
    nuevosEsteMes: empleados.filter(emp => {
      if (!emp.fechaIngreso) return false;
      const [año, mes] = emp.fechaIngreso.split('-').map(Number);
      const hoy = new Date();
      return año === hoy.getFullYear() && mes === hoy.getMonth() + 1;
    }).length
  }), [empleados]);

  // Paginación
  const totalPaginas = Math.ceil(empleadosFiltrados.length / empleadosPorPagina);
  const empleadosPaginados = empleadosFiltrados.slice(
    (paginaActual - 1) * empleadosPorPagina,
    paginaActual * empleadosPorPagina
  );

  // Formulario de empleado
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
        direccion: '', departamento: '', puesto: '', fechaIngreso: '',
        salario: '', estado: 'activo'
      };
    });

    const handleGuardar = () => {
      if (!formData.nombre || !formData.apellido || !formData.email) {
        alert('Completa los campos obligatorios: Nombre, Apellido, Email');
        return;
      }
      onGuardar(formData);
    };

    return (
      <div style={styles.modal}>
        <div style={styles.modalContent}>
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
                  <label style={styles.label}>Puesto</label>
                  <input
                    type="text"
                    value={formData.puesto}
                    onChange={(e) => setFormData({...formData, puesto: e.target.value})}
                    style={styles.input}
                    placeholder="Ej: Desarrollador, Gerente"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Departamento</label>
                  <select
                    value={formData.departamento}
                    onChange={(e) => {
                      const deptSeleccionado = departamentos.find(d => d.nombre === e.target.value);
                      setFormData({
                        ...formData, 
                        departamento: e.target.value,
                        departamentoId: deptSeleccionado?.id || null
                      });
                    }}
                    style={styles.select}
                  >
                    <option value="">Seleccionar</option>
                    {departamentos.map(dept => (
                      <option key={dept.id} value={dept.nombre}>{dept.nombre}</option>
                    ))}
                  </select>
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

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            <Users size={32} color="#2563eb" />
            Gestión de Empleados
          </h1>
          <p style={styles.subtitle}>
            {empleados.length} empleados registrados
          </p>
        </div>
      </div>

      {/* Estadísticas */}
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

      {/* Filtros */}
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

      {/* Tabla */}
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
                        {empleado.nombre} {empleado.apellido}
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

        {/* Paginación */}
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

      {/* Modal */}
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
    </div>
  );
};

// Estilos (continúa en siguiente mensaje por límite de longitud)
const styles = {
  container: { padding: '24px' },
  header: { marginBottom: '32px' },
  title: { fontSize: '24px', fontWeight: 'bold', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '12px' },
  subtitle: { color: '#6b7280', marginTop: '4px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '32px' },
  statCard: { backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' },
  statContent: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  statNumber: { fontSize: '24px', fontWeight: 'bold', color: '#1f2937' },
  statLabel: { fontSize: '14px', color: '#6b7280', fontWeight: '500', marginBottom: '4px' },
  statIcon: { padding: '12px', borderRadius: '12px', display: 'flex' },
  filtersCard: { backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', padding: '20px', marginBottom: '24px' },
  filtersContent: { display: 'flex', gap: '16px', flexWrap: 'wrap' },
  searchContainer: { position: 'relative', flex: '1', minWidth: '250px' },
  searchInput: { width: '100%', padding: '8px 8px 8px 40px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' },
  searchIcon: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' },
  select: { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', minWidth: '200px' },
  tableCard: { backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeader: { backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' },
  th: { padding: '12px 16px', textAlign: 'left', fontWeight: '500', color: '#1f2937', fontSize: '14px' },
  tr: { borderBottom: '1px solid #e5e7eb' },
  td: { padding: '16px', fontSize: '14px', color: '#1f2937' },
  employeeInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
  employeePhoto: { width: '40px', height: '40px', borderRadius: '50%' },
  employeeName: { fontWeight: '500', color: '#1f2937' },
  employeeEmail: { fontSize: '12px', color: '#6b7280' },
  badge: { padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' },
  badgeActive: { backgroundColor: '#dcfce7', color: '#166534' },
  badgeInactive: { backgroundColor: '#fee2e2', color: '#991b1b' },
  actionButtons: { display: 'flex', gap: '8px' },
  actionButton: { padding: '6px', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: '#f3f4f6' },
  pagination: { display: 'flex', justifyContent: 'space-between', padding: '16px 24px', borderTop: '1px solid #e5e7eb' },
  paginationInfo: { fontSize: '14px', color: '#6b7280' },
  paginationButtons: { display: 'flex', gap: '8px' },
  paginationButton: { padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer' },
  paginationButtonActive: { backgroundColor: '#2563eb', color: 'white', borderColor: '#2563eb' },
  modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' },
  modalContent: { backgroundColor: 'white', borderRadius: '12px', maxWidth: '900px', width: '100%', maxHeight: '90vh', overflow: 'auto' },
  modalHeader: { padding: '24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: '20px', fontWeight: 'bold', color: '#1f2937' },
  closeButton: { padding: '4px', border: 'none', background: 'none', cursor: 'pointer', color: '#6b7280' },
  modalBody: { padding: '24px' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' },
  sectionTitle: { fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #e5e7eb' },
  formGroup: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' },
  input: { width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' },
  textarea: { width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', resize: 'vertical', minHeight: '80px' },
  button: { padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500' },
  buttonPrimary: { backgroundColor: '#2563eb', color: 'white' },
  buttonSecondary: { backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e5e7eb' },
  loadingContainer: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '400px', gap: '16px' },
  spinner: { width: '32px', height: '32px', border: '3px solid #f3f3f3', borderTop: '3px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  css: `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    tr:hover { background-color: #f9fafb; }
    button:hover { opacity: 0.9; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    input:focus, select:focus, textarea:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
  `
};

export default EmpleadosModule;