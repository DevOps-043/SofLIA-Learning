import Image from 'next/image'

export function CertificateBrand({ primaryColor }: { primaryColor: string }) {
  return (
    <>
      <div className="flex justify-center mb-6">
        <div className="relative">
          <div className="absolute inset-0 blur-md opacity-30" style={{ backgroundColor: primaryColor }} />
          <Image src="/icono.png" alt="Aprende y Aplica" width={100} height={100} className="w-20 h-20 object-contain relative z-10" />
        </div>
      </div>
      <div className="text-3xl font-bold mb-8 tracking-wide" style={{ color: primaryColor, textShadow: '2px 2px 4px rgba(0,0,0,0.1)' }}>
        Aprende y Aplica
      </div>
    </>
  )
}
