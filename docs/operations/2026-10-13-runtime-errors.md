# Errores de ejecución: permisos, sesiones y tareas programadas

Las capturas del 13 de octubre muestran `42501`/403 al leer y actualizar
`public.users`, tokens malformados en `/auth/v1/user`, rechazo de refresh y
errores 500/499 en Netlify. Las capturas no contienen el cuerpo de respuesta
de los jobs ni el stack del error 500 de `/`; esas causas requieren los logs
de la invocación desplegada para confirmarse.

## Correcciones

- La actualización del perfil usa el cliente exclusivo de servidor después
  de `requireUser()`, con filtros por el usuario autenticado y campos permitidos.
  El rol se excluye del formulario, del contrato API y de la escritura.
- Las marcas de login solo se escriben con el cliente de servidor después de
  verificar credenciales. No se amplían los permisos SQL ni se desactiva RLS.
- Los endpoints del Hub rechazan tokens sin tres segmentos JWT válidos antes
  de consultar Auth. Supabase sigue verificando la firma y la identidad.
- Middleware propaga las cookies rotadas al handler, conservando el nonce CSP.
  Las visitas sin sesión y las rutas de jobs no hacen refresh de navegador.
- Los jobs de estado y alertas comparten la resolución de credenciales entre
  Netlify y el handler. Se usa `QUEUE_INTERNAL_SECRET` si existe; de lo contrario,
  `CRON_SECRET`. Con ambos configurados, únicamente se acepta el de la cola.
- El cron de notebooks despacha un worker `-background`. Este llama hasta diez
  lotes HTTP de un trabajo y termina si la cola está vacía. Conserva el secreto
  `CRON_SECRET`, las leases y los reintentos de la cola existente.
- La IA del notebook respeta el tiempo restante y reserva cinco segundos para
  persistencia. Las llamadas de la cola no reintentan IA dentro del lote; la
  cola durable conserva sus propios reintentos. El circuit breaker conserva su
  estado compartido y aplica el timeout y los reintentos de cada invocación.
  Los trabajos reclamados que no empezaron se reprograman sin
  consumir un intento; el RPC existente decrementa el intento del claim.

## Aplicación y comprobación en producción

Desplegar el código y `netlify.toml` juntos; el scheduler necesita la nueva
función `process-notebook-generation-background`. Esta modificación no requiere
una migración SQL ni dependencias nuevas.

En el entorno de Functions deben estar disponibles `NEXT_PUBLIC_SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY` y `CRON_SECRET`. `QUEUE_INTERNAL_SECRET` es opcional
para estos dos jobs programados, pero sigue siendo necesario para los workers
de QStash si se utilizan. Nunca colocar credenciales de servidor en variables
`NEXT_PUBLIC_*`. `URL` de Netlify tiene precedencia sobre el dominio público
configurado para que el job llegue al despliegue correspondiente.

Comprobar el resultado del worker en sus logs: el 202 del scheduler confirma
el despacho, no la generación. Verificar después las lecturas de perfil y las
marcas de actividad; la credencial de servicio debe conservar sus permisos
existentes sobre `public.users`.

Un refresh revocado/reutilizado debe seguir rechazándose. Si el rechazo persiste
tras corregir la propagación de cookies, revisar la rotación y las solicitudes
concurrentes del cliente desplegado; no reutilizar tokens revocados.

Para el 500 de `/`, revisar el stack y el identificador de invocación en Netlify.
La exclusión de Auth en visitas anónimas elimina una dependencia innecesaria,
pero no demuestra la causa de ese error concreto. Confirmar también que el
despliegue probado corresponde al commit corregido.

Referencias de la plataforma: [Scheduled Functions](https://docs.netlify.com/build/functions/scheduled-functions/)
y [Background Functions](https://docs.netlify.com/build/functions/background-functions/).

## Validación local

- 222 pruebas aprobadas en 36 archivos: sesiones, permisos, perfil, scheduler,
  cola de notebooks, proveedores de IA y circuit breaker.
- ESLint de los archivos modificados: cero errores y cero advertencias.
- Las cuatro funciones afectadas se empaquetan con esbuild para Node 22.
- `/` responde HTTP 200 en desarrollo con CSP; se detuvo el servidor de prueba.
- `type-check:core` aprobado. Comparación de diagnósticos contra el contenido
  original de `HEAD`, con las mismas dependencias y archivos generados de Next:
  `app` pasa de 302 a 301 errores y `features` conserva sus siete errores.
  Ninguno de los cambios introduce un diagnóstico nuevo. El chequeo global
  sigue fallando por los errores existentes y no se deshabilitó ninguna regla.

No se desplegaron estos cambios ni se modificó producción durante la revisión.
