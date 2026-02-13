import { useState } from "react";
import { Link } from "react-router-dom";
import { SignedIn, SignedOut, isClerkConfigured, useAuth } from "../lib/useAuth";
import {
    Code2,
    Video,
    MessageSquare,
    Shield,
    CheckCircle,
    BookOpen,
    ArrowRight,
    Sparkles,
    Zap,
    ChevronDown,
    Star,
    Quote,
    Users,
    HelpCircle,
} from "lucide-react";

const features = [
    {
        icon: Code2,
        title: "Live Code Editor",
        description:
            "VS Code-powered Monaco editor with syntax highlighting, IntelliSense, and multi-language support.",
        gradient: "from-blue-500 to-cyan-500",
    },
    {
        icon: Video,
        title: "Video Interview Rooms",
        description:
            "One-on-one HD video calls with Stream for seamless face-to-face technical interviews.",
        gradient: "from-purple-500 to-pink-500",
    },
    {
        icon: MessageSquare,
        title: "Real-Time Chat",
        description:
            "Built-in messaging during interviews for sharing links, notes, and quick communication.",
        gradient: "from-amber-500 to-orange-500",
    },
    {
        icon: Shield,
        title: "Secure Execution",
        description:
            "Sandboxed code execution environment ensuring safe and isolated code running.",
        gradient: "from-emerald-500 to-teal-500",
    },
    {
        icon: CheckCircle,
        title: "Auto Feedback",
        description:
            "Automated test case validation with instant pass/fail results for every submission.",
        gradient: "from-red-500 to-rose-500",
    },
    {
        icon: BookOpen,
        title: "Practice Problems",
        description:
            "Curated problem library with varying difficulty levels for interview preparation.",
        gradient: "from-indigo-500 to-violet-500",
    },
];

const stats = [
    { value: "50+", label: "Coding Problems" },
    { value: "HD", label: "Video Quality" },
    { value: "2", label: "Languages" },
    { value: "∞", label: "Interviews" },
];

const testimonials = [
    {
        name: "Dr. Priya Sharma",
        role: "HOD, Computer Science",
        text: "This platform streamlines our technical interview process. The live code editor with auto-evaluation saves us hours of manual assessment.",
        rating: 5,
    },
    {
        name: "Rahul Deshmukh",
        role: "Final Year Student",
        text: "Practicing problems here boosted my confidence. The instant feedback on test cases is incredibly helpful for interview prep.",
        rating: 5,
    },
    {
        name: "Prof. Amit Kulkarni",
        role: "Project Guide",
        text: "A well-architected MERN application. The video integration with collaborative coding is exactly what modern tech interviews need.",
        rating: 5,
    },
];

const faqs = [
    {
        q: "What technologies is this platform built with?",
        a: "The platform is built using the MERN stack — MongoDB for the database, Express.js and Node.js for the backend API, and React.js with Vite for the frontend. It also integrates Clerk for authentication, Stream for video calls, and Inngest for background job processing.",
    },
    {
        q: "How does the code execution work?",
        a: "Code is executed in a sandboxed environment on the server. When you click 'Run', your code is sent to the backend, compiled/interpreted in an isolated process, and the output is compared against predefined test cases. This ensures safe, reliable code evaluation.",
    },
    {
        q: "Can I use this for both practice and live interviews?",
        a: "Yes! The platform supports two primary workflows: self-paced practice with our curated problem library, and scheduled technical interviews with HD video calling, real-time chat, and collaborative code editing.",
    },
    {
        q: "What programming languages are supported?",
        a: "Currently, the platform supports JavaScript and Python — the two most popular languages for technical interviews. The Monaco editor provides full IntelliSense support for both languages.",
    },
    {
        q: "Is this a final year project?",
        a: "Yes, this is a MERN-based Remote Technical Interview Platform developed as a final year B.Tech project. It demonstrates full-stack development skills including real-time communication, authentication, cloud deployment, and modern UI/UX design.",
    },
];

function FAQItem({ faq, isOpen, toggle }) {
    return (
        <div className="border border-dark-400/30 rounded-xl overflow-hidden">
            <button
                onClick={toggle}
                className="w-full flex items-center justify-between px-5 sm:px-6 py-4 text-left text-sm sm:text-base font-medium text-gray-200 hover:text-white hover:bg-dark-300/20 transition-all"
            >
                <span className="pr-4">{faq.q}</span>
                <ChevronDown
                    className={`w-4 h-4 text-gray-500 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180 text-primary-400" : ""
                        }`}
                />
            </button>
            {isOpen && (
                <div className="px-5 sm:px-6 pb-4 text-sm text-gray-400 leading-relaxed animate-fade-in">
                    {faq.a}
                </div>
            )}
        </div>
    );
}

export default function HomePage() {
    const [openFaq, setOpenFaq] = useState(null);
    const { isSignedIn } = useAuth();

    return (
        <div className="relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[40%] -right-[20%] w-[70%] h-[70%] bg-gradient-to-br from-primary-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl" />
                <div className="absolute -bottom-[30%] -left-[20%] w-[60%] h-[60%] bg-gradient-to-tr from-primary-500/8 via-blue-500/5 to-transparent rounded-full blur-3xl" />
            </div>

            {/* Hero Section */}
            <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-16 sm:pb-24">
                <div className="text-center max-w-4xl mx-auto animate-fade-in">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 px-3 sm:px-4 py-1.5 rounded-full mb-6 sm:mb-8">
                        <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-400" />
                        <span className="text-xs sm:text-sm text-primary-300 font-medium">
                            MERN-Based Interview Platform
                        </span>
                    </div>

                    {/* Heading */}
                    <h1 className="text-3xl xs:text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-tight mb-4 sm:mb-6 text-balance">
                        <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                            Remote Technical
                        </span>
                        <br />
                        <span className="bg-gradient-to-r from-primary-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient bg-300%">
                            Interviews Made Easy
                        </span>
                    </h1>

                    {/* Subtitle */}
                    <p className="text-base sm:text-lg lg:text-xl text-gray-400 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2">
                        Conduct seamless technical interviews with live coding, HD video calls,
                        real-time chat, and automated code evaluation — all in one platform.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4 sm:px-0">
                        {isSignedIn ? (
                            <>
                                <Link
                                    to="/dashboard"
                                    className="btn-primary text-sm sm:text-base px-6 sm:px-8 py-3 flex items-center justify-center gap-2 group w-full sm:w-auto"
                                >
                                    Go to Dashboard
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link
                                    to="/problems"
                                    className="btn-secondary text-sm sm:text-base px-6 sm:px-8 py-3 flex items-center justify-center gap-2 w-full sm:w-auto"
                                >
                                    <BookOpen className="w-4 h-4" />
                                    Practice Problems
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/sign-up"
                                    className="btn-primary text-sm sm:text-base px-6 sm:px-8 py-3 flex items-center justify-center gap-2 group w-full sm:w-auto"
                                >
                                    Get Started Free
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link
                                    to="/sign-in"
                                    className="btn-secondary text-sm sm:text-base px-6 sm:px-8 py-3 w-full sm:w-auto text-center"
                                >
                                    Sign In
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto mt-12 sm:mt-20 animate-slide-up">
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            className="glass-card p-3 sm:p-4 text-center hover:border-primary-500/30 transition-all duration-300"
                        >
                            <div className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
                                {stat.value}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500 mt-1">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features Section */}
            <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
                <div className="text-center mb-10 sm:mb-16">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4 text-balance">
                        Everything You Need
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto text-sm sm:text-base px-2">
                        A comprehensive platform combining live coding, video interviews, and
                        automated evaluation — all built with the MERN stack.
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {features.map((feature, idx) => (
                        <div
                            key={feature.title}
                            className="card p-5 sm:p-6 group hover:-translate-y-2 transition-all duration-500 animate-slide-up"
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            <div
                                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-3 sm:mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                            >
                                <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </div>
                            <h3 className="text-base sm:text-lg font-semibold text-gray-100 mb-1.5 sm:mb-2">
                                {feature.title}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* How It Works */}
            <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
                <div className="text-center mb-10 sm:mb-16">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
                        How It Works
                    </h2>
                    <p className="text-gray-400 max-w-xl mx-auto text-sm sm:text-base">
                        Get started with technical interviews in three simple steps.
                    </p>
                </div>

                <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
                    {[
                        {
                            step: "01",
                            title: "Sign Up & Choose Role",
                            description:
                                "Create your account and select whether you're an interviewer or a candidate.",
                        },
                        {
                            step: "02",
                            title: "Schedule or Practice",
                            description:
                                "Schedule interviews with candidates or practice coding problems to sharpen your skills.",
                        },
                        {
                            step: "03",
                            title: "Interview with Live Code",
                            description:
                                "Join video rooms with a collaborative code editor, run code, and get instant feedback.",
                        },
                    ].map((item) => (
                        <div key={item.step} className="relative text-center">
                            <div className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-dark-300 mb-3 sm:mb-4">
                                {item.step}
                            </div>
                            <h3 className="text-lg sm:text-xl font-semibold text-gray-100 mb-2">
                                {item.title}
                            </h3>
                            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                                {item.description}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Testimonials */}
            <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
                <div className="text-center mb-10 sm:mb-16">
                    <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-3 sm:px-4 py-1.5 rounded-full mb-4">
                        <Quote className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-xs sm:text-sm text-purple-300 font-medium">Testimonials</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
                        What People Say
                    </h2>
                    <p className="text-gray-400 max-w-xl mx-auto text-sm sm:text-base">
                        Feedback from faculty and students who have used the platform.
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {testimonials.map((t, idx) => (
                        <div
                            key={t.name}
                            className="card p-5 sm:p-6 animate-slide-up"
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            <div className="flex gap-1 mb-3">
                                {Array.from({ length: t.rating }).map((_, i) => (
                                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                                ))}
                            </div>
                            <p className="text-sm text-gray-300 leading-relaxed mb-4 italic">
                                "{t.text}"
                            </p>
                            <div className="flex items-center gap-3 pt-3 border-t border-dark-400/20">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                                    {t.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-200">{t.name}</p>
                                    <p className="text-xs text-gray-500">{t.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* FAQ */}
            <section className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
                <div className="text-center mb-10 sm:mb-16">
                    <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 sm:px-4 py-1.5 rounded-full mb-4">
                        <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-xs sm:text-sm text-emerald-300 font-medium">FAQ</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-gray-400 max-w-xl mx-auto text-sm sm:text-base">
                        Common questions about the platform and its features.
                    </p>
                </div>

                <div className="space-y-3">
                    {faqs.map((faq, idx) => (
                        <FAQItem
                            key={idx}
                            faq={faq}
                            isOpen={openFaq === idx}
                            toggle={() => setOpenFaq(openFaq === idx ? null : idx)}
                        />
                    ))}
                </div>
            </section>



            {/* CTA Section */}
            {!isSignedIn && (
                <section className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
                    <div className="animate-fade-in">
                        <Users className="w-10 h-10 text-primary-400 mx-auto mb-4" />
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
                            Ready to Get Started?
                        </h2>
                        <p className="text-gray-400 max-w-xl mx-auto mb-8 text-sm sm:text-base">
                            Create your free account and start practicing coding problems or schedule your first interview today.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link
                                to="/sign-up"
                                className="btn-primary text-sm sm:text-base px-8 py-3 flex items-center justify-center gap-2 group"
                            >
                                Create Free Account
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link to="/sign-in" className="btn-secondary text-sm sm:text-base px-8 py-3 text-center">
                                Sign In
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* Footer */}
            <footer className="border-t border-dark-400/20 mt-8 sm:mt-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <Code2 className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm font-semibold text-gray-400">
                                CodeInterview
                            </span>
                        </div>
                        <p className="text-xs text-gray-600">
                            © {new Date().getFullYear()} CodeInterview. MERN Stack Final Year
                            Project.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
