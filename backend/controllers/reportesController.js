// backend/controllers/reportesController.js
import ExcelJS from "exceljs";
import { Parser } from "json2csv";
import PDFDocument from "pdfkit";
import { executeQuery, getConnection } from "../db.js";

// ===================== MIDDLEWARE DE AUTENTICACIÓN =====================
export const verificarToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ 
        error: "Token de acceso requerido",
        details: "No se encontró el header Authorization"
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: "Formato de token inválido",
        details: "El token debe tener el formato 'Bearer <token>'"
      });
    }

    const token = authHeader.substring(7); // Remover 'Bearer '
    
    if (!token) {
      return res.status(401).json({ 
        error: "Token vacío",
        details: "No se proporcionó un token válido"
      });
    }

    // Aquí deberías verificar el token con JWT o tu sistema de auth
    // Por ejemplo:
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // req.user = decoded;
    
    // Por ahora, simplemente validamos que el token existe
    // REEMPLAZA ESTO con tu lógica de verificación real
    if (token === 'invalid' || token.length < 10) {
      return res.status(401).json({ 
        error: "Token inválido",
        details: "El token proporcionado no es válido"
      });
    }

    // Si llegamos aquí, el token es válido
    req.user = { id: 1, role: 'user' }; // Datos del usuario decodificados
    next();
    
  } catch (error) {
    console.error('Error en verificación de token:', error);
    return res.status(401).json({ 
      error: "Error de autenticación",
      details: error.message
    });
  }
};

// ===================== REPORTES PREDEFINIDOS =====================
export const getPredefinidos = async (req, res) => {
  const { tipo } = req.params;
  let query = "";

  console.log(`Usuario ${req.user?.id} solicitando reporte: ${tipo}`);

  switch (tipo) {
    case "empleados_por_departamento":
      query = `
        SELECT d.Nombre AS Departamento, COUNT(e.EmpleadoID) AS Total
        FROM Empleados e
        JOIN Departamentos d ON e.DepartamentoID = d.DepartamentoID
        GROUP BY d.Nombre
        ORDER BY Total DESC
      `;
      break;
    case "vacantes_abiertas":
      query = `
        SELECT Puesto, COUNT(*) AS Total 
        FROM Vacantes 
        WHERE Estado = 'Abierta'
        GROUP BY Puesto
        ORDER BY Total DESC
      `;
      break;
    default:
      return res.status(400).json({ 
        error: "Reporte no definido",
        tiposDisponibles: ["empleados_por_departamento", "vacantes_abiertas"]
      });
  }

  try {
    console.log('Ejecutando query:', query);
    const result = await executeQuery(query);
    
    if (!result.recordset) {
      return res.status(500).json({ error: "No se obtuvieron resultados de la consulta" });
    }

    console.log(`Reporte generado exitosamente. Registros: ${result.recordset.length}`);
    res.json(result.recordset);
  } catch (err) {
    console.error("Error en getPredefinidos:", err.message);
    res.status(500).json({ 
      error: "Error al generar el reporte",
      details: err.message
    });
  }
};

// ===================== REPORTES SQL PERSONALIZADOS =====================
export const ejecutarQuery = async (req, res) => {
  const { sqlQuery } = req.body;

  console.log(`Usuario ${req.user?.id} ejecutando query personalizado`);

  if (!sqlQuery || typeof sqlQuery !== 'string') {
    return res.status(400).json({ 
      error: "Query SQL requerido",
      details: "Debe proporcionarse un string con la consulta SQL"
    });
  }

  // Validaciones de seguridad
  const queryLower = sqlQuery.toLowerCase().trim();
  
  if (!queryLower.startsWith("select")) {
    return res.status(400).json({ 
      error: "Solo se permiten consultas SELECT",
      details: "Por seguridad, solo se permiten consultas de lectura"
    });
  }

  // Palabras peligrosas que no deberían estar en un SELECT
  const palabrasPeligrosas = ['drop', 'delete', 'insert', 'update', 'truncate', 'alter', 'create'];
  const tienePalabrasPeligrosas = palabrasPeligrosas.some(palabra => 
    queryLower.includes(palabra)
  );

  if (tienePalabrasPeligrosas) {
    return res.status(400).json({ 
      error: "Query contiene operaciones no permitidas",
      details: "Solo se permiten consultas de lectura (SELECT)"
    });
  }

  try {
    console.log('Ejecutando query personalizado:', sqlQuery);
    const result = await executeQuery(sqlQuery);
    
    if (!result.recordset) {
      return res.status(500).json({ error: "No se obtuvieron resultados de la consulta" });
    }

    console.log(`Query ejecutado exitosamente. Registros: ${result.recordset.length}`);
    res.json(result.recordset);
  } catch (err) {
    console.error("Error en ejecutarQuery:", err.message);
    res.status(500).json({ 
      error: "Error al ejecutar la consulta",
      details: err.message
    });
  }
};

// ===================== EXPORTAR REPORTES =====================
export const exportarReporte = async (req, res) => {
  const { formato, data } = req.body;

  console.log(`Usuario ${req.user?.id} exportando reporte en formato: ${formato}`);

  try {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ 
        error: "No hay datos para exportar",
        details: "Se requiere un array con datos válidos"
      });
    }

    const formatosPermitidos = ['csv', 'excel', 'pdf'];
    if (!formatosPermitidos.includes(formato)) {
      return res.status(400).json({ 
        error: "Formato no soportado",
        formatosDisponibles: formatosPermitidos
      });
    }

    if (formato === "csv") {
      const parser = new Parser();
      const csv = parser.parse(data);
      
      res.header("Content-Type", "text/csv; charset=utf-8");
      res.header("Content-Disposition", "attachment; filename=reporte.csv");
      return res.send('\uFEFF' + csv); // BOM para UTF-8
    }

    if (formato === "excel") {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Reporte");

      // Configurar columnas basadas en el primer registro
      sheet.columns = Object.keys(data[0]).map(key => ({ 
        header: key, 
        key,
        width: Math.max(key.length + 5, 15) // Ancho mínimo
      }));
      
      // Agregar datos
      sheet.addRows(data);

      // Estilo para encabezados
      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6FA' }
      };

      res.header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.header("Content-Disposition", "attachment; filename=reporte.xlsx");
      
      await workbook.xlsx.write(res);
      return res.end();
    }

    if (formato === "pdf") {
      const doc = new PDFDocument({ 
        margin: 30, 
        size: "A4",
        bufferPages: true
      });
      
      res.header("Content-Type", "application/pdf");
      res.header("Content-Disposition", "attachment; filename=reporte.pdf");
      doc.pipe(res);

      // Título
      doc.fontSize(16).text('Reporte de Datos', { align: 'center' });
      doc.moveDown();

      // Fecha de generación
      doc.fontSize(10).text(`Generado: ${new Date().toLocaleString()}`, { align: 'right' });
      doc.moveDown();

      // Datos
      doc.fontSize(10);
      data.forEach((row, index) => {
        doc.text(`${index + 1}. ${JSON.stringify(row, null, 2)}`);
        doc.moveDown(0.5);
        
        // Nueva página cada 30 registros
        if ((index + 1) % 30 === 0 && index < data.length - 1) {
          doc.addPage();
        }
      });

      doc.end();
      return;
    }

  } catch (err) {
    console.error("Error en exportarReporte:", err.message);
    res.status(500).json({ 
      error: "Error al exportar el reporte",
      details: err.message
    });
  }
};

// ===================== METADATOS PARA CONSTRUCTOR DE REPORTES =====================
export const getMetadata = async (req, res) => {
  console.log(`Usuario ${req.user?.id} solicitando metadata de DB`);
  
  try {
    const connection = await getConnection();
    if (!connection) {
      return res.status(500).json({ 
        error: "Error de conexión a la base de datos",
        details: "No se pudo establecer conexión con la base de datos"
      });
    }

    const result = await connection.request().query(`
      SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'dbo'
      ORDER BY TABLE_NAME, ORDINAL_POSITION
    `);

    if (!result.recordset) {
      return res.status(500).json({ error: "No se pudo obtener la estructura de la base de datos" });
    }

    const estructura = {};
    result.recordset.forEach(row => {
      if (!estructura[row.TABLE_NAME]) {
        estructura[row.TABLE_NAME] = [];
      }
      estructura[row.TABLE_NAME].push({
        name: row.COLUMN_NAME,
        type: row.DATA_TYPE,
        nullable: row.IS_NULLABLE === 'YES'
      });
    });

    console.log(`Metadata enviada. Tablas encontradas: ${Object.keys(estructura).length}`);
    
    // Para compatibilidad con el frontend actual, enviar solo los nombres
    const estructuraSimplificada = {};
    Object.keys(estructura).forEach(tabla => {
      estructuraSimplificada[tabla] = estructura[tabla].map(col => col.name);
    });

    res.json(estructuraSimplificada);
  } catch (err) {
    console.error("Error en getMetadata:", err.message);
    res.status(500).json({ 
      error: "Error al obtener la estructura de la base de datos",
      details: err.message
    });
  }
};