# Spécifications Fonctionnelles : CV Studio & Analyseur ATS

Ce document définit la logique et les modules nécessaires au fonctionnement du projet, indépendamment des technologies utilisées.

## 1. Vision Conceptuelle
Une plateforme sécurisée permettant d'optimiser un parcours professionnel pour les systèmes de recrutement automatisés, tout en garantissant la non-divulgation des données personnelles lors des traitements tiers.

## 2. Architecture Modulaire
- **Interface Utilisateur** : Gestion des fichiers, prévisualisation en temps réel et édition de contenu.
- **Service d'Analyse (Cœur Logique)** : Orchestration de l'intelligence artificielle pour l'audit et la réécriture.
- **Moteur de Rendu** : Génération de documents haute fidélité avec contrôle précis du positionnement (layout).
- **Couche de Confidentialité** : Intercepteur de données pour l'anonymisation.
- **Service Géographique** : Mise en relation des profils avec des opportunités locales via cartographie.

## 3. Logique des Modules

### A. Extraction et Pré-traitement
- Conversion de documents (PDF/Images) en texte brut exploitable.
- Nettoyage des caractères spéciaux et normalisation de la structure textuelle.

### B. Couche de Protection (Privacy)
- **Anonymisation Bidirectionnelle** : Identification automatique des entités sensibles (identité, coordonnées, liens sociaux) et remplacement par des variables fictives avant tout traitement externe.
- **Rétablissement** : Possibilité pour l'utilisateur de réinjecter ses vraies données uniquement lors de la phase finale de génération de document.

### C. Pipeline d'Intelligence Artificielle
1. **Module d'Audit** : Analyse comparative entre un profil et une offre d'emploi. Calcul de scores de compatibilité et identification des lacunes sémantiques.
2. **Module de Réécriture** : Transformation du contenu original pour intégrer les mots-clés manquants et quantifier les accomplissements, tout en restant fidèle au parcours réel.
3. **Résilience de Service** : Capacité à basculer entre différents services de traitement en cas de défaillance de l'un d'eux.

### D. Génération de Documents
- Support de thèmes multiples avec personnalisation des styles (typographie, couleurs, espacements).
- Structure de document optimisée pour être facilement lisible par les logiciels de scan (ATS-friendly).

## 4. Flux de Travail (Workflow)
1. Entrée des données brutes (CV + Offre).
2. Filtrage automatique des données personnelles.
3. Diagnostic et propositions d'amélioration par l'IA.
4. Ajustements manuels par l'utilisateur sur une structure de données claire.
5. Export du document final avec rétablissement des coordonnées réelles.

## 5. Règles de Gestion
- **Confidentialité** : Aucune donnée identifiable ne doit être transmise à des services tiers non sécurisés.
- **Fidélité** : L'IA ne doit pas inventer d'expériences, mais optimiser la formulation de l'existant.
- **Ergonomie** : L'utilisateur doit pouvoir éditer chaque champ du document final avant l'export.
