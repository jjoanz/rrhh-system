import React, { useState, useEffect } from 'react';
import postulacionesPublicasService from '../../api/postulacionesPublicasService';
import {
  Briefcase, User, Mail, Phone, MapPin, Calendar, FileText,
  Upload, CheckCircle, AlertCircle, ArrowRight, ArrowLeft,
  Building, Award, Languages, Code, Car, X, Loader
} from 'lucide-react';

const FormularioPostulacion = () => {
  const [paso, setPaso] = useState(1);
  const [vacantes, setVacantes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [datos, setDatos] = useState({
    vacanteId: '',
    nombre: '',
    email: '',
    cedula: '',
    telefono: '',
    telefonoMovil: '',
    telefonoFijo: '',
    fechaNacimiento: '',
    genero: '',
    estadoCivil: '',
    nacionalidad: 'Dominicana',
    direccion: '',
    ciudad: '',
    provincia: '',
    nivelEducativo: '',
    institucion: '',
    tituloObtenido: '',
    anioGraduacion: '',
    experienciaLaboral: '',
    experienciaAnios: '',
    ultimoEmpleador: '',
    ultimoPuesto: '',
    expectativaSalarial: '',
    motivacion: '',
    conocimientosEspeciales: '',
    idiomas: '',
    softwareConocido: '',
    referenciaPersonal1: '',
    referenciaPersonal2: '',
    disponibilidadInmediata: true,
    disponibilidadViajar: false,
    tieneLicencia: false,
    tipoLicencia: '',
    comoConocioVacante: ''
  });

  const [archivos, setArchivos] = useState({
    cv: null,
    fotoCedula: null,
    foto2x2: null
  });

  useEffect(() => {
    cargarVacantes();
  }, []);

  const cargarVacantes = async () => {
    try {
      setLoading(true);
      const data = await postulacionesPublicasService.getVacantesPublicas();
      setVacantes(data);
    } catch (err) {
      setError('Error al cargar las vacantes disponibles');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDatos(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

const handleFileChange = (e) => {
  const { name, files } = e.target;
  if (files && files[0]) {
    const file = files[0];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    // Nombres descriptivos para mensajes
    const fieldNames = {
      cv: 'CV',
      fotoCedula: 'Foto de Cédula',
      foto2x2: 'Foto 2x2'
    };
    
    // Validar tamaño inmediatamente
    if (file.size > maxSize) {
      const tamañoMB = (file.size / 1024 / 1024).toFixed(2);
      setError(`El archivo "${fieldNames[name]}" (${tamañoMB}MB) excede el tamaño máximo de 5MB`);
      e.target.value = '';
      return;
    }
    
    // Validar tipo de archivo
    const allowedTypes = {
      cv: ['.pdf', '.doc', '.docx'],
      fotoCedula: ['.jpg', '.jpeg', '.png', '.pdf'],
      foto2x2: ['.jpg', '.jpeg', '.png']
    };
    
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedTypes[name]?.includes(ext)) {
      setError(`Tipo de archivo no válido para ${fieldNames[name]}. Tipos permitidos: ${allowedTypes[name]?.join(', ')}`);
      e.target.value = '';
      return;
    }
    
    // Si pasa las validaciones, guardar el archivo
    setError(null);
    setArchivos(prev => ({
      ...prev,
      [name]: file
    }));
  }
};

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Validar tamaños de archivos ANTES de enviar
  const maxSize = 5 * 1024 * 1024; // 5MB en bytes
  const archivosArray = [
    { nombre: 'CV', archivo: archivos.cv },
    { nombre: 'Foto de Cédula', archivo: archivos.fotoCedula },
    { nombre: 'Foto 2x2', archivo: archivos.foto2x2 }
  ];
  
  for (const { nombre, archivo } of archivosArray) {
    if (archivo && archivo.size > maxSize) {
      const tamañoMB = (archivo.size / 1024 / 1024).toFixed(2);
      setError(`El archivo "${nombre}" (${tamañoMB}MB) excede el tamaño máximo de 5MB`);
      window.scrollTo(0, 0);
      return;
    }
  }
  
  // Validar que todos los archivos requeridos estén presentes
  if (!archivos.cv || !archivos.fotoCedula || !archivos.foto2x2) {
    setError('Debe adjuntar todos los documentos requeridos (CV, Foto de Cédula, Foto 2x2)');
    window.scrollTo(0, 0);
    return;
  }
  
  try {
    setEnviando(true);
    setError(null);
    
    await postulacionesPublicasService.enviarPostulacion(datos, archivos);
    
    setSuccess(true);
    window.scrollTo(0, 0);
  } catch (err) {
    setError(err.response?.data?.error || 'Error al enviar la postulación');
    window.scrollTo(0, 0);
  } finally {
    setEnviando(false);
  }
};

  const siguientePaso = () => {
    if (validarPaso(paso)) {
      setPaso(paso + 1);
      window.scrollTo(0, 0);
    }
  };

  const pasoAnterior = () => {
    setPaso(paso - 1);
    window.scrollTo(0, 0);
  };

  const validarPaso = (pasoActual) => {
  switch (pasoActual) {
    case 1:
      if (!datos.vacanteId) {
        setError('Debe seleccionar una vacante');
        return false;
      }
      if (!datos.nombre || !datos.email || !datos.cedula) {
        setError('Complete todos los campos requeridos');
        return false;
      }
      break;
    case 2:
      if (!datos.nivelEducativo) {
        setError('Indique su nivel educativo');
        return false;
      }
      break;
    case 3:
      if (!datos.experienciaLaboral) {
        setError('Describa su experiencia laboral');
        return false;
      }
      break;
    case 4:
      // Validar que todos los archivos requeridos estén presentes
      if (!archivos.cv) {
        setError('Debe adjuntar su Curriculum Vitae (CV)');
        return false;
      }
      if (!archivos.fotoCedula) {
        setError('Debe adjuntar la foto de su cédula');
        return false;
      }
      if (!archivos.foto2x2) {
        setError('Debe adjuntar su foto 2x2');
        return false;
      }
      break;
  }
  setError(null);
  return true;
};

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <Loader size={48} style={{ color: '#0ba8e6ff', animation: 'spin 1s linear infinite' }} />
          <p>Cargando formulario...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.successCard}>
          {/* Logo en pantalla de éxito */}
          <img 
            src="/images/PD-Logo-RGB-CEI.png" 
            alt="Logo" 
            style={styles.successLogo}
          />
          <CheckCircle size={64} style={{ color: '#10b981', marginBottom: '1rem' }} />
          <h2 style={styles.successTitle}>¡Postulación Enviada Exitosamente!</h2>
          <p style={styles.successText}>
            Gracias por postularte. Hemos recibido tu información y la revisaremos pronto.
            Nos pondremos en contacto contigo si tu perfil coincide con nuestras necesidades.
          </p>
          <button
            onClick={() => {
              setSuccess(false);
              setPaso(1);
              setDatos({
                vacanteId: '',
                nombre: '',
                email: '',
                cedula: '',
                telefono: '',
                telefonoMovil: '',
                telefonoFijo: '',
                fechaNacimiento: '',
                genero: '',
                estadoCivil: '',
                nacionalidad: 'Dominicana',
                direccion: '',
                ciudad: '',
                provincia: '',
                nivelEducativo: '',
                institucion: '',
                tituloObtenido: '',
                anioGraduacion: '',
                experienciaLaboral: '',
                experienciaAnios: '',
                ultimoEmpleador: '',
                ultimoPuesto: '',
                expectativaSalarial: '',
                motivacion: '',
                conocimientosEspeciales: '',
                idiomas: '',
                softwareConocido: '',
                referenciaPersonal1: '',
                referenciaPersonal2: '',
                disponibilidadInmediata: true,
                disponibilidadViajar: false,
                tieneLicencia: false,
                tipoLicencia: '',
                comoConocioVacante: ''
              });
              setArchivos({ cv: null, fotoCedula: null, foto2x2: null });
            }}
            style={styles.button}
          >
            Hacer Otra Postulación
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header con logos */}
      <div style={styles.header}>
        <div style={styles.logoContainer}>
          
          <img 
            src="/images/PD-Logo-RGB-CEI.png" 
            alt="Logo Completo" 
            style={styles.logoFull}
          />
        </div>
        <div style={styles.headerContent}>
          
          <h1 style={styles.title}>Formulario de Postulación</h1>
          <p style={styles.subtitle}>Complete todos los pasos para postularse a una vacante</p>
        </div>
      </div>

      {/* Indicador de Pasos */}
      <div style={styles.stepsContainer}>
        {[1, 2, 3, 4, 5].map((num) => (
          <div key={num} style={styles.stepItem}>
            <div style={{
              ...styles.stepCircle,
              backgroundColor: paso >= num ? '#0ba8e6ff' : '#e5e7eb',
              color: paso >= num ? 'white' : '#6b7280'
            }}>
              {num}
            </div>
            <span style={styles.stepLabel}>
              {num === 1 && 'Datos Personales'}
              {num === 2 && 'Educación'}
              {num === 3 && 'Experiencia'}
              {num === 4 && 'Documentos'}
              {num === 5 && 'Confirmar'}
            </span>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={styles.errorBanner}>
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={() => setError(null)} style={styles.closeButton}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Paso 1: Datos Personales */}
        {paso === 1 && (
          <Paso1
            datos={datos}
            handleChange={handleChange}
            vacantes={vacantes}
          />
        )}

        {/* Paso 2: Educación */}
        {paso === 2 && (
          <Paso2
            datos={datos}
            handleChange={handleChange}
          />
        )}

        {/* Paso 3: Experiencia */}
        {paso === 3 && (
          <Paso3
            datos={datos}
            handleChange={handleChange}
          />
        )}

        {/* Paso 4: Documentos */}
        {paso === 4 && (
          <Paso4
            archivos={archivos}
            handleFileChange={handleFileChange}
          />
        )}

        {/* Paso 5: Confirmación */}
        {paso === 5 && (
          <Paso5
            datos={datos}
            archivos={archivos}
            vacantes={vacantes}
          />
        )}

        {/* Botones de Navegación */}
        <div style={styles.buttonContainer}>
          {paso > 1 && (
            <button
              type="button"
              onClick={pasoAnterior}
              style={styles.buttonSecondary}
            >
              <ArrowLeft size={20} />
              Anterior
            </button>
          )}
          
          {paso < 5 ? (
            <button
              type="button"
              onClick={siguientePaso}
              style={styles.button}
            >
              Siguiente
              <ArrowRight size={20} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={enviando}
              style={{
                ...styles.button,
                backgroundColor: enviando ? '#9ca3af' : '#10b981',
                cursor: enviando ? 'not-allowed' : 'pointer'
              }}
            >
              {enviando ? (
                <>
                  <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
                  Enviando...
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  Enviar Postulación
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

// Componentes de cada paso (sin cambios)
const Paso1 = ({ datos, handleChange, vacantes }) => (
  <div style={styles.section}>
    <h2 style={styles.sectionTitle}>
      <User size={24} style={{ color: '#0ba8e6ff' }} />
      Información Personal
    </h2>

    <div style={styles.formGrid}>
      <div style={styles.formGroup}>
        <label style={styles.label}>Vacante que desea aplicar *</label>
        <select
          name="vacanteId"
          value={datos.vacanteId}
          onChange={handleChange}
          style={styles.select}
          required
        >
          <option value="">Seleccione una vacante</option>
          {vacantes.map(v => (
            <option key={v.id} value={v.id}>
              {v.titulo} - {v.departamento}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Nombre Completo *</label>
        <input
          type="text"
          name="nombre"
          value={datos.nombre}
          onChange={handleChange}
          style={styles.input}
          placeholder="Nombre y apellidos"
          required
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Cédula *</label>
        <input
          type="text"
          name="cedula"
          value={datos.cedula}
          onChange={handleChange}
          style={styles.input}
          placeholder="000-0000000-0"
          required
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Email *</label>
        <input
          type="email"
          name="email"
          value={datos.email}
          onChange={handleChange}
          style={styles.input}
          placeholder="correo@ejemplo.com"
          required
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Teléfono Móvil *</label>
        <input
          type="tel"
          name="telefonoMovil"
          value={datos.telefonoMovil}
          onChange={handleChange}
          style={styles.input}
          placeholder="(809) 000-0000"
          required
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Teléfono Fijo</label>
        <input
          type="tel"
          name="telefonoFijo"
          value={datos.telefonoFijo}
          onChange={handleChange}
          style={styles.input}
          placeholder="(809) 000-0000"
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Fecha de Nacimiento *</label>
        <input
          type="date"
          name="fechaNacimiento"
          value={datos.fechaNacimiento}
          onChange={handleChange}
          style={styles.input}
          required
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Género *</label>
        <select
          name="genero"
          value={datos.genero}
          onChange={handleChange}
          style={styles.select}
          required
        >
          <option value="">Seleccione</option>
          <option value="Masculino">Masculino</option>
          <option value="Femenino">Femenino</option>
        </select>
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Estado Civil *</label>
        <select
          name="estadoCivil"
          value={datos.estadoCivil}
          onChange={handleChange}
          style={styles.select}
          required
        >
          <option value="">Seleccione</option>
          <option value="Soltero/a">Soltero/a</option>
          <option value="Casado/a">Casado/a</option>
          <option value="Divorciado/a">Divorciado/a</option>
          <option value="Viudo/a">Viudo/a</option>
          <option value="Unión Libre">Unión Libre</option>
        </select>
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Nacionalidad</label>
        <input
          type="text"
          name="nacionalidad"
          value={datos.nacionalidad}
          onChange={handleChange}
          style={styles.input}
        />
      </div>

      <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
        <label style={styles.label}>Dirección Completa *</label>
        <input
          type="text"
          name="direccion"
          value={datos.direccion}
          onChange={handleChange}
          style={styles.input}
          placeholder="Calle, número, sector"
          required
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Ciudad *</label>
        <input
          type="text"
          name="ciudad"
          value={datos.ciudad}
          onChange={handleChange}
          style={styles.input}
          required
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Provincia *</label>
        <input
          type="text"
          name="provincia"
          value={datos.provincia}
          onChange={handleChange}
          style={styles.input}
          required
        />
      </div>
    </div>
  </div>
);

const Paso2 = ({ datos, handleChange }) => (
  <div style={styles.section}>
    <h2 style={styles.sectionTitle}>
      <Award size={24} style={{ color: '#0ba8e6ff' }} />
      Formación Académica
    </h2>

    <div style={styles.formGrid}>
      <div style={styles.formGroup}>
        <label style={styles.label}>Nivel Educativo *</label>
        <select
          name="nivelEducativo"
          value={datos.nivelEducativo}
          onChange={handleChange}
          style={styles.select}
          required
        >
          <option value="">Seleccione</option>
          <option value="Secundaria">Secundaria</option>
          <option value="Técnico">Técnico</option>
          <option value="Universitario Incompleto">Universitario Incompleto</option>
          <option value="Licenciatura">Licenciatura</option>
          <option value="Ingeniería">Ingeniería</option>
          <option value="Maestría">Maestría</option>
          <option value="Doctorado">Doctorado</option>
        </select>
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Institución Educativa *</label>
        <input
          type="text"
          name="institucion"
          value={datos.institucion}
          onChange={handleChange}
          style={styles.input}
          placeholder="Universidad/Centro"
          required
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Título Obtenido *</label>
        <input
          type="text"
          name="tituloObtenido"
          value={datos.tituloObtenido}
          onChange={handleChange}
          style={styles.input}
          placeholder="Ej: Licenciatura en..."
          required
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Año de Graduación *</label>
        <input
          type="number"
          name="anioGraduacion"
          value={datos.anioGraduacion}
          onChange={handleChange}
          style={styles.input}
          placeholder="2020"
          min="1950"
          max={new Date().getFullYear()}
          required
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Idiomas</label>
        <input
          type="text"
          name="idiomas"
          value={datos.idiomas}
          onChange={handleChange}
          style={styles.input}
          placeholder="Español (Nativo), Inglés (Avanzado)"
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Software/Programas que domina</label>
        <input
          type="text"
          name="softwareConocido"
          value={datos.softwareConocido}
          onChange={handleChange}
          style={styles.input}
          placeholder="Excel, Word, SAP, etc."
        />
      </div>

      <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
        <label style={styles.label}>Conocimientos Especiales / Certificaciones</label>
        <textarea
          name="conocimientosEspeciales"
          value={datos.conocimientosEspeciales}
          onChange={handleChange}
          style={{ ...styles.input, minHeight: '100px' }}
          placeholder="Certificaciones, cursos especiales, habilidades técnicas..."
        />
      </div>
    </div>
  </div>
);

const Paso3 = ({ datos, handleChange }) => (
  <div style={styles.section}>
    <h2 style={styles.sectionTitle}>
      <Building size={24} style={{ color: '#0ba8e6ff' }} />
      Experiencia Laboral
    </h2>

    <div style={styles.formGrid}>
      <div style={styles.formGroup}>
        <label style={styles.label}>Años de Experiencia *</label>
        <input
          type="number"
          name="experienciaAnios"
          value={datos.experienciaAnios}
          onChange={handleChange}
          style={styles.input}
          placeholder="5"
          min="0"
          required
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Último Empleador</label>
        <input
          type="text"
          name="ultimoEmpleador"
          value={datos.ultimoEmpleador}
          onChange={handleChange}
          style={styles.input}
          placeholder="Nombre de la empresa"
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Último Puesto</label>
        <input
          type="text"
          name="ultimoPuesto"
          value={datos.ultimoPuesto}
          onChange={handleChange}
          style={styles.input}
          placeholder="Cargo que ocupaba"
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Expectativa Salarial (RD$)</label>
        <input
          type="number"
          name="expectativaSalarial"
          value={datos.expectativaSalarial}
          onChange={handleChange}
          style={styles.input}
          placeholder="45000"
        />
      </div>

      <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
        <label style={styles.label}>Experiencia Laboral Detallada *</label>
        <textarea
          name="experienciaLaboral"
          value={datos.experienciaLaboral}
          onChange={handleChange}
          style={{ ...styles.input, minHeight: '150px' }}
          placeholder="Describa su experiencia laboral: empresas, cargos, responsabilidades, logros..."
          required
        />
      </div>

      <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
        <label style={styles.label}>¿Por qué desea trabajar con nosotros? *</label>
        <textarea
          name="motivacion"
          value={datos.motivacion}
          onChange={handleChange}
          style={{ ...styles.input, minHeight: '120px' }}
          placeholder="Cuéntenos su motivación para aplicar a esta posición..."
          required
        />
      </div>

      <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
        <label style={styles.label}>Referencia Personal 1 (Nombre, teléfono, relación)</label>
        <input
          type="text"
          name="referenciaPersonal1"
          value={datos.referenciaPersonal1}
          onChange={handleChange}
          style={styles.input}
          placeholder="Juan Pérez, 809-000-0000, Ex supervisor"
        />
      </div>

      <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
        <label style={styles.label}>Referencia Personal 2 (Nombre, teléfono, relación)</label>
        <input
          type="text"
          name="referenciaPersonal2"
          value={datos.referenciaPersonal2}
          onChange={handleChange}
          style={styles.input}
          placeholder="María García, 809-000-0000, Colega"
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            name="disponibilidadInmediata"
            checked={datos.disponibilidadInmediata}
            onChange={handleChange}
            style={styles.checkbox}
          />
          Disponibilidad Inmediata
        </label>
      </div>

      <div style={styles.formGroup}>
        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            name="disponibilidadViajar"
            checked={datos.disponibilidadViajar}
            onChange={handleChange}
            style={styles.checkbox}
          />
          Disponibilidad para Viajar
        </label>
      </div>

      <div style={styles.formGroup}>
        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            name="tieneLicencia"
            checked={datos.tieneLicencia}
            onChange={handleChange}
            style={styles.checkbox}
          />
          Tiene Licencia de Conducir
        </label>
      </div>

      {datos.tieneLicencia && (
        <div style={styles.formGroup}>
          <label style={styles.label}>Tipo de Licencia</label>
          <input
            type="text"
            name="tipoLicencia"
            value={datos.tipoLicencia}
            onChange={handleChange}
            style={styles.input}
            placeholder="Categoría A, B, C..."
          />
        </div>
      )}

      <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
        <label style={styles.label}>¿Cómo se enteró de esta vacante?</label>
        <select
          name="comoConocioVacante"
          value={datos.comoConocioVacante}
          onChange={handleChange}
          style={styles.select}
        >
          <option value="">Seleccione</option>
          <option value="Página Web">Página Web</option>
          <option value="Redes Sociales">Redes Sociales</option>
          <option value="Referido">Referido por alguien</option>
          <option value="LinkedIn">LinkedIn</option>
          <option value="Portal de Empleo">Portal de Empleo</option>
          <option value="Otro">Otro</option>
        </select>
      </div>
    </div>
  </div>
);

const Paso4 = ({ archivos, handleFileChange }) => (
  <div style={styles.section}>
    <h2 style={styles.sectionTitle}>
      <Upload size={24} style={{ color: '#0ba8e6ff' }} />
      Documentos Requeridos
    </h2>

    <div style={styles.uploadGrid}>
      <FileUploadBox
        name="cv"
        label="Curriculum Vitae (CV) *"
        accept=".pdf,.doc,.docx"
        archivo={archivos.cv}
        onChange={handleFileChange}
        icon={FileText}
        required
      />

      <FileUploadBox
        name="fotoCedula"
        label="Foto de Cédula *"
        accept=".jpg,.jpeg,.png,.pdf"
        archivo={archivos.fotoCedula}
        onChange={handleFileChange}
        icon={Upload}
        required
      />

      <FileUploadBox
        name="foto2x2"
        label="Foto 2x2 *"
        accept=".jpg,.jpeg,.png"
        archivo={archivos.foto2x2}
        onChange={handleFileChange}
        icon={User}
        required
      />
    </div>

    <div style={styles.infoBox}>
      <AlertCircle size={20} style={{ color: '#3b82f6' }} />
      <div>
        <strong>Importante:</strong>
        <ul style={{ marginTop: '0.5rem', marginLeft: '1rem' }}>
          <li>Tamaño máximo por archivo: 5MB</li>
          <li>CV: Formatos aceptados PDF, DOC, DOCX</li>
          <li>Fotos: Formatos JPG, PNG</li>
          <li>Foto de cédula: Ambas caras legibles</li>
          <li>Foto 2x2: Fondo claro, vestimenta formal</li>
        </ul>
      </div>
    </div>
  </div>
);

const Paso5 = ({ datos, archivos, vacantes }) => {
  const vacanteSeleccionada = vacantes.find(v => v.id === parseInt(datos.vacanteId));

  return (
    <div style={styles.section}>
      <h2 style={styles.sectionTitle}>
        <CheckCircle size={24} style={{ color: '#0ba8e6ff' }} />
        Confirmar Información
      </h2>

      <div style={styles.summaryBox}>
        <h3 style={styles.summaryTitle}>Vacante</h3>
        <p style={styles.summaryText}>
          <strong>{vacanteSeleccionada?.titulo}</strong> - {vacanteSeleccionada?.departamento}
        </p>
      </div>

      <div style={styles.summaryBox}>
        <h3 style={styles.summaryTitle}>Datos Personales</h3>
        <div style={styles.summaryGrid}>
          <div><strong>Nombre:</strong> {datos.nombre}</div>
          <div><strong>Cédula:</strong> {datos.cedula}</div>
          <div><strong>Email:</strong> {datos.email}</div>
          <div><strong>Teléfono:</strong> {datos.telefonoMovil}</div>
          <div><strong>Ciudad:</strong> {datos.ciudad}</div>
          <div><strong>Provincia:</strong> {datos.provincia}</div>
        </div>
      </div>

      <div style={styles.summaryBox}>
        <h3 style={styles.summaryTitle}>Formación</h3>
        <div style={styles.summaryGrid}>
          <div><strong>Nivel:</strong> {datos.nivelEducativo}</div>
          <div><strong>Institución:</strong> {datos.institucion}</div>
          <div><strong>Título:</strong> {datos.tituloObtenido}</div>
          <div><strong>Año:</strong> {datos.anioGraduacion}</div>
        </div>
      </div>

      <div style={styles.summaryBox}>
        <h3 style={styles.summaryTitle}>Experiencia</h3>
        <div style={styles.summaryGrid}>
          <div><strong>Años:</strong> {datos.experienciaAnios}</div>
          <div><strong>Último empleador:</strong> {datos.ultimoEmpleador || 'N/A'}</div>
          <div><strong>Último puesto:</strong> {datos.ultimoPuesto || 'N/A'}</div>
          <div><strong>Expectativa salarial:</strong> {datos.expectativaSalarial ? `RD$ ${datos.expectativaSalarial}` : 'N/A'}</div>
        </div>
      </div>

      <div style={styles.summaryBox}>
        <h3 style={styles.summaryTitle}>Documentos Adjuntos</h3>
        <div style={styles.summaryGrid}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {archivos.cv ? (
              <>
                <CheckCircle size={16} style={{ color: '#10b981' }} />
                <span>CV: {archivos.cv.name}</span>
              </>
            ) : (
              <>
                <X size={16} style={{ color: '#ef4444' }} />
                <span>CV no adjuntado</span>
              </>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {archivos.fotoCedula ? (
              <>
                <CheckCircle size={16} style={{ color: '#10b981' }} />
                <span>Cédula: {archivos.fotoCedula.name}</span>
              </>
            ) : (
              <>
                <X size={16} style={{ color: '#ef4444' }} />
                <span>Cédula no adjuntada</span>
              </>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {archivos.foto2x2 ? (
              <>
                <CheckCircle size={16} style={{ color: '#10b981' }} />
                <span>Foto: {archivos.foto2x2.name}</span>
              </>
            ) : (
              <>
                <X size={16} style={{ color: '#ef4444' }} />
                <span>Foto no adjuntada</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={styles.warningBox}>
        <AlertCircle size={20} style={{ color: '#f59e0b' }} />
        <p>
          <strong>Declaración:</strong> Certifico que toda la información proporcionada es verdadera y completa.
          Entiendo que cualquier falsedad u omisión puede resultar en la descalificación de mi candidatura o
          terminación de empleo si ya he sido contratado.
        </p>
      </div>
    </div>
  );
};

const FileUploadBox = ({ name, label, accept, archivo, onChange, icon: Icon, required }) => (
  <div style={styles.uploadBox}>
    <div style={styles.uploadIcon}>
      <Icon size={32} style={{ color: '#0ba8e6ff' }} />
    </div>
    <label style={styles.uploadLabel}>
      {label}
      <input
        type="file"
        name={name}
        accept={accept}
        onChange={onChange}
        style={{ display: 'none' }}
        required={required}
      />
      <div style={styles.uploadButton}>
        {archivo ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={16} style={{ color: '#10b981' }} />
            <span>{archivo.name}</span>
          </div>
        ) : (
          <span>Seleccionar archivo</span>
        )}
      </div>
    </label>
  </div>
);

// Estilos
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    padding: '2rem 1rem'
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: '1rem'
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '0.75rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  logoContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '1.5rem',
    marginBottom: '1.5rem',
    flexWrap: 'wrap'
  },
  logoIcon: {
    height: '60px',
    width: 'auto',
    objectFit: 'contain'
  },
  logoFull: {
    height: '50px',
    width: 'auto',
    objectFit: 'contain'
  },
  headerContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem'
  },
  title: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#1e293b',
    margin: '0.5rem 0'
  },
  subtitle: {
    fontSize: '1rem',
    color: '#64748b',
    margin: 0
  },
  stepsContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    maxWidth: '800px',
    margin: '0 auto 2rem',
    padding: '0 1rem'
  },
  stepItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    flex: 1
  },
  stepCircle: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '1.125rem',
    transition: 'all 0.3s'
  },
  stepLabel: {
    fontSize: '0.75rem',
    color: '#64748b',
    textAlign: 'center'
  },
  form: {
    maxWidth: '900px',
    margin: '0 auto',
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '0.75rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  section: {
    marginBottom: '2rem'
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: '1.5rem',
    paddingBottom: '0.75rem',
    borderBottom: '2px solid #e5e7eb'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1rem'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column'
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '0.5rem'
  },
  input: {
    padding: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  select: {
    padding: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    backgroundColor: 'white',
    outline: 'none',
    cursor: 'pointer'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    color: '#374151',
    cursor: 'pointer'
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer'
  },
  uploadGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '1.5rem'
  },
  uploadBox: {
    border: '2px dashed #d1d5db',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    textAlign: 'center',
    transition: 'all 0.3s',
    cursor: 'pointer'
  },
  uploadIcon: {
    marginBottom: '1rem'
  },
  uploadLabel: {
    display: 'block',
    cursor: 'pointer'
  },
  uploadButton: {
    marginTop: '0.75rem',
    padding: '0.75rem',
    backgroundColor: '#f3f4f6',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
    transition: 'background-color 0.2s'
  },
  infoBox: {
    display: 'flex',
    gap: '1rem',
    padding: '1rem',
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    color: '#1e40af'
  },
  summaryBox: {
    marginBottom: '1.5rem',
    padding: '1rem',
    backgroundColor: '#f8fafc',
    borderRadius: '0.5rem',
    border: '1px solid #e5e7eb'
  },
  summaryTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '0.75rem'
  },
  summaryText: {
    fontSize: '0.875rem',
    color: '#475569',
    margin: 0
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '0.75rem',
    fontSize: '0.875rem',
    color: '#475569'
  },
  warningBox: {
    display: 'flex',
    gap: '1rem',
    padding: '1rem',
    backgroundColor: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    color: '#78350f',
    marginTop: '1.5rem'
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1rem',
    marginTop: '2rem',
    paddingTop: '2rem',
    borderTop: '2px solid #e5e7eb'
  },
  button: {
    flex: 1,
    maxWidth: '300px',
    padding: '0.875rem 1.5rem',
    backgroundColor: '#0ba8e6ff',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    transition: 'background-color 0.2s',
    marginLeft: 'auto'
  },
  buttonSecondary: {
    flex: 1,
    maxWidth: '300px',
    padding: '0.875rem 1.5rem',
    backgroundColor: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    transition: 'background-color 0.2s'
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem',
    backgroundColor: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '0.75rem',
    color: '#dc2626',
    marginBottom: '1.5rem',
    maxWidth: '900px',
    margin: '0 auto 1.5rem'
  },
  closeButton: {
    marginLeft: 'auto',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#dc2626'
  },
  successCard: {
    maxWidth: '600px',
    margin: '4rem auto',
    padding: '3rem',
    backgroundColor: 'white',
    borderRadius: '0.75rem',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    textAlign: 'center'
  },
  successLogo: {
    height: '60px',
    width: 'auto',
    objectFit: 'contain',
    marginBottom: '1.5rem'
  },
  successTitle: {
    fontSize: '1.75rem',
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: '1rem'
  },
  successText: {
    fontSize: '1rem',
    color: '#64748b',
    lineHeight: '1.6',
    marginBottom: '2rem'
  }
};

export default FormularioPostulacion;