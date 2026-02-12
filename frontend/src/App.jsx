import { Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut, RedirectToSignIn, isClerkConfigured, useAuth } from "./lib/useAuth";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import ProblemsPage from "./pages/ProblemsPage";
import ProblemDetailPage from "./pages/ProblemDetailPage";
import InterviewsPage from "./pages/InterviewsPage";
import InterviewRoomPage from "./pages/InterviewRoomPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import DashboardPage from "./pages/DashboardPage";

function ProtectedRoute({ children }) {
    const { isSignedIn, isLoaded } = useAuth();

    if (!isClerkConfigured) {
        // Custom auth: check if signed in
        if (!isLoaded) return null;
        if (!isSignedIn) {
            return <Navigate to="/sign-in" replace />;
        }
        return <>{children}</>;
    }
    return (
        <>
            <SignedIn>{children}</SignedIn>
            <SignedOut>
                <RedirectToSignIn />
            </SignedOut>
        </>
    );
}

function App() {
    return (
        <div className="min-h-screen bg-dark">
            <Navbar />
            <main className="pt-16">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/sign-in/*" element={<SignInPage />} />
                    <Route path="/sign-up/*" element={<SignUpPage />} />
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <DashboardPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/problems"
                        element={
                            <ProtectedRoute>
                                <ProblemsPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/problems/:id"
                        element={
                            <ProtectedRoute>
                                <ProblemDetailPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/interviews"
                        element={
                            <ProtectedRoute>
                                <InterviewsPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/interview/:id"
                        element={
                            <ProtectedRoute>
                                <InterviewRoomPage />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </main>
        </div>
    );
}

export default App;
