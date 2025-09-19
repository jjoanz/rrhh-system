import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://192.168.0.239:5000/api";

const PostulacionesModule = () => {
  const [postulaciones, setPostulaciones] = useState([]);
  const [filtro, setFiltro] = useState("");

  const fetchPostulaciones = async () => {
    const res = await axios.get(`${API_URL}/postulaciones`, { params: { filtro } });
    setPostulaciones(res.data);
  };

  useEffect(() => {
    fetchPostulaciones();
  }, [filtro]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Gestión de Postulaciones</h2>
      <div className="mb-4 flex gap-2">
        <input
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Filtrar por nombre, puesto..."
          className="border p-2 flex-1"
        />
        <button onClick={fetchPostulaciones} className="px-4 py-2 bg-blue-500 text-white rounded">
          Buscar
        </button>
      </div>
      <table className="table-auto w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border px-2 py-1">Candidato</th>
            <th className="border px-2 py-1">Puesto</th>
            <th className="border px-2 py-1">Fecha</th>
            <th className="border px-2 py-1">Estado</th>
          </tr>
        </thead>
        <tbody>
          {postulaciones.map((p) => (
            <tr key={p.id}>
              <td className="border px-2 py-1">{p.nombre}</td>
              <td className="border px-2 py-1">{p.puesto}</td>
              <td className="border px-2 py-1">{new Date(p.fecha).toLocaleDateString()}</td>
              <td className="border px-2 py-1">{p.estado}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PostulacionesModule;


