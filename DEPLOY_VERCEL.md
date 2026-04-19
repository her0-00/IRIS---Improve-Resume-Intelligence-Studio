# 🚀 Déploiement IRIS sur Vercel

## ⚠️ Limitations Vercel

Vercel a des limitations importantes pour IRIS :

### ❌ Problèmes connus
1. **Timeout 10s** : Les fonctions serverless ont un timeout de 10 secondes (plan gratuit)
2. **Taille limite** : Les fonctions Python ne peuvent pas dépasser 50MB
3. **ReportLab** : La génération PDF complexe peut dépasser les limites de temps
4. **Pas de Docker** : Vercel ne supporte pas Docker, donc pas de build unifié

### ✅ Solution recommandée : Render.com

IRIS est optimisé pour **Render.com** car :
- Support Docker natif
- Pas de timeout strict
- Backend Python persistant
- Plan gratuit généreux (750h/mois)

## 📋 Déploiement Vercel (Expérimental)

Si vous voulez quand même essayer Vercel :

### 1. Installation Vercel CLI
```bash
npm i -g vercel
```

### 2. Configuration
```bash
cd c:\Users\user\Downloads\atssimulator
vercel login
```

### 3. Variables d'environnement
Dans le dashboard Vercel, ajoutez :
- `GROQ_API_KEY` : Votre clé Groq
- `MISTRAL_API_KEY` : Votre clé Mistral (optionnel)
- `GOOGLE_API_KEY` : Votre clé Google AI (optionnel)

### 4. Déploiement
```bash
vercel --prod
```

## ⚡ Alternative : Render.com (Recommandé)

Utilisez le déploiement Render existant :
```bash
git push origin main
```

Le service se redéploie automatiquement sur https://IRIS.onrender.com/

## 🔧 Troubleshooting Vercel

### Erreur : Function timeout
- Réduisez la complexité des thèmes PDF
- Utilisez des modèles AI plus rapides
- Passez au plan Pro Vercel (60s timeout)

### Erreur : Module not found
- Vérifiez `backend/requirements.txt`
- Assurez-vous que ReportLab est compatible

### PDF ne se génère pas
- Vercel n'est pas optimal pour la génération PDF lourde
- Utilisez Render.com à la place
