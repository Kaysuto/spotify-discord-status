import { EtatLecture } from "./PlaybackState"
import { Parametres } from "./Settings"

// Délai minimum entre les appels PATCH Discord (ms) — conservateur pour éviter les rate limits
const DISCORD_INTERVALLE_MIN_MS = 5000

export class ChangeurStatut {
  private etat: EtatLecture
  private dernierTempsEnvoiMs: number = -1
  private dernierTexteEnvoye: string = ""
  private actif: boolean = false

  // État du rate limit
  private dernierEnvoiA: number = 0          // horodatage du dernier envoi réussi
  private limiteTauxJusqua: number = 0       // horodatage jusqu'auquel on ne doit PAS envoyer
  private estEnvoiEnCours: boolean = false   // empêcher les requêtes concurrentes

  constructor(etat: EtatLecture) {
    this.etat = etat
  }

  public definirActif(v: boolean) { this.actif = v }

  /** Appelée à ~60fps — trouve la ligne de paroles courante et l'envoie à Discord */
  public changerStatut(): void {
    if (!this.actif) return
    if (!this.etat.estEnLecture) return
    if (!this.etat.aDesParoles || !this.etat.paroles) {
      if (Parametres.affichage.repliSurPiste && this.etat.nomPiste) {
        const texte = `${this.etat.artiste} — ${this.etat.nomPiste}`.slice(0, 128)
        if (this.dernierTempsEnvoiMs !== -2) {
          this.dernierTempsEnvoiMs = -2
          this.fileEnvoi(texte)
        }
      }
      return
    }

    const decalage = Parametres.minutages.decalageEnvoiMs
    const progression = this.etat.progressionMs + decalage
    const lignes = this.etat.paroles

    let ligneCourante = lignes[0]
    for (let i = 0; i < lignes.length; i++) {
      if (lignes[i].tempsMs <= progression) {
        ligneCourante = lignes[i]
      } else {
        break
      }
    }

    if (!ligneCourante || ligneCourante.tempsMs === this.dernierTempsEnvoiMs) return

    this.dernierTempsEnvoiMs = ligneCourante.tempsMs
    this.etat.ligneCourante = ligneCourante

    const texte = this.formaterStatut(ligneCourante.texte)
    this.fileEnvoi(texte)
  }

  public chansonChangee(): void {
    this.dernierTempsEnvoiMs = -1
    this.etat.ligneCourante = null
  }

  /** Efface le statut personnalisé Discord */
  public async effacerStatut(): Promise<void> {
    await this.envoyerADiscordBrut(null)
    this.dernierTempsEnvoiMs = -1
    this.dernierTexteEnvoye = ""
  }

  /** Met en file d'attente une mise à jour du statut — respecte les rate limits et déduplique */
  private fileEnvoi(texte: string): void {
    // Ne pas envoyer si le texte n'a pas changé
    if (texte === this.dernierTexteEnvoye) return

    // Ne pas envoyer si une requête est déjà en cours
    if (this.estEnvoiEnCours) return

    const maintenant = Date.now()

    // Respecter le retry-after 429 côté Discord
    if (maintenant < this.limiteTauxJusqua) {
      const attente = Math.ceil((this.limiteTauxJusqua - maintenant) / 1000)
      console.log(`⏳ Discord rate limité — attente de ${attente}s`)
      return
    }

    // Imposer l'intervalle minimum entre les envois
    const ecoule = maintenant - this.dernierEnvoiA
    if (ecoule < DISCORD_INTERVALLE_MIN_MS) return

    this.dernierTexteEnvoye = texte
    this.envoyerADiscord(texte)
  }

  private formaterStatut(parole: string): string {
    const format = Parametres.affichage.format
    const resultat = format
      .replace("{lyrics}", parole)
      .replace("{lyrics_upper}", parole.toUpperCase())
      .replace("{song_name}", this.etat.nomPiste)
      .replace("{song_author}", this.etat.artiste)
    return resultat.slice(0, 128)
  }

  private envoyerADiscord(texte: string): void {
    const token = Parametres.discord.token
    if (!token) return

    this.estEnvoiEnCours = true
    this.dernierEnvoiA = Date.now()

    fetch("https://discord.com/api/v9/users/@me/settings", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token
      },
      body: JSON.stringify({
        custom_status: {
          text: texte,
          emoji_id: null,
          emoji_name: Parametres.affichage.emoji || null,
          expires_at: null
        }
      })
    }).then(async (reponse) => {
      if (reponse.status === 429) {
        // Lire retry_after depuis les headers ou le body
        let retryAfterMs = 30000 // défaut : attendre 30s si inconnu
        const enteteRetry = reponse.headers.get("retry-after") || reponse.headers.get("Retry-After")
        if (enteteRetry) {
          retryAfterMs = parseFloat(enteteRetry) * 1000
        } else {
          try {
            const corps = await reponse.json() as { retry_after?: number }
            if (corps.retry_after) retryAfterMs = corps.retry_after * 1000
          } catch {}
        }
        this.limiteTauxJusqua = Date.now() + retryAfterMs
        console.warn(`⚠️  Discord 429 — rate limité pour ${Math.ceil(retryAfterMs / 1000)}s`)
      } else if (!reponse.ok) {
        console.error(`❌ Mise à jour du statut Discord échouée : HTTP ${reponse.status}`)
      }
    }).catch((err: Error) => {
      console.error("❌ Erreur fetch Discord :", err.message)
    }).finally(() => {
      this.estEnvoiEnCours = false
    })
  }

  private async envoyerADiscordBrut(statutPersonnalise: null | object): Promise<void> {
    const token = Parametres.discord.token
    if (!token) return

    const reponse = await fetch("https://discord.com/api/v9/users/@me/settings", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token
      },
      body: JSON.stringify({ custom_status: statutPersonnalise })
    }).catch(() => null)

    if (reponse?.status === 429) {
      console.warn("⚠️  Discord 429 sur effacerStatut — le statut n'a peut-être pas été effacé")
    }
  }
}
