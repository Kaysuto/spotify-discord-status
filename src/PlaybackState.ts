import { LigneParoles } from "./LyricsFetcher"

export class EtatLecture {
  public idPiste: string = ""
  public nomPiste: string = ""
  public artiste: string = ""
  public imageUrl: string = ""
  public progressionMs: number = 0
  public dureeMs: number = 0
  public estEnLecture: boolean = false

  public paroles: LigneParoles[] | null = null
  public aDesParoles: boolean = false
  public ligneCourante: LigneParoles | null = null

  public get estTermine(): boolean {
    return this.dureeMs > 0 && this.progressionMs >= this.dureeMs
  }
}
