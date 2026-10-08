import assert from 'node:assert/strict';
import console from 'node:console';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

// Run the actual store in Node without adding a browser or test framework.
const directory = await mkdtemp(resolve('.preview-tests-'));
const storage = new Map();
globalThis.sessionStorage = globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => storage.delete(key),
};
try {
  for (const file of ['stores/preview', 'stores/ui', 'data/preview', 'data/errors', 'data/weight']) {
    const source = await readFile(resolve(`src/${file}.ts`), 'utf8');
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
      .replace(/import\.meta\.env\.DEV/g, 'true')
      .replace(/from '(\.[^']+)'/g, "from '$1.js'");
    const output = join(directory, `${file}.js`);
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, compiled);
  }
  const { usePreview, walletPreview, adminPreview, bagPreview, couponPreview, checkoutPreview, previewGateway, resetPreview } = await import(pathToFileURL(join(directory, 'stores/preview.js')));
  const signIn = (username) => usePreview.getState().signIn(username, 'demo');
  const customer = (username = usePreview.getState().user.username) => usePreview.getState().customers[username];
  const checkout = () => checkoutPreview.press({ zone: 'inCity', speed: 'standard' });
  const rejects = (fn, code) => assert.rejects(fn, (error) => error.code === code);
  let checks = 0;

  resetPreview();
  usePreview.getState().signIn('prime', 'prime');
  assert.equal(customer().memberTier, 'prime');
  assert.equal(customer().walletBalance, 0);
  usePreview.getState().signOut();
  await rejects(() => walletPreview.topUp(500), 'AUTH_REQUIRED');
  signIn('admin01');
  await rejects(() => walletPreview.topUp(500), 'AUTH_FORBIDDEN');
  signIn('cus_normal');
  await rejects(() => adminPreview.setMemberTier('cus_normal', 'prime'), 'AUTH_FORBIDDEN');
  checks++;

  for (const amount of [NaN, Infinity, -1, 0, 1.5, 50001]) await rejects(() => walletPreview.topUp(amount), 'VALIDATION_ERROR');
  assert.equal(customer().walletBalance, 0);
  await walletPreview.topUp(50000);
  await walletPreview.topUp(50000);
  await rejects(() => walletPreview.topUp(1), 'WALLET_LIMIT_EXCEEDED');
  assert.equal(customer().walletBalance, 100000);
  assert.equal(customer().transactions.length, 2);
  checks++;

  signIn('another_customer');
  assert.equal(customer().walletBalance, 0);
  assert.equal(customer().memberTier, 'normal');
  assert.deepEqual(customer().transactions, []);
  signIn('cus_normal');
  assert.equal(customer().walletBalance, 100000);
  checks++;

  resetPreview();
  signIn('cus_normal');
  await bagPreview.add({ productId: 'P1', quantity: 1 });
  const order = await checkout();
  const before = JSON.stringify(usePreview.getState());
  await rejects(() => walletPreview.pay(order.orderId), 'WALLET_INSUFFICIENT_FUNDS');
  assert.equal(JSON.stringify(usePreview.getState()), before);
  checks++;

  await walletPreview.topUp(order.total);
  await walletPreview.pay(order.orderId);
  assert.equal(customer().walletBalance, 0);
  assert.equal(customer().stage, 'success');
  assert.deepEqual(customer().items, {});
  assert.equal(usePreview.getState().orders[0].paymentMethod, 'wallet');
  assert.equal(customer().transactions[1].amount, -order.total);
  assert.equal(customer().transactions[1].orderId, order.orderId);
  assert.equal(customer().transactions[1].balanceAfter, 0);
  await rejects(() => walletPreview.pay(order.orderId), 'OPERATION_NOT_ALLOWED');
  await rejects(() => previewGateway(order.orderId, 'success'), 'OPERATION_NOT_ALLOWED');
  assert.equal(customer().transactions.length, 2);
  checks++;

  await checkoutPreview.continue();
  await bagPreview.add({ productId: 'P1', quantity: 1 });
  const cancelled = await checkout();
  await walletPreview.topUp(1000);
  await checkoutPreview.cancel();
  await rejects(() => walletPreview.pay(cancelled.orderId), 'OPERATION_NOT_ALLOWED');
  assert.equal(customer().walletBalance, 1000);
  assert.equal(usePreview.getState().products[0].stock, 19);
  checks++;

  const ownOrder = await checkout();
  signIn('another_customer');
  await bagPreview.add({ productId: 'P1', quantity: 1 });
  await checkout();
  await walletPreview.topUp(1000);
  await rejects(() => walletPreview.pay(ownOrder.orderId), 'ORDER_NOT_FOUND');
  assert.equal(customer().walletBalance, 1000);
  checks++;

  signIn('admin01');
  await rejects(() => adminPreview.setMemberTier('missing', 'prime'), 'USER_NOT_FOUND');
  await rejects(() => adminPreview.setMemberTier('cus_normal', 'gold'), 'VALIDATION_ERROR');
  await adminPreview.setMemberTier('cus_normal', 'prime');
  signIn('cus_normal');
  assert.equal(usePreview.getState().user.memberTier, 'prime');
  assert.equal(usePreview.getState().orders.find((o) => o.orderId === ownOrder.orderId).total, ownOrder.total);
  await checkoutPreview.cancel();
  const primeOrder = await checkout();
  assert.equal(primeOrder.discount, 22);
  assert.equal(primeOrder.shipping, 0);
  assert.equal(primeOrder.total, 428);
  checks++;

  await checkoutPreview.cancel();
  await couponPreview.apply({ code: 'WELCOME10' });
  const couponOrder = await checkout();
  assert.equal(couponOrder.discount, 45);
  assert.equal(couponOrder.total, 405);
  await previewGateway(couponOrder.orderId, 'success');
  assert.equal(customer().walletBalance, 1000);
  await rejects(() => walletPreview.pay(couponOrder.orderId), 'OPERATION_NOT_ALLOWED');
  checks++;

  usePreview.getState().signOut();
  signIn('cus_normal');
  assert.equal(customer().walletBalance, 1000);
  assert.equal(customer().memberTier, 'prime');
  await usePreview.persist.rehydrate();
  assert.equal(customer().walletBalance, 1000);
  assert.equal(customer().memberTier, 'prime');
  checks++;

  // Existing v2 snapshots did not contain membership or wallet fields.
  storage.set('ritual-ui-preview-v2', JSON.stringify({ state: {
    user: { username: 'cus_prime', role: 'Customer', memberTier: 'prime' },
    customers: { cus_prime: { stage: 'cart', items: {}, couponCode: null, currentOrderId: null } },
  }, version: 0 }));
  await usePreview.persist.rehydrate();
  assert.equal(customer().walletBalance, 0);
  assert.equal(customer().memberTier, 'prime');
  assert.deepEqual(customer().transactions, []);
  assert.equal(usePreview.getState().user.memberTier, 'prime');
  checks++;

  console.log(`Passed ${checks} membership and wallet scenarios.`);
} finally {
  assert.equal(dirname(directory), resolve());
  await rm(directory, { recursive: true, force: true });
}
