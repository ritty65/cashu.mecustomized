export interface MintInfo {
  name: string
  url: string
  unit?: 'sat' | 'msat'
  region?: string
  feeNote?: string
  notes?: string[]
}
export async function loadMintCatalog(): Promise<MintInfo[]> {
  try {
    const base = new URL(import.meta.env.BASE_URL, window.location.origin)
    const resp = await fetch(new URL('mints.json', base).toString())
    if (!resp.ok) throw new Error('network')
    const data = await resp.json()
    return (Array.isArray(data) ? data : []).map((m: any) => ({
      name: m.label || m.name || m.url,
      url: m.url,
      unit: m.unit,
      region: m.region,
      feeNote: m.feeNote,
      notes: m.notes,
    }))
  } catch (e) {
    console.error('Failed to load mint catalog', e)
    return []
  }
}
