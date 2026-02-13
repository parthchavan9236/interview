import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "../lib/useAuth";
import toast from "react-hot-toast";
import {
    getProblemById,
    submitCode,
    executeCode as execCode,
    getProblemSubmissions,
    setAuthToken,
} from "../lib/api";
import CodeEditor from "../components/CodeEditor";
import DiscussionSection from "../components/DiscussionSection";
import LoadingSpinner from "../components/LoadingSpinner";
import {
    CheckCircle,
    XCircle,
    Send,
    Clock,
    FileText,
    Terminal,
    History,
    Code2,
    ChevronLeft,
    MessageSquare,
} from "lucide-react";

export default function ProblemDetailPage() {
    const { id } = useParams();
    const { getToken } = useAuth();
    const [code, setCode] = useState("");
    const [language, setLanguage] = useState("javascript");
    const [output, setOutput] = useState("");
    const [activeTab, setActiveTab] = useState("description");
    const [isRunning, setIsRunning] = useState(false);
    // Mobile panel: 'description' or 'editor'
    const [mobilePanel, setMobilePanel] = useState("description");

    const { data: problem, isLoading } = useQuery({
        queryKey: ["problem", id],
        queryFn: async () => {
            const token = await getToken();
            setAuthToken(token);
            const res = await getProblemById(id);
            return res.data;
        },
    });

    const { data: submissions, refetch: refetchSubmissions } = useQuery({
        queryKey: ["submissions", id],
        queryFn: async () => {
            const token = await getToken();
            setAuthToken(token);
            const res = await getProblemSubmissions(id);
            return res.data;
        },
    });

    useEffect(() => {
        if (problem?.starterCode) {
            setCode(problem.starterCode[language] || "");
        }
    }, [problem, language]);

    const submitMutation = useMutation({
        mutationFn: async () => {
            const token = await getToken();
            setAuthToken(token);
            return submitCode({ problemId: id, code, language });
        },
        onSuccess: (res) => {
            const result = res.data;
            if (result.status === "accepted") {
                toast.success("All test cases passed! 🎉");
            } else {
                toast.error("Some test cases failed");
            }
            refetchSubmissions();
            setActiveTab("submissions");
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Submission failed");
        },
    });

    const handleRun = async (codeText, lang) => {
        setIsRunning(true);
        try {
            const token = await getToken();
            setAuthToken(token);
            const res = await execCode({
                code: codeText,
                language: lang,
                input: "",
            });
            const data = res.data;
            if (data.stderr) {
                setOutput(`Error:\n${data.stderr}`);
            } else {
                setOutput(data.output || "(no output)");
            }
        } catch (err) {
            setOutput(`Error: ${err.response?.data?.message || err.message}`);
        } finally {
            setIsRunning(false);
        }
    };

    const handleLanguageChange = (newLang) => {
        setLanguage(newLang);
        if (problem?.starterCode?.[newLang]) {
            setCode(problem.starterCode[newLang]);
        }
    };

    if (isLoading) return <LoadingSpinner text="Loading problem..." />;
    if (!problem) {
        return (
            <div className="text-center py-20">
                <p className="text-red-400">Problem not found</p>
            </div>
        );
    }

    const difficultyClass = {
        Easy: "badge-easy",
        Medium: "badge-medium",
        Hard: "badge-hard",
    };

    const DescriptionPanel = () => (
        <div className="flex-1 overflow-auto p-4 sm:p-6">
            {activeTab === "description" ? (
                <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                        <h1 className="text-xl sm:text-2xl font-bold text-white text-balance">
                            {problem.title}
                        </h1>
                        <span className={`${difficultyClass[problem.difficulty]} flex-shrink-0`}>
                            {problem.difficulty}
                        </span>
                    </div>

                    {problem.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-6">
                            {problem.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="text-xs bg-dark-300/50 text-gray-400 px-2.5 py-1 rounded-lg border border-dark-400/30"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="prose prose-invert max-w-none mb-8">
                        <div className="text-gray-300 leading-relaxed whitespace-pre-wrap text-sm">
                            {problem.description}
                        </div>
                    </div>

                    {problem.examples?.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-base sm:text-lg font-semibold text-white">Examples</h3>
                            {problem.examples.map((ex, idx) => (
                                <div
                                    key={idx}
                                    className="bg-dark-100 border border-dark-400/30 rounded-xl p-3 sm:p-4"
                                >
                                    <div className="text-xs text-gray-500 font-semibold uppercase mb-2">
                                        Example {idx + 1}
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="overflow-x-auto">
                                            <span className="text-gray-500">Input: </span>
                                            <code className="text-primary-300 font-mono break-all">
                                                {ex.input}
                                            </code>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <span className="text-gray-500">Output: </span>
                                            <code className="text-emerald-300 font-mono break-all">
                                                {ex.output}
                                            </code>
                                        </div>
                                        {ex.explanation && (
                                            <div className="text-gray-400 mt-2 pt-2 border-t border-dark-400/20 text-xs sm:text-sm">
                                                {ex.explanation}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : activeTab === "submissions" ? (
                <div>
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-4">
                        Your Submissions
                    </h3>
                    {submissions && submissions.length > 0 ? (
                        <div className="space-y-3">
                            {submissions.map((sub) => (
                                <div
                                    key={sub._id}
                                    className="bg-dark-100 border border-dark-400/30 rounded-xl p-3 sm:p-4"
                                >
                                    <div className="flex items-center justify-between mb-2 gap-2">
                                        <div className="flex items-center gap-2">
                                            {sub.status === "accepted" ? (
                                                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                            ) : (
                                                <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                                            )}
                                            <span
                                                className={`text-sm font-semibold ${sub.status === "accepted"
                                                    ? "text-emerald-400"
                                                    : "text-red-400"
                                                    }`}
                                            >
                                                {sub.status === "accepted" ? "Accepted" : "Wrong Answer"}
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-500 whitespace-nowrap">
                                            {new Date(sub.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        {sub.results?.filter((r) => r.passed).length}/
                                        {sub.results?.length} test cases passed • {sub.language}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <History className="w-12 h-12 text-dark-400 mx-auto mb-3" />
                            <p className="text-gray-500 text-sm">No submissions yet</p>
                        </div>
                    )}
                </div>
            ) : (
                <DiscussionSection problemId={id} />
            )}
        </div>
    );

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col">
            {/* Mobile Panel Toggle */}
            <div className="lg:hidden flex! border-b border-dark-400/30 bg-dark-50">
                <button
                    onClick={() => setMobilePanel("description")}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${mobilePanel === "description"
                        ? "border-primary-500 text-primary-400 bg-primary-500/5"
                        : "border-transparent text-gray-500"
                        }`}
                >
                    <FileText className="w-4 h-4" />
                    Problem
                </button>
                <button
                    onClick={() => setMobilePanel("editor")}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${mobilePanel === "editor"
                        ? "border-primary-500 text-primary-400 bg-primary-500/5"
                        : "border-transparent text-gray-500"
                        }`}
                >
                    <Code2 className="w-4 h-4" />
                    Code Editor
                </button>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Left Panel - Problem Description (Desktop always visible, mobile toggleable) */}
                <div
                    className={`w-full lg:w-[45%] border-r border-dark-400/30 flex flex-col overflow-hidden ${mobilePanel === "description" ? "flex" : "hidden lg:flex"
                        }`}
                >
                    {/* Desktop Tabs */}
                    <div className="hidden lg:flex! border-b border-dark-400/30 bg-dark-50">
                        {[
                            { id: "description", label: "Description", icon: FileText },
                            { id: "submissions", label: "Submissions", icon: History },
                            { id: "discussion", label: "Discussion", icon: MessageSquare },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all ${activeTab === tab.id
                                    ? "border-primary-500 text-primary-400 bg-primary-500/5"
                                    : "border-transparent text-gray-500 hover:text-gray-300"
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Mobile secondary tabs (description/submissions) */}
                    <div className="lg:hidden flex! border-b border-dark-400/20 bg-dark-100/50">
                        {[
                            { id: "description", label: "Description" },
                            { id: "submissions", label: "Submissions" },
                            { id: "discussion", label: "Discussion" },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 px-3 py-2.5 text-xs font-medium transition-all ${activeTab === tab.id
                                    ? "text-primary-400 bg-primary-500/10"
                                    : "text-gray-500"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <DescriptionPanel />
                </div>

                {/* Right Panel - Code Editor */}
                <div
                    className={`flex-1 flex flex-col overflow-hidden ${mobilePanel === "editor" ? "flex!" : "hidden lg:flex!"
                        }`}
                >
                    <div className="flex-1 min-h-0">
                        <CodeEditor
                            defaultCode={code}
                            language={language}
                            onLanguageChange={handleLanguageChange}
                            onCodeChange={setCode}
                            onRun={handleRun}
                            isRunning={isRunning}
                            output={output}
                            height="100%"
                        />
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="flex items-center justify-between bg-dark-100 border-t border-dark-400/30 px-3 sm:px-4 py-2.5 sm:py-3 safe-bottom">
                        <div className="text-xs text-gray-500">
                            {problem.testCases?.length || 0} test cases
                        </div>
                        <button
                            onClick={() => submitMutation.mutate()}
                            disabled={submitMutation.isPending}
                            className="btn-primary text-sm px-4 sm:px-6 py-2 flex items-center gap-2"
                        >
                            {submitMutation.isPending ? (
                                <Clock className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                            {submitMutation.isPending ? "Submitting..." : "Submit"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
