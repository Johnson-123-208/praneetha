/**
 * Web Scraping Utility for Company Data Extraction (Updated with Backend Service)
 * This utility uses a backend service to bypass CORS restrictions
 */

/**
 * Scrape company data from a website URL using backend service
 * @param {string} url - The website URL to scrape
 * @returns {Promise<Object>} - Extracted company data
 */
export const scrapeWebsiteData = async (url) => {
    try {
        // Validate URL
        if (!url || !isValidUrl(url)) {
            throw new Error('Invalid URL provided');
        }

        // Use backend scraping service to bypass CORS
        const SCRAPING_SERVICE_URL = import.meta.env.VITE_SCRAPER_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? '/api/scrape' : 'http://localhost:3001/api/scrape');

        console.log(`Sending scraping request to backend for: ${url}`);

        const response = await fetch(SCRAPING_SERVICE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Scraping service error: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to scrape website');
        }

        console.log('Scraping successful:', result);
        return result;

    } catch (error) {
        console.error('Error scraping website:', error);

        // Check if scraping service is running
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            return {
                success: false,
                error: '⚠️ Scraping service not running. Please start it with:\ncd scraping-service && npm install && npm start',
                source: url,
            };
        }

        return {
            success: false,
            error: error.message,
            source: url,
        };
    }
};

/**
 * Validate URL format
 */
const isValidUrl = (url) => {
    try {
        const urlObj = new URL(url);
        return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch (e) {
        return false;
    }
};

/**
 * Use AI to enhance scraped data
 * @param {Object} scrapedData - Raw scraped data
 * @param {Function} aiFunction - AI processing function (Groq)
 * @returns {Promise<Object>} - Enhanced data with AI insights
 */
export const enhanceDataWithAI = async (scrapedData, aiFunction) => {
    try {
        const prompt = `
Analyze the following scraped website data and provide a comprehensive, structured summary suitable for an AI calling agent system.

Scraped Data:
${JSON.stringify(scrapedData.data, null, 2)}

Please provide:
1. A clear, concise company overview (2-3 sentences)
2. Industry classification
3. Key services/products (list format)
4. Contact information (cleaned and formatted)
5. Any additional relevant context for customer service

Format the response as a JSON object with these fields:
{
  "name": "Company Name",
  "industry": "Industry Type",
  "contextSummary": "Detailed overview for AI agent",
  "services": ["service1", "service2", ...],
  "contact": {
    "email": "email@example.com",
    "phone": "+1234567890",
    "address": "Full address"
  },
  "additionalInfo": "Any other relevant information"
}
`;

        const aiResponse = await aiFunction(prompt, []);

        // Try to parse JSON from AI response
        try {
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.error('Failed to parse AI response as JSON');
        }

        return {
            ...scrapedData.data,
            aiEnhanced: true,
            aiSummary: aiResponse,
        };
    } catch (error) {
        console.error('Error enhancing data with AI:', error);
        return scrapedData.data;
    }
};

/**
 * Format scraped data for company onboarding
 * @param {Object} scrapedData - Scraped website data
 * @returns {Object} - Formatted data for company creation
 */
export const formatForCompanyOnboarding = (scrapedData) => {
    if (!scrapedData.success) {
        throw new Error(scrapedData.error || 'Failed to scrape website');
    }

    const { data } = scrapedData;

    // Build context summary
    const contextParts = [];

    if (data.name) {
        contextParts.push(`### ${data.name} Overview`);
    }

    if (data.description) {
        contextParts.push(`**Description:** ${data.description}`);
    }

    if (data.about) {
        contextParts.push(`**About the Company:**\n${data.about}`);
    }

    if (data.services && data.services.length > 0) {
        contextParts.push(`**Services Offered:**\n- ${data.services.join('\n- ')}`);
    }

    if (data.contact) {
        const contactParts = [];
        if (data.contact.email) contactParts.push(`- Email: ${data.contact.email}`);
        if (data.contact.phone) contactParts.push(`- Phone: ${data.contact.phone}`);
        if (data.contact.address) contactParts.push(`- Address: ${data.contact.address}`);
        if (contactParts.length > 0) {
            contextParts.push(`**Contact Information:**\n${contactParts.join('\n')}`);
        }
    }

    const contextSummary = contextParts.join('\n\n');

    return {
        name: data.name,
        industry: data.industry,
        contextSummary: contextSummary || 'No description available',
        nlpContext: contextSummary,
        contact: data.contact,
        services: data.services,
        socialMedia: data.socialMedia,
        websiteUrl: scrapedData.source,
        scrapedAt: scrapedData.scrapedAt,
    };
};
