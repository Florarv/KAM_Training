// This is a Node.js function for Netlify.
// It proxies requests to the Gemini API using a secure environment variable.

// Import the fetch function (required in newer Node versions for fetch)
const fetch = require('node-fetch');

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Get the prompt from the frontend request
    const { prompt, isJson } = JSON.parse(event.body);
    
    // Get the secret API key from Netlify's environment variables
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'API key is not configured on the server.' }) };
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
    
    const payload = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    };

    if (isJson) {
      payload.generationConfig = {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            suggestions: {
              type: "ARRAY",
              items: { type: "STRING" }
            }
          }
        }
      };
    }

    // Call the Gemini API from the backend
    const geminiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      console.error('Gemini API Error:', errorData);
      return { statusCode: geminiResponse.status, body: JSON.stringify({ error: errorData.error.message }) };
    }

    const result = await geminiResponse.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

    // Send the AI's response back to the frontend
    return {
      statusCode: 200,
      body: JSON.stringify({ text }),
    };

  } catch (error) {
    console.error('Server Function Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'An error occurred in the server function.' }),
    };
  }
};
