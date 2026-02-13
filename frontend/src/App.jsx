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
import ProfilePage from "./pages/ProfilePage";
import LeaderboardPage from "./pages/LeaderboardPage";
import AdminPage from "./pages/AdminPage";
import AdminRoute from "./components/AdminRoute";
import SchedulePage from "./pages/SchedulePage";
import ResumePage from "./pages/ResumePage";
import InterviewPage from "./pages/InterviewPage";
import AIAssistant from "./components/AIAssistant";

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

function PublicRoute({ children }) {
    const { isSignedIn, isLoaded } = useAuth();

    if (!isClerkConfigured) {
        if (!isLoaded) return null;
        if (isSignedIn) {
            return <Navigate to="/dashboard" replace />;
        }
        return <>{children}</>;
    }

    return (
        <>
            <SignedIn>
                <Navigate to="/dashboard" replace />
            </SignedIn>
            <SignedOut>{children}</SignedOut>
        </>
    );
}

function App() {
    return (
        <div className="min-h-screen bg-dark">
            <Navbar />
            <main className="pt-16">
                <Routes>
                    <Route
                        path="/"
                        element={<HomePage />}
                    />
                    <Route
                        path="/sign-in/*"
                        element={
                            <PublicRoute>
                                <SignInPage />
                            </PublicRoute>
                        }
                    />
                    <Route
                        path="/sign-up/*"
                        element={
                            <PublicRoute>
                                <SignUpPage />
                            </PublicRoute>
                        }
                    />
                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute>
                                <ProfilePage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/interviews"
                        element={
                            <ProtectedRoute>
                                <SchedulePage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/resume"
                        element={
                            <ProtectedRoute>
                                <ResumePage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/room/:id"
                        element={
                            <ProtectedRoute>
                                <InterviewPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/leaderboard"
                        element={
                            <ProtectedRoute>
                                <LeaderboardPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin"
                        element={
                            <AdminRoute>
                                <AdminPage />
                            </AdminRoute>
                        }
                    />
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
            <AIAssistant />
        </div>
    );
}

export default App;
