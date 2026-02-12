import { useState, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { Play, RotateCcw, Loader2, ChevronDown } from "lucide-react";

const LANGUAGES = [
    { id: "javascript", name: "JavaScript", monacoId: "javascript" },
    { id: "python", name: "Python", monacoId: "python" },
    { id: "java", name: "Java", monacoId: "java" },
    { id: "cpp", name: "C++", monacoId: "cpp" },
    { id: "go", name: "Go", monacoId: "go" },
    { id: "rust", name: "Rust", monacoId: "rust" },
];

export default function CodeEditor({
    defaultCode = "",
    language = "javascript",
    onLanguageChange,
    onCodeChange,
    onRun,
    isRunning = false,
    output = "",
    height = "400px",
    readOnly = false,
}) {
    const [code, setCode] = useState(defaultCode);
    const [lang, setLang] = useState(language);
    const [showLangDropdown, setShowLangDropdown] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const editorRef = useRef(null);
    const dropdownRef = useRef(null);

    // Detect mobile
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 640);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    // Sync code from props (for real-time collaboration)
    useEffect(() => {
        if (defaultCode !== undefined && defaultCode !== code) {
            setCode(defaultCode);
        }
    }, [defaultCode]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowLangDropdown(false);
            }
        };
        if (showLangDropdown) {
            document.addEventListener("mousedown", handleClick);
            return () => document.removeEventListener("mousedown", handleClick);
        }
    }, [showLangDropdown]);

    const handleEditorMount = (editor) => {
        editorRef.current = editor;
        if (!isMobile) editor.focus();
    };

    const handleCodeChange = (value) => {
        setCode(value || "");
        onCodeChange?.(value || "");
    };

    const handleLanguageChange = (newLang) => {
        setLang(newLang);
        setShowLangDropdown(false);
        onLanguageChange?.(newLang);
    };

    const handleRun = () => {
        onRun?.(code, lang);
    };

    const handleReset = () => {
        setCode(defaultCode);
        onCodeChange?.(defaultCode);
    };

    const currentLang = LANGUAGES.find((l) => l.id === lang) || LANGUAGES[0];

    return (
        <div className="flex flex-col h-full">
            {/* Editor Toolbar */}
            <div className="flex items-center justify-between bg-dark-100 border-b border-dark-400/30 px-2 sm:px-4 py-2 gap-2">
                {/* Language Selector */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setShowLangDropdown(!showLangDropdown)}
                        className="flex items-center gap-1.5 sm:gap-2 bg-dark-300/50 hover:bg-dark-300 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm text-gray-300 transition-all touch-target"
                    >
                        {currentLang.name}
                        <ChevronDown className="w-3 h-3" />
                    </button>
                    {showLangDropdown && (
                        <div className="absolute top-full left-0 mt-1 bg-dark-200 border border-dark-400/50 rounded-xl shadow-xl z-20 overflow-hidden min-w-[140px] animate-scale-in">
                            {LANGUAGES.map((l) => (
                                <button
                                    key={l.id}
                                    onClick={() => handleLanguageChange(l.id)}
                                    className={`block w-full text-left px-4 py-2.5 text-sm transition-all ${lang === l.id
                                        ? "bg-primary-500/15 text-primary-400"
                                        : "text-gray-400 hover:bg-dark-300/50 hover:text-white"
                                        }`}
                                >
                                    {l.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm text-gray-400 hover:text-white hover:bg-dark-300/50 transition-all touch-target"
                        aria-label="Reset code"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Reset</span>
                    </button>
                    <button
                        onClick={handleRun}
                        disabled={isRunning}
                        className="flex items-center gap-1 sm:gap-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all shadow-lg shadow-emerald-500/20 touch-target"
                    >
                        {isRunning ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Play className="w-3.5 h-3.5" />
                        )}
                        {isRunning ? "Running..." : "Run"}
                    </button>
                </div>
            </div>

            {/* Monaco Editor */}
            <div className="flex-1 min-h-0">
                <Editor
                    height={height}
                    language={currentLang.monacoId}
                    value={code}
                    onChange={handleCodeChange}
                    onMount={handleEditorMount}
                    theme="vs-dark"
                    options={{
                        minimap: { enabled: false },
                        fontSize: isMobile ? 12 : 14,
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        lineNumbers: isMobile ? "off" : "on",
                        roundedSelection: true,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        wordWrap: "on",
                        padding: { top: 12 },
                        readOnly,
                        suggestOnTriggerCharacters: true,
                        quickSuggestions: !isMobile,
                        formatOnPaste: true,
                        formatOnType: true,
                        folding: !isMobile,
                        glyphMargin: false,
                        lineDecorationsWidth: isMobile ? 0 : 10,
                        lineNumbersMinChars: isMobile ? 2 : 3,
                    }}
                />
            </div>

            {/* Output Panel */}
            {output !== undefined && (
                <div className="border-t border-dark-400/30 bg-dark-100">
                    <div className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-dark-400/20">
                        Output
                    </div>
                    <pre className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-mono text-gray-300 max-h-36 sm:max-h-48 overflow-auto whitespace-pre-wrap break-all">
                        {output || "Run your code to see the output here..."}
                    </pre>
                </div>
            )}
        </div>
    );
}
