import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "../lib/useAuth";
import { getSubmissionStats, getLeaderboard } from "../lib/api"; // Re-using existing APIs
import LoadingSpinner from "../components/LoadingSpinner";
import { Printer, Mail, Github, Code, Trophy, Star } from "lucide-react";
import { useReactToPrint } from "react-to-print";

export default function ResumePage() {
    const { user } = useUser();
    const componentRef = useRef();

    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        documentTitle: `${user?.name || "User"}_Resume`,
    });

    // Fetch stats
    const { data: stats } = useQuery({
        queryKey: ["submissionStats"],
        queryFn: async () => {
            const res = await getSubmissionStats();
            return res.data;
        },
        enabled: !!user,
    });

    if (!user) return <LoadingSpinner />;

    return (
        <div className="min-h-screen bg-dark-50 p-4 sm:p-8 flex flex-col items-center">
            <div className="w-full max-w-4xl flex justify-end mb-4 print:hidden animate-fade-in">
                <button
                    onClick={handlePrint}
                    className="btn-primary flex items-center gap-2"
                >
                    <Printer className="w-4 h-4" />
                    Print / Save as PDF
                </button>
            </div>

            {/* Resume Content - A4 Ratio */}
            <div
                ref={componentRef}
                className="w-full max-w-[210mm] min-h-[297mm] bg-white text-black p-[20mm] shadow-2xl print:shadow-none print:w-full print:max-w-none mx-auto animate-slide-up"
            >
                {/* Header */}
                <header className="border-b-2 border-gray-800 pb-6 mb-8 flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-bold uppercase tracking-wider mb-2">
                            {user.name}
                        </h1>
                        <p className="text-lg text-gray-600 font-medium">Software Engineer</p>
                    </div>
                    <div className="text-right space-y-1 text-sm text-gray-600">
                        <div className="flex items-center justify-end gap-2">
                            <span>{user.email}</span>
                            <Mail className="w-4 h-4" />
                        </div>
                        <div className="flex items-center justify-end gap-2">
                            <span>github.com/username</span> {/* Placeholder or needs DB field */}
                            <Github className="w-4 h-4" />
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-3 gap-8">
                    {/* Left Column */}
                    <div className="col-span-1 border-r border-gray-200 pr-8 space-y-8">
                        {/* Skills */}
                        <section>
                            <h2 className="text-lg font-bold uppercase border-b border-gray-300 pb-1 mb-3 flex items-center gap-2">
                                <Code className="w-4 h-4" /> Skills
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {["JavaScript", "Python", "React", "Node.js", "MongoDB", "Express", "Algorithms", "Data Structures"].map(
                                    (skill) => (
                                        <span
                                            key={skill}
                                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded font-medium"
                                        >
                                            {skill}
                                        </span>
                                    )
                                )}
                            </div>
                        </section>

                        {/* Languages */}
                        <section>
                            <h2 className="text-lg font-bold uppercase border-b border-gray-300 pb-1 mb-3">
                                Languages
                            </h2>
                            <ul className="space-y-1 text-sm text-gray-700">
                                <li>English (Professional)</li>
                                {/* Add more if tracked */}
                            </ul>
                        </section>

                        {/* Stats */}
                        <section>
                            <h2 className="text-lg font-bold uppercase border-b border-gray-300 pb-1 mb-3 flex items-center gap-2">
                                <Trophy className="w-4 h-4" /> Achievements
                            </h2>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <div className="font-bold text-2xl text-primary-600">
                                        {user.solvedProblems?.length || 0}
                                    </div>
                                    <div className="text-gray-500 uppercase text-xs">Problems Solved</div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="bg-emerald-50 p-1 rounded">
                                        <div className="font-bold text-emerald-600">
                                            {stats?.difficulty?.Easy || 0}
                                        </div>
                                        <div className="text-[10px] text-emerald-800">Easy</div>
                                    </div>
                                    <div className="bg-amber-50 p-1 rounded">
                                        <div className="font-bold text-amber-600">
                                            {stats?.difficulty?.Medium || 0}
                                        </div>
                                        <div className="text-[10px] text-amber-800">Med</div>
                                    </div>
                                    <div className="bg-rose-50 p-1 rounded">
                                        <div className="font-bold text-rose-600">
                                            {stats?.difficulty?.Hard || 0}
                                        </div>
                                        <div className="text-[10px] text-rose-800">Hard</div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column */}
                    <div className="col-span-2 space-y-8">
                        {/* Profile Summary */}
                        <section>
                            <h2 className="text-lg font-bold uppercase border-b border-gray-300 pb-1 mb-3">
                                Profile
                            </h2>
                            <p className="text-sm text-gray-700 leading-relaxed">
                                Passionate software engineer with a strong foundation in data structures and
                                algorithms. Demonstrated problem-solving skills through solving {user.solvedProblems?.length || 0}+
                                algorithmic challenges on this platform. Experienced in full-stack development using
                                the MERN stack.
                            </p>
                        </section>

                        {/* Projects / Recent Activity */}
                        <section>
                            <h2 className="text-lg font-bold uppercase border-b border-gray-300 pb-1 mb-3 flex items-center gap-2">
                                <Star className="w-4 h-4" /> Recent Solved Problems
                            </h2>
                            <div className="space-y-4">
                                {stats?.recentSubmissions?.slice(0, 5).map((sub) => (
                                    <div key={sub._id} className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-gray-800 text-sm">
                                                {sub.problem?.title || "Unknown Problem"}
                                            </h3>
                                            <div className="flex gap-2 text-xs text-gray-500 mt-0.5">
                                                <span className="font-mono bg-gray-100 px-1 rounded">
                                                    {sub.language}
                                                </span>
                                                <span>•</span>
                                                <span>
                                                    {new Date(sub.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${sub.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {sub.status === 'accepted' ? 'Solved' : 'Attempted'}
                                        </span>
                                    </div>
                                ))}
                                {(!stats?.recentSubmissions || stats.recentSubmissions.length === 0) && (
                                    <p className="text-sm text-gray-500 italic">No recent activity.</p>
                                )}
                            </div>
                        </section>

                        {/* Education (Static placeholder) */}
                        <section>
                            <h2 className="text-lg font-bold uppercase border-b border-gray-300 pb-1 mb-3">
                                Education
                            </h2>
                            <div className="mb-4">
                                <h3 className="font-bold text-gray-800">Bachelor of Technology in Computer Science</h3>
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>University Name</span>
                                    <span>2022 - 2026</span>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-auto pt-8 border-t border-gray-200 text-center text-xs text-gray-400">
                    Generated by <span className="font-bold">MERN Interview Platform</span> • {new Date().toLocaleDateString()}
                </div>
            </div>
        </div>
    );
}
