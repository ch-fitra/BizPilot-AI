import { Router } from 'express';
import { BusinessProfileRepository, BusinessProfile } from '../repositories/businessProfileRepository';
import { isSupabaseConfigured, isSchemaMissing, setSchemaMissing } from '../db/supabaseClient';

const router = Router();

// GET active business profile
router.get('/', async (req, res) => {
  try {
    const profile = await BusinessProfileRepository.getActiveProfile();
    const resolvedMode = isSupabaseConfigured && !isSchemaMissing ? 'Supabase PostgreSQL' : 'Local JSON';

    res.json({
      success: true,
      storageMode: resolvedMode,
      isSupabaseConfigured,
      isSchemaMissing,
      data: profile
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve active business profile: ' + err.message
    });
  }
});

// POST to reset/re-check schema missing status
router.post('/recheck-schema', async (req, res) => {
  try {
    // Reset schema missing on server and attempt query
    setSchemaMissing(false);
    const profile = await BusinessProfileRepository.getActiveProfile();
    const resolvedMode = isSupabaseConfigured && !isSchemaMissing ? 'Supabase PostgreSQL' : 'Local JSON';

    res.json({
      success: true,
      storageMode: resolvedMode,
      isSupabaseConfigured,
      isSchemaMissing,
      data: profile
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      isSchemaMissing: true,
      error: 'Failed to complete schema recheck: ' + err.message
    });
  }
});

// GET all business profiles (useful for listing/switching profiles)
router.get('/all', async (req, res) => {
  try {
    const list = await BusinessProfileRepository.getAllProfiles();
    res.json({ success: true, count: list.length, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve business profiles: ' + err.message });
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
    res.status(201).json({ success: true, message: 'Business Profile successfully created!', data: newProfile });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to provision brand-new business profile: ' + err.message });
  }
});

// PUT (update) an existing business profile
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
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
    res.status(500).json({ success: false, error: 'Failed to perform operations updating business profile: ' + err.message });
  }
});

// DELETE a business profile
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await BusinessProfileRepository.deleteProfile(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Matching business profile not found to process deletion.' });
    }
    res.json({ success: true, message: 'Business Profile successfully deleted.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to delete business profile: ' + err.message });
  }
});

export default router;
