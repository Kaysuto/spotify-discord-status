import { useState, useEffect } from 'react'
import { RiExternalLinkLine, RiSaveLine } from 'react-icons/ri'
import { SiSpotify } from 'react-icons/si'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { recupererParametres, sauvegarderParametres, type ParametresApp } from '@/lib/api'

interface Props {
  onSpotifyConnecte?: () => void
}

export function SpotifyConfig({ onSpotifyConnecte }: Props) {
  const [parametres, setParametres] = useState<Partial<ParametresApp>>({})
  const [secretClient, setSecretClient] = useState('')
  const [enSauvegarde, setEnSauvegarde] = useState(false)
  const [estSauvegarde, setEstSauvegarde] = useState(false)
  const [enChargement, setEnChargement] = useState(true)

  useEffect(() => {
    recupererParametres().then(s => {
      setParametres(s)
      setEnChargement(false)
    })
  }, [])

  const gererSauvegarde = async () => {
    setEnSauvegarde(true)
    const charge: Partial<ParametresApp> = {
      idClient: parametres.idClient,
      uriRedirection: parametres.uriRedirection,
    }
    if (secretClient) charge.secretClient = secretClient
    const ok = await sauvegarderParametres(charge)
    setEnSauvegarde(false)
    if (ok) {
      setEstSauvegarde(true)
      setTimeout(() => setEstSauvegarde(false), 2000)
    }
  }

  const gererConnexion = async () => {
    setEnSauvegarde(true)
    const charge: Partial<ParametresApp> = {
      idClient: parametres.idClient,
      uriRedirection: parametres.uriRedirection,
    }
    if (secretClient) charge.secretClient = secretClient
    await sauvegarderParametres(charge)
    setEnSauvegarde(false)
    window.location.href = '/auth/spotify'
  }

  if (enChargement) return <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">Chargement…</div>

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Crée une app sur le{' '}
          <a
            href="https://developer.spotify.com/dashboard"
            target="_blank"
            rel="noreferrer"
            className="text-spotify underline underline-offset-2 hover:text-spotify/70 inline-flex items-center gap-0.5"
          >
            Spotify Dashboard <RiExternalLinkLine size={12} />
          </a>
        </p>
        {parametres.aTokenSpotify && <Badge variant="spotify">Connecté</Badge>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="idClient">Client ID</Label>
        <Input
          id="idClient"
          placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          value={parametres.idClient ?? ''}
          onChange={e => setParametres(p => ({ ...p, idClient: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="secretClient">Client Secret</Label>
        <Input
          id="secretClient"
          type="password"
          placeholder="Laisse vide pour conserver l'actuel"
          value={secretClient}
          onChange={e => setSecretClient(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="uriRedirection">Redirect URI</Label>
        <Input
          id="uriRedirection"
          placeholder="http://127.0.0.1:3000/callback"
          value={parametres.uriRedirection ?? ''}
          onChange={e => setParametres(p => ({ ...p, uriRedirection: e.target.value }))}
        />
        <p className="text-[11px] text-muted-foreground/60">
          Ajoute exactement cette URI dans le Dashboard Spotify → Redirect URIs
        </p>
      </div>

      <div className="flex gap-3 pt-1">
        <Button variant="outline" size="sm" onClick={gererSauvegarde} disabled={enSauvegarde}>
          <RiSaveLine size={15} />
          {estSauvegarde ? 'Sauvegardé ✓' : enSauvegarde ? 'Sauvegarde…' : 'Sauvegarder'}
        </Button>
        <Button variant="spotify" size="sm" onClick={gererConnexion} disabled={enSauvegarde}>
          <SiSpotify size={13} />
          Connecter Spotify
        </Button>
      </div>
    </div>
  )
}
