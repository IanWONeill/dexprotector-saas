/**
 * Conditional logger that only logs in development or for admin users
 * Prevents sensitive information from being exposed in production console
 */

let isAdmin = false;

// Check if user is admin (can be called from components)
export const setAdminStatus = (status: boolean) => {
    isAdmin = status;
};

const isDev = process.env.NODE_ENV === 'development';

// Only log if in development mode OR user is admin
const shouldLog = () => isDev || isAdmin;

export const logger = {
    log: (...args: any[]) => {
        if (shouldLog()) {
            console.log(...args);
        }
    },
    error: (...args: any[]) => {
        if (shouldLog()) {
            console.error(...args);
        }
    },
    warn: (...args: any[]) => {
        if (shouldLog()) {
            console.warn(...args);
        }
    },
    info: (...args: any[]) => {
        if (shouldLog()) {
            console.info(...args);
        }
    },
    debug: (...args: any[]) => {
        if (shouldLog()) {
            console.debug(...args);
        }
    },
};
