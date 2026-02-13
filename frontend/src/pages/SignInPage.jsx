import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SignIn } from "@clerk/clerk-react";
import { isClerkConfigured, useCustomAuth } from "../lib/useAuth";
import { loginUser } from "../lib/api";
import { Code2, Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

function CustomSignIn() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useCustomAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error("Please fill in all fields");
            return;
        }
        setIsLoading(true);
        try {
            const res = await loginUser({ email, password });
            login(res.data.token, res.data.user);
            toast.success(`Welcome back, ${res.data.user.name}!`);
            navigate("/dashboard");
        } catch (error) {
            toast.error(error.response?.data?.message || "Login failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8 sm:py-12">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[30%] -right-[15%] w-[50%] h-[50%] bg-gradient-to-br from-primary-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl" />
                <div className="absolute -bottom-[20%] -left-[15%] w-[40%] h-[40%] bg-gradient-to-tr from-primary-500/8 via-blue-500/5 to-transparent rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md animate-fade-in">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl mb-4 shadow-lg shadow-primary-500/25">
                        <Code2 className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Welcome Back</h1>
                    <p className="text-gray-400 text-sm">Sign in to your CodeInterview account</p>
                </div>

                {/* Form Card */}
                <div className="card p-6 sm:p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input pl-10 w-full"
                                    placeholder="you@example.com"
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input pl-10 pr-10 w-full"
                                    placeholder="••••••••"
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-base font-semibold"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-6">
                        <div className="flex-1 h-px bg-dark-400/30" />
                        <span className="text-xs text-gray-500 uppercase tracking-wider">or</span>
                        <div className="flex-1 h-px bg-dark-400/30" />
                    </div>

                    {/* Demo Credentials */}
                    <div className="bg-primary-500/5 border border-primary-500/20 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-3.5 h-3.5 text-primary-400" />
                            <span className="text-xs font-medium text-primary-300">Demo Account</span>
                        </div>
                        <p className="text-xs text-gray-400">
                            Don't have an account?{" "}
                            <Link to="/sign-up" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                                Create one for free
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer Link */}
                <p className="text-center mt-6 text-sm text-gray-400">
                    Don't have an account?{" "}
                    <Link to="/sign-up" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                        Sign up
                    </Link>
                </p>

                {/* Platform Highlights */}
                <div className="mt-8 grid grid-cols-3 gap-3">
                    {[
                        { label: "50+ Problems", sub: "DSA & Algorithms" },
                        { label: "Live Interviews", sub: "WebRTC Video Rooms" },
                        { label: "AI Assistant", sub: "Smart Code Help" },
                    ].map((item) => (
                        <div key={item.label} className="text-center p-2 rounded-lg bg-dark-300/20">
                            <div className="text-xs font-semibold text-gray-300">{item.label}</div>
                            <div className="text-[10px] text-gray-500">{item.sub}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function SignInPage() {
    if (isClerkConfigured) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
                <div className="animate-fade-in">
                    <SignIn
                        routing="path"
                        path="/sign-in"
                        signUpUrl="/sign-up"
                        appearance={{
                            elements: {
                                rootBox: "mx-auto",
                                card: "bg-dark-50 border border-dark-400/30 shadow-2xl shadow-black/50",
                                headerTitle: "text-white",
                                headerSubtitle: "text-gray-400",
                                formButtonPrimary:
                                    "bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/25",
                                formFieldInput:
                                    "bg-dark-100 border-dark-400/50 text-white focus:border-primary-500",
                                formFieldLabel: "text-gray-400",
                                footerActionLink: "text-primary-400 hover:text-primary-300",
                                identityPreviewEditButton: "text-primary-400",
                                dividerLine: "bg-dark-400/30",
                                dividerText: "text-gray-500",
                                socialButtonsBlockButton:
                                    "bg-dark-100 border-dark-400/50 text-gray-300 hover:bg-dark-200",
                                socialButtonsBlockButtonText: "text-gray-300",
                            },
                        }}
                    />
                </div>
            </div>
        );
    }

    return <CustomSignIn />;
}
