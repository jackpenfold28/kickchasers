import { ChangeEvent, useState } from 'react'
import PortalCard from '@/components/cards/PortalCard'
import { uploadSquadLogo } from '@/lib/squads'

type SquadBrandingPanelProps = {
  ownerId: string
  squadId: string
  canManage: boolean
  logoUrl: string | null
  primaryColorHex: string | null
  secondaryColorHex: string | null
  tertiaryColorHex: string | null
  saving: boolean
  onSave: (payload: {
    logoUrl?: string | null
    primaryColorHex?: string | null
    secondaryColorHex?: string | null
    tertiaryColorHex?: string | null
  }) => Promise<void>
}

const normalizeHex = (value: string) => {
  const input = value.trim()
  if (!input) return null
  const normalized = input.startsWith('#') ? input : `#${input}`
  if (!/^#[0-9a-fA-F]{6}$/.test(normalized)) return null
  return normalized.toUpperCase()
}

export default function SquadBrandingPanel({
  ownerId,
  squadId,
  canManage,
  logoUrl,
  primaryColorHex,
  secondaryColorHex,
  tertiaryColorHex,
  saving,
  onSave,
}: SquadBrandingPanelProps) {
  const [logo, setLogo] = useState<string | null>(logoUrl)
  const [primary, setPrimary] = useState(primaryColorHex || '')
  const [secondary, setSecondary] = useState(secondaryColorHex || '')
  const [tertiary, setTertiary] = useState(tertiaryColorHex || '')
  const [error, setError] = useState<string | null>(null)

  async function onLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setError(null)
      const path = await uploadSquadLogo(ownerId, file)
      setLogo(path)
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload logo.')
    }
  }

  async function submit() {
    setError(null)

    const normalizedPrimary = normalizeHex(primary)
    const normalizedSecondary = normalizeHex(secondary)
    const normalizedTertiary = tertiary.trim() ? normalizeHex(tertiary) : null

    if (!normalizedPrimary || !normalizedSecondary) {
      setError('Primary and secondary colours must be valid 6-digit hex values.')
      return
    }

    if (tertiary.trim() && !normalizedTertiary) {
      setError('Tertiary colour must be blank or a valid 6-digit hex value.')
      return
    }

    await onSave({
      logoUrl: logo,
      primaryColorHex: normalizedPrimary,
      secondaryColorHex: normalizedSecondary,
      tertiaryColorHex: normalizedTertiary,
    })
  }

  return (
    <PortalCard title="Branding" subtitle="Update squad logo and team colours">
      {!canManage ? (
        <p className="text-sm text-slate-400">Only owners/admins can update squad branding.</p>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm text-slate-300">Logo</p>
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-[#0D1525]">
                {logo ? (
                  <img src={logoUrl && logo === logoUrl ? logoUrl : logo} alt="Squad logo" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-slate-500">No logo</span>
                )}
              </div>
              <label className="btn btn-secondary inline-flex cursor-pointer">
                Upload Logo
                <input type="file" accept="image/*" className="hidden" onChange={onLogoChange} />
              </label>
              <p className="text-xs text-slate-500">Stored in <code>team-logos/squads/{"{owner}"}/{"{timestamp}"}</code>.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-xs text-slate-300">
                <span>Primary</span>
                <input className="input" value={primary} onChange={(event) => setPrimary(event.target.value)} placeholder="#123456" />
              </label>
              <label className="space-y-1 text-xs text-slate-300">
                <span>Secondary</span>
                <input
                  className="input"
                  value={secondary}
                  onChange={(event) => setSecondary(event.target.value)}
                  placeholder="#654321"
                />
              </label>
              <label className="space-y-1 text-xs text-slate-300 sm:col-span-2">
                <span>Tertiary (optional)</span>
                <input className="input" value={tertiary} onChange={(event) => setTertiary(event.target.value)} placeholder="#AABBCC" />
              </label>
            </div>
          </div>

          {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

          <button className="btn btn-primary mt-4" disabled={saving} onClick={submit}>
            {saving ? 'Saving…' : 'Save Branding'}
          </button>
        </>
      )}

      <p className="mt-3 text-xs text-slate-500">Squad ID: {squadId}</p>
    </PortalCard>
  )
}
