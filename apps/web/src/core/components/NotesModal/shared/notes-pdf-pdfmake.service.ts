import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import type { NoteDraft } from '../types';
import { buildNotePdfFileName } from './notes-modal.utils';
import {
  buildNotePdfDefinition,
  type BuildNotePdfDefinitionOptions,
} from './notes-pdf-definition.service';

export type NotePdfExportOptions = BuildNotePdfDefinitionOptions & {
  fileNameDate?: Date;
};

interface PdfMakeModule {
  addVirtualFileSystem?: (virtualFileSystem: Record<string, string>) => void;
  createPdf: (
    documentDefinitions: TDocumentDefinitions
  ) => {
    download: (defaultFileName?: string) => void;
    getBuffer: (callback: (buffer: Buffer) => void) => void;
  };
  default?: PdfMakeModule;
  vfs?: Record<string, string>;
}

interface PdfMakeFontsModule {
  pdfMake?: {
    vfs?: Record<string, string>;
  };
  default?: Record<string, string> | PdfMakeFontsModule;
  vfs?: Record<string, string>;
}

function isVirtualFileSystem(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return Object.keys(value).some((key) => key.endsWith('.ttf'));
}

function getVirtualFileSystem(
  fontsModule: PdfMakeFontsModule
): Record<string, string> | undefined {
  if (fontsModule.pdfMake?.vfs) {
    return fontsModule.pdfMake.vfs;
  }

  if (fontsModule.vfs) {
    return fontsModule.vfs;
  }

  if (isVirtualFileSystem(fontsModule.default)) {
    return fontsModule.default;
  }

  if (
    fontsModule.default &&
    !isVirtualFileSystem(fontsModule.default) &&
    'pdfMake' in fontsModule.default &&
    fontsModule.default.pdfMake?.vfs
  ) {
    return fontsModule.default.pdfMake.vfs;
  }

  return isVirtualFileSystem(fontsModule) ? fontsModule : undefined;
}

function getPdfMakeRuntime(pdfMakeModule: PdfMakeModule): PdfMakeModule {
  if (pdfMakeModule.default?.createPdf) {
    return pdfMakeModule.default;
  }

  return pdfMakeModule;
}

async function loadPdfMake(): Promise<PdfMakeModule> {
  const [pdfMakeModule, pdfMakeFontsModule] = await Promise.all([
    import('pdfmake/build/pdfmake'),
    import('pdfmake/build/vfs_fonts'),
  ]);
  const pdfMake = getPdfMakeRuntime(pdfMakeModule as PdfMakeModule);
  const fonts = pdfMakeFontsModule as PdfMakeFontsModule;
  const virtualFileSystem = getVirtualFileSystem(fonts);

  if (virtualFileSystem) {
    if (typeof pdfMake.addVirtualFileSystem === 'function') {
      pdfMake.addVirtualFileSystem(virtualFileSystem);
    } else {
      pdfMake.vfs = virtualFileSystem;
    }
  }

  return pdfMake;
}

export function buildNotePdfMakeDefinition(
  noteDraft: NoteDraft,
  options: BuildNotePdfDefinitionOptions
): TDocumentDefinitions {
  return buildNotePdfDefinition(noteDraft, options);
}

export async function generateNotePdfMakeBuffer(
  noteDraft: NoteDraft,
  options: BuildNotePdfDefinitionOptions
): Promise<Buffer> {
  if (!noteDraft.content.trim()) {
    throw new Error('La nota debe tener contenido para exportar');
  }

  const pdfMake = await loadPdfMake();
  const definition = buildNotePdfDefinition(noteDraft, options);

  return new Promise((resolve) => {
    pdfMake.createPdf(definition).getBuffer((buffer) => {
      resolve(buffer);
    });
  });
}

export async function exportNotePdfWithPdfMake(
  noteDraft: NoteDraft,
  options: NotePdfExportOptions
): Promise<void> {
  if (!noteDraft.content.trim()) {
    throw new Error('La nota debe tener contenido para exportar');
  }

  const pdfMake = await loadPdfMake();
  const definition = buildNotePdfDefinition(noteDraft, options);
  const fileName = buildNotePdfFileName(
    noteDraft.title,
    options.fileNameDate || options.generatedAt || new Date()
  );

  pdfMake.createPdf(definition).download(fileName);
}
