/**
 * Sustituto de `server-only` para el entorno de pruebas.
 *
 * El paquete real lanza en cuanto se importa fuera de un Server Component, lo
 * que impide probar en aislamiento cualquier servidor de servicio (`*.server.*`)
 * y, por transitividad, cualquier módulo que lo importe. Vitest ejecuta en
 * Node/jsdom, no en el runtime de React Server Components, así que la protección
 * no aporta nada aquí: se sustituye por un módulo vacío.
 *
 * La garantía real en producción la sigue dando el build de Next.js, que es
 * quien aplica la frontera servidor/cliente.
 */
export {}
