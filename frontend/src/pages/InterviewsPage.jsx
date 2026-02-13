import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../lib/useAuth";
import toast from "react-hot-toast";
import {
    getInterviews,
    createInterview,
    deleteInterview,
    setAuthToken,
} from "../lib/api";
import InterviewCard from "../components/InterviewCard";
import LoadingSpinner from "../components/LoadingSpinner";
import {
    Plus,
    X,
    Calendar,
    Users,
    Video,
    Clock,
    FileText,
} from "lucide-react";

export default function InterviewsPage() {
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        title: "",
        description: "",
        candidateEmail: "",
        scheduledAt: "",
    });
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (showModal) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [showModal]);

    const { data: interviews, isLoading } = useQuery({
        queryKey: ["interviews"],
        queryFn: async () => {
            const token = await getToken();
            setAuthToken(token);
            const res = await getInterviews();
            return res.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data) => {
            const token = await getToken();
            setAuthToken(token);
            return createInterview(data);
        },
        onSuccess: () => {
            toast.success("Interview scheduled successfully!");
            queryClient.invalidateQueries(["interviews"]);
            setShowModal(false);
            setForm({ title: "", description: "", candidateEmail: "", scheduledAt: "" });
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Failed to create interview");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            const token = await getToken();
            setAuthToken(token);
            return deleteInterview(id);
        },
        onSuccess: () => {
            toast.success("Interview deleted");
            queryClient.invalidateQueries(["interviews"]);
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.title || !form.scheduledAt) {
            toast.error("Title and schedule are required");
            return;
        }
        createMutation.mutate(form);
    };

    const upcoming =
        interviews?.filter(
            (i) => i.status === "scheduled" || i.status === "in_progress"
        ) || [];
    const past =
        interviews?.filter(
            (i) => i.status === "completed" || i.status === "cancelled"
        ) || [];

    return (
        <div className="page-container animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 section-header">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25 flex-shrink-0">
                            <Video className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-white">
                                Interviews
                            </h1>
                            <p className="text-gray-400 text-sm hidden sm:block">
                                Schedule, manage, and conduct real-time technical interviews with HD video, collaborative code editor, and whiteboard.
                            </p>
                        </div>
                    </div>
                    <p className="text-gray-400 text-sm sm:hidden mt-1">
                        Schedule and conduct real-time technical interviews.
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto flex-shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    New Interview
                </button>
            </div>

            {/* Interview Features Info */}
            <div className="bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-primary-500/5 border border-purple-500/10 rounded-xl p-4 mb-6 sm:mb-8">
                <p className="text-xs text-gray-400 leading-relaxed">
                    <span className="text-purple-400 font-medium">Interview Room Features:</span>{" "}
                    WebRTC-powered HD video & audio • Real-time collaborative Monaco code editor • Drawing whiteboard tool •
                    Socket.IO live chat • Role-based access (Interviewer / Candidate) • Automatic session recording metadata
                </p>
            </div>

            {isLoading ? (
                <LoadingSpinner text="Loading interviews..." />
            ) : (
                <>
                    {/* Upcoming Interviews */}
                    <div className="mb-8 sm:mb-12">
                        <h2 className="text-base sm:text-lg font-semibold text-gray-300 mb-3 sm:mb-4 flex items-center gap-2">
                            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary-400" />
                            Upcoming ({upcoming.length})
                        </h2>
                        {upcoming.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                {upcoming.map((interview, idx) => (
                                    <div
                                        key={interview._id}
                                        className="animate-slide-up"
                                        style={{ animationDelay: `${idx * 80}ms` }}
                                    >
                                        <InterviewCard interview={interview} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="card p-8 sm:p-12 text-center">
                                <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-dark-400 mx-auto mb-3" />
                                <p className="text-gray-400">No upcoming interviews</p>
                                <p className="text-gray-600 text-sm mt-1">
                                    Click "New Interview" to schedule one.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Past Interviews */}
                    {past.length > 0 && (
                        <div>
                            <h2 className="text-base sm:text-lg font-semibold text-gray-300 mb-3 sm:mb-4 flex items-center gap-2">
                                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                                Past ({past.length})
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                {past.map((interview) => (
                                    <InterviewCard key={interview._id} interview={interview} />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Create Interview Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
                    <div className="bg-dark-50 border border-dark-400/30 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg animate-slide-in-bottom sm:animate-scale-in max-h-[90vh] overflow-y-auto safe-bottom">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-dark-400/20 sticky top-0 bg-dark-50 z-10 rounded-t-2xl">
                            <h2 className="text-lg sm:text-xl font-semibold text-white">
                                Schedule Interview
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 rounded-lg hover:bg-dark-300/50 text-gray-400 hover:text-white transition-all touch-target"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
                            <div>
                                <label className="text-sm text-gray-400 mb-1.5 block">
                                    Interview Title *
                                </label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="e.g. Frontend Developer Interview"
                                    value={form.title}
                                    onChange={(e) =>
                                        setForm({ ...form, title: e.target.value })
                                    }
                                />
                            </div>

                            <div>
                                <label className="text-sm text-gray-400 mb-1.5 block">
                                    Description
                                </label>
                                <textarea
                                    className="input-field resize-none"
                                    rows={3}
                                    placeholder="Add notes or instructions..."
                                    value={form.description}
                                    onChange={(e) =>
                                        setForm({ ...form, description: e.target.value })
                                    }
                                />
                            </div>

                            <div>
                                <label className="text-sm text-gray-400 mb-1.5 block">
                                    Candidate Email
                                </label>
                                <input
                                    type="email"
                                    className="input-field"
                                    placeholder="candidate@example.com"
                                    value={form.candidateEmail}
                                    onChange={(e) =>
                                        setForm({ ...form, candidateEmail: e.target.value })
                                    }
                                />
                            </div>

                            <div>
                                <label className="text-sm text-gray-400 mb-1.5 block">
                                    Schedule Date & Time *
                                </label>
                                <input
                                    type="datetime-local"
                                    className="input-field"
                                    value={form.scheduledAt}
                                    onChange={(e) =>
                                        setForm({ ...form, scheduledAt: e.target.value })
                                    }
                                />
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="btn-secondary flex-1 py-3 sm:py-2.5"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className="btn-primary flex-1 py-3 sm:py-2.5"
                                >
                                    {createMutation.isPending ? "Scheduling..." : "Schedule Interview"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
