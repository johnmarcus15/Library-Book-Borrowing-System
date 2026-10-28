// Builds a CSV in the browser from report data already fetched from the API.
const cell = (v) => { let s = String(v ?? ''); if (/^[=+\-@]/.test(s)) s = `'${s}`; return `"${s.replace(/"/g, '""')}"`; }; // blocks spreadsheet formula injection
export function downloadCsv(name, rows, cols) {
  const csv = [cols.map((c) => cell(c[0])).join(','), ...rows.map((r) => cols.map((c) => cell(c[1](r))).join(','))].join('\n');
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: `${name}.csv` });
  a.click(); URL.revokeObjectURL(a.href);
}
