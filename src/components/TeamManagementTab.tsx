import React, { useState, useEffect } from 'react';
import { AuthService, TeamMember } from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import { UserPlus, Shield, UserX, Loader2, Award, Briefcase, Mail, CheckCircle, RefreshCw, Info } from 'lucide-react';

export const TeamManagementTab: React.FC = () => {
  const { currentWorkspace } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'owner' | 'admin' | 'staff' | 'viewer'>('staff');

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'danger' } | null>(null);

  const currentUserRole = currentWorkspace?.role || 'owner';
  const isAuthorizedToManage = currentUserRole === 'owner' || currentUserRole === 'admin';

  const loadTeam = async () => {
    setLoading(true);
    try {
      const res = await AuthService.getTeamMembers();
      if (res.success && res.members) {
        setMembers(res.members);
      } else {
        showMsg(res.error || 'Gagal memuat tim.', 'danger');
      }
    } catch (err: any) {
      showMsg('Koneksi terputus.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, [currentWorkspace?.id]);

  const showMsg = (text: string, type: 'success' | 'danger') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName) return;

    setInviting(true);
    try {
      const res = await AuthService.inviteMember({
        email: inviteEmail,
        fullName: inviteName,
        role: inviteRole
      });

      if (res.success) {
        showMsg(res.message || 'Anggota berhasil diundang!', 'success');
        setInviteEmail('');
        setInviteName('');
        setInviteRole('staff');
        loadTeam();
      } else {
        showMsg(res.error || 'Undangan gagal.', 'danger');
      }
    } catch (err: any) {
      showMsg(err.message, 'danger');
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await AuthService.updateMemberRole(userId, newRole);
      if (res.success) {
        showMsg('Peran anggota berhasil diubah.', 'success');
        loadTeam();
      } else {
        showMsg(res.error || 'Gagal mengubah peran.', 'danger');
      }
    } catch (err: any) {
      showMsg(err.message, 'danger');
    }
  };

  const handleRemove = async (userId: string) => {
    if (!window.confirm('Apakah Anda yakin ingin mengeluarkan anggota ini dari workspace bisnis?')) return;
    try {
      const res = await AuthService.removeMember(userId);
      if (res.success) {
        showMsg('Anggota berhasil dikeluarkan dari tim.', 'success');
        loadTeam();
      } else {
        showMsg(res.error || 'Gagal mengeluarkan anggota.', 'danger');
      }
    } catch (err: any) {
      showMsg(err.message, 'danger');
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
            <Shield className="h-5 w-5 text-emerald-400" />
            <span>Manajemen Tim & Hak Akses</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Kelola kolaborator dan anggota tim untuk workspace <span className="text-emerald-400 font-semibold">{currentWorkspace?.business_name}</span>. Data operasional, history AI, chat, dan leads sepenuhnya terisolasi dan hanya dapat diakses oleh anggota terdaftar.
          </p>
        </div>

        <button
          onClick={loadTeam}
          className="self-start md:self-center flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors cursor-pointer"
        >
          <RefreshCw className="h-4.5 w-4.5" />
          <span>Muat Ulang</span>
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-xs border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MEMBERS LIST (Left/Center) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg shadow-slate-950/20">
            <div className="px-5 py-4 border-b border-slate-800/80 bg-slate-950/20 flex justify-between items-center">
              <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Daftar Anggota Aktif ({members.length})</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50">
                Akses Anda: {currentUserRole}
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-400 mx-auto mb-3" />
                <p className="text-xs tracking-wider">Memuat tim multi-tenant...</p>
              </div>
            ) : members.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Info className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs">Belum ada anggota tim terdaftar.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {members.map(m => {
                  const isMe = m.user_id === AuthService.getLocalActiveBusinessId(); // simplified check, placeholder
                  return (
                    <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-900/10 hover:bg-slate-850/10 transition-colors gap-3">
                      <div className="flex items-center space-x-3">
                        <img
                          src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(m.user_name || m.user_email)}`}
                          className="h-10 w-10 rounded-xl bg-slate-950 border border-slate-800 flex-shrink-0"
                          alt="Avatar"
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-sm text-slate-100 flex items-center space-x-1.5 truncate">
                            <span>{m.user_name || 'Anggota Tanpa Nama'}</span>
                            <span className="text-[10px] px-1.5 text-slate-400 uppercase tracking-widest bg-slate-850 rounded border border-slate-755 font-mono">
                              {m.role}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 text-ellipsis overflow-hidden">{m.user_email}</div>
                        </div>
                      </div>

                      {/* Action buttons (Only Owner/Admin can manipulate role / expulse member) */}
                      {isAuthorizedToManage && m.role !== 'owner' ? (
                        <div className="flex items-center space-x-2 self-end sm:self-center">
                          <select
                            value={m.role}
                            onChange={e => handleRoleChange(m.user_id, e.target.value)}
                            className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                          >
                            <option value="admin">Admin</option>
                            <option value="staff">Staff</option>
                            <option value="viewer">Viewer</option>
                          </select>

                          <button
                            onClick={() => handleRemove(m.user_id)}
                            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/10 hover:border-red-500/20 text-red-400 hover:text-red-300 transition-all cursor-pointer"
                            title="Keluarkan anggota"
                          >
                            <UserX className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs font-mono text-slate-600 self-end sm:self-center">
                          {m.role === 'owner' ? 'Hak Akses Utama (Owner)' : 'Baca Saja'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* INVITE FORM (Right) */}
        <div>
          {isAuthorizedToManage ? (
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg space-y-4">
              <div className="pb-3 border-b border-slate-800/80">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2 uppercase tracking-wide">
                  <UserPlus className="h-4.5 w-4.5 text-emerald-400" />
                  <span>Tambah Anggota Baru</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">Undang rekan kerja dengan email mereka.</p>
              </div>

              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={inviteName}
                    onChange={e => setInviteName(e.target.value)}
                    placeholder="Contoh: Rian Hidayat"
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Email Teammate</label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="rian@startupmu.com"
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Peran / Hak Akses</label>
                  <select
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                  >
                    <option value="admin">Admin - Kelola Data Operasional</option>
                    <option value="staff">Staff - Input & Edit Data</option>
                    <option value="viewer">Viewer - Read-Only Dashboard</option>
                  </select>
                </div>

                <div className="bg-slate-950/80 border border-slate-850/60 p-3 rounded-xl">
                  <span className="block text-[10px] text-slate-500 uppercase tracking-widest font-bold">INFO AKUN ONBOARDING:</span>
                  <p className="text-[10px] text-slate-400 leading-normal mt-1">
                    Jika email anggota belum terdaftar di BizPilot AI, akun demo baru akan otomatis dibuatkan dengan password bawaan: <span className="font-mono text-emerald-400 font-bold">password123</span>. Anggota dapat login menggunakan kredensial tersebut secara instant.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={inviting}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs transition-all shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {inviting ? (
                    <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                  ) : (
                    <>
                      <span>Tambah ke Tim Sekarang</span>
                      <UserPlus className="h-4 w-4 text-slate-950" />
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl shadow-lg space-y-3 text-center">
              <Shield className="h-8 w-8 text-slate-600 mx-auto" />
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hak Akses Terbatas</h3>
              <p className="text-[11px] text-slate-500 leading-normal">
                Hanya Pemilik (Owner) dan Administrator (Admin) yang dapat mengundang anggota tim baru atau mengedit izin peran. Hubungi manajer workspace Anda jika memerlukan eskalasi peran.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default TeamManagementTab;
