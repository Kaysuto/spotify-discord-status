import { Parametres } from "./Settings"

export interface IEnCoursLecture {
  idPiste: string
  nomPiste: string
  artiste: string
  imageUrl: string
  progressionMs: number
  dureeMs: number
  estEnLecture: boolean
}

const SCOPES = [
  "user-read-currently-playing",
  "user-read-playback-state"
].join(" ")

export class ServiceSpotify {
  public static tokenAcces: string = ""
  private static expirationToken: number = 0

  /** Construit l'URL d'autorisation OAuth2 Spotify */
  public static obtenirUrlAuth(): string {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: Parametres.spotify.idClient,
      scope: SCOPES,
      redirect_uri: Parametres.spotify.uriRedirection
    })
    return `https://accounts.spotify.com/authorize?${params.toString()}`
  }

  /** Échange le code d'autorisation contre des tokens */
  public static async echangerCode(code: string): Promise<boolean> {
    const reponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${Buffer.from(`${Parametres.spotify.idClient}:${Parametres.spotify.secretClient}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: Parametres.spotify.uriRedirection
      }).toString()
    })

    if (!reponse.ok) {
      const corpsErreur = await reponse.text().catch(() => "")
      console.error(`❌ Échange de token Spotify échoué (${reponse.status}) : ${corpsErreur}`)
      return false
    }

    const json = await reponse.json() as { access_token: string; refresh_token: string; expires_in: number }
    ServiceSpotify.tokenAcces = json.access_token
    ServiceSpotify.expirationToken = Date.now() + json.expires_in * 1000

    Parametres.mettreAJour({ spotify: { ...Parametres.spotify, tokenRafraichissement: json.refresh_token } })
    return true
  }

  /** Rafraîchit le token d'accès en utilisant le refresh token stocké */
  public static async rafraichir(): Promise<boolean> {
    if (!Parametres.spotify.tokenRafraichissement) return false

    const reponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${Buffer.from(`${Parametres.spotify.idClient}:${Parametres.spotify.secretClient}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: Parametres.spotify.tokenRafraichissement
      }).toString()
    })

    if (!reponse.ok) return false

    const json = await reponse.json() as { access_token: string; refresh_token?: string; expires_in: number }
    ServiceSpotify.tokenAcces = json.access_token
    ServiceSpotify.expirationToken = Date.now() + json.expires_in * 1000

    if (json.refresh_token) {
      Parametres.mettreAJour({ spotify: { ...Parametres.spotify, tokenRafraichissement: json.refresh_token } })
    }
    return true
  }

  /** S'assure que le token est valide, le rafraîchit si nécessaire */
  public static async assurerToken(): Promise<boolean> {
    if (ServiceSpotify.tokenAcces && Date.now() < ServiceSpotify.expirationToken - 60000) {
      return true
    }
    return ServiceSpotify.rafraichir()
  }

  /** Récupère la piste en cours de lecture */
  public static async obtenirEnCoursLecture(): Promise<IEnCoursLecture | null> {
    const ok = await ServiceSpotify.assurerToken()
    if (!ok) return null

    const reponse = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: { "Authorization": `Bearer ${ServiceSpotify.tokenAcces}` }
    })

    if (reponse.status === 204 || !reponse.ok) return null

    const json = await reponse.json() as {
      item: {
        id: string
        name: string
        artists: { name: string }[]
        duration_ms: number
        album: { images: { url: string; width: number }[] }
      } | null
      progress_ms: number
      is_playing: boolean
    }

    if (!json.item) return null

    const images = json.item.album?.images ?? []
    const imageUrl = images.find(i => i.width >= 300)?.url ?? images[0]?.url ?? ""

    return {
      idPiste: json.item.id,
      nomPiste: json.item.name,
      artiste: json.item.artists.map(a => a.name).join(", "),
      imageUrl,
      progressionMs: json.progress_ms,
      dureeMs: json.item.duration_ms,
      estEnLecture: json.is_playing
    }
  }
}
