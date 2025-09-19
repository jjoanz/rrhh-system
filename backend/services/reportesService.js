import ExcelJS from "exceljs";
import { Parser } from "json2csv";

// Exportar a Excel
export const exportToExcel = async (data) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Reporte");

  if (data.length > 0) {
    sheet.columns = Object.keys(data[0]).map((key) => ({
      header: key,
      key,
      width: 20,
    }));
    sheet.addRows(data);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

// Exportar a CSV
export const exportToCSV = async (data) => {
  const parser = new Parser();
  return parser.parse(data);
};

// Exportar a HTML
export const exportToHTML = async (data) => {
  if (!data.length) return "<p>Sin resultados</p>";

  const headers = Object.keys(data[0]);
  const rows = data.map(
    (row) =>
      `<tr>${headers.map((h) => `<td>${row[h] ?? ""}</td>`).join("")}</tr>`
  );

  return `
    <html>
      <head><title>Reporte</title></head>
      <body>
        <table border="1" cellpadding="5" cellspacing="0">
          <thead>
            <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
          </thead>
          <tbody>${rows.join("")}</tbody>
        </table>
      </body>
    </html>
  `;
};
