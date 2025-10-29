// backend/controllers/reportesController.js
import ExcelJS from "exceljs";
import { Parser } from "json2csv";
import PDFDocument from "pdfkit";
import jwt from "jsonwebtoken";
import { executeQuery, getConnection } from "../db.js";
import fs from "fs/promises";
import path from "path";

// ===================== CONFIGURACIÓN =====================
const JWT_SECRET = process.env.JWT_SECRET || "tu-secreto-jwt-muy-seguro";
const MAX_QUERY_LENGTH = 5000;
const MAX_RESULTS = 10000;

// ===================== UTILIDADES =====================
const logActivity = (userId, action, details = "") => {
  console.log(`[${new Date().toISOString()}] Usuario ${userId}: ${action} - ${details}`);
};

const validateQuerySafety = (query) => {
  const queryLower = query.toLowerCase().trim();
  
  // Debe empezar con SELECT
  if (!queryLower.startsWith("select")) {
    throw new Error("Solo se permiten consultas SELECT");
  }

  // Palabras prohibidas
  const prohibidas = [
    'drop', 'delete', 'insert', 'update', 'truncate', 'alter', 'create',
    'exec', 'execute', 'xp_', 'sp_', 'grant', 'revoke', 'shutdown'
  ];
  
  for (const palabra of prohibidas) {
    if (queryLower.includes(palabra)) {
      throw new Error(`Operación no permitida: ${palabra}`);
    }
  }

  // Verificar longitud
  if (query.length > MAX_QUERY_LENGTH) {
    throw new Error(`Query muy largo. Máximo ${MAX_QUERY_LENGTH} caracteres`);
  }

  return true;
};

// ===================== MIDDLEWARE DE AUTENTICACIÓN =====================
export const verificarToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: "Token de acceso requerido",
        details: "Header Authorization con formato 'Bearer <token>' requerido"
      });
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return res.status(401).json({ 
        error: "Token vacío",
        details: "No se proporcionó un token válido"
      });
    }

    // Verificar JWT
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = {
        id: decoded.id || decoded.userId || 'usuario_jwt',
        role: decoded.role || 'user',
        name: decoded.name || decoded.username || 'Usuario'
      };
      
      logActivity(req.user.id, "Token verificado", `Rol: ${req.user.role}`);
      next();
    } catch (jwtError) {
      console.warn('Error JWT:', jwtError.message);
      
      // Fallback para tokens simples (compatibilidad temporal)
      if (token.length >= 10 && !token.includes('.')) {
        req.user = { 
          id: `user_${Date.now()}`, 
          role: 'user', 
          name: 'Usuario Demo' 
        };
        
        logActivity(req.user.id, "Token simple verificado");
        next();
      } else {
        return res.status(401).json({ 
          error: "Token inválido",
          details: "Token expirado o malformado"
        });
      }
    }
    
  } catch (error) {
    console.error('Error en verificación de token:', error);
    return res.status(401).json({ 
      error: "Error de autenticación",
      details: error.message
    });
  }
};

// ===================== REPORTES GUARDADOS =====================
export const getReportesGuardados = async (req, res) => {
  try {
    const usuarioId = req.user?.id || 'sistema';
    logActivity(usuarioId, "Consultando reportes guardados");

    const query = `
      SELECT 
        r.ReporteID as id,
        r.Nombre as nombre,
        r.Origen as origen,
        r.Descripcion as descripcion,
        r.Configuracion as configuracion,
        r.FechaCreacion as fechaCreacion,
        r.FechaModificacion as fechaModificacion,
        COALESCE(u.Username, 'Sistema') as modificadoPor,
        r.EsPredeterminado as predeterminado,
        r.EliminarDuplicados as eliminarDuplicados
      FROM ReportesPersonalizados r
      LEFT JOIN Usuarios u ON r.ModificadoPor = u.UsuarioID
      WHERE r.Estado = 1
      ORDER BY r.FechaModificacion DESC
    `;

    const pool = await getConnection();
    const request = pool.request();
    const result = await request.query(query);
    
    // Procesar configuración JSON
    const reportes = result.recordset.map(reporte => ({
      ...reporte,
      configuracion: reporte.configuracion ? 
        (typeof reporte.configuracion === 'string' ? 
          JSON.parse(reporte.configuracion) : reporte.configuracion) : null,
      fechaCreacion: reporte.fechaCreacion?.toISOString().split('T')[0],
      fechaModificacion: reporte.fechaModificacion?.toISOString().split('T')[0]
    }));

    logActivity(usuarioId, "Reportes obtenidos", `${reportes.length} encontrados`);
    res.json(reportes);

  } catch (error) {
    console.error("Error en getReportesGuardados:", error);
    res.status(500).json({ 
      error: "Error al obtener reportes guardados",
      details: error.message
    });
  }
};

export const guardarReporte = async (req, res) => {
  try {
    const { nombre, origen, descripcion, predeterminado, eliminarDuplicados, configuracion } = req.body;

    if (!nombre?.trim() || !origen?.trim()) {
      return res.status(400).json({ 
        error: "Datos incompletos",
        details: "Nombre y origen son requeridos"
      });
    }

    // Verificar que el usuario esté autenticado
    const usuarioId = req.user?.id || 'sistema';
    
    logActivity(usuarioId, "Guardando reporte", nombre);

    const query = `
      INSERT INTO ReportesPersonalizados 
      (Nombre, Origen, Descripcion, Configuracion, EsPredeterminado, EliminarDuplicados, 
       FechaCreacion, FechaModificacion, ModificadoPor, Estado)
      OUTPUT INSERTED.ReporteID
      VALUES (@nombre, @origen, @descripcion, @configuracion, @predeterminado, @eliminarDuplicados, GETDATE(), GETDATE(), @usuarioId, 1)
    `;

    const configuracionJson = configuracion ? JSON.stringify(configuracion) : null;
    
    // Usar el pool directamente con parámetros nombrados
    const pool = await getConnection();
    const request = pool.request();
    
    // Agregar parámetros nombrados
    request.input('nombre', nombre.trim());
    request.input('origen', origen.trim());
    request.input('descripcion', descripcion?.trim() || null);
    request.input('configuracion', configuracionJson);
    request.input('predeterminado', predeterminado || false);
    request.input('eliminarDuplicados', eliminarDuplicados || false);
    request.input('usuarioId', usuarioId);

    const result = await request.query(query);

    const nuevoReporte = {
      id: result.recordset[0].ReporteID,
      nombre: nombre.trim(),
      origen: origen.trim(),
      descripcion: descripcion?.trim(),
      fechaCreacion: new Date().toISOString().split('T')[0],
      fechaModificacion: new Date().toISOString().split('T')[0],
      modificadoPor: req.user?.name || 'Usuario',
      predeterminado: predeterminado || false,
      eliminarDuplicados: eliminarDuplicados || false,
      configuracion
    };

    logActivity(usuarioId, "Reporte guardado", `ID: ${nuevoReporte.id}`);
    res.status(201).json(nuevoReporte);

  } catch (error) {
    console.error("Error en guardarReporte:", error);
    res.status(500).json({ 
      error: "Error al guardar el reporte",
      details: error.message
    });
  }
};

export const actualizarReporte = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, configuracion } = req.body;

    if (!id || !nombre?.trim()) {
      return res.status(400).json({ 
        error: "Datos incompletos",
        details: "ID y nombre son requeridos"
      });
    }

    const usuarioId = req.user?.id || 'sistema';
    logActivity(usuarioId, "Actualizando reporte", `ID: ${id}`);

    const query = `
      UPDATE ReportesPersonalizados 
      SET Nombre = @nombre, Descripcion = @descripcion, Configuracion = @configuracion, 
          FechaModificacion = GETDATE(), ModificadoPor = @usuarioId
      WHERE ReporteID = @id AND Estado = 1
    `;

    const configuracionJson = configuracion ? JSON.stringify(configuracion) : null;
    
    const pool = await getConnection();
    const request = pool.request();
    
    request.input('nombre', nombre.trim());
    request.input('descripcion', descripcion?.trim() || null);
    request.input('configuracion', configuracionJson);
    request.input('usuarioId', usuarioId);
    request.input('id', id);

    await request.query(query);

    logActivity(usuarioId, "Reporte actualizado", `ID: ${id}`);
    res.json({ message: "Reporte actualizado correctamente" });

  } catch (error) {
    console.error("Error en actualizarReporte:", error);
    res.status(500).json({ 
      error: "Error al actualizar el reporte",
      details: error.message
    });
  }
};

export const eliminarReporte = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ 
        error: "ID requerido",
        details: "Se debe proporcionar el ID del reporte"
      });
    }

    const usuarioId = req.user?.id || 'sistema';
    logActivity(usuarioId, "Eliminando reporte", `ID: ${id}`);

    // Eliminación lógica
    const query = `
      UPDATE ReportesPersonalizados 
      SET Estado = 0, FechaModificacion = GETDATE(), ModificadoPor = @usuarioId
      WHERE ReporteID = @id
    `;
    
    const pool = await getConnection();
    const request = pool.request();
    
    request.input('usuarioId', usuarioId);
    request.input('id', id);

    await request.query(query);

    logActivity(usuarioId, "Reporte eliminado", `ID: ${id}`);
    res.json({ message: "Reporte eliminado correctamente" });

  } catch (error) {
    console.error("Error en eliminarReporte:", error);
    res.status(500).json({ 
      error: "Error al eliminar el reporte",
      details: error.message
    });
  }
};

// ===================== REPORTES PREDEFINIDOS =====================
export const getPredefinidos = async (req, res) => {
  const { tipo } = req.params;
  const usuarioId = req.user?.id || 'sistema';
  
  logActivity(usuarioId, "Ejecutando reporte predefinido", tipo);

  const reportesPredefinidos = {
    empleados_por_departamento: {
      query: `
        SELECT 
          d.Nombre AS departamento,
          COUNT(e.EmpleadoID) AS total_empleados,
          AVG(CAST(e.Salario AS FLOAT)) AS salario_promedio
        FROM Empleados e
        INNER JOIN Departamentos d ON e.DepartamentoID = d.DepartamentoID
        WHERE e.Estado = 1
        GROUP BY d.Nombre, d.DepartamentoID
        ORDER BY total_empleados DESC
      `,
      descripcion: "Distribución de empleados por departamento con salario promedio"
    },
    
    vacantes_abiertas: {
      query: `
        SELECT 
          v.Puesto,
          COUNT(*) AS total_vacantes,
          MIN(v.FechaPublicacion) AS primera_publicacion,
          MAX(v.FechaPublicacion) AS ultima_publicacion
        FROM Vacantes v
        WHERE v.Estado = 'Abierta'
        GROUP BY v.Puesto
        ORDER BY total_vacantes DESC
      `,
      descripcion: "Vacantes abiertas agrupadas por puesto"
    },

    contrataciones_mensuales: {
      query: `
        SELECT 
          FORMAT(e.FechaIngreso, 'yyyy-MM') AS mes,
          COUNT(*) AS contrataciones,
          STRING_AGG(d.Nombre, ', ') AS departamentos
        FROM Empleados e
        INNER JOIN Departamentos d ON e.DepartamentoID = d.DepartamentoID
        WHERE e.FechaIngreso >= DATEADD(MONTH, -12, GETDATE())
        GROUP BY FORMAT(e.FechaIngreso, 'yyyy-MM')
        ORDER BY mes DESC
      `,
      descripcion: "Contrataciones por mes en los últimos 12 meses"
    }
  };

  const reporte = reportesPredefinidos[tipo];
  
  if (!reporte) {
    return res.status(400).json({ 
      error: "Reporte no encontrado",
      tiposDisponibles: Object.keys(reportesPredefinidos),
      descriptions: Object.fromEntries(
        Object.entries(reportesPredefinidos).map(([key, value]) => [key, value.descripcion])
      )
    });
  }

  try {
    const pool = await getConnection();
    const request = pool.request();
    const result = await request.query(reporte.query);
    
    if (!result.recordset) {
      return res.status(500).json({ error: "No se obtuvieron resultados" });
    }

    logActivity(usuarioId, "Reporte predefinido ejecutado", 
      `${tipo} - ${result.recordset.length} registros`);
    
    res.json({
      tipo,
      descripcion: reporte.descripcion,
      data: result.recordset,
      total: result.recordset.length,
      fechaEjecucion: new Date().toISOString()
    });

  } catch (error) {
    console.error(`Error en reporte predefinido ${tipo}:`, error);
    res.status(500).json({ 
      error: "Error al generar el reporte predefinido",
      details: error.message,
      tipo
    });
  }
};

// ===================== REPORTES SQL PERSONALIZADOS =====================
export const ejecutarQuery = async (req, res) => {
  try {
    const { sqlQuery, limite = 1000 } = req.body;

    if (!sqlQuery?.trim()) {
      return res.status(400).json({ 
        error: "Query SQL requerido",
        details: "Debe proporcionarse una consulta SQL válida"
      });
    }

    const usuarioId = req.user?.id || 'sistema';
    logActivity(usuarioId, "Ejecutando query personalizado", `Longitud: ${sqlQuery.length} chars`);

    // Validar seguridad
    validateQuerySafety(sqlQuery);

    // Agregar límite si no existe
    let queryFinal = sqlQuery.trim();
    if (!queryFinal.toLowerCase().includes('top ') && 
        !queryFinal.toLowerCase().includes('limit ')) {
      
      const selectMatch = queryFinal.match(/^select\s+/i);
      if (selectMatch) {
        queryFinal = queryFinal.replace(/^select\s+/i, 
          `SELECT TOP ${Math.min(limite, MAX_RESULTS)} `);
      }
    }

    console.log('Ejecutando query:', queryFinal);

    const startTime = Date.now();
    
    // Usar conexión directa sin parámetros
    const pool = await getConnection();
    const request = pool.request();
    const result = await request.query(queryFinal);
    
    const executionTime = Date.now() - startTime;
    
    if (!result.recordset) {
      return res.status(500).json({ error: "No se obtuvieron resultados de la consulta" });
    }

    logActivity(usuarioId, "Query ejecutado exitosamente", 
      `${result.recordset.length} registros en ${executionTime}ms`);

    res.json({
      data: result.recordset,
      total: result.recordset.length,
      executionTime,
      query: queryFinal,
      fechaEjecucion: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error en ejecutarQuery:", error);
    
    // Diferentes tipos de error
    let statusCode = 500;
    if (error.message.includes('no permitida') || 
        error.message.includes('Query muy largo')) {
      statusCode = 400;
    }

    res.status(statusCode).json({ 
      error: "Error al ejecutar la consulta",
      details: error.message,
      query: req.body.sqlQuery
    });
  }
};

// ===================== METADATOS PARA CONSTRUCTOR =====================
export const getMetadata = async (req, res) => {
  try {
    const usuarioId = req.user?.id || 'sistema';
    logActivity(usuarioId, "Consultando metadata de DB");
    
    const connection = await getConnection();
    if (!connection) {
      throw new Error("No se pudo establecer conexión con la base de datos");
    }

    const query = `
      SELECT 
        t.TABLE_NAME,
        c.COLUMN_NAME,
        c.DATA_TYPE,
        c.IS_NULLABLE,
        c.COLUMN_DEFAULT,
        c.CHARACTER_MAXIMUM_LENGTH,
        c.NUMERIC_PRECISION,
        c.NUMERIC_SCALE,
        CASE WHEN pk.COLUMN_NAME IS NOT NULL THEN 'YES' ELSE 'NO' END as IS_PRIMARY_KEY
      FROM INFORMATION_SCHEMA.TABLES t
      INNER JOIN INFORMATION_SCHEMA.COLUMNS c ON t.TABLE_NAME = c.TABLE_NAME
      LEFT JOIN (
        SELECT ku.TABLE_NAME, ku.COLUMN_NAME
        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
        INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku
          ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
        WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
      ) pk ON c.TABLE_NAME = pk.TABLE_NAME AND c.COLUMN_NAME = pk.COLUMN_NAME
      WHERE t.TABLE_SCHEMA = 'dbo' 
        AND t.TABLE_TYPE = 'BASE TABLE'
        AND t.TABLE_NAME NOT LIKE 'sys%'
      ORDER BY t.TABLE_NAME, c.ORDINAL_POSITION
    `;

    const result = await connection.request().query(query);

    if (!result.recordset) {
      throw new Error("No se pudo obtener la estructura de la base de datos");
    }

    // Estructurar datos
    const tablas = {};
    const relacionesQuery = `
      SELECT 
        fk.name AS ForeignKey,
        tp.name AS ParentTable,
        cp.name AS ParentColumn,
        tr.name AS ReferencedTable,
        cr.name AS ReferencedColumn
      FROM sys.foreign_keys fk
      INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
      INNER JOIN sys.tables tp ON fkc.parent_object_id = tp.object_id
      INNER JOIN sys.columns cp ON fkc.parent_object_id = cp.object_id AND fkc.parent_column_id = cp.column_id
      INNER JOIN sys.tables tr ON fkc.referenced_object_id = tr.object_id
      INNER JOIN sys.columns cr ON fkc.referenced_object_id = cr.object_id AND fkc.referenced_column_id = cr.column_id
    `;

    const relacionesResult = await connection.request().query(relacionesQuery);

    // Procesar columnas
    result.recordset.forEach(row => {
      if (!tablas[row.TABLE_NAME]) {
        tablas[row.TABLE_NAME] = {
          columns: [],
          relationships: []
        };
      }
      
      tablas[row.TABLE_NAME].columns.push({
        name: row.COLUMN_NAME,
        type: row.DATA_TYPE,
        nullable: row.IS_NULLABLE === 'YES',
        isPrimaryKey: row.IS_PRIMARY_KEY === 'YES',
        maxLength: row.CHARACTER_MAXIMUM_LENGTH,
        precision: row.NUMERIC_PRECISION,
        scale: row.NUMERIC_SCALE,
        defaultValue: row.COLUMN_DEFAULT
      });
    });

    // Procesar relaciones
    if (relacionesResult.recordset) {
      relacionesResult.recordset.forEach(rel => {
        if (tablas[rel.ParentTable]) {
          tablas[rel.ParentTable].relationships.push({
            type: 'foreign_key',
            column: rel.ParentColumn,
            referencedTable: rel.ReferencedTable,
            referencedColumn: rel.ReferencedColumn,
            name: rel.ForeignKey
          });
        }
      });
    }

    // Para compatibilidad con frontend actual
    const estructuraSimplificada = {};
    Object.keys(tablas).forEach(tabla => {
      estructuraSimplificada[tabla] = tablas[tabla].columns.map(col => col.name);
    });

    logActivity(usuarioId, "Metadata obtenida", 
      `${Object.keys(tablas).length} tablas, ${result.recordset.length} columnas`);

    res.json({
      simplified: estructuraSimplificada,
      detailed: tablas,
      stats: {
        totalTables: Object.keys(tablas).length,
        totalColumns: result.recordset.length,
        totalRelationships: relacionesResult.recordset?.length || 0
      }
    });

  } catch (error) {
    console.error("Error en getMetadata:", error);
    res.status(500).json({ 
      error: "Error al obtener la estructura de la base de datos",
      details: error.message
    });
  }
};

// ===================== EXPORTAR REPORTES =====================
export const exportarReporte = async (req, res) => {
  try {
    const { formato, data, nombre = "reporte" } = req.body;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ 
        error: "No hay datos para exportar",
        details: "Se requiere un array con datos válidos"
      });
    }

    const usuarioId = req.user?.id || 'sistema';
    logActivity(usuarioId, `Exportando reporte en ${formato}`, `${data.length} registros`);

    const formatosPermitidos = ['csv', 'excel', 'pdf', 'json'];
    if (!formatosPermitidos.includes(formato)) {
      return res.status(400).json({ 
        error: "Formato no soportado",
        formatosDisponibles: formatosPermitidos
      });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${nombre}_${timestamp}`;

    switch (formato) {
      case "csv":
        const parser = new Parser({ 
          delimiter: ',',
          header: true,
          encoding: 'utf8'
        });
        const csv = parser.parse(data);
        
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="${fileName}.csv"`);
        res.setHeader("Cache-Control", "no-cache");
        
        return res.send('\uFEFF' + csv); // BOM para UTF-8

      case "json":
        const jsonData = JSON.stringify({
          data,
          metadata: {
            totalRecords: data.length,
            exportDate: new Date().toISOString(),
            exportedBy: req.user?.name || req.user?.id || 'Sistema'
          }
        }, null, 2);
        
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Content-Disposition", `attachment; filename="${fileName}.json"`);
        
        return res.send(jsonData);

      case "excel":
        const workbook = new ExcelJS.Workbook();
        workbook.creator = req.user?.name || 'Sistema RRHH';
        workbook.created = new Date();
        
        const sheet = workbook.addWorksheet("Reporte", {
          properties: { tabColor: { argb: 'FF0066CC' } }
        });

        // Configurar columnas
        const columns = Object.keys(data[0]).map(key => ({ 
          header: key.toUpperCase().replace(/_/g, ' '), 
          key,
          width: Math.min(Math.max(key.length + 5, 15), 30)
        }));
        
        sheet.columns = columns;
        
        // Agregar datos
        sheet.addRows(data);

        // Estilos
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF0066CC' }
        };

        // Bordes y formato
        sheet.eachRow((row, rowNumber) => {
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
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
            }
          });
        });

        // Auto-filtro
        sheet.autoFilter = {
          from: 'A1',
          to: `${String.fromCharCode(65 + columns.length - 1)}1`
        };

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="${fileName}.xlsx"`);
        
        await workbook.xlsx.write(res);
        return res.end();

      case "pdf":
        const doc = new PDFDocument({ 
          margin: 30, 
          size: "A4",
          layout: 'landscape', // ✅ HORIZONTAL para más columnas
          bufferPages: true,
          autoFirstPage: false
        });
        
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${fileName}.pdf"`);
        doc.pipe(res);

        doc.addPage();
        
        // ============= ENCABEZADO =============
        doc.fontSize(16).fillColor('#0066CC').text('Reporte de Datos', { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(9).fillColor('black')
           .text(`Generado: ${new Date().toLocaleString('es-DO')}`, { align: 'right' });
        doc.text(`Total de registros: ${data.length}`, { align: 'right' });
        doc.moveDown(0.5);

        // Línea separadora
        doc.moveTo(30, doc.y).lineTo(810, doc.y).stroke();
        doc.moveDown(0.5);

        // ============= TABLA CON TODAS LAS COLUMNAS =============
        const columnas = Object.keys(data[0]);
        const numColumnas = columnas.length;
        
        // Calcular ancho disponible
        const anchoDisponible = 810 - 60; // Margen izq + der
        const anchoCelda = anchoDisponible / numColumnas;
        
        let yPos = doc.y;
        const rowHeight = 20;
        const headerHeight = 25;
        
        // Función para verificar si necesita nueva página
        const checkNewPage = () => {
          if (yPos > 550) { // Límite antes del pie de página
            doc.addPage();
            yPos = 30;
            // Redibujar encabezados en nueva página
            dibujarEncabezados();
          }
        };
        
        // Función para dibujar encabezados
        const dibujarEncabezados = () => {
          doc.fontSize(7).fillColor('white');
          columnas.forEach((col, index) => {
            const xPos = 30 + (index * anchoCelda);
            
            // Fondo azul
            doc.rect(xPos, yPos, anchoCelda, headerHeight)
               .fill('#0066CC');
            
            // Texto del encabezado
            doc.fillColor('white')
               .text(
                 col.toUpperCase().replace(/_/g, ' '), 
                 xPos + 2, 
                 yPos + 5, 
                 { 
                   width: anchoCelda - 4, 
                   align: 'center',
                   ellipsis: true
                 }
               );
          });
          
          yPos += headerHeight;
          doc.fillColor('black');
        };
        
        // Dibujar encabezados iniciales
        dibujarEncabezados();
        
        // ============= DATOS =============
        data.forEach((row, rowIndex) => {
          checkNewPage();
          
          // Alternar color de fila
          const fillColor = rowIndex % 2 === 0 ? '#F8F9FA' : '#FFFFFF';
          doc.rect(30, yPos, anchoDisponible, rowHeight).fill(fillColor);
          
          doc.fontSize(6).fillColor('black');
          
          columnas.forEach((col, colIndex) => {
            const xPos = 30 + (colIndex * anchoCelda);
            let valor = row[col];
            
            // Formatear valores
            if (valor === null || valor === undefined) {
              valor = '-';
            } else if (typeof valor === 'number') {
              // Si es un número con decimales, formatear
              valor = Number.isInteger(valor) 
                ? valor.toString() 
                : valor.toFixed(2);
            } else if (valor instanceof Date) {
              valor = valor.toLocaleDateString('es-DO');
            } else {
              valor = String(valor);
            }
            
            // Dibujar borde de celda
            doc.rect(xPos, yPos, anchoCelda, rowHeight).stroke('#E0E0E0');
            
            // Texto de la celda
            doc.text(
              valor, 
              xPos + 2, 
              yPos + 5, 
              { 
                width: anchoCelda - 4, 
                align: 'left',
                ellipsis: true
              }
            );
          });
          
          yPos += rowHeight;
        });

        // ============= PIE DE PÁGINA =============
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
          doc.switchToPage(i);
          doc.fontSize(7).fillColor('gray')
             .text(
               `Página ${i + 1} de ${pageCount} | Sistema RRHH - ${new Date().getFullYear()}`, 
               30, 
               560, 
               { align: 'center', width: 750 }
             );
        }

        doc.end();
        return;

      default:
        throw new Error("Formato no implementado");
    }

  } catch (error) {
    console.error("Error en exportarReporte:", error);
    res.status(500).json({ 
      error: "Error al exportar el reporte",
      details: error.message,
      formato
    });
  }
};

// ===================== ESTADÍSTICAS Y UTILIDADES =====================
export const getEstadisticas = async (req, res) => {
  try {
    const usuarioId = req.user?.id || 'sistema';
    logActivity(usuarioId, "Consultando estadísticas");

    const queries = {
      reportesGuardados: "SELECT COUNT(*) as total FROM ReportesPersonalizados WHERE Estado = 1",
      reportesEjecutadosHoy: `
        SELECT COUNT(*) as total FROM LogReportes 
        WHERE CAST(FechaEjecucion AS DATE) = CAST(GETDATE() AS DATE)
      `,
      usuariosActivos: "SELECT COUNT(*) as total FROM Usuarios WHERE Estado = 1",
      tablasDisponibles: `
        SELECT COUNT(*) as total FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = 'dbo' AND TABLE_TYPE = 'BASE TABLE'
      `
    };

    const resultados = {};
    
    for (const [key, query] of Object.entries(queries)) {
      try {
        const pool = await getConnection();
        const request = pool.request();
        const result = await request.query(query);
        resultados[key] = result.recordset[0]?.total || 0;
      } catch (error) {
        console.warn(`Error en consulta ${key}:`, error.message);
        resultados[key] = 0;
      }
    }

    logActivity(usuarioId, "Estadísticas obtenidas", JSON.stringify(resultados));
    
    res.json({
      ...resultados,
      fechaConsulta: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error en getEstadisticas:", error);
    res.status(500).json({ 
      error: "Error al obtener estadísticas",
      details: error.message
    });
  }
};

// ===================== VALIDACIÓN DE CONSULTAS =====================
export const validarQuery = async (req, res) => {
  try {
    const { sqlQuery } = req.body;

    if (!sqlQuery?.trim()) {
      return res.status(400).json({ 
        error: "Query requerido",
        details: "Debe proporcionarse una consulta SQL para validar"
      });
    }

    const usuarioId = req.user?.id || 'sistema';
    logActivity(usuarioId, "Validando query", `Longitud: ${sqlQuery.length}`);

    // Validar sintaxis básica
    const validationResult = {
      isValid: false,
      errors: [],
      warnings: [],
      suggestions: []
    };

    try {
      // Validar seguridad
      validateQuerySafety(sqlQuery);
      
      // Análisis básico de sintaxis
      const queryLower = sqlQuery.toLowerCase().trim();
      
      // Verificar estructura básica
      if (!queryLower.includes('from')) {
        validationResult.warnings.push("Query no contiene cláusula FROM");
      }
      
      // Verificar posibles problemas de rendimiento
      if (queryLower.includes('select *')) {
        validationResult.warnings.push("Usar SELECT * puede afectar el rendimiento. Considera especificar columnas exactas.");
      }
      
      if (!queryLower.includes('top ') && !queryLower.includes('limit')) {
        validationResult.suggestions.push("Considera agregar TOP N para limitar resultados");
      }

      // Si llegamos aquí, la validación básica pasó
      validationResult.isValid = true;
      
    } catch (error) {
      validationResult.errors.push(error.message);
    }

    logActivity(usuarioId, "Query validado", 
      `Válido: ${validationResult.isValid}, Errores: ${validationResult.errors.length}`);

    res.json(validationResult);

  } catch (error) {
    console.error("Error en validarQuery:", error);
    res.status(500).json({ 
      error: "Error al validar la consulta",
      details: error.message
    });
  }
};

// ===================== HISTORIAL DE REPORTES =====================
export const getHistorialReportes = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const usuarioId = req.user?.id || 'sistema';

    logActivity(usuarioId, "Consultando historial de reportes", `Página: ${page}`);

    const query = `
      SELECT 
        h.HistorialID,
        h.TipoReporte,
        h.NombreReporte,
        h.SqlEjecutado,
        h.TotalRegistros,
        h.TiempoEjecucion,
        h.FechaEjecucion,
        COALESCE(u.Username, 'Sistema') as EjecutadoPor,
        h.Estado
      FROM HistorialReportes h
      LEFT JOIN Usuarios u ON h.UsuarioID = u.UsuarioID
      WHERE h.UsuarioID = @usuarioId OR h.UsuarioID IS NULL
      ORDER BY h.FechaEjecucion DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `;

    const countQuery = `
      SELECT COUNT(*) as total 
      FROM HistorialReportes 
      WHERE UsuarioID = @usuarioId OR UsuarioID IS NULL
    `;

    const pool = await getConnection();
    
    const historialRequest = pool.request();
    historialRequest.input('usuarioId', usuarioId);
    historialRequest.input('offset', offset);
    historialRequest.input('limit', parseInt(limit));
    
    const countRequest = pool.request();
    countRequest.input('usuarioId', usuarioId);

    const [historialResult, countResult] = await Promise.all([
      historialRequest.query(query),
      countRequest.query(countQuery)
    ]);

    const historial = historialResult.recordset.map(item => ({
      ...item,
      FechaEjecucion: item.FechaEjecucion?.toISOString(),
      SqlEjecutado: item.SqlEjecutado?.substring(0, 200) + (item.SqlEjecutado?.length > 200 ? '...' : '')
    }));

    const total = countResult.recordset[0]?.total || 0;

    res.json({
      historial,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        recordsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error("Error en getHistorialReportes:", error);
    res.status(500).json({ 
      error: "Error al obtener el historial",
      details: error.message
    });
  }
};

// ===================== PLANTILLAS DE REPORTES =====================
export const getPlantillas = async (req, res) => {
  try {
    const usuarioId = req.user?.id || 'sistema';
    logActivity(usuarioId, "Consultando plantillas de reportes");

    const plantillas = [
      {
        id: 'empleados_basico',
        nombre: 'Listado Básico de Empleados',
        descripcion: 'Lista todos los empleados activos con información básica',
        categoria: 'Recursos Humanos',
        sql: `SELECT 
          e.EmpleadoID,
          e.Nombre,
          e.Apellido,
          e.Email,
          e.Puesto,
          d.Nombre as Departamento,
          e.FechaIngreso
        FROM Empleados e
        INNER JOIN Departamentos d ON e.DepartamentoID = d.DepartamentoID
        WHERE e.Estado = 1
        ORDER BY e.Apellido, e.Nombre`,
        campos: ['EmpleadoID', 'Nombre', 'Apellido', 'Email', 'Puesto', 'Departamento', 'FechaIngreso']
      },
      {
        id: 'departamentos_resumen',
        nombre: 'Resumen por Departamentos',
        descripcion: 'Estadísticas agregadas por departamento',
        categoria: 'Análisis',
        sql: `SELECT 
          d.Nombre as Departamento,
          COUNT(e.EmpleadoID) as TotalEmpleados,
          AVG(CAST(e.Salario as FLOAT)) as SalarioPromedio,
          MIN(e.FechaIngreso) as PrimeraContratacion,
          MAX(e.FechaIngreso) as UltimaContratacion
        FROM Departamentos d
        LEFT JOIN Empleados e ON d.DepartamentoID = e.DepartamentoID AND e.Estado = 1
        GROUP BY d.DepartamentoID, d.Nombre
        ORDER BY TotalEmpleados DESC`,
        campos: ['Departamento', 'TotalEmpleados', 'SalarioPromedio', 'PrimeraContratacion', 'UltimaContratacion']
      },
      {
        id: 'vacantes_resumen',
        nombre: 'Estado de Vacantes',
        descripcion: 'Resumen del estado actual de todas las vacantes',
        categoria: 'Reclutamiento',
        sql: `SELECT 
          v.Estado,
          COUNT(*) as TotalVacantes,
          AVG(DATEDIFF(day, v.FechaPublicacion, GETDATE())) as DiasPromedioAbiertas
        FROM Vacantes v
        GROUP BY v.Estado
        ORDER BY TotalVacantes DESC`,
        campos: ['Estado', 'TotalVacantes', 'DiasPromedioAbiertas']
      }
    ];

    res.json({
      plantillas,
      total: plantillas.length,
      categorias: [...new Set(plantillas.map(p => p.categoria))]
    });

  } catch (error) {
    console.error("Error en getPlantillas:", error);
    res.status(500).json({ 
      error: "Error al obtener plantillas",
      details: error.message
    });
  }
};

export const aplicarPlantilla = async (req, res) => {
  try {
    const { plantillaId, parametros = {} } = req.body;
    const usuarioId = req.user?.id || 'sistema';

    if (!plantillaId) {
      return res.status(400).json({ 
        error: "ID de plantilla requerido",
        details: "Debe especificar qué plantilla aplicar"
      });
    }

    logActivity(usuarioId, "Aplicando plantilla", plantillaId);

    // Plantillas predefinidas (en una implementación real estarían en BD)
    const plantillasPredefinidas = {
      'empleados_basico': {
        PlantillaID: 'empleados_basico',
        Nombre: 'Listado Básico de Empleados',
        SqlTemplate: `SELECT 
          e.EmpleadoID,
          e.Nombre,
          e.Apellido,
          e.Email,
          e.Puesto,
          d.Nombre as Departamento,
          e.FechaIngreso
        FROM Empleados e
        INNER JOIN Departamentos d ON e.DepartamentoID = d.DepartamentoID
        WHERE e.Estado = 1
        ORDER BY e.Apellido, e.Nombre`
      }
    };

    const plantilla = plantillasPredefinidas[plantillaId];
    
    if (!plantilla) {
      return res.status(404).json({ 
        error: "Plantilla no encontrada",
        details: `No existe una plantilla con ID: ${plantillaId}`,
        disponibles: Object.keys(plantillasPredefinidas)
      });
    }
    
    // Reemplazar parámetros en la plantilla SQL
    let sqlFinal = plantilla.SqlTemplate;
    Object.entries(parametros).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      sqlFinal = sqlFinal.replace(new RegExp(placeholder, 'g'), value);
    });

    // Ejecutar la consulta
    const pool = await getConnection();
    const request = pool.request();
    const result = await request.query(sqlFinal);

    logActivity(usuarioId, "Plantilla aplicada", 
      `${plantillaId} - ${result.recordset.length} registros`);

    res.json({
      plantilla: {
        id: plantilla.PlantillaID,
        nombre: plantilla.Nombre
      },
      data: result.recordset,
      total: result.recordset.length,
      sqlEjecutado: sqlFinal,
      parametrosUsados: parametros
    });

  } catch (error) {
    console.error("Error en aplicarPlantilla:", error);
    res.status(500).json({ 
      error: "Error al aplicar plantilla",
      details: error.message
    });
  }
};

// ===================== CONFIGURACIÓN Y PREFERENCIAS =====================
export const getConfiguracion = async (req, res) => {
  try {
    const usuarioId = req.user?.id || 'sistema';
    logActivity(usuarioId, "Consultando configuración de usuario");

    const query = `
      SELECT 
        ConfiguracionKey,
        ConfiguracionValue,
        FechaModificacion
      FROM ConfiguracionUsuario 
      WHERE UsuarioID = @usuarioId
    `;

    const pool = await getConnection();
    const request = pool.request();
    request.input('usuarioId', usuarioId);
    const result = await request.query(query);
    
    // Convertir a objeto de configuración
    const configuracion = {};
    result.recordset.forEach(config => {
      try {
        configuracion[config.ConfiguracionKey] = JSON.parse(config.ConfiguracionValue);
      } catch {
        configuracion[config.ConfiguracionKey] = config.ConfiguracionValue;
      }
    });

    // Configuración por defecto si no existe
    const configDefecto = {
      exportFormat: 'excel',
      maxRows: 1000,
      chartType: 'bar',
      autoSave: true,
      notifications: true,
      ...configuracion
    };

    res.json(configDefecto);

  } catch (error) {
    console.error("Error en getConfiguracion:", error);
    res.status(500).json({ 
      error: "Error al obtener configuración",
      details: error.message
    });
  }
};

export const actualizarConfiguracion = async (req, res) => {
  try {
    const { configuracion } = req.body;
    const usuarioId = req.user?.id || 'sistema';

    if (!configuracion || typeof configuracion !== 'object') {
      return res.status(400).json({ 
        error: "Configuración requerida",
        details: "Debe proporcionar un objeto con la configuración"
      });
    }

    logActivity(usuarioId, "Actualizando configuración", 
      `${Object.keys(configuracion).length} elementos`);

    const pool = await getConnection();

    // Actualizar cada elemento de configuración
    for (const [key, value] of Object.entries(configuracion)) {
      const query = `
        MERGE ConfiguracionUsuario AS target
        USING (SELECT @usuarioId as UsuarioID, @configKey as ConfigKey, @configValue as ConfigValue) AS source
        ON target.UsuarioID = source.UsuarioID AND target.ConfiguracionKey = source.ConfigKey
        WHEN MATCHED THEN 
          UPDATE SET ConfiguracionValue = source.ConfigValue, FechaModificacion = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (UsuarioID, ConfiguracionKey, ConfiguracionValue, FechaCreacion, FechaModificacion)
          VALUES (source.UsuarioID, source.ConfigKey, source.ConfigValue, GETDATE(), GETDATE());
      `;

      const request = pool.request();
      request.input('usuarioId', usuarioId);
      request.input('configKey', key);
      request.input('configValue', typeof value === 'object' ? JSON.stringify(value) : value);
      
      await request.query(query);
    }

    logActivity(usuarioId, "Configuración actualizada exitosamente");
    
    res.json({ 
      message: "Configuración actualizada correctamente",
      elementosActualizados: Object.keys(configuracion).length
    });

  } catch (error) {
    console.error("Error en actualizarConfiguracion:", error);
    res.status(500).json({ 
      error: "Error al actualizar configuración",
      details: error.message
    });
  }
};

// ===================== VERIFICACIÓN DE CONECTIVIDAD =====================
export const verificarConexionDB = async (req, res) => {
  try {
    const usuarioId = req.user?.id || 'sistema';
    logActivity(usuarioId, "Verificando conexión a base de datos");

    const connection = await getConnection();
    if (!connection) {
      throw new Error("No se pudo establecer conexión con la base de datos");
    }

    // Prueba simple de conectividad
    const testQuery = "SELECT GETDATE() as fechaServidor, @@VERSION as versionSQL";
    const request = connection.request();
    const result = await request.query(testQuery);
    
    const info = {
      estado: "conectado",
      fechaServidor: result.recordset[0].fechaServidor,
      versionSQL: result.recordset[0].versionSQL.split('\n')[0], // Solo primera línea
      timestamp: new Date().toISOString(),
      usuario: req.user?.name || req.user?.id || 'Sistema'
    };

    logActivity(usuarioId, "Conexión DB verificada exitosamente");
    
    res.json({
      message: "Conexión a base de datos verificada correctamente",
      ...info
    });

  } catch (error) {
    console.error("Error en verificarConexionDB:", error);
    
    const usuarioId = req.user?.id || 'sistema';
    logActivity(usuarioId, "Error en verificación DB", error.message);
    
    res.status(500).json({ 
      error: "Error al verificar la conexión",
      details: error.message,
      estado: "desconectado",
      timestamp: new Date().toISOString()
    });
  }
};

// ===================== CACHÉ Y OPTIMIZACIÓN =====================
export const limpiarCache = async (req, res) => {
  try {
    const usuarioId = req.user?.id || 'sistema';
    logActivity(usuarioId, "Limpiando caché del sistema");

    // Simular limpieza de caché (en una implementación real podrías usar Redis, etc.)
    const cacheKeys = ['metadata', 'plantillas', 'estadisticas'];
    
    res.json({
      message: "Caché limpiado exitosamente",
      keysCleaned: cacheKeys,
      timestamp: new Date().toISOString()
    });

    logActivity(usuarioId, "Caché limpiado exitosamente");

  } catch (error) {
    console.error("Error en limpiarCache:", error);
    res.status(500).json({ 
      error: "Error al limpiar el caché",
      details: error.message
    });
  }
};

// ===================== LIMPIEZA Y MANTENIMIENTO =====================
export const limpiarHistorial = async (req, res) => {
  try {
    const { diasAntiguedad = 30 } = req.body;
    const usuarioId = req.user?.id || 'sistema';

    logActivity(usuarioId, "Iniciando limpieza de historial", `${diasAntiguedad} días`);

    const query = `
      DELETE FROM HistorialReportes 
      WHERE UsuarioID = @usuarioId 
        AND FechaEjecucion < DATEADD(day, -@diasAntiguedad, GETDATE())
    `;

    const pool = await getConnection();
    const request = pool.request();
    request.input('usuarioId', usuarioId);
    request.input('diasAntiguedad', diasAntiguedad);
    
    const result = await request.query(query);
    const registrosEliminados = result.rowsAffected[0] || 0;
    
    logActivity(usuarioId, "Limpieza completada", `${registrosEliminados} registros eliminados`);

    res.json({
      message: "Historial limpiado exitosamente",
      registrosEliminados,
      diasAntiguedad
    });

  } catch (error) {
    console.error("Error en limpiarHistorial:", error);
    res.status(500).json({ 
      error: "Error al limpiar historial",
      details: error.message
    });
  }
};

// ===================== EXPORTACIONES POR LOTES =====================
export const exportarLote = async (req, res) => {
  try {
    const { reportes, formato = 'excel' } = req.body;
    const usuarioId = req.user?.id || 'sistema';

    if (!reportes || !Array.isArray(reportes) || reportes.length === 0) {
      return res.status(400).json({ 
        error: "Lista de reportes requerida",
        details: "Debe proporcionar un array con los IDs de reportes a exportar"
      });
    }

    logActivity(usuarioId, "Iniciando exportación por lotes", 
      `${reportes.length} reportes en formato ${formato}`);

    const resultados = [];
    const pool = await getConnection();
    
    for (const reporteId of reportes) {
      try {
        // Obtener configuración del reporte
        const reporteQuery = `
          SELECT Nombre, Configuracion 
          FROM ReportesPersonalizados 
          WHERE ReporteID = @reporteId AND Estado = 1
        `;
        
        const reporteRequest = pool.request();
        reporteRequest.input('reporteId', reporteId);
        const reporteResult = await reporteRequest.query(reporteQuery);
        
        if (reporteResult.recordset.length === 0) {
          resultados.push({
            reporteId,
            error: "Reporte no encontrado"
          });
          continue;
        }

        const reporte = reporteResult.recordset[0];
        const config = JSON.parse(reporte.Configuracion || '{}');
        
        // Ejecutar consulta del reporte
        if (config.sqlQuery) {
          const dataRequest = pool.request();
          const dataResult = await dataRequest.query(config.sqlQuery);
          
          resultados.push({
            reporteId,
            nombre: reporte.Nombre,
            registros: dataResult.recordset.length,
            data: dataResult.recordset
          });
        }
        
      } catch (error) {
        resultados.push({
          reporteId,
          error: error.message
        });
      }
    }

    // Crear archivo único con todos los reportes
    if (formato === 'excel') {
      const workbook = new ExcelJS.Workbook();
      
      resultados.forEach(resultado => {
        if (resultado.data && resultado.data.length > 0) {
          const sheet = workbook.addWorksheet(
            resultado.nombre.substring(0, 31) // Límite de Excel
          );
          
          sheet.columns = Object.keys(resultado.data[0]).map(key => ({
            header: key,
            key,
            width: 15
          }));
          
          sheet.addRows(resultado.data);
        }
      });

      const fileName = `reportes_lote_${Date.now()}.xlsx`;
      
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      
      await workbook.xlsx.write(res);
      res.end();
    } else {
      res.json({
        message: "Exportación por lotes completada",
        totalReportes: reportes.length,
        exitosos: resultados.filter(r => !r.error).length,
        fallidos: resultados.filter(r => r.error).length,
        resultados
      });
    }

    logActivity(usuarioId, "Exportación por lotes completada");

  } catch (error) {
    console.error("Error en exportarLote:", error);
    res.status(500).json({ 
      error: "Error en exportación por lotes",
      details: error.message
    });
  }
};

// Agregar al final de reportesController.js

// ===================== REPORTES VISUALES SIN SQL =====================

// Endpoint para reportes de empleados
export const reporteEmpleados = async (req, res) => {
  try {
    const { 
      campos = ['nombre', 'apellido', 'cargo', 'departamento'],
      filtros = {},
      ordenamiento = { campo: 'nombre', direccion: 'ASC' },
      limite = 1000
    } = req.body;

    const usuarioId = req.user?.id || 'sistema';
    logActivity(usuarioId, "Generando reporte de empleados");

    // Mapeo seguro de campos
    const camposPermitidos = {
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

    // Validar campos solicitados
    const camposValidos = campos.filter(c => camposPermitidos[c]);
    if (camposValidos.length === 0) {
      return res.status(400).json({ 
        error: 'No hay campos válidos seleccionados',
        camposDisponibles: Object.keys(camposPermitidos)
      });
    }

    // Construir SELECT
    const selectClause = camposValidos.map(c => camposPermitidos[c]).join(', ');

    // Construir query base
    let query = `
      SELECT TOP ${Math.min(limite, MAX_RESULTS)} ${selectClause}
      FROM Empleados e
      LEFT JOIN Departamentos d ON e.DepartamentoID = d.DepartamentoID
    `;

    // Construir WHERE con parámetros
    const condiciones = [];
    const pool = await getConnection();
    const request = pool.request();

    if (filtros.estado === 'activo') {
      condiciones.push('e.Estado = 1');
    } else if (filtros.estado === 'inactivo') {
      condiciones.push('e.Estado = 0');
    }

    if (filtros.departamentoId) {
      condiciones.push('e.DepartamentoID = @departamentoId');
      request.input('departamentoId', parseInt(filtros.departamentoId));
    }

    if (filtros.cargo) {
      condiciones.push('e.Cargo LIKE @cargo');
      request.input('cargo', `%${filtros.cargo}%`);
    }

    if (condiciones.length > 0) {
      query += ` WHERE ${condiciones.join(' AND ')}`;
    }

    // Ordenamiento
    if (ordenamiento.campo && camposPermitidos[ordenamiento.campo]) {
      const direccion = ordenamiento.direccion === 'DESC' ? 'DESC' : 'ASC';
      query += ` ORDER BY ${camposPermitidos[ordenamiento.campo]} ${direccion}`;
    }

    const result = await request.query(query);

    logActivity(usuarioId, "Reporte empleados generado", `${result.recordset.length} registros`);

    res.json({
      success: true,
      data: result.recordset,
      total: result.recordset.length,
      configuracion: { campos, filtros, ordenamiento }
    });

  } catch (error) {
    console.error('Error en reporteEmpleados:', error);
    res.status(500).json({ 
      error: 'Error generando reporte de empleados',
      details: error.message 
    });
  }
};

// Endpoint para reportes de departamentos
export const reporteDepartamentos = async (req, res) => {
  try {
    const { 
      incluirEstadisticas = true,
      incluirEmpleados = false 
    } = req.body;

    const usuarioId = req.user?.id || 'sistema';
    logActivity(usuarioId, "Generando reporte de departamentos");

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

    const pool = await getConnection();
    const request = pool.request();
    const result = await request.query(query);

    logActivity(usuarioId, "Reporte departamentos generado", `${result.recordset.length} registros`);

    res.json({
      success: true,
      data: result.recordset,
      total: result.recordset.length
    });

  } catch (error) {
    console.error('Error en reporteDepartamentos:', error);
    res.status(500).json({ 
      error: 'Error generando reporte de departamentos',
      details: error.message 
    });
  }
};

// Endpoint para reportes de vacantes
export const reporteVacantes = async (req, res) => {
  try {
    const { 
      estado = 'Todas',
      departamentoId,
      fechaDesde,
      fechaHasta,
      incluirPostulaciones = false
    } = req.body;

    const usuarioId = req.user?.id || 'sistema';
    logActivity(usuarioId, "Generando reporte de vacantes");

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

    query += ` 
      FROM Vacantes v
      LEFT JOIN Departamentos d ON v.DepartamentoID = d.DepartamentoID
    `;

    if (incluirPostulaciones) {
      query += ` LEFT JOIN Postulaciones p ON v.VacanteID = p.VacanteID `;
    }

    // Construir WHERE
    const condiciones = [];
    const pool = await getConnection();
    const request = pool.request();

    if (estado && estado !== 'Todas') {
      condiciones.push('v.Estado = @estado');
      request.input('estado', estado);
    }

    if (departamentoId) {
      condiciones.push('v.DepartamentoID = @departamentoId');
      request.input('departamentoId', parseInt(departamentoId));
    }

    if (fechaDesde) {
      condiciones.push('v.FechaPublicacion >= @fechaDesde');
      request.input('fechaDesde', fechaDesde);
    }

    if (fechaHasta) {
      condiciones.push('v.FechaPublicacion <= @fechaHasta');
      request.input('fechaHasta', fechaHasta);
    }

    if (condiciones.length > 0) {
      query += ` WHERE ${condiciones.join(' AND ')} `;
    }

    if (incluirPostulaciones) {
      query += ` 
        GROUP BY v.VacanteID, v.Titulo, v.Descripcion, v.Estado, 
                 v.FechaPublicacion, v.FechaCierre, d.Nombre 
      `;
    }

    query += ` ORDER BY v.FechaPublicacion DESC `;

    const result = await request.query(query);

    logActivity(usuarioId, "Reporte vacantes generado", `${result.recordset.length} registros`);

    res.json({
      success: true,
      data: result.recordset,
      total: result.recordset.length
    });

  } catch (error) {
    console.error('Error en reporteVacantes:', error);
    res.status(500).json({ 
      error: 'Error generando reporte de vacantes',
      details: error.message 
    });
  }
};

// Endpoint para reportes de nómina
export const reporteNomina = async (req, res) => {
  try {
    const { 
      tipo = 'severance',
      departamentoId,
      fechaReferencia = new Date()
    } = req.body;

    const usuarioId = req.user?.id || 'sistema';
    logActivity(usuarioId, "Generando reporte de nómina", tipo);

    let data = [];

    if (tipo === 'severance') {
      data = await calcularSeverance(departamentoId, fechaReferencia);
    } else if (tipo === 'salarios') {
      data = await reporteSalarios(departamentoId);
    }

    logActivity(usuarioId, "Reporte nómina generado", `${data.length} registros`);

    res.json({
      success: true,
      data,
      tipo,
      fechaGeneracion: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en reporteNomina:', error);
    res.status(500).json({ 
      error: 'Error generando reporte de nómina',
      details: error.message 
    });
  }
};

// Funciones auxiliares para nómina
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
  request.input('fecha', fecha);
  if (departamentoId) request.input('departamentoId', departamentoId);

  const result = await request.query(query);

  // Calcular severance para cada empleado
  return result.recordset.map(emp => {
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
  if (departamentoId) request.input('departamentoId', departamentoId);

  const result = await request.query(query);
  return result.recordset;
}

// Endpoint para métricas generales
export const reporteMetricas = async (req, res) => {
  try {
    const usuarioId = req.user?.id || 'sistema';
    logActivity(usuarioId, "Consultando métricas RRHH");

    const pool = await getConnection();
    const metricas = {};

    // Total empleados activos
    const totalEmpleados = await pool.request().query(`
      SELECT COUNT(*) as total FROM Empleados WHERE Estado = 1
    `);
    metricas.totalEmpleados = totalEmpleados.recordset[0].total;

    // Contrataciones últimos 30 días
    const contrataciones = await pool.request().query(`
      SELECT COUNT(*) as total 
      FROM Empleados 
      WHERE FechaIngreso >= DATEADD(day, -30, GETDATE())
    `);
    metricas.contratacionesUltimos30Dias = contrataciones.recordset[0].total;

    // Salario promedio
    const salario = await pool.request().query(`
      SELECT AVG(CAST(Salario AS FLOAT)) as promedio 
      FROM Empleados 
      WHERE Estado = 1
    `);
    metricas.salarioPromedio = Math.round(salario.recordset[0].promedio || 0);

    // Vacantes abiertas
    const vacantes = await pool.request().query(`
      SELECT COUNT(*) as total 
      FROM Vacantes 
      WHERE Estado = 'Abierta'
    `);
    metricas.vacantesAbiertas = vacantes.recordset[0].total;

    // Distribución por departamento
    const distribucion = await pool.request().query(`
      SELECT 
        d.Nombre as departamento,
        COUNT(e.EmpleadoID) as total
      FROM Departamentos d
      LEFT JOIN Empleados e ON d.DepartamentoID = e.DepartamentoID AND e.Estado = 1
      GROUP BY d.Nombre
      ORDER BY total DESC
    `);
    metricas.distribucionDepartamentos = distribucion.recordset;

    res.json({
      success: true,
      data: metricas
    });

  } catch (error) {
    console.error('Error en reporteMetricas:', error);
    res.status(500).json({ 
      error: 'Error obteniendo métricas',
      details: error.message 
    });
  }
};

// ===================== REPORTES DE VACACIONES =====================

export const reporteVacaciones = async (req, res) => {
  try {
    const { 
      tipoVacaciones, 
      periodo,  // ✅ CAMBIÓ de 'anio' a 'periodo'
      direccionId, 
      departamentoId, 
      minimosDiasPendientes,
      ordenamiento 
    } = req.body;

    const usuarioId = req.user?.id || 'sistema';
    logActivity(usuarioId, "Generando reporte de vacaciones", tipoVacaciones);

    // ✅ NUEVO: Procesar el periodo para obtener el año
    let anio;
    if (!periodo || periodo === 'todos') {
      anio = null; // Consultar todos los años
    } else if (periodo.includes('-')) {
      // Formato "2024-2025" -> tomar el primer año
      anio = parseInt(periodo.split('-')[0]);
    } else {
      // Formato "2024" -> usar directamente
      anio = parseInt(periodo);
    }

    // Si no hay año definido, usar el año actual
    if (!anio) {
      const fechaActual = new Date();
      anio = fechaActual.getFullYear();
    }

    console.log('📅 Periodo solicitado:', periodo);
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

    // Construir query con parámetros
    const paramNames = Object.keys(reporteConfig.params);
    const paramString = paramNames
      .map(name => `@${name} = @${name}`)
      .join(', ');
    
    const query = paramString 
      ? `EXEC ${reporteConfig.sp} ${paramString}`
      : `EXEC ${reporteConfig.sp}`;

    // Ejecutar
    const pool = await getConnection();
    const request = pool.request();
    
    // Agregar parámetros dinámicamente
    Object.entries(reporteConfig.params).forEach(([name, value]) => {
      if (value !== null) {
        const sqlType = typeof value === 'number' ? 'Int' : 'VarChar';
        request.input(name, value);
      } else {
        request.input(name, null);
      }
    });

    const result = await request.query(query);
    
    logActivity(usuarioId, "Reporte vacaciones generado", `${result.recordset.length} registros`);

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
    console.error('Error en reporte de vacaciones:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error generando reporte de vacaciones',
      details: error.message 
    });
  }
};

// Endpoint para obtener direcciones
export const getDirecciones = async (req, res) => {
  try {
    const usuarioId = req.user?.id || 'sistema';
    logActivity(usuarioId, "Consultando direcciones");

    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT DireccionID, Nombre, Orden
      FROM Direcciones
      WHERE Activo = 1
      ORDER BY Orden, Nombre
    `);
    
    res.json(result.recordset);

  } catch (error) {
    console.error('Error obteniendo direcciones:', error);
    res.status(500).json({ 
      error: 'Error al obtener direcciones',
      details: error.message 
    });
  }
};

// Endpoint para obtener departamentos
export const getDepartamentos = async (req, res) => {
  try {
    const { direccionId } = req.query;
    const usuarioId = req.user?.id || 'sistema';
    
    logActivity(usuarioId, "Consultando departamentos", direccionId ? `Dirección: ${direccionId}` : "Todos");

    const pool = await getConnection();
    const request = pool.request();
    
    let query = `
      SELECT 
        d.DepartamentoID,
        d.Nombre,
        d.DireccionID,
        dir.Nombre as NombreDireccion
      FROM Departamentos d
      LEFT JOIN Direcciones dir ON d.DireccionID = dir.DireccionID
      WHERE d.Activo = 1
    `;
    
    if (direccionId) {
      query += ` AND d.DireccionID = @direccionId`;
      request.input('direccionId', parseInt(direccionId));
    }
    
    query += ` ORDER BY d.Nombre`;
    
    const result = await request.query(query);
    
    logActivity(usuarioId, "Departamentos obtenidos", `${result.recordset.length} encontrados`);
    
    res.json(result.recordset);

  } catch (error) {
    console.error('Error obteniendo departamentos:', error);
    res.status(500).json({ 
      error: 'Error al obtener departamentos',
      details: error.message 
    });
  }
};