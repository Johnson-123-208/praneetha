# Complete Guide: Company Data Integration

## Overview

This AI Calling Agent system now supports TWO powerful methods to populate company/hospital data:

1. **Manual Entry with AI-Generated Data** (using Groq prompts)
2. **Automatic Web Scraping** (from company website URLs)

---

## Method 1: AI-Generated Comprehensive Data

### How It Works:

1. Use the detailed prompts in `GROQ_PROMPTS.md`
2. Send the prompt to Groq AI (or any LLM)
3. Get comprehensive JSON data
4. Copy the relevant information into the company onboarding form

### Step-by-Step Process:

#### For a Hospital:

1. **Open `GROQ_PROMPTS.md`** and copy **Prompt 1** (Hospital prompt)
2. **Paste it into Groq AI** chat interface or API
3. **Receive comprehensive JSON** with:
   - Hospital overview
   - 15+ departments
   - 25+ doctors with specializations
   - 30+ services
   - Health packages
   - Appointment slots
   - Emergency contacts
   - Facilities
   - Insurance providers
   - Patient feedback samples
   - FAQs

4. **Extract key information**:
   ```json
   {
     "name": "Apollo Hospitals, Hyderabad",
     "industry": "Healthcare",
     "contextSummary": "Multi-specialty hospital with 500+ beds, 24/7 emergency services. Departments: Cardiology, Neurology, Orthopedics, Pediatrics, Gynecology, Oncology, Gastroenterology, Nephrology, Urology, ENT, Ophthalmology, Dermatology, Psychiatry, Radiology, Pathology. Services include: MRI, CT Scan, X-Ray, Ultrasound, ECG, Blood Bank, Pharmacy, Ambulance, ICU, NICU, Operation Theaters. 25+ experienced doctors available for consultation. Consultation fees: ₹500-₹1500. Available slots: 9 AM - 8 PM daily."
   }
   ```

5. **Paste into the onboarding form**:
   - Company Name: `Apollo Hospitals, Hyderabad`
   - Industry: `Healthcare`
   - Context Summary: (paste the comprehensive description)

#### For an IT Company:

1. **Open `GROQ_PROMPTS.md`** and copy **Prompt 2** (IT Company prompt)
2. **Paste it into Groq AI**
3. **Receive comprehensive JSON** with:
   - Company overview
   - 8+ business divisions
   - 25+ services offered
   - 30+ job openings with details
   - Technology stack
   - 15+ leadership team members
   - 10+ office locations
   - Client portfolio
   - Training programs
   - Employee benefits
   - Recruitment process
   - Company culture
   - Appointment booking slots
   - 20+ FAQs

4. **Extract key information**:
   ```json
   {
     "name": "Tech Mahindra Limited",
     "industry": "Technology",
     "contextSummary": "Leading IT services company with 150,000+ employees globally. Services: Cloud Computing (AWS, Azure, GCP), AI & Machine Learning, Data Analytics, Cybersecurity, Digital Transformation, Application Development, DevOps, Blockchain, IoT, 5G, SAP, Oracle, Salesforce. Current openings: 30+ positions including Senior Software Engineer (Java/Python, 5+ years, ₹12-18 LPA), Data Scientist (ML/AI, 3+ years, ₹10-15 LPA), DevOps Engineer (Kubernetes/Docker, 4+ years, ₹10-14 LPA), Full Stack Developer (React/Node.js, 3+ years, ₹8-12 LPA). Locations: Hyderabad, Bangalore, Pune, Mumbai, Chennai, Delhi. Benefits: Health insurance, PF, Gratuity, WFH, Flexible hours, Learning budget."
   }
   ```

5. **Paste into the onboarding form**

---

## Method 2: Automatic Web Scraping

### How It Works:

The system automatically extracts company information from any website URL using:
- HTML parsing
- Meta tag extraction
- Structured data (JSON-LD) extraction
- AI enhancement (optional, using Groq)

### What Gets Extracted:

1. **Company Name** - from meta tags, h1, or title
2. **Description** - from meta description
3. **Industry** - auto-detected from content keywords
4. **Contact Information**:
   - Email addresses
   - Phone numbers
   - Physical address
5. **Services/Products** - from service sections
6. **About Section** - company overview
7. **Social Media Links** - Facebook, Twitter, LinkedIn, etc.

### Step-by-Step Process:

1. **Click "Sign Up"** button in your app
2. **Enter the Website URL** in the "Website URL" field
   - Example: `https://www.apollohospitals.com`
   - Example: `https://www.techmahindra.com`
3. **Click "Auto-fill"** button
4. **Wait for scraping** (5-15 seconds)
5. **Review extracted data** - the form will auto-populate with:
   - Company name
   - Industry
   - Context summary
6. **Edit if needed** - you can modify any auto-filled data
7. **Click "Connect Database"** to save

### AI Enhancement (Optional):

If you have a Groq API key configured, the system will:
1. Scrape the website data
2. Send it to Groq AI for enhancement
3. Get a cleaner, more structured summary
4. Auto-fill the form with enhanced data

This provides better quality data than raw scraping alone.

---

## Comparison: Manual AI vs Web Scraping

| Feature | Manual AI-Generated | Web Scraping |
|---------|-------------------|--------------|
| **Data Depth** | ⭐⭐⭐⭐⭐ Extremely detailed | ⭐⭐⭐ Moderate |
| **Accuracy** | ⭐⭐⭐⭐ High (if prompt is good) | ⭐⭐⭐⭐ High (from official source) |
| **Speed** | ⭐⭐⭐ Manual copy-paste | ⭐⭐⭐⭐⭐ Instant (5-15 sec) |
| **Customization** | ⭐⭐⭐⭐⭐ Fully customizable | ⭐⭐ Limited to website content |
| **Best For** | New/fictional companies, detailed setups | Real existing companies |

---

## Best Practices:

### For Hospitals:

**Option A: AI-Generated (Recommended for demos)**
- Use Prompt 1 from `GROQ_PROMPTS.md`
- Customize hospital name, location, specializations
- Get 25+ doctors, 15+ departments, comprehensive data
- Perfect for demos and testing

**Option B: Web Scraping (Recommended for real hospitals)**
- Use actual hospital website URL
- Get real, up-to-date information
- Verify and enhance manually if needed

### For IT Companies:

**Option A: AI-Generated (Recommended for demos)**
- Use Prompt 2 from `GROQ_PROMPTS.md`
- Get 30+ job openings, complete tech stack
- Perfect for recruitment scenarios

**Option B: Web Scraping (Recommended for real companies)**
- Use company careers page or main website
- Get actual job openings and services
- Enhance with AI for better structure

---

## Example Workflows:

### Workflow 1: Demo Hospital Setup (AI-Generated)

```
1. Open Groq AI chat
2. Paste Hospital Prompt from GROQ_PROMPTS.md
3. Modify: "Generate for Apollo Hospitals, Mumbai"
4. Copy the generated context summary
5. Open your app → Sign Up
6. Fill in:
   - Name: Apollo Hospitals, Mumbai
   - Industry: Healthcare
   - Context: (paste AI-generated summary)
7. Connect Database
8. Deploy Agent and test!
```

### Workflow 2: Real Company Setup (Web Scraping)

```
1. Find company website (e.g., https://www.techmahindra.com)
2. Open your app → Sign Up
3. Paste URL in "Website URL" field
4. Click "Auto-fill"
5. Wait 10 seconds
6. Review auto-filled data
7. Edit/enhance if needed
8. Connect Database
9. Deploy Agent and test!
```

### Workflow 3: Hybrid Approach (Best of Both)

```
1. Use web scraping to get basic info
2. Use AI prompts to generate detailed supplementary data
3. Combine both in the context summary
4. Result: Real company data + comprehensive details
```

---

## Technical Details:

### Web Scraping Capabilities:

The scraper extracts data from:
- `<meta>` tags (description, og:title, etc.)
- `<h1>`, `<h2>` headings
- Structured data (JSON-LD)
- Contact sections
- Service/product listings
- About sections
- Social media links

### CORS Limitations:

**Important:** Due to browser CORS policies, direct website scraping from the frontend may be blocked for some websites.

**Solutions:**
1. Use a CORS proxy (for development)
2. Implement backend scraping (recommended for production)
3. Use websites that allow CORS
4. Fall back to manual entry if scraping fails

### AI Enhancement:

When Groq API is available, the system:
1. Sends scraped data to Groq
2. Asks for structured summary
3. Parses JSON response
4. Merges with scraped data
5. Provides cleaner, more usable context

---

## Troubleshooting:

### Web Scraping Issues:

**Problem:** "Failed to scrape website"
**Solutions:**
- Check if URL is valid and accessible
- Try adding `https://` prefix
- Check if website allows scraping (CORS)
- Use manual entry as fallback

**Problem:** "Incomplete data extracted"
**Solutions:**
- Website may have non-standard structure
- Manually enhance the extracted data
- Use AI-generated prompts instead

### AI Generation Issues:

**Problem:** "AI response is too generic"
**Solutions:**
- Make prompts more specific
- Add company-specific details to prompt
- Request more examples in the prompt

**Problem:** "Data format is wrong"
**Solutions:**
- Explicitly request JSON format
- Provide example structure in prompt
- Parse and reformat manually

---

## Next Steps:

1. **Try both methods** with sample companies
2. **Compare results** and choose your preferred method
3. **Customize prompts** for your specific use cases
4. **Build a library** of pre-generated company data
5. **Share feedback** on what works best!

---

## Files Reference:

- `GROQ_PROMPTS.md` - Detailed AI prompts for data generation
- `SAMPLE_DATA.md` - Example data structures and formats
- `src/utils/webscraper.js` - Web scraping implementation
- `src/components/CompanyOnboarding.jsx` - UI with both methods

---

**Happy onboarding! 🚀**
