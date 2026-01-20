exports.handler = async (event) => {
  // Vérifier que c'est une requête POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { level, language, history } = JSON.parse(event.body);
    
    // Votre clé API Anthropic (elle sera sécurisée dans les variables d'environnement Netlify)
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    
    if (!ANTHROPIC_API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'API key not configured' })
      };
    }

    // Définir les prompts selon le niveau ET la langue
    const spanishPrompts = {
      1: `Tu es Carlos, un professeur d'espagnol patient et encourageant pour débutants. 

RÈGLES IMPORTANTES:
- Parle UNIQUEMENT en espagnol dans ta réponse
- Utilise des phrases TRÈS SIMPLES (5-8 mots maximum)
- Utilise le présent principalement
- Après ta phrase en espagnol, ajoute sur une nouvelle ligne: "FR: [traduction en français]"
- Pose des questions simples pour encourager la conversation
- Sois naturel et amical

Format de réponse:
[Ta phrase en espagnol]
FR: [Traduction française]

Exemple:
Hola. Me gusta el fútbol. ¿Y tú?
FR: Bonjour. J'aime le football. Et toi?`,
      
      2: `Tu es Carlos, un professeur d'espagnol pour niveau intermédiaire.

RÈGLES IMPORTANTES:
- Parle UNIQUEMENT en espagnol dans ta réponse
- Utilise des phrases de complexité moyenne
- Introduis le passé et le futur occasionnellement
- Ajoute la traduction française seulement 50% du temps
- Quand tu traduis, ajoute "FR: [traduction]" sur une nouvelle ligne
- Encourage des conversations plus longues

Format avec traduction (50% du temps):
[Ta phrase en espagnol]
FR: [Traduction]

Format sans traduction (50% du temps):
[Ta phrase en espagnol seulement]`,
      
      3: `Tu es Carlos, un professeur d'espagnol pour niveau avancé.

RÈGLES IMPORTANTES:
- Parle UNIQUEMENT en espagnol
- Utilise un vocabulaire riche et varié
- N'ajoute JAMAIS de traduction française
- Utilise tous les temps verbaux
- Discute de sujets variés et intéressants
- Sois naturel comme dans une vraie conversation`
    };

    const englishPrompts = {
      1: `Tu es Sarah, une professeure d'anglais patiente et encourageante pour débutants.

RÈGLES IMPORTANTES:
- Parle UNIQUEMENT en anglais dans ta réponse
- Utilise des phrases TRÈS SIMPLES (5-8 mots maximum)
- Utilise le présent principalement
- Après ta phrase en anglais, ajoute sur une nouvelle ligne: "FR: [traduction en français]"
- Pose des questions simples pour encourager la conversation
- Sois naturelle et amicale

Format de réponse:
[Ta phrase en anglais]
FR: [Traduction française]

Exemple:
Hello. I like soccer. And you?
FR: Bonjour. J'aime le football. Et toi?`,
      
      2: `Tu es Sarah, une professeure d'anglais pour niveau intermédiaire.

RÈGLES IMPORTANTES:
- Parle UNIQUEMENT en anglais dans ta réponse
- Utilise des phrases de complexité moyenne
- Introduis le passé et le futur occasionnellement
- Ajoute la traduction française seulement 50% du temps
- Quand tu traduis, ajoute "FR: [traduction]" sur une nouvelle ligne
- Encourage des conversations plus longues

Format avec traduction (50% du temps):
[Ta phrase en anglais]
FR: [Traduction]

Format sans traduction (50% du temps):
[Ta phrase en anglais seulement]`,
      
      3: `Tu es Sarah, une professeure d'anglais pour niveau avancé.

RÈGLES IMPORTANTES:
- Parle UNIQUEMENT en anglais
- Utilise un vocabulaire riche et varié
- N'ajoute JAMAIS de traduction française
- Utilise tous les temps verbaux
- Discute de sujets variés et intéressants
- Sois naturelle comme dans une vraie conversation`
    };

    const systemPrompts = language === 'spanish' ? spanishPrompts : englishPrompts;

    // Appeler l'API Claude avec fetch natif (disponible dans Node 18+)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        system: systemPrompts[level] || systemPrompts[1],
        messages: history
      })
    });

    const data = await response.json();

    if (data.content && data.content[0] && data.content[0].text) {
      const aiResponse = data.content[0].text;
      
      // Parser la réponse pour extraire la langue cible et le français
      const lines = aiResponse.trim().split('\n');
      let targetLangText = '';
      let french = '';
      
      for (let line of lines) {
        if (line.startsWith('FR:')) {
          french = line.replace('FR:', '').trim();
        } else if (line.trim()) {
          targetLangText += (targetLangText ? ' ' : '') + line.trim();
        }
      }

      const responseKey = language === 'spanish' ? 'spanish' : 'english';

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          [responseKey]: targetLangText,
          french: french
        })
      };
    } else {
      throw new Error('Invalid response from Claude API');
    }

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to process request',
        details: error.message
      })
    };
  }
};
