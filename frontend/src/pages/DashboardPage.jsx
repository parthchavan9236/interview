import { Link } from "react-router-dom";
import { useUser, useAuth } from "../lib/useAuth";
import { useQuery } from "@tanstack/react-query";
import { getSubmissionStats, getProblems } from "../lib/api";
import LoadingSpinner from "../components/LoadingSpinner";
import AIChatWidget from "../components/AIChatWidget";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import {
    Code2,
    Video,
    BookOpen,
    ArrowRight,
    Trophy,
    Target,
    Clock,
    Sparkles,
    Zap,
    BarChart3,
    Calendar,
    CheckCircle2,
    TrendingUp,
    Lightbulb
} from "lucide-react";

const quickActions = [
    {
        title: "Practice Problems",
        description: "Sharpen your coding skills with curated challenges",
        icon: BookOpen,
        to: "/problems",
        gradient: "from-blue-500 to-cyan-500",
    },
    {
        title: "Schedule Interview",
        description: "Set up a new technical interview session",
        icon: Video,
        to: "/interviews",
        gradient: "from-purple-500 to-pink-500",
    },
];

const platformFeatures = [
    { icon: Code2, label: "Live Code Editor", description: "Monaco-powered with IntelliSense" },
    { icon: BarChart3, label: "Auto Evaluation", description: "Instant test case validation" },
    { icon: Calendar, label: "Interview Scheduling", description: "One-click HD video sessions" },
    { icon: CheckCircle2, label: "Multi-Language", description: "JavaScript & Python support" },
];

export default function DashboardPage() {
    const { user } = useUser();
    const { isSignedIn } = useAuth();

    const firstName = user?.firstName || user?.fullName?.split(" ")[0] || "User";
    const greeting = getGreeting();

    function getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 17) return "Good Afternoon";
        return "Good Evening";
    }

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ["stats"],
        queryFn: async () => {
            const res = await getSubmissionStats();
            return res.data;
        },
    });

    const { data: problems, isLoading: problemsLoading } = useQuery({
        queryKey: ["problems"],
        queryFn: async () => {
            const res = await getProblems();
            return res.data;
        },
    });

    if (statsLoading || problemsLoading) return <LoadingSpinner />;

    const difficultyData = [
        { name: "Easy", value: stats?.solved?.Easy || 0, color: "#10b981" },
        { name: "Medium", value: stats?.solved?.Medium || 0, color: "#f59e0b" },
        { name: "Hard", value: stats?.solved?.Hard || 0, color: "#ef4444" },
    ];

    const totalSolved = (stats?.solved?.Easy || 0) + (stats?.solved?.Medium || 0) + (stats?.solved?.Hard || 0);
    const activityData = stats?.activity?.slice(-7).map(a => ({ date: a._id.slice(5), count: a.count })) || [];

    // Filter recommended problems (unsolved)
    // Naive implementation: just pick first 3 not in activity? 
    // Ideally we need list of solved problem IDs. 
    // Assuming stats doesn't have IDs, we'll just show random ones for now or easy ones.
    const recommendedProblems = problems?.slice(0, 3) || [];

    return (
        <div className="relative">
            {/* Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[30%] -right-[15%] w-[50%] h-[50%] bg-gradient-to-br from-primary-500/8 via-purple-500/5 to-transparent rounded-full blur-3xl" />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                {/* Welcome Header */}
                <div className="mb-8 sm:mb-12 animate-fade-in">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-primary-400" />
                        <span className="text-sm text-primary-300 font-medium">{greeting}</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
                        Welcome back, <span className="bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">{firstName}</span>
                    </h1>
                    <p className="text-gray-400 text-sm sm:text-base">
                        Ready to ace your next technical interview? Here's your command center.
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-12">
                    {[
                        { icon: Trophy, label: "Total Solved", value: totalSolved, color: "text-amber-400", bg: "bg-amber-500/10" },
                        { icon: Target, label: "Total Submissions", value: stats?.totalSubmissions || 0, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                        { icon: Clock, label: "Recent Activity", value: stats?.activity?.length || 0, color: "text-blue-400", bg: "bg-blue-500/10" },
                        { icon: TrendingUp, label: "Hard Problems", value: stats?.solved?.Hard || 0, color: "text-purple-400", bg: "bg-purple-500/10" },
                    ].map((stat, idx) => (
                        <div
                            key={stat.label}
                            className="card p-4 sm:p-5 animate-slide-up"
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                                <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
                            </div>
                            <div className="text-xl sm:text-2xl font-bold text-white mb-0.5">{stat.value}</div>
                            <div className="text-xs sm:text-sm text-gray-500">{stat.label}</div>
                        </div>
                    ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-6 mb-8 sm:mb-12">
                    {/* Charts Section (Span 2 cols) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Activity Chart */}
                        <div className="card p-6">
                            <h3 className="text-lg font-semibold text-white mb-6">Weekly Activity</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={activityData}>
                                        <XAxis dataKey="date" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            cursor={{ fill: '#374151', opacity: 0.2 }}
                                            contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '8px' }}
                                            itemStyle={{ color: '#ec4899' }}
                                        />
                                        <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Difficulty Distribution */}
                        <div className="card p-6">
                            <h3 className="text-lg font-semibold text-white mb-6">Problem Difficulty</h3>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                                <div className="h-48 w-48 shrink-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={difficultyData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={40}
                                                outerRadius={60}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {difficultyData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '8px' }}
                                                itemStyle={{ color: '#fff' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex flex-col gap-4">
                                    {difficultyData.map((d) => (
                                        <div key={d.name} className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                                            <div>
                                                <div className="text-sm font-medium text-gray-200">{d.name}</div>
                                                <div className="text-xs text-gray-500">{d.value} Solved</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Quick Actions & Recommended */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <div>
                            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-primary-400" />
                                Quick Actions
                            </h2>
                            <div className="grid gap-4">
                                {quickActions.map((action) => (
                                    <Link
                                        key={action.title}
                                        to={action.to}
                                        className="card p-5 group hover:-translate-y-1 transition-all duration-300"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 shrink-0`}>
                                                <action.icon className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-base font-semibold text-gray-100 mb-0.5 flex items-center gap-2">
                                                    {action.title}
                                                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                                </h3>
                                                <p className="text-xs text-gray-400 truncate">{action.description}</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Recommended Problems */}
                        <div>
                            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Lightbulb className="w-5 h-5 text-primary-400" />
                                Recommended for You
                            </h2>
                            <div className="space-y-3">
                                {recommendedProblems.map(prob => (
                                    <Link key={prob._id} to={`/problems/${prob._id}`} className="card p-4 hover:bg-dark-300 transition-colors block border-l-4 border-l-transparent hover:border-l-primary-500">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-medium text-gray-200 text-sm mb-1">{prob.title}</h4>
                                                <div className="flex gap-2">
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${prob.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400' :
                                                            prob.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400' :
                                                                'bg-red-500/10 text-red-400'
                                                        }`}>{prob.difficulty}</span>
                                                    <span className="text-[10px] text-gray-500 bg-dark-400 px-1.5 py-0.5 rounded">{prob.tags[0]}</span>
                                                </div>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-gray-600" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Platform Features */}
                <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Platform Features</h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {platformFeatures.map((feature, idx) => (
                            <div
                                key={feature.label}
                                className="glass-card p-4 text-center animate-slide-up"
                                style={{ animationDelay: `${idx * 80}ms` }}
                            >
                                <feature.icon className="w-6 h-6 text-primary-400 mx-auto mb-2" />
                                <h3 className="text-sm font-semibold text-gray-200 mb-1">{feature.label}</h3>
                                <p className="text-xs text-gray-500">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* AI Assistant Widget */}
            <AIChatWidget />
        </div>
    );
}




