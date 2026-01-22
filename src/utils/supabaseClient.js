/**
 * Supabase Client - Updated for Actual Database Schema
 * Works with Apollo Hospitals and Tech Mahindra tables
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not found. Database features will be limited.');
}

export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

/**
 * Check if Supabase is initialized
 */
export const isSupabaseInitialized = () => {
    return supabase !== null;
};

/**
 * Supabase Database Operations for Actual Schema
 */
export const supabaseDB = {
    // ============================================
    // HOSPITAL OPERATIONS (Apollo Hospitals)
    // ============================================

    /**
     * Get all hospitals
     */
    async getHospitals() {
        if (!supabase) throw new Error('Supabase not initialized');

        const { data, error } = await supabase
            .from('hospitals')
            .select('*');

        if (error) throw error;
        return data;
    },

    /**
     * Get a single hospital
     */
    async getHospital(id) {
        if (!supabase) throw new Error('Supabase not initialized');

        const { data, error } = await supabase
            .from('hospitals')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Get all departments for a hospital
     */
    async getDepartments(hospitalId = null) {
        if (!supabase) throw new Error('Supabase not initialized');

        let query = supabase.from('departments').select('*');

        if (hospitalId) {
            query = query.eq('hospital_id', hospitalId);
        }

        const { data, error } = await query.order('name');

        if (error) throw error;
        return data;
    },

    /**
     * Get all doctors (optionally filtered by department)
     */
    async getDoctors(departmentId = null) {
        if (!supabase) throw new Error('Supabase not initialized');

        let query = supabase.from('doctors').select(`
      *,
      department:departments(name, hospital_id)
    `);

        if (departmentId) {
            query = query.eq('department_id', departmentId);
        }

        const { data, error } = await query.order('full_name');

        if (error) throw error;
        return data;
    },

    /**
     * Search doctors by specialization
     */
    async searchDoctorsBySpecialization(specialization) {
        if (!supabase) throw new Error('Supabase not initialized');

        const { data, error } = await supabase
            .from('doctors')
            .select(`
        *,
        department:departments(name)
      `)
            .ilike('specialization', `%${specialization}%`);

        if (error) throw error;
        return data;
    },

    /**
     * Get health packages
     */
    async getHealthPackages(hospitalId = null) {
        if (!supabase) throw new Error('Supabase not initialized');

        let query = supabase.from('health_packages').select('*');

        if (hospitalId) {
            query = query.eq('hospital_id', hospitalId);
        }

        const { data, error } = await query.order('price_inr');

        if (error) throw error;
        return data;
    },

    /**
     * Get patient feedback
     */
    async getPatientFeedback(hospitalId = null, limit = 10) {
        if (!supabase) throw new Error('Supabase not initialized');

        let query = supabase
            .from('patient_feedback')
            .select('*')
            .order('visit_date', { ascending: false })
            .limit(limit);

        if (hospitalId) {
            query = query.eq('hospital_id', hospitalId);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data;
    },

    /**
     * Get room types
     */
    async getRoomTypes(hospitalId = null) {
        if (!supabase) throw new Error('Supabase not initialized');

        let query = supabase.from('room_types').select('*');

        if (hospitalId) {
            query = query.eq('hospital_id', hospitalId);
        }

        const { data, error } = await query.order('price_per_day_inr');

        if (error) throw error;
        return data;
    },

    // ============================================
    // COMPANY OPERATIONS (Tech Mahindra)
    // ============================================

    /**
     * Get all companies
     */
    async getCompanies() {
        if (!supabase) throw new Error('Supabase not initialized');

        const { data, error } = await supabase
            .from('companies')
            .select('*');

        if (error) throw error;
        return data;
    },

    /**
     * Get a single company
     */
    async getCompany(id) {
        if (!supabase) throw new Error('Supabase not initialized');

        const { data, error } = await supabase
            .from('companies')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Get business units
     */
    async getBusinessUnits(companyId = null) {
        if (!supabase) throw new Error('Supabase not initialized');

        let query = supabase.from('business_units').select('*');

        if (companyId) {
            query = query.eq('company_id', companyId);
        }

        const { data, error } = await query.order('name');

        if (error) throw error;
        return data;
    },

    /**
     * Get job openings (with filters)
     */
    async getJobOpenings(filters = {}) {
        if (!supabase) throw new Error('Supabase not initialized');

        let query = supabase.from('job_openings').select(`
      *,
      company:companies(name)
    `);

        if (filters.companyId) {
            query = query.eq('company_id', filters.companyId);
        }

        if (filters.location) {
            query = query.ilike('location', `%${filters.location}%`);
        }

        if (filters.department) {
            query = query.ilike('department', `%${filters.department}%`);
        }

        if (filters.title) {
            query = query.ilike('title', `%${filters.title}%`);
        }

        if (filters.minExperience !== undefined) {
            query = query.gte('experience_years_min', filters.minExperience);
        }

        if (filters.workMode) {
            query = query.eq('work_mode', filters.workMode);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    /**
     * Search jobs by skills
     */
    async searchJobsBySkills(skills) {
        if (!supabase) throw new Error('Supabase not initialized');

        const { data, error } = await supabase
            .from('job_openings')
            .select('*')
            .contains('required_skills', skills);

        if (error) throw error;
        return data;
    },

    /**
     * Get office locations
     */
    async getOfficeLocations(companyId = null) {
        if (!supabase) throw new Error('Supabase not initialized');

        let query = supabase.from('office_locations').select('*');

        if (companyId) {
            query = query.eq('company_id', companyId);
        }

        const { data, error } = await query.order('city');

        if (error) throw error;
        return data;
    },

    /**
     * Get leadership team
     */
    async getLeadershipTeam(companyId = null) {
        if (!supabase) throw new Error('Supabase not initialized');

        let query = supabase.from('leadership_team').select('*');

        if (companyId) {
            query = query.eq('company_id', companyId);
        }

        const { data, error } = await query.order('name');

        if (error) throw error;
        return data;
    },

    // ============================================
    // UNIFIED QUERY FOR AI AGENT
    // ============================================

    /**
     * Get complete entity data (hospital or company)
     */
    async getEntityData(entityId, entityType = 'auto') {
        if (!supabase) throw new Error('Supabase not initialized');

        try {
            // Try to detect entity type if not specified
            if (entityType === 'auto') {
                // Try hospital first
                const { data: hospital } = await supabase
                    .from('hospitals')
                    .select('*')
                    .eq('id', entityId)
                    .single();

                if (hospital) {
                    entityType = 'hospital';
                } else {
                    // Try company
                    const { data: company } = await supabase
                        .from('companies')
                        .select('*')
                        .eq('id', entityId)
                        .single();

                    if (company) {
                        entityType = 'company';
                    }
                }
            }

            if (entityType === 'hospital') {
                const [hospital, departments, doctors, packages, feedback, rooms] = await Promise.all([
                    this.getHospital(entityId),
                    this.getDepartments(entityId),
                    this.getDoctors(),
                    this.getHealthPackages(entityId),
                    this.getPatientFeedback(entityId, 5),
                    this.getRoomTypes(entityId)
                ]);

                return {
                    type: 'hospital',
                    entity: hospital,
                    departments,
                    doctors: doctors.filter(d => d.department?.hospital_id === entityId),
                    healthPackages: packages,
                    feedback,
                    roomTypes: rooms
                };
            }

            if (entityType === 'company') {
                const [company, businessUnits, jobs, offices, leadership] = await Promise.all([
                    this.getCompany(entityId),
                    this.getBusinessUnits(entityId),
                    this.getJobOpenings({ companyId: entityId }),
                    this.getOfficeLocations(entityId),
                    this.getLeadershipTeam(entityId)
                ]);

                return {
                    type: 'company',
                    entity: company,
                    businessUnits,
                    jobOpenings: jobs,
                    officeLocations: offices,
                    leadershipTeam: leadership
                };
            }

            throw new Error('Entity not found');
        } catch (error) {
            console.error('Error getting entity data:', error);
            throw error;
        }
    },

    /**
     * Search across all entities
     */
    async searchAll(query) {
        if (!supabase) throw new Error('Supabase not initialized');

        const [hospitals, companies, doctors, jobs] = await Promise.all([
            supabase.from('hospitals').select('*').ilike('name', `%${query}%`),
            supabase.from('companies').select('*').ilike('name', `%${query}%`),
            supabase.from('doctors').select('*').or(`full_name.ilike.%${query}%,specialization.ilike.%${query}%`),
            supabase.from('job_openings').select('*').ilike('title', `%${query}%`)
        ]);

        return {
            hospitals: hospitals.data || [],
            companies: companies.data || [],
            doctors: doctors.data || [],
            jobs: jobs.data || []
        };
    }
};

export default supabaseDB;
