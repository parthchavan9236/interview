import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../lib/useAuth";
import { getProblems, setAuthToken } from "../lib/api";
import ProblemCard from "../components/ProblemCard";
import LoadingSpinner from "../components/LoadingSpinner";
import { Search, Filter, BookOpen, X, Code2, Zap, Target, Brain, Trophy } from "lucide-react";

const DIFFICULTIES = ["All", "Easy", "Medium", "Hard"];

const practiceInfo = [
    {
        icon: Code2,
        title: "Multi-Language Support",
        description: "JavaScript & Python with full Monaco editor IntelliSense",
        color: "text-blue-400",
        bg: "bg-blue-500/10",
    },
    {
        icon: Zap,
        title: "Instant Evaluation",
        description: "Sandboxed code execution with automated test case validation",
        color: "text-amber-400",
        bg: "bg-amber-500/10",
    },
    {
        icon: Target,
        title: "Difficulty Levels",
        description: "Easy, Medium & Hard problems for structured progression",
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
    },
    {
        icon: Brain,
        title: "DSA Categories",
        description: "Arrays, Trees, Graphs, DP, and more core CS topics",
        color: "text-purple-400",
        bg: "bg-purple-500/10",
    },
];

export default function ProblemsPage() {
    const [search, setSearch] = useState("");
    const [difficulty, setDifficulty] = useState("All");
    const { getToken } = useAuth();

    const { data, isLoading, error } = useQuery({
        queryKey: ["problems", difficulty, search],
        queryFn: async () => {
            const token = await getToken();
            setAuthToken(token);

            const params = {};
            if (difficulty !== "All") params.difficulty = difficulty;
            if (search) params.search = search;

            const res = await getProblems(params);
            return res.data;
        },
    });

    return (
        <div className="page-container animate-fade-in">
            {/* Header */}
            <div className="section-header">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25 flex-shrink-0">
                        <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white">
                            Practice Problems
                        </h1>
                        <p className="text-gray-400 text-sm sm:text-base hidden sm:block">
                            Master data structures & algorithms with our curated problem library — built for interview prep excellence.
                        </p>
                    </div>
                </div>
                <p className="text-gray-400 text-sm sm:hidden mt-1">
                    Master data structures & algorithms with curated challenges.
                </p>
            </div>

            {/* Practice Features Banner */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 sm:mb-8">
                {practiceInfo.map((info, idx) => (
                    <div
                        key={info.title}
                        className="glass-card p-3 sm:p-4 animate-slide-up"
                        style={{ animationDelay: `${idx * 80}ms` }}
                    >
                        <div className={`w-8 h-8 rounded-lg ${info.bg} flex items-center justify-center mb-2`}>
                            <info.icon className={`w-4 h-4 ${info.color}`} />
                        </div>
                        <h3 className="text-xs sm:text-sm font-semibold text-gray-200 mb-0.5">
                            {info.title}
                        </h3>
                        <p className="text-[10px] sm:text-xs text-gray-500 leading-relaxed">
                            {info.description}
                        </p>
                    </div>
                ))}
            </div>

            {/* Info Banner */}
            <div className="bg-gradient-to-r from-primary-500/5 via-purple-500/5 to-pink-500/5 border border-primary-500/10 rounded-xl p-4 sm:p-5 mb-6 sm:mb-8">
                <div className="flex items-start gap-3">
                    <Trophy className="w-5 h-5 text-primary-400 mt-0.5 shrink-0" />
                    <div>
                        <h3 className="text-sm font-semibold text-gray-200 mb-1">
                            How Problem Evaluation Works
                        </h3>
                        <p className="text-xs text-gray-400 leading-relaxed">
                            Each problem runs your code against hidden test cases using our sandboxed Piston execution engine.
                            Solutions are evaluated on correctness, and accepted submissions earn XP points toward your leaderboard rank.
                            Practice regularly to build streaks and unlock achievement badges on your profile!
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 mb-6 sm:mb-8">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search problems by title, tag..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input-field pl-10"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 touch-target flex items-center justify-center"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Difficulty Filter */}
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500 hidden sm:block! flex-shrink-0" />
                    <div className="flex gap-1 bg-dark-100 border border-dark-400/30 rounded-xl p-1 w-full sm:w-auto overflow-x-auto scrollbar-hide">
                        {DIFFICULTIES.map((d) => (
                            <button
                                key={d}
                                onClick={() => setDifficulty(d)}
                                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${difficulty === d
                                    ? "bg-primary-500/20 text-primary-400 border border-primary-500/30"
                                    : "text-gray-400 hover:text-gray-200 hover:bg-dark-300/30"
                                    }`}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Problem Count */}
            {data && data.length > 0 && (
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-500">
                        Showing <span className="text-gray-300 font-medium">{data.length}</span> problem{data.length !== 1 ? "s" : ""}
                        {difficulty !== "All" && (
                            <span> • Filtered by <span className={`font-medium ${difficulty === "Easy" ? "text-emerald-400" : difficulty === "Medium" ? "text-amber-400" : "text-rose-400"}`}>{difficulty}</span></span>
                        )}
                    </p>
                </div>
            )}

            {/* Problem List */}
            {isLoading ? (
                <LoadingSpinner text="Loading problems..." />
            ) : error ? (
                <div className="text-center py-16 sm:py-20">
                    <p className="text-red-400 mb-2">Failed to load problems</p>
                    <p className="text-gray-500 text-sm">Make sure the backend server is running.</p>
                </div>
            ) : data && data.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {data.map((problem, idx) => (
                        <div
                            key={problem._id}
                            className="animate-slide-up"
                            style={{ animationDelay: `${idx * 50}ms` }}
                        >
                            <ProblemCard problem={problem} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 sm:py-20">
                    <BookOpen className="w-14 h-14 sm:w-16 sm:h-16 text-dark-400 mx-auto mb-4" />
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-300 mb-2">
                        No problems found
                    </h3>
                    <p className="text-gray-500 text-sm">
                        {search || difficulty !== "All"
                            ? "Try adjusting your search or filter."
                            : "Problems will appear here once they are added."}
                    </p>
                </div>
            )}
        </div>
    );
}
