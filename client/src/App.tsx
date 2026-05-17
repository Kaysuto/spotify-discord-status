import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SiSpotify, SiDiscord } from 'react-icons/si'
import { RiSettings3Line, RiCheckLine, RiCloseLine, RiSunLine, RiMoonLine } from 'react-icons/ri'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { NowPlaying } from '@/components/NowPlaying'
import { SpotifyConfig } from '@/components/SpotifyConfig'
import { DiscordConfig } from '@/components/DiscordConfig'
import { CustomizationConfig } from '@/components/CustomizationConfig'
import { utiliserStatut } from '@/lib/api'

export default function App() {
  const { statut, erreur } = utiliserStatut()
  const [notification, setNotification] = useState<{ msg: string; ok: boolean } | null>(null)
  const [sombre, setSombre] = useState(() => {
    const sauvegarde = localStorage.getItem('theme')
    if (sauvegarde) return sauvegarde === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const [overlayActif, setOverlayActif] = useState(false)
  const [couleurOverlay, setCouleurOverlay] = useState('')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', sombre)
    localStorage.setItem('theme', sombre ? 'dark' : 'light')
  }, [sombre])

  const basculerTheme = () => {
    const cible = sombre ? '#f5f0e6' : '#0f0f0f'
    setCouleurOverlay(cible)
    setOverlayActif(true)
    setTimeout(() => {
      setSombre(v => !v)
      setOverlayActif(false)
    }, 160)
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('connected') === '1') {
      setNotification({ msg: 'Spotify connecté avec succès !', ok: true })
      window.history.replaceState({}, '', '/')
    } else if (params.get('error')) {
      setNotification({ msg: `Erreur Spotify : ${params.get('error')}`, ok: false })
      window.history.replaceState({}, '', '/')
    }
  }, [])

  useEffect(() => {
    if (!notification) return
    const id = setTimeout(() => setNotification(null), 4000)
    return () => clearTimeout(id)
  }, [notification])

  return (
    <div className="min-h-screen flex flex-col">

      {/* Overlay de transition de thème */}
      <AnimatePresence>
        {overlayActif && (
          <motion.div
            key="theme-overlay"
            className="fixed inset-0 z-[100] pointer-events-none"
            style={{ backgroundColor: couleurOverlay }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: 'easeInOut' }}
          />
        )}
      </AnimatePresence>

      {/* En-tête */}
      <header className="navbar sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SiSpotify className="text-[#1DB954]" size={16} />
            <span className="text-sm font-semibold text-foreground/80">Spotify</span>
            <span className="text-foreground/25 text-xs mx-1">→</span>
            <SiDiscord className="text-[#5865F2]" size={16} />
            <span className="text-sm font-semibold text-foreground/80">Discord</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={basculerTheme}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground/50 hover:text-foreground/80 hover:bg-foreground/8 transition-colors"
              title={sombre ? 'Passer en clair' : 'Passer en sombre'}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={sombre ? 'lune' : 'soleil'}
                  initial={{ opacity: 0, rotate: -30, scale: 0.7 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 30, scale: 0.7 }}
                  transition={{ duration: 0.18 }}
                >
                  {sombre ? <RiSunLine size={16} /> : <RiMoonLine size={16} />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>

      {/* Notification */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className={`card-raised rounded-xl px-4 py-2.5 text-sm font-medium shadow-xl flex items-center gap-2
                ${notification.ok ? 'text-[#1DB954]' : 'text-red-500'}`}
            >
              {notification.ok
                ? <RiCheckLine size={15} className="shrink-0" />
                : <RiCloseLine size={15} className="shrink-0" />}
              {notification.msg}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Principal */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">

          {/* Gauche — En cours */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <NowPlaying statut={statut} erreur={erreur} />
          </motion.div>

          {/* Droite — Onglets de configuration */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            <Tabs defaultValue="spotify">
              <TabsList className="w-full bg-foreground/[0.05] border border-foreground/[0.08] p-1 rounded-xl h-auto gap-1">
                <TabsTrigger value="spotify" className="flex-1 gap-1.5 rounded-lg text-xs data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                  <SiSpotify size={12} />
                  Spotify
                </TabsTrigger>
                <TabsTrigger value="discord" className="flex-1 gap-1.5 rounded-lg text-xs data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                  <SiDiscord size={12} />
                  Discord
                </TabsTrigger>
                <TabsTrigger value="customize" className="flex-1 gap-1.5 rounded-lg text-xs data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                  <RiSettings3Line size={13} />
                  Style
                </TabsTrigger>
              </TabsList>

              <TabsContent value="spotify" className="mt-3">
                <div className="card p-5">
                  <SpotifyConfig />
                </div>
              </TabsContent>

              <TabsContent value="discord" className="mt-3">
                <div className="card p-5">
                  <DiscordConfig />
                </div>
              </TabsContent>

              <TabsContent value="customize" className="mt-3">
                <div className="card p-5">
                  <CustomizationConfig />
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>

        </div>
      </main>
    </div>
  )
}
