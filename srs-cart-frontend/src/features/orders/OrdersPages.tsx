
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';

import { useOrder, useOrders } from '../../hooks/preview';
import { Amount, Badge, Empty, ErrorState, Loading } from '../../components/ui/common';
import { OrderSummary } from '../checkout/CheckoutPage';
export function OrdersPage() { const orders = useOrders(); return <main data-testid="page-orders"><div className="page-heading"><span className="eyebrow">YOUR PURCHASE HISTORY</span><h1>My orders</h1><p>Review your orders, payment status, and purchase details.</p></div>{orders.isLoading ? <Loading/> : orders.error ? <ErrorState error={orders.error} retry={() => void orders.refetch()}/> : !orders.data?.length ? <Empty title="You have no orders yet."><p>Your orders will appear here after checkout.</p><Link className="btn primary" to="/products">Browse products</Link></Empty> : <div className="table-scroll" data-testid="order-list"><table><thead><tr><th>Order</th><th>Created</th><th>Items</th><th>Status</th><th>Total</th><th><span className="sr-only">Details</span></th></tr></thead><tbody>{orders.data.map((order) => <tr key={order.orderId} data-testid={`order-row-${order.orderId}`}><td><strong>{order.orderId}</strong></td><td>{new Date(order.createdAt).toLocaleString('en-GB', { timeZone: 'Asia/Bangkok', dateStyle: 'medium', timeStyle: 'short' })}</td><td>{order.lines.length} products</td><td><Badge status={order.status} testId="order-status"/></td><td><Amount value={order.total} testId="order-total"/></td><td><Link className="text-link" data-testid="order-view" aria-label={`View order ${order.orderId}`} to={`/orders/${order.orderId}`}>View details <ArrowUpRight size={16}/></Link></td></tr>)}</tbody></table></div>}</main>; }
export function OrderDetailPage() {
  const { orderId } = useParams();
  const { data: order, isLoading, error, refetch } = useOrder(orderId ?? null);

  return (
    <main data-testid="page-order-detail">
      <div className="page-heading">
        <Link className="text-link" to="/orders"><ArrowLeft size={16}/>Back to my orders</Link>
        <h1>Order details</h1>
        <p>Your products and totals as recorded at checkout.</p>
      </div>
      {isLoading ? <Loading rows={1}/> : error ? (
        <ErrorState error={error} retry={() => void refetch()}/>
      ) : !order ? (
        <div data-testid="order-not-found" role="status">
          <Empty title="Order not found">
            <p>ไม่พบออเดอร์นี้ในข้อมูลตัวอย่าง</p>
            <Link className="btn primary" to="/orders">Back to my orders</Link>
          </Empty>
        </div>
      ) : (
        <section className="order-card">
          <div className="order-card-heading">
            <div>
              <span className="eyebrow">ORDER REFERENCE</span>
              <h2 data-testid="order-detail-id">{order.orderId}</h2>
              <small>{new Date(order.createdAt).toLocaleString('en-GB', { timeZone: 'Asia/Bangkok' })}</small>
            </div>
            <Badge status={order.status} testId="order-detail-status"/>
          </div>
          <OrderSummary order={order} prefix="order-detail"/>
        </section>
      )}
    </main>
  );
}
