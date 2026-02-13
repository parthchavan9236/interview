import { useQuery } from "@tanstack/react-query";
import { getLeaderboard } from "../lib/api";
import { Trophy, Medal, Crown, User, Star, Zap, Target, TrendingUp, Award } from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";

export default function LeaderboardPage() {
    const { data: users, isLoading } = useQuery({
        queryKey: ["leaderboard"],
        queryFn: async () => {
            const res = await getLeaderboard();
            return res.data;
        },
    });

    if (isLoading) return <LoadingSpinner />;

    return (
        <div className="relative min-h-[calc(100vh-4rem)] pb-12">
            {/* Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-amber-500/10 to-transparent" />
            </div>

            <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-12 animate-fade-in">
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
                        <Trophy className="w-10 h-10 text-amber-500" />
                        Global Leaderboard
                    </h1>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Compete with fellow coders on the platform. Rankings are based on total XP earned by solving problems,
                        completing contests, and maintaining daily streaks.
                    </p>
                </div>

                {/* Ranking System Info */}
                <div className="grid sm:grid-cols-3 gap-4 mb-10 animate-slide-up">
                    {[
                        {
                            icon: Target,
                            title: "Earn XP Points",
                            description: "Solve problems to earn points — Easy: 10, Medium: 25, Hard: 50 XP",
                            color: "text-emerald-400",
                            bg: "bg-emerald-500/10",
                        },
                        {
                            icon: Zap,
                            title: "Build Streaks",
                            description: "Submit solutions daily to build an activity streak and bonus multiplier",
                            color: "text-amber-400",
                            bg: "bg-amber-500/10",
                        },
                        {
                            icon: Award,
                            title: "Unlock Badges",
                            description: "Reach milestones to earn badges — First Solve, Streak Master, and more",
                            color: "text-purple-400",
                            bg: "bg-purple-500/10",
                        },
                    ].map((info) => (
                        <div key={info.title} className="glass-card p-4 text-center">
                            <div className={`w-10 h-10 rounded-xl ${info.bg} flex items-center justify-center mx-auto mb-3`}>
                                <info.icon className={`w-5 h-5 ${info.color}`} />
                            </div>
                            <h3 className="text-sm font-semibold text-gray-200 mb-1">{info.title}</h3>
                            <p className="text-xs text-gray-500">{info.description}</p>
                        </div>
                    ))}
                </div>

                {/* Top 3 Podium (if users exist) */}
                {users && users.length >= 3 && (
                    <div className="flex justify-center items-end gap-4 mb-10 animate-slide-up">
                        {/* 2nd Place */}
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center text-white font-bold text-lg ring-4 ring-gray-400/30 mb-2">
                                {users[1]?.image ? (
                                    <img src={users[1].image} alt="" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    users[1]?.name?.charAt(0).toUpperCase()
                                )}
                            </div>
                            <Medal className="w-6 h-6 text-gray-300 mb-1" />
                            <p className="text-sm font-medium text-gray-300 truncate max-w-[100px]">{users[1]?.name}</p>
                            <p className="text-xs text-gray-500">{users[1]?.totalPoints || 0} XP</p>
                            <div className="w-20 h-16 bg-gray-500/10 rounded-t-lg mt-2 border border-gray-500/20" />
                        </div>

                        {/* 1st Place */}
                        <div className="flex flex-col items-center -mt-4">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-xl ring-4 ring-amber-400/30 mb-2">
                                {users[0]?.image ? (
                                    <img src={users[0].image} alt="" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    users[0]?.name?.charAt(0).toUpperCase()
                                )}
                            </div>
                            <Crown className="w-7 h-7 text-amber-400 mb-1" fill="currentColor" />
                            <p className="text-sm font-bold text-white truncate max-w-[100px]">{users[0]?.name}</p>
                            <p className="text-xs text-amber-400 font-medium">{users[0]?.totalPoints || 0} XP</p>
                            <div className="w-20 h-24 bg-amber-500/10 rounded-t-lg mt-2 border border-amber-500/20" />
                        </div>

                        {/* 3rd Place */}
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 flex items-center justify-center text-white font-bold text-lg ring-4 ring-amber-700/30 mb-2">
                                {users[2]?.image ? (
                                    <img src={users[2].image} alt="" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    users[2]?.name?.charAt(0).toUpperCase()
                                )}
                            </div>
                            <Medal className="w-6 h-6 text-amber-700 mb-1" />
                            <p className="text-sm font-medium text-gray-300 truncate max-w-[100px]">{users[2]?.name}</p>
                            <p className="text-xs text-gray-500">{users[2]?.totalPoints || 0} XP</p>
                            <div className="w-20 h-12 bg-amber-700/10 rounded-t-lg mt-2 border border-amber-700/20" />
                        </div>
                    </div>
                )}

                <div className="card overflow-hidden animate-slide-up">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-dark-400/30 bg-dark-300/30">
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-400 w-24 text-center">Rank</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-400">User</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-400 text-right">XP Points</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-400/30">
                                {users?.map((user, index) => {
                                    const rank = index + 1;
                                    let rankIcon = null;
                                    if (rank === 1) rankIcon = <Crown className="w-6 h-6 text-amber-400" fill="currentColor" />;
                                    else if (rank === 2) rankIcon = <Medal className="w-6 h-6 text-gray-300" />;
                                    else if (rank === 3) rankIcon = <Medal className="w-6 h-6 text-amber-700" />;
                                    else rankIcon = <span className="font-mono font-bold text-gray-500">#{rank}</span>;

                                    return (
                                        <tr key={user._id} className="group hover:bg-dark-300/20 transition-colors">
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex justify-center items-center">{rankIcon}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {user.image ? (
                                                        <img
                                                            src={user.image}
                                                            alt={user.name}
                                                            className="w-10 h-10 rounded-full ring-2 ring-dark-400 group-hover:ring-primary-500/50 transition-all object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-medium text-white group-hover:text-primary-400 transition-colors">
                                                            {user.name}
                                                        </div>
                                                        {rank === 1 && <div className="text-xs text-amber-500 font-medium">Grandmaster</div>}
                                                        {rank === 2 && <div className="text-xs text-gray-400 font-medium">Expert</div>}
                                                        {rank === 3 && <div className="text-xs text-amber-700 font-medium">Advanced</div>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-medium text-sm">
                                                    <Star className="w-3.5 h-3.5 fill-current" />
                                                    {user.totalPoints || 0}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {users?.length === 0 && (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-12 text-center text-gray-500">
                                            No ranked users yet. Be the first to solve a problem and climb the leaderboard!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* How Rankings Work */}
                <div className="mt-10 glass-card p-5 sm:p-6">
                    <div className="flex items-start gap-3">
                        <TrendingUp className="w-5 h-5 text-primary-400 mt-0.5 shrink-0" />
                        <div>
                            <h3 className="text-sm font-semibold text-gray-200 mb-2">How Rankings Work</h3>
                            <p className="text-xs text-gray-400 leading-relaxed">
                                Rankings are calculated based on your total XP points. Points are earned by solving practice problems
                                (Easy = 10, Medium = 25, Hard = 50), participating in coding contests, and maintaining daily activity streaks.
                                The leaderboard updates in real-time, so keep coding to climb the ranks!
                                This gamification system is powered by MongoDB aggregation pipelines with Redis-ready caching for optimal performance.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
