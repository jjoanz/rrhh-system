import { poolPromise } from '../db.js';
import sql from 'mssql';

// Configuración para cálculos de nómina RD
const CONFIG_NOMINA = {
  salarioMinimo: 21000,
  tss: {
    empleado: 2.87,
    patronal: 7.09,
    limite: 210000 // 10 veces salario mínimo
  },
  infotep: 1.0,
  isr: {
    escalas: [
      { desde: 0, hasta: 416220, porcentaje: 0 },
      { desde: 416221, hasta: 624329, porcentaje: 15 },
      { desde: 624330, hasta: 867123, porcentaje: 20 },
      { desde: 867124, hasta: 999999999, porcentaje: 25 }
    ]
  },
  recargos: {
    extra_normal: 1.35,
    extra_nocturna: 1.75,
    extra_dominical: 2.0
  }
};

// Listar nóminas procesadas
export const getNominas = async (req, res) => {
  try {
    const { periodo, empleadoId, estado } = req.query;
    const pool = await poolPromise;

    let query = `
      SELECT 
        n.NominaID,
        n.Periodo,
        n.FechaInicio,
        n.FechaFin,
        n.FechaPago,
        n.Estado,
        n.EmpleadoID,
        e.Nombre,
        e.Cedula,
        e.Cargo,
        n.SalarioBase,
        n.TotalDevengado,
        n.TotalDeducciones,
        n.SalarioNeto
      FROM Nomina n
      JOIN Empleado e ON n.EmpleadoID = e.EmpleadoID
      WHERE 1=1
    `;

    const request = pool.request();

    if (periodo) {
      query += " AND n.Periodo = @periodo";
      request.input('periodo', sql.VarChar, periodo);
    }

    if (empleadoId) {
      query += " AND n.EmpleadoID = @empleadoId";
      request.input('empleadoId', sql.Int, empleadoId);
    }

    if (estado) {
      query += " AND n.Estado = @estado";
      request.input('estado', sql.VarChar, estado);
    }

    query += " ORDER BY n.FechaInicio DESC, e.Nombre";

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error en getNominas:', err);
    res.status(500).json({ error: err.message });
  }
};


// Obtener detalle de nómina específica
export const getNominaById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    const request = pool.request();
    request.input('nominaId', sql.Int, id);

    const nominaResult = await request.query(`
      SELECT 
        n.*,
        e.NOMBRE + ' ' + e.APELLIDO AS NombreCompleto,
        e.CEDULA as Cedula,
        e.CARGO as Cargo,
        d.Nombre AS Departamento,
        e.FECHAINGRESO as FechaIngreso
      FROM Nomina n
      INNER JOIN Empleados e ON n.EmpleadoId = e.EmpleadoID
      LEFT JOIN Departamentos d ON e.DEPARTAMENTOID = d.DepartamentoID
      WHERE n.NominaId = @nominaId
    `);

    if (nominaResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Nómina no encontrada' });
    }

    const detalleResult = await request.query(`
      SELECT * FROM NominaDetalle 
      WHERE NominaId = @nominaId
      ORDER BY TipoConcepto, Concepto
    `);

    res.json({
      nomina: nominaResult.recordset[0],
      detalles: detalleResult.recordset
    });
  } catch (err) {
    console.error('Error en getNominaById:', err);
    res.status(500).json({ error: err.message });
  }
};

// Calcular ISR anual
const calcularISR = (salarioAnual) => {
  let impuesto = 0;

  for (const escala of CONFIG_NOMINA.isr.escalas) {
    if (salarioAnual > escala.desde) {
      const baseImponible = Math.min(salarioAnual, escala.hasta) - escala.desde;
      impuesto += baseImponible * escala.porcentaje / 100;
    }
  }

  return impuesto / 12; // Retorna mensual
};

// Calcular nómina de un empleado
const calcularNominaEmpleado = async (pool, empleadoId, periodo) => {
  try {
    const empleadoResult = await pool.request()
      .input('empleadoId', sql.Int, empleadoId)
      .query('SELECT * FROM Empleados WHERE EmpleadoID = @empleadoId AND ESTADO = 1');

    if (empleadoResult.recordset.length === 0) {
      throw new Error(`Empleado ${empleadoId} no encontrado o inactivo`);
    }

    const empleado = empleadoResult.recordset[0];

    const incidenciasResult = await pool.request()
      .input('empleadoId', sql.Int, empleadoId)
      .input('periodo', sql.VarChar, periodo)
      .query(`
        SELECT * FROM Incidencias 
        WHERE EmpleadoId = @empleadoId 
        AND (
          CONVERT(VARCHAR(7), Fecha, 121) = @periodo 
          OR CONVERT(VARCHAR(7), FechaInicio, 121) = @periodo
        )
        AND Aprobado = 1
      `);

    const incidencias = incidenciasResult.recordset;

    let salarioBase = empleado.Salario;
    let horasExtras = 0;
    let bonificaciones = 0;
    let descuentoFaltas = 0;

    incidencias.forEach(incidencia => {
      switch (incidencia.Tipo) {
        case 'horas_extra':
          const valorHora = salarioBase / 184;
          const recargo = CONFIG_NOMINA.recargos[incidencia.TipoRecargo] || 1.35;
          horasExtras += incidencia.Horas * valorHora * recargo;
          break;

        case 'falta':
          if (!incidencia.Justificada) {
            descuentoFaltas += salarioBase / 30;
          }
          break;

        case 'bonificacion':
          bonificaciones += incidencia.Monto || 0;
          break;
      }
    });

    const totalDevengado = salarioBase + horasExtras + bonificaciones - descuentoFaltas;
    const tssEmpleado = Math.min(totalDevengado * CONFIG_NOMINA.tss.empleado / 100, CONFIG_NOMINA.tss.limite * CONFIG_NOMINA.tss.empleado / 100);
    const isrMensual = calcularISR(totalDevengado * 12);
    const totalDeducciones = tssEmpleado + isrMensual;
    const salarioNeto = totalDevengado - totalDeducciones;

    const tssPatronal = Math.min(totalDevengado * CONFIG_NOMINA.tss.patronal / 100, CONFIG_NOMINA.tss.limite * CONFIG_NOMINA.tss.patronal / 100);
    const infotep = totalDevengado * CONFIG_NOMINA.infotep / 100;

    return {
      empleado,
      conceptos: {
        salarioBase,
        horasExtras,
        bonificaciones,
        descuentoFaltas,
        totalDevengado,
        tssEmpleado,
        isrMensual,
        totalDeducciones,
        salarioNeto,
        tssPatronal,
        infotep
      },
      incidencias
    };
  } catch (error) {
    console.error(`Error calculando nómina para empleado ${empleadoId}:`, error);
    throw error;
  }
};

// Procesar nómina completa
export const procesarNomina = async (req, res) => {
  const transaction = new sql.Transaction(await poolPromise);

  try {
    const { periodo, empleadosIds = [] } = req.body;

    if (!periodo) {
      return res.status(400).json({ error: 'El período es requerido' });
    }

    await transaction.begin();
    const pool = transaction;

    const existeResult = await pool.request()
      .input('periodo', sql.VarChar, periodo)
      .query('SELECT COUNT(*) as count FROM Nomina WHERE Periodo = @periodo');

    if (existeResult.recordset[0].count > 0) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Ya existe nómina procesada para este período' });
    }

    let empleadosQuery = 'SELECT EmpleadoID FROM Empleados WHERE ESTADO = 1';
    const request = pool.request();

    if (empleadosIds.length > 0) {
      empleadosQuery += ' AND EmpleadoID IN (' + empleadosIds.map(id => `'${id}'`).join(',') + ')';
    }

    const empleadosResult = await request.query(empleadosQuery);
    const empleados = empleadosResult.recordset;

    const nominasCreadas = [];

    for (const empleado of empleados) {
      const calculo = await calcularNominaEmpleado(pool, empleado.EmpleadoID, periodo);

      const nominaRequest = pool.request()
        .input('empleadoId', sql.Int, empleado.EmpleadoID)
        .input('periodo', sql.VarChar, periodo)
        .input('FechaInicio', sql.DateTime, new Date())
        .input('estado', sql.VarChar, 'procesada')
        .input('salarioBase', sql.Decimal(12, 2), calculo.conceptos.salarioBase)
        .input('totalDevengado', sql.Decimal(12, 2), calculo.conceptos.totalDevengado)
        .input('totalDeducciones', sql.Decimal(12, 2), calculo.conceptos.totalDeducciones)
        .input('salarioNeto', sql.Decimal(12, 2), calculo.conceptos.salarioNeto);

      const nominaResult = await nominaRequest.query(`
        INSERT INTO Nomina (
          EmpleadoId, Periodo, FechaInicio, Estado,
          SalarioBase, TotalDevengado, TotalDeducciones, SalarioNeto
        ) OUTPUT INSERTED.NominaId
        VALUES (
          @empleadoId, @periodo, @FechaInicio, @estado,
          @salarioBase, @totalDevengado, @totalDeducciones, @salarioNeto
        )
      `);

      const nominaId = nominaResult.recordset[0].NominaId;

      const conceptos = [
        { tipo: 'DEVENGADO', concepto: 'SALARIO_BASE', valor: calculo.conceptos.salarioBase },
        { tipo: 'DEVENGADO', concepto: 'HORAS_EXTRA', valor: calculo.conceptos.horasExtras },
        { tipo: 'DEVENGADO', concepto: 'BONIFICACIONES', valor: calculo.conceptos.bonificaciones },
        { tipo: 'DEDUCCION', concepto: 'DESCUENTO_FALTAS', valor: calculo.conceptos.descuentoFaltas },
        { tipo: 'DEDUCCION', concepto: 'TSS_EMPLEADO', valor: calculo.conceptos.tssEmpleado },
        { tipo: 'DEDUCCION', concepto: 'ISR', valor: calculo.conceptos.isrMensual },
        { tipo: 'PATRONAL', concepto: 'TSS_PATRONAL', valor: calculo.conceptos.tssPatronal },
        { tipo: 'PATRONAL', concepto: 'INFOTEP', valor: calculo.conceptos.infotep }
      ];

      for (const concepto of conceptos) {
        if (concepto.valor > 0) {
          await pool.request()
            .input('nominaId', sql.Int, nominaId)
            .input('tipoConcepto', sql.VarChar, concepto.tipo)
            .input('concepto', sql.VarChar, concepto.concepto)
            .input('valor', sql.Decimal(12, 2), concepto.valor)
            .query(`
              INSERT INTO NominaDetalle (NominaId, TipoConcepto, Concepto, Valor)
              VALUES (@nominaId, @tipoConcepto, @concepto, @valor)
            `);
        }
      }

      nominasCreadas.push({
        nominaId,
        empleadoId: empleado.EmpleadoID,
        salarioNeto: calculo.conceptos.salarioNeto
      });
    }

    await transaction.commit();

    res.json({
      message: `Nómina procesada exitosamente para ${nominasCreadas.length} empleados`,
      periodo,
      empleados: nominasCreadas.length,
      totalNomina: nominasCreadas.reduce((total, n) => total + n.salarioNeto, 0),
      nominas: nominasCreadas
    });

  } catch (err) {
    await transaction.rollback();
    console.error('Error procesando nómina:', err);
    res.status(500).json({ error: err.message });
  }
};

// Marcar nómina como pagada
export const marcarNominaPagada = async (req, res) => {
  try {
    const { nominaIds, fechaPago, metodoPago, referenciaPago } = req.body;
    const pool = await poolPromise;
    const request = pool.request()
      .input('fechaPago', sql.DateTime, new Date(fechaPago))
      .input('metodoPago', sql.VarChar, metodoPago || 'transferencia')
      .input('referenciaPago', sql.VarChar, referenciaPago || null);

    const idsString = nominaIds.map(id => `'${id}'`).join(',');

    const result = await request.query(`
      UPDATE Nomina 
      SET 
        Estado = 'pagada',
        FechaPago = @fechaPago,
        MetodoPago = @metodoPago,
        ReferenciaPago = @referenciaPago
      WHERE NominaId IN (${idsString})
    `);

    res.json({
      message: `${result.rowsAffected[0]} nóminas marcadas como pagadas`,
      fechaPago,
      metodoPago
    });

  } catch (err) {
    console.error('Error marcando nómina pagada:', err);
    res.status(500).json({ error: err.message });
  }
};

// Generar reporte de nómina
export const generarReporteNomina = async (req, res) => {
  try {
    const { periodo, tipo = 'completo' } = req.query;
    const pool = await poolPromise;
    const request = pool.request();

    if (periodo) request.input('periodo', sql.VarChar, periodo);

    let query;
    switch (tipo) {
      case 'resumen':
        query = `
          SELECT 
            n.Periodo,
            COUNT(*) as TotalEmpleados,
            SUM(n.TotalDevengado) as TotalDevengado,
            SUM(n.TotalDeducciones) as TotalDeducciones,
            SUM(n.SalarioNeto) as TotalNeto,
            AVG(n.SalarioNeto) as PromedioSalario
          FROM Nomina n
          ${periodo ? 'WHERE n.Periodo = @periodo' : ''}
          GROUP BY n.Periodo
          ORDER BY n.Periodo DESC
        `;
        break;

      case 'aportes':
        query = `
          SELECT 
            n.Periodo,
            e.NOMBRE + ' ' + e.APELLIDO AS NombreCompleto,
            e.CEDULA as Cedula,
            nd.Valor as TSS_Patronal,
            nd2.Valor as INFOTEP
          FROM Nomina n
          INNER JOIN Empleados e ON n.EmpleadoId = e.EmpleadoID
          LEFT JOIN NominaDetalle nd ON n.NominaId = nd.NominaId AND nd.Concepto = 'TSS_PATRONAL'
          LEFT JOIN NominaDetalle nd2 ON n.NominaId = nd2.NominaId AND nd2.Concepto = 'INFOTEP'
          ${periodo ? 'WHERE n.Periodo = @periodo' : ''}
          ORDER BY e.NOMBRE
        `;
        break;

      default:
        query = `
          SELECT 
            n.Periodo,
            e.NOMBRE + ' ' + e.APELLIDO AS NombreCompleto,
            e.CEDULA as Cedula,
            e.CARGO as Cargo,
            d.Nombre as Departamento,
            n.SalarioBase,
            n.TotalDevengado,
            n.TotalDeducciones,
            n.SalarioNeto,
            n.Estado,
            n.FechaPago
          FROM Nomina n
          INNER JOIN Empleados e ON n.EmpleadoId = e.EmpleadoID
          LEFT JOIN Departamentos d ON e.DEPARTAMENTOID = d.DepartamentoID
          ${periodo ? 'WHERE n.Periodo = @periodo' : ''}
          ORDER BY n.Periodo DESC, e.NOMBRE
        `;
    }

    const result = await request.query(query);
    res.json(result.recordset);

  } catch (err) {
    console.error('Error generando reporte:', err);
    res.status(500).json({ error: err.message });
  }
};

// Eliminar nómina (solo si no está pagada)
export const eliminarNomina = async (req, res) => {
  const transaction = new sql.Transaction(await poolPromise);

  try {
    const { id } = req.params;
    await transaction.begin();
    const pool = transaction;

    const nominaResult = await pool.request()
      .input('nominaId', sql.Int, id)
      .query('SELECT Estado FROM Nomina WHERE NominaId = @nominaId');

    if (nominaResult.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Nómina no encontrada' });
    }

    if (nominaResult.recordset[0].Estado === 'pagada') {
      await transaction.rollback();
      return res.status(400).json({ error: 'No se puede eliminar una nómina ya pagada' });
    }

    await pool.request()
      .input('nominaId', sql.Int, id)
      .query('DELETE FROM NominaDetalle WHERE NominaId = @nominaId');

    const deleteResult = await pool.request()
      .input('nominaId', sql.Int, id)
      .query('DELETE FROM Nomina WHERE NominaId = @nominaId');

    await transaction.commit();

    res.json({
      message: 'Nómina eliminada exitosamente',
      eliminadas: deleteResult.rowsAffected[0]
    });

  } catch (err) {
    await transaction.rollback();
    console.error('Error eliminando nómina:', err);
    res.status(500).json({ error: err.message });
  }
};

// Obtener empleados activos para nómina
export const getEmpleadosActivos = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT 
        e.EmpleadoID as id,
        e.NOMBRE as nombre,
        e.APELLIDO as apellidos,
        e.CEDULA as cedula,
        e.Email as email,
        e.Telefono as telefono,
        e.CARGO as cargo,
        e.Salario as salarioBase,
        e.FECHAINGRESO as fechaIngreso,
        CASE 
          WHEN e.ESTADO = 1 THEN 'Activo'
          ELSE 'Inactivo'
        END as estado,
        e.DEPARTAMENTOID as departamentoId,
        d.Nombre as departamento
      FROM Empleados e
      LEFT JOIN Departamentos d ON e.DEPARTAMENTOID = d.DepartamentoID
      WHERE e.ESTADO = 1
      ORDER BY e.NOMBRE, e.APELLIDO
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error('Error al obtener empleados activos:', err);
    res.status(500).json({ error: err.message });
  }
};
