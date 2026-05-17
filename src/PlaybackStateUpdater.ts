import { EtatLecture } from "./PlaybackState"
import { ServiceSpotify } from "./SpotifyService"
import { RecuperateurParoles } from "./LyricsFetcher"

export class MetteurAJourLecture {
  private etat: EtatLecture
  private recuperateur: RecuperateurParoles
  private derniereIdPiste: string = ""

  constructor(etat: EtatLecture, recuperateur: RecuperateurParoles) {
    this.etat = etat
    this.recuperateur = recuperateur
  }

  /** Appelée toutes les 5 secondes — met à jour la piste et les paroles si la chanson a changé */
  public async mettreAJour(): Promise<void> {
    const enCoursLecture = await ServiceSpotify.obtenirEnCoursLecture()

    if (!enCoursLecture) {
      this.etat.estEnLecture = false
      return
    }

    this.etat.estEnLecture = enCoursLecture.estEnLecture
    this.etat.progressionMs = enCoursLecture.progressionMs
    this.etat.dureeMs = enCoursLecture.dureeMs
    this.etat.nomPiste = enCoursLecture.nomPiste
    this.etat.artiste = enCoursLecture.artiste
    this.etat.imageUrl = enCoursLecture.imageUrl

    if (enCoursLecture.idPiste !== this.derniereIdPiste) {
      // Chanson changée — réinitialiser l'état et récupérer les nouvelles paroles
      this.derniereIdPiste = enCoursLecture.idPiste
      this.etat.idPiste = enCoursLecture.idPiste
      this.etat.ligneCourante = null
      this.etat.paroles = null
      this.etat.aDesParoles = false

      const paroles = await this.recuperateur.recuperer(enCoursLecture.nomPiste, enCoursLecture.artiste)
      this.etat.paroles = paroles
      this.etat.aDesParoles = paroles !== null && paroles.length > 0
    }
  }
}
