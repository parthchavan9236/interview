import { useUser, useAuth } from "../lib/useAuth";
import { useQuery } from "@tanstack/react-query";
import { getSubmissionStats } from "../lib/api";
import LoadingSpinner from "../components/LoadingSpinner";
import { User, Mail, Shield, Calendar, Trophy, Target, Clock, Zap } from "lucide-react";

export default function ProfilePage() {
    const { user } = useUser();
    const { isSignedIn } = useAuth();

    const { data: stats, isLoading } = useQuery({
        queryKey: ["stats"],
        queryFn: async () => {
            const res = await getSubmissionStats();
            return res.data;
        },
        enabled: !!isSignedIn,
    });

    if (isLoading) return <LoadingSpinner />;

    const initials = user?.firstName?.[0] || user?.fullName?.[0] || "U";
    const totalSolved = (stats?.solved?.Easy || 0) + (stats?.solved?.Medium || 0) + (stats?.solved?.Hard || 0);

    return (
        <div className="relative min-h-[calc(100vh-4rem)] pb-12">
            {/* Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-primary-900/20 to-transparent" />
            </div>

            <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Profile Header */}
                <div className="card p-6 sm:p-8 mb-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 animate-fade-in">
                    <div className="relative">
                        {user?.imageUrl ? (
                            <img
                                src={user.imageUrl}
                                alt={user.fullName}
                                className="w-24 h-24 sm:w-32 sm:h-32 rounded-full ring-4 ring-dark-100 object-cover"
                            />
                        ) : (
                            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-3xl sm:text-4xl font-bold text-white ring-4 ring-dark-100 shadow-xl">
                                {initials}
                            </div>
                        )}
                        <div className="absolute bottom-0 right-0 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full border-2 border-dark-100">
                            PRO
                        </div>
                    </div>

                    <div className="flex-1 text-center sm:text-left">
                        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                            {user?.fullName || "User"}
                        </h1>
                        <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-gray-400 text-sm">
                            <div className="flex items-center gap-1.5">
                                <Mail className="w-4 h-4" />
                                {user?.primaryEmailAddress?.emailAddress || "No email"}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Shield className="w-4 h-4" />
                                {user?.role || "Candidate"}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                Joined {new Date().toLocaleDateString()}
                            </div>
                        </div>
                    </div>

                    <button className="btn-secondary text-sm px-4 py-2 h-fit">
                        Edit Profile
                    </button>
                </div>

                {/* Stats Grid */}
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary-400" />
                    Activity Stats
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: "Total Solved", value: totalSolved, icon: Trophy, color: "text-amber-400", bg: "bg-amber-500/10" },
                        { label: "Submissions", value: stats?.totalSubmissions || 0, icon: Target, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                        { label: "Interviews", value: "—", icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
                        { label: "Time Spent", value: "—", icon: Clock, color: "text-purple-400", bg: "bg-purple-500/10" },
                    ].map((stat, idx) => (
                        <div key={idx} className="card p-4 hover:-translate-y-1 transition-transform duration-300">
                            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                            <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                            <div className="text-sm text-gray-500">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
