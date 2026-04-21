'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

import { getStorage } from 'firebase/storage';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!getApps().length) {
    // Important! initializeApp() is called without any arguments because Firebase App Hosting
    // integrates with the initializeApp() function to provide the environment variables needed to
    // populate the FirebaseOptions in production. It is critical that we attempt to call initializeApp()
    // without arguments.
    let firebaseApp;
    try {
      // Forzar el uso de la config local en desarrollo o ambientes no-Firebase (como Vercel)
      const isDevelopment = process.env.NODE_ENV === "development";
      const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
      const isVercel = process.env.VERCEL === "1" || process.env.NEXT_PUBLIC_VERCEL_ENV !== undefined;

      if (isDevelopment || isLocalhost || isVercel) {
        firebaseApp = initializeApp(firebaseConfig);
      } else {
        // En producción real (Firebase App Hosting), intentar auto-inicialización
        firebaseApp = initializeApp();
      }
    } catch (e) {
      if (process.env.NODE_ENV === "production" && !process.env.VERCEL) {
        console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
      }
      firebaseApp = initializeApp(firebaseConfig);
    }

    return getSdks(firebaseApp);
  }

  // If already initialized, return the SDKs with the already initialized App
  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  let storage = null;
  try {
    storage = getStorage(firebaseApp);
  } catch (e) {
    console.error("Firebase Storage failed to initialize:", e);
  }

  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
    storage
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
