import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { handlers } from '../mocks/handlers';
import { resetState } from '../mocks/serverState';
import { useAuth } from '../stores/auth';
import { useUI } from '../stores/ui';
export const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => { resetState(); sessionStorage.clear(); useAuth.getState().clear(); useUI.getState().notify(null); window.history.replaceState({}, '', '/login'); });
afterEach(() => { cleanup(); server.resetHandlers(); });
afterAll(() => server.close());
// jsdom lacks native dialog methods; real-browser tests verify the actual modal.
HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
