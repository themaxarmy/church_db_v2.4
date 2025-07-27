// api.ts
import type { User } from './postgres'; // Assuming you create a types.ts or similar for shared types

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// --- Interfaces for API Responses & Payloads ---

// Assuming your server returns an object with a 'user' property on successful auth
interface AuthResponse {
  user: User;
  message?: string; // Optional message from the server
}

interface GetCurrentUserResponse {
  user: User | null; // User might be null if not authenticated
}

interface GeneralSuccessResponse {
  message: string; // For operations like sign out, reset password, etc.
}

// --- Interfaces for Records (from your MongoDB/backend perspective) ---

// Represents the raw structure of a record as returned by your API
export interface RawApiRecord {
  _id: string; // MongoDB's default ID
  createdAt: string; // MongoDB's default timestamp (ISO string)
  firstName: string;
  lastName: string;
  otherNames?: string; // Optional in API response
  dateOfBirth: string; // Assuming date is string format, e.g., 'YYYY-MM-DD' or ISO
  picture: string; // Assuming this is a URL or base64 string
  // Add any other fields your API might return for a record
}

// Represents the payload for creating a new record
export interface CreateRecordPayload {
  firstName: string;
  lastName: string;
  otherNames?: string; // Optional for payload if it can be omitted
  dateOfBirth: string;
  picture: string;
}

// Represents the payload for updating an existing record (all fields optional)
export interface UpdateRecordPayload {
  firstName?: string;
  lastName?: string;
  otherNames?: string;
  dateOfBirth?: string;
  picture?: string;
}

// For getting a list of records
export interface GetRecordsResponse {
  records: RawApiRecord[]; // Assuming your API returns an object { records: [...] }
  // You might also have pagination info here, e.g., totalCount: number;
}

// For users list (assuming your server returns an array of users)
interface GetUsersResponse {
  users: User[];
}

// --- End of Interfaces ---


class ApiClient {
  
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies for session management
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        let errorData: any = {};
        try {
          // Attempt to parse JSON error message
          errorData = await response.json();
        } catch (e) {
          // If response is not JSON, or empty
          console.warn('API error response was not JSON or empty:', e);
        }
        // Use errorData.error, errorData.message, or a generic HTTP status message
        throw new Error(errorData.error || errorData.message || `HTTP error! Status: ${response.status}`);
      }

      // Handle cases where response might be empty (e.g., 204 No Content for DELETE)
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return {} as T; // Return an empty object cast to T for void returns
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error; // Re-throw to be caught by the caller
    }
  }

  // Auth methods
  async signUp(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async signOut(): Promise<GeneralSuccessResponse> {
    return this.request<GeneralSuccessResponse>('/auth/signout', {
      method: 'POST',
    });
  }

  async getCurrentUser(): Promise<GetCurrentUserResponse> {
    return this.request<GetCurrentUserResponse>('/auth/me');
  }

  async resetPassword(email: string): Promise<GeneralSuccessResponse> {
    return this.request<GeneralSuccessResponse>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // Records methods
  // Fully implement getRecords
  async getRecords(): Promise<GetRecordsResponse> {
    return this.request<GetRecordsResponse>('/records');
  }

  // Fully implement createRecord with correct payload type
  async createRecord(recordData: CreateRecordPayload): Promise<RawApiRecord> {
    return this.request<RawApiRecord>('/records', {
      method: 'POST',
      body: JSON.stringify(recordData),
    });
  }

  // Fully implement updateRecord with correct payload type
  async updateRecord(id: string, recordData: UpdateRecordPayload): Promise<RawApiRecord> {
    return this.request<RawApiRecord>(`/records/${id}`, {
      method: 'PUT', // Or 'PATCH' if your API uses PATCH for partial updates
      body: JSON.stringify(recordData),
    });
  }

  // Fully implement deleteRecord
  async deleteRecord(id: string): Promise<GeneralSuccessResponse> { // Or Promise<void> if it returns nothing
    return this.request<GeneralSuccessResponse>(`/records/${id}`, {
      method: 'DELETE',
    });
  }

  // Users methods
  async getUsers(): Promise<GetUsersResponse> {
    return this.request<GetUsersResponse>('/users');
  }

  async approveUser(id: string): Promise<User> { // Assuming it returns the updated user
    return this.request<User>(`/users/${id}/approve`, {
      method: 'PATCH',
    });
  }

  async rejectUser(id: string): Promise<User> { // Assuming it returns the updated user
    return this.request<User>(`/users/${id}/reject`, {
      method: 'PATCH',
    });
  }

  async updateUserRole(id: string, role: 'user' | 'admin' | 'super_admin'): Promise<User> { // Make role type-safe
    return this.request<User>(`/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);