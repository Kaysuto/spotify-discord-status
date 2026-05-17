import { useState, useEffect } from 'react'

export interface StatutLecture {
  estEnLecture: boolean
  nomPiste: string
  artiste: string
  imageUrl: string
  progressionMs: number
  dureeMs: number
  aDesParoles: boolean
  ligneCourante: string | null
  actif: boolean
}

export interface ParametresApp {
  idClient: string
  secretClient: string
  uriRedirection: string
  tokenDiscord: string
  format: string
  emoji: string
  repliSurPiste: boolean
  decalageEnvoiMs: number
  aTokenSpotify: boolean
  aTokenDiscord: boolean
}

export function utiliserStatut(intervalleMs = 1500) {
  const [statut, setStatut] = useState<StatutLecture | null>(null)
  const [erreur, setErreur] = useState<boolean>(false)

  useEffect(() => {
    const interroger = async () => {
      try {
        const reponse = await fetch('/api/status')
        if (!reponse.ok) throw new Error()
        setStatut(await reponse.json())
        setErreur(false)
      } catch {
        setErreur(true)
      }
    }
    interroger()
    const id = setInterval(interroger, intervalleMs)
    return () => clearInterval(id)
  }, [intervalleMs])

  return { statut, erreur }
}

export async function recupererParametres(): Promise<ParametresApp> {
  const reponse = await fetch('/api/settings')
  return reponse.json()
}

export async function sauvegarderParametres(partial: Partial<ParametresApp>): Promise<boolean> {
  const reponse = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(partial),
  })
  const donnees = await reponse.json()
  return donnees.ok === true
}

export async function demarrerBot(): Promise<void> {
  await fetch('/api/start', { method: 'POST' })
}

export async function arreterBot(): Promise<void> {
  await fetch('/api/stop', { method: 'POST' })
}
