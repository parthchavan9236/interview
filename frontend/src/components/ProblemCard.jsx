import { Link } from "react-router-dom";
import { BookOpen, Tag } from "lucide-react";

export default function ProblemCard({ problem }) {
    const difficultyClass = {
        Easy: "badge-easy",
        Medium: "badge-medium",
        Hard: "badge-hard",
    };

    return (
        <Link to={`/problems/${problem._id}`} className="block group">
            <div className="card p-6 hover:border-primary-500/40 transition-all duration-300 group-hover:-translate-y-1">
                <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-100 group-hover:text-primary-400 transition-colors line-clamp-1">
                        {problem.title}
                    </h3>
                    <span className={difficultyClass[problem.difficulty] || "badge-easy"}>
                        {problem.difficulty}
                    </span>
                </div>

                <p className="text-sm text-gray-400 line-clamp-2 mb-4 leading-relaxed">
                    {problem.description}
                </p>

                {problem.tags && problem.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {problem.tags.slice(0, 4).map((tag) => (
                            <span
                                key={tag}
                                className="flex items-center gap-1 text-xs bg-dark-300/50 text-gray-400 px-2.5 py-1 rounded-lg border border-dark-400/30"
                            >
                                <Tag className="w-3 h-3" />
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </Link>
    );
}
