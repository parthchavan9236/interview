import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getComments, addComment } from "../lib/api";
import { useUser, useAuth } from "../lib/useAuth";
import LoadingSpinner from "./LoadingSpinner";
import { MessageSquare, Send, User } from "lucide-react";
import toast from "react-hot-toast";

export default function DiscussionSection({ problemId }) {
    const { user } = useUser();
    const { isSignedIn } = useAuth();
    const [content, setContent] = useState("");
    const queryClient = useQueryClient();

    const { data: comments, isLoading } = useQuery({
        queryKey: ["comments", problemId],
        queryFn: async () => {
            const res = await getComments(problemId);
            return res.data;
        },
        enabled: !!problemId,
    });

    const mutation = useMutation({
        mutationFn: addComment,
        onSuccess: () => {
            queryClient.invalidateQueries(["comments", problemId]);
            setContent("");
            toast.success("Comment posted!");
        },
        onError: () => toast.error("Failed to post comment"),
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!content.trim()) return;
        mutation.mutate({ problemId, content });
    };

    if (isLoading) return <LoadingSpinner size="sm" />;

    return (
        <div className="mt-8 animate-fade-in">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary-400" />
                Discussion
            </h3>

            {isSignedIn ? (
                <form onSubmit={handleSubmit} className="mb-6 flex gap-2">
                    <input
                        type="text"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Ask a question or share your thought..."
                        className="input-field flex-1"
                    />
                    <button
                        type="submit"
                        disabled={mutation.isPending || !content.trim()}
                        className="btn-primary"
                    >
                        {mutation.isPending ? <LoadingSpinner size="sm" /> : <Send className="w-4 h-4" />}
                    </button>
                </form>
            ) : (
                <div className="mb-6 p-4 bg-dark-300/30 rounded-lg text-center text-gray-400 text-sm">
                    Please sign in to join the discussion.
                </div>
            )}

            <div className="space-y-4">
                {comments?.map((comment) => (
                    <div key={comment._id} className="card p-4 hover:bg-dark-300/20 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                {comment.user?.image ? (
                                    <img
                                        src={comment.user.image}
                                        alt={comment.user.name}
                                        className="w-8 h-8 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-dark-400 flex items-center justify-center">
                                        <User className="w-4 h-4 text-gray-400" />
                                    </div>
                                )}
                                <div>
                                    <span className="font-semibold text-white text-sm block">
                                        {comment.user?.name || "Unknown User"}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {new Date(comment.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <p className="text-gray-300 text-sm pl-10">{comment.content}</p>
                    </div>
                ))}
                {comments?.length === 0 && (
                    <div className="text-center text-gray-500 text-sm py-4">
                        No comments yet. Be the first to start the discussion!
                    </div>
                )}
            </div>
        </div>
    );
}
