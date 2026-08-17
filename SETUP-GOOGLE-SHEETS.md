# 🔧 Guide de configuration - Synchronisation Google Sheets

## ✅ Prérequis
- Un compte Google
- Un Google Sheet créé (ou tu peux en créer un)
- Accès à Google Apps Script

---

## 📋 Étape 1: Préparer le Google Sheet

### 1.1 Créer un Google Sheet (si tu n'en as pas)
1. Va sur [sheets.google.com](https://sheets.google.com)
2. Clique sur "➕ Nouveau"
3. Crée une feuille vierge
4. Donne-lui un nom (ex: "Questionnaire Vétérinaires")

### 1.2 Copier l'ID du Sheet
1. Ouvre ton Google Sheet
2. Regarde l'URL: `https://docs.google.com/spreadsheets/d/**[ID]**/edit`
3. Copie la partie `[ID]` (c'est une longue chaîne de caractères)

---

## 🔐 Étape 2: Configurer le Google Apps Script

### 2.1 Créer un nouveau projet Apps Script
1. Va sur [script.google.com](https://script.google.com)
2. Clique sur "➕ Nouveau projet"
3. À gauche, tu vois "Untitled project" → Clique dessus pour le renommer
4. Renomme-le en "HYC Questionnaire" (ou autre)

### 2.2 Copier le code
1. Efface tout le code par défaut dans l'éditeur
2. Ouvre le fichier `google-apps-script.js` de ce projet
3. Copie **tout le code**
4. Colle-le dans l'éditeur Google Apps Script

### 2.3 Configurer l'ID du Sheet
1. Dans le code, trouve cette ligne (tout en haut):
   ```javascript
   const SHEET_ID = ''; // À remplir avec l'ID de ton Google Sheet
   ```
2. Remplace le `''` vide par l'ID que tu as copié:
   ```javascript
   const SHEET_ID = 'abc123xyz789...'; // Ton ID
   ```
3. **Sauvegarde** (Ctrl+S ou Cmd+S)

### 2.4 Déployer comme Web App
1. En haut à droite, clique sur "🔴 Déployer"
2. Sélectionne "📦 Nouveau déploiement"
3. Clique sur "⚙️ Sélectionner le type" → "Application Web"
4. Configure:
   - **Exécuter en tant que**: `Moi` (ton compte)
   - **Accès**: `Quiconque` (important!)
5. Clique sur "Déployer"
6. ✅ Un popup apparaît avec l'URL générée

### 2.5 Copier l'URL de déploiement
1. Copie l'URL complète (elle commence par `https://script.google.com/macros/s/...`)
2. C'est ton `FORM_ENDPOINT`

---

## 📝 Étape 3: Configurer le formulaire

1. Ouvre `index.html` dans ce projet
2. Cherche cette ligne (environ ligne 730):
   ```javascript
   const FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzZ-HGuSGtU0B4p5dEVObAxI864IbiLBSZ9SRIggaDIj8ceYjQVtoZfvR9aLFhoAZU/exec';
   ```
3. Remplace l'URL par celle que tu as copiée à l'étape 2.5
4. **Sauvegarde**

---

## 🧪 Étape 4: Tester

### Test 1: Via le formulaire web
1. Ouvre le formulaire (`index.html` localement ou sur le serveur)
2. Remplis tous les champs requis
3. Clique sur "Envoyer mes informations"
4. **Ouvre la console du navigateur** (F12 → Onglet Console)
5. Tu devrais voir:
   ```
   📤 Envoi des données vers: https://script.google.com/...
   📋 Données: {...}
   ✅ Requête envoyée avec succès
   ```
6. **Ouvre ton Google Sheet** → Les données doivent y être! 🎉

### Test 2: Dans Google Apps Script (optionnel)
1. Va sur [script.google.com](https://script.google.com) → Ton projet
2. Cherche la fonction `testPost()`
3. Sélectionne `testPost` dans le menu déroulant en haut
4. Clique sur "▶️ Exécuter"
5. Accepte les autorisations
6. Ouvre ton Google Sheet → Vérifie que les données de test sont là

---

## 🐛 Dépannage

### Problème: "SHEET_ID non configuré"
**Solution**: Vérifier que tu as bien rempli `SHEET_ID` dans le code (voir Étape 2.3)

### Problème: Erreur d'autorisation
**Solution**: 
1. Assure-toi que "Accès" est défini sur "Quiconque" lors du déploiement
2. Si tu dois changer, va dans "Déploiements" → "Gérer les déploiements" → Édite le déploiement

### Problème: Aucune donnée dans le Google Sheet
**Solution**:
1. Ouvre la console du navigateur (F12)
2. Remplis et envoie le formulaire
3. Regarde les messages:
   - Si tu vois `✅ Requête envoyée`, le problème vient du Google Apps Script
   - Si tu vois une erreur, le problème vient du formulaire
4. Va dans Google Apps Script → "Exécutions" pour voir les logs détaillés

### Problème: Google Sheet ajoute des colonnes bizarres
**Solution**: C'est normal au premier envoi. Les colonnes sont créées automatiquement d'après les champs du formulaire.

---

## 📞 Support

Si tu as des questions, regarde:
1. Les **logs dans la console du navigateur** (F12)
2. Les **logs dans Google Apps Script** (Exécutions → Détails)
3. Les commentaires dans le code (`google-apps-script.js`)

Bonne chance! 🚀
