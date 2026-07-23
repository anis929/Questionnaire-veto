export default async function handler(req, res) {
  console.log('🔧 API send-to-slack appelée');

  if (req.method !== 'POST') {
    console.log('❌ Méthode non POST:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Récupère l'URL webhook depuis les variables d'environnement Vercel
  const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

  console.log('📝 SLACK_WEBHOOK_URL configurée?', !!SLACK_WEBHOOK_URL);
  console.log('📝 SLACK_WEBHOOK_URL commence par:', SLACK_WEBHOOK_URL ? SLACK_WEBHOOK_URL.substring(0, 50) + '...' : 'NON');

  if (!SLACK_WEBHOOK_URL) {
    console.log('❌ SLACK_WEBHOOK_URL vide!');
    return res.status(500).json({
      success: false,
      error: 'SLACK_WEBHOOK_URL non configurée.'
    });
  }

  try {
    const { prenom, nom, email, telephone, ville, cp, statut, pratique, domaines, mobilite } = req.body;

    console.log('👤 Données reçues:', { prenom, nom, email });

    const praticeStr = Array.isArray(pratique) ? pratique.join(', ') : (pratique || '—');
    const domainesStr = Array.isArray(domaines) ? domaines.join(', ') : (domaines || '—');

    const slackMessage = {
      text: `📋 *Nouveau profil d'expertise vétérinaire reçu*\n\n` +
            `👤 *${prenom} ${nom}*\n` +
            `📧 ${email}\n` +
            `📱 ${telephone || 'N/A'}\n` +
            `📍 ${ville || '—'} (${cp || '—'})\n` +
            `💼 Statut: ${statut || '—'}\n` +
            `🐾 Pratique: ${praticeStr}\n` +
            `🔬 Domaines: ${domainesStr}\n` +
            `🚗 Mobilité: ${mobilite || '—'}`
    };

    console.log('📤 Envoi à Slack...');

    const slackResponse = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackMessage)
    });

    console.log('📊 Réponse Slack:', slackResponse.status, slackResponse.statusText);

    const slackText = await slackResponse.text();

    console.log('📄 Corps de la réponse Slack:', slackText);

    if (slackText === 'ok') {
      console.log('✅ Succès! Message envoyé à Slack');
      return res.status(200).json({ success: true, message: 'Envoyé à Slack' });
    } else {
      console.log('⚠️ Réponse Slack inattendue:', slackText);
      return res.status(400).json({ success: false, error: slackText });
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi à Slack:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
