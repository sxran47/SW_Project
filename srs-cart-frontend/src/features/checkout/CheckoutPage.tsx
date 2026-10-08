import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, CheckCircle2, Clock3, CreditCard, ArrowRight } from 'lucide-react';
import { checkoutPreview, usePreview, walletPreview } from '../../stores/preview';
import { useAction, useCart, useOrder } from '../../hooks/preview';
import { Amount, Badge, Confirm, ErrorState, Loading } from '../../components/ui/common';
import { ProductArt } from '../../components/ui/ProductArt';
import { GatewayPreview } from './GatewayPreview';

import type { Order } from '../../types/ui';
export function OrderSummary({ order, prefix }: { order: Order; prefix: 'checkout' | 'success' | 'order-detail' }) { return <><div className="order-lines">{order.lines.map((line) => <div className="order-line" key={line.productId} data-testid={`${prefix === 'order-detail' ? 'order' : prefix}-line-${line.productId}`}><ProductArt id={line.productId} small/><div><h3>{line.name}</h3><span><Amount testId={prefix === 'order-detail' ? 'order-line-unit-price' : undefined} value={line.price}/> × <span data-testid={prefix === 'order-detail' ? 'order-line-qty' : undefined} data-value={line.quantity}>{line.quantity}</span></span></div><Amount value={line.lineTotal}/></div>)}</div><div className="order-totals"><div className="summary-row"><span>Subtotal</span><Amount testId={`${prefix}-subtotal`} value={order.subtotal}/></div><div className="summary-row"><span>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</span><Amount testId={`${prefix}-discount`} value={order.discount}/></div><div className="summary-row"><span>Shipping</span><Amount testId={`${prefix}-shipping`} value={order.shipping}/></div><div className="summary-row total"><strong>Total</strong><Amount testId={`${prefix}-total`} value={order.total}/></div></div><div className="delivery-detail"><span>Delivery zone<strong>{{ inCity: 'In city', upcountry: 'Upcountry', remote: 'Remote area' }[order.zone]}</strong></span><span>Delivery speed<strong>{order.speed === 'express' ? 'Express' : 'Standard'}</strong></span></div></>; }
export function CheckoutPage({ success = false }: { success?: boolean }) {
  const { data: cart } = useCart();
  const { data: order, error, refetch } = useOrder(cart.currentOrderId);
  const [confirm, setConfirm] = useState(false);
  const [confirmPayment, setConfirmPayment] = useState(false);
  const walletBalance = usePreview((s) => s.user ? s.customers[s.user.username]?.walletBalance ?? 0 : 0);
  const navigate = useNavigate();
  const pay = useAction(walletPreview.pay, () => navigate('/success'));
  const cancel = useAction(checkoutPreview.cancel, () => navigate('/cart'));
  const next = useAction(checkoutPreview.continue, () => navigate('/products'));
  if (error) return <ErrorState error={error} retry={() => void refetch()}/>;
  if (!order) return <Loading rows={1}/>;

  return (
    <main className="checkout-page" data-testid={success ? 'page-success' : 'page-checkout'}>
      <div className="checkout-steps">
        <span><Check size={14}/>Your cart</span>
        <span className={!success ? 'current' : ''}>{success ? <Check size={14}/> : '02'}Payment</span>
        <span className={success ? 'current' : ''}>03 Complete</span>
      </div>
      <div className="checkout-title">
        {success ? <CheckCircle2 size={44}/> : <Clock3 size={40}/>}
        <span className="eyebrow">{success ? 'YOUR ORDER IS CONFIRMED' : 'YOUR PRODUCTS ARE RESERVED'}</span>
        <h1>{success ? 'Your order is confirmed.' : 'Review your order.'}</h1>
        <p>{success ? 'Payment success recorded in this UI demonstration.' : 'Your preview order is awaiting payment. Its items remain reserved until success or cancellation.'}</p>
      </div>
      <section className="order-card">
        <div className="order-card-heading">
          <div><span className="eyebrow">ORDER REFERENCE</span><h2 data-testid={`${success ? 'success' : 'checkout'}-order-id`}>{order.orderId}</h2></div>
          <Badge status={order.status}/>
        </div>
        <OrderSummary order={order} prefix={success ? 'success' : 'checkout'}/>
        {order.paymentMethod && <p className="account-note">Paid using {order.paymentMethod === 'wallet' ? 'demo wallet' : 'simulated gateway'}.</p>}
        {!success && order.status === 'pending' && <section className="wallet-payment" aria-labelledby="wallet-payment-title">
          <h3 id="wallet-payment-title">Pay with demo wallet</h3>
          <div className="summary-row"><span>Available balance</span><Amount value={walletBalance} testId="checkout-wallet-balance"/></div>
          <p>Simulated funds only. No real payment is processed.</p>
          {walletBalance < order.total ? <><p>Top up <Amount value={order.total - walletBalance}/> to complete payment.</p><Link className="btn" to="/account">Top up demo wallet</Link></> : <button className="btn primary" data-testid="wallet-pay-button" disabled={pay.isPending} onClick={() => setConfirmPayment(true)}>Pay <Amount value={order.total}/> with wallet</button>}
        </section>}
        {!success && (
          <div className="payment-state"><CreditCard size={21}/><div>
            <strong>{order.paymentFailed ? 'Payment failed' : 'Awaiting payment'}</strong>
            <p>{order.paymentFailed ? 'การชำระเงินล้มเหลว กรุณาลองใหม่' : 'No real payment is processed in this frontend-only demonstration.'}</p>
          </div></div>
        )}
        <div className="order-actions">
          {success ? <button className="btn primary" data-testid="continue-shopping-button" disabled={next.isPending} onClick={() => next.mutate(undefined)}>Continue shopping <ArrowRight size={17}/></button>
            : <button className="btn" data-testid="cancel-checkout-button" onClick={() => setConfirm(true)}>Cancel checkout</button>}
        </div>
      </section>
      {!success && import.meta.env.DEV && <GatewayPreview orderId={order.orderId}/>}
      {confirm && <Confirm title="Cancel checkout?" pending={cancel.isPending} onClose={() => setConfirm(false)} onConfirm={() => { setConfirm(false); cancel.mutate(undefined); }}>The preview reservation will be released. Your items will stay in your cart.</Confirm>}
      {confirmPayment && <Confirm title="Pay with demo wallet?" pending={pay.isPending} onClose={() => setConfirmPayment(false)} onConfirm={() => pay.mutate(order.orderId)}>Deduct {order.total.toLocaleString()} THB in simulated funds for {order.orderId}. Your remaining balance will be {(walletBalance - order.total).toLocaleString()} THB.</Confirm>}
    </main>
  );
}
