/**
 * Backend Scraping Service - Enhanced with deep logging
 */

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

const app = express();
const PORT = 3001;

app.use(cors({
    origin: 'http://localhost:3000'
}));

app.use(express.json());

// Root route to check if service is alive
app.get('/', (req, res) => {
    res.send('<h1>🚀 Scraping Service is LIVE!</h1><p>Ready to assist your AI Calling Agent.</p>');
});

app.post('/api/scrape', async (req, res) => {
    const startTime = Date.now();
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: 'URL is required' });

        console.log(`\n[${new Date().toLocaleTimeString()}] 🔍 Starting scrape for: ${url}`);

        // Fetch with timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

        console.log('🌐 Fetching website content...');
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        }).finally(() => clearTimeout(timeout));

        if (!response.ok) {
            console.log(`❌ Fetch failed: ${response.status} ${response.statusText}`);
            return res.status(response.status).json({
                error: `Website returned ${response.status}: ${response.statusText}`
            });
        }

        console.log('✅ HTML received. Parsing DOM...');
        const html = await response.text();
        console.log(`   (Size: ${(html.length / 1024).toFixed(2)} KB)`);

        const dom = new JSDOM(html);
        const doc = dom.window.document;

        console.log('📊 Extracting structured data...');
        const data = {
            name: extractCompanyName(doc),
            description: extractMetaDescription(doc),
            industry: determineIndustry(html),
            contact: extractContactInfo(doc, html),
            services: extractServices(doc),
            about: extractAboutSection(doc),
            socialMedia: extractSocialMedia(doc),
        };

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✨ Scraping completed successfully in ${duration}s!`);
        console.log(`   Company: ${data.name}`);
        console.log(`   Industry: ${data.industry}`);

        res.json({
            success: true,
            data,
            source: url,
            scrapedAt: new Date().toISOString()
        });

    } catch (error) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        if (error.name === 'AbortError') {
            console.log(`⏱️ Scraping timed out after ${duration}s`);
            return res.status(504).json({ error: 'Website took too long to respond.' });
        }
        console.error(`💥 Fatal error after ${duration}s:`, error.message);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal scraping error'
        });
    }
});

function extractCompanyName(doc) {
    return (
        doc.querySelector('meta[property="og:site_name"]')?.content ||
        doc.querySelector('h1')?.textContent ||
        doc.title?.split('|')[0]?.split('-')[0]
    )?.trim() || 'Unknown Company';
}

function extractMetaDescription(doc) {
    return (
        doc.querySelector('meta[name="description"]')?.content ||
        doc.querySelector('meta[property="og:description"]')?.content ||
        ''
    );
}

function extractContactInfo(doc, html) {
    const contact = { email: '', phone: '', address: '' };

    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
    const emails = html.match(emailRegex);
    if (emails) contact.email = emails[0];

    const phoneRegex = /(\+91[-.\s]?)?(\d{10}|\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/g;
    const phones = html.match(phoneRegex);
    if (phones) contact.phone = phones[0];

    const addr = doc.querySelector('.address, .location, [itemprop="address"]')?.textContent;
    if (addr) contact.address = addr.trim();

    return contact;
}

function extractServices(doc) {
    const services = [];
    doc.querySelectorAll('.service, .services li, .offering, h3').forEach(el => {
        const text = el.textContent.trim();
        if (text.length > 5 && text.length < 50 && services.length < 15) {
            services.push(text);
        }
    });
    return [...new Set(services)];
}

function extractAboutSection(doc) {
    const selectors = [
        '#about', '.about', '.about-us', '.company-overview', '.overview', '[class*="about"]',
        'main', 'article', '.content', '#content'
    ];

    for (const selector of selectors) {
        const element = doc.querySelector(selector);
        if (element) {
            const text = element.textContent.trim();
            if (text.length > 50) {
                return text.substring(0, 1500); // Increased limit
            }
        }
    }

    // Fallback: Just take first 5 substantial paragraphs
    const paragraphs = Array.from(doc.querySelectorAll('p'))
        .map(p => p.textContent.trim())
        .filter(text => text.length > 50)
        .slice(0, 5)
        .join('\n\n');

    return paragraphs || '';
}

function extractSocialMedia(doc) {
    const social = {};
    doc.querySelectorAll('a[href*="facebook.com"], a[href*="linkedin.com"], a[href*="twitter.com"]').forEach(link => {
        if (link.href.includes('facebook')) social.facebook = link.href;
        if (link.href.includes('linkedin')) social.linkedin = link.href;
        if (link.href.includes('twitter')) social.twitter = link.href;
    });
    return social;
}

function determineIndustry(html) {
    const h = html.toLowerCase();
    if (h.includes('hospital') || h.includes('medical')) return 'Healthcare';
    if (h.includes('software') || h.includes('it services') || h.includes('digital')) return 'Technology';
    if (h.includes('bank') || h.includes('finance')) return 'Finance';
    return 'Technology'; // Default for Infosys etc
}

app.listen(PORT, () => {
    console.log(`🚀 Scraping service running on http://localhost:${PORT}`);
});
