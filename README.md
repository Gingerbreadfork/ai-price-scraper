# 🛒 Price Extractor API (LLM-powered via Ollama)

A lightweight Node.js API that extracts pricing, sale status, and availability from any product page using web scraping and a local large language model (LLM) through [Ollama](https://ollama.com/). Ideal for price monitoring, product intelligence, or e-commerce automation.

---

## 🚀 Features

* 🔍 Scrapes and extracts readable text from product pages
* 🧠 Uses a local LLM via Ollama to analyze and extract structured product info
* 💰 Separates numeric price and currency symbol
* 🏷️ Detects whether the product is on sale
* 📦 Checks if the product is in stock
* 🔄 Exposes a simple `/get-price` POST API

---

## 🛠️ Requirements

* Node.js 18+
* [Ollama](https://ollama.com/) installed and running
* At least one LLM pulled locally (run `ollama pull [model-name]`)

---

## 📦 Installation

```bash
git clone https://github.com/Gingerbreadfork/ai-price-scraper.git
cd price-extractor-api
npm install
```

---

## ⚙️ Configuration

Specify the model you want to use by editing the following line in `price-scraper.js`:

```js
const MODEL_NAME = 'your-model-name'; // e.g., 'llama3', 'gemma:2b', etc.
```

Ensure the model is pulled and available in your Ollama environment.

---

## ▶️ Running the Server

```bash
node price-scraper.js
```

The API will be available at:

```
http://localhost:3000
```

---

## 📤 API Usage

### `POST /get-price`

Extracts product details from a given product page URL.

#### Request Body

```json
{
  "url": "https://example.com/product-page"
}
```

#### Example Response

```json
{
  "price": 49.99,
  "currency": "$",
  "on_sale": "yes",
  "in_stock": true,
  "duration": "1.67",
  "model": "your-model-name"
}
```

curl -X POST http://localhost:3000/get-price \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/product-page"}'

---

## 🧠 How It Works

1. Fetches and cleans the product page HTML.
2. Extracts readable text from the body.
3. Sends a structured prompt to your chosen LLM via Ollama.
4. Parses and returns clean JSON with the price, currency, sale status, and stock info.

---

## ❓ Troubleshooting

* Ensure your selected model is available and can be started with `ollama run`.
* If the response contains non-JSON data, the parser will automatically attempt to extract the JSON portion.
* Some product pages may be poorly structured; test multiple URLs to evaluate performance.
