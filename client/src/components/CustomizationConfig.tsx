import { useState, useEffect } from 'react'
import { RiSaveLine } from 'react-icons/ri'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { recupererParametres, sauvegarderParametres, type ParametresApp } from '@/lib/api'
import { cn } from '@/lib/utils'

const PRESETS = [
  { label: '🎵 Paroles', value: '{lyrics}' },
  { label: '🎶 Titre', value: '🎶 {track}' },
  { label: '🎤 Artiste', value: '🎤 {artist}' },
  { label: '♫ Titre – Artiste', value: '♫ {track} — {artist}' },
]

export function CustomizationConfig() {
  const [parametres, setParametres] = useState<Partial<ParametresApp>>({})
  const [enSauvegarde, setEnSauvegarde] = useState(false)
  const [estSauvegarde, setEstSauvegarde] = useState(false)

  useEffect(() => {
    recupererParametres().then(s => setParametres(s))
  }, [])

  const gererSauvegarde = async () => {
    setEnSauvegarde(true)
    await sauvegarderParametres({
      format: parametres.format,
      emoji: parametres.emoji,
      repliSurPiste: parametres.repliSurPiste,
      decalageEnvoiMs: parametres.decalageEnvoiMs,
    })
    setEnSauvegarde(false)
    setEstSauvegarde(true)
    setTimeout(() => setEstSauvegarde(false), 2000)
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Format du statut</Label>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map(p => (
            <button
              key={p.value}
              onClick={() => setParametres(s => ({ ...s, format: p.value }))}
              className={cn(
                'rounded-lg border px-3 py-2.5 text-sm text-left transition-all duration-150',
                parametres.format === p.value
                  ? 'border-spotify/50 bg-spotify/10 text-foreground'
                  : 'border-border bg-input/60 text-muted-foreground hover:border-border/80 hover:text-foreground'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <Input
          placeholder="Format personnalisé : {lyrics}, {track}, {artist}"
          value={parametres.format ?? ''}
          onChange={e => setParametres(s => ({ ...s, format: e.target.value }))}
          className="mt-1"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 items-end">
        <div className="space-y-1.5">
          <Label htmlFor="emoji">Emoji Discord</Label>
          <Input
            id="emoji"
            placeholder="🎵"
            value={parametres.emoji ?? ''}
            onChange={e => setParametres(s => ({ ...s, emoji: e.target.value }))}
            maxLength={10}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="decalageEnvoiMs">Décalage (ms)</Label>
          <Input
            id="decalageEnvoiMs"
            type="number"
            step={100}
            placeholder="0"
            value={parametres.decalageEnvoiMs ?? 0}
            onChange={e => setParametres(s => ({ ...s, decalageEnvoiMs: Number(e.target.value) }))}
          />
        </div>
      </div>

      <label className="flex items-center gap-3 cursor-pointer group">
        <div
          onClick={() => setParametres(s => ({ ...s, repliSurPiste: !s.repliSurPiste }))}
          className={cn(
            'relative inline-flex h-5 w-9 items-center rounded-full border transition-colors',
            parametres.repliSurPiste ? 'bg-spotify border-spotify/50' : 'bg-muted border-border'
          )}
        >
          <span className={cn(
            'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
            parametres.repliSurPiste ? 'translate-x-4' : 'translate-x-1'
          )} />
        </div>
        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
          Fallback sur titre si pas de paroles
        </span>
      </label>

      <Button variant="default" size="sm" onClick={gererSauvegarde} disabled={enSauvegarde}>
        <RiSaveLine size={15} />
        {estSauvegarde ? 'Sauvegardé ✓' : enSauvegarde ? 'Sauvegarde…' : 'Sauvegarder'}
      </Button>
    </div>
  )
}
