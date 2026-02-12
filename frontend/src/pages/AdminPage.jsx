import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllUsers, getProblems, createProblem, updateProblem, deleteProblem } from "../lib/api";
import { useForm } from "react-hook-form";
import LoadingSpinner from "../components/LoadingSpinner";
import { Plus, Edit, Trash, Users, BookOpen, Save, X } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState("problems"); // 'problems' or 'users'
    const [editingProblem, setEditingProblem] = useState(null); // null = list, 'new' = create, object = edit

    return (
        <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
                <div className="flex bg-dark-200 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab("problems")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "problems"
                                ? "bg-primary-500 text-white shadow-lg"
                                : "text-gray-400 hover:text-white"
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            Problems
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab("users")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "users"
                                ? "bg-primary-500 text-white shadow-lg"
                                : "text-gray-400 hover:text-white"
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Users
                        </div>
                    </button>
                </div>
            </div>

            {activeTab === "problems" && (
                <ProblemsTab editingProblem={editingProblem} setEditingProblem={setEditingProblem} />
            )}
            {activeTab === "users" && <UsersTab />}
        </div>
    );
}

function ProblemsTab({ editingProblem, setEditingProblem }) {
    const queryClient = useQueryClient();
    const { data: problems, isLoading } = useQuery({
        queryKey: ["problems"],
        queryFn: async () => {
            const res = await getProblems();
            return res.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: createProblem,
        onSuccess: () => {
            queryClient.invalidateQueries(["problems"]);
            setEditingProblem(null);
            toast.success("Problem created successfully");
        },
        onError: (err) => toast.error(err.response?.data?.message || "Failed to create problem"),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => updateProblem(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(["problems"]);
            setEditingProblem(null);
            toast.success("Problem updated successfully");
        },
        onError: (err) => toast.error(err.response?.data?.message || "Failed to update problem"),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteProblem,
        onSuccess: () => {
            queryClient.invalidateQueries(["problems"]);
            toast.success("Problem deleted successfully");
        },
        onError: (err) => toast.error(err.response?.data?.message || "Failed to delete problem"),
    });

    if (editingProblem) {
        return (
            <ProblemForm
                problem={editingProblem === "new" ? null : editingProblem}
                onSave={(data) => {
                    if (editingProblem === "new") createMutation.mutate(data);
                    else updateMutation.mutate({ id: editingProblem._id, data });
                }}
                onCancel={() => setEditingProblem(null)}
                isSubmitting={createMutation.isPending || updateMutation.isPending}
            />
        );
    }

    if (isLoading) return <LoadingSpinner />;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-end">
                <button
                    onClick={() => setEditingProblem("new")}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add Problem
                </button>
            </div>

            <div className="grid gap-4">
                {problems?.map((problem) => (
                    <div
                        key={problem._id}
                        className="card p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-primary-500/30 transition-colors"
                    >
                        <div>
                            <h3 className="text-xl font-bold text-white mb-1">{problem.title}</h3>
                            <div className="flex gap-3 text-sm">
                                <span
                                    className={`px-2 py-0.5 rounded text-xs font-semibold ${problem.difficulty === "Easy"
                                            ? "bg-emerald-500/10 text-emerald-400"
                                            : problem.difficulty === "Medium"
                                                ? "bg-amber-500/10 text-amber-400"
                                                : "bg-rose-500/10 text-rose-400"
                                        }`}
                                >
                                    {problem.difficulty}
                                </span>
                                <span className="text-gray-400">ID: {problem._id}</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setEditingProblem(problem)}
                                className="p-2 rounded-lg bg-dark-200 text-gray-400 hover:text-white hover:bg-dark-100 transition-colors"
                            >
                                <Edit className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => {
                                    if (window.confirm("Are you sure you want to delete this problem?")) {
                                        deleteMutation.mutate(problem._id);
                                    }
                                }}
                                className="p-2 rounded-lg bg-dark-200 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            >
                                <Trash className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ProblemForm({ problem, onSave, onCancel, isSubmitting }) {
    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: problem || {
            title: "",
            description: "",
            difficulty: "Easy",
            tags: "",
            starterCodeJS: "",
            starterCodePy: "",
        },
    });

    const onSubmit = (data) => {
        // Transform data to match API expectation
        const formattedData = {
            ...data,
            tags: data.tags.split(",").map((t) => t.trim()).filter(Boolean),
            starterCode: {
                javascript: data.starterCodeJS,
                python: data.starterCodePy,
            },
        };
        onSave(formattedData);
    };

    return (
        <div className="card p-6 sm:p-8 animate-fade-in max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">
                {problem ? "Edit Problem" : "Create New Problem"}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Title</label>
                        <input
                            {...register("title", { required: "Title is required" })}
                            className="input-field w-full"
                            placeholder="e.g. Two Sum"
                        />
                        {errors.title && <span className="text-rose-400 text-sm">{errors.title.message}</span>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Difficulty</label>
                        <select {...register("difficulty")} className="input-field w-full">
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Description (Markdown)</label>
                    <textarea
                        {...register("description", { required: "Description is required" })}
                        className="input-field w-full h-32 font-mono text-sm"
                        placeholder="Problem description..."
                    />
                    {errors.description && <span className="text-rose-400 text-sm">{errors.description.message}</span>}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Tags (comma separated)</label>
                    <input
                        {...register("tags")}
                        className="input-field w-full"
                        placeholder="Array, Hash Table"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Starter Code (JavaScript)</label>
                        <textarea
                            {...register("starterCodeJS")}
                            className="input-field w-full h-48 font-mono text-xs"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Starter Code (Python)</label>
                        <textarea
                            {...register("starterCodePy")}
                            className="input-field w-full h-48 font-mono text-xs"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-dark-300">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <X className="w-4 h-4" />
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-primary flex items-center gap-2"
                    >
                        {isSubmitting ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />}
                        Save Problem
                    </button>
                </div>
            </form>
        </div>
    );
}

function UsersTab() {
    const { data: users, isLoading } = useQuery({
        queryKey: ["users"],
        queryFn: async () => {
            const res = await getAllUsers();
            return res.data;
        },
    });

    if (isLoading) return <LoadingSpinner />;

    return (
        <div className="card overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-dark-400/30 bg-dark-300/30">
                            <th className="px-6 py-4 text-sm font-semibold text-gray-400">User</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-400">Email</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-400">Role</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-400 text-right">Joined</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-400/30">
                        {users?.map((user) => (
                            <tr key={user._id} className="hover:bg-dark-300/10 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        {user.image ? (
                                            <img
                                                src={user.image}
                                                alt={user.name}
                                                className="w-8 h-8 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center font-bold text-xs">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <span className="font-medium text-gray-200">{user.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-400 text-sm">{user.email}</td>
                                <td className="px-6 py-4">
                                    <span
                                        className={`px-2 py-0.5 rounded text-xs font-semibold ${user.role === "admin"
                                                ? "bg-purple-500/10 text-purple-400"
                                                : "bg-blue-500/10 text-blue-400"
                                            }`}
                                    >
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right text-gray-500 text-sm">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
