/**
 * Hack Your Care — collecte du questionnaire vétérinaire dans un Google Sheet.
 *
 * À coller dans l'éditeur Apps Script du classeur (Extensions > Apps Script),
 * puis à déployer en application web (voir apps-script/README.md).
 *
 * Principe : le formulaire envoie à chaque réponse la totalité des champs,
 * accompagnés de l'ordre (_ordre) et des libellés (_libelles) des colonnes.
 * Le script crée la ligne d'en-têtes si elle manque, ajoute les colonnes
 * apparues depuis le dernier envoi, puis écrit chaque valeur sous son propre
 * en-tête. Aucune colonne n'est codée en dur : rien ne se décale et rien
 * n'est perdu si le questionnaire évolue.
 */

var NOM_FEUILLE = 'Réponses';
var COL_HORODATAGE = 'Horodatage';
var COL_ID = 'ID envoi';

function doPost(e) {
  try {
    var donnees = extraireDonnees(e);
    if (!donnees || Object.keys(donnees).length === 0) {
      return reponseJson({ ok: false, erreur: 'Requête vide' });
    }
    var resultat = enregistrer(donnees);
    return reponseJson({ ok: true, ligne: resultat.ligne, doublon: resultat.doublon });
  } catch (err) {
    console.error(err);
    return reponseJson({ ok: false, erreur: String(err && err.message ? err.message : err) });
  }
}

/** Permet de vérifier depuis un navigateur que le déploiement répond. */
function doGet() {
  return reponseJson({ ok: true, service: 'questionnaire-veto', feuille: NOM_FEUILLE });
}

/**
 * Accepte indifféremment un corps application/x-www-form-urlencoded
 * (e.parameter) ou un corps JSON (e.postData.contents). Le formulaire
 * utilise le premier, seul autorisé par les navigateurs en mode no-cors.
 */
function extraireDonnees(e) {
  var donnees = {};
  if (e && e.parameter) {
    Object.keys(e.parameter).forEach(function (cle) { donnees[cle] = e.parameter[cle]; });
  }
  if (e && e.parameters) {
    // Un champ répété (ex. cases à cocher postées séparément) : on concatène.
    Object.keys(e.parameters).forEach(function (cle) {
      var valeurs = e.parameters[cle];
      if (valeurs && valeurs.length > 1) donnees[cle] = valeurs.join(' | ');
    });
  }
  if (e && e.postData && e.postData.contents) {
    var brut = String(e.postData.contents).trim();
    if (brut.charAt(0) === '{') {
      try {
        var json = JSON.parse(brut);
        Object.keys(json).forEach(function (cle) {
          var v = json[cle];
          donnees[cle] = Array.isArray(v) ? v.join(' | ') : v;
        });
      } catch (err) {
        console.warn('Corps JSON illisible : ' + err);
      }
    }
  }
  return donnees;
}

function enregistrer(donnees) {
  var verrou = LockService.getScriptLock();
  verrou.waitLock(30000); // deux réponses simultanées ne doivent pas écrire la même ligne
  try {
    var feuille = feuilleReponses();
    var colonnes = colonnesAttendues(donnees);
    var entetes = synchroniserEntetes(feuille, colonnes);

    var idEnvoi = donnees._id || '';
    if (idEnvoi) {
      var existante = ligneExistante(feuille, entetes, idEnvoi);
      if (existante > 0) return { ligne: existante, doublon: true };
    }

    var ligne = entetes.map(function () { return ''; });
    colonnes.forEach(function (colonne) {
      var index = entetes.indexOf(colonne.titre);
      if (index >= 0) ligne[index] = colonne.valeur;
    });

    feuille.appendRow(ligne);
    return { ligne: feuille.getLastRow(), doublon: false };
  } finally {
    verrou.releaseLock();
  }
}

/** Construit la liste { titre, valeur } des colonnes de cet envoi. */
function colonnesAttendues(donnees) {
  var libelles = {};
  if (donnees._libelles) {
    try { libelles = JSON.parse(donnees._libelles); } catch (err) { libelles = {}; }
  }

  var cles = String(donnees._ordre || '').split(',').filter(function (c) { return c; });
  // Repli si _ordre manque : toutes les clés reçues, hors clés techniques.
  if (cles.length === 0) {
    cles = Object.keys(donnees).filter(function (c) { return c.charAt(0) !== '_'; });
  }
  // Un champ reçu mais absent de _ordre reste collecté plutôt que perdu.
  Object.keys(donnees).forEach(function (cle) {
    if (cle.charAt(0) !== '_' && cles.indexOf(cle) === -1) cles.push(cle);
  });

  var colonnes = [{ titre: COL_HORODATAGE, valeur: horodatage(donnees._horodatage) }];
  cles.forEach(function (cle) {
    colonnes.push({
      titre: libelles[cle] || cle,
      valeur: donnees[cle] === undefined || donnees[cle] === null ? '' : String(donnees[cle])
    });
  });
  colonnes.push({ titre: COL_ID, valeur: donnees._id || '' });
  return colonnes;
}

/**
 * Écrit la ligne d'en-têtes si la feuille est vide, ajoute à droite les
 * en-têtes manquants, et renvoie la liste complète des en-têtes.
 */
function synchroniserEntetes(feuille, colonnes) {
  var largeur = Math.max(feuille.getLastColumn(), 1);
  var entetes = feuille.getLastRow() === 0
    ? []
    : feuille.getRange(1, 1, 1, largeur).getValues()[0]
        .map(function (v) { return String(v).trim(); });

  while (entetes.length && entetes[entetes.length - 1] === '') entetes.pop();

  var manquants = [];
  colonnes.forEach(function (colonne) {
    if (entetes.indexOf(colonne.titre) === -1 && manquants.indexOf(colonne.titre) === -1) {
      manquants.push(colonne.titre);
    }
  });

  if (manquants.length) {
    var nouveaux = entetes.concat(manquants);
    feuille.getRange(1, 1, 1, nouveaux.length).setValues([nouveaux]);
    feuille.getRange(1, 1, 1, nouveaux.length).setFontWeight('bold');
    feuille.setFrozenRows(1);
    entetes = nouveaux;
  }
  return entetes;
}

/** Renvoie le numéro de ligne déjà enregistré pour cet ID, ou 0. */
function ligneExistante(feuille, entetes, idEnvoi) {
  var colonne = entetes.indexOf(COL_ID) + 1;
  if (colonne <= 0 || feuille.getLastRow() < 2) return 0;
  var valeurs = feuille.getRange(2, colonne, feuille.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < valeurs.length; i++) {
    if (String(valeurs[i][0]) === idEnvoi) return i + 2;
  }
  return 0;
}

function feuilleReponses() {
  var classeur = SpreadsheetApp.getActiveSpreadsheet();
  return classeur.getSheetByName(NOM_FEUILLE) || classeur.insertSheet(NOM_FEUILLE);
}

function horodatage(iso) {
  var date = iso ? new Date(iso) : new Date();
  if (isNaN(date.getTime())) date = new Date();
  var fuseau = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  return Utilities.formatDate(date, fuseau, 'dd/MM/yyyy HH:mm:ss');
}

function reponseJson(objet) {
  return ContentService
    .createTextOutput(JSON.stringify(objet))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * À exécuter une fois depuis l'éditeur (bouton Exécuter) pour vérifier que
 * l'écriture fonctionne : une ligne de test apparaît dans la feuille.
 */
function testerEnregistrement() {
  var resultat = enregistrer({
    _horodatage: new Date().toISOString(),
    _id: 'test-' + Date.now(),
    _ordre: 'prenom,nom,email,domaines,rgpd',
    _libelles: JSON.stringify({
      prenom: 'Prénom', nom: 'Nom', email: 'Email professionnel',
      domaines: 'Domaines d’intérêt', rgpd: 'Consentement RGPD'
    }),
    prenom: 'Test', nom: 'HYC', email: 'test@hackyourcare.com',
    domaines: 'Cardiologie | Chirurgie', rgpd: 'Oui'
  });
  console.log('Ligne écrite : ' + resultat.ligne);
}
