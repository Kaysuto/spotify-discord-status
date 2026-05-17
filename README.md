# Spotify → Discord Status

Affiche les paroles de ta chanson Spotify en temps réel dans ton statut personnalisé Discord.

> **Stack :** Node.js · TypeScript · React · Vite · Tailwind v4 · shadcn/ui · Framer Motion
>
> **Thème :** dark/light avec transition animée

---

## Fonctionnalités

- 🎵 Paroles synchronisées en temps réel via [lrclib.net](https://lrclib.net)
- 🎨 Interface dark/light avec animations Framer Motion
- 🔒 Protection anti-ban Discord (rate limiting, déduplication, mutex)
- ⚙️ Format de statut personnalisable (paroles, titre, artiste…)
- 🌐 Panneau web local sur `http://localhost:3000`

---

## Prérequis

- [Node.js](https://nodejs.org/) v18+
- Un compte Spotify
- Discord ouvert dans un navigateur (web ou app)

---

## Installation

```bash
git clone https://github.com/Kaysuto/spotify-discord-status.git
cd spotify-discord-status

# Installer les dépendances backend
npm install

# Installer et builder le frontend React
cd client && npm install && npm run build && cd ..

# Lancer l'app
npm run dev
```

Puis ouvre **http://localhost:3000** dans ton navigateur.

> En mode développement (hot-reload des deux côtés) :
> ```bash
> npm run dev:ui
> ```

---

## Configuration

### 1. Créer une application Spotify

1. Va sur [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
2. Clique **Create App**
3. Dans **Redirect URIs**, ajoute : `http://127.0.0.1:3000/callback`
   > ⚠️ Utilise bien `127.0.0.1` et non `localhost` — Spotify n'accepte pas `localhost`
4. Copie ton **Client ID** et **Client Secret**
5. Dans le panneau → onglet **Spotify** → colle les valeurs → **Sauvegarder** → **Connecter Spotify**

### 2. Obtenir ton token Discord

1. Ouvre [Discord](https://discord.com/app) dans ton **navigateur**
2. Appuie sur `F12` → onglet **Network** (Réseau)
3. Dans le filtre, tape `api`
4. Effectue une action dans Discord (changer de serveur, cliquer quelque part…)
5. Clique sur une requête → **Headers** → trouve le header **Authorization**
6. Copie la valeur (commence par `MTc…` ou similaire)
7. Dans le panneau → onglet **Discord** → colle le token → **Sauvegarder**

### 3. Personnaliser (optionnel)

Dans l'onglet **Personnalisation** :

| Variable | Description |
|---|---|
| `{lyrics}` | Ligne de paroles actuelle |
| `{lyrics_upper}` | Paroles en majuscules |
| `{song_name}` | Titre de la chanson |
| `{song_author}` | Artiste(s) |

Exemples :
- `🎵 {lyrics}` ← valeur par défaut
- `{song_author} — {lyrics}`
- `🎤 {lyrics_upper}`

### 4. Lancer

- Clique **▶ Démarrer** dans le panneau
- Lance une chanson sur Spotify
- Ton statut Discord se met à jour avec les paroles 🎶

---

## Structure du projet

```
spotify-discord-status/
├── src/                        # Backend TypeScript
│   ├── index.ts                # Point d'entrée
│   ├── Settings.ts             # Persistance config (config.json)
│   ├── SpotifyService.ts       # OAuth + Currently Playing
│   ├── LyricsFetcher.ts        # Récupération paroles (lrclib.net)
│   ├── StatusChanger.ts        # Mise à jour statut Discord
│   ├── PlaybackStateUpdater.ts # Boucle de polling
│   └── Panel/
│       └── Server.ts           # Serveur Express + API REST
├── client/                     # Frontend React + Vite
│   └── src/
│       ├── App.tsx             # Layout principal (dark/light, animations)
│       └── components/
│           ├── NowPlaying.tsx
│           ├── SpotifyConfig.tsx
│           ├── DiscordConfig.tsx
│           └── CustomizationConfig.tsx
├── static/                     # Build React (généré par npm run build:all)
├── config.json                 # Config locale (ignoré par git)
└── package.json
```

---

## Scripts disponibles

| Commande | Description |
|---|---|
| `npm run dev` | Lance le backend en mode développement |
| `npm run dev:ui` | Lance backend + frontend en hot-reload simultané |
| `npm run build` | Compile le backend TypeScript |
| `npm run build:all` | Compile backend + build React |
| `npm start` | Lance le build de production |

---

## ⚠️ Avertissement

L'utilisation du **token utilisateur Discord** est en dehors des Conditions d'Utilisation de Discord. Cet outil est prévu pour un **usage personnel uniquement**. Utilise-le à tes propres risques.

