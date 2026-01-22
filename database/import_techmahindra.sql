-- ============================================
-- DATA IMPORT SQL FOR TECH MAHINDRA
-- ============================================
-- This file contains SQL statements to import
-- TechMahindra.json data into Supabase
-- ============================================

-- Insert Tech Mahindra Company
INSERT INTO companies (
    name,
    industry,
    logo,
    context_summary,
    nlp_context,
    website_url,
    contact_email,
    contact_phone,
    contact_address
) VALUES (
    'Tech Mahindra Limited',
    'Technology',
    '💻',
    'Leading IT services company with 149,000+ employees globally. Services: Cloud Computing (AWS, Azure, GCP), AI & Machine Learning, Generative AI, Data Analytics, Cybersecurity, Digital Transformation, Application Development, DevOps, Blockchain, IoT, 5G, SAP, Oracle, Salesforce. Annual Revenue: ₹551,200 Cr (~$6.6B). Stock: NSE:TECHM, BSE:532755. Sectors: Telecom, BFSI, Healthcare, Manufacturing, Retail, Energy. Global presence in 90 countries with 100+ offices.',
    'Scale at Speed™ - Founded 1986, CEO: Mohit Joshi. Major divisions: Communications & Media, BFSI, Manufacturing, Next Gen Services (AI/GenAI), BPS, Enterprise Services, Network Services, Experience Design. Technologies: Java, Python, JavaScript, Spring Boot, React, Angular, AWS, Azure, GCP, TensorFlow, PyTorch, SAP S/4HANA, Salesforce. Benefits: Health insurance, PF, Gratuity, Performance bonuses (20-30%), ESOPs, WFH, 25-30 days PTO, Learning budget.',
    'https://www.techmahindra.com',
    'info@techmahindra.com',
    '+91-20-66273000',
    'Plot No. 1, Phase - III, Rajiv Gandhi Infotech Park, Hinjawadi, Pune, Maharashtra 411057, India'
)
RETURNING id;

-- Note: Replace {company_id} with the actual UUID returned from the above INSERT

-- Insert Office Locations
INSERT INTO office_locations (company_id, city, address, size_sqft, employee_count, departments, contact_number, landmark, is_headquarters) VALUES
('{company_id}', 'Pune (HQ)', 'Plot No. 1, Phase - III, Rajiv Gandhi Infotech Park, Hinjawadi, Pune, Maharashtra 411057', 500000, 25000, ARRAY['All major'], '+91-20-66273000', 'Rajiv Gandhi Infotech Park', true),
('{company_id}', 'Hyderabad', 'Infocity - Special Economic Zone, Tower - I, Plot No. 22 to 34, Hi-tech City, Madhapur, Hyderabad, Telangana 500081', 400000, 18000, ARRAY['BFSI', 'Communications', 'Next Gen'], '+91-40-44333000', 'Hi-Tech City', false);

-- Insert Leadership Team
INSERT INTO leadership_team (company_id, name, designation, department, years_with_company, previous_experience, education, email, office_location, appointment_availability) VALUES
('{company_id}', 'Mohit Joshi', 'CEO and Managing Director', 'Executive', 3, 'Senior roles in global tech firms', 'Engineering & MBA', 'mohit.joshi@techmahindra.com', 'Pune', 'Via executive assistant'),
('{company_id}', 'Atul Soneja', 'Chief Operating Officer', 'Operations', 10, 'Delivery leadership', 'B.Tech, MBA', 'atul.soneja@techmahindra.com', 'Pune', 'Limited availability'),
('{company_id}', 'Rohit Anand', 'Chief Financial Officer', 'Finance', 5, 'CFO in IT sector', 'CA, MBA', 'rohit.anand@techmahindra.com', 'Mumbai', 'Investor relations channel'),
('{company_id}', 'Richard Lobo', 'Chief People Officer', 'HR', 8, 'HR leadership', 'MBA HR', 'richard.lobo@techmahindra.com', 'Pune', 'HR portal');

-- Insert Job Vacancies
INSERT INTO vacancies (
    company_id, title, position, department, location, experience_years, job_type,
    required_skills, preferred_qualifications, description, salary_range_min, salary_range_max,
    salary_currency, number_of_openings, application_deadline, reporting_to, work_mode, status
) VALUES
('{company_id}', 'Senior Software Engineer - Java', 'Senior Software Engineer - Java', 'Enterprise Services', 'Hyderabad', 5, 'Full-time',
 ARRAY['Java', 'Spring Boot', 'Microservices', 'SQL', 'AWS'], 'B.Tech/M.Tech in CS',
 'Develop scalable enterprise applications using Java stack, integrate with cloud services.',
 1200000, 2200000, 'INR', 15, '2026-02-28', 'Technical Lead', 'Hybrid', 'open'),

('{company_id}', 'AI/ML Engineer', 'AI/ML Engineer', 'Next Gen Services', 'Pune', 4, 'Full-time',
 ARRAY['Python', 'TensorFlow', 'PyTorch', 'NLP', 'Cloud ML'], 'Experience in GenAI',
 'Build and deploy AI models for client use cases in banking and telecom.',
 1500000, 2800000, 'INR', 10, '2026-03-15', 'AI Practice Head', 'Hybrid', 'open'),

('{company_id}', 'DevOps Engineer', 'DevOps Engineer', 'Infrastructure', 'Hyderabad', 6, 'Full-time',
 ARRAY['Jenkins', 'Docker', 'Kubernetes', 'Terraform', 'AWS/Azure'], 'Certifications in DevOps',
 'Automate CI/CD pipelines and manage cloud infrastructure.',
 1400000, 2500000, 'INR', 8, '2026-02-20', 'DevOps Manager', 'Hybrid', 'open'),

('{company_id}', 'SAP Consultant - S/4HANA', 'SAP Consultant - S/4HANA', 'Enterprise Services', 'Bangalore', 7, 'Full-time',
 ARRAY['SAP ABAP', 'Fiori', 'S/4HANA Migration', 'Finance Module', 'Integration'], 'SAP Certified',
 'Lead S/4HANA implementations for manufacturing clients.',
 1800000, 3500000, 'INR', 5, '2026-03-10', 'SAP Delivery Head', 'On-site', 'open'),

('{company_id}', 'Full Stack Developer', 'Full Stack Developer', 'Enterprise Services', 'Pune', 3, 'Full-time',
 ARRAY['React', 'Node.js', 'JavaScript', 'MongoDB', 'REST APIs'], 'B.Tech in CS',
 'Develop modern web applications using MERN stack.',
 800000, 1200000, 'INR', 12, '2026-03-01', 'Technical Lead', 'Hybrid', 'open'),

('{company_id}', 'Data Scientist', 'Data Scientist', 'Next Gen Services', 'Hyderabad', 4, 'Full-time',
 ARRAY['Python', 'Machine Learning', 'Statistics', 'SQL', 'Tableau'], 'M.Tech/MS in Data Science',
 'Analyze large datasets and build predictive models.',
 1000000, 1500000, 'INR', 7, '2026-02-25', 'Data Science Manager', 'Hybrid', 'open'),

('{company_id}', 'Cybersecurity Analyst', 'Cybersecurity Analyst', 'Security', 'Pune', 5, 'Full-time',
 ARRAY['Network Security', 'Penetration Testing', 'SIEM', 'Firewall', 'Incident Response'], 'CEH/CISSP Certified',
 'Monitor and protect company infrastructure from security threats.',
 1200000, 2000000, 'INR', 5, '2026-03-05', 'Security Manager', 'On-site', 'open'),

('{company_id}', 'Cloud Architect', 'Cloud Architect', 'Infrastructure', 'Bangalore', 8, 'Full-time',
 ARRAY['AWS', 'Azure', 'GCP', 'Cloud Migration', 'Architecture Design'], 'AWS/Azure Certified',
 'Design and implement cloud solutions for enterprise clients.',
 2000000, 3500000, 'INR', 4, '2026-03-12', 'Cloud Practice Head', 'Hybrid', 'open'),

('{company_id}', 'Product Manager', 'Product Manager', 'Product', 'Hyderabad', 6, 'Full-time',
 ARRAY['Product Strategy', 'Agile', 'Stakeholder Management', 'Analytics', 'Roadmap Planning'], 'MBA preferred',
 'Lead product development and strategy for digital products.',
 1500000, 2500000, 'INR', 3, '2026-02-28', 'VP Product', 'Hybrid', 'open'),

('{company_id}', 'Salesforce Developer', 'Salesforce Developer', 'Enterprise Services', 'Pune', 4, 'Full-time',
 ARRAY['Salesforce', 'Apex', 'Lightning', 'Integration', 'Salesforce Admin'], 'Salesforce Certified',
 'Develop and customize Salesforce CRM solutions.',
 900000, 1600000, 'INR', 6, '2026-03-08', 'Salesforce Lead', 'Hybrid', 'open');

-- ============================================
-- INSTRUCTIONS TO IMPORT THIS DATA:
-- ============================================
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. First, run the schema.sql file to create all tables
-- 4. Then, run the company INSERT statement above
-- 5. Copy the returned UUID (company_id)
-- 6. Replace all {company_id} placeholders with the actual UUID
-- 7. Run the remaining INSERT statements
-- ============================================

-- Alternative: Use the Supabase client in your app
-- You can also use the bulkInsertCompanyData function
-- from supabaseClient.js to import the JSON file directly
