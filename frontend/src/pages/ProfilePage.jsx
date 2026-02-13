import { useUser, useAuth } from "../lib/useAuth";
import { useQuery } from "@tanstack/react-query";
import { getSubmissionStats, setAuthToken } from "../lib/api";
import LoadingSpinner from "../components/LoadingSpinner";
import {
    User,
    Mail,
    Shield,
    Calendar,
    Code2,
    CheckCircle2,
    Target,
    TrendingUp,
    Award,
    Flame,
    Star,
    Clock,
    BookOpen,
    Zap,
} from "lucide-react";

export default function ProfilePage() {
    const { user } = useUser();
    const { getToken } = useAuth();

    const { data: stats, isLoading } = useQuery({
        queryKey: ["profileStats"],
        queryFn: async () => {
            const token = await getToken();
            setAuthToken(token);
            const res = await getSubmissionStats();
            return res.data;
        },
    });

    if (!user || isLoading) return <LoadingSpinner />;

    const totalSolved =
        (stats?.solved?.Easy || 0) +
        (stats?.solved?.Medium || 0) +
        (stats?.solved?.Hard || 0);

    const badges = user.badges || [];
    const streak = user.streak || 0;
    const totalPoints = user.totalPoints || 0;

    return (
        <div className="relative min-h-[calc(100vh-4rem)]">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -right-[15%] w-[50%] h-[50%] bg-gradient-to-br from-primary-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl" />
            </div>

            <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
                {/* Profile Header Card */}
                <div className="card p-6 sm:p-8 animate-fade-in">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                        {/* Avatar */}
                        {user.image ? (
                            <img
                                src={user.image}
                                alt={user.name}
                                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-4 ring-primary-500/20 shadow-lg"
                            />
                        ) : (
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg">
                                {user.name?.charAt(0).toUpperCase()}
                            </div>
                        )}

                        <div className="text-center sm:text-left flex-1">
                            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                                {user.name || user.fullName}
                            </h1>
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-3">
                                <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                                    <Mail className="w-3.5 h-3.5" />
                                    <span>{user.email}</span>
                                </div>
                                <div className={`flex items-center gap-1.5 text-sm px-2.5 py-0.5 rounded-full font-medium ${user.role === "admin"
                                        ? "bg-purple-500/10 text-purple-400"
                                        : user.role === "interviewer"
                                            ? "bg-blue-500/10 text-blue-400"
                                            : "bg-emerald-500/10 text-emerald-400"
                                    }`}>
                                    <Shield className="w-3.5 h-3.5" />
                                    <span className="capitalize">{user.role || "candidate"}</span>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 flex items-center justify-center sm:justify-start gap-1.5">
                                <Calendar className="w-3 h-3" />
                                Joined {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <div className="text-center px-4 py-2 glass-card">
                                <div className="text-xl font-bold text-amber-400">{totalPoints}</div>
                                <div className="text-[10px] text-gray-500 uppercase tracking-wider">XP Points</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 animate-slide-up">
                    {[
                        {
                            icon: Code2,
                            label: "Problems Solved",
                            value: totalSolved,
                            color: "text-emerald-400",
                            bg: "bg-emerald-500/10",
                        },
                        {
                            icon: Target,
                            label: "Submissions",
                            value: stats?.totalSubmissions || 0,
                            color: "text-blue-400",
                            bg: "bg-blue-500/10",
                        },
                        {
                            icon: Flame,
                            label: "Current Streak",
                            value: `${streak} day${streak !== 1 ? "s" : ""}`,
                            color: "text-amber-400",
                            bg: "bg-amber-500/10",
                        },
                        {
                            icon: Award,
                            label: "Badges Earned",
                            value: badges.length,
                            color: "text-purple-400",
                            bg: "bg-purple-500/10",
                        },
                    ].map((stat, idx) => (
                        <div key={stat.label} className="card p-4 sm:p-5" style={{ animationDelay: `${idx * 80}ms` }}>
                            <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                            </div>
                            <div className="text-xl font-bold text-white mb-0.5">{stat.value}</div>
                            <div className="text-xs text-gray-500">{stat.label}</div>
                        </div>
                    ))}
                </div>

                <div className="grid sm:grid-cols-2 gap-6 animate-slide-up">
                    {/* Difficulty Breakdown */}
                    <div className="card p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-primary-400" />
                            Difficulty Breakdown
                        </h3>
                        <div className="space-y-4">
                            {[
                                { name: "Easy", value: stats?.solved?.Easy || 0, color: "bg-emerald-500", textColor: "text-emerald-400" },
                                { name: "Medium", value: stats?.solved?.Medium || 0, color: "bg-amber-500", textColor: "text-amber-400" },
                                { name: "Hard", value: stats?.solved?.Hard || 0, color: "bg-rose-500", textColor: "text-rose-400" },
                            ].map((d) => (
                                <div key={d.name}>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="text-sm text-gray-300 font-medium">{d.name}</span>
                                        <span className={`text-sm font-bold ${d.textColor}`}>{d.value}</span>
                                    </div>
                                    <div className="h-2 bg-dark-300 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${d.color} rounded-full transition-all duration-700`}
                                            style={{ width: `${totalSolved > 0 ? (d.value / totalSolved) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Badges Section */}
                    <div className="card p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Star className="w-5 h-5 text-primary-400" />
                            Badges & Achievements
                        </h3>
                        {badges.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3">
                                {badges.map((badge, idx) => (
                                    <div key={idx} className="glass-card p-3 text-center">
                                        <Award className="w-6 h-6 text-amber-400 mx-auto mb-1.5" />
                                        <p className="text-xs font-medium text-gray-200">{badge}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <Award className="w-10 h-10 text-dark-400 mx-auto mb-2" />
                                <p className="text-gray-500 text-sm mb-1">No badges earned yet</p>
                                <p className="text-gray-600 text-xs">
                                    Solve your first problem to earn the "First Blood" badge!
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Platform Activity Info */}
                <div className="glass-card p-5 sm:p-6 animate-slide-up">
                    <div className="flex items-start gap-3">
                        <Zap className="w-5 h-5 text-primary-400 mt-0.5 shrink-0" />
                        <div>
                            <h3 className="text-sm font-semibold text-gray-200 mb-2">Your Profile Highlights</h3>
                            <p className="text-xs text-gray-400 leading-relaxed">
                                Your profile tracks all your platform activity automatically — problems solved, submission history,
                                difficulty distribution, badges, and daily streaks. These analytics are powered by our backend
                                performance report engine with MongoDB aggregation pipelines. You can also generate a printable resume
                                from the Resume page that auto-populates with your real solving data!
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
