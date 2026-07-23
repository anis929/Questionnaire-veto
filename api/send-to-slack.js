export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Récupère l'URL webhook depuis les variables d'environnement Vercel
  const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

  if (!SLACK_WEBHOOK_URL) {
    return res.status(500).json({
      success: false,
      error: 'SLACK_WEBHOOK_URL non configurée. Ajoute la variable d\'environnement dans Vercel.'
    });
  }

  try {
    const { prenom, nom, email, telephone, ville, cp, statut, pratique, domaines, mobilite } = req.body;

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

    const slackResponse = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackMessage)
    });

    const slackText = await slackResponse.text();

    if (slackText === 'ok') {
      return res.status(200).json({ success: true, message: 'Envoyé à Slack' });
    } else {
      return res.status(400).json({ success: false, error: slackText });
    }
  } catch (error) {
    console.error('Erreur lors de l\'envoi à Slack:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
