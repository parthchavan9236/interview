import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import { isClerkConfigured, CustomAuthProvider } from "./lib/useAuth";
import "./index.css";

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!isClerkConfigured) {
    console.info(
        "ℹ️ Running with custom JWT auth (Clerk not configured).\n" +
        "For Clerk auth, add VITE_CLERK_PUBLISHABLE_KEY=pk_test_... to frontend/.env"
    );
}

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5,
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

import { dark } from "@clerk/themes";

const clerkAppearance = {
    baseTheme: dark,
    variables: {
        colorPrimary: "#6366f1",
        colorBackground: "#1a1a2e",
        colorText: "#f1f5f9",
        colorInputBackground: "#16213e",
        colorInputText: "#f1f5f9",
        borderRadius: "0.75rem",
    },
    elements: {
        card: "bg-dark-50 border border-dark-400/30",
        formButtonPrimary: "btn-primary",
        // Force text color on menu items just in case
        userButtonPopoverCard: "bg-dark-50 border border-dark-400/30 text-white",
        userButtonPopoverActionButton: "text-gray-200 hover:text-white hover:bg-dark-400/50",
        userButtonPopoverActionButtonIcon: "text-gray-400",
        userButtonPopoverFooter: "hidden" // Optional: hide footer if it looks bad
    },
};

function AppWithProviders() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <App />
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 3000,
                        style: {
                            background: "#1a1a2e",
                            color: "#f1f5f9",
                            border: "1px solid rgba(99, 102, 241, 0.3)",
                            borderRadius: "0.75rem",
                        },
                    }}
                />
            </BrowserRouter>
        </QueryClientProvider>
    );
}

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        {isClerkConfigured ? (
            <ClerkProvider
                publishableKey={CLERK_KEY}
                appearance={clerkAppearance}
                afterSignOutUrl="/"
            >
                <CustomAuthProvider>
                    <AppWithProviders />
                </CustomAuthProvider>
            </ClerkProvider>
        ) : (
            <CustomAuthProvider>
                <AppWithProviders />
            </CustomAuthProvider>
        )}
    </React.StrictMode>
);
