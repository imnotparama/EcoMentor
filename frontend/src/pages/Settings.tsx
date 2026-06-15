import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings as SettingsIcon, User, MapPin, Users, Trash2, Download, ClipboardList, AlertTriangle } from 'lucide-react'
import { authApi } from '@/api/auth'
import { progressApi } from '@/api/progress'
import { useAuthStore } from '@/store/authStore'

export default function Settings() {
  const { user, setUser, logout } = useAuthStore()
  const navigate = useNavigate()

  const [name, setName] = useState(user?.name || '')
  const [city, setCity] = useState(user?.city || '')
  const [age, setAge] = useState(user?.age?.toString() || '')
  const [householdSize, setHouseholdSize] = useState(user?.household_size?.toString() || '')
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    document.title = 'Settings — EcoMentor AI'
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    try {
      const updated = await authApi.updateProfile({
        name: name || undefined,
        city: city || undefined,
        age: age ? parseInt(age) : undefined,
        household_size: householdSize ? parseInt(householdSize) : undefined,
      })
      setUser(updated)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch {
      setError('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleteLoading(true)
    try {
      await authApi.deleteAccount()
      logout()
      navigate('/')
    } catch {
      setError('Failed to delete account. Please try again.')
      setDeleteLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <SettingsIcon size={24} color="var(--text-secondary)" />
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.2rem' }}>Settings</h1>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>Manage your profile and data</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Profile section */}
        <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '1.75rem' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={17} color="var(--accent)" />
            Profile
          </h2>

          <form onSubmit={handleSave} noValidate>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }} className="profile-grid">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="settings-name" className="form-label">Full Name</label>
                <input
                  id="settings-name"
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="settings-age" className="form-label">Age</label>
                <input
                  id="settings-age"
                  type="number"
                  className="form-input"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  min={1}
                  max={120}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="settings-city" className="form-label">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <MapPin size={13} aria-hidden="true" />
                    City
                  </span>
                </label>
                <input
                  id="settings-city"
                  type="text"
                  className="form-input"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Bangalore, Mumbai..."
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="settings-household" className="form-label">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <Users size={13} aria-hidden="true" />
                    Household Size
                  </span>
                </label>
                <input
                  id="settings-household"
                  type="number"
                  className="form-input"
                  value={householdSize}
                  onChange={(e) => setHouseholdSize(e.target.value)}
                  min={1}
                  max={20}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSaving}
                id="btn-save-settings"
              >
                {isSaving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Save Changes'}
              </button>
              {saveSuccess && (
                <span style={{ color: 'var(--primary)', fontSize: '0.875rem' }}>
                  ✓ Changes saved
                </span>
              )}
            </div>

            {error && (
              <div role="alert" style={{ color: 'var(--danger)', fontSize: '0.875rem', marginTop: '0.75rem' }}>{error}</div>
            )}
          </form>
        </section>

        {/* Account info */}
        <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '1.75rem' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Account</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Email: </span>
              <span style={{ color: 'var(--text-primary)' }}>{user?.email}</span>
            </div>
            <div style={{ fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Member since: </span>
              <span style={{ color: 'var(--text-primary)' }}>
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
              </span>
            </div>
          </div>
        </section>

        {/* Data & Actions */}
        <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '1.75rem' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>Data & Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Export My Data</div>
                <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Download all your assessments, challenges, and progress as JSON</div>
              </div>
              <button
                onClick={() => progressApi.exportData()}
                className="btn btn-secondary btn-sm"
                id="btn-export-data"
                aria-label="Download your data as JSON"
              >
                <Download size={14} />
                Export
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Re-take Assessment</div>
                <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Update your lifestyle data with a new assessment</div>
              </div>
              <button
                onClick={() => navigate('/assessment')}
                className="btn btn-secondary btn-sm"
                aria-label="Start a new carbon assessment"
              >
                <ClipboardList size={14} />
                Start
              </button>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section style={{ background: 'var(--surface)', border: '1px solid rgba(248,81,73,0.3)', borderRadius: 'var(--radius-xl)', padding: '1.75rem' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={17} />
            Danger Zone
          </h2>

          {!showDeleteConfirm ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Delete Account</div>
                <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Permanently delete your account and all data. This cannot be undone.</div>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="btn btn-danger btn-sm"
                id="btn-delete-account-confirm"
                aria-label="Delete your account permanently"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          ) : (
            <div style={{ background: 'var(--danger-dim)', border: '1px solid rgba(248,81,73,0.4)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
              <p style={{ color: 'var(--danger)', fontWeight: 500, marginBottom: '1rem', fontSize: '0.875rem' }}>
                ⚠️ Are you sure? This will permanently delete your account, all assessments, progress history, and challenges. This action CANNOT be undone.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn btn-secondary btn-sm"
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="btn btn-danger btn-sm"
                  disabled={deleteLoading}
                  id="btn-delete-account-final"
                  aria-label="Confirm account deletion"
                >
                  {deleteLoading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Yes, Delete My Account'}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      <style>{`
        @media (max-width: 480px) {
          .profile-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
