const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

// 🔧 Ollama model configuration
const MODEL_NAME = 'gemma3:1b'; // Change to 'llama3', 'gemma:2b', etc.

app.use(express.json());

/**
 * Extracts visible text from the given product page URL.
 */
async function extractPageText(url) {
  console.log(`🔍 Fetching page from URL: ${url}`);
  const res = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Node.js script)',
    },
  });

  console.log('📄 Page fetched. Parsing HTML...');
  const $ = cheerio.load(res.data);
  $('script, style, noscript').remove();

  const text = $('body').text().replace(/\s+/g, ' ').trim();
  console.log(`📦 Extracted text length: ${text.length} characters`);

  return text;
}

/**
 * Sends a prompt to Ollama to extract price, sale status, and availability.
 */
async function askOllamaForPrice(text) {
  console.log(`🧠 Sending prompt to Ollama model: ${MODEL_NAME}...`);

  const prompt = `
You will receive the content of a product page. Please extract:

1. The product price (with currency symbol).
2. Whether the product is on sale or discounted (yes/no).
3. Whether the product is in stock (true/false).

Respond ONLY with this JSON format:
{
  "price": NUMBER_ONLY,
  "currency": "CURRENCY_SYMBOL",
  "on_sale": "yes" or "no",
  "in_stock": true or false
}


---
${text.slice(0, 4000)}
---
`;

  return new Promise((resolve, reject) => {
    const child = exec(`ollama run ${MODEL_NAME}`);

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        console.error('❌ Ollama process exited with code:', code);
        console.error(stderr);
        return reject(new Error('Ollama process failed.'));
      }

      try {
        const match = stdout.match(/{[\s\S]*}/);
        if (!match) {
          throw new Error('No JSON object found in Ollama response.');
        }

        const parsed = JSON.parse(match[0]);

        // Ensure price is a number and currency is a symbol
        parsed.price = parseFloat(parsed.price);
        if (isNaN(parsed.price)) {
          throw new Error('Parsed price is not a valid number.');
        }

        parsed.currency = parsed.currency?.trim() || '';
        parsed.in_stock = Boolean(parsed.in_stock);

        parsed.in_stock = Boolean(parsed.in_stock);


        // Optional: Normalize or validate
        parsed.in_stock = Boolean(parsed.in_stock);

        console.log('✅ Ollama responded with JSON.');
        resolve(parsed);
      } catch (e) {
        console.error('❌ Failed to parse Ollama response as JSON:', stdout);
        reject(new Error('Ollama did not return valid JSON.'));
      }
    });

    child.stdin.write(prompt);
    child.stdin.end();
  });
}

/**
 * POST /get-price
 * Accepts a product URL and returns price, sale status, and availability.
 */
app.post('/get-price', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'Missing product URL.' });
  }

  try {
    console.log(`🔗 New request for URL: ${url}`);
    const start = Date.now();

    const text = await extractPageText(url);
    const result = await askOllamaForPrice(text);
    const duration = ((Date.now() - start) / 1000).toFixed(2);

    res.json({
      ...result,
      duration,
      model: MODEL_NAME,
    });
  } catch (err) {
    console.error('❌ Error processing request:', err.message);
    res.status(500).json({ error: 'Failed to extract price or details.', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Price extractor API running at http://localhost:${PORT}`);
});
