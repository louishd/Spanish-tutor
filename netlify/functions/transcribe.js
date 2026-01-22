const Busboy = require('busboy');

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: "OPENAI_API_KEY not set" }) };
    }

    const { fileBuffer, filename, language } = await parseMultipart(event);

    const formData = new FormData();
    formData.append('file', new Blob([fileBuffer]), filename || 'audio.webm');
    formData.append('model', 'whisper-1');
    if (language) {
      formData.append('language', language);
    }

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    const data = await response.json();

    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ text: data.text || "" }),
    };

  } catch (error) {
    console.error("Transcription error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

function parseMultipart(event) {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ 
      headers: { 'content-type': event.headers['content-type'] } 
    });

    let fileBuffer = null;
    let filename = null;
    let language = null;

    busboy.on('file', (fieldname, file, info) => {
      const chunks = [];
      filename = info.filename;
      file.on('data', (chunk) => chunks.push(chunk));
      file.on('end', () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    busboy.on('field', (fieldname, val) => {
      if (fieldname === 'language') language = val;
    });

    busboy.on('finish', () => {
      resolve({ fileBuffer, filename, language });
    });

    busboy.on('error', reject);

    const body = event.isBase64Encoded 
      ? Buffer.from(event.body, 'base64') 
      : Buffer.from(event.body);
    
    busboy.end(body);
  });
}

