import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    {
      error:
        'La carga de curriculum no esta disponible en el esquema actual de perfil.',
    },
    { status: 410 },
  )
}
