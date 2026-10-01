# PRP-002 — Panel de gestión interno (centro de operaciones)

> **Estado**: PENDIENTE
> **Creado**: 2026-10-01
> **Origen**: planificación directa, sin brief previo. Nace de la conversación del propietario del 2026-10-01 y de sus cuatro definiciones: dirección secreta generada por el agente, usuarios administradores personalizados con roles **gerente** y **comercial**, manejo de **abono y saldo**, y del restaurante **solo el conteo de comensales**.

---

## Objetivo

Quiero un panel de gestión propio, separado de la página pública, donde mi equipo y yo veamos en un solo calendario toda la ocupación de la finca —habitaciones y pasadías— y podamos registrar y controlar las reservas sin que se crucen. Quiero saber, en cualquier momento, qué habitaciones están ocupadas, cuánta gente viene cada día, cuánto me han abonado y cuánto falta por cobrar. Quiero entrar desde el celular como si fuera una aplicación, con una dirección que nadie pueda adivinar y que no aparezca en Google.

## Por Qué

Hoy opero las reservas por WhatsApp y de memoria. Eso me expone a dos cosas que cuestan dinero: vender dos veces la misma habitación la misma noche, y perder el rastro de quién abonó y quién no. Además no tengo forma de ver si la finca va llena o vacía la semana entrante, así que no puedo tomar decisiones de promoción ni de personal. El motor público de reservas llega después; primero necesito que mi propio equipo tenga el control.

---

## Qué

### Criterios de éxito

1. En una sola pantalla se ve un calendario con las 10 habitaciones en filas y los días en columnas; cada reserva es una barra con el nombre del huésped y su estado.
2. El sistema **impide** guardar una reserva que se cruce con otra existente o con un bloqueo de mantenimiento en la misma habitación.
3. Debajo del calendario de habitaciones hay una franja por día con las pasadías: personas inscritas, cupo restante y desglose por tipo (Loma Relax, Racing, Aventura Balsaje, Aventura Cascadas).
4. Cada reserva y cada pasadía admite abonos (valor, fecha y medio de pago); el sistema calcula el saldo pendiente y lista los que deben.
5. Un tablero muestra: ocupación del mes, reservas de la semana, llegadas y salidas de hoy, comensales esperados hoy, ingresos esperados frente a lo abonado y pasadías por tipo.
6. El panel vive en una dirección secreta, no indexable, que **no está escrita en el código** sino en la configuración del servidor.
7. Hay gestión de usuarios: el propietario invita personas y les asigna rol (gerente, comercial, recepción, cocina); cada rol ve solo lo que le corresponde.
8. El panel se instala en el celular como aplicación y funciona bien a 390 px de ancho.
9. Toda acción sensible (crear, mover, cancelar una reserva, registrar un abono) queda registrada con autor y fecha.

### Comportamiento esperado

- **Estados de una reserva**: solicitada → confirmada → en casa → salió. Más cancelada y no presentada (no show).
- **Bloqueo de disponibilidad**: una habitación queda bloqueada mientras la reserva esté en solicitada, confirmada o en casa.
- **Pasadías**: el cupo del día lo fija el panel; al llegar al tope, el día se marca lleno.
- **Comensales del día**: suma de huéspedes alojados + personas de pasadías de esa fecha, para que la cocina sepa cuánta comida preparar.
- **Permisos**: el propietario y el gerente ven dinero y métricas; el comercial crea y gestiona reservas y abonos pero no cambia precios ni cupos ni usuarios; recepción opera el día (check-in/out) sin ver ingresos globales; cocina solo ve comensales y pedidos.

### Casos borde

- Dos personas intentan reservar la misma habitación y fechas al mismo tiempo → la segunda falla con mensaje claro, nunca se guardan ambas.
- Cambiar una reserva de habitación o de fechas hacia un rango ya ocupado → se rechaza con el motivo.
- Pasar una reserva a cancelada libera la disponibilidad inmediatamente.
- Un abono mayor al valor total → se rechaza o se marca como saldo a favor, nunca produce un saldo negativo silencioso.
- Reserva sin valor total definido → el saldo se muestra como "por definir", no como cero.
- Usuario desactivado → pierde acceso en su siguiente petición, aunque su sesión siga abierta.

---

## Contexto

### Código existente que se reutiliza

- `reservations` ya impide cruces a nivel de base de datos con una restricción de exclusión por habitación y rango de fechas.
- `rooms`, `room_types`, `room_blocks` (bloqueos de mantenimiento) y sus pantallas de administración.
- `tickets` y `pass_capacity` con guarda anti-carrera por fecha (bloqueo de aforo con advisory lock).
- `profiles` con enum `staff_role` (owner, admin, recepcion, cocina, anfitrion) y función `is_staff()` usada por todas las políticas RLS.
- Entrada sin contraseña por código OTP al correo (`login-form.tsx`), middleware que protege las rutas gestionadas y las marca no indexables.
- Pantallas de administración de hospedaje, pasadías, restaurante y solicitudes corporativas.

### Gotchas medidos del terreno

1. **El repositorio de GitHub es público** (verificado con la API de GitHub el 2026-10-01). Cualquier ruta escrita en el código es descubrible: la dirección secreta del panel **debe** vivir en una variable de entorno, nunca en el repositorio.
2. **No listar la ruta secreta en `robots.txt`**: un `Disallow` la publica. La protección correcta es cabecera `noindex` + ningún enlace público + acceso autenticado.
3. **La restricción de exclusión de `reservations` sólo cubre los estados `solicitada` y `confirmada`.** Al agregar el estado "en casa" hay que incluirlo en esa restricción, o una habitación ocupada quedará libre para otra reserva.
4. **El proyecto Supabase se pausa solo tras un periodo sin uso** (ocurrió el 2026-09-17 y dejó el formulario corporativo vacío en producción). Un panel operativo no puede depender de un proyecto que se apaga: hay que validar el plan de Supabase y un chequeo de salud.
5. Políticas de inserción anónima: nunca encadenar una lectura inmediata después de insertar como anónimo (devuelve 401 aunque la fila se guarde).
6. Zona horaria: las fechas de operación son de Colombia (UTC-5). Un desfase de zona corre las reservas un día.
7. La carpeta anidada `Loma bonita v2/` está excluida de la verificación de tipos; borrarla o incluirla rompe el build.

### Modelo de datos (cambios previstos)

- Ampliar el enum de roles con `gerente` y `comercial`.
- Ampliar estados de `reservations` (`en_casa`, `salio`, `no_show`) y actualizar la restricción de exclusión.
- Añadir a `reservations`: valor total, origen (whatsapp / web / presencial / teléfono) y notas internas.
- Tabla nueva de **pagos** (abonos) ligada a una reserva o a un ticket de pasadía, con valor, fecha, medio y autor.
- Tabla nueva de **auditoría**: quién, qué acción, sobre qué registro, cuándo y el cambio.
- Vista o consulta de **comensales por día** (huéspedes alojados + personas de pasadías).
- Todas las tablas nuevas nacen con RLS activo y políticas por rol.

---

## Directiva de Stack heredada

No hay brief origen: aplica el Trust Stack por defecto de Praxis, ya vigente en el proyecto (Next.js 16 + React 19 + TypeScript, Tailwind, Supabase con RLS, Zod). Se añade únicamente lo necesario para la app instalable (manifest + service worker) y una librería de calendario sólo si la vista matriz no se resuelve con CSS grid.

## Supuestos heredados

- [ ] El proyecto Supabase permanece activo (no pausado) mientras el panel esté en uso.
- [ ] Los usuarios del panel tienen acceso al correo donde llega el código de entrada.
- [ ] El propietario define quiénes son gerente y comercial, y con qué correos.
- [ ] Las tarifas vigentes son las publicadas: hospedaje $125.000 por persona (menores de 5 años gratis) y pasadías $45.000 / $60.000 / $100.000 / $110.000.

## Fuera de Alcance heredado

- Motor público de reservas para clientes (lo pidió el propietario explícitamente para una versión posterior).
- Pagos en línea / pasarela.
- Integración con portales externos (Booking, Airbnb, Expedia).
- Facturación electrónica DIAN.
- Inventario y costos del restaurante.
- Reservas de mesa por hora en el restaurante (el propietario eligió sólo el conteo de comensales).

## Terreno heredado

No hay encargo de un director: planificación directa con el propietario.

## Aprendizajes heredados de fases previas

- Documentar un gotcha no evita que se repita: hay que recordárselo explícitamente a cada ejecutor nuevo.
- Un insert con la llave de servicio nunca prueba que el flujo real funcione.
- La caché de imágenes y del navegador engaña al verificar cambios visuales.
- Vercel no publica solo: tras el push hay que disparar el despliegue de producción.

---

## Plan de implementación

### Fase 1 — Acceso, roles y dirección secreta
**Objetivo**: el panel vive en una dirección secreta configurable por entorno, con roles gerente y comercial, gestión de usuarios y registro de auditoría.
**Validación**: la dirección secreta responde 200 autenticado y redirige a login sin sesión; la dirección antigua del panel ya no existe (404); `grep` de la ruta secreta en el repositorio no la encuentra (control negativo); `robots.txt` no la menciona; un usuario con rol comercial recibe 403 al intentar la gestión de usuarios y el propietario entra (control positivo y negativo del mismo permiso); cada alta de usuario deja fila en auditoría.

### Fase 2 — Calendario matriz de hospedaje
**Objetivo**: ver en una pantalla las 10 habitaciones por día con sus reservas y bloqueos, navegable por mes y por semana, usable a 390 px.
**Validación**: con dos reservas sembradas en habitaciones distintas, la vista las dibuja en su fila y rango correctos; un bloqueo de mantenimiento aparece diferenciado; `document.documentElement.scrollWidth` igual al ancho del viewport en 390 px; una reserva cancelada desaparece del calendario (control negativo).

### Fase 3 — Motor interno de reservas
**Objetivo**: crear, editar, mover, cancelar y hacer check-in/check-out desde el panel sin cruces posibles.
**Validación**: crear una reserva que se cruza con otra devuelve error y no inserta fila (control negativo medido en base de datos); la misma reserva en fechas libres se guarda (control positivo); mover una reserva a un rango ocupado se rechaza; una reserva en estado "en casa" sigue bloqueando la habitación frente a un intento de doble venta; dos intentos simultáneos sobre la misma habitación dejan exactamente una fila.

### Fase 4 — Pasadías y cupo en el calendario
**Objetivo**: franja diaria con personas inscritas, cupo restante y desglose por tipo de pasadía, con edición del cupo del día.
**Validación**: con cupo fijado en N, inscribir N personas marca el día como lleno y el intento N+1 se rechaza (control negativo); bajar el cupo por debajo de lo ya vendido avisa y no corrompe los datos; el desglose por tipo suma exactamente el total del día.

### Fase 5 — Abonos y saldos
**Objetivo**: registrar pagos parciales en reservas y pasadías, con saldo calculado, historial y lista de pendientes.
**Validación**: dos abonos sobre una reserva de valor conocido dejan el saldo exacto esperado; un abono superior al total se rechaza con mensaje (control negativo); la lista de saldos pendientes excluye las reservas totalmente pagadas; cada abono queda en auditoría con su autor.

### Fase 6 — Tablero de métricas y comensales
**Objetivo**: tablero con ocupación, reservas de la semana, llegadas y salidas de hoy, comensales esperados, ingresos esperados frente a abonados y pasadías por tipo, con exportación.
**Validación**: con datos sembrados conocidos, cada métrica coincide con el cálculo manual; el conteo de comensales de una fecha iguala huéspedes alojados más personas de pasadías de esa fecha; la exportación descarga un archivo con el mismo número de filas que la vista; un rol comercial no ve las métricas de ingresos (control negativo).

### Fase 7 — Aplicación instalable y avisos
**Objetivo**: el panel se instala como app en el celular y avisa cuando entra una solicitud nueva.
**Validación**: el navegador ofrece instalar en la dirección secreta y la app abre en modo aplicación; el manifiesto y el service worker se sirven con alcance limitado al panel; la página pública NO ofrece instalación (control negativo); una solicitud nueva genera su aviso.

### Fase 8 — Endurecimiento y cierre
**Objetivo**: cerrar seguridad, rendimiento y documentación operativa del panel.
**Validación**: sesión inactiva expira en el plazo definido; el panel responde con cabecera noindex en todas sus rutas; un usuario desactivado pierde acceso en la siguiente petición (control positivo y negativo); las políticas de base de datos rechazan lecturas de un usuario sin rol; `npx tsc --noEmit`, `npx eslint src` y `npx next build` limpios; recorrido completo en navegador real del flujo reserva → abono → check-in → salida.

---

## Aprendizajes

(Se completa durante la ejecución.)

---

## Anti-patrones

- NO generar nuevos PRPs durante la ejecución de este PRP.
- NO escribir la dirección secreta del panel en el código ni en el repositorio público.
- NO listar la ruta del panel en `robots.txt`.
- NO reemplazar la restricción de exclusión de la base de datos por validaciones sólo en el código: la base de datos es la última línea contra la doble venta.
- NO abrir el motor de reservas al público en este PRP.
- NO dar por verificada una fase con un insert hecho con la llave de servicio.
- NO degradar un criterio de validación para que pase: aflojarlo es una decisión que se anuncia.

---

## Comandos de validación final

```bash
npx tsc --noEmit
npx eslint src
npx next build
```
Más recorrido en navegador real del flujo completo y verificación de permisos por rol.
