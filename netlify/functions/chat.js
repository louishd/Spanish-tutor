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

RÈGLES:
- 1 phrase simple en espagnol (5-8 mots max)
- Temps présent uniquement
- Pose une question simple

OBLIGATION ABSOLUE:
Chaque réponse DOIT avoir ce format EXACT:

[phrase espagnol]
FR: [traduction]

Exemple:
¡Hola! ¿Cómo te llamas?
FR: Salut ! Comment tu t'appelles ?

Si tu oublies "FR:" ta réponse est invalide.
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

RULES:
- 1 simple sentence in English (5-8 words max)
- Present tense only
- Ask a simple question

ABSOLUTE OBLIGATION:
Every response MUST have this EXACT format:

[English sentence]
FR: [French translation]

Example:
Hello! What is your name?
FR: Salut ! Comment tu t'appelles ?

Another example:
I like music. Do you like music?
FR: J'aime la musique. Tu aimes la musique ?

If you forget "FR:" your response is invalid.
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
