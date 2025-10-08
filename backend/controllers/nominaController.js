import { poolPromise } from '../db.js';
import sql from 'mssql';

// Obtener configuración de nómina
export const getConfiguracion = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT * FROM ConfiguracionNomina 
      WHERE Activo = 1
      ORDER BY TipoConfiguracion, ConfigID
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error al obtener configuración:', err);
    res.status(500).json({ error: err.message });
  }
};

// Actualizar configuración de nómina
export const actualizarConfiguracion = async (req, res) => {
  try {
    const { configuraciones } = req.body;
    const pool = await poolPromise;

    for (const config of configuraciones) {
      await pool.request()
        .input('codigo', sql.VarChar, config.codigo)
        .input('porcentaje', sql.Decimal(5, 2), config.porcentaje)
        .input('limiteInferior', sql.Decimal(15, 2), config.limiteInferior || null)
        .input('limiteSuperior', sql.Decimal(15, 2), config.limiteSuperior || null)
        .input('montoFijo', sql.Decimal(15, 2), config.montoFijo || null)
        .query(`
          UPDATE ConfiguracionNomina 
          SET Porcentaje = @porcentaje,
              LimiteInferior = @limiteInferior,
              LimiteSuperior = @limiteSuperior,
              MontoFijo = @montoFijo,
              FechaModificacion = GETDATE()
          WHERE Codigo = @codigo
        `);
    }

    res.json({ message: 'Configuración actualizada correctamente' });
  } catch (err) {
    console.error('Error al actualizar configuración:', err);
    res.status(500).json({ error: err.message });
  }
};

// Calcular nómina de un empleado
const calcularNominaEmpleado = async (request, empleadoId, periodo) => {
  const empleadoResult = await request
    .input('empleadoId', sql.Int, empleadoId)
    .query('SELECT * FROM Empleados WHERE EmpleadoID = @empleadoId AND ESTADO = 1');

  if (empleadoResult.recordset.length === 0) {
    throw new Error(`Empleado ${empleadoId} no encontrado`);
  }

  const empleado = empleadoResult.recordset[0];
  const salarioBase = empleado.Salario;

  const pool = request.parent || await poolPromise;
  const configResult = await pool.request().query(`
    SELECT * FROM ConfiguracionNomina WHERE Activo = 1
  `);
  const config = configResult.recordset;

  const tssAfpConfig = config.find(c => c.Codigo === 'TSS_AFP');
  if (!tssAfpConfig) throw new Error('Configuración TSS_AFP no encontrada');
  const tss_afp = salarioBase * (tssAfpConfig.Porcentaje / 100);

  const tssSfsConfig = config.find(c => c.Codigo === 'TSS_SFS');
  if (!tssSfsConfig) throw new Error('Configuración TSS_SFS no encontrada');
  const tss_sfs = salarioBase * (tssSfsConfig.Porcentaje / 100);

  const totalTSS = tss_afp + tss_sfs;

  const savicaConfig = config.find(c => c.Codigo === 'SAVICA');
  const savica = savicaConfig ? salarioBase * (savicaConfig.Porcentaje / 100) : 0;

  const salarioAnual = salarioBase * 12;
  let isr = 0;

  const escalasISR = config
    .filter(c => c.TipoConfiguracion === 'ISR')
    .sort((a, b) => a.LimiteInferior - b.LimiteInferior);

  for (const escala of escalasISR) {
    if (salarioAnual > escala.LimiteInferior && salarioAnual <= escala.LimiteSuperior) {
      const excedente = salarioAnual - escala.LimiteInferior;
      isr = escala.MontoFijo + (excedente * (escala.Porcentaje / 100));
      break;
    }
  }
  isr = isr / 12;

  const totalDevengado = salarioBase;
  const totalDeducciones = totalTSS + savica + isr;
  const salarioNeto = totalDevengado - totalDeducciones;

  return {
    empleado,
    salarioBase,
    tss_afp,
    tss_sfs,
    totalTSS,
    savica,
    isr,
    totalDevengado,
    totalDeducciones,
    salarioNeto
  };
};

// Procesar nómina
export const procesarNomina = async (req, res) => {
  let transaction;
  
  try {
    const { periodo, empleadosIds = [] } = req.body;
    
    if (!periodo) {
      return res.status(400).json({ error: 'El periodo es requerido' });
    }

    const pool = await poolPromise;
    transaction = new sql.Transaction(pool);
    
    await transaction.begin();

    let query = 'SELECT EmpleadoID FROM Empleados WHERE ESTADO = 1';
    if (empleadosIds.length > 0) {
      query += ` AND EmpleadoID IN (${empleadosIds.join(',')})`;
    }

    const empleadosResult = await transaction.request().query(query);
    
    if (empleadosResult.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ error: 'No se encontraron empleados activos' });
    }

    const nominasCreadas = [];

    for (const emp of empleadosResult.recordset) {
      try {
        const request = transaction.request();
        const calculo = await calcularNominaEmpleado(request, emp.EmpleadoID, periodo);

        // Calcular fechas del periodo
        const [year, month] = periodo.split('-');
        const fechaInicio = new Date(year, month - 1, 1);
        const fechaFin = new Date(year, month, 0);

        await transaction.request()
          .input('empleadoId', sql.Int, emp.EmpleadoID)
          .input('periodo', sql.VarChar, periodo)
          .input('fechaInicio', sql.Date, fechaInicio)
          .input('fechaFin', sql.Date, fechaFin)
          .input('estado', sql.VarChar, 'Procesada')
          .input('salarioBase', sql.Decimal(12, 2), calculo.salarioBase)
          .input('totalDevengado', sql.Decimal(12, 2), calculo.totalDevengado)
          .input('tss_afp', sql.Decimal(12, 2), calculo.tss_afp)
          .input('tss_sfs', sql.Decimal(12, 2), calculo.tss_sfs)
          .input('totalTSS', sql.Decimal(12, 2), calculo.totalTSS)
          .input('savica', sql.Decimal(12, 2), calculo.savica)
          .input('isr', sql.Decimal(12, 2), calculo.isr)
          .input('totalDeducciones', sql.Decimal(12, 2), calculo.totalDeducciones)
          .input('salarioNeto', sql.Decimal(12, 2), calculo.salarioNeto)
          .query(`
            INSERT INTO Nomina (
              EmpleadoID, Periodo, FechaInicio, FechaFin, Estado,
              SalarioBase, TotalDevengado, TSS_AFP, TSS_SFS, TotalTSS,
              Savica, ISR, TotalDeducciones, SalarioNeto, FechaRegistro
            ) VALUES (
              @empleadoId, @periodo, @fechaInicio, @fechaFin, @estado,
              @salarioBase, @totalDevengado, @tss_afp, @tss_sfs, @totalTSS,
              @savica, @isr, @totalDeducciones, @salarioNeto, GETDATE()
            )
          `);

        nominasCreadas.push({
          empleadoId: emp.EmpleadoID,
          nombre: calculo.empleado.NOMBRE,
          apellido: calculo.empleado.APELLIDO,
          salarioNeto: calculo.salarioNeto
        });

        console.log(`✅ Empleado ${emp.EmpleadoID} procesado - Salario Neto: ${calculo.salarioNeto.toFixed(2)}`);

      } catch (empError) {
        console.error(`❌ Error procesando empleado ${emp.EmpleadoID}:`, empError.message);
        throw empError;
      }
    }

    await transaction.commit();
    console.log(`✅ Nómina procesada exitosamente: ${nominasCreadas.length} empleados`);
    
    res.json({
      success: true,
      message: `Nómina procesada para ${nominasCreadas.length} empleados`,
      periodo: periodo,
      nominas: nominasCreadas
    });

  } catch (err) {
    console.error('❌ Error procesando nómina:', err);
    
    if (transaction) {
      try {
        if (!transaction._aborted && !transaction._rollbackRequested) {
          await transaction.rollback();
          console.log('✅ Rollback ejecutado correctamente');
        } else {
          console.log('⚠️ Transacción ya abortada, rollback no necesario');
        }
      } catch (rollbackError) {
        console.error('⚠️ Error en rollback (ignorado):', rollbackError.message);
      }
    }
    
    res.status(500).json({ 
      success: false,
      error: err.message,
      details: 'Error al procesar nómina. Verifica la configuración y las columnas de la tabla Nomina.'
    });
  }
};

// Listar nóminas procesadas
export const getNominas = async (req, res) => {
  try {
    const { periodo } = req.query;
    const pool = await poolPromise;
    const request = pool.request();

    let query = `
      SELECT 
        n.*,
        e.NOMBRE,
        e.APELLIDO,
        e.CEDULA,
        e.CARGO,
        e.FECHAINGRESO
      FROM Nomina n
      INNER JOIN Empleados e ON n.EmpleadoID = e.EmpleadoID
      WHERE 1=1
    `;

    if (periodo) {
      query += " AND n.Periodo = @periodo";
      request.input('periodo', sql.VarChar, periodo);
    }

    query += " ORDER BY e.NOMBRE, e.APELLIDO";

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error al obtener nóminas:', err);
    res.status(500).json({ error: err.message });
  }
};

// Obtener empleados activos
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
        CASE WHEN e.ESTADO = 1 THEN 'Activo' ELSE 'Inactivo' END as estado,
        e.DEPARTAMENTOID as departamentoId,
        d.Nombre as departamento
      FROM Empleados e
      LEFT JOIN Departamentos d ON e.DEPARTAMENTOID = d.DepartamentoID
      WHERE e.ESTADO = 1
      ORDER BY e.NOMBRE, e.APELLIDO
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error al obtener empleados:', err);
    res.status(500).json({ error: err.message });
  }
};

// Obtener nómina por ID
export const getNominaById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    const result = await pool.request()
      .input('nominaId', sql.Int, id)
      .query(`
        SELECT n.*, e.NOMBRE, e.APELLIDO, e.CEDULA, e.CARGO
        FROM Nomina n
        INNER JOIN Empleados e ON n.EmpleadoID = e.EmpleadoID
        WHERE n.NominaID = @nominaId
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Nómina no encontrada' });
    }
    
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error al obtener nómina:', err);
    res.status(500).json({ error: err.message });
  }
};

// Marcar nóminas como pagadas
export const marcarNominaPagada = async (req, res) => {
  try {
    const { nominaIds, fechaPago } = req.body;
    
    if (!nominaIds || nominaIds.length === 0) {
      return res.status(400).json({ error: 'Se requiere al menos una nómina' });
    }

    const pool = await poolPromise;
    await pool.request()
      .input('fechaPago', sql.Date, fechaPago || new Date())
      .query(`
        UPDATE Nomina 
        SET Estado = 'Pagada', FechaPago = @fechaPago
        WHERE NominaID IN (${nominaIds.join(',')})
      `);
    
    res.json({ 
      success: true,
      message: `${nominaIds.length} nóminas marcadas como pagadas` 
    });
  } catch (err) {
    console.error('Error al marcar nóminas como pagadas:', err);
    res.status(500).json({ error: err.message });
  }
};

// Generar reporte de nómina
export const generarReporteNomina = async (req, res) => {
  try {
    const { periodo } = req.query;
    const pool = await poolPromise;
    const request = pool.request();

    if (periodo) request.input('periodo', sql.VarChar, periodo);

    const result = await request.query(`
      SELECT 
        n.*,
        e.NOMBRE,
        e.APELLIDO,
        e.CEDULA,
        e.CARGO
      FROM Nomina n
      INNER JOIN Empleados e ON n.EmpleadoID = e.EmpleadoID
      ${periodo ? 'WHERE n.Periodo = @periodo' : ''}
      ORDER BY n.Periodo DESC, e.NOMBRE, e.APELLIDO
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error('Error al generar reporte:', err);
    res.status(500).json({ error: err.message });
  }
};

// Eliminar nómina
export const eliminarNomina = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    const checkResult = await pool.request()
      .input('nominaId', sql.Int, id)
      .query('SELECT Estado FROM Nomina WHERE NominaID = @nominaId');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Nómina no encontrada' });
    }

    if (checkResult.recordset[0].Estado === 'Pagada') {
      return res.status(400).json({ error: 'No se puede eliminar una nómina pagada' });
    }

    await pool.request()
      .input('nominaId', sql.Int, id)
      .query('DELETE FROM Nomina WHERE NominaID = @nominaId');
    
    res.json({ 
      success: true,
      message: 'Nómina eliminada correctamente' 
    });
  } catch (err) {
    console.error('Error al eliminar nómina:', err);
    res.status(500).json({ error: err.message });
  }
};