import { useState } from 'react';

type Props = { token: string; onDeleted: () => void };
const API = 'https://kbk-picability-backend.onrender.com';

export function DeleteAccountPanel({ token, onDeleted }: Props) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function removeAccount() {
    if (confirmation !== 'DELETE') return;
    setBusy(true); setError('');
    try {
      const response = await fetch(`${API}/api/account/me`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || 'Account deletion failed.');
      onDeleted();
    } catch (e) { setError(e instanceof Error ? e.message : 'Account deletion failed.'); }
    finally { setBusy(false); }
  }

  return <div style={{ position: 'fixed', right: 12, bottom: 82, zIndex: 1000 }}>
    {!open ? <button type="button" onClick={() => setOpen(true)} style={{ padding: 8, borderRadius: 8, background: '#7f1d1d', color: 'white' }}>Delete account</button> :
    <div role="dialog" aria-label="Delete account" style={{ maxWidth: 320, padding: 16, borderRadius: 12, background: '#1f2937', color: 'white', boxShadow: '0 4px 20px #0008' }}>
      <strong>Delete your account permanently?</strong>
      <p>Your profile, friendships, check-ins, photos and shared two-person streaks will be deleted. This cannot be undone.</p>
      <label htmlFor="delete-password">Current password</label>
      <input id="delete-password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} style={{ display: 'block', width: '100%', color: '#111', padding: 8, marginBottom: 8 }} />
      <label htmlFor="delete-confirm">Type DELETE to confirm</label>
      <input id="delete-confirm" value={confirmation} onChange={e => setConfirmation(e.target.value)} style={{ display: 'block', width: '100%', color: '#111', padding: 8, marginBottom: 8 }} />
      {error && <p role="alert">{error}</p>}
      <button type="button" disabled={busy || !password || confirmation !== 'DELETE'} onClick={removeAccount} style={{ padding: 8, background: '#b91c1c', color: 'white', marginRight: 8 }}>Permanently delete</button>
      <button type="button" disabled={busy} onClick={() => { setOpen(false); setError(''); setPassword(''); setConfirmation(''); }}>Cancel</button>
    </div>}
  </div>;
}
