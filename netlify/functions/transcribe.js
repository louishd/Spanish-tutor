export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "OPENAI_API_KEY not set" }),
      };
    }

    // Le body arrive encodé en base64
    const boundary = event.headers["content-type"];
    const buffer = Buffer.from(event.body, "base64");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": boundary,
      },
      body: buffer,
    });

    const data = await response.json();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: data.text || "",
      }),
    };
  } catch (error) {
    console.error("Transcription error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Transcription failed" }),
    };
  }
};
