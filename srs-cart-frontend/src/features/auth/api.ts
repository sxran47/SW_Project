import { request } from '../../services/apiClient';
import { endpoints } from '../../services/endpoints';
import type { LoginRequest, Session, User } from '../../types/api';
export const authApi = { login: (data: LoginRequest) => request<Session>({ method: 'POST', url: endpoints.login, data }), session: (signal?: AbortSignal) => request<User>({ url: endpoints.session, signal }), logout: () => request<null>({ method: 'POST', url: endpoints.logout }) };
