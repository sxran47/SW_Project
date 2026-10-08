import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Wallet, Plus, ArrowUpRight } from 'lucide-react';
import { usePreview, walletPreview } from '../../stores/preview';
import { useAction } from '../../hooks/preview';
import { Amount, Confirm, Empty } from '../../components/ui/common';
import { useUI } from '../../stores/ui';

export function AccountPage() {
  const user = usePreview((s) => s.user)!;
  const customer = usePreview((s) => s.customers[user.username]);
  const [amount, setAmount] = useState('500');
  const [confirmedAmount, setConfirmedAmount] = useState<number | null>(null);
  const topUp = useAction(walletPreview.topUp, () => {
    setConfirmedAmount(null);
    useUI.getState().notify({ kind: 'info', code: '', message: 'Demo wallet top-up completed.' });
  });
  const prime = customer.memberTier === 'prime';
  return <main data-testid="page-account">
    <div className="page-heading"><span className="eyebrow">YOUR ORBIT ACCOUNT</span><h1>Membership & wallet</h1><p>Your benefits, balance, and transactions in one place.</p></div>
    <div className="account-grid">
      <section className="account-card membership-card" aria-labelledby="membership-title">
        <Crown size={30}/><span className="eyebrow">MEMBER BENEFITS</span>
        <h2 id="membership-title">{user.username}</h2>
        <span className={`badge ${prime ? 'prime' : 'normal'}`} data-testid="member-tier">{prime ? 'Prime member' : 'Normal member'}</span>
        <ul className="member-benefits">
          {prime ? <><li>5% off products when no eligible coupon is applied</li><li>Free standard delivery in every zone</li><li>50% of the base shipping rate for express delivery</li></> : <><li>Access to all products and available coupons</li><li>Standard delivery at the regular shipping rate</li><li>Express delivery at 1.5× the base shipping rate</li></>}
        </ul>
        <p className="account-note">Membership is managed by the store administrator. Changes apply to your next checkout; reserved orders keep their recorded totals.</p>
      </section>
      <section className="account-card" aria-labelledby="wallet-title">
        <Wallet size={30}/><span className="eyebrow">DEMO WALLET · THB</span><h2 id="wallet-title">Available balance</h2>
        <div className="wallet-balance" aria-live="polite"><Amount value={customer.walletBalance} testId="wallet-balance"/></div>
        <p className="account-note">Simulated funds for this frontend preview. No real money is deposited or charged. Maximum balance: 100,000 THB.</p>
        <form onSubmit={(event) => { event.preventDefault(); setConfirmedAmount(Number(amount)); }}>
          <label htmlFor="wallet-amount">Demo top-up amount (THB)</label>
          <div className="wallet-topup-controls"><input id="wallet-amount" data-testid="wallet-topup-amount" type="number" min="1" max="50000" step="1" required value={amount} onChange={(e) => setAmount(e.target.value)}/><button className="btn primary" disabled={topUp.isPending}><Plus size={17}/>Top up demo funds</button></div>
        </form>
        {customer.stage === 'payment' && <Link className="text-link" to="/checkout">Return to payment <ArrowUpRight size={16}/></Link>}
        {customer.stage === 'success' && <Link className="text-link" to="/success">View order confirmation <ArrowUpRight size={16}/></Link>}
      </section>
    </div>
    <section className="account-transactions" aria-labelledby="transactions-title">
      <div className="section-heading"><h2 id="transactions-title">Wallet activity</h2><span>{customer.transactions.length} transactions</span></div>
      {!customer.transactions.length ? <Empty title="No transactions yet"><p>Top up demo funds to start using your wallet.</p></Empty> : <div className="table-scroll"><table data-testid="wallet-transactions"><thead><tr><th>Transaction</th><th>Date</th><th>Amount</th><th>Balance after</th></tr></thead><tbody>{customer.transactions.slice().reverse().map((transaction) => <tr key={transaction.id}><td><strong>{transaction.kind === 'topup' ? 'Demo top-up' : 'Order payment'}</strong>{transaction.orderId && <div><Link className="text-link" to={`/orders/${transaction.orderId}`}>{transaction.orderId}<ArrowUpRight size={14}/></Link></div>}</td><td>{new Date(transaction.createdAt).toLocaleString('en-GB', { timeZone: 'Asia/Bangkok' })}</td><td className={transaction.kind === 'topup' ? 'wallet-credit' : ''}><Amount value={transaction.amount}/></td><td><Amount value={transaction.balanceAfter}/></td></tr>)}</tbody></table></div>}
    </section>
    {confirmedAmount !== null && <Confirm title="Add demo wallet funds?" pending={topUp.isPending} onClose={() => setConfirmedAmount(null)} onConfirm={() => topUp.mutate(confirmedAmount)}>Add {confirmedAmount.toLocaleString()} THB in simulated funds to your wallet. This does not process a real payment.</Confirm>}
  </main>;
}
