import { useState } from 'react'

type PhoneScreenshotProps = {
  src: string
  fallback: string
  alt: string
  className?: string
}

type ProductShotProps = {
  src: string
  fallback: string
  alt: string
  wrapperClassName?: string
  imageClassName?: string
  glowClassName?: string
}

function PhoneScreenshot({ src, fallback, alt, className }: PhoneScreenshotProps) {
  const [imageSrc, setImageSrc] = useState(src)

  return (
    <img
      src={imageSrc}
      alt={alt}
      loading="lazy"
      onError={() => setImageSrc(fallback)}
      className={className ?? 'h-full w-full object-cover'}
    />
  )
}

export function ProductShot({
  src,
  fallback,
  alt,
  wrapperClassName,
  imageClassName,
  glowClassName,
}: ProductShotProps) {
  const resolvedGlowClass = `${
    glowClassName ??
    'pointer-events-none absolute left-1/2 top-1/2 h-[460px] w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(57,255,20,0.18)_0%,rgba(57,255,20,0.06)_42%,transparent_72%)] blur-3xl'
  } z-0`

  return (
    <div className={wrapperClassName ?? 'relative isolate mx-auto w-full max-w-[390px]'}>
      <div className={resolvedGlowClass} />
      <div className="relative z-10">
        <PhoneScreenshot
          src={src}
          fallback={fallback}
          alt={alt}
          className={
            imageClassName ??
            'block h-auto w-full object-contain drop-shadow-[0_30px_70px_rgba(0,0,0,0.5)]'
          }
        />
      </div>
    </div>
  )
}
