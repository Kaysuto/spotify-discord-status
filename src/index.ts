import { Parametres } from "./Settings"
import { ServiceSpotify } from "./SpotifyService"
import { RecuperateurParoles } from "./LyricsFetcher"
import { EtatLecture } from "./PlaybackState"
import { MetteurAJourLecture } from "./PlaybackStateUpdater"
import { ChangeurStatut } from "./StatusChanger"
import { demarrerServeur } from "./Panel/Server"

Parametres.charger()

const recuperateurParoles = new RecuperateurParoles()
const etatLecture = new EtatLecture()
const metteurAJour = new MetteurAJourLecture(etatLecture, recuperateurParoles)
const changeurStatut = new ChangeurStatut(etatLecture)

// Essayer de restaurer le token Spotify depuis le refresh token sauvegardé
ServiceSpotify.rafraichir().then(ok => {
  if (ok) console.log("✅  Token Spotify restauré depuis le refresh token")
  else     console.log("⚠️   Aucun token Spotify valide — connectez-vous via le panneau")
})

demarrerServeur(etatLecture, changeurStatut)

// Interroger Spotify toutes les 5 secondes
setInterval(async () => {
  const idPistePrecedente = etatLecture.idPiste
  await metteurAJour.mettreAJour()

  if (etatLecture.idPiste && etatLecture.idPiste !== idPistePrecedente) {
    changeurStatut.chansonChangee()
    console.log(`🎵  En cours : ${etatLecture.nomPiste} — ${etatLecture.artiste}`)
    console.log(`🎤  Paroles : ${etatLecture.aDesParoles ? recuperateurParoles.derniereSource : "non disponibles"}`)
  }
}, 5000)

// Mettre à jour le statut Discord à ~60fps, interpoler la progression localement
let dernierTic = Date.now()
setInterval(() => {
  const maintenant = Date.now()
  const delta = maintenant - dernierTic
  dernierTic = maintenant

  if (etatLecture.estEnLecture) {
    etatLecture.progressionMs += delta
  }

  changeurStatut.changerStatut()
}, Math.round(1000 / 60))

// Arrêt propre : effacer le statut Discord à la fermeture
process.on("SIGINT", async () => {
  console.log("\n🛑  Arrêt — effacement du statut Discord...")
  await changeurStatut.effacerStatut()
  process.exit(0)
})

process.on("uncaughtException", (e) => {
  console.error("Exception non interceptée :", e.message)
})
