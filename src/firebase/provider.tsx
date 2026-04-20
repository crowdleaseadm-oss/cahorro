'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseStorage } from 'firebase/storage';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
}

// Internal state for user authentication
interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Combined state for the Firebase context
export interface FirebaseContextState {
  areServicesAvailable: boolean; // True if core services (app, firestore, auth instance) are provided
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null; // The Auth service instance
  storage: FirebaseStorage | null;
  // User authentication state
  user: User | null;
  isUserLoading: boolean; // True during initial auth check
  userError: Error | null; // Error from auth listener
}

// Return type for useFirebase()
export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Return type for useUser() - specific to user auth state
export interface UserHookResult { // Renamed from UserAuthHookResult for consistency if desired, or keep as UserAuthHookResult
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

/**
 * FirebaseProvider manages and provides Firebase services and user authentication state.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
  storage,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true, // Start loading until first auth event
    userError: null,
  });

  // Effect to subscribe to Firebase auth state changes
  useEffect(() => {
    if (!auth) { // If no Auth service instance, cannot determine user state
      setUserAuthState({ user: null, isUserLoading: false, userError: new Error("Auth service not provided.") });
      return;
    }

    setUserAuthState({ user: null, isUserLoading: true, userError: null }); // Reset on auth instance change

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => { // Auth state determined
        if (firebaseUser) {
          // Si el usuario existe en Auth, verificamos si existe su documento en Firestore
          // Si no existe (y no es un email de admin protegido), forzamos el logout para evitar "fantasmas"
          // NOTA: No usamos useDoc aquí porque estamos dentro de un useEffect de bajo nivel
          const { doc, getDoc, getFirestore } = await import('firebase/firestore');
          const db = getFirestore(firebaseApp);
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          const isProtected = 
            firebaseUser.email === 'crowd.lease.adm@gmail.com' || 
            firebaseUser.email === 'admin@circulodeahorro.com';

          if (!userDoc.exists() && !isProtected && !firebaseUser.isAnonymous) {
            console.log("Auth user found but missing Firestore record (Database wiped). Auto-repairing session...");
            const { setDoc, serverTimestamp } = await import('firebase/firestore');
            await setDoc(doc(db, 'users', firebaseUser.uid), {
              id: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario Restaurado',
              role: 'user',
              status: 'Active',
              createdAt: serverTimestamp()
            });
            // El flujo continuará normalmente y se autoreparará
          }
        } else {
          // Si no hay usuario (invitado), iniciamos sesión anónima para habilitar el acceso a Firestore
          // según las reglas de seguridad que requieren auth != null.
          const { signInAnonymously } = await import('firebase/auth');
          try {
            await signInAnonymously(auth);
            // No hacemos nada más, onAuthStateChanged se disparará de nuevo al completar el login
          } catch (e) {
            console.error("FirebaseProvider: Error al iniciar sesión anónima:", e);
          }
        }
        setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null });
      },
      (error) => { // Auth listener error
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );
    return () => unsubscribe(); // Cleanup
  }, [auth]); // Depends on the auth instance

  // Memoize the context value
  const contextValue = useMemo((): FirebaseContextState => {
    // Only app, firestore, and auth are "critical" for most core logic.
    // Storage is needed for KYC but the app can still boot without it if there's an initialization lag.
    const hasCore = !!(firebaseApp && firestore && auth);
    const hasAll = !!(hasCore && storage);
    
    return {
      areServicesAvailable: hasCore,
      firebaseApp: firebaseApp || null,
      firestore: firestore || null,
      auth: auth || null,
      storage: storage || null,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
    };
  }, [firebaseApp, firestore, auth, storage, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

/**
 * Hook to access core Firebase services and user authentication state.
 * Throws error if core services are not available or used outside provider.
 */
export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  if (!context?.areServicesAvailable || !context?.firebaseApp) {
    const missing = [];
    if (!context?.firebaseApp) missing.push('App');
    if (!context?.firestore) missing.push('Firestore');
    if (!context?.auth) missing.push('Auth');
    
    throw new Error(`Firebase core services not available (Missing: ${missing.join(', ')}). Check FirebaseProvider props.`);
  }

  // Storage check is separate to allow better debugging
  if (!context?.storage) {
    console.warn("Firebase Storage is not available in the current context.");
  }

  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    storage: context.storage,
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

/** Hook to access Firebase Auth instance. */
export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

/** Hook to access Firestore instance. */
export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

/** Hook to access Firebase Storage instance. */
export const useStorage = (): FirebaseStorage => {
  const { storage } = useFirebase();
  return storage;
};

/** Hook to access Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}

/**
 * Hook specifically for accessing the authenticated user's state.
 * This provides the User object, loading status, and any auth errors.
 * @returns {UserHookResult} Object with user, isUserLoading, userError.
 */
export const useUser = (): UserHookResult => { // Renamed from useAuthUser
  const { user, isUserLoading, userError } = useFirebase(); // Leverages the main hook
  return { user, isUserLoading, userError };
};