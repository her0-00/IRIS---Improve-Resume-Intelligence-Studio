# 🎯 CareerOps Best Practices Integration

Ce document explique comment RIIS intègre les meilleures pratiques de [CareerOps](https://github.com/santifer/career-ops) pour améliorer la qualité des CVs générés, **sans alourdir le projet**.

---

## 📋 Améliorations Intégrées

### 1. **Keyword Injection Éthique** ✅

**Principe CareerOps**: Reformuler l'expérience existante avec le vocabulaire exact du JD, sans inventer de compétences.

**Exemples de reformulation légitime**:
```
JD: "RAG pipelines" + CV: "LLM workflows with retrieval"
→ "RAG pipeline design and LLM orchestration workflows"

JD: "MLOps" + CV: "observability, evals, error handling"
→ "MLOps and observability: evals, error handling, cost monitoring"

JD: "stakeholder management" + CV: "collaborated with team"
→ "stakeholder management across engineering, operations, and business"
```

**Implémentation RIIS**: Intégré dans le prompt Agent2 (Boost Mode et Standard Mode).

---

### 2. **Quantifiable Impact Check** ✅

**Principe CareerOps**: Chaque expérience DOIT avoir au moins un chiffre (%, $, €, temps, utilisateurs, taille équipe).

**Exemples**:
- ❌ "Improved system performance"
- ✅ "Improved system performance by 30%, reducing load time from 5s to 3.5s"

- ❌ "Led development team"
- ✅ "Led team of 5 engineers delivering 3 major features in 6 months"

**Implémentation RIIS**:
- Agent1 (Audit): Détecte les expériences sans chiffres et les flag comme CON
- Agent2 (Rewrite): Ajoute des métriques quantifiables dans chaque bullet (sans inventer)

---

### 3. **ATS Structure Risk Detection** ✅

**Principe CareerOps**: Les CVs multi-colonnes (Canva-style, sidebar) échouent TOUJOURS au parsing ATS.

**Implémentation RIIS**:
- Agent1 détecte les layouts multi-colonnes
- Si détecté: `ats_structure_risk: "CRITICAL"` + warning explicite
- Recommandation: Utiliser les thèmes ATS-optimized de RIIS (6 thèmes dédiés)

---

### 4. **Professional Summary Optimization** ✅

**Principe CareerOps**: Les 3 premières lignes du CV doivent contenir les top 5 keywords du JD.

**Exit Narrative Bridge** (pour founders/entrepreneurs):
```
"Built and sold a business. Now applying systems thinking to [job domain]."
```

**Implémentation RIIS**:
- Agent2 (Boost Mode): Injecte top 5 keywords dans les 2 premières phrases du summary
- Détecte si candidat est founder → ajoute exit narrative automatiquement

---

### 5. **Date Format Enforcement** ✅

**Principe CareerOps**: Format de dates cohérent selon la langue.

**Formats**:
- FR: `MM/AAAA` (03/2021) ou `Depuis MM/AAAA`
- EN: `MM/YYYY` (03/2021) ou `MM/YYYY - Present`

**Implémentation RIIS**:
- Agent1: Vérifie la cohérence des formats de dates
- Agent2: Force le format correct selon la langue de sortie

---

### 6. **Online Brand Check** ✅

**Principe CareerOps**: LinkedIn profile link est CRITIQUE pour la crédibilité.

**Implémentation RIIS**:
- Agent1: Flag l'absence de LinkedIn comme CON critique dans "Identité"
- Recommandation: Ajouter le lien dans le CV avant génération PDF

---

### 7. **Apprenticeship/Alternance Rhythm** ✅

**Principe CareerOps**: Si candidat cherche alternance, spécifier le rythme (ex: "1 semaine / 3 semaines").

**Implémentation RIIS**:
- Agent1: Détecte mention d'alternance sans rythme → flag comme CON
- Agent2: Ajoute le rythme dans le title si présent dans le CV original

---

## 🔄 Workflow Comparaison

| Étape | CareerOps | RIIS |
|-------|-----------|------|
| **Input** | cv.md + Job URL | PDF/DOCX + Job Offer text |
| **Audit** | A-G Evaluation (7 blocs) | Agent1 (Score 0-100 + detailed report) |
| **Rewrite** | Keyword injection + STAR stories | Agent2 (Boost Mode + ethical reformulation) |
| **Output** | Report.md + ATS PDF | JSON + 32 themed PDFs |
| **Tracking** | TSV tracker + Dashboard TUI | In-memory (no database) |

---

## 🎨 Différences Clés

### CareerOps
- **Focus**: Filtrer 100+ offres, générer CVs ciblés en masse
- **Interface**: CLI agentic (Claude Code/Gemini)
- **Deployment**: Local (Node.js + Go)
- **Use Case**: Job search pipeline (scan → eval → apply)

### RIIS
- **Focus**: Optimiser 1 CV pour passer l'ATS avec design premium
- **Interface**: Web app (Next.js)
- **Deployment**: Render.com (Docker, gratuit)
- **Use Case**: CV optimization + PDF generation (32 thèmes)

---

## 💡 Complémentarité

**Workflow idéal**:
1. **CareerOps** scanne 100 offres → évalue → score A-F
2. Garde les offres >= 4.0 (top 10-15%)
3. Pour chaque top offer → **RIIS** génère un PDF premium avec thème personnalisé
4. CareerOps track l'application dans le dashboard TUI

---

## 📊 Impact des Améliorations

### Avant (RIIS v1.0)
- Keyword injection basique
- Pas de vérification quantifiable impact
- Pas de détection multi-colonnes
- Summary générique

### Après (RIIS v1.1 + CareerOps practices)
- ✅ Keyword injection éthique avec exemples
- ✅ Vérification impact quantifié (%, $, temps)
- ✅ Détection CRITICAL des layouts multi-colonnes
- ✅ Summary optimisé avec top 5 keywords + exit narrative
- ✅ Date format enforcement
- ✅ LinkedIn check critique
- ✅ Alternance rhythm detection

---

## 🚀 Résultat

**RIIS conserve**:
- Légèreté (pas de base de données)
- Déploiement gratuit sur Render
- 32 thèmes premium
- Photo integration (10 thèmes)
- Customization studio

**RIIS gagne**:
- Qualité de reformulation CareerOps
- Détection ATS structure risk
- Quantifiable impact enforcement
- Professional summary optimization
- Exit narrative pour founders

---

## 📚 Références

- **CareerOps**: https://github.com/santifer/career-ops
- **CareerOps Case Study**: https://santifer.io/career-ops-system
- **RIIS Live Demo**: https://riis.onrender.com/

---

## 🤝 Crédits

Merci à **Santiago Fernández** ([@santifer](https://github.com/santifer)) pour CareerOps et ses insights sur l'optimisation CV éthique.

---

## License

MIT (comme CareerOps et RIIS)
