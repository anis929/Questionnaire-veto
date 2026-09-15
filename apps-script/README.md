# Collecte des réponses dans Google Sheets

Ce dossier contient le script à installer **dans le Google Sheet** qui reçoit les
réponses du questionnaire (`index.html`).

## Pourquoi le Sheet n'était pas rempli entièrement

Trois causes cumulées, toutes corrigées ici :

1. **Champs absents de l'envoi.** Le formulaire construisait le message à partir
   du `FormData` brut. Or une case à cocher non cochée, un groupe de cases vide
   (langues, compétences, missions…) ou un bouton radio non sélectionné
   n'apparaissent **pas** dans un `FormData`. Chaque réponse envoyait donc un
   jeu de champs différent, et les colonnes se décalaient d'une ligne à l'autre.
   Le formulaire envoie désormais **les 32 champs à chaque réponse**, vides
   compris (`""`, ou `Non` pour une case décochée).
2. **Valeurs multiples mal transmises.** Les groupes de cases (domaines,
   pratique, langues…) produisaient un tableau JavaScript, sérialisé de façon
   imprévisible côté Sheet. Elles sont maintenant regroupées en une chaîne
   séparée par ` | ` — le séparateur n'est pas la virgule, car certaines
   valeurs en contiennent (« Nutrition, Alimentation et Diététique »).
3. **En-tête `Content-Type` ignoré.** En mode `no-cors`, le navigateur supprime
   un en-tête `Content-Type: application/json` : Apps Script recevait un corps
   qu'il ne savait pas relire. L'envoi se fait désormais en
   `application/x-www-form-urlencoded`, le seul type autorisé dans ce mode, et
   les champs arrivent directement dans `e.parameter`.

## Installation (5 minutes)

1. Ouvrez le Google Sheet de destination.
2. **Extensions > Apps Script**.
3. Remplacez tout le contenu de `Code.gs` par celui de [`Code.gs`](./Code.gs).
4. Enregistrez (💾).
5. Cliquez sur **Exécuter** avec la fonction `testerEnregistrement` sélectionnée,
   puis autorisez l'accès au classeur. Une ligne « Test / HYC » doit apparaître
   dans l'onglet **Réponses** — supprimez-la ensuite.
6. **Déployer > Nouveau déploiement** > type **Application Web** :
   - *Exécuter en tant que* : **Moi**
   - *Qui a accès* : **Tout le monde**
7. Copiez l'URL `…/exec` fournie et collez-la dans `index.html`, à la ligne
   `const FORM_ENDPOINT = '…'`.

## ⚠️ À chaque modification du script

Modifier `Code.gs` **ne met pas à jour** l'application web déjà publiée :
l'URL `/exec` continue d'exécuter l'ancienne version. Il faut à chaque fois
faire **Déployer > Gérer les déploiements > ✏️ (modifier) > Version : Nouvelle
version > Déployer**. L'URL reste la même.

C'est la cause n°1 des « le script est pourtant corrigé mais le Sheet ne bouge
pas ».

## Vérifier que tout fonctionne

- Ouvrez l'URL `/exec` dans un navigateur : elle doit répondre
  `{"ok":true,"service":"questionnaire-veto","feuille":"Réponses"}`.
- Envoyez une réponse depuis le formulaire, puis regardez l'onglet **Réponses**.
- En cas de problème, ouvrez **Exécutions** dans l'éditeur Apps Script : chaque
  appel y est tracé avec son éventuelle erreur.

## Comportement du script

- L'onglet **Réponses** est créé automatiquement s'il n'existe pas.
- La ligne d'en-têtes est écrite au premier envoi, en gras et figée.
- Si le questionnaire gagne un champ, la colonne correspondante est **ajoutée à
  droite** automatiquement ; les lignes existantes ne sont pas touchées.
- Chaque valeur est écrite sous son en-tête, jamais par position : ajouter,
  déplacer ou renommer une colonne à la main ne décale plus rien.
- Chaque envoi porte un identifiant (`ID envoi`) : un double clic sur
  « Envoyer » ou un renvoi réseau ne crée pas de ligne en double.
- Un verrou (`LockService`) évite que deux réponses simultanées s'écrasent.
