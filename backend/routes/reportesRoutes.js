// backend/routes/reportesRoutes.js
import express from 'express';
import sql from 'mssql';
import { getConnection } from '../db.js';
import ExcelJS from 'exceljs';  // ✅ AGREGAR ESTO
import PDFDocument from 'pdfkit';  // ✅ AGREGAR ESTO

const router = express.Router();

// ============================================
// FUNCIONES AUXILIARES
// ============================================

async function ejecutarQuerySegura(query, parametros = {}) {
  try {
    const pool = await getConnection();
    const request = pool.request();

    Object.entries(parametros).forEach(([key, value]) => {
      request.input(key, value);
    });

    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    console.error('Error ejecutando query:', error);
    throw error;
  }
}

async function ejecutarQueryConParametros(query, parametros) {
  try {
    const pool = await getConnection();
    const request = pool.request();

    Object.entries(parametros).forEach(([key, value]) => {
      request.input(key, value);
    });

    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    console.error('Error ejecutando query con parámetros:', error);
    throw error;
  }
}

function construirQueryEmpleados({ campos, filtros, ordenamiento, agrupacion, agregaciones, limite = 1000 }) {
  const mapaCampos = {
    'nombre': 'e.Nombre',
    'apellido': 'e.Apellido',
    'email': 'e.Email',
    'cargo': 'e.Cargo',
    'salario': 'e.Salario',
    'fechaIngreso': 'e.FechaIngreso',
    'departamento': 'd.Nombre as Departamento',
    'estado': 'CASE WHEN e.Estado = 1 THEN \'Activo\' ELSE \'Inactivo\' END as Estado',
    'cedula': 'e.Cedula'
  };

  let selectClause = campos.map(c => mapaCampos[c]).join(', ');

  if (agregaciones) {
    Object.entries(agregaciones).forEach(([campo, funcion]) => {
      const funcionesPermitidas = ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX'];
      if (funcionesPermitidas.includes(funcion.toUpperCase())) {
        selectClause += `, ${funcion}(e.${campo}) as ${campo}_${funcion}`;
      }
    });
  }

  let query = `
    SELECT TOP ${Math.min(limite, 10000)} ${selectClause}
    FROM Empleados e
    LEFT JOIN Departamentos d ON e.DepartamentoID = d.DepartamentoID
  `;

  const condiciones = [];
  if (filtros) {
    if (filtros.estado === 'activo') {
      condiciones.push('e.Estado = 1');
    } else if (filtros.estado === 'inactivo') {
      condiciones.push('e.Estado = 0');
    }
    
    if (filtros.departamentoId) {
      condiciones.push(`e.DepartamentoID = ${parseInt(filtros.departamentoId)}`);
    }
    
    if (filtros.cargo) {
      condiciones.push(`e.Cargo LIKE '%${filtros.cargo.replace(/'/g, "''")}%'`);
    }
  }

  if (condiciones.length > 0) {
    query += ` WHERE ${condiciones.join(' AND ')} `;
  }

  if (agrupacion && mapaCampos[agrupacion]) {
    query += ` GROUP BY ${mapaCampos[agrupacion]} `;
  }

  if (ordenamiento && ordenamiento.campo && mapaCampos[ordenamiento.campo]) {
    const direccion = ordenamiento.direccion === 'DESC' ? 'DESC' : 'ASC';
    query += ` ORDER BY ${mapaCampos[ordenamiento.campo]} ${direccion} `;
  } else {
    query += ` ORDER BY e.Nombre ASC `;
  }

  return query;
}

async function calcularSeverance(departamentoId, fechaReferencia) {
  const fecha = new Date(fechaReferencia);
  
  let query = `
    SELECT 
      e.EmpleadoID,
      e.Nombre + ' ' + e.Apellido AS Colaborador,
      e.Cedula,
      e.Cargo,
      e.FechaIngreso,
      e.Salario,
      DATEDIFF(MONTH, e.FechaIngreso, @fecha) as MesesTrabajados,
      DATEDIFF(YEAR, e.FechaIngreso, @fecha) as AniosTrabajados
    FROM Empleados e
    WHERE e.Estado = 1
  `;

  if (departamentoId) {
    query += ` AND e.DepartamentoID = @departamentoId `;
  }

  const pool = await getConnection();
  const request = pool.request();
  request.input('fecha', sql.DateTime, fecha);
  if (departamentoId) request.input('departamentoId', sql.Int, parseInt(departamentoId));

  const result = await request.query(query);
  const empleados = result.recordset;

  return empleados.map(emp => {
    const preaviso = calcularPreaviso(emp.MesesTrabajados, emp.Salario);
    const cesantia = calcularCesantia(emp.MesesTrabajados, emp.AniosTrabajados, emp.Salario);
    const vacaciones = (emp.Salario / 30) * 14;
    const regalia = emp.Salario * 0.6667;

    return {
      ...emp,
      Preaviso: Math.round(preaviso * 100) / 100,
      Cesantia: Math.round(cesantia * 100) / 100,
      Vacaciones: Math.round(vacaciones * 100) / 100,
      Regalia: Math.round(regalia * 100) / 100,
      Total: Math.round((preaviso + cesantia + vacaciones + regalia) * 100) / 100
    };
  });
}

function calcularPreaviso(meses, salario) {
  if (meses < 3) return 0;
  if (meses < 6) return (salario / 30) * 7;
  if (meses < 12) return (salario / 30) * 14;
  return (salario / 30) * 28;
}

function calcularCesantia(meses, anios, salario) {
  if (meses < 3) return 0;
  if (meses >= 3 && meses <= 5) return (salario / 30) * 6 * anios;
  if (anios < 1) return (salario / 30) * 13;
  if (anios >= 1 && anios <= 5) return (salario / 30) * 21 * anios;
  return (salario / 30) * 23 * anios;
}

async function reporteSalarios(departamentoId) {
  let query = `
    SELECT 
      d.Nombre as Departamento,
      COUNT(e.EmpleadoID) as TotalEmpleados,
      ISNULL(MIN(CAST(e.Salario AS FLOAT)), 0) as SalarioMinimo,
      ISNULL(MAX(CAST(e.Salario AS FLOAT)), 0) as SalarioMaximo,
      ISNULL(AVG(CAST(e.Salario AS FLOAT)), 0) as SalarioPromedio,
      ISNULL(SUM(CAST(e.Salario AS FLOAT)), 0) as MasaSalarial
    FROM Empleados e
    LEFT JOIN Departamentos d ON e.DepartamentoID = d.DepartamentoID
    WHERE e.Estado = 1
  `;

  if (departamentoId) {
    query += ` AND e.DepartamentoID = @departamentoId `;
  }

  query += ` GROUP BY d.DepartamentoID, d.Nombre ORDER BY SalarioPromedio DESC `;

  const pool = await getConnection();
  const request = pool.request();
  if (departamentoId) request.input('departamentoId', sql.Int, parseInt(departamentoId));

  const result = await request.query(query);
  return result.recordset;
}

async function obtenerMetricasRRHH() {
  const pool = await getConnection();
  const metricas = {};

  try {
    const totalEmpleados = await pool.request().query(`
      SELECT COUNT(*) as total FROM Empleados WHERE Estado = 1
    `);
    metricas.totalEmpleados = totalEmpleados.recordset[0].total;

    const contratacionesRecientes = await pool.request().query(`
      SELECT COUNT(*) as total 
      FROM Empleados 
      WHERE FechaIngreso >= DATEADD(day, -30, GETDATE())
    `);
    metricas.contratacionesUltimos30Dias = contratacionesRecientes.recordset[0].total;

    const salarioPromedio = await pool.request().query(`
      SELECT ISNULL(AVG(CAST(Salario AS FLOAT)), 0) as promedio 
      FROM Empleados 
      WHERE Estado = 1
    `);
    metricas.salarioPromedio = Math.round(salarioPromedio.recordset[0].promedio);

    const vacantesAbiertas = await pool.request().query(`
      SELECT COUNT(*) as total 
      FROM Vacantes 
      WHERE Estado = 'Abierta'
    `);
    metricas.vacantesAbiertas = vacantesAbiertas.recordset[0].total;

    const porDepartamento = await pool.request().query(`
      SELECT 
        d.Nombre as departamento,
        COUNT(e.EmpleadoID) as total
      FROM Departamentos d
      LEFT JOIN Empleados e ON d.DepartamentoID = e.DepartamentoID AND e.Estado = 1
      GROUP BY d.Nombre
      ORDER BY total DESC
    `);
    metricas.distribucionDepartamentos = porDepartamento.recordset;

    return metricas;
  } catch (error) {
    console.error('Error obteniendo métricas:', error);
    throw error;
  }
}

// ============================================
// RUTAS DE REPORTES
// ============================================

router.post('/empleados', async (req, res) => {
  try {
    const { 
      campos = ['nombre', 'apellido', 'cargo', 'departamento'],
      filtros = {},
      ordenamiento = { campo: 'nombre', direccion: 'ASC' },
      agrupacion,
      agregaciones,
      limite = 1000,
      pagina = 1
    } = req.body;

    const camposPermitidos = [
      'nombre', 'apellido', 'email', 'cargo', 'salario', 
      'fechaIngreso', 'departamento', 'estado', 'cedula'
    ];
    
    const camposValidos = campos.filter(c => camposPermitidos.includes(c));
    
    if (camposValidos.length === 0) {
      return res.status(400).json({ 
        error: 'No hay campos válidos seleccionados',
        camposDisponibles: camposPermitidos
      });
    }

    const query = construirQueryEmpleados({
      campos: camposValidos,
      filtros,
      ordenamiento,
      agrupacion,
      agregaciones,
      limite
    });

    const resultado = await ejecutarQuerySegura(query, filtros);
    
    res.json({
      success: true,
      data: resultado,
      total: resultado.length,
      pagina: pagina,
      configuracion: { campos: camposValidos, filtros, ordenamiento }
    });

  } catch (error) {
    console.error('Error en reporte empleados:', error);
    res.status(500).json({ 
      error: 'Error generando reporte',
      details: error.message 
    });
  }
});

router.post('/departamentos', async (req, res) => {
  try {
    const { 
      incluirEstadisticas = true,
      incluirEmpleados = false,
      filtros = {}
    } = req.body;

    let query = `
      SELECT 
        d.DepartamentoID,
        d.Nombre as Departamento,
        d.Descripcion
    `;

    if (incluirEstadisticas) {
      query += `,
        COUNT(e.EmpleadoID) as TotalEmpleados,
        ISNULL(AVG(CAST(e.Salario AS FLOAT)), 0) as SalarioPromedio,
        ISNULL(SUM(CAST(e.Salario AS FLOAT)), 0) as MasaSalarial,
        ISNULL(MIN(CAST(e.Salario AS FLOAT)), 0) as SalarioMinimo,
        ISNULL(MAX(CAST(e.Salario AS FLOAT)), 0) as SalarioMaximo
      `;
    }

    query += ` FROM Departamentos d `;

    if (incluirEstadisticas || incluirEmpleados) {
      query += ` LEFT JOIN Empleados e ON d.DepartamentoID = e.DepartamentoID AND e.Estado = 1 `;
    }

    if (incluirEstadisticas) {
      query += ` GROUP BY d.DepartamentoID, d.Nombre, d.Descripcion `;
    }

    query += ` ORDER BY d.Nombre `;

    const resultado = await ejecutarQuerySegura(query, {});
    
    res.json({
      success: true,
      data: resultado,
      total: resultado.length
    });

  } catch (error) {
    console.error('Error en reporte departamentos:', error);
    res.status(500).json({ 
      error: 'Error generando reporte',
      details: error.message 
    });
  }
});

router.post('/vacantes', async (req, res) => {
  try {
    const { 
      estado = 'Todas',
      departamentoId,
      fechaDesde,
      fechaHasta,
      incluirPostulaciones = false
    } = req.body;

    let query = `
      SELECT 
        v.VacanteID,
        v.Titulo,
        v.Descripcion,
        v.Estado,
        v.FechaPublicacion,
        v.FechaCierre,
        d.Nombre as Departamento
    `;

    if (incluirPostulaciones) {
      query += `,
        COUNT(p.PostulacionID) as TotalPostulaciones,
        COUNT(CASE WHEN p.Estado = 'Aprobada' THEN 1 END) as Aprobadas,
        COUNT(CASE WHEN p.Estado = 'Rechazada' THEN 1 END) as Rechazadas,
        COUNT(CASE WHEN p.Estado = 'Pendiente' THEN 1 END) as Pendientes
      `;
    }

    query += ` FROM Vacantes v 
      LEFT JOIN Departamentos d ON v.DepartamentoID = d.DepartamentoID
    `;

    if (incluirPostulaciones) {
      query += ` LEFT JOIN Postulaciones p ON v.VacanteID = p.VacanteID `;
    }

    const condiciones = [];
    const parametros = {};

    if (estado && estado !== 'Todas') {
      condiciones.push('v.Estado = @estado');
      parametros.estado = estado;
    }

    if (departamentoId) {
      condiciones.push('v.DepartamentoID = @departamentoId');
      parametros.departamentoId = parseInt(departamentoId);
    }

    if (fechaDesde) {
      condiciones.push('v.FechaPublicacion >= @fechaDesde');
      parametros.fechaDesde = fechaDesde;
    }

    if (fechaHasta) {
      condiciones.push('v.FechaPublicacion <= @fechaHasta');
      parametros.fechaHasta = fechaHasta;
    }

    if (condiciones.length > 0) {
      query += ` WHERE ${condiciones.join(' AND ')} `;
    }

    if (incluirPostulaciones) {
      query += ` GROUP BY v.VacanteID, v.Titulo, v.Descripcion, v.Estado, 
                 v.FechaPublicacion, v.FechaCierre, d.Nombre `;
    }

    query += ` ORDER BY v.FechaPublicacion DESC `;

    const resultado = await ejecutarQueryConParametros(query, parametros);
    
    res.json({
      success: true,
      data: resultado,
      total: resultado.length
    });

  } catch (error) {
    console.error('Error en reporte vacantes:', error);
    res.status(500).json({ 
      error: 'Error generando reporte',
      details: error.message 
    });
  }
});

router.post('/nomina', async (req, res) => {
  try {
    const { 
      tipo = 'severance',
      departamentoId,
      fechaReferencia = new Date()
    } = req.body;

    let data = [];

    if (tipo === 'severance') {
      data = await calcularSeverance(departamentoId, fechaReferencia);
    } else if (tipo === 'salarios') {
      data = await reporteSalarios(departamentoId);
    } else if (tipo === 'aumentos') {
      data = [];
    } else {
      return res.status(400).json({ 
        error: 'Tipo de reporte no válido',
        tiposDisponibles: ['severance', 'salarios', 'aumentos']
      });
    }

    res.json({
      success: true,
      data,
      total: data.length,
      fechaGeneracion: new Date().toISOString(),
      tipo
    });

  } catch (error) {
    console.error('Error en reporte nómina:', error);
    res.status(500).json({ 
      error: 'Error generando reporte',
      details: error.message 
    });
  }
});

router.get('/metricas', async (req, res) => {
  try {
    const metricas = await obtenerMetricasRRHH();
    
    res.json({
      success: true,
      data: metricas
    });

  } catch (error) {
    console.error('Error en métricas:', error);
    res.status(500).json({ 
      error: 'Error obteniendo métricas',
      details: error.message 
    });
  }
});

// ============================================
// RUTAS DE GESTIÓN DE REPORTES GUARDADOS
// ============================================

router.get('/guardados', async (req, res) => {
  try {
    const query = `
      SELECT 
        ReporteID as id,
        Nombre as nombre,
        Origen as origen,
        Descripcion as descripcion,
        Configuracion as configuracion,
        FechaCreacion as fechaCreacion
      FROM ReportesPersonalizados
      WHERE Estado = 1
      ORDER BY FechaCreacion DESC
    `;

    const pool = await getConnection();
    const result = await pool.request().query(query);
    
    const reportes = result.recordset.map(r => ({
      ...r,
      configuracion: r.configuracion ? JSON.parse(r.configuracion) : null
    }));

    res.json(reportes);
  } catch (error) {
    console.error('Error obteniendo reportes guardados:', error);
    res.status(500).json({ 
      error: 'Error al obtener reportes guardados',
      details: error.message 
    });
  }
});

router.post('/guardados', async (req, res) => {
  try {
    const { nombre, origen, descripcion, configuracion } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ 
        error: 'El nombre del reporte es requerido' 
      });
    }

    const query = `
      INSERT INTO ReportesPersonalizados 
      (Nombre, Origen, Descripcion, Configuracion, FechaCreacion, Estado)
      OUTPUT INSERTED.ReporteID
      VALUES (@nombre, @origen, @descripcion, @configuracion, GETDATE(), 1)
    `;

    const pool = await getConnection();
    const request = pool.request();
    
    request.input('nombre', sql.NVarChar, nombre.trim());
    request.input('origen', sql.NVarChar, origen || 'personalizado');
    request.input('descripcion', sql.NVarChar, descripcion || '');
    request.input('configuracion', sql.NVarChar, JSON.stringify(configuracion || {}));

    const result = await request.query(query);

    res.status(201).json({
      id: result.recordset[0].ReporteID,
      nombre: nombre.trim(),
      origen: origen || 'personalizado',
      descripcion: descripcion || '',
      configuracion,
      fechaCreacion: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error guardando reporte:', error);
    res.status(500).json({ 
      error: 'Error al guardar el reporte',
      details: error.message 
    });
  }
});

router.delete('/guardados/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      UPDATE ReportesPersonalizados 
      SET Estado = 0 
      WHERE ReporteID = @id
    `;

    const pool = await getConnection();
    const request = pool.request();
    request.input('id', sql.Int, parseInt(id));

    await request.query(query);

    res.json({ message: 'Reporte eliminado correctamente' });

  } catch (error) {
    console.error('Error eliminando reporte:', error);
    res.status(500).json({ 
      error: 'Error al eliminar el reporte',
      details: error.message 
    });
  }
});

router.get('/departamentos-list', async (req, res) => {
  try {
    const query = `
      SELECT 
        DepartamentoID,
        Nombre,
        Descripcion
      FROM Departamentos
      WHERE Estado = 1
      ORDER BY Nombre
    `;

    const pool = await getConnection();
    const result = await pool.request().query(query);

    res.json(result.recordset);

  } catch (error) {
    console.error('Error obteniendo departamentos:', error);
    res.status(500).json({ 
      error: 'Error obteniendo departamentos',
      details: error.message 
    });
  }
});

// ============================================
// RUTA DE EXPORTACIÓN (CORREGIDA)
// ============================================

router.post('/export', async (req, res) => {
  try {
    const { formato, data, nombre = 'reporte' } = req.body;

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ 
        error: 'No hay datos para exportar',
        details: 'Se requiere un array con datos válidos'
      });
    }

    const formatosPermitidos = ['csv', 'excel', 'pdf'];
    if (!formatosPermitidos.includes(formato)) {
      return res.status(400).json({ 
        error: 'Formato no soportado',
        formatosDisponibles: formatosPermitidos
      });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const fileName = `${nombre}_${timestamp}`;

    // ============================================
    // EXPORTAR A CSV
    // ============================================
    if (formato === 'csv') {
      const headers = Object.keys(data[0]);
      let csv = headers.join(',') + '\n';
      
      data.forEach(row => {
        const values = headers.map(header => {
          let value = row[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        });
        csv += values.join(',') + '\n';
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}.csv"`);
      res.setHeader('Cache-Control', 'no-cache');
      return res.send('\uFEFF' + csv);
    }

    // ============================================
    // EXPORTAR A EXCEL
    // ============================================
    if (formato === 'excel') {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Sistema RRHH';
      workbook.created = new Date();
      
      const sheet = workbook.addWorksheet('Reporte', {
        properties: { tabColor: { argb: 'FF0066CC' } }
      });

      // Configurar columnas
      const columns = Object.keys(data[0]).map(key => ({ 
        header: key.toUpperCase().replace(/_/g, ' '), 
        key,
        width: Math.max(key.length + 5, 15)
      }));
      
      sheet.columns = columns;
      
      // Agregar datos
      data.forEach(row => {
        sheet.addRow(row);
      });

      // Estilos del encabezado
      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
      sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0066CC' }
      };
      sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
      sheet.getRow(1).height = 25;

      // Bordes y formato para todas las celdas
      sheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
            left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
            bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
            right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
          };
          
          if (rowNumber > 1) {
            // Formatear números
            if (typeof cell.value === 'number') {
              cell.numFmt = '#,##0.00';
            }
            // Formatear fechas
            if (cell.value instanceof Date) {
              cell.numFmt = 'dd/mm/yyyy';
            }
            // Alternar colores de filas
            if (rowNumber % 2 === 0) {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF5F5F5' }
              };
            }
          }
        });
      });

      // Auto-filtro
      sheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: columns.length }
      };

      // Congelar primera fila
      sheet.views = [
        { state: 'frozen', xSplit: 0, ySplit: 1 }
      ];

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}.xlsx"`);
      res.setHeader('Cache-Control', 'no-cache');
      
      await workbook.xlsx.write(res);
      return res.end();
    }

   // ============================================
  // EXPORTAR A PDF (SOLUCIÓN FINAL - SIN PÁGINAS EN BLANCO)
  // ============================================
  if (formato === 'pdf') {
    const doc = new PDFDocument({ 
      margin: 30, 
      size: 'A4',
      layout: 'landscape',
      bufferPages: false,
      autoFirstPage: true  // ✅ CAMBIAR A TRUE
    });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}.pdf"`);
    res.setHeader('Cache-Control', 'no-cache');
    doc.pipe(res);

    // Configuración
    const pageWidth = 842;
    const pageHeight = 595;
    const margin = 30;
    const usableWidth = pageWidth - (margin * 2);
    
    // Preparar datos
    const headers = Object.keys(data[0]);
    const numColumns = Math.min(headers.length, 8);
    const cellWidth = usableWidth / numColumns;
    const rowHeight = 18;
    const headerHeight = 25;
    
    let currentY = 0;
    let pageNumber = 1;

    // ============================================
    // FUNCIÓN PARA DIBUJAR ENCABEZADO Y TABLA
    // ============================================
    const drawPageHeader = () => {
      currentY = margin;
      
      // Título
      doc.fontSize(18)
        .fillColor('#0066CC')
        .font('Helvetica-Bold')
        .text('Reporte de Datos', margin, currentY, { 
          align: 'center', 
          width: usableWidth 
        });
      
      currentY += 25;
      
      // Línea decorativa
      doc.moveTo(margin, currentY)
        .lineTo(pageWidth - margin, currentY)
        .lineWidth(2)
        .strokeColor('#0066CC')
        .stroke();
      
      currentY += 10;
      
      // Info del reporte
      doc.fontSize(8)
        .fillColor('#666666')
        .font('Helvetica');
      
      const infoY = currentY;
      doc.text(`Generado: ${new Date().toLocaleString('es-DO')}`, margin, infoY);
      doc.text(`Total de registros: ${data.length}`, pageWidth - margin - 150, infoY);
      
      currentY += 12;
      doc.text(`Reporte: ${nombre}`, margin, currentY);
      
      currentY += 25;
      
      // Encabezados de tabla
      doc.fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#FFFFFF');

      headers.slice(0, numColumns).forEach((header, index) => {
        const xPosition = margin + (index * cellWidth);
        
        doc.rect(xPosition, currentY, cellWidth, headerHeight)
          .fillAndStroke('#0066CC', '#003d82');
        
        const headerText = header.toUpperCase().replace(/_/g, ' ');
        const truncated = headerText.length > 12 ? headerText.substring(0, 10) + '...' : headerText;
        
        doc.fillColor('#FFFFFF')
          .font('Helvetica-Bold')
          .text(truncated, xPosition + 3, currentY + 8, {
            width: cellWidth - 6,
            align: 'center'
          });
      });

      currentY += headerHeight;
    };

    // ============================================
    // FUNCIÓN PARA PIE DE PÁGINA
    // ============================================
    const drawFooter = () => {
      const footerY = pageHeight - 25;
      
      doc.moveTo(margin, footerY - 5)
        .lineTo(pageWidth - margin, footerY - 5)
        .lineWidth(1)
        .strokeColor('#CCCCCC')
        .stroke();
      
      doc.fontSize(8)
        .fillColor('#666666')
        .font('Helvetica')
        .text(
          `Página ${pageNumber} | Sistema RRHH © ${new Date().getFullYear()}`,
          margin,
          footerY,
          { align: 'center', width: usableWidth }
        );
    };

    // ============================================
    // INICIAR PRIMERA PÁGINA
    // ============================================
    drawPageHeader();

    // ============================================
    // DIBUJAR FILAS DE DATOS
    // ============================================
    doc.fontSize(7).font('Helvetica');

    data.forEach((row, rowIndex) => {
      // ¿Necesitamos nueva página?
      if (currentY + rowHeight > pageHeight - 40) {
        // Dibujar pie ANTES de cambiar de página
        drawFooter();
        
        // AHORA SÍ cambiar de página
        doc.addPage();
        pageNumber++;
        
        // Dibujar encabezado de nueva página
        drawPageHeader();
      }

      // Color alternado
      const fillColor = rowIndex % 2 === 0 ? '#FFFFFF' : '#F8F9FA';

      headers.slice(0, numColumns).forEach((header, colIndex) => {
        const xPosition = margin + (colIndex * cellWidth);
        
        // Fondo de celda
        doc.rect(xPosition, currentY, cellWidth, rowHeight)
          .fillAndStroke(fillColor, '#E0E0E0');
        
        // Obtener valor
        let value = row[header];
        
        if (value === null || value === undefined) {
          value = '';
        } else if (typeof value === 'number') {
          value = value.toLocaleString('es-DO', { 
            minimumFractionDigits: 0,
            maximumFractionDigits: 2 
          });
        } else if (value instanceof Date) {
          value = value.toLocaleDateString('es-DO');
        } else {
          value = String(value);
        }
        
        // Truncar
        const maxChars = Math.floor(cellWidth / 3.5);
        if (value.length > maxChars) {
          value = value.substring(0, maxChars - 3) + '...';
        }
        
        // Dibujar texto - RESETEAR FUENTE SIEMPRE
        doc.fontSize(7)
          .font('Helvetica')
          .fillColor('#000000')
          .text(value, xPosition + 3, currentY + 4, {
            width: cellWidth - 6,
            align: typeof row[header] === 'number' ? 'right' : 'left',
            lineBreak: false
          });
      });

      currentY += rowHeight;
    });

    // ============================================
    // PIE DE PÁGINA FINAL
    // ============================================
    drawFooter();

    // ✅ FINALIZAR DOCUMENTO
    doc.end();
    return;
  }

  } catch (error) {
    console.error('Error en exportación:', error);
    res.status(500).json({ 
      error: 'Error al exportar el reporte',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ===================== REPORTES DE VACACIONES =====================

router.post('/vacaciones', async (req, res) => {
  try {
    const { 
      tipoVacaciones, 
      periodo,  // ✅ CAMBIÓ de 'anio' a 'periodo'
      direccionId, 
      departamentoId, 
      minimosDiasPendientes,
      ordenamiento 
    } = req.body;

    console.log('📊 Generando reporte de vacaciones:', tipoVacaciones);
    console.log('📅 Periodo solicitado:', periodo);

    // ✅ NUEVO: Procesar periodo
    let anio;
    if (!periodo || periodo === 'todos') {
      anio = null; // Consultar todos
    } else if (periodo.includes('-')) {
      // "2024-2025" -> tomar 2024
      anio = parseInt(periodo.split('-')[0]);
    } else {
      // "2024" -> usar directamente
      anio = parseInt(periodo);
    }

    // Si no hay año, usar actual
    if (!anio) {
      anio = new Date().getFullYear();
    }

    console.log('📅 Año procesado:', anio);

    // Mapeo de tipos de reporte a stored procedures
    const reportesMap = {
      'balance_general': {
        sp: 'sp_ReporteBalanceVacaciones',
        params: {
          Anio: anio,  // ✅ Usa el año procesado
          DireccionID: direccionId || null,
          DepartamentoID: departamentoId || null,
          MinimosDiasPendientes: minimosDiasPendientes || 0,
          Ordenamiento: ordenamiento || 'diasPendientes'
        }
      },
      'proximos_aniversarios': {
        sp: 'sp_ReporteProximosAniversarios',
        params: { DiasAdelante: 30 }
      },
      'pendientes_disfrutar': {
        sp: 'sp_ReporteVacacionesPendientes',
        params: { MinimosDias: minimosDiasPendientes || 10 }
      },
      'por_direccion': {
        sp: 'sp_ReporteVacacionesPorDireccion',
        params: {}
      },
      'por_departamento': {
        sp: 'sp_ReporteVacacionesPorDepartamento',
        params: { DireccionID: direccionId || null }
      },
      'estadisticas': {
        sp: 'sp_ReporteEstadisticasVacaciones',
        params: {}
      },
      'empleados_sin_balance': {
        sp: 'sp_ReporteEmpleadosSinBalance',
        params: {}
      }
    };

    const reporteConfig = reportesMap[tipoVacaciones];
    
    if (!reporteConfig) {
      return res.status(400).json({ 
        success: false, 
        error: 'Tipo de reporte no válido',
        tiposValidos: Object.keys(reportesMap)
      });
    }

    // Construir query
    const paramNames = Object.keys(reporteConfig.params);
    const paramString = paramNames
      .map(name => `@${name} = @${name}`)
      .join(', ');
    
    const query = paramString 
      ? `EXEC ${reporteConfig.sp} ${paramString}`
      : `EXEC ${reporteConfig.sp}`;

    console.log('🔍 Ejecutando:', query);

    // Ejecutar
    const pool = await getConnection();
    const request = pool.request();
    
    // Agregar parámetros dinámicamente
    Object.entries(reporteConfig.params).forEach(([name, value]) => {
      if (value !== null) {
        const sqlType = typeof value === 'number' ? sql.Int : sql.VarChar(50);
        request.input(name, sqlType, value);
      } else {
        request.input(name, sql.Int, null);
      }
    });

    const result = await request.query(query);
    
    console.log('✅ Reporte generado:', result.recordset.length, 'registros');

    res.json({ 
      success: true, 
      data: result.recordset,
      count: result.recordset.length,
      reporte: tipoVacaciones,
      periodo: periodo,  // ✅ NUEVO
      anioConsultado: anio,  // ✅ NUEVO
      fechaGeneracion: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error en reporte de vacaciones:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error generando reporte de vacaciones',
      details: error.message 
    });
  }
});

// ===================== ENDPOINT DIRECCIONES =====================

router.get('/direcciones', async (req, res) => {
  try {
    console.log('📍 Obteniendo direcciones...');

    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT DireccionID, Nombre, Orden
      FROM Direcciones
      ORDER BY Orden, Nombre
    `);
    
    console.log('✅ Direcciones obtenidas:', result.recordset.length);
    res.json(result.recordset);

  } catch (error) {
    console.error('❌ Error obteniendo direcciones:', error);
    res.status(500).json({ 
      error: 'Error al obtener direcciones',
      details: error.message 
    });
  }
});

export default router;