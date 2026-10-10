// CSV hücresi: tırnak içine alınır, içindeki tırnaklar ikilenir. =, +, -, @ ile başlayan değerlerin
// başına ' eklenir; böylece Excel/LibreOffice ziyaretçiden gelen bir değeri (referrer, abone adı)
// formül olarak çalıştırmaz.
export function csvCell(value: unknown): string {
  let text = String(value ?? '')
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return `"${text.replace(/"/g, '""')}"`
}

export function csvRow(values: unknown[]): string {
  return values.map(csvCell).join(',')
}

// Excel'in UTF-8'i (Türkçe karakterleri) doğru tanıması için dosya başı işareti
export const CSV_BOM = '﻿'
