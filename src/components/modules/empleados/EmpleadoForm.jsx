import React, { useState } from 'react';
import { X, Save } from 'lucide-react';

const EmpleadoForm = ({ empleado, departamentos, puestos, empleados, onGuardar, onCancelar, styles }) => {
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
          <h3 style={styles.modalTitle}>{empleado ? 'Editar Empleado' : 'Nuevo Empleado'}</h3>
          <button onClick={onCancelar} style={{ ...styles.actionButton, color: '#6b7280' }}>
            <X size={24} />
          </button>
        </div>

        <div style={styles.modalBody}>
          <div style={styles.formGrid}>
            {/* Información Personal */}
            <div>
              <h4 style={styles.formSectionTitle}>Información Personal</h4>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nombre *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Apellido *</label>
                <input
                  type="text"
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Teléfono</label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Dirección</label>
                <textarea
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  style={styles.textarea}
                />
              </div>
            </div>

            {/* Información Laboral */}
            <div>
              <h4 style={styles.formSectionTitle}>Información Laboral</h4>

              <div style={styles.formGroup}>
                <label style={styles.label}>Departamento *</label>
                <select
                  value={formData.departamento}
                  onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, puesto: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, supervisor: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, fechaIngreso: e.target.value })}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Salario (RD$)</label>
                <input
                  type="number"
                  value={formData.salario}
                  onChange={(e) => setFormData({ ...formData, salario: e.target.value })}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Estado</label>
                <select
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
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
            <button onClick={onCancelar} style={{ ...styles.button, ...styles.buttonSecondary }}>Cancelar</button>
            <button onClick={handleGuardar} style={{ ...styles.button, ...styles.buttonPrimary }}>
              <Save size={16} />
              {empleado ? 'Actualizar' : 'Crear'} Empleado
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmpleadoForm;

