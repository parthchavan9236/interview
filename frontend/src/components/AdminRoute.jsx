import { Navigate } from "react-router-dom";
import { useAuth, useUser } from "../lib/useAuth";
import LoadingSpinner from "../components/LoadingSpinner";

export default function AdminRoute({ children }) {
    const { isSignedIn, isLoaded } = useAuth();
    const { user } = useUser();

    if (!isLoaded) {
        return (
            <div className="flex justify-center items-center h-screen bg-dark">
                <LoadingSpinner />
            </div>
        );
    }

    if (!isSignedIn || user?.role !== "admin") {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
}
