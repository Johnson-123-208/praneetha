# Web Scraping Service Setup Guide

## 🎯 Purpose

This backend service bypasses CORS restrictions to scrape company websites and extract data automatically.

---

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
cd scraping-service
npm install
```

### Step 2: Start the Service

```bash
npm start
```

You should see:
```
🚀 Scraping service running on http://localhost:3001
📡 Ready to scrape websites!
```

### Step 3: Test the Service

Open a new terminal and test:

```bash
curl -X POST http://localhost:3001/api/scrape \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"https://www.techmahindra.com\"}"
```

---

## 📋 How It Works

1. **Frontend** (your React app) sends a URL to the backend
2. **Backend** (Node.js service) fetches the website
3. **Backend** extracts company data (name, industry, contact, etc.)
4. **Backend** sends data back to frontend
5. **Frontend** auto-fills the form

---

## 🔧 Usage in Your App

### Automatic (Already Configured)

1. Start the scraping service: `cd scraping-service && npm start`
2. Start your main app: `npm run dev` (in the root directory)
3. Click "Sign Up" in your app
4. Enter a website URL (e.g., `https://www.techmahindra.com`)
5. Click "Auto-fill"
6. Data will be automatically extracted and filled!

---

## 📊 What Data Gets Extracted

The service extracts:

- ✅ **Company Name** - from meta tags, h1, or title
- ✅ **Description** - from meta description
- ✅ **Industry** - auto-detected from content
- ✅ **Email** - from mailto links or text
- ✅ **Phone** - from contact sections
- ✅ **Address** - from address sections
- ✅ **Services** - from service/product listings
- ✅ **About** - from about sections
- ✅ **Social Media** - Facebook, Twitter, LinkedIn, etc.

---

## 🛠️ Running Both Services

You need to run **TWO terminals**:

### Terminal 1: Scraping Service
```bash
cd scraping-service
npm start
```

### Terminal 2: Main App
```bash
npm run dev
```

---

## 🐛 Troubleshooting

### Issue 1: "Scraping service not running"

**Solution:**
```bash
cd scraping-service
npm install
npm start
```

### Issue 2: Port 3001 already in use

**Solution:** Change the port in `scraping-service/server.js`:
```javascript
const PORT = 3002; // Change to any available port
```

Then update the frontend URL in `src/utils/webscraper.js`:
```javascript
const SCRAPING_SERVICE_URL = 'http://localhost:3002/api/scrape';
```

### Issue 3: "Failed to fetch website"

**Possible causes:**
- Website blocks automated requests
- Website requires JavaScript to load content
- Website has anti-scraping measures

**Solution:** Try a different website or enter data manually.

### Issue 4: CORS errors

**Solution:** The backend service should handle CORS. If you still see errors, check that:
1. Backend is running on port 3001
2. Frontend is running on port 3000
3. CORS is enabled in `server.js`

---

## 📝 Example Websites to Test

### Works Well:
- ✅ https://www.techmahindra.com
- ✅ https://www.infosys.com
- ✅ https://www.tcs.com
- ✅ https://www.wipro.com

### May Have Issues:
- ❌ Websites with heavy JavaScript (React/Angular SPAs)
- ❌ Websites with anti-scraping protection
- ❌ Websites requiring authentication

---

## 🔒 Security Notes

- This service is for **development only**
- Do NOT expose it to the internet without proper security
- Add rate limiting for production use
- Respect robots.txt and website terms of service

---

## 📦 Dependencies

- **express** - Web server framework
- **cors** - Enable CORS
- **node-fetch** - Fetch API for Node.js
- **jsdom** - Parse HTML in Node.js

---

## 🚀 Production Deployment

For production, consider:

1. **Add authentication** to the API
2. **Implement rate limiting**
3. **Add caching** to avoid repeated scraping
4. **Use a headless browser** (Puppeteer) for JavaScript-heavy sites
5. **Deploy to a server** (not localhost)

---

## 📚 API Documentation

### POST /api/scrape

**Request:**
```json
{
  "url": "https://example.com"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "name": "Company Name",
    "description": "Company description",
    "industry": "Technology",
    "contact": {
      "email": "info@example.com",
      "phone": "+91-1234567890",
      "address": "123 Main St"
    },
    "services": ["Service 1", "Service 2"],
    "about": "About the company...",
    "socialMedia": {
      "linkedin": "https://linkedin.com/company/example"
    }
  },
  "source": "https://example.com",
  "scrapedAt": "2026-01-22T08:52:00.000Z"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Failed to fetch website: 404 Not Found"
}
```

### GET /health

**Response:**
```json
{
  "status": "ok",
  "message": "Scraping service is running"
}
```

---

## 🎯 Next Steps

1. ✅ Install dependencies: `cd scraping-service && npm install`
2. ✅ Start the service: `npm start`
3. ✅ Test with your app
4. ✅ Try scraping Tech Mahindra or other websites

---

**Happy scraping! 🚀**
