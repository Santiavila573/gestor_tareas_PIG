import { User, Role } from '../types';
import { MOCK_USERS } from '../constants';

const USERS_KEY = 'pig_users_v3';
const SESSION_KEY = 'pig_current_session_user';
const CURRENT_USER_KEY = 'pig_current_user';
const APP_SALT = 'PIG_SECURE_SALT_v1';

// Security Configuration
const SECURITY_CONFIG = {
    MAX_ATTEMPTS: 5,
    LOCKOUT_TIME: 60 * 1000, // 1 minute
    MIN_PASSWORD_LENGTH: 8,
    // Minimum 1 uppercase, 1 lowercase, 1 number, 1 special char
    PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
};

// Rate limiting state (In-memory)
interface RateLimit {
    count: number;
    lastAttempt: number;
}
const loginAttempts: Record<string, RateLimit> = {};

// In-memory session state (Clears on reload)
let currentUser: User | null = null;

// --- Security Helpers ---

// SHA-256 Hashing with Salt
const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + APP_SALT);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Basic Input Sanitization (XSS Prevention)
const sanitizeInput = (input: string): string => {
    return input.trim().replace(/[<>]/g, '');
};

// Rate Limiter Check
const checkRateLimit = (email: string): boolean => {
    const now = Date.now();
    const attempt = loginAttempts[email];

    if (attempt) {
        if (now - attempt.lastAttempt < SECURITY_CONFIG.LOCKOUT_TIME) {
            if (attempt.count >= SECURITY_CONFIG.MAX_ATTEMPTS) {
                return false;
            }
        } else {
            // Reset if lockout time passed
            delete loginAttempts[email];
        }
    }
    return true;
};

// Rate Limiter Increment
const recordFailedAttempt = (email: string) => {
    const now = Date.now();
    const attempt = loginAttempts[email] || { count: 0, lastAttempt: now };
    attempt.count++;
    attempt.lastAttempt = now;
    loginAttempts[email] = attempt;
};

// Clear attempts on success
const resetLoginAttempts = (email: string) => {
    delete loginAttempts[email];
};

export const authService = {
    // Initialize and migrate mock users to secure storage
    init: async () => {
        // Clear any legacy session from localStorage
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(CURRENT_USER_KEY);

        const storedUsers = localStorage.getItem(USERS_KEY);
        if (!storedUsers) {
            // Hash mock users before storing
            const secureMockUsers = await Promise.all(MOCK_USERS.map(async (user) => ({
                ...user,
                password: await hashPassword(user.password || 'Password123!') // Ensure default meets requirements for consistency
            })));
            localStorage.setItem(USERS_KEY, JSON.stringify(secureMockUsers));
        }
    },

    validatePasswordStrength: (password: string): { valid: boolean; message?: string } => {
        if (password.length < SECURITY_CONFIG.MIN_PASSWORD_LENGTH) {
            return { valid: false, message: `La contraseña debe tener al menos ${SECURITY_CONFIG.MIN_PASSWORD_LENGTH} caracteres` };
        }
        if (!SECURITY_CONFIG.PASSWORD_REGEX.test(password)) {
            return { valid: false, message: 'La contraseña debe incluir mayúscula, minúscula, número y carácter especial' };
        }
        return { valid: true };
    },

    register: (name: string, email: string, password: string, role: Role = Role.DEVELOPER): Promise<User> => {
        return new Promise(async (resolve, reject) => {
            try {
                // 1. Sanitize Inputs
                const cleanName = sanitizeInput(name);
                const cleanEmail = sanitizeInput(email).toLowerCase();

                // 2. Validate Password Strength
                const strength = authService.validatePasswordStrength(password);
                if (!strength.valid) {
                    reject(strength.message);
                    return;
                }

                setTimeout(async () => {
                    const storedUsers = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');

                    if (storedUsers.some((u: User) => u.email === cleanEmail)) {
                        reject('El email ya está registrado');
                        return;
                    }

                    // 3. Hash Password
                    const hashedPassword = await hashPassword(password);

                    const newUser: User = {
                        id: `u${Date.now()}`,
                        name: cleanName,
                        email: cleanEmail,
                        role,
                        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=random`,
                        password: hashedPassword // Store only hash
                    };

                    const updatedUsers = [...storedUsers, newUser];
                    localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));

                    // Auto-login (Session lost on browser/tab close)
                    currentUser = newUser;
                    sessionStorage.setItem(SESSION_KEY, JSON.stringify(newUser));

                    resolve(newUser);
                }, 800);
            } catch (error) {
                reject('Error de seguridad al procesar el registro');
            }
        });
    },

    login: (email: string, password: string): Promise<User> => {
        return new Promise(async (resolve, reject) => {
            const cleanEmail = sanitizeInput(email).toLowerCase();

            // 1. Check Rate Limit
            if (!checkRateLimit(cleanEmail)) {
                reject(`Demasiados intentos fallidos. Por favor espera ${SECURITY_CONFIG.LOCKOUT_TIME / 1000} segundos.`);
                return;
            }

            setTimeout(async () => {
                const storedUsersStr = localStorage.getItem(USERS_KEY);

                // Handle case where init hasn't run or storage is empty
                if (!storedUsersStr) {
                    await authService.init();
                }

                const storedUsers: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');

                // 2. Hash Input Password for Comparison
                const hashedPassword = await hashPassword(password);

                const user = storedUsers.find((u: User) =>
                    u.email.toLowerCase() === cleanEmail && u.password === hashedPassword
                );

                if (user) {
                    resetLoginAttempts(cleanEmail);
                    currentUser = user;
                    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user)); // Persist session for tab only
                    resolve(user);
                } else {
                    recordFailedAttempt(cleanEmail);
                    reject('Credenciales inválidas');
                }
            }, 800); // Artificial delay to prevent timing attacks
        });
    },

    logout: () => {
        currentUser = null;
        sessionStorage.removeItem(SESSION_KEY);
    },

    getCurrentUser: (): User | null => {
        if (!currentUser) {
            const storedSession = sessionStorage.getItem(SESSION_KEY);
            if (storedSession) {
                try {
                    currentUser = JSON.parse(storedSession);
                } catch (e) {
                    sessionStorage.removeItem(SESSION_KEY);
                }
            }
        }
        return currentUser;
    }
};
