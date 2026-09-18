/** 45000 -> "$45.000" (formato de precio corto para copy y tarjetas). */
export function formatCop(value: number): string {
  return `$${value.toLocaleString('es-CO')}`
}
