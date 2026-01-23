exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { level = 1, language = "spanish", history = [] } = JSON.parse(event.body);

    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    if (!ANTHROPIC_API_KEY) {
      return { statusCode: 500, body: "Anthropic API key missing" };
    }

    /* ======================================================
       PROMPTS COMPRESSÉS — LOGIQUE IDENTIQUE AUX TIENS
       ====================================================== */

    const spanishPrompts = {
  1: `
Tu es Carlos, professeur d'espagnol pour débutants absolus.

RÈGLES STRICTES (OBLIGATOIRES):
- Réponds UNIQUEMENT en espagnol
- 1 ou 2 phrases très simples (5–8 mots max)
- Temps présent seulement
- Pose une question simple

TRÈS IMPORTANT - FORMAT OBLIGATOIRE POUR CHAQUE RÉPONSE:
Tu DOIS toujours écrire ta réponse sur 2 lignes:
Ligne 1: Ta phrase en espagnol
Ligne 2: FR: suivi de la traduction française

Exemple de réponse correcte:
¡Hola! ¿Cómo estás?
FR: Salut ! Comment vas-tu ?

Autre exemple:
Me llamo Carlos. ¿Y tú?
FR: Je m'appelle Carlos. Et toi ?

NE JAMAIS oublier la ligne FR: avec la traduction française !
`,

      2: `
Tu es Carlos, professeur d'espagnol intermédiaire.

Règles:
- Espagnol uniquement
- Phrases moyennes
- Présent + passé/futur parfois
- Traduction FR une fois sur deux
`,
      3: `
Tu es Carlos, professeur d'espagnol avancé.

Règles:
- Espagnol uniquement
- Aucun français
- Vocabulaire riche
- Conversation naturelle
`
    };

    const englishPrompts = {
  1: `
You are Sarah, an English teacher for absolute beginners.

STRICT RULES:
- Respond ONLY in English
- 1 or 2 very short sentences (5–8 words)
- Present tense only
- AFTER the English sentence, ALWAYS add:
FR: French translation
- Ask a simple question

MANDATORY FORMAT:
[English sentence]
FR: [French translation]
`,

      2: `
You are Sarah, an intermediate English teacher.

Rules:
- English only
- Medium-length sentences
- Past/future sometimes
- French translation only half the time
`,
      3: `
You are Sarah, an advanced English teacher.

Rules:
- English only
- No French
- Natural conversation
`
    };

    const systemPrompt =
      language === "spanish"
        ? spanishPrompts[level] || spanishPrompts[1]
        : englishPrompts[level] || englishPrompts[1];

    /* ======================================================
       HISTORIQUE LIMITÉ = MOINS CHER
       ====================================================== */
    const shortHistory = history.slice(-4);

    /* ======================================================
       APPEL CLAUDE (ANTHROPIC)
       ====================================================== */
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 250,
        system: systemPrompt,
        messages: shortHistory
      })
    });

    const data = await response.json();

    if (!data.content || !data.content[0]?.text) {
      throw new Error("Invalid response from Claude");
    }

    /* ======================================================
       PARSING (ESPAGNOL / ANGLAIS + FR)
       ====================================================== */
    const raw = data.content[0].text.trim().split("\n");

    let target = "";
    let french = "";

    for (const line of raw) {
      if (line.startsWith("FR:")) {
        french = line.replace("FR:", "").trim();
      } else {
        target += (target ? " " : "") + line.trim();
      }
    }

    const key = language === "spanish" ? "spanish" : "english";

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        [key]: target,
        french
      })
    };

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
