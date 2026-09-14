import Papa from 'papaparse';

// Builds CSV / Excel / PDF files in the browser from export rows returned by the API
// ({ columns: [{ key, label }], rows: [{ [key]: value }] }). xlsx and jspdf are loaded
// on demand so they stay out of the main bundle.

export const EXPORT_FORMATS = [
  { value: 'csv', label: 'CSV (.csv)', icon: 'eva:file-text-outline' },
  { value: 'xlsx', label: 'Excel (.xlsx)', icon: 'vscode-icons:file-type-excel' },
  { value: 'pdf', label: 'PDF (.pdf)', icon: 'vscode-icons:file-type-pdf2' },
];

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const toMatrix = (columns, rows) =>
  rows.map((row) => columns.map(({ key }) => (row[key] === null || row[key] === undefined ? '' : row[key])));

export async function exportTable({ format, columns, rows, title, fileBase, filterSummary = [] }) {
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `${fileBase || 'export'}-${stamp}.${format}`;
  const headers = columns.map((column) => column.label);
  const body = toMatrix(columns, rows);

  if (format === 'csv') {
    const csv = Papa.unparse({ fields: headers, data: body });
    // BOM so Excel opens UTF-8 names correctly.
    downloadBlob(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }), filename);
    return filename;
  }

  if (format === 'xlsx') {
    const XLSX = await import('xlsx');
    const sheet = XLSX.utils.aoa_to_sheet([headers, ...body]);
    sheet['!cols'] = headers.map((header, i) => ({
      wch: Math.min(Math.max(header.length, ...body.slice(0, 200).map((r) => String(r[i]).length)) + 2, 50),
    }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, (title || 'Export').slice(0, 31));
    const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    downloadBlob(
      new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      filename
    );
    return filename;
  }

  if (format === 'pdf') {
    const [{ jsPDF: JsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
    const doc = new JsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    doc.setFontSize(14);
    doc.text(title || 'Export', 40, 40);
    doc.setFontSize(9);
    doc.setTextColor(100);
    const subtitle = [`Generated ${new Date().toLocaleString()}`, `${rows.length} records`, ...filterSummary].join('  |  ');
    const subtitleLines = doc.splitTextToSize(subtitle, doc.internal.pageSize.getWidth() - 80);
    doc.text(subtitleLines, 40, 58);
    autoTable(doc, {
      head: [headers],
      body,
      startY: 58 + subtitleLines.length * 11 + 6,
      margin: { left: 40, right: 40 },
      styles: { fontSize: headers.length > 12 ? 6 : 8, cellPadding: 3, overflow: 'linebreak' },
      headStyles: { fillColor: [33, 43, 54] },
      didDrawPage: () => {
        const { pageSize } = doc.internal;
        doc.setFontSize(8);
        doc.text(`Page ${doc.getNumberOfPages()}`, pageSize.getWidth() - 80, pageSize.getHeight() - 20);
      },
    });
    doc.save(filename);
    return filename;
  }

  throw new Error(`Unsupported export format: ${format}`);
}
