# Assistant Espagnol IA - Configuration Sécurisée

## Déploiement sur Netlify

### 1. Uploadez ces fichiers sur GitHub :
- `index.html`
- `netlify.toml`
- `package.json`
- `netlify/functions/chat.js`

### 2. Connectez votre repo à Netlify :
1. Allez sur https://app.netlify.com
2. Cliquez "New site from Git"
3. Connectez votre compte GitHub
4. Sélectionnez votre repository
5. Cliquez "Deploy site"

### 3. Ajoutez votre clé API (IMPORTANT - GARDEZ-LA SECRÈTE) :
1. Dans Netlify, allez dans "Site settings"
2. Cliquez sur "Environment variables"
3. Cliquez "Add a variable"
4. Name: `ANTHROPIC_API_KEY`
5. Value: `votre-clé-api-anthropic`
6. Cliquez "Save"

### 4. Obtenez votre clé API Anthropic :
1. Allez sur https://console.anthropic.com
2. Créez un compte (vous aurez des crédits gratuits)
3. Allez dans "API Keys"
4. Créez une nouvelle clé
5. Copiez-la et mettez-la dans les variables d'environnement Netlify

### 5. Redéployez :
- Dans Netlify, allez dans "Deploys"
- Cliquez "Trigger deploy" → "Deploy site"

Votre app sera accessible à : `https://votre-site.netlify.app`

## Sécurité
✅ Votre clé API est TOTALEMENT SÉCURISÉE
✅ Elle n'est jamais exposée dans le code
✅ Elle est stockée côté serveur dans Netlify
✅ Personne ne peut la voir, même en inspectant le code source

## Utilisation
1. Ouvrez l'URL sur votre iPhone
2. Autorisez le microphone
3. Commencez à parler en espagnol avec Carlos !
