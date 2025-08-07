import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Eye, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Building, 
  User, 
  FileText, 
  MoreVertical,
  X,
  Save,
  Camera,
  Star,
  Shield,
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const EmpleadosModule = () => {
  // Estados principales
  const [empleados, setEmpleados] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [puestos, setPuestos] = useState([]);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    departamento: '',
    puesto: '',
    estado: 'todos'
  });
  const [modalActivo, setModalActivo] = useState(null);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);
  const [vistaActual, setVistaActual] = useState('lista');
  const [paginaActual, setPaginaActual] = useState(1);
  const [cargando, setCargando] = useState(true);
  const empleadosPorPagina = 10;

  // Datos de empleados basados en usuarios reales del sistema
  const empleadosMock = [
    {
      id: 1,
      codigo: 'EMP001',
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'colaborador@empresa.com',
      telefono: '+1 (809) 555-0101',
      direccion: 'Av. 27 de Febrero #123, Santo Domingo',
      departamento: 'Tecnología',
      puesto: 'Desarrollador Frontend',
      supervisor: 'María González',
      fechaIngreso: '2023-02-15',
      salario: 55000,
      estado: 'activo',
      foto: '/api/placeholder/80/80',
      documentos: ['Cédula', 'Diploma', 'Certificaciones'],
      experiencia: '3 años',
      nivel: 'Mid-Level',
      rendimiento: 88,
      proyectosActivos: 2,
      rol: 'colaborador'
    },
    {
      id: 2,
      codigo: 'EMP002',
      nombre: 'María',
      apellido: 'González',
      email: 'gerente@empresa.com',
      telefono: '+1 (809) 555-0102',
      direccion: 'Calle Mercedes #456, Santiago',
      departamento: 'Tecnología',
      puesto: 'Gerente de Tecnología',
      supervisor: 'Carlos Rodríguez',
      fechaIngreso: '2021-08-10',
      salario: 95000,
      estado: 'activo',
      foto: '/api/placeholder/80/80',
      documentos: ['Cédula', 'Diploma', 'MBA', 'Certificaciones'],
      experiencia: '8 años',
      nivel: 'Senior',
      rendimiento: 94,
      proyectosActivos: 5,
      rol: 'gerente'
    },
    {
      id: 3,
      codigo: 'EMP003',
      nombre: 'Carlos',
      apellido: 'Rodríguez',
      email: 'director@empresa.com',
      telefono: '+1 (809) 555-0103',
      direccion: 'Av. Lincoln #789, Santo Domingo',
      departamento: 'Operaciones',
      puesto: 'Director de Operaciones',
      supervisor: null,
      fechaIngreso: '2019-01-20',
      salario: 150000,
      estado: 'activo',
      foto: '/api/placeholder/80/80',
      documentos: ['Cédula', 'Diploma', 'MBA', 'Certificaciones Ejecutivas'],
      experiencia: '12 años',
      nivel: 'Executive',
      rendimiento: 96,
      proyectosActivos: 8,
      rol: 'director'
    },
    {
      id: 4,
      codigo: 'EMP004',
      nombre: 'Ana',
      apellido: 'López',
      email: 'rrhh@empresa.com',
      telefono: '+1 (809) 555-0104',
      direccion: 'Calle El Conde #321, Santo Domingo',
      departamento: 'Recursos Humanos',
      puesto: 'Especialista en RRHH',
      supervisor: 'Luis Martínez',
      fechaIngreso: '2022-05-15',
      salario: 65000,
      estado: 'activo',
      foto: '/api/placeholder/80/80',
      documentos: ['Cédula', 'Diploma', 'Certificaciones RRHH'],
      experiencia: '5 años',
      nivel: 'Mid-Level',
      rendimiento: 91,
      proyectosActivos: 3,
      rol: 'rrhh'
    },
    {
      id: 5,
      codigo: 'EMP005',
      nombre: 'Luis',
      apellido: 'Martínez',
      email: 'director.rrhh@empresa.com',
      telefono: '+1 (809) 555-0105',
      direccion: 'Av. Independencia #654, Santo Domingo',
      departamento: 'Recursos Humanos',
      puesto: 'Director de RRHH',
      supervisor: 'Carlos Rodríguez',
      fechaIngreso: '2020-03-08',
      salario: 120000,
      estado: 'activo',
      foto: '/api/placeholder/80/80',
      documentos: ['Cédula', 'Diploma', 'MBA', 'Certificaciones SHRM'],
      experiencia: '10 años',
      nivel: 'Senior',
      rendimiento: 93,
      proyectosActivos: 4,
      rol: 'director_rrhh'
    },
    {
      id: 6,
      codigo: 'EMP006',
      nombre: 'Patricia',
      apellido: 'Morales',
      email: 'gerente.rrhh@empresa.com',
      telefono: '+1 (809) 555-0106',
      direccion: 'Av. John F. Kennedy #987, Santo Domingo',
      departamento: 'Recursos Humanos',
      puesto: 'Gerente de RRHH',
      supervisor: 'Luis Martínez',
      fechaIngreso: '2021-11-12',
      salario: 85000,
      estado: 'vacaciones',
      foto: '/api/placeholder/80/80',
      documentos: ['Cédula', 'Diploma', 'Certificaciones RRHH'],
      experiencia: '7 años',
      nivel: 'Senior',
      rendimiento: 89,
      proyectosActivos: 3,
      rol: 'gerente_rrhh'
    },
    {
      id: 7,
      codigo: 'EMP007',
      nombre: 'Sistema',
      apellido: 'Admin',
      email: 'admin@empresa.com',
      telefono: '+1 (809) 555-0107',
      direccion: 'Oficina Central - IT',
      departamento: 'Tecnología',
      puesto: 'Administrador del Sistema',
      supervisor: null,
      fechaIngreso: '2019-01-01',
      salario: 0,
      estado: 'activo',
      foto: '/api/placeholder/80/80',
      documentos: ['Acceso Total del Sistema'],
      experiencia: 'Sistema',
      nivel: 'System',
      rendimiento: 100,
      proyectosActivos: 999,
      rol: 'admin'
    }
  ];

  const departamentosMock = [
    { id: 1, nombre: 'Recursos Humanos', empleados: 3, jefe: 'Luis Martínez' },
    { id: 2, nombre: 'Tecnología', empleados: 2, jefe: 'María González' },
    { id: 3, nombre: 'Operaciones', empleados: 1, jefe: 'Carlos Rodríguez' },
    { id: 4, nombre: 'Administración', empleados: 1, jefe: 'Sistema Admin' }
  ];

  const puestosMock = [
    'Desarrollador Frontend', 'Gerente de Tecnología', 'Director de Operaciones', 
    'Especialista en RRHH', 'Director de RRHH', 'Gerente de RRHH',
    'Administrador del Sistema', 'Analista de Sistemas', 'Desarrollador Backend',
    'Especialista en Seguridad', 'Coordinador de Operaciones'
  ];

  // Inicialización
  useEffect(() => {
    setCargando(true);
    setTimeout(() => {
      setEmpleados(empleadosMock);
      setDepartamentos(departamentosMock);
      setPuestos(puestosMock);
      setCargando(false);
    }, 1000);
  }, []);

  // Filtrado y búsqueda
  const empleadosFiltrados = useMemo(() => {
    return empleados.filter(empleado => {
      const coincideBusqueda = 
        empleado.nombre.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
        empleado.apellido.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
        empleado.email.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
        empleado.codigo.toLowerCase().includes(filtros.busqueda.toLowerCase());
      
      const coincideDepartamento = 
        filtros.departamento === '' || empleado.departamento === filtros.departamento;
      
      const coincidePuesto = 
        filtros.puesto === '' || empleado.puesto === filtros.puesto;
      
      const coincideEstado = 
        filtros.estado === 'todos' || empleado.estado === filtros.estado;
      
      return coincideBusqueda && coincideDepartamento && coincidePuesto && coincideEstado;
    });
  }, [empleados, filtros]);

  // Paginación
  const totalPaginas = Math.ceil(empleadosFiltrados.length / empleadosPorPagina);
  const empleadosPaginados = empleadosFiltrados.slice(
    (paginaActual - 1) * empleadosPorPagina,
    paginaActual * empleadosPorPagina
  );

  // Funciones de empleados
  const agregarEmpleado = (nuevoEmpleado) => {
    const empleadoConId = {
      ...nuevoEmpleado,
      id: empleados.length + 1,
      codigo: `EMP${String(empleados.length + 1).padStart(3, '0')}`,
      foto: '/api/placeholder/80/80'
    };
    setEmpleados([...empleados, empleadoConId]);
    setModalActivo(null);
  };

  const editarEmpleado = (empleadoEditado) => {
    setEmpleados(empleados.map(emp => 
      emp.id === empleadoEditado.id ? empleadoEditado : emp
    ));
    setModalActivo(null);
  };

  const eliminarEmpleado = (id) => {
    setEmpleados(empleados.filter(emp => emp.id !== id));
    setModalActivo(null);
  };

  // Estilos en línea
  const styles = {
    container: {
      padding: '24px'
    },
    header: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      marginBottom: '32px'
    },
    headerContent: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '16px'
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#1f2937',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    subtitle: {
      color: '#6b7280',
      marginTop: '4px'
    },
    button: {
      padding: '8px 16px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s'
    },
    buttonPrimary: {
      backgroundColor: '#2563eb',
      color: 'white'
    },
    buttonSecondary: {
      backgroundColor: '#f3f4f6',
      color: '#374151',
      border: '1px solid #d1d5db'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '24px',
      marginBottom: '32px'
    },
    statCard: {
      backgroundColor: 'white',
      padding: '24px',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb'
    },
    statCardContent: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    statNumber: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#1f2937'
    },
    statLabel: {
      fontSize: '14px',
      color: '#6b7280',
      fontWeight: '500'
    },
    statIcon: {
      padding: '12px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    filtersCard: {
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb',
      padding: '24px',
      marginBottom: '24px'
    },
    filtersContent: {
      display: 'flex',
      gap: '16px',
      flexWrap: 'wrap',
      alignItems: 'center'
    },
    searchContainer: {
      position: 'relative',
      flex: '1',
      minWidth: '300px'
    },
    searchInput: {
      width: '100%',
      padding: '8px 8px 8px 40px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      outline: 'none'
    },
    searchIcon: {
      position: 'absolute',
      left: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#9ca3af'
    },
    select: {
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      backgroundColor: 'white',
      fontSize: '14px',
      outline: 'none'
    },
    tableCard: {
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb',
      overflow: 'hidden'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    tableHeader: {
      backgroundColor: '#f9fafb',
      borderBottom: '1px solid #e5e7eb'
    },
    tableHeaderCell: {
      padding: '12px 16px',
      textAlign: 'left',
      fontWeight: '500',
      color: '#1f2937',
      fontSize: '14px'
    },
    tableRow: {
      borderBottom: '1px solid #e5e7eb',
      transition: 'background-color 0.2s'
    },
    tableCell: {
      padding: '16px',
      fontSize: '14px',
      color: '#1f2937'
    },
    employeeInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    employeePhoto: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      objectFit: 'cover'
    },
    employeeName: {
      fontWeight: '500',
      color: '#1f2937'
    },
    employeeEmail: {
      fontSize: '12px',
      color: '#6b7280'
    },
    statusBadge: {
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '500'
    },
    statusActive: {
      backgroundColor: '#dcfce7',
      color: '#166534'
    },
    statusVacations: {
      backgroundColor: '#fef3c7',
      color: '#92400e'
    },
    statusInactive: {
      backgroundColor: '#fee2e2',
      color: '#991b1b'
    },
    actionButtons: {
      display: 'flex',
      gap: '8px'
    },
    actionButton: {
      padding: '4px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s'
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '16px'
    },
    modalContent: {
      backgroundColor: 'white',
      borderRadius: '12px',
      maxWidth: '800px',
      width: '100%',
      maxHeight: '90vh',
      overflow: 'auto'
    },
    modalHeader: {
      padding: '24px',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    modalTitle: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#1f2937'
    },
    modalBody: {
      padding: '24px'
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '24px'
    },
    formSection: {
      marginBottom: '24px'
    },
    formSectionTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '16px',
      paddingBottom: '8px',
      borderBottom: '1px solid #e5e7eb'
    },
    formGroup: {
      marginBottom: '16px'
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
      marginBottom: '4px'
    },
    input: {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      outline: 'none'
    },
    textarea: {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      outline: 'none',
      resize: 'vertical',
      minHeight: '80px'
    },
    modalActions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '12px',
      marginTop: '32px',
      paddingTop: '24px',
      borderTop: '1px solid #e5e7eb'
    },
    pagination: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 24px',
      borderTop: '1px solid #e5e7eb'
    },
    paginationInfo: {
      fontSize: '14px',
      color: '#6b7280'
    },
    paginationButtons: {
      display: 'flex',
      gap: '8px'
    },
    paginationButton: {
      padding: '6px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      backgroundColor: 'white',
      cursor: 'pointer',
      fontSize: '14px'
    },
    paginationButtonActive: {
      backgroundColor: '#2563eb',
      color: 'white',
      borderColor: '#2563eb'
    }
  };

  // Componente de formulario de empleado
  const FormularioEmpleado = ({ empleado, onGuardar, onCancelar }) => {
    const [formData, setFormData] = useState(empleado || {
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      direccion: '',
      departamento: '',
      puesto: '',
      supervisor: '',
      fechaIngreso: '',
      salario: '',
      estado: 'activo'
    });

    const handleGuardar = () => {
      if (!formData.nombre || !formData.apellido || !formData.email || !formData.departamento || !formData.puesto || !formData.fechaIngreso) {
        alert('Por favor completa todos los campos obligatorios (*)');
        return;
      }
      onGuardar(formData);
    };

    return (
      <div style={styles.modal}>
        <div style={styles.modalContent}>
          <div style={styles.modalHeader}>
            <h3 style={styles.modalTitle}>
              {empleado ? 'Editar Empleado' : 'Nuevo Empleado'}
            </h3>
            <button 
              onClick={onCancelar}
              style={{ ...styles.actionButton, color: '#6b7280' }}
            >
              <X size={24} />
            </button>
          </div>
          
          <div style={styles.modalBody}>
            <div style={styles.formGrid}>
              <div>
                <h4 style={styles.formSectionTitle}>Información Personal</h4>
                
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
                <h4 style={styles.formSectionTitle}>Información Laboral</h4>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Departamento *</label>
                  <select
                    value={formData.departamento}
                    onChange={(e) => setFormData({...formData, departamento: e.target.value})}
                    style={styles.select}
                  >
                    <option value="">Seleccionar departamento</option>
                    {departamentos.map(dept => (
                      <option key={dept.id} value={dept.nombre}>{dept.nombre}</option>
                    ))}
                  </select>
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Puesto *</label>
                  <select
                    value={formData.puesto}
                    onChange={(e) => setFormData({...formData, puesto: e.target.value})}
                    style={styles.select}
                  >
                    <option value="">Seleccionar puesto</option>
                    {puestos.map(puesto => (
                      <option key={puesto} value={puesto}>{puesto}</option>
                    ))}
                  </select>
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Supervisor</label>
                  <select
                    value={formData.supervisor}
                    onChange={(e) => setFormData({...formData, supervisor: e.target.value})}
                    style={styles.select}
                  >
                    <option value="">Sin supervisor</option>
                    {empleados.map(emp => (
                      <option key={emp.id} value={`${emp.nombre} ${emp.apellido}`}>
                        {emp.nombre} {emp.apellido}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Fecha de Ingreso *</label>
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
                    <option value="vacaciones">En Vacaciones</option>
                    <option value="licencia">En Licencia</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div style={styles.modalActions}>
              <button
                onClick={onCancelar}
                style={{ ...styles.button, ...styles.buttonSecondary }}
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                style={{ ...styles.button, ...styles.buttonPrimary }}
              >
                <Save size={16} />
                {empleado ? 'Actualizar' : 'Crear'} Empleado
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (cargando) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ 
          width: '32px', 
          height: '32px', 
          border: '3px solid #f3f3f3', 
          borderTop: '3px solid #2563eb', 
          borderRadius: '50%', 
          animation: 'spin 1s linear infinite' 
        }}></div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .table-row:hover {
            background-color: #f9fafb;
          }
          
          .action-button:hover {
            background-color: #f3f4f6;
          }
          
          .button-primary:hover {
            background-color: #1d4ed8;
          }
          
          .button-secondary:hover {
            background-color: #e5e7eb;
          }
          
          .search-input:focus {
            border-color: #2563eb;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
          }
          
          .select:focus, .input:focus, .textarea:focus {
            border-color: #2563eb;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
          }
        `}
      </style>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <h1 style={styles.title}>
              <Users size={32} color="#2563eb" />
              Gestión de Empleados
            </h1>
            <p style={styles.subtitle}>
              Administra la información completa de tu personal
            </p>
          </div>
          
          <button 
            onClick={() => setModalActivo('agregar')}
            style={{ ...styles.button, ...styles.buttonPrimary }}
            className="button-primary"
          >
            <Plus size={16} />
            Nuevo Empleado
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statCardContent}>
            <div>
              <div style={{ ...styles.statLabel, marginBottom: '4px' }}>Total Empleados</div>
              <div style={styles.statNumber}>{empleados.length}</div>
            </div>
            <div style={{ ...styles.statIcon, backgroundColor: '#dbeafe' }}>
              <Users size={24} color="#2563eb" />
            </div>
          </div>
        </div>
        
        <div style={styles.statCard}>
          <div style={styles.statCardContent}>
            <div>
              <div style={{ ...styles.statLabel, marginBottom: '4px' }}>Empleados Activos</div>
              <div style={{ ...styles.statNumber, color: '#059669' }}>
                {empleados.filter(emp => emp.estado === 'activo').length}
              </div>
            </div>
            <div style={{ ...styles.statIcon, backgroundColor: '#d1fae5' }}>
              <CheckCircle size={24} color="#059669" />
            </div>
          </div>
        </div>
        
        <div style={styles.statCard}>
          <div style={styles.statCardContent}>
            <div>
              <div style={{ ...styles.statLabel, marginBottom: '4px' }}>Departamentos</div>
              <div style={{ ...styles.statNumber, color: '#7c3aed' }}>{departamentos.length}</div>
            </div>
            <div style={{ ...styles.statIcon, backgroundColor: '#e9d5ff' }}>
              <Building size={24} color="#7c3aed" />
            </div>
          </div>
        </div>
        
        <div style={styles.statCard}>
          <div style={styles.statCardContent}>
            <div>
              <div style={{ ...styles.statLabel, marginBottom: '4px' }}>Nuevos Este Mes</div>
              <div style={{ ...styles.statNumber, color: '#ea580c' }}>1</div>
            </div>
            <div style={{ ...styles.statIcon, backgroundColor: '#fed7aa' }}>
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
              placeholder="Buscar por nombre, email o código..."
              value={filtros.busqueda}
              onChange={(e) => setFiltros({...filtros, busqueda: e.target.value})}
              style={styles.searchInput}
              className="search-input"
            />
          </div>
          
          <select
            value={filtros.departamento}
            onChange={(e) => setFiltros({...filtros, departamento: e.target.value})}
            style={styles.select}
            className="select"
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
            className="select"
          >
            <option value="todos">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
            <option value="vacaciones">En Vacaciones</option>
            <option value="licencia">En Licencia</option>
          </select>
          
          <button style={{ ...styles.button, ...styles.buttonSecondary }} className="button-secondary">
            <Download size={16} />
            Exportar
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead style={styles.tableHeader}>
            <tr>
              <th style={styles.tableHeaderCell}>Empleado</th>
              <th style={styles.tableHeaderCell}>Departamento</th>
              <th style={styles.tableHeaderCell}>Puesto</th>
              <th style={styles.tableHeaderCell}>Estado</th>
              <th style={styles.tableHeaderCell}>Fecha Ingreso</th>
              <th style={styles.tableHeaderCell}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {empleadosPaginados.map((empleado) => (
              <tr key={empleado.id} style={styles.tableRow} className="table-row">
                <td style={styles.tableCell}>
                  <div style={styles.employeeInfo}>
                    <img 
                      src={empleado.foto} 
                      alt={`${empleado.nombre} ${empleado.apellido}`}
                      style={styles.employeePhoto}
                    />
                    <div>
                      <div style={styles.employeeName}>
                        {empleado.nombre} {empleado.apellido}
                      </div>
                      <div style={styles.employeeEmail}>{empleado.email}</div>
                    </div>
                  </div>
                </td>
                <td style={styles.tableCell}>{empleado.departamento}</td>
                <td style={styles.tableCell}>{empleado.puesto}</td>
                <td style={styles.tableCell}>
                  <span style={{
                    ...styles.statusBadge,
                    ...(empleado.estado === 'activo' ? styles.statusActive :
                        empleado.estado === 'vacaciones' ? styles.statusVacations :
                        styles.statusInactive)
                  }}>
                    {empleado.estado === 'activo' ? 'Activo' :
                     empleado.estado === 'vacaciones' ? 'Vacaciones' :
                     empleado.estado === 'licencia' ? 'Licencia' : 'Inactivo'}
                  </span>
                </td>
                <td style={styles.tableCell}>
                  {new Date(empleado.fechaIngreso).toLocaleDateString()}
                </td>
                <td style={styles.tableCell}>
                  <div style={styles.actionButtons}>
                    <button
                      onClick={() => {
                        setEmpleadoSeleccionado(empleado);
                        setModalActivo('editar');
                      }}
                      style={{ ...styles.actionButton, color: '#059669' }}
                      className="action-button"
                      title="Editar"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('¿Estás seguro de que quieres eliminar este empleado?')) {
                          eliminarEmpleado(empleado.id);
                        }
                      }}
                      style={{ ...styles.actionButton, color: '#dc2626' }}
                      className="action-button"
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
              Mostrando {((paginaActual - 1) * empleadosPorPagina) + 1} a {Math.min(paginaActual * empleadosPorPagina, empleadosFiltrados.length)} de {empleadosFiltrados.length} empleados
            </div>
            <div style={styles.paginationButtons}>
              <button
                onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                disabled={paginaActual === 1}
                style={{
                  ...styles.paginationButton,
                  opacity: paginaActual === 1 ? 0.5 : 1,
                  cursor: paginaActual === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                Anterior
              </button>
              {Array.from({length: totalPaginas}, (_, i) => i + 1).map(numero => (
                <button
                  key={numero}
                  onClick={() => setPaginaActual(numero)}
                  style={{
                    ...styles.paginationButton,
                    ...(paginaActual === numero ? styles.paginationButtonActive : {})
                  }}
                >
                  {numero}
                </button>
              ))}
              <button
                onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                disabled={paginaActual === totalPaginas}
                style={{
                  ...styles.paginationButton,
                  opacity: paginaActual === totalPaginas ? 0.5 : 1,
                  cursor: paginaActual === totalPaginas ? 'not-allowed' : 'pointer'
                }}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de formulario */}
      {(modalActivo === 'agregar' || modalActivo === 'editar') && (
        <FormularioEmpleado
          empleado={modalActivo === 'editar' ? empleadoSeleccionado : null}
          onGuardar={modalActivo === 'agregar' ? agregarEmpleado : editarEmpleado}
          onCancelar={() => {
            setModalActivo(null);
            setEmpleadoSeleccionado(null);
          }}
        />
      )}
    </div>
  );
};

export default EmpleadosModule;