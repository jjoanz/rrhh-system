// src/api.js
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

export const getEmpleados = () => axios.get(`${API_BASE}/empleados/list`);
export const createEmpleado = (data) => axios.post(`${API_BASE}/empleados/create`, data);
export const updateEmpleado = (id, data) => axios.put(`${API_BASE}/empleados/update/${id}`, data);
export const deleteEmpleado = (id) => axios.delete(`${API_BASE}/empleados/delete/${id}`);

// Similar para departamentos y puestos:
export const getDepartamentos = () => axios.get(`${API_BASE}/departamentos/list`);
export const getPuestos = () => axios.get(`${API_BASE}/puestos/list`);
