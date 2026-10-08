import { useState } from 'react';
import { Crown, Save } from 'lucide-react';
import { adminPreview, usePreview } from '../../stores/preview';
import { useAction } from '../../hooks/preview';
import { Amount } from '../../components/ui/common';
import { useUI } from '../../stores/ui';
import type { MemberTier } from '../../types/ui';

function MemberRow({ username, tier, balance }: { username: string; tier: MemberTier; balance: number }) {
  const [selected, setSelected] = useState(tier);
  const save = useAction((memberTier: MemberTier) => adminPreview.setMemberTier(username, memberTier), () => useUI.getState().notify({ kind: 'info', code: '', message: `Membership updated for ${username}.` }));
  return <tr><td><strong>{username}</strong></td><td><span className={`badge ${tier}`}>{tier === 'prime' ? 'Prime' : 'Normal'}</span></td><td><Amount value={balance}/></td><td><label className="sr-only" htmlFor={`tier-${username}`}>Membership for {username}</label><select id={`tier-${username}`} value={selected} onChange={(e) => setSelected(e.target.value as MemberTier)}><option value="normal">Normal</option><option value="prime">Prime</option></select></td><td><button className="btn" disabled={save.isPending || selected === tier} onClick={() => save.mutate(selected)}><Save size={15}/>{save.isPending ? 'Saving…' : 'Save membership'}</button></td></tr>;
}

export function AdminMembersPage() {
  const customers = usePreview((s) => s.customers);
  return <main data-testid="page-admin-members"><div className="page-heading"><span className="eyebrow">STORE ADMINISTRATION</span><h1>Member management</h1><p>Manage customer membership and view demo wallet balances.</p></div><div className="admin-note"><Crown size={19}/><p>Prime members receive a 5% product discount without an eligible coupon, free standard shipping, and express shipping at half the base rate. Changes apply at the next checkout.</p></div><div className="table-scroll"><table><thead><tr><th>Customer</th><th>Current tier</th><th>Wallet balance</th><th>New tier</th><th>Changes</th></tr></thead><tbody>{Object.entries(customers).map(([username, customer]) => <MemberRow key={`${username}-${customer.memberTier}`} username={username} tier={customer.memberTier} balance={customer.walletBalance}/>)}</tbody></table></div></main>;
}
