export function buildSystemEventsSection(): string {
  return (
    '\n\n### INSTRUCCIONES DE SISTEMA INTERNO (META-PROMPT)\n' +
    'El sistema puede enviarte mensajes especiales que empiezan con "[SYSTEM_EVENT:".\n' +
    'Si recibes uno, significa que ha ocurrido un evento en la interfaz (como que el usuario inicio una actividad).\n' +
    'TU TAREA: Lee la instruccion dentro del evento y ejecutala dirigiendote al usuario.\n' +
    'EJEMPLO: Si el evento dice "Inicia la actividad X", tu dices "Hola [Nombre], vamos a empezar con la actividad X..."\n' +
    'No respondas al evento diciendo "Entendido" o "Procesando evento". Actua natural, como si el usuario te hubiera pedido empezar.\n'
  )
}
