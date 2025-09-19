import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const PuestosModule = () => {
  const [puestos, setPuestos] = useState([]);
  const [nuevoPuesto, setNuevoPuesto] = useState("");

  const fetchPuestos = async () => {
    const res = await axios.get(`${API_URL}/puestos`);
    setPuestos(res.data);
  };

  const agregarPuesto = async () => {
    if (!nuevoPuesto) return;
    await axios.post(`${API_URL}/puestos`, { nombre: nuevoPuesto });
    setNuevoPuesto("");
    fetchPuestos();
  };

  const eliminarPuesto = async (id) => {
    await axios.delete(`${API_URL}/puestos/${id}`);
    fetchPuestos();
  };

  useEffect(() => {
    fetchPuestos();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Gestión de Puestos</h2>
      <div className="mb-4 flex gap-2">
        <input
          value={nuevoPuesto}
          onChange={(e) => setNuevoPuesto(e.target.value)}
          placeholder="Nuevo puesto"
          className="border p-2 flex-1"
        />
        <button onClick={agregarPuesto} className="px-4 py-2 bg-blue-500 text-white rounded">
          Agregar
        </button>
      </div>
      <ul>
        {puestos.map((p) => (
          <li key={p.id} className="flex justify-between items-center border-b py-2">
            {p.nombre}
            <button onClick={() => eliminarPuesto(p.id)} className="text-red-500">Eliminar</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PuestosModule;

