import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  inMemoryPersistence,
  browserSessionPersistence,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User, Role } from '../types';

// Security Configuration
const SECURITY_CONFIG = {
  MIN_PASSWORD_LENGTH: 8,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
};

// Helper to convert Firebase User to App User
const mapFirebaseUserToAppUser = async (firebaseUser: FirebaseUser): Promise<User | null> => {
  try {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        id: firebaseUser.uid,
        name: userData.name || firebaseUser.displayName || 'Usuario',
        email: firebaseUser.email || '',
        role: userData.role || Role.DEVELOPER,
        avatar: userData.avatar || firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'User')}&background=random`
      };
    }
    return null;
  } catch (error) {
    console.error('Error mapping Firebase user:', error);
    return null;
  }
};

export const firebaseAuthService = {
  init: async (): Promise<void> => {
    try {
      await setPersistence(auth, browserSessionPersistence);

      // Safety check: If this is a completely new window/tab session (marker missing),
      // we force a sign-out to ensure any previous 'LOCAL' persistence tokens are cleared.
      // sessionStorage persists across refreshes but NOT across browser/tab closure.
      if (!sessionStorage.getItem('pig_auth_session_active')) {
        await signOut(auth);
        sessionStorage.setItem('pig_auth_session_active', 'ready');
      }
    } catch (error) {
      console.error('Error setting persistence:', error);
    }
  },

  validatePasswordStrength: (password: string): { valid: boolean; message?: string } => {
    if (password.length < SECURITY_CONFIG.MIN_PASSWORD_LENGTH) {
      return {
        valid: false,
        message: `La contraseña debe tener al menos ${SECURITY_CONFIG.MIN_PASSWORD_LENGTH} caracteres`
      };
    }
    if (!SECURITY_CONFIG.PASSWORD_REGEX.test(password)) {
      return {
        valid: false,
        message: 'La contraseña debe incluir mayúscula, minúscula, número y carácter especial'
      };
    }
    return { valid: true };
  },

  register: async (
    name: string,
    email: string,
    password: string,
    role: Role = Role.DEVELOPER
  ): Promise<User> => {
    try {
      // Validate password strength
      const strength = firebaseAuthService.validatePasswordStrength(password);
      if (!strength.valid) {
        throw new Error(strength.message);
      }

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Update profile with display name
      await updateProfile(firebaseUser, {
        displayName: name
      });

      // Create user document in Firestore
      const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
      const userDoc = {
        name,
        email,
        role,
        avatar,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), userDoc);

      return {
        id: firebaseUser.uid,
        name,
        email,
        role,
        avatar
      };
    } catch (error: any) {
      console.error('Registration error:', error);

      // Handle Firebase Auth errors
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('El email ya está registrado');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Email inválido');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('La contraseña es muy débil');
      }

      throw new Error(error.message || 'Error al registrar usuario');
    }
  },

  login: async (email: string, password: string): Promise<User> => {
    try {
      await setPersistence(auth, browserSessionPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = await mapFirebaseUserToAppUser(userCredential.user);

      if (!user) {
        throw new Error('No se pudo obtener la información del usuario');
      }

      return user;
    } catch (error: any) {
      console.error('Login error:', error);

      // Handle Firebase Auth errors
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        throw new Error('Credenciales inválidas');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Email inválido');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Demasiados intentos fallidos. Por favor intenta más tarde.');
      }

      throw new Error(error.message || 'Error al iniciar sesión');
    }
  },

  logout: async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Error al cerrar sesión');
    }
  },

  getCurrentUser: async (): Promise<User | null> => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;

    return await mapFirebaseUserToAppUser(firebaseUser);
  },

  onAuthStateChange: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const user = await mapFirebaseUserToAppUser(firebaseUser);
        callback(user);
      } else {
        callback(null);
      }
    });
  }
};