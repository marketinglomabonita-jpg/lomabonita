export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* TODO: nav lateral / topbar del area autenticada */}
      <main className="min-h-screen">{children}</main>
    </div>
  );
}
