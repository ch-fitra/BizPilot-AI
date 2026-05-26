import { Router } from 'express';
import { BusinessProfileRepository, BusinessProfile } from '../repositories/businessProfileRepository';
import { getDatabaseHealthSnapshot, verifyDatabaseHealth } from '../db/supabaseClient';
import { BusinessMemberRepository } from '../repositories/businessMemberRepository';
import { enforceRole } from '../middleware/roleGuard';
import fs from 'fs';
import path from 'path';

const router = Router();

// GET the compiled consolidated SQL schema for Supabase
router.get('/combined-schema', async (req, res) => {
  try {
    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
    const files = [
      '001_initial_bizpilot_schema.sql',
      '002_business_chat_messages.sql',
      '003_crm_leads.sql',
      '004_notifications_and_automation.sql',
      '005_forecasting_risk.sql',
      '006_auth_multi_tenant.sql',
      '007_cashflow_expenses.sql',
      '008_rls_multi_tenant_security.sql'
    ];

    let combinedSql = `-- BIZPILOT CONSOLIDATED SUPABASE SCHEMA DDL\n`;
    combinedSql += `-- Salin dan tempel kode ini langsung ke SQL Editor di Supabase, lalu klik RUN.\n\n`;

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      if (fs.existsSync(filePath)) {
        const fileContent = await fs.promises.readFile(filePath, 'utf-8');
        combinedSql += `\n-- ==========================================\n`;
        combinedSql += `-- MIGRATION: ${file}\n`;
        combinedSql += `-- ==========================================\n\n`;
        combinedSql += fileContent;
        combinedSql += `\n`;
      }
    }

    res.json({
      success: true,
      sql: combinedSql
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to consolidate SQL schemas: ' + err.message
    });
  }
});

// GET active business profile
router.get('/', async (req, res) => {
  try {
    const activeBusinessId = req.businessId;
    const profile = activeBusinessId
      ? await BusinessProfileRepository.getById(activeBusinessId)
      : await BusinessProfileRepository.getActiveProfile();
    const database = getDatabaseHealthSnapshot();

    res.json({
      success: true,
      storageMode: database.healthy ? 'Supabase PostgreSQL' : 'Unavailable',
      isSupabaseConfigured: database.configured,
      isSchemaMissing: database.schemaMissing,
      database,
      data: profile
    });
  } catch (err: any) {
    res.status(err.status || 500).json({
      success: false,
      error: 'Failed to retrieve active business profile: ' + err.message
    });
  }
});

// POST to reset/re-check schema missing status
router.post('/recheck-schema', async (req, res) => {
  try {
    const database = await verifyDatabaseHealth();
    const activeBusinessId = req.businessId;
    const profile = activeBusinessId
      ? await BusinessProfileRepository.getById(activeBusinessId)
      : await BusinessProfileRepository.getActiveProfile();

    res.json({
      success: true,
      storageMode: database.healthy ? 'Supabase PostgreSQL' : 'Unavailable',
      isSupabaseConfigured: database.configured,
      isSchemaMissing: database.schemaMissing,
      database,
      data: profile
    });
  } catch (err: any) {
    const database = getDatabaseHealthSnapshot();
    res.status(err.status || 500).json({
      success: false,
      storageMode: 'Unavailable',
      isSupabaseConfigured: database.configured,
      isSchemaMissing: database.schemaMissing,
      database,
      error: 'Failed to complete schema recheck: ' + err.message
    });
  }
});

// GET all business profiles (useful for listing/switching profiles)
router.get('/all', async (req, res) => {
  try {
    const user = req.user;
    const memberships = user?.id
      ? await BusinessMemberRepository.getMembershipsByUserId(user.id)
      : [];
    const list = await BusinessProfileRepository.getProfilesByIds(memberships.map((membership) => membership.business_id));
    res.json({ success: true, count: list.length, data: list });
  } catch (err: any) {
    res.status(err.status || 500).json({ success: false, error: 'Failed to retrieve business profiles: ' + err.message });
  }
});

// POST a new business profile
router.post('/', async (req, res) => {
  try {
    const { business_name, business_type, owner_name, location, currency, phone, email, description } = req.body;

    if (!business_name) {
      return res.status(400).json({ success: false, error: 'business_name represents a required field.' });
    }

    const payload: Omit<BusinessProfile, 'id' | 'created_at' | 'updated_at'> = {
      business_name,
      business_type,
      owner_name,
      location,
      currency: currency || 'IDR',
      phone,
      email,
      description
    };

    const newProfile = await BusinessProfileRepository.createProfile(payload);
    const user = req.user;
    if (user?.id) {
      await BusinessMemberRepository.addMember(newProfile.id, user.id, 'owner');
    }
    res.status(201).json({ success: true, message: 'Business Profile successfully created!', data: newProfile });
  } catch (err: any) {
    res.status(err.status || 500).json({ success: false, error: 'Failed to provision brand-new business profile: ' + err.message });
  }
});

// PUT (update) an existing business profile
router.put('/:id', enforceRole('edit'), async (req, res) => {
  try {
    const id = req.params.id;
    const activeBusinessId = req.businessId;
    if (activeBusinessId && id !== activeBusinessId) {
      return res.status(403).json({ success: false, error: 'Anda hanya dapat mengubah profil workspace aktif.' });
    }
    const { business_name, business_type, owner_name, location, currency, phone, email, description } = req.body;

    const updates: Partial<Omit<BusinessProfile, 'id' | 'created_at' | 'updated_at'>> = {};
    if (business_name !== undefined) updates.business_name = business_name;
    if (business_type !== undefined) updates.business_type = business_type;
    if (owner_name !== undefined) updates.owner_name = owner_name;
    if (location !== undefined) updates.location = location;
    if (currency !== undefined) updates.currency = currency;
    if (phone !== undefined) updates.phone = phone;
    if (email !== undefined) updates.email = email;
    if (description !== undefined) updates.description = description;

    const updated = await BusinessProfileRepository.updateProfile(id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Specific business profile not found to execute update.' });
    }

    res.json({ success: true, message: 'Business Profile updated successfully!', data: updated });
  } catch (err: any) {
    res.status(err.status || 500).json({ success: false, error: 'Failed to perform operations updating business profile: ' + err.message });
  }
});

// DELETE a business profile
router.delete('/:id', enforceRole('delete'), async (req, res) => {
  try {
    const id = req.params.id;
    const activeBusinessId = req.businessId;
    if (activeBusinessId && id !== activeBusinessId) {
      return res.status(403).json({ success: false, error: 'Anda hanya dapat menghapus profil workspace aktif.' });
    }
    const deleted = await BusinessProfileRepository.deleteProfile(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Matching business profile not found to process deletion.' });
    }
    res.json({ success: true, message: 'Business Profile successfully deleted.' });
  } catch (err: any) {
    res.status(err.status || 500).json({ success: false, error: 'Failed to delete business profile: ' + err.message });
  }
});

export default router;
