import { Loader2 } from "lucide-react";

export default function LoadingSpinner({ text = "Loading..." }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 sm:py-20 animate-fade-in">
            <div className="relative">
                <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-xl animate-pulse-slow" />
                <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-primary-500 animate-spin relative" />
            </div>
            <p className="mt-4 text-sm sm:text-base text-gray-400 font-medium">
                {text}
            </p>
        </div>
    );
}
