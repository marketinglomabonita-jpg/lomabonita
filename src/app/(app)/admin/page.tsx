export default function AdminHomePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-primary">Resumen</h1>
      <p className="text-sm text-muted-foreground">
        Panel unificado de Loma Bonita. Las secciones (Hospedaje, Restaurante, Pasadías,
        Experiencias, Leads corporativos) y las notificaciones se activan en sus fases
        correspondientes.
      </p>
      <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
        Sin datos todavía — este es el estado inicial de la Fase 0.
      </div>
    </div>
  )
}
