// Datos de usuarios de prueba para el sistema RRHH
export const DEMO_USERS = [
  {
    id: 1,
    email: 'colaborador@prodominicana.gob.do',
    password: '123456',
    role: 'colaborador',
    name: 'Juan Pérez',
    position: 'Desarrollador Frontend',
    department: 'Tecnología',
    avatar: '👤',
    vacationDays: 15,
    usedVacationDays: 3,
    phone: '+1 (555) 123-4567',
    address: 'Calle Principal 123, Ciudad',
    birthDate: '1990-05-15',
    hireDate: '2022-03-01',
    salary: 65000
  },
  {
    id: 2,
    email: 'gerente@prodominicana.gob.do',
    password: '123456',
    role: 'gerente',
    name: 'María González',
    position: 'Gerente de Tecnología',
    department: 'Tecnología',
    avatar: '👤',
    vacationDays: 20,
    usedVacationDays: 5,
    phone: '+1 (555) 234-5678',
    address: 'Avenida Central 456, Ciudad',
    birthDate: '1985-08-22',
    hireDate: '2020-01-15',
    salary: 85000
  },
  {
    id: 3,
    email: 'director@prodominicana.gob.do',
    password: '123456',
    role: 'director',
    name: 'Carlos Rodríguez',
    position: 'Director de Operaciones',
    department: 'Dirección',
    avatar: '👤',
    vacationDays: 25,
    usedVacationDays: 8,
    phone: '+1 (555) 345-6789',
    address: 'Boulevard Ejecutivo 789, Ciudad',
    birthDate: '1980-12-10',
    hireDate: '2018-06-01',
    salary: 120000
  },
  {
    id: 4,
    email: 'rrhh@prodominicana.gob.do',
    password: '123456',
    role: 'rrhh',
    name: 'Ana López',
    position: 'Especialista en RRHH',
    department: 'Recursos Humanos',
    avatar: '👤',
    vacationDays: 22,
    usedVacationDays: 4,
    phone: '+1 (555) 456-7890',
    address: 'Calle Empresarial 321, Ciudad',
    birthDate: '1988-03-18',
    hireDate: '2021-09-01',
    salary: 70000
  },
  {
    id: 5,
    email: 'director.rrhh@prodominicana.gob.do',
    password: '123456',
    role: 'director_rrhh',
    name: 'Luis Martínez',
    position: 'Director de RRHH',
    department: 'Recursos Humanos',
    avatar: '👤',
    vacationDays: 25,
    usedVacationDays: 6,
    phone: '+1 (555) 567-8901',
    address: 'Plaza Corporativa 654, Ciudad',
    birthDate: '1975-11-05',
    hireDate: '2019-02-01',
    salary: 110000
  },
    {
    id: 10,
    email: 'gerente.rrhh@prodominicana.gob.do',
    password: '123456',
    role: 'gerente_rrhh',
    name: 'Patricia Morales',
    position: 'Gerente de RRHH',
    department: 'Recursos Humanos',
    avatar: '👤',
    vacationDays: 22,
    usedVacationDays: 5,
    phone: '+1 (555) 678-9012',
    address: 'Centro Corporativo 987, Ciudad',
    birthDate: '1983-07-12',
    hireDate: '2020-08-15',
    salary: 95000,
    emergencyContact: {
      name: 'Carlos Morales',
      relationship: 'Esposo',
      phone: '+1 (555) 432-1098'},
  },

  {
    id: 6,
    email: 'admin@prodominicana.gob.do',
    password: '123456',
    role: 'admin',
    name: 'Sistema Admin',
    position: 'Administrador del Sistema',
    department: 'TI',
    avatar: '👤',
    vacationDays: 0,
    usedVacationDays: 0,
    phone: '+1 (555) 000-0000',
    address: 'Servidor Principal',
    birthDate: '2020-01-01',
    hireDate: '2020-01-01',
    salary: 0
  }
];

// Función para validar credenciales
export const validateCredentials = (email, password) => {
  const user = DEMO_USERS.find(u => u.email === email && u.password === password);
  return user || null;
};

// Función para obtener usuario por ID
export const getUserById = (id) => {
  return DEMO_USERS.find(user => user.id === id);
};