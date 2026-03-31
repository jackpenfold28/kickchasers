import type { CSSProperties } from 'react'
import clsx from 'clsx'

type AppAssetIconProps = {
  src: string
  className?: string
  style?: CSSProperties
}

export default function AppAssetIcon({ src, className, style }: AppAssetIconProps) {
  const maskStyles = {
    WebkitMaskImage: `url(${src})`,
    maskImage: `url(${src})`,
  } as CSSProperties

  return (
    <span
      aria-hidden="true"
      className={clsx('inline-block h-4 w-4 shrink-0 bg-current', className)}
      style={{
        ...maskStyles,
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        ...style,
      }}
    />
  )
}
