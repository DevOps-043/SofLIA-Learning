import React from 'react'
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from '@react-pdf/renderer'
import { NextResponse } from 'next/server'

import { fetchNotebookNote } from '@/features/notebook/services/notebook.server.service'
import { createAdminClient } from '@/lib/supabase/admin'

import {
  compendiumCourseIdSchema,
  notebookErrorResponse,
  resolveNotebookAuth,
} from '../../../_shared'

const styles = StyleSheet.create({
  body: { fontFamily: 'Helvetica', fontSize: 10, lineHeight: 1.5, padding: 42 },
  footer: { bottom: 18, fontSize: 8, left: 42, position: 'absolute', right: 42 },
  heading: { fontSize: 14, fontWeight: 700, marginBottom: 6, marginTop: 12 },
  paragraph: { marginBottom: 6 },
  title: { fontSize: 20, fontWeight: 700, marginBottom: 16 },
})

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function htmlBlocks(html: string): Array<{ heading: boolean; text: string }> {
  const normalized = html
    .replace(/<(h[1-4])[^>]*>/gi, '\n[[HEADING]]')
    .replace(/<\/(h[1-4])>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<\/(li|p|blockquote)>/gi, '\n')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
  return decodeEntities(normalized)
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .map((line) => ({
      heading: line.startsWith('[[HEADING]]'),
      text: line.replace(/^\[\[HEADING\]\]/, '').trim(),
    }))
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgSlug: string; courseId: string }> },
) {
  try {
    const { orgSlug, courseId } = await params
    const auth = await resolveNotebookAuth(orgSlug)
    if (auth instanceof NextResponse) return auth
    const parsed = compendiumCourseIdSchema.safeParse(courseId)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Curso inválido.' }, { status: 422 })
    }

    const client = createAdminClient()
    const { data: noteRow, error } = await client
      .from('user_lesson_notes')
      .select('note_id')
      .eq('user_id', auth.userId)
      .eq('organization_id', auth.organizationId)
      .eq('course_id', parsed.data)
      .eq('source_type', 'course_compendium')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle<{ note_id: string }>()
    if (error) throw new Error(error.message)
    if (!noteRow) {
      return NextResponse.json({ error: 'Compendio no encontrado.' }, { status: 404 })
    }

    const note = await fetchNotebookNote({
      client,
      noteId: noteRow.note_id,
      organizationId: auth.organizationId,
      userId: auth.userId,
    })
    const blocks = htmlBlocks(note.content)
    const document = React.createElement(
      Document,
      null,
      React.createElement(
        Page,
        { size: 'A4', style: styles.body },
        React.createElement(Text, { style: styles.title }, note.title),
        ...blocks.map((block, index) =>
          React.createElement(
            Text,
            {
              key: `${index}:${block.text.slice(0, 20)}`,
              style: block.heading ? styles.heading : styles.paragraph,
            },
            block.text,
          ),
        ),
        React.createElement(
          View,
          { fixed: true, style: styles.footer },
          React.createElement(Text, {
            render: ({ pageNumber, totalPages }) =>
              `SofLIA · ${pageNumber}/${totalPages}`,
          }),
        ),
      ),
    )
    const buffer = await renderToBuffer(document)
    const fileName = `${note.title.replace(/[^a-z0-9-_]+/gi, '-').replace(/^-|-$/g, '') || 'cuaderno'}.pdf`
    return new Response(new Uint8Array(buffer), {
      headers: {
        'Cache-Control': 'private, no-store',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Type': 'application/pdf',
      },
    })
  } catch (error) {
    return notebookErrorResponse(error, 'compendium export GET')
  }
}
