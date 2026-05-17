import express, { Request, Response } from "express"
import * as path from "path"
import { Parametres } from "../Settings"
import { ServiceSpotify } from "../SpotifyService"
import { EtatLecture } from "../PlaybackState"
import { ChangeurStatut } from "../StatusChanger"

export function demarrerServeur(etat: EtatLecture, changeur: ChangeurStatut): void {
  const app = express()

  app.use(express.json())
  app.use(express.static(path.join(process.cwd(), "static")))

  /** GET /api/settings — retourne la config actuelle (sans tokens en clair) */
  app.get("/api/settings", (_req: Request, res: Response) => {
    const cfg = Parametres.versJSON()
    res.json({
      idClient: cfg.spotify.idClient,
      secretClient: cfg.spotify.secretClient ? "••••••••" : "",
      uriRedirection: cfg.spotify.uriRedirection,
      tokenDiscord: cfg.discord.token ? "••••••••" : "",
      format: cfg.affichage.format,
      emoji: cfg.affichage.emoji,
      repliSurPiste: cfg.affichage.repliSurPiste,
      decalageEnvoiMs: cfg.minutages.decalageEnvoiMs,
      aTokenSpotify: !!cfg.spotify.tokenRafraichissement,
      aTokenDiscord: !!cfg.discord.token
    })
  })

  /** POST /api/settings — sauvegarde les champs de configuration */
  app.post("/api/settings", (req: Request, res: Response) => {
    const corps = req.body as Record<string, string | boolean | number>

    const courant = Parametres.versJSON()

    if (corps.idClient !== undefined)      courant.spotify.idClient = String(corps.idClient)
    if (corps.secretClient !== undefined && corps.secretClient !== "••••••••")
                                           courant.spotify.secretClient = String(corps.secretClient)
    if (corps.uriRedirection !== undefined)   courant.spotify.uriRedirection = String(corps.uriRedirection)
    if (corps.tokenDiscord !== undefined && corps.tokenDiscord !== "••••••••")
                                           courant.discord.token = String(corps.tokenDiscord)
    if (corps.format !== undefined)        courant.affichage.format = String(corps.format)
    if (corps.emoji !== undefined)         courant.affichage.emoji = String(corps.emoji)
    if (corps.repliSurPiste !== undefined) courant.affichage.repliSurPiste = Boolean(corps.repliSurPiste)
    if (corps.decalageEnvoiMs !== undefined)  courant.minutages.decalageEnvoiMs = Number(corps.decalageEnvoiMs)

    Parametres.mettreAJour(courant)
    res.json({ ok: true })
  })

  /** GET /auth/spotify — redirige vers la page d'autorisation Spotify */
  app.get("/auth/spotify", (_req: Request, res: Response) => {
    if (!Parametres.spotify.idClient) {
      res.status(400).send("Spotify Client ID non configuré.")
      return
    }
    res.redirect(ServiceSpotify.obtenirUrlAuth())
  })

  /** GET /callback — Spotify redirige ici avec ?code=... */
  app.get("/callback", async (req: Request, res: Response) => {
    const code = req.query.code as string | undefined
    const erreur = req.query.error as string | undefined

    if (erreur) {
      console.error(`❌ Erreur OAuth Spotify : ${erreur}`)
      res.redirect(`/?error=${encodeURIComponent(erreur)}`)
      return
    }
    if (!code) {
      res.status(400).send("Paramètre code manquant.")
      return
    }
    const ok = await ServiceSpotify.echangerCode(code)
    if (ok) {
      console.log("✅ OAuth Spotify réussi — token sauvegardé")
      res.redirect("/?connected=1")
    } else {
      console.error("❌ Échange de token Spotify échoué — vérifiez le Client ID/Secret")
      res.redirect("/?error=exchange_failed")
    }
  })

  /** GET /api/status — état de lecture actuel */
  app.get("/api/status", (_req: Request, res: Response) => {
    res.json({
      estEnLecture: etat.estEnLecture,
      nomPiste: etat.nomPiste,
      artiste: etat.artiste,
      imageUrl: etat.imageUrl,
      progressionMs: etat.progressionMs,
      dureeMs: etat.dureeMs,
      aDesParoles: etat.aDesParoles,
      ligneCourante: etat.ligneCourante?.texte ?? null,
      actif: changeur["actif"]
    })
  })

  /** POST /api/start — active les mises à jour de statut */
  app.post("/api/start", (_req: Request, res: Response) => {
    changeur.definirActif(true)
    res.json({ ok: true })
  })

  /** POST /api/stop — désactive et efface le statut Discord */
  app.post("/api/stop", async (_req: Request, res: Response) => {
    changeur.definirActif(false)
    await changeur.effacerStatut()
    res.json({ ok: true })
  })

  /** Repli SPA — sert index.html pour toute route GET non reconnue */
  app.get("*", (_req: Request, res: Response) => {
    res.sendFile(path.join(process.cwd(), "static", "index.html"))
  })

  app.listen(3000, () => {
    console.log("🌐  Panneau disponible sur http://localhost:3000")
  })
}
