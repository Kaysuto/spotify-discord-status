import { useState, useEffect } from 'react'
import { RiEyeLine, RiEyeOffLine, RiSaveLine, RiAlertLine } from 'react-icons/ri'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { recupererParametres, sauvegarderParametres, type ParametresApp } from '@/lib/api'

export function DiscordConfig() {
  const [token, setToken] = useState('')
  const [afficher, setAfficher] = useState(false)
  const [enSauvegarde, setEnSauvegarde] = useState(false)
  const [estSauvegarde, setEstSauvegarde] = useState(false)
  const [aToken, setAToken] = useState(false)

  useEffect(() => {
    recupererParametres().then((s: ParametresApp) => setAToken(s.aTokenDiscord))
  }, [])

  const gererSauvegarde = async () => {
    if (!token) return
    setEnSauvegarde(true)
    const ok = await sauvegarderParametres({ tokenDiscord: token })
    setEnSauvegarde(false)
    if (ok) {
      setAToken(true)
      setToken('')
      setEstSauvegarde(true)
      setTimeout(() => setEstSauvegarde(false), 2000)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Token de ton compte Discord (pas un bot)</p>
        {aToken && <Badge variant="discord">Token enregistré</Badge>}
      </div>

      <div className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-3 flex gap-2.5">
        <RiAlertLine size={15} className="text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-300/80 leading-relaxed">
          L'utilisation du user token est hors des ToS Discord. Usage personnel uniquement.
          Pour obtenir ton token : F12 → Network → cherche "api" → Headers → Authorization.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tokenDiscord">Discord User Token</Label>
        <div className="relative">
          <Input
            id="tokenDiscord"
            type={afficher ? 'text' : 'password'}
            placeholder={aToken ? 'Token déjà enregistré — colle le nouveau pour changer' : 'MTA0NjQ5NjQ...'}
            value={token}
            onChange={e => setToken(e.target.value)}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setAfficher(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {afficher ? <RiEyeOffLine size={15} /> : <RiEyeLine size={15} />}
          </button>
        </div>
      </div>

      <Button variant="discord" size="sm" onClick={gererSauvegarde} disabled={enSauvegarde || !token}>
        <RiSaveLine size={15} />
        {estSauvegarde ? 'Sauvegardé ✓' : enSauvegarde ? 'Sauvegarde…' : 'Sauvegarder'}
      </Button>
    </div>
  )
}
