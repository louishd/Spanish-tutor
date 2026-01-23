const Busboy = require('busboy');

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: "OPENAI_API_KEY not set" }) };
  }

  try {
    const result = await parseMultipart(event);
    
    if (!result.fileBuffer || result.fileBuffer.length === 0) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: "No audio file received" }) 
      };
    }

    // Déterminer l'extension
    let ext = 'mp4';
    if (result.mimeType && result.mimeType.includes('webm')) ext = 'webm';
    if (result.mimeType && result.mimeType.includes('wav')) ext = 'wav';

    // Créer le FormData pour OpenAI
    const formData = new FormData();
    formData.append('file', new Blob([result.fileBuffer]), `audio.${ext}`);
    formData.append('model', 'whisper-1');
    if (result.language) {
      formData.append('language', result.language);
    }

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: formData,
    });

    const data = await response.json();

    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ text: data.text || "", error: data.error || null }),
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

function parseMultipart(event) {
  return new Promise((resolve, reject) => {
    const result = { fileBuffer: null, filename: null, language: null, mimeType: null };
    
    const busboy = Busboy({ 
      headers: { 'content-type': event.headers['content-type'] || event.headers['Content-Type'] } 
    });

    busboy.on('file', (fieldname, file, info) => {
      const chunks = [];
      result.filename = info.filename;
      result.mimeType = info.mimeType;
      file.on('data', chunk => chunks.push(chunk));
      file.on('end', () => { result.fileBuffer = Buffer.concat(chunks); });
    });

    busboy.on('field', (name, val) => {
      if (name === 'language') result.language = val;
    });

    busboy.on('finish', () => resolve(result));
    busboy.on('error', reject);

    const body = event.isBase64Encoded 
      ? Buffer.from(event.body, 'base64') 
      : Buffer.from(event.body);
    
    busboy.end(body);
  });
}
