import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseScormManifest, validateScormPackage, type ScormManifest } from '@/lib/scorm/parser';
import { validatePackageSecurity } from '@/lib/scorm/validator';
import type { Json } from '@/lib/supabase/types';
import { validateAndPrepareUpload } from '@/lib/upload/validation.server';
import JSZip from 'jszip';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const courseId = formData.get('courseId') as string;
    const organizationId = formData.get('organizationId') as string;

    if (!file || !file.name.endsWith('.zip')) {
      return NextResponse.json(
        { error: 'Invalid file. Must be a ZIP' },
        { status: 400 }
      );
    }

    // Límite 100MB
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Max 100MB' },
        { status: 400 }
      );
    }

    const uploadValidation = await validateAndPrepareUpload(file, 'scorm-packages');
    if (!uploadValidation.valid) {
      return NextResponse.json(
        { error: uploadValidation.error || 'Invalid SCORM package' },
        { status: uploadValidation.antimalwareRequired ? 503 : 400 }
      );
    }

    if (!courseId || !organizationId) {
      return NextResponse.json(
        { error: 'courseId and organizationId are required' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Validar seguridad
    const securityCheck = await validatePackageSecurity(zip);
    if (!securityCheck.valid) {
      return NextResponse.json({ error: securityCheck.error }, { status: 400 });
    }

    // Buscar y validar imsmanifest.xml
    const manifestFile = zip.file('imsmanifest.xml');
    if (!manifestFile) {
      return NextResponse.json(
        { error: 'Invalid SCORM: missing imsmanifest.xml' },
        { status: 400 }
      );
    }

    const manifestXml = await manifestFile.async('string');
    const manifest = await parseScormManifest(manifestXml);

    // Validar estructura
    const validation = await validateScormPackage(zip, manifest);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Subir a Supabase Storage
    const packageId = crypto.randomUUID();
    const storagePath = `${organizationId}/${packageId}`;

    // Extraer y subir cada archivo
    const uploadPromises = Object.keys(zip.files).map(async (filename) => {
      const zipEntry = zip.files[filename];
      if (zipEntry.dir) return;

      const content = await zipEntry.async('arraybuffer');
      const filePath = `${storagePath}/${filename}`;

      const { error: uploadError } = await supabase.storage
        .from('scorm-packages')
        .upload(filePath, content, {
          contentType: getContentType(filename),
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Failed to upload ${filename}: ${uploadError.message}`);
      }
    });

    await Promise.all(uploadPromises);

    // Guardar metadata en DB
    const { data: package_, error } = await supabase
      .from('scorm_packages')
      .insert({
        id: packageId,
        organization_id: organizationId,
        course_id: courseId,
        title: manifest.title,
        description: manifest.description,
        version: manifest.version,
        manifest_data: scormManifestToJson(manifest),
        entry_point: manifest.entryPoint,
        storage_path: storagePath,
        file_size: file.size,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      // Si falla la inserción en DB, intentar limpiar los archivos subidos
      await supabase.storage
        .from('scorm-packages')
        .remove([storagePath]);
      throw error;
    }

    return NextResponse.json({ success: true, package: package_ });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process package';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const types: Record<string, string> = {
    html: 'text/html',
    htm: 'text/html',
    js: 'application/javascript',
    css: 'text/css',
    json: 'application/json',
    xml: 'application/xml',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    pdf: 'application/pdf',
    woff: 'font/woff',
    woff2: 'font/woff2',
    ttf: 'font/ttf',
    eot: 'application/vnd.ms-fontobject',
    swf: 'application/x-shockwave-flash',
  };
  return types[ext || ''] || 'application/octet-stream';
}

function scormManifestToJson(manifest: ScormManifest): Json {
  return {
    version: manifest.version,
    title: manifest.title,
    description: manifest.description ?? null,
    entryPoint: manifest.entryPoint,
    organizations: manifest.organizations.map((organization) => ({
      identifier: organization.identifier,
      title: organization.title,
      items: organization.items.map(scormItemToJson),
    })),
    resources: manifest.resources.map((resource) => ({
      identifier: resource.identifier,
      type: resource.type,
      href: resource.href ?? null,
      files: resource.files,
    })),
  };
}

function scormItemToJson(
  item: ScormManifest['organizations'][number]['items'][number],
): Json {
  return {
    identifier: item.identifier,
    title: item.title,
    resourceId: item.resourceId ?? null,
    children: item.children?.map(scormItemToJson) ?? [],
  };
}
