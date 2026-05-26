import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { enforceRole } from '../middleware/roleGuard';
import { BusinessMemberRepository } from '../repositories/businessMemberRepository';
import { UserProfileRepository } from '../repositories/userProfileRepository';
import { AuthUtils } from '../utils/auth';

const router = Router();

// Ensure all endpoints in this router go through authentication middleware
router.use(authMiddleware);

// 1. GET ALL TEAM MEMBERS FOR ACTIVATED WORKSPACE
router.get('/', enforceRole('view'), async (req: Request, res: Response) => {
  try {
    const businessId = req.businessId;
    if (!businessId) {
      return res.status(400).json({ success: false, error: 'Konteks bisnis/workspace tidak terdeteksi.' });
    }

    const members = await BusinessMemberRepository.getMembersByBusinessId(businessId);
    return res.json({
      success: true,
      members
    });
  } catch (err: any) {
    console.error('Error listing team members:', err);
    return res.status(err.status || 500).json({ success: false, error: 'Gagal memuat tim anggota: ' + err.message });
  }
});

// 2. ADD / INVITE AN ASSOCIATE MEMBER BY EMAIL OR DIRECT ACCOUNT CREATION
router.post('/invite', enforceRole('manageUsers'), async (req: Request, res: Response) => {
  try {
    const businessId = req.businessId;
    const { email, fullName, role } = req.body;

    if (!email || !fullName || !role) {
      return res.status(400).json({ success: false, error: 'Harap isi seluruh kolom: Email, Nama Lengkap, dan Peran.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    if (!['owner', 'admin', 'staff', 'viewer'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Peran yang dipilih tidak valid.' });
    }

    // Check if target user profile already exists
    let user = await UserProfileRepository.findByEmail(cleanEmail);
    if (!user) {
      // Auto-provision guest user account for testing so invitation works out-of-the-box!
      const defaultPass = 'password123';
      const hash = await AuthUtils.hashPassword(defaultPass);
      user = await UserProfileRepository.create({
        email: cleanEmail,
        password_hash: hash,
        full_name: fullName,
        avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(fullName)}`,
        default_business_id: businessId
      });
    }

    // Check if they are already in this workspace
    const existingMembership = await BusinessMemberRepository.getMembership(businessId, user.id);
    if (existingMembership) {
      return res.status(400).json({ success: false, error: 'Pengguna tersebut sudah tergabung dalam workspace ini.' });
    }

    // Enroll as member
    const newMembership = await BusinessMemberRepository.addMember(businessId, user.id, role);

    return res.json({
      success: true,
      message: `Berhasil menambahkan ${fullName} ke tim sebagai ${role}.`,
      member: {
        id: newMembership.id,
        business_id: businessId,
        user_id: user.id,
        role: newMembership.role,
        user_email: user.email,
        user_name: user.full_name
      }
    });
  } catch (err: any) {
    console.error('Core Member invitation failure:', err);
    return res.status(err.status || 500).json({ success: false, error: 'Penyebab kegagalan mengundang anggota baru: ' + err.message });
  }
});

// 3. EDIT ROLE ASSIGNMENT OF A TEAM MEMBER
router.post('/role', enforceRole('manageUsers'), async (req: Request, res: Response) => {
  try {
    const businessId = req.businessId;
    const { userId, role } = req.body;

    if (!userId || !role) {
      return res.status(400).json({ success: false, error: 'ID Anggota dan Peran baru wajib disertakan.' });
    }

    if (!['owner', 'admin', 'staff', 'viewer'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Peran baru tidak valid.' });
    }

    // Verify membership exists
    const membership = await BusinessMemberRepository.getMembership(businessId, userId);
    if (!membership) {
      return res.status(404).json({ success: false, error: 'Keanggotaan tidak ditemukan di workspace ini.' });
    }

    // Owner role changes: prevent owner self-demotion accidentally without precaution
    const requester = req.user;
    if (userId === requester.id && membership.role === 'owner' && role !== 'owner') {
      // Find out if they are the last owner
      const allMembers = await BusinessMemberRepository.getMembersByBusinessId(businessId);
      const remainingOwners = allMembers.filter(m => m.role === 'owner' && m.user_id !== userId);
      if (remainingOwners.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Anda adalah satu-satunya Pemilik (Owner) dari workspace ini. Angkat anggota lain menjadi Owner terlebih dahulu sebelum menukar peran Anda.' 
        });
      }
    }

    await BusinessMemberRepository.updateMemberRole(businessId, userId, role);

    return res.json({
      success: true,
      message: 'Peran anggota berhasil diperbarui.'
    });
  } catch (err: any) {
    console.error('Error updating member role:', err);
    return res.status(err.status || 500).json({ success: false, error: 'Gagal mengubah peran anggota tim.' });
  }
});

// 4. EVIC / REMOVE TEAM MEMBER WORKSPACE MEMBERSHIP
router.delete('/member/:userId', enforceRole('manageUsers'), async (req: Request, res: Response) => {
  try {
    const businessId = req.businessId;
    const targetUserId = req.params.userId;
    const requester = req.user;

    if (targetUserId === requester.id) {
      return res.status(400).json({ success: false, error: 'Anda tidak dapat menghapus keanggotaan Anda sendiri di menu tim.' });
    }

    // Check membership
    const membership = await BusinessMemberRepository.getMembership(businessId, targetUserId);
    if (!membership) {
      return res.status(404).json({ success: false, error: 'Status keanggotaan pengguna tidak ditemukan.' });
    }

    if (membership.role === 'owner') {
      return res.status(400).json({ success: false, error: 'Anda tidak dapat mengeluarkan Pemilik (Owner) lain dari tempat kerja.' });
    }

    await BusinessMemberRepository.removeMember(businessId, targetUserId);

    return res.json({
      success: true,
      message: 'Pengguna berhasil dikeluarkan dari workspace.'
    });
  } catch (err: any) {
    console.error('Eviction error:', err);
    return res.status(err.status || 500).json({ success: false, error: 'Gagal mengeluarkan anggota dari tim.' });
  }
});

export default router;

