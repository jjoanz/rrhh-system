import React, { useEffect, useState } from 'react';
import { getEmpleados, deleteEmpleado } from '../api/empleadosService';

const EmpleadosList = () => {
  const [empleados, setEmpleados] = useState([]);

  const fetchEmpleados = async () => {
    const data = await getEmpleados();
    setEmpleados(data);
  };

  useEffect(() => {
    fetchEmpleados();
  }, []);

  const handleDelete = async (id) => {
    await deleteEmpleado(id);
    fetchEmpleados(); // refrescar la lista
  };

  return (
    <div>
      <h2>Lista de Empleados</h2>
      <ul>
        {empleados.map(emp => (
          <li key={emp.EmpleadoID}>
            {emp.Nombre} {emp.Apellido} - {emp.Cargo}
            <button onClick={() => handleDelete(emp.EmpleadoID)}>Eliminar</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default EmpleadosList;
