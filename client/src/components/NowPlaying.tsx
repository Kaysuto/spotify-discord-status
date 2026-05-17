import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RiMusicLine, RiPlayFill, RiStopFill, RiMicLine } from 'react-icons/ri'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formaterDuree } from '@/lib/utils'
import { demarrerBot, arreterBot, type StatutLecture } from '@/lib/api'

interface Props {
  statut: StatutLecture | null
  erreur: boolean
}

export function NowPlaying({ statut, erreur }: Props) {
  const [chargement, setChargement] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [couleurAccent, setCouleurAccent] = useState('#1DB954')

  const gererDemarrer = async () => { setChargement(true); await demarrerBot(); setChargement(false) }
  const gererArreter = async () => { setChargement(true); await arreterBot(); setChargement(false) }

  const progression = statut
    ? Math.min(100, (statut.progressionMs / (statut.dureeMs || 1)) * 100)
    : 0

  // Extrait la couleur dominante de la pochette pour personnaliser l'accentuation
  useEffect(() => {
    if (!statut?.imageUrl) { setCouleurAccent('#1DB954'); return }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = statut.imageUrl
    img.onload = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      canvas.width = 1; canvas.height = 1
      ctx.drawImage(img, 0, 0, 1, 1)
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
      const max = Math.max(r, g, b)
      const factor = max > 60 ? 230 / max : 1
      setCouleurAccent(`rgb(${Math.min(255, Math.round(r * factor))},${Math.min(255, Math.round(g * factor))},${Math.min(255, Math.round(b * factor))})`)
    }
    img.onerror = () => setCouleurAccent('#1DB954')
  }, [statut?.imageUrl])

  return (
    <div className="flex flex-col gap-3">
      <canvas ref={canvasRef} className="hidden" aria-hidden />

      {/* Carte lecteur principale */}
      <div className="card overflow-hidden">

        {/* Barre d'accent dynamique */}
        <div
          className="h-0.5 transition-all duration-700"
          style={{ background: statut?.estEnLecture ? couleurAccent : 'var(--border)' }}
        />

        <div className="p-5">
          <div className="flex gap-5 items-start">

            {/* Pochette album */}
            <div className="relative shrink-0">
              <div
                className="w-40 h-40 rounded-2xl overflow-hidden transition-all duration-700"
                style={statut?.estEnLecture ? {
                  boxShadow: `0 0 0 2px ${couleurAccent}50, 0 6px 28px ${couleurAccent}35`
                } : { boxShadow: '0 2px 12px rgba(0,0,0,0.12)' }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={statut?.imageUrl ?? 'vide'}
                    initial={{ opacity: 0, scale: 1.06 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.38, ease: 'easeOut' }}
                    className="w-full h-full"
                  >
                    {statut?.imageUrl ? (
                      <img
                        src={statut.imageUrl}
                        alt={statut.nomPiste}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <RiMusicLine size={40} className="text-muted-foreground/20" />
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Waveform sur la pochette */}
              {statut?.estEnLecture && (
                <div className="absolute bottom-2.5 right-2.5 bg-black/55 backdrop-blur-sm rounded-md px-1.5 py-1 flex items-end gap-0.5 h-6">
                  <span className="barre-musicale" />
                  <span className="barre-musicale" />
                  <span className="barre-musicale" />
                </div>
              )}
            </div>

            {/* Côté droit : infos + progression + contrôles */}
            <div className="flex-1 min-w-0 flex flex-col gap-0 self-stretch py-0.5">

              {/* Label + badge */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest">
                  {statut?.estEnLecture ? 'En cours' : 'En attente'}
                </span>
                {erreur ? (
                  <Badge variant="destructive">Hors ligne</Badge>
                ) : statut?.actif ? (
                  <Badge variant="spotify" className="gap-1.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1DB954] opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#1DB954]" />
                    </span>
                    Actif
                  </Badge>
                ) : (
                  <Badge variant="secondary">Inactif</Badge>
                )}
              </div>

              {/* Titre + artiste */}
              <div className="flex-1">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={statut?.nomPiste ?? 'inactif'}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                  >
                    {statut?.estEnLecture ? (
                      <>
                        <p className="font-bold text-xl leading-tight truncate text-foreground">{statut.nomPiste}</p>
                        <p className="text-muted-foreground text-sm mt-1 truncate">{statut.artiste}</p>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-base text-muted-foreground">Rien en cours</p>
                        <p className="text-muted-foreground/50 text-sm mt-1">Lance une chanson sur Spotify</p>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Progression */}
              <div className="mt-4">
                <div className="h-1 w-full rounded-full bg-border overflow-hidden">
                  <motion.div
                    className="h-full rounded-full transition-colors duration-700"
                    style={{ backgroundColor: couleurAccent }}
                    animate={{ width: `${progression}%` }}
                    transition={{ ease: 'linear', duration: 1.5 }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground/50 font-mono tabular-nums mt-1.5">
                  <span>{formaterDuree(statut?.progressionMs ?? 0)}</span>
                  <span>{formaterDuree(statut?.dureeMs ?? 0)}</span>
                </div>
              </div>

              {/* Contrôles */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                <Button
                  variant="spotify" size="sm" className="gap-1.5"
                  onClick={gererDemarrer} disabled={chargement || !!statut?.actif}
                >
                  <RiPlayFill size={14} />
                  Démarrer
                </Button>
                <Button
                  variant="destructive" size="sm" className="gap-1.5"
                  onClick={gererArreter} disabled={chargement || !statut?.actif}
                >
                  <RiStopFill size={14} />
                  Arrêter
                </Button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Panneau de paroles */}
      <div className="card min-h-[100px]">
        <div className="p-5 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-3">
            <RiMicLine size={13} className="text-muted-foreground/60" />
            <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">Paroles</span>
            {statut?.aDesParoles === false && statut?.estEnLecture && (
              <span className="ml-auto text-[10px] text-muted-foreground/50 border border-border rounded px-1.5 py-0.5">
                Aucune parole
              </span>
            )}
          </div>
          <div className="flex-1 flex items-center justify-center min-h-[44px]">
            <AnimatePresence mode="wait">
              <motion.p
                key={statut?.ligneCourante ?? 'vide'}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="text-center text-sm font-medium leading-relaxed px-2"
              >
                {statut?.ligneCourante
                  ? statut.ligneCourante
                  : statut?.estEnLecture
                  ? <span className="text-muted-foreground/50 text-xs">♪ Instrumental ♪</span>
                  : <span className="text-muted-foreground/40 text-xs flex items-center gap-2">
                      <RiMusicLine size={13} /> En attente…
                    </span>
                }
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>

    </div>
  )
}
