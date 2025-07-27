// import React, { createContext, useContext, useEffect, useState } from 'react';
// import { onAuthStateChanged } from 'firebase/auth';
// import { auth } from '../lib/firebase';
// import { firebaseApiClient, User } from '../lib/firebaseApi';

// interface AuthContextType {
//   user: User | null;
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

// export const FirebaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
//       if (firebaseUser) {
//         try {
//           const { user: userData } = await firebaseApiClient.getCurrentUser();
//           setUser(userData);
//         } catch (error) {
//           console.error('Error getting user data:', error);
//           setUser(null);
//         }
//       } else {
//         setUser(null);
//       }
//       setLoading(false);
//     });

//     return unsubscribe;
//   }, []);

//   const signUp = async (email: string, password: string) => {
//     try {
//       const response = await firebaseApiClient.signUp(email, password);
//       setUser(response.user);
//       return { error: null };
//     } catch (error) {
//       return { error: error instanceof Error ? error.message : 'Failed to sign up' };
//     }
//   };

//   const signIn = async (email: string, password: string) => {
//     try {
//       const response = await firebaseApiClient.signIn(email, password);
//       setUser(response.user);
//       return { error: null };
//     } catch (error) {
//       return { error: error instanceof Error ? error.message : 'Failed to sign in' };
//     }
//   };

//   const signOut = async () => {
//     try {
//       await firebaseApiClient.signOut();
//       setUser(null);
//       return { error: null };
//     } catch (error) {
//       return { error: error instanceof Error ? error.message : 'Failed to sign out' };
//     }
//   };

//   const resetPassword = async (email: string) => {
//     try {
//       await firebaseApiClient.resetPassword(email);
//       return { error: null };
//     } catch (error) {
//       return { error: error instanceof Error ? error.message : 'Failed to reset password' };
//     }
//   };

//   const value = {
//     user,
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