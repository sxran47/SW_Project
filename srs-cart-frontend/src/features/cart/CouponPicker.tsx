import { useEffect, useRef, useState } from 'react';
import { Ticket, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { couponPreview } from '../../stores/preview';
import { errorMessage } from '../../data/errors';
import { useAction, useCoupons } from '../../hooks/preview';
import { Amount } from '../../components/ui/common';
import type { Coupon } from '../../types/ui';

const schema = z.object({ code: z.string().min(1, 'Enter a coupon code.') });

export function CouponPicker({ code, onClose }: { code: string | null; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { data: coupons, isLoading, error, refetch } = useCoupons();
  const [selected, setSelected] = useState(code ?? '');
  const [applyError, setApplyError] = useState('');
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  const apply = useAction(async (values: { code: string }) => {
    setApplyError('');
    try { return await couponPreview.apply(values); }
    catch (error) { setApplyError(errorMessage(error).message); throw error; }
  }, onClose);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  const selectable = coupons.some((coupon) => coupon.code === selected && coupon.code !== 'welcome01' && coupon.status === 'enabled');

  return <dialog ref={dialog} className="coupon-picker" aria-labelledby="coupon-picker-title" data-testid="coupon-picker-dialog" onCancel={(event) => { event.preventDefault(); if (!apply.isPending) onClose(); }}>
    <div className="dialog-content">
      <div className="coupon-picker-heading"><h2 id="coupon-picker-title">Choose a coupon</h2><button type="button" aria-label="Close coupon selection" disabled={apply.isPending} onClick={onClose}><X size={20}/></button></div>
      <p>Choose one coupon or enter your own code. Eligibility is checked at checkout.</p>
      {isLoading ? <p role="status">Loading coupons…</p> : error ? <div role="alert"><p>{error.message}</p><button className="btn" onClick={() => void refetch()}>Try again</button></div> : <>
        <fieldset className="coupon-choices" data-testid="customer-coupon-list" disabled={apply.isPending}>
          <legend>Store coupons</legend>
          {coupons.filter((coupon) => coupon.code !== 'welcome01').map((coupon) => <label key={coupon.code} className="coupon-choice" data-testid={`customer-coupon-${coupon.code}`}>
            <input type="radio" name="selected-coupon" value={coupon.code} checked={selected === coupon.code} disabled={coupon.status === 'disabled'} onChange={() => { setSelected(coupon.code); setApplyError(''); }}/>
            <span className="coupon-choice-details"><span className="coupon-choice-heading"><strong>{coupon.code}</strong><span className={`badge ${coupon.status}`} data-testid={`coupon-status-${coupon.code}`} data-status={coupon.status}>{coupon.status === 'enabled' ? 'Enabled' : 'Disabled'}</span></span>
              <span>{coupon.percent}% off · {coupon.minSpend === 0 ? 'No minimum spend' : <>Minimum spend <Amount value={coupon.minSpend}/></>}</span>
              {code === coupon.code && <span className="coupon-current">Currently applied</span>}
            </span>
          </label>)}
          {!coupons.some((coupon) => coupon.code !== 'welcome01') && <p>No store coupons available. You can enter a code below.</p>}
        </fieldset>
        <button type="button" className="btn primary full" data-testid="use-selected-coupon" disabled={!selectable || apply.isPending} onClick={() => apply.mutate({ code: selected })}>{apply.isPending ? 'Applying…' : 'Use selected coupon'}</button>
      </>}
      <div className="coupon-manual">
        <form onSubmit={handleSubmit((values) => apply.mutate(values))} noValidate>
          <label htmlFor="coupon-code">Have another coupon code?</label>
          <div className="coupon-manual-controls"><input id="coupon-code" data-testid="coupon-input" placeholder="Enter code" {...register('code')} disabled={apply.isPending} aria-invalid={!!errors.code} aria-describedby={errors.code ? 'coupon-input-error' : undefined}/><button className="btn" data-testid="coupon-apply" disabled={apply.isPending}>{apply.isPending ? 'Applying…' : 'Apply'}</button></div>
          {errors.code && <p className="field-error" id="coupon-input-error" role="alert">{errors.code.message}</p>}
        </form>
        <p>Coupon codes are case-sensitive.</p>
      </div>
      {applyError && <p className="field-error" role="alert" data-testid="coupon-error">{applyError}</p>}
      <div className="dialog-actions"><button type="button" className="btn" disabled={apply.isPending} onClick={onClose}>Cancel</button></div>
    </div>
  </dialog>;
}

export function SelectedCouponSummary({ code, coupon, subtotal }: { code: string; coupon?: Coupon; subtotal: number }) {
  const enabled = coupon?.status === 'enabled';
  const eligible = enabled && subtotal >= coupon.minSpend;
  const discount = eligible ? Math.floor(subtotal * coupon.percent / 100) : 0;
  return <div className="selected-coupon-summary" data-testid="selected-coupon-summary" role="status">
    <div className="summary-row"><span>Selected coupon</span><strong data-testid="cart-coupon-code">{code}</strong></div>
    {coupon && <div className="summary-row"><span>Coupon offer</span><span data-testid="cart-coupon-percent">{coupon.percent}% off</span></div>}
    <div className="summary-row"><span>Estimated coupon discount</span><Amount value={discount} testId="cart-coupon-discount">−<Amount value={discount}/></Amount></div>
    {!enabled ? <p className="field-error">This coupon is no longer available. Choose another coupon.</p>
      : !eligible ? <p>Minimum spend <Amount value={coupon.minSpend}/>. Add <Amount value={coupon.minSpend - subtotal}/> more to use this coupon.</p>
        : <p>Discount updates with your cart. Final eligibility is checked at checkout.</p>}
  </div>;
}

export function CouponForm({ code, subtotal }: { code: string | null; subtotal: number }) {
  const [open, setOpen] = useState(false);
  const { data: coupons } = useCoupons();
  return <div className="coupon-section">
    {code ? <SelectedCouponSummary code={code} coupon={coupons.find((coupon) => coupon.code === code)} subtotal={subtotal}/>
      : <p data-testid="cart-coupon-code">No coupon selected.</p>}
    <button type="button" className="btn full" data-testid="choose-coupon-button" aria-haspopup="dialog" onClick={() => setOpen(true)}><Ticket size={16}/>{code ? 'Change coupon' : 'Choose a coupon'}</button>
    {open && <CouponPicker code={code} onClose={() => setOpen(false)}/>}
  </div>;
}
