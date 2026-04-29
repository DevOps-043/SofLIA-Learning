# NotesModal

Este directorio contiene el modal de notas y el flujo oficial de exportacion a PDF.

## Archivos principales

- `NotesModal.tsx` - Version principal del modal de notas.
- `NotesModalWithLibraries.tsx` - Alias compatible para rutas que ya cargan este componente.
- `shared/notes-pdf-pdfmake.service.ts` - Exportador cliente con `pdfmake`.
- `shared/notes-pdf-definition.service.ts` - Builder declarativo del documento PDF.
- `shared/notes-pdf-content-parser.service.ts` - Parser allowlist de HTML de notas a bloques semanticos.

## Uso

```tsx
import { NotesModal } from '@/core/components/NotesModal';

<NotesModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onSave={handleSave}
  initialNote={editingNote}
  isEditing={!!editingNote}
/>;
```

`NotesModalWithLibraries` mantiene la misma API para compatibilidad con flujos existentes.

## Motor PDF

La exportacion oficial de notas usa `pdfmake`, no `jsPDF` ni `html2canvas`. El objetivo es evitar calculos manuales de coordenadas y delegar wrapping, paginacion, listas, margenes y footers a un motor declarativo.

```bash
npm install pdfmake@0.2.23 @types/pdfmake@0.2.12 --workspace=apps/web
```

## Caracteristicas

- Editor de texto enriquecido: negrita, cursiva, subrayado, encabezados, listas y enlaces.
- Etiquetas de notas.
- Exportacion PDF con titulo, fecha, tags, contenido, enlaces y footer con pagina actual/total.
- Parser allowlist: no renderiza HTML crudo, scripts, styles ni atributos desconocidos.
- Pruebas enfocadas para transcripts largos, timestamps, listas, links y sanitizacion basica.

## Solucion de problemas

### Error "Cannot find module 'pdfmake'"

```bash
npm list pdfmake @types/pdfmake --workspace=apps/web
npm install pdfmake@0.2.23 @types/pdfmake@0.2.12 --workspace=apps/web
```

Despues de instalar, reinicia el servidor de desarrollo.

### Problemas de formato en PDF

- Revisa `notes-pdf-content-parser.service.ts` para la conversion HTML -> bloques semanticos.
- Revisa `notes-pdf-definition.service.ts` para estilos, margenes y footer.
- Agrega una prueba de regresion antes de ajustar el layout.

## Notas de mantenimiento

- `pdfmake` es el motor recomendado para PDF de notas.
- `jsPDF` y `html2canvas` quedan como legacy mientras existan otros usos internos.
- Los consumidores del modal no requieren migracion: el boton PDF usa `exportNotePdfWithPdfMake` internamente.
