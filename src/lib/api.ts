import type { FormRecord, RecordInput, User, UserRole } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface UserResponse {
  user: User;
}

interface MessageResponse {
  message: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...options.headers },
        credentials: 'include', // auth is an httpOnly cookie
      });
    } catch {
      throw new Error('Unable to reach the server. Check your connection and try again.');
    }

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || body.message || `Request failed (${response.status})`);
    }

    if (response.status === 204) {
      return undefined as T;
    }
    return response.json();
  }

  // Auth
  signUp(email: string, password: string) {
    return this.request<UserResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  signIn(email: string, password: string) {
    return this.request<UserResponse>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  signOut() {
    return this.request<MessageResponse>('/auth/signout', { method: 'POST' });
  }

  getCurrentUser() {
    return this.request<{ user: User | null }>('/auth/me');
  }

  resetPassword(email: string) {
    return this.request<MessageResponse>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // Records
  getRecords() {
    return this.request<{ records: FormRecord[] }>('/records');
  }

  getRecord(id: string) {
    return this.request<FormRecord>(`/records/${id}`);
  }

  createRecord(record: RecordInput) {
    return this.request<FormRecord>('/records', {
      method: 'POST',
      body: JSON.stringify(record),
    });
  }

  updateRecord(id: string, updates: Partial<RecordInput>) {
    return this.request<FormRecord>(`/records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  archiveRecord(id: string) {
    return this.request<FormRecord>(`/records/${id}/archive`, { method: 'PATCH' });
  }

  restoreRecord(id: string) {
    return this.request<FormRecord>(`/records/${id}/restore`, { method: 'PATCH' });
  }

  deleteRecord(id: string) {
    return this.request<void>(`/records/${id}`, { method: 'DELETE' });
  }

  // Users (super admin)
  getUsers() {
    return this.request<{ users: User[] }>('/users');
  }

  approveUser(id: string) {
    return this.request<User>(`/users/${id}/approve`, { method: 'PATCH' });
  }

  rejectUser(id: string) {
    return this.request<User>(`/users/${id}/reject`, { method: 'PATCH' });
  }

  updateUserRole(id: string, role: UserRole) {
    return this.request<User>(`/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
