import { useNavigate } from 'react-router-dom';
import { previewGateway } from '../../stores/preview';
import { useAction } from '../../hooks/preview';

export function GatewayPreview({ orderId }: { orderId: string }) {
  const navigate = useNavigate();
  const gateway = useAction((result: 'success' | 'fail') => previewGateway(orderId, result), () => {
    // The stage guard selects success after OP-10, or checkout after OP-11.
    navigate('/checkout');
  });
  if (!import.meta.env.DEV) return null;
  return (
    <aside className="preview-states" aria-label="Development payment gateway preview">
      <strong>Development only · simulated payment gateway</strong>
      <p>No real payment is processed. These gateway actions are separate from Customer operations.</p>
      <button className="btn" data-testid="gateway-pay-success" disabled={gateway.isPending} onClick={() => gateway.mutate('success')}>Simulate payment success</button>
      <button className="btn" data-testid="gateway-pay-fail" disabled={gateway.isPending} onClick={() => gateway.mutate('fail')}>Simulate payment failure</button>
    </aside>
  );
}
