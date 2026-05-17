export interface LigneParoles {
  tempsMs: number
  texte: string
}

/** Récupère les paroles synchronisées depuis LrcLib (gratuit, sans authentification) */
export class RecuperateurParoles {
  public derniereSource: string = ""

  public async recuperer(nomPiste: string, artiste: string): Promise<LigneParoles[] | null> {
    try {
      const urlRecherche = `https://lrclib.net/api/search?${new URLSearchParams({ track_name: nomPiste, artist_name: artiste }).toString()}`
      const reponse = await fetch(urlRecherche, { headers: { "User-Agent": "spotify-discord-status/1.0" } })

      if (!reponse.ok) return null

      const resultats = await reponse.json() as Array<{ syncedLyrics: string | null; plainLyrics: string | null; artistName: string; trackName: string }>

      if (!resultats || resultats.length === 0) return null

      // Préférer les résultats avec paroles synchronisées
      const meilleur = resultats.find(r => r.syncedLyrics) ?? resultats[0]

      if (meilleur.syncedLyrics) {
        this.derniereSource = "LrcLib (synchronisé)"
        return this.analyserLrc(meilleur.syncedLyrics)
      }

      return null
    } catch {
      return null
    }
  }

  /** Analyse le format LRC : [mm:ss.xx] texte */
  private analyserLrc(lrc: string): LigneParoles[] {
    const lignes: LigneParoles[] = []
    const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/

    for (const brut of lrc.split("\n")) {
      const correspondance = brut.match(regex)
      if (!correspondance) continue

      const minutes = parseInt(correspondance[1])
      const secondes = parseInt(correspondance[2])
      const centisecondes = parseInt(correspondance[3].padEnd(3, "0"))
      const tempsMs = minutes * 60000 + secondes * 1000 + centisecondes
      const texte = correspondance[4].trim()

      if (texte) {
        lignes.push({ tempsMs, texte })
      }
    }

    return lignes.sort((a, b) => a.tempsMs - b.tempsMs)
  }
}
