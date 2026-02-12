import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
    SignedIn,
    SignedOut,
    UserButton,
    useUser,
    useAuth,
    isClerkConfigured,
    useCustomAuth,
} from "../lib/useAuth";
import { syncUser, setAuthToken } from "../lib/api";
import {
    Code2,
    Menu,
    X,
    Home,
    BookOpen,
    Users,
    LogOut,
    LayoutDashboard,
    LogIn,
    UserPlus,
    User,
} from "lucide-react";
import toast from "react-hot-toast";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, isLoaded } = useUser();
    const { getToken, isSignedIn } = useAuth();
    const customAuth = useCustomAuth();

    // Close mobile menu on route change
    useEffect(() => {
        setIsOpen(false);
    }, [location.pathname]);

    // Prevent body scroll when menu is open
    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    // Sync Clerk user to backend
    useEffect(() => {
        const sync = async () => {
            if (isClerkConfigured && user && isLoaded) {
                try {
                    const token = await getToken();
                    setAuthToken(token);
                    await syncUser({
                        clerkId: user.id,
                        name: user.fullName || user.firstName || "User",
                        email: user.primaryEmailAddress?.emailAddress || "",
                        image: user.imageUrl || "",
                    });
                } catch (err) {
                    console.error("User sync error:", err);
                }
            }
        };
        sync();
    }, [user, isLoaded]);

    // Keep Clerk token updated
    useEffect(() => {
        const updateToken = async () => {
            if (isClerkConfigured && isLoaded && user) {
                const token = await getToken();
                setAuthToken(token);
            }
        };
        updateToken();
    }, [isLoaded, user]);

    // Scroll listener
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleCustomLogout = () => {
        customAuth.logout();
        toast.success("Logged out successfully");
        navigate("/");
    };

    const navLinks = [
        { path: "/", label: "Home", icon: Home },
        ...(isSignedIn ? [{ path: "/dashboard", label: "Dashboard", icon: LayoutDashboard }] : []),
        { path: "/problems", label: "Problems", icon: BookOpen },
        { path: "/interviews", label: "Interviews", icon: Users },
    ];

    const isActive = (path) => location.pathname === path;

    // Custom auth user info
    const customUser = customAuth?.user;
    const customUserInitial = customUser?.name?.charAt(0)?.toUpperCase() || "U";

    const renderDesktopAuth = () => {
        if (isClerkConfigured) {
            return (
                <>
                    <SignedOut>
                        <Link to="/sign-in" className="btn-secondary text-sm px-4 py-2">
                            Sign In
                        </Link>
                        <Link to="/sign-up" className="btn-primary text-sm px-4 py-2">
                            Get Started
                        </Link>
                    </SignedOut>
                    <SignedIn>
                        <UserButton
                            afterSignOutUrl="/"
                            appearance={{
                                elements: {
                                    avatarBox: "w-9 h-9 ring-2 ring-primary-500/30",
                                },
                            }}
                        />
                    </SignedIn>
                </>
            );
        }

        // Custom auth
        if (customAuth?.isSignedIn) {
            return (
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2.5">
                        {customUser?.image ? (
                            <img src={customUser.image} alt={customUser.name} className="w-8 h-8 rounded-full ring-2 ring-primary-500/30" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold ring-2 ring-primary-500/30">
                                {customUserInitial}
                            </div>
                        )}
                        <span className="text-sm text-gray-300 font-medium hidden lg:block max-w-[120px] truncate">
                            {customUser?.name}
                        </span>
                    </div>
                    <button
                        onClick={() => navigate("/profile")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-dark-300/50 transition-all"
                    >
                        <User className="w-4 h-4" />
                        <span className="hidden lg:inline">Profile</span>
                    </button>
                    <button
                        onClick={handleCustomLogout}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-dark-300/50 transition-all"
                        aria-label="Sign out"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden lg:inline">Logout</span>
                    </button>
                </div>
            );
        }

        return (
            <div className="flex items-center gap-2">
                <Link to="/sign-in" className="btn-secondary text-sm px-4 py-2 flex items-center gap-1.5">
                    <LogIn className="w-3.5 h-3.5" />
                    Sign In
                </Link>
                <Link to="/sign-up" className="btn-primary text-sm px-4 py-2 flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5" />
                    Sign Up
                </Link>
            </div>
        );
    };

    const renderMobileAuth = () => {
        if (isClerkConfigured) {
            return (
                <div className="pt-4 mt-4 border-t border-dark-400/30">
                    <SignedOut>
                        <div className="space-y-3">
                            <Link to="/sign-in" className="block text-center btn-secondary text-sm py-3">
                                Sign In
                            </Link>
                            <Link to="/sign-up" className="block text-center btn-primary text-sm py-3">
                                Get Started
                            </Link>
                        </div>
                    </SignedOut>
                    <SignedIn>
                        <div className="flex justify-center">
                            <UserButton afterSignOutUrl="/" />
                        </div>
                    </SignedIn>
                </div>
            );
        }

        // Custom auth
        if (customAuth?.isSignedIn) {
            return (
                <div className="pt-4 mt-4 border-t border-dark-400/30">
                    <div className="flex items-center gap-3 px-4 py-3 bg-dark-300/30 rounded-xl mb-3">
                        {customUser?.image ? (
                            <img src={customUser.image} alt={customUser.name} className="w-10 h-10 rounded-full ring-2 ring-primary-500/30" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold ring-2 ring-primary-500/30">
                                {customUserInitial}
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-200 truncate">{customUser?.name}</p>
                            <p className="text-xs text-gray-500 truncate">{customUser?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleCustomLogout}
                        className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            );
        }

        return (
            <div className="pt-4 mt-4 border-t border-dark-400/30 space-y-3">
                <Link to="/sign-in" className="block text-center btn-secondary text-sm py-3">
                    Sign In
                </Link>
                <Link to="/sign-up" className="block text-center btn-primary text-sm py-3">
                    Sign Up
                </Link>
            </div>
        );
    };

    return (
        <>
            <nav
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
                    ? "bg-dark/90 backdrop-blur-xl border-b border-dark-400/30 shadow-lg shadow-black/20"
                    : "bg-dark/50 backdrop-blur-md"
                    }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2.5 group">
                            <div className="relative">
                                <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25 group-hover:shadow-primary-500/40 transition-all duration-300 group-hover:scale-110">
                                    <Code2 className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                                Code<span className="text-primary-400">Interview</span>
                            </span>
                        </Link>

                        {/* Desktop Nav Links */}
                        <div className="hidden md:flex items-center gap-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${isActive(link.path)
                                        ? "bg-primary-500/15 text-primary-400 border border-primary-500/30"
                                        : "text-gray-400 hover:text-gray-200 hover:bg-dark-300/50"
                                        }`}
                                >
                                    <link.icon className="w-4 h-4" />
                                    {link.label}
                                </Link>
                            ))}
                        </div>

                        {/* Desktop Auth */}
                        <div className="hidden md:flex items-center gap-3">
                            {renderDesktopAuth()}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="md:hidden p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-dark-300/50 transition-all touch-target"
                            aria-label={isOpen ? "Close menu" : "Open menu"}
                            aria-expanded={isOpen}
                        >
                            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Mobile Menu Panel */}
            {isOpen && (
                <div className="md:hidden fixed top-16 left-0 right-0 z-50 bg-dark-50/98 backdrop-blur-xl border-b border-dark-400/30 shadow-2xl shadow-black/40 animate-slide-down max-h-[calc(100vh-4rem)] overflow-y-auto safe-bottom">
                    <div className="px-4 py-4 space-y-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all ${isActive(link.path)
                                    ? "bg-primary-500/15 text-primary-400 border border-primary-500/30"
                                    : "text-gray-400 hover:text-white hover:bg-dark-300/50"
                                    }`}
                            >
                                <link.icon className="w-5 h-5" />
                                {link.label}
                            </Link>
                        ))}
                        {renderMobileAuth()}
                    </div>
                </div>
            )}
        </>
    );
}
