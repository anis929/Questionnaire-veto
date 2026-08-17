/**
 * Google Apps Script pour synchroniser les réponses du questionnaire HYC
 * vers un Google Sheet
 *
 * INSTALLATION:
 * 1. Va sur https://script.google.com
 * 2. Crée un nouveau projet
 * 3. Copie-colle TOUT ce code dans l'éditeur
 * 4. Sauvegarde le projet
 * 5. Clique sur "Déployer" → "Nouveau déploiement" → Type: "Application Web"
 * 6. Exécuter en tant que: "Moi"
 * 7. Accès: "Quiconque"
 * 8. Copie l'URL générée et mets-la dans le formulaire (FORM_ENDPOINT)
 *
 * ============================================================================
 */

// Configuration: ID du Google Sheet où écrire les données
const SHEET_ID = ''; // À remplir avec l'ID de ton Google Sheet

/**
 * Fonction de déploiement web - reçoit les données du formulaire
 */
function doPost(e) {
  try {
    console.log('📥 Requête reçue');

    // Récupère le body JSON
    const data = JSON.parse(e.postData.contents);
    console.log('📋 Données reçues:', data);

    // Écrit les données dans le Google Sheet
    appendToSheet(data);

    // Retourne une réponse de succès
    return ContentService.createTextOutput(
      JSON.stringify({ success: true, message: 'Données enregistrées avec succès' })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error('❌ Erreur:', error.toString());
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Écrit les données du formulaire dans le Google Sheet
 */
function appendToSheet(data) {
  if (!SHEET_ID) {
    throw new Error('SHEET_ID non configuré. Voir les instructions en haut du script.');
  }

  // Ouvre le Google Sheet
  const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();

  // Récupère l'entête (ou la crée si vide)
  let headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  // Si le sheet est vide, crée les entêtes depuis les clés des données
  if (headers.length === 0 || headers.every(h => h === '')) {
    headers = Object.keys(data);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  // Prépare la ligne de données
  const row = headers.map(header => {
    const value = data[header];
    // Gère les arrays (case à coches multiples)
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return value || '';
  });

  // Ajoute la ligne au sheet
  sheet.appendRow(row);

  console.log('✅ Donnée ajoutée au sheet. Ligne:', sheet.getLastRow());
}

/**
 * Fonction de test - appelle doPost avec des données de test
 * (Utile pour vérifier que ça marche avant de déployer)
 */
function testPost() {
  const testData = {
    nom: 'Dupont',
    prenom: 'Jean',
    email: 'jean@example.com',
    telephone: '0123456789',
    numOrdre: '12345',
    ville: 'Paris',
    codePostal: '75001',
    secteur: 'Petits animaux',
    specialite: ['Chirurgie', 'Dermatologie'],
    anneeInscription: '2020',
    _horodatage: new Date().toISOString()
  };

  // Simule un POST
  const mockRequest = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };

  const result = doPost(mockRequest);
  console.log('Résultat du test:', result.getContent());
}

/**
 * Fonction pour obtenir les informations du déploiement
 * Exécute-la pour voir l'URL de ton déploiement web
 */
function getDeploymentInfo() {
  const scriptId = ScriptApp.getScriptId();
  console.log('📋 ID du script:', scriptId);
  console.log('🔗 L\'URL de déploiement sera de la forme:');
  console.log('   https://script.google.com/macros/s/[DEPLOYMENT_ID]/usercopy');
  console.log('   ou');
  console.log('   https://script.google.com/macros/s/[DEPLOYMENT_ID]/exec');
}
