// import React, { createContext, useContext, useEffect, useState } from 'react';
// import { User as SupabaseUser, Session } from '@supabase/supabase-js';
// import { supabase, User } from '../lib/supabase';

// interface AuthContextType {
//   user: User | null;
//   session: Session | null;
//   loading: boolean;
//   signUp: (email: string, password: string) => Promise<{ error: string | null }>;
//   signIn: (email: string, password: string) => Promise<{ error: string | null }>;
//   signOut: () => Promise<{ error: string | null }>;
//   resetPassword: (email: string) => Promise<{ error: string | null }>;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

// export const SupabaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [session, setSession] = useState<Session | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     // Get initial session
//     supabase.auth.getSession().then(({ data: { session } }) => {
//       setSession(session);
//       if (session?.user) {
//         fetchUserProfile(session.user.id);
//       } else {
//         setLoading(false);
//       }
//     });

//     // Listen for auth changes
//     const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
//       setSession(session);
      
//       if (session?.user) {
//         await fetchUserProfile(session.user.id);
//       } else {
//         setUser(null);
//         setLoading(false);
//       }
//     });

//     return () => subscription.unsubscribe();
//   }, []);

//   const fetchUserProfile = async (userId: string) => {
//     try {
//       const { data, error } = await supabase
//         .from('users')
//         .select('*')
//         .eq('id', userId)
//         .single();

//       if (error) {
//         console.error('Error fetching user profile:', error);
//         setUser(null);
//       } else {
//         setUser(data);
//       }
//     } catch (error) {
//       console.error('Error fetching user profile:', error);
//       setUser(null);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const signUp = async (email: string, password: string) => {
//     try {
//       const { data, error } = await supabase.auth.signUp({
//         email,
//         password,
//       });

//       if (error) {
//         return { error: error.message };
//       }

//       if (data.user) {
//         // Create user profile
//         const userData = {
//           id: data.user.id,
//           email,
//           status: email === 'dinkomax@gmail.com' ? 'approved' : 'pending',
//           role: email === 'dinkomax@gmail.com' ? 'super_admin' : 'user',
//           approved_at: email === 'dinkomax@gmail.com' ? new Date().toISOString() : null,
//         };

//         const { error: profileError } = await supabase
//           .from('users')
//           .insert([userData]);

//         if (profileError) {
//           console.error('Error creating user profile:', profileError);
//           return { error: 'Failed to create user profile' };
//         }
//       }

//       return { error: null };
//     } catch (error) {
//       return { error: error instanceof Error ? error.message : 'Failed to sign up' };
//     }
//   };

//   const signIn = async (email: string, password: string) => {
//     try {
//       const { error } = await supabase.auth.signInWithPassword({
//         email,
//         password,
//       });

//       if (error) {
//         return { error: error.message };
//       }

//       return { error: null };
//     } catch (error) {
//       return { error: error instanceof Error ? error.message : 'Failed to sign in' };
//     }
//   };

//   const signOut = async () => {
//     try {
//       const { error } = await supabase.auth.signOut();
      
//       if (error) {
//         return { error: error.message };
//       }

//       setUser(null);
//       setSession(null);
//       return { error: null };
//     } catch (error) {
//       return { error: error instanceof Error ? error.message : 'Failed to sign out' };
//     }
//   };

//   const resetPassword = async (email: string) => {
//     try {
//       const { error } = await supabase.auth.resetPasswordForEmail(email);
      
//       if (error) {
//         return { error: error.message };
//       }

//       return { error: null };
//     } catch (error) {
//       return { error: error instanceof Error ? error.message : 'Failed to reset password' };
//     }
//   };

//   const value = {
//     user,
//     session,
//     loading,
//     signUp,
//     signIn,
//     signOut,
//     resetPassword,
//   };

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   );
// };