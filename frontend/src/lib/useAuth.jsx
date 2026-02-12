import * as ClerkReact from "@clerk/clerk-react";
import { useState, useEffect, useCallback, createContext, useContext } from "react";

export const isClerkConfigured =
    import.meta.env.VITE_CLERK_PUBLISHABLE_KEY &&
    import.meta.env.VITE_CLERK_PUBLISHABLE_KEY.startsWith("pk_");

// ─── Custom Auth Context ───────────────────────────────────────────
const AuthContext = createContext(null);

export function CustomAuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const savedToken = localStorage.getItem("auth_token");
            const savedUser = localStorage.getItem("auth_user");
            if (savedToken && savedUser) {
                setToken(savedToken);
                setUser(JSON.parse(savedUser));
            }
        } catch (e) {
            localStorage.removeItem("auth_token");
            localStorage.removeItem("auth_user");
        }
        setIsLoaded(true);
    }, []);

    const login = useCallback((tokenValue, userData) => {
        setToken(tokenValue);
        setUser(userData);
        localStorage.setItem("auth_token", tokenValue);
        localStorage.setItem("auth_user", JSON.stringify(userData));
    }, []);

    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
    }, []);

    const updateUser = useCallback((userData) => {
        setUser(userData);
        localStorage.setItem("auth_user", JSON.stringify(userData));
    }, []);

    return (
        <AuthContext.Provider value={{ user, token, isLoaded, isSignedIn: !!token, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

// ─── Hooks ─────────────────────────────────────────────────────────

/**
 * Safe wrapper around auth hooks.
 * Uses Clerk when configured, otherwise uses custom auth context.
 */
export function useAuth() {
    if (isClerkConfigured) {
        return ClerkReact.useAuth();
    }
    const ctx = useContext(AuthContext);
    if (!ctx) {
        return {
            getToken: () => Promise.resolve(null),
            isSignedIn: false,
            isLoaded: true,
            userId: null,
            signOut: () => Promise.resolve(),
        };
    }
    return {
        getToken: () => Promise.resolve(ctx.token),
        isSignedIn: ctx.isSignedIn,
        isLoaded: ctx.isLoaded,
        userId: ctx.user?._id || null,
        signOut: ctx.logout,
    };
}

export function useUser() {
    if (isClerkConfigured) {
        return ClerkReact.useUser();
    }
    const ctx = useContext(AuthContext);
    if (!ctx) {
        return { user: null, isLoaded: true, isSignedIn: false };
    }
    return {
        user: ctx.user
            ? {
                id: ctx.user._id,
                fullName: ctx.user.name,
                firstName: ctx.user.name?.split(" ")[0],
                imageUrl: ctx.user.image,
                emailAddresses: [{ emailAddress: ctx.user.email }],
                primaryEmailAddress: { emailAddress: ctx.user.email },
            }
            : null,
        isLoaded: ctx.isLoaded,
        isSignedIn: ctx.isSignedIn,
    };
}

/**
 * Hook to access custom auth functions (login, logout, register responses)
 */
export function useCustomAuth() {
    const ctx = useContext(AuthContext);
    return ctx || { user: null, token: null, isLoaded: true, isSignedIn: false, login: () => { }, logout: () => { }, updateUser: () => { } };
}

// ─── Wrapper Components ────────────────────────────────────────────

export function SignedIn({ children }) {
    if (isClerkConfigured) {
        return <ClerkReact.SignedIn>{children}</ClerkReact.SignedIn>;
    }
    const ctx = useContext(AuthContext);
    if (!ctx?.isSignedIn) return null;
    return <>{children}</>;
}

export function SignedOut({ children }) {
    if (isClerkConfigured) {
        return <ClerkReact.SignedOut>{children}</ClerkReact.SignedOut>;
    }
    const ctx = useContext(AuthContext);
    if (ctx?.isSignedIn) return null;
    return <>{children}</>;
}

export function UserButton(props) {
    if (isClerkConfigured) {
        return <ClerkReact.UserButton {...props} />;
    }
    // Custom auth shows a simple avatar button - handled in Navbar
    return null;
}

export function RedirectToSignIn(props) {
    if (isClerkConfigured) {
        return <ClerkReact.RedirectToSignIn {...props} />;
    }
    return null;
}
