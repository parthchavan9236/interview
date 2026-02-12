import { Link } from "react-router-dom";
import {
    Calendar,
    Clock,
    User,
    Video,
    CheckCircle,
    XCircle,
    AlertCircle,
} from "lucide-react";

const statusConfig = {
    scheduled: { icon: Clock, color: "text-blue-400", bg: "bg-blue-500/15", border: "border-blue-500/30", label: "Scheduled" },
    in_progress: { icon: Video, color: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/30", label: "In Progress" },
    completed: { icon: CheckCircle, color: "text-gray-400", bg: "bg-gray-500/15", border: "border-gray-500/30", label: "Completed" },
    cancelled: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/15", border: "border-red-500/30", label: "Cancelled" },
};

export default function InterviewCard({ interview }) {
    const config = statusConfig[interview.status] || statusConfig.scheduled;
    const StatusIcon = config.icon;
    const scheduledDate = new Date(interview.scheduledAt);

    return (
        <div className="card p-6 group hover:border-primary-500/40 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-100 group-hover:text-primary-400 transition-colors">
                    {interview.title}
                </h3>
                <span
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.color} border ${config.border}`}
                >
                    <StatusIcon className="w-3 h-3" />
                    {config.label}
                </span>
            </div>

            {interview.description && (
                <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                    {interview.description}
                </p>
            )}

            <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar className="w-4 h-4 text-primary-400" />
                    {scheduledDate.toLocaleDateString("en-US", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                    })}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Clock className="w-4 h-4 text-primary-400" />
                    {scheduledDate.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </div>
                {(interview.candidate || interview.candidateEmail) && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <User className="w-4 h-4 text-primary-400" />
                        {interview.candidate?.name || interview.candidateEmail}
                    </div>
                )}
            </div>

            {interview.status === "scheduled" || interview.status === "in_progress" ? (
                <Link
                    to={`/interview/${interview._id}`}
                    className="block text-center btn-primary text-sm py-2"
                >
                    <span className="flex items-center justify-center gap-2">
                        <Video className="w-4 h-4" />
                        {interview.status === "in_progress" ? "Rejoin" : "Join Interview"}
                    </span>
                </Link>
            ) : null}
        </div>
    );
}
