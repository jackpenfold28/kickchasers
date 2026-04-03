import type { CSSProperties, ReactNode } from 'react'
import clsx from 'clsx'
import AppAssetIcon from '@/components/icons/AppAssetIcon'

export type TeamPageIconName =
  | 'arrow-back'
  | 'chevron-down'
  | 'calendar-outline'
  | 'time-outline'
  | 'add'
  | 'checkmark'
  | 'checkmark-circle'
  | 'settings-outline'
  | 'settings'
  | 'share'
  | 'person-add-outline'
  | 'person-outline'
  | 'people-outline'
  | 'information-circle-outline'
  | 'star-outline'
  | 'star'
  | 'verified'
  | 'lock-closed-outline'
  | 'person-add'
  | 'send'
  | 'palette'
  | 'group'
  | 'emoji-events'
  | 'more-vert'
  | 'tag'
  | 'sports-soccer'
  | 'school'
  | 'admin-panel-settings'
  | 'track-changes'
  | 'sports'
  | 'person-search'
  | 'delete'
  | 'close'
  | 'edit'
  | 'check-circle'
  | 'lock'
  | 'football'
  | 'oval1'

type TeamPageIconProps = {
  name: TeamPageIconName
  className?: string
  style?: CSSProperties
  filled?: boolean
}

function SvgIcon({
  className,
  style,
  children,
  viewBox = '0 0 24 24',
  filled = false,
}: {
  className?: string
  style?: CSSProperties
  children: ReactNode
  viewBox?: string
  filled?: boolean
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox={viewBox}
      className={clsx('shrink-0', className)}
      style={style}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  )
}

export default function TeamPageIcon({ name, className, style, filled = false }: TeamPageIconProps) {
  if (name === 'football') {
    return <AppAssetIcon src="/assets/icons/afl/football.svg" className={clsx('h-4 w-4', className)} style={style} />
  }

  if (name === 'oval1') {
    return <AppAssetIcon src="/assets/icons/afl/oval1.svg" className={clsx('h-4 w-4', className)} style={style} />
  }

  switch (name) {
    case 'arrow-back':
      return (
        <SvgIcon className={className} style={style}>
          <path d="M19 12H5" />
          <path d="m12 19-7-7 7-7" />
        </SvgIcon>
      )
    case 'chevron-down':
      return (
        <SvgIcon className={className} style={style}>
          <path d="m6 9 6 6 6-6" />
        </SvgIcon>
      )
    case 'calendar-outline':
      return (
        <SvgIcon className={className} style={style}>
          <rect x="4.5" y="5.8" width="15" height="13.2" rx="2.4" />
          <path d="M8 4.5v3M16 4.5v3M4.5 10.2h15" />
        </SvgIcon>
      )
    case 'time-outline':
      return (
        <SvgIcon className={className} style={style}>
          <circle cx="12" cy="12" r="8.6" />
          <path d="M12 7.8v4.8l3.3 1.9" />
        </SvgIcon>
      )
    case 'add':
      return (
        <SvgIcon className={className} style={style}>
          <path d="M12 5v14M5 12h14" />
        </SvgIcon>
      )
    case 'checkmark':
      return (
        <SvgIcon className={className} style={style}>
          <path d="m5.5 12.4 4.1 4.1L18.5 7.6" />
        </SvgIcon>
      )
    case 'checkmark-circle':
      return (
        <SvgIcon className={className} style={style}>
          <circle cx="12" cy="12" r="8.8" />
          <path d="m8.2 12.1 2.4 2.4 5.2-5.2" />
        </SvgIcon>
      )
    case 'settings-outline':
      return (
        <SvgIcon className={className} style={style}>
          <circle cx="12" cy="12" r="3.2" />
          <path d="M12 2.8v2.1m0 14.2v2.1M4.9 4.9l1.5 1.5m11.2 11.2 1.5 1.5M2.8 12h2.1m14.2 0h2.1M4.9 19.1l1.5-1.5m11.2-11.2 1.5-1.5" />
          <circle cx="12" cy="12" r="8.2" />
        </SvgIcon>
      )
    case 'settings':
      return (
        <SvgIcon className={className} style={style} filled>
          <path d="m13.4 2.5 1 1.8 2-.3 1.3 1.3-.3 2 1.8 1v1.4l-1.8 1 .3 2-1.3 1.3-2-.3-1 1.8h-1.4l-1-1.8-2 .3-1.3-1.3.3-2-1.8-1V8.3l1.8-1-.3-2 1.3-1.3 2 .3 1-1.8Zm-1.4 5.1A4.4 4.4 0 1 0 12 16.4 4.4 4.4 0 0 0 12 7.6Z" />
        </SvgIcon>
      )
    case 'share':
      return (
        <SvgIcon className={className} style={style}>
          <circle cx="18" cy="5" r="2.25" />
          <circle cx="6" cy="12" r="2.25" />
          <circle cx="18" cy="19" r="2.25" />
          <path d="m8 12 7.5-5" />
          <path d="m8 12 7.5 5" />
        </SvgIcon>
      )
    case 'person-add-outline':
      return (
        <SvgIcon className={className} style={style}>
          <circle cx="10" cy="8.2" r="3.3" />
          <path d="M4.5 19.2c.8-3.4 3.2-5.2 5.5-5.2s4.7 1.8 5.5 5.2" />
          <path d="M18 7v6M15 10h6" />
        </SvgIcon>
      )
    case 'person-outline':
      return (
        <SvgIcon className={className} style={style}>
          <circle cx="12" cy="7.9" r="3.4" />
          <path d="M5 19.3c1-3.8 3.7-5.7 7-5.7s6 1.9 7 5.7" />
        </SvgIcon>
      )
    case 'people-outline':
      return (
        <SvgIcon className={className} style={style}>
          <circle cx="9" cy="8.1" r="2.9" />
          <circle cx="16.9" cy="8.9" r="2.3" />
          <path d="M3.9 18.8c.9-3.2 3.2-4.8 5.1-4.8 2 0 4.3 1.6 5.2 4.8" />
          <path d="M14.8 18.2c.5-2.2 2.1-3.7 4.4-4.2" />
        </SvgIcon>
      )
    case 'information-circle-outline':
      return (
        <SvgIcon className={className} style={style}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 10.2v6.1" />
          <circle cx="12" cy="7.3" r="1" fill="currentColor" stroke="none" />
        </SvgIcon>
      )
    case 'star-outline':
      return (
        <SvgIcon className={className} style={style}>
          <path d="m12 3.6 2.5 5.1 5.7.8-4.1 4 1 5.6-5.1-2.7-5.1 2.7 1-5.6-4.1-4 5.7-.8Z" />
        </SvgIcon>
      )
    case 'star':
      return (
        <SvgIcon className={className} style={style} filled>
          <path d="m12 3.6 2.5 5.1 5.7.8-4.1 4 1 5.6-5.1-2.7-5.1 2.7 1-5.6-4.1-4 5.7-.8Z" />
        </SvgIcon>
      )
    case 'verified':
      return (
        <SvgIcon className={className} style={style} filled>
          <path d="m12 2.8 2.2 1.5 2.7-.2 1.3 2.3 2.3 1.3-.2 2.7 1.5 2.2-1.5 2.2.2 2.7-2.3 1.3-1.3 2.3-2.7-.2-2.2 1.5-2.2-1.5-2.7.2-1.3-2.3-2.3-1.3.2-2.7-1.5-2.2 1.5-2.2-.2-2.7 2.3-1.3 1.3-2.3 2.7.2Z" />
          <path d="m8 12.2 2.5 2.5 5.6-5.6" fill="none" stroke="#09111C" strokeWidth="2.2" />
        </SvgIcon>
      )
    case 'lock-closed-outline':
      return (
        <SvgIcon className={className} style={style}>
          <rect x="5.5" y="11" width="13" height="9" rx="2.5" />
          <path d="M8.3 11V8.7A3.7 3.7 0 0 1 12 5a3.7 3.7 0 0 1 3.7 3.7V11" />
        </SvgIcon>
      )
    case 'person-add':
      return (
        <SvgIcon className={className} style={style} filled>
          <circle cx="10" cy="8" r="3.1" />
          <path d="M4.6 19.1c.9-3.1 3.1-4.8 5.4-4.8s4.5 1.7 5.4 4.8Z" />
          <path d="M18 6.2v6.2M14.9 9.3h6.2" fill="none" stroke="currentColor" strokeWidth="1.9" />
        </SvgIcon>
      )
    case 'send':
      return (
        <SvgIcon className={className} style={style} filled>
          <path d="M3.6 11.2 19.8 4.4c.8-.3 1.5.5 1.2 1.2l-6.8 16.2c-.3.8-1.4.8-1.7 0l-1.9-5.5-5.5-1.9c-.8-.3-.8-1.4 0-1.7Z" />
        </SvgIcon>
      )
    case 'palette':
      return (
        <SvgIcon className={className} style={style} filled>
          <path d="M12 4a8 8 0 1 0 0 16h1.1a2.4 2.4 0 0 0 0-4.8H12A2.2 2.2 0 0 1 12 11a7 7 0 0 0 0-7Z" />
          <circle cx="7.5" cy="10" r="1.1" fill="#09111C" stroke="none" />
          <circle cx="9.2" cy="7.2" r="1.1" fill="#09111C" stroke="none" />
          <circle cx="13.1" cy="6.7" r="1.1" fill="#09111C" stroke="none" />
          <circle cx="16.1" cy="8.9" r="1.1" fill="#09111C" stroke="none" />
        </SvgIcon>
      )
    case 'group':
      return (
        <SvgIcon className={className} style={style} filled>
          <circle cx="8.4" cy="8.3" r="2.5" />
          <circle cx="15.7" cy="8.3" r="2.5" />
          <path d="M3.9 18.8c.7-2.5 2.6-4 4.5-4s3.8 1.5 4.5 4Z" />
          <path d="M11.1 18.8c.7-2.5 2.6-4 4.6-4 1.9 0 3.8 1.5 4.4 4Z" />
        </SvgIcon>
      )
    case 'emoji-events':
      return (
        <SvgIcon className={className} style={style} filled>
          <path d="M8 4.5h8v2.1a4 4 0 0 1-2.8 3.8v1.5a3.8 3.8 0 0 0 2.7 3.6l.9.3V18H7.2v-2.2l.9-.3a3.8 3.8 0 0 0 2.7-3.6v-1.5A4 4 0 0 1 8 6.6Zm-2.5.7H8v2.1a3.8 3.8 0 0 1-2.5-2.1Zm13 0h-2.5v2.1a3.8 3.8 0 0 0 2.5-2.1ZM9 20h6v1.5H9Z" />
        </SvgIcon>
      )
    case 'more-vert':
      return (
        <SvgIcon className={className} style={style} filled>
          <circle cx="12" cy="5" r="1.7" />
          <circle cx="12" cy="12" r="1.7" />
          <circle cx="12" cy="19" r="1.7" />
        </SvgIcon>
      )
    case 'tag':
      return (
        <SvgIcon className={className} style={style}>
          <path d="M4.5 12.4V5.8h6.6l7.8 7.7-5.2 5.2Z" />
          <circle cx="8.6" cy="8.8" r="1.1" />
        </SvgIcon>
      )
    case 'sports-soccer':
      return (
        <SvgIcon className={className} style={style}>
          <circle cx="12" cy="12" r="8.3" />
          <path d="m12 7.7 2.4 1.7-.9 2.9h-3l-.9-2.9Z" />
          <path d="m7.4 10.6 2.2 1.6-.8 2.8-2.7.8-1.5-2.3Z" />
          <path d="m16.6 10.6 2.8 2.9-1.5 2.3-2.7-.8-.8-2.8Z" />
        </SvgIcon>
      )
    case 'school':
      return (
        <SvgIcon className={className} style={style} filled>
          <path d="m12 5 9 4.4-9 4.4L3 9.4Zm-5 6.4V15c0 1.7 2.2 3 5 3s5-1.3 5-3v-3.6l-5 2.4Z" />
        </SvgIcon>
      )
    case 'admin-panel-settings':
      return (
        <SvgIcon className={className} style={style}>
          <path d="M12 3.8 6 6.2v4.5c0 4 2.6 7.2 6 8.6 3.4-1.4 6-4.6 6-8.6V6.2Z" />
          <circle cx="12" cy="11.2" r="2.1" />
          <path d="M12 7.8v1m0 4.8v1m-3.4-3.4h1m4.8 0h1" />
        </SvgIcon>
      )
    case 'track-changes':
      return (
        <SvgIcon className={className} style={style}>
          <circle cx="12" cy="12" r="7.8" />
          <circle cx="12" cy="12" r="3.6" />
          <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
        </SvgIcon>
      )
    case 'sports':
      return (
        <SvgIcon className={className} style={style} filled>
          <path d="M12 4.6 7.5 7.1v4.7c0 3.4 2 6.1 4.5 7.3 2.5-1.2 4.5-3.9 4.5-7.3V7.1Z" />
        </SvgIcon>
      )
    case 'person-search':
      return (
        <SvgIcon className={className} style={style}>
          <circle cx="10" cy="8.2" r="3.2" />
          <path d="M4.8 18.9c.8-3.2 3.1-4.9 5.2-4.9" />
          <circle cx="17.2" cy="15.6" r="2.8" />
          <path d="m19.2 17.6 2.2 2.2" />
        </SvgIcon>
      )
    case 'delete':
      return (
        <SvgIcon className={className} style={style}>
          <path d="M5 7.2h14" />
          <path d="M9 7.2V5.5h6v1.7" />
          <path d="M7.4 7.2 8.1 19h7.8l.7-11.8" />
          <path d="M10 10.2v5.6M14 10.2v5.6" />
        </SvgIcon>
      )
    case 'close':
      return (
        <SvgIcon className={className} style={style}>
          <path d="M6 6 18 18M18 6 6 18" />
        </SvgIcon>
      )
    case 'edit':
      return (
        <SvgIcon className={className} style={style}>
          <path d="m5 19 3.6-.7L18.8 8a1.6 1.6 0 0 0 0-2.3l-.5-.5A1.6 1.6 0 0 0 16 5.2L5.7 15.5Z" />
          <path d="m13.9 6.3 3.8 3.8" />
        </SvgIcon>
      )
    case 'check-circle':
      return (
        <SvgIcon className={className} style={style} filled>
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12.3 2.4 2.4 5.6-5.6" fill="none" stroke="#09111C" strokeWidth="2.2" />
        </SvgIcon>
      )
    case 'lock':
      return (
        <SvgIcon className={className} style={style} filled>
          <path d="M7 10.8V8.7A5 5 0 0 1 12 3.8a5 5 0 0 1 5 4.9v2.1h.6A2.4 2.4 0 0 1 20 13.2v5.4a2.4 2.4 0 0 1-2.4 2.4H6.4A2.4 2.4 0 0 1 4 18.6v-5.4a2.4 2.4 0 0 1 2.4-2.4Zm2 0h6V8.7A3 3 0 0 0 12 5.8a3 3 0 0 0-3 2.9Z" />
        </SvgIcon>
      )
    default:
      return null
  }
}
