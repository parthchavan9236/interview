import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SignUp } from "@clerk/clerk-react";
import { isClerkConfigured, useCustomAuth } from "../lib/useAuth";
import { registerUser } from "../lib/api";
import { Code2, Mail, Lock, Eye, EyeOff, ArrowRight, User, Users, Briefcase } from "lucide-react";
import toast from "react-hot-toast";

function CustomSignUp() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "candidate",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useCustomAuth();

    const updateField = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { name, email, password, confirmPassword, role } = formData;

        if (!name || !email || !password) {
            toast.error("Please fill in all required fields");
            return;
        }
        if (password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }
        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setIsLoading(true);
        try {
            const res = await registerUser({ name, email, password, role });
            login(res.data.token, res.data.user);
            toast.success("Account created successfully!");
            navigate("/dashboard");
        } catch (error) {
            toast.error(error.response?.data?.message || "Registration failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8 sm:py-12">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[30%] -left-[15%] w-[50%] h-[50%] bg-gradient-to-br from-purple-500/10 via-primary-500/5 to-transparent rounded-full blur-3xl" />
                <div className="absolute -bottom-[20%] -right-[15%] w-[40%] h-[40%] bg-gradient-to-tr from-primary-500/8 via-pink-500/5 to-transparent rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md animate-fade-in">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl mb-4 shadow-lg shadow-primary-500/25">
                        <Code2 className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Create Account</h1>
                    <p className="text-gray-400 text-sm">Join CodeInterview and start your journey</p>
                </div>

                {/* Form Card */}
                <div className="card p-6 sm:p-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => updateField("name", e.target.value)}
                                    className="input pl-10 w-full"
                                    placeholder="John Doe"
                                    required
                                    autoComplete="name"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => updateField("email", e.target.value)}
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
                                    value={formData.password}
                                    onChange={(e) => updateField("password", e.target.value)}
                                    className="input pl-10 pr-10 w-full"
                                    placeholder="Min. 6 characters"
                                    required
                                    autoComplete="new-password"
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

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={formData.confirmPassword}
                                    onChange={(e) => updateField("confirmPassword", e.target.value)}
                                    className="input pl-10 w-full"
                                    placeholder="Re-enter password"
                                    required
                                    autoComplete="new-password"
                                />
                            </div>
                        </div>

                        {/* Role Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2.5">Select Your Role</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => updateField("role", "candidate")}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-300 ${formData.role === "candidate"
                                        ? "border-primary-500 bg-primary-500/10 text-primary-300"
                                        : "border-dark-400/30 bg-dark-300/20 text-gray-400 hover:border-dark-400/60"
                                        }`}
                                >
                                    <Users className="w-5 h-5" />
                                    <span className="text-sm font-medium">Candidate</span>
                                    <span className="text-xs opacity-70">Take interviews</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => updateField("role", "interviewer")}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-300 ${formData.role === "interviewer"
                                        ? "border-primary-500 bg-primary-500/10 text-primary-300"
                                        : "border-dark-400/30 bg-dark-300/20 text-gray-400 hover:border-dark-400/60"
                                        }`}
                                >
                                    <Briefcase className="w-5 h-5" />
                                    <span className="text-sm font-medium">Interviewer</span>
                                    <span className="text-xs opacity-70">Conduct interviews</span>
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-base font-semibold mt-2"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Create Account
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer Link */}
                <p className="text-center mt-6 text-sm text-gray-400">
                    Already have an account?{" "}
                    <Link to="/sign-in" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                        Sign in
                    </Link>
                </p>

                {/* Platform Trust Indicators */}
                <div className="mt-8 grid grid-cols-3 gap-3">
                    {[
                        { label: "Practice", sub: "50+ Coding Problems" },
                        { label: "Interview", sub: "Live Video Rooms" },
                        { label: "Compete", sub: "Contest Mode" },
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

export default function SignUpPage() {
    if (isClerkConfigured) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
                <div className="animate-fade-in">
                    <SignUp
                        routing="path"
                        path="/sign-up"
                        signInUrl="/sign-in"
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

    return <CustomSignUp />;
}
