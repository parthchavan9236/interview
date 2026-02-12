import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createSlot, getOpenSlots, getMySlots, bookSlot } from "../lib/api";
import { useUser } from "../lib/useAuth";
import LoadingSpinner from "../components/LoadingSpinner";
import { Calendar, Clock, Plus, User, Video, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function SchedulePage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("find"); // 'find' or 'my'
    const [isCreating, setIsCreating] = useState(false);

    return (
        <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Mock Interviews</h1>
                    <p className="text-gray-400">Practice with peers in real-time coding sessions</p>
                </div>
                <div className="flex bg-dark-200 p-1 rounded-lg">
                    <button
                        onClick={() => navigate(`/room/instant-${Date.now()}`)}
                        className="px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 mr-2"
                    >
                        <Video className="w-4 h-4 inline mr-2" />
                        Instant Meeting
                    </button>
                    <button
                        onClick={() => setActiveTab("find")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "find"
                            ? "bg-primary-500 text-white shadow-lg"
                            : "text-gray-400 hover:text-white"
                            }`}
                    >
                        Find Interview
                    </button>
                    <button
                        onClick={() => setActiveTab("my")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "my"
                            ? "bg-primary-500 text-white shadow-lg"
                            : "text-gray-400 hover:text-white"
                            }`}
                    >
                        My Schedule
                    </button>
                </div>
            </div>

            {activeTab === "find" ? (
                <FindSlotsTab />
            ) : (
                <MyScheduleTab isCreating={isCreating} setIsCreating={setIsCreating} />
            )}
        </div>
    );
}

function FindSlotsTab() {
    const queryClient = useQueryClient();
    const { user } = useUser(); // Get current user
    const { data: slots, isLoading } = useQuery({
        queryKey: ["openSlots"],
        queryFn: async () => {
            const res = await getOpenSlots();
            return res.data;
        },
    });

    const bookMutation = useMutation({
        mutationFn: bookSlot,
        onSuccess: () => {
            queryClient.invalidateQueries(["openSlots"]);
            queryClient.invalidateQueries(["mySlots"]);
            toast.success("Interview booked successfully!");
        },
        onError: (err) => toast.error(err.response?.data?.message || "Failed to book slot"),
    });

    if (isLoading) return <LoadingSpinner />;

    if (!slots || slots.length === 0) {
        return (
            <div className="text-center py-20 bg-dark-200/30 rounded-2xl border border-dark-300">
                <Calendar className="w-16 h-16 text-dark-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Available Slots</h3>
                <p className="text-gray-400">
                    Check back later or create your own slot in "My Schedule" to let others book you.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {slots.map((slot) => {
                const isMySlot = String(slot.interviewer?._id) === String(user?._id);

                return (
                    <div
                        key={slot._id}
                        className={`card p-6 flex flex-col gap-4 border-l-4 transition-transform ${isMySlot ? 'border-l-gray-500 opacity-80' : 'border-l-primary-500 hover:translate-y-[-2px]'}`}
                    >
                        <div className="flex items-center gap-3 pb-4 border-b border-dark-300/50">
                            {slot.interviewer?.image ? (
                                <img
                                    src={slot.interviewer.image}
                                    alt={slot.interviewer.name}
                                    className="w-12 h-12 rounded-full object-cover ring-2 ring-primary-500/30"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-dark-300 flex items-center justify-center">
                                    <User className="w-6 h-6 text-gray-400" />
                                </div>
                            )}
                            <div>
                                <h3 className="font-semibold text-white">{slot.interviewer?.name} {isMySlot && "(You)"}</h3>
                                <span className="text-xs text-primary-400 font-medium px-2 py-0.5 rounded bg-primary-500/10">
                                    Interviewer
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-gray-300">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span>{new Date(slot.startTime).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <span>
                                    {new Date(slot.startTime).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                if (window.confirm("Confirm booking this interview?")) {
                                    bookMutation.mutate(slot._id);
                                }
                            }}
                            disabled={bookMutation.isPending || isMySlot}
                            className={`mt-auto w-full flex items-center justify-center gap-2 ${isMySlot
                                ? "bg-dark-300 text-gray-500 cursor-not-allowed py-2 rounded-md"
                                : "btn-primary"}`}
                        >
                            {bookMutation.isPending ? <LoadingSpinner size="sm" /> : isMySlot ? "Your Slot" : "Book Slot"}
                        </button>
                    </div>
                )
            })}
        </div>
    );
}

function MyScheduleTab({ isCreating, setIsCreating }) {
    const { user } = useUser();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [startTime, setStartTime] = useState("");

    const { data: slots, isLoading } = useQuery({
        queryKey: ["mySlots"],
        queryFn: async () => {
            const res = await getMySlots();
            return res.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: createSlot,
        onSuccess: () => {
            queryClient.invalidateQueries(["mySlots"]);
            setIsCreating(false);
            setStartTime("");
            toast.success("Availability slot created!");
        },
        onError: (err) => {
            console.error("Create slot error:", err);
            toast.error(err.response?.data?.message || "Failed to create slot: " + err.message);
        },
    });

    const handleCreate = (e) => {
        e.preventDefault();
        if (!startTime) return;
        const date = new Date(startTime);
        createMutation.mutate({ startTime: date.toISOString() });
    };

    if (isLoading) return <LoadingSpinner />;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Create Slot Section */}
            <div className="card p-6 bg-gradient-to-br from-dark-200 to-dark-100 border-primary-500/20">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-white mb-1">Manage Availability</h2>
                        <p className="text-gray-400 text-sm">Set times when you are free to interview others</p>
                    </div>
                    <button
                        onClick={() => setIsCreating(!isCreating)}
                        className={`btn-secondary flex items-center gap-2 ${isCreating ? "bg-rose-500/10 text-rose-400 border-rose-500/50" : ""
                            }`}
                    >
                        {isCreating ? "Cancel" : <><Plus className="w-4 h-4" /> Add Slot</>}
                    </button>
                </div>

                {isCreating && (
                    <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-4 items-end animate-slide-up">
                        <div className="w-full sm:w-auto flex-1">
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Select Start Time
                            </label>
                            <input
                                type="datetime-local"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                min={new Date().toISOString().slice(0, 16)}
                                className="input-field w-full"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={createMutation.isPending}
                            className="btn-primary"
                        >
                            {createMutation.isPending ? <LoadingSpinner size="sm" /> : "Save Slot"}
                        </button>
                    </form>
                )}
            </div>

            {/* Upcoming Interviews List */}
            <div>
                <h2 className="text-xl font-bold text-white mb-4">Your Upcoming Interviews</h2>
                {!slots || slots.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        No upcoming interviews scheduled.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {slots.map((slot) => {
                            const isInterviewer = slot.interviewer._id === user._id;
                            const partner = isInterviewer ? slot.candidate : slot.interviewer;

                            return (
                                <div
                                    key={slot._id}
                                    className={`card p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-6 ${slot.status === "booked"
                                        ? "border-l-4 border-l-emerald-500"
                                        : "border-l-4 border-l-gray-500 opacity-75"
                                        }`}
                                >
                                    <div className="flex-1 w-full text-center sm:text-left">
                                        <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                                            <span
                                                className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${slot.status === "booked"
                                                    ? "bg-emerald-500/10 text-emerald-400"
                                                    : "bg-gray-500/10 text-gray-400"
                                                    }`}
                                            >
                                                {slot.status === "booked" ? "Confirmed" : "Open Slot"}
                                            </span>
                                            {slot.status === "booked" && (
                                                <span className="text-gray-500 text-xs">
                                                    • You are the {isInterviewer ? "Interviewer" : "Candidate"}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-2">
                                            {new Date(slot.startTime).toLocaleString(undefined, {
                                                dateStyle: "full",
                                                timeStyle: "short",
                                            })}
                                        </h3>

                                        {slot.status === "booked" && partner ? (
                                            <div className="flex items-center justify-center sm:justify-start gap-3 mt-3 p-3 bg-dark-300/30 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-gray-400">Meeting with:</span>
                                                    {partner.image ? (
                                                        <img src={partner.image} className="w-6 h-6 rounded-full" alt="" />
                                                    ) : (
                                                        <User className="w-4 h-4 text-gray-500" />
                                                    )}
                                                    <span className="text-white font-medium">{partner.name}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 text-sm mt-1">
                                                Waiting for a candidate to book this slot...
                                            </p>
                                        )}
                                    </div>

                                    {(slot.status === "booked" || (isInterviewer && slot.status === "open")) && (
                                        <button
                                            className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
                                            onClick={() => navigate(`/room/${slot._id}`)}
                                        >
                                            <Video className="w-4 h-4" />
                                            {isInterviewer && slot.status === "open" ? "Start Meeting" : "Join Meeting"}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
