import { Router, Request, Response } from 'express';
import { AuthUtils } from '../utils/auth';
import { UserProfileRepository } from '../repositories/userProfileRepository';
import { BusinessProfileRepository } from '../repositories/businessProfileRepository';
import { BusinessMemberRepository } from '../repositories/businessMemberRepository';
import { simpleAuthMiddleware } from '../middleware/authMiddleware';

const router = Router();

// 1. REGISTER USER AND ONBOARD INITIAL WORKSPACE
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, businessName, businessType, location, currency } = req.body;

    if (!email || !password || !fullName || !businessName) {
      return res.status(400).json({ success: false, error: 'Informasi wajib diisi: Email, Password, Nama Lengkap, dan Nama Usaha.' });
    }

    // Check if duplicate email
    const existing = await UserProfileRepository.findByEmail(email);
    if (existing) {
      return res.status(400).json({ success: false, error: 'Email sudah terdaftar. Silakan login atau gunakan email lain.' });
    }

    // Hash password
    const passwordHash = await AuthUtils.hashPassword(password);

    // Create Initial Business Profile
    const initialBiz = await BusinessProfileRepository.createProfile({
      business_name: businessName,
      business_type: businessType || 'General Store',
      owner_name: fullName,
      location: location || 'Indonesia',
      currency: currency || 'IDR',
      email: email,
      description: `Profil bisnis untuk ${businessName} - dikelola di BizPilot AI.`
    });

    // Create User Profile linked to the default workspace
    const user = await UserProfileRepository.create({
      email,
      password_hash: passwordHash,
      full_name: fullName,
      avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(fullName)}`,
      default_business_id: initialBiz.id
    });

    // Attach workspace owner seat
    await BusinessMemberRepository.addMember(initialBiz.id, user.id, 'owner');

    // Create a JWT token for immediate access
    const token = AuthUtils.generateToken(user.id);

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        avatarUrl: user.avatar_url,
        defaultBusinessId: user.default_business_id
      },
      currentWorkspace: initialBiz,
      workspaces: [initialBiz]
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(err.status || 500).json({ success: false, error: 'Gagal melakukan pendaftaran: ' + err.message });
  }
});

// 2. LOGIN USER AND RETURN WORKSPACES
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Harap isi email dan password.' });
    }

    const user = await UserProfileRepository.findByEmail(email);
    if (!user) {
      return res.status(400).json({ success: false, error: 'Email atau password tidak cocok.' });
    }

    const isValid = await AuthUtils.comparePassword(password, user.password_hash);
    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Email atau password tidak cocok.' });
    }

    // Load available workspaces
    const memberships = await BusinessMemberRepository.getMembershipsByUserId(user.id);
    const workspaces: any[] = [];

    const allProfiles = await BusinessProfileRepository.getProfilesByIds(memberships.map((membership) => membership.business_id));
    for (const membership of memberships) {
      const match = allProfiles.find(p => p.id === membership.business_id);
      if (match) {
        workspaces.push({
          ...match,
          role: membership.role
        });
      }
    }

    let defaultBiz = workspaces.find(w => w.id === user.default_business_id);
    if (!defaultBiz && workspaces.length > 0) {
      defaultBiz = workspaces[0];
    }

    const token = AuthUtils.generateToken(user.id);

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        avatarUrl: user.avatar_url,
        defaultBusinessId: user.default_business_id || (defaultBiz?.id || null)
      },
      currentWorkspace: defaultBiz || null,
      workspaces
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(err.status || 500).json({ success: false, error: 'Gagal melakukan login: ' + err.message });
  }
});

// 3. RETRIEVE CURRENT LOGGED-IN SESSION DETAILS
router.get('/me', simpleAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const requester = (req as any).user;
    const user = await UserProfileRepository.findById(requester.id);
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'Sesi kedaluwarsa. Silakan login kembali.' });
    }

    const memberships = await BusinessMemberRepository.getMembershipsByUserId(user.id);
    const workspaces: any[] = [];

    const allProfiles = await BusinessProfileRepository.getProfilesByIds(memberships.map((membership) => membership.business_id));
    for (const membership of memberships) {
      const match = allProfiles.find(p => p.id === membership.business_id);
      if (match) {
        workspaces.push({
          ...match,
          role: membership.role
        });
      }
    }

    // Handle corner case where user has workspaces but no default_business_id
    let defaultBiz = workspaces.find(w => w.id === user.default_business_id);
    if (!defaultBiz && workspaces.length > 0) {
      defaultBiz = workspaces[0];
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        avatarUrl: user.avatar_url,
        defaultBusinessId: user.default_business_id || (defaultBiz?.id || null)
      },
      currentWorkspace: defaultBiz || null,
      workspaces
    });
  } catch (err: any) {
    console.error('Session retrieval failure:', err);
    return res.status(err.status || 500).json({ success: false, error: err.message || 'Identifikasi sesi gagal.' });
  }
});

// 4. CREATE A NEW WORKSPACE/BUSINESS WITHIN ONBOARDING OR DASHBOARD
router.post('/workspace', simpleAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const requester = (req as any).user;
    const { businessName, businessType, location, currency } = req.body;

    if (!businessName) {
      return res.status(400).json({ success: false, error: 'Nama Bisnis/Usaha wajib diisi.' });
    }

    // Create Business
    const newBiz = await BusinessProfileRepository.createProfile({
      business_name: businessName,
      business_type: businessType || 'General Retail',
      owner_name: requester.fullName,
      location: location || 'Indonesia',
      currency: currency || 'IDR',
      email: requester.email,
      description: `Profil bisnis untuk ${businessName} - dikelola di BizPilot AI.`
    });

    // Make requester the owner
    await BusinessMemberRepository.addMember(newBiz.id, requester.id, 'owner');

    // Update user default business setting
    await UserProfileRepository.update(requester.id, {
      default_business_id: newBiz.id
    });

    return res.json({
      success: true,
      workspace: newBiz
    });
  } catch (err: any) {
    console.error('Workspace creation failure:', err);
    return res.status(err.status || 500).json({ success: false, error: err.message || 'Gagal membuat workspace bisnis baru.' });
  }
});

// 5. UPDATE CURRENT WORKSPACE DEFAULT SWITCH OR PROFILE DETAILS
router.post('/profile', simpleAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const requester = (req as any).user;
    const { fullName, avatarUrl, defaultBusinessId } = req.body;

    const updates: any = {};
    if (fullName) updates.full_name = fullName;
    if (avatarUrl) updates.avatar_url = avatarUrl;
    if (defaultBusinessId) {
      const membership = await BusinessMemberRepository.getMembership(defaultBusinessId, requester.id);
      if (!membership) {
        return res.status(403).json({ success: false, error: 'Akses ditolak. Anda bukan anggota workspace tersebut.' });
      }
      updates.default_business_id = defaultBusinessId;
    }

    const updated = await UserProfileRepository.update(requester.id, updates);

    return res.json({
      success: true,
      user: {
        id: updated?.id,
        email: updated?.email,
        fullName: updated?.full_name,
        avatarUrl: updated?.avatar_url,
        defaultBusinessId: updated?.default_business_id
      }
    });
  } catch (err: any) {
    console.error('Profile update failure:', err);
    return res.status(err.status || 500).json({ success: false, error: err.message || 'Gagal memperbarui profil pengguna.' });
  }
});

export default router;
