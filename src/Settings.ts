import * as fs from "fs"
import * as path from "path"

export interface IParametres {
  spotify: {
    idClient: string
    secretClient: string
    tokenRafraichissement: string
    uriRedirection: string
  }
  discord: {
    token: string
  }
  affichage: {
    format: string       // ex. "🎶 {lyrics}" ou "{song_author} — {lyrics}"
    emoji: string        // emoji unicode pour le statut Discord
    repliSurPiste: boolean
  }
  minutages: {
    decalageEnvoiMs: number // ms d'avance sur les paroles (compenser la latence)
  }
}

const CONFIG_PATH = path.join(process.cwd(), "config.json")

const defaults: IParametres = {
  spotify: {
    idClient: "",
    secretClient: "",
    tokenRafraichissement: "",
    uriRedirection: "http://127.0.0.1:3000/callback"
  },
  discord: {
    token: ""
  },
  affichage: {
    format: "{lyrics}",
    emoji: "🎶",
    repliSurPiste: true
  },
  minutages: {
    decalageEnvoiMs: 200
  }
}

export class Parametres {
  private static donnees: IParametres = { ...defaults }

  public static charger(): void {
    if (!fs.existsSync(CONFIG_PATH)) {
      Parametres.donnees = JSON.parse(JSON.stringify(defaults))
      Parametres.sauvegarder()
      return
    }
    try {
      const brut = fs.readFileSync(CONFIG_PATH, "utf-8")
      Parametres.donnees = JSON.parse(brut) as IParametres
    } catch {
      Parametres.donnees = JSON.parse(JSON.stringify(defaults))
    }
  }

  public static sauvegarder(): void {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(Parametres.donnees, null, 2), "utf-8")
  }

  public static get spotify() { return Parametres.donnees.spotify }
  public static get discord() { return Parametres.donnees.discord }
  public static get affichage()    { return Parametres.donnees.affichage }
  public static get minutages() { return Parametres.donnees.minutages }

  public static mettreAJour(partial: Partial<IParametres>): void {
    Parametres.donnees = { ...Parametres.donnees, ...partial }
    Parametres.sauvegarder()
  }

  public static versJSON(): IParametres {
    return JSON.parse(JSON.stringify(Parametres.donnees))
  }
}
