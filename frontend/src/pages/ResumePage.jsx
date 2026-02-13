import { useRef, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "../lib/useAuth";
import { getSubmissionStats } from "../lib/api";
import LoadingSpinner from "../components/LoadingSpinner";
import {
    Printer, Mail, Github, Code, Trophy, Star, Edit3, Save,
    Plus, Trash2, X, Briefcase, GraduationCap, FolderOpen,
    Globe, Phone, Linkedin, MapPin, Sparkles
} from "lucide-react";
import { useReactToPrint } from "react-to-print";

const STORAGE_KEY = "resume_custom_data";

function getDefaultResumeData(user) {
    return {
        jobTitle: "Software Engineer",
        phone: "",
        github: "",
        linkedin: "",
        location: "",
        summary: `Passionate software engineer with a strong foundation in data structures and algorithms. Experienced in full-stack development using the MERN stack.`,
        skills: ["JavaScript", "Python", "React", "Node.js", "MongoDB", "Express", "Algorithms", "Data Structures"],
        languages: [{ name: "English", level: "Professional" }],
        education: [
            {
                degree: "Bachelor of Technology in Computer Science",
                institution: "University Name",
                startYear: "2022",
                endYear: "2026",
            },
        ],
        experience: [],
        projects: [],
    };
}

export default function ResumePage() {
    const { user } = useUser();
    const componentRef = useRef();
    const [isEditing, setIsEditing] = useState(false);

    // Load saved data or defaults
    const [resumeData, setResumeData] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) return JSON.parse(saved);
        } catch { }
        return null;
    });

    // Initialize with user data once loaded
    useEffect(() => {
        if (user && !resumeData) {
            setResumeData(getDefaultResumeData(user));
        }
    }, [user]);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `${user?.name || "User"}_Resume`,
    });

    const saveData = () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(resumeData));
        setIsEditing(false);
    };

    const resetData = () => {
        const defaults = getDefaultResumeData(user);
        setResumeData(defaults);
        localStorage.removeItem(STORAGE_KEY);
    };

    const updateField = (field, value) => {
        setResumeData(prev => ({ ...prev, [field]: value }));
    };

    // Skills management
    const [newSkill, setNewSkill] = useState("");
    const addSkill = () => {
        if (newSkill.trim() && !resumeData.skills.includes(newSkill.trim())) {
            updateField("skills", [...resumeData.skills, newSkill.trim()]);
            setNewSkill("");
        }
    };
    const removeSkill = (skill) => {
        updateField("skills", resumeData.skills.filter(s => s !== skill));
    };

    // Languages management
    const addLanguage = () => {
        updateField("languages", [...resumeData.languages, { name: "", level: "Professional" }]);
    };
    const updateLanguage = (index, field, value) => {
        const updated = [...resumeData.languages];
        updated[index] = { ...updated[index], [field]: value };
        updateField("languages", updated);
    };
    const removeLanguage = (index) => {
        updateField("languages", resumeData.languages.filter((_, i) => i !== index));
    };

    // Education management
    const addEducation = () => {
        updateField("education", [...resumeData.education, { degree: "", institution: "", startYear: "", endYear: "" }]);
    };
    const updateEducation = (index, field, value) => {
        const updated = [...resumeData.education];
        updated[index] = { ...updated[index], [field]: value };
        updateField("education", updated);
    };
    const removeEducation = (index) => {
        updateField("education", resumeData.education.filter((_, i) => i !== index));
    };

    // Experience management
    const addExperience = () => {
        updateField("experience", [...resumeData.experience, { role: "", company: "", startDate: "", endDate: "", description: "" }]);
    };
    const updateExperience = (index, field, value) => {
        const updated = [...resumeData.experience];
        updated[index] = { ...updated[index], [field]: value };
        updateField("experience", updated);
    };
    const removeExperience = (index) => {
        updateField("experience", resumeData.experience.filter((_, i) => i !== index));
    };

    // Projects management
    const addProject = () => {
        updateField("projects", [...resumeData.projects, { name: "", description: "", tech: "" }]);
    };
    const updateProject = (index, field, value) => {
        const updated = [...resumeData.projects];
        updated[index] = { ...updated[index], [field]: value };
        updateField("projects", updated);
    };
    const removeProject = (index) => {
        updateField("projects", resumeData.projects.filter((_, i) => i !== index));
    };

    // Fetch stats
    const { data: stats } = useQuery({
        queryKey: ["submissionStats"],
        queryFn: async () => {
            const res = await getSubmissionStats();
            return res.data;
        },
        enabled: !!user,
    });

    if (!user || !resumeData) return <LoadingSpinner />;

    return (
        <div className="min-h-screen bg-dark-50 p-4 sm:p-8">
            {/* Top Bar */}
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 print:hidden animate-fade-in">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Resume Builder</h1>
                    <p className="text-sm text-gray-400">
                        Customize your resume with your own details — platform stats are auto-populated.
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {isEditing ? (
                        <>
                            <button onClick={resetData} className="btn-secondary flex items-center gap-2 text-sm px-3 py-2">
                                <Trash2 className="w-3.5 h-3.5" />
                                Reset
                            </button>
                            <button onClick={() => setIsEditing(false)} className="btn-secondary flex items-center gap-2 text-sm px-3 py-2">
                                <X className="w-3.5 h-3.5" />
                                Cancel
                            </button>
                            <button onClick={saveData} className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
                                <Save className="w-3.5 h-3.5" />
                                Save Changes
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setIsEditing(true)} className="btn-secondary flex items-center gap-2 text-sm px-4 py-2">
                                <Edit3 className="w-3.5 h-3.5" />
                                Edit Resume
                            </button>
                            <button onClick={handlePrint} className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
                                <Printer className="w-3.5 h-3.5" />
                                Print / PDF
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
                {/* Edit Panel (visible when editing) */}
                {isEditing && (
                    <div className="lg:w-[420px] shrink-0 space-y-4 print:hidden animate-fade-in order-2 lg:order-1">
                        {/* Personal Info */}
                        <div className="card p-5">
                            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                <Edit3 className="w-4 h-4 text-primary-400" />
                                Personal Details
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">Job Title</label>
                                    <input
                                        type="text"
                                        value={resumeData.jobTitle}
                                        onChange={(e) => updateField("jobTitle", e.target.value)}
                                        className="input-field text-sm"
                                        placeholder="Software Engineer"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">Phone</label>
                                    <input
                                        type="tel"
                                        value={resumeData.phone}
                                        onChange={(e) => updateField("phone", e.target.value)}
                                        className="input-field text-sm"
                                        placeholder="+91 98765 43210"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">Location</label>
                                    <input
                                        type="text"
                                        value={resumeData.location}
                                        onChange={(e) => updateField("location", e.target.value)}
                                        className="input-field text-sm"
                                        placeholder="Mumbai, India"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">GitHub URL</label>
                                    <input
                                        type="text"
                                        value={resumeData.github}
                                        onChange={(e) => updateField("github", e.target.value)}
                                        className="input-field text-sm"
                                        placeholder="github.com/username"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">LinkedIn URL</label>
                                    <input
                                        type="text"
                                        value={resumeData.linkedin}
                                        onChange={(e) => updateField("linkedin", e.target.value)}
                                        className="input-field text-sm"
                                        placeholder="linkedin.com/in/username"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">Profile Summary</label>
                                    <textarea
                                        value={resumeData.summary}
                                        onChange={(e) => updateField("summary", e.target.value)}
                                        className="input-field text-sm h-24 resize-none"
                                        placeholder="Brief professional summary..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Skills */}
                        <div className="card p-5">
                            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                <Code className="w-4 h-4 text-primary-400" />
                                Skills
                            </h3>
                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {resumeData.skills.map((skill) => (
                                    <span key={skill} className="flex items-center gap-1 text-xs bg-dark-300 text-gray-300 px-2.5 py-1 rounded-lg">
                                        {skill}
                                        <button onClick={() => removeSkill(skill)} className="text-gray-500 hover:text-red-400 ml-0.5">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newSkill}
                                    onChange={(e) => setNewSkill(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                                    className="input-field text-sm flex-1"
                                    placeholder="Add a skill..."
                                />
                                <button onClick={addSkill} className="btn-secondary text-sm px-3"><Plus className="w-3.5 h-3.5" /></button>
                            </div>
                        </div>

                        {/* Education */}
                        <div className="card p-5">
                            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                <GraduationCap className="w-4 h-4 text-primary-400" />
                                Education
                                <button onClick={addEducation} className="ml-auto btn-secondary text-xs px-2 py-1 flex items-center gap-1">
                                    <Plus className="w-3 h-3" /> Add
                                </button>
                            </h3>
                            <div className="space-y-4">
                                {resumeData.education.map((edu, idx) => (
                                    <div key={idx} className="bg-dark-300/30 rounded-lg p-3 space-y-2 relative">
                                        <button onClick={() => removeEducation(idx)} className="absolute top-2 right-2 text-gray-500 hover:text-red-400">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                        <input
                                            type="text" value={edu.degree} onChange={(e) => updateEducation(idx, "degree", e.target.value)}
                                            className="input-field text-sm" placeholder="Degree"
                                        />
                                        <input
                                            type="text" value={edu.institution} onChange={(e) => updateEducation(idx, "institution", e.target.value)}
                                            className="input-field text-sm" placeholder="Institution"
                                        />
                                        <div className="flex gap-2">
                                            <input type="text" value={edu.startYear} onChange={(e) => updateEducation(idx, "startYear", e.target.value)}
                                                className="input-field text-sm flex-1" placeholder="Start Year" />
                                            <input type="text" value={edu.endYear} onChange={(e) => updateEducation(idx, "endYear", e.target.value)}
                                                className="input-field text-sm flex-1" placeholder="End Year" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Experience */}
                        <div className="card p-5">
                            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-primary-400" />
                                Experience
                                <button onClick={addExperience} className="ml-auto btn-secondary text-xs px-2 py-1 flex items-center gap-1">
                                    <Plus className="w-3 h-3" /> Add
                                </button>
                            </h3>
                            <div className="space-y-4">
                                {resumeData.experience.length === 0 && (
                                    <p className="text-xs text-gray-500 italic">No experience added. Click "Add" to create one.</p>
                                )}
                                {resumeData.experience.map((exp, idx) => (
                                    <div key={idx} className="bg-dark-300/30 rounded-lg p-3 space-y-2 relative">
                                        <button onClick={() => removeExperience(idx)} className="absolute top-2 right-2 text-gray-500 hover:text-red-400">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                        <input type="text" value={exp.role} onChange={(e) => updateExperience(idx, "role", e.target.value)}
                                            className="input-field text-sm" placeholder="Job Title" />
                                        <input type="text" value={exp.company} onChange={(e) => updateExperience(idx, "company", e.target.value)}
                                            className="input-field text-sm" placeholder="Company Name" />
                                        <div className="flex gap-2">
                                            <input type="text" value={exp.startDate} onChange={(e) => updateExperience(idx, "startDate", e.target.value)}
                                                className="input-field text-sm flex-1" placeholder="Start Date" />
                                            <input type="text" value={exp.endDate} onChange={(e) => updateExperience(idx, "endDate", e.target.value)}
                                                className="input-field text-sm flex-1" placeholder="End Date" />
                                        </div>
                                        <textarea value={exp.description} onChange={(e) => updateExperience(idx, "description", e.target.value)}
                                            className="input-field text-sm h-16 resize-none" placeholder="Description of responsibilities..." />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Projects */}
                        <div className="card p-5">
                            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                <FolderOpen className="w-4 h-4 text-primary-400" />
                                Projects
                                <button onClick={addProject} className="ml-auto btn-secondary text-xs px-2 py-1 flex items-center gap-1">
                                    <Plus className="w-3 h-3" /> Add
                                </button>
                            </h3>
                            <div className="space-y-4">
                                {resumeData.projects.length === 0 && (
                                    <p className="text-xs text-gray-500 italic">No projects added. Click "Add" to create one.</p>
                                )}
                                {resumeData.projects.map((proj, idx) => (
                                    <div key={idx} className="bg-dark-300/30 rounded-lg p-3 space-y-2 relative">
                                        <button onClick={() => removeProject(idx)} className="absolute top-2 right-2 text-gray-500 hover:text-red-400">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                        <input type="text" value={proj.name} onChange={(e) => updateProject(idx, "name", e.target.value)}
                                            className="input-field text-sm" placeholder="Project Name" />
                                        <textarea value={proj.description} onChange={(e) => updateProject(idx, "description", e.target.value)}
                                            className="input-field text-sm h-16 resize-none" placeholder="Project description..." />
                                        <input type="text" value={proj.tech} onChange={(e) => updateProject(idx, "tech", e.target.value)}
                                            className="input-field text-sm" placeholder="Technologies used (e.g. React, Node.js)" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Languages */}
                        <div className="card p-5">
                            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                <Globe className="w-4 h-4 text-primary-400" />
                                Languages
                                <button onClick={addLanguage} className="ml-auto btn-secondary text-xs px-2 py-1 flex items-center gap-1">
                                    <Plus className="w-3 h-3" /> Add
                                </button>
                            </h3>
                            <div className="space-y-3">
                                {resumeData.languages.map((lang, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <input type="text" value={lang.name} onChange={(e) => updateLanguage(idx, "name", e.target.value)}
                                            className="input-field text-sm flex-1" placeholder="Language" />
                                        <select value={lang.level} onChange={(e) => updateLanguage(idx, "level", e.target.value)}
                                            className="input-field text-sm w-36">
                                            <option value="Native">Native</option>
                                            <option value="Professional">Professional</option>
                                            <option value="Intermediate">Intermediate</option>
                                            <option value="Basic">Basic</option>
                                        </select>
                                        <button onClick={() => removeLanguage(idx)} className="text-gray-500 hover:text-red-400">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Resume Preview */}
                <div className={`flex-1 flex flex-col items-center order-1 lg:order-2 ${isEditing ? "" : "mx-auto"}`}>
                    {/* Info Banner */}
                    <div className="w-full max-w-[210mm] bg-primary-500/5 border border-primary-500/10 rounded-xl p-4 mb-6 print:hidden animate-fade-in">
                        <div className="flex items-start gap-2">
                            <Sparkles className="w-4 h-4 text-primary-400 mt-0.5 shrink-0" />
                            <p className="text-xs text-gray-400 leading-relaxed">
                                <span className="text-primary-400 font-medium">Tip:</span>{" "}
                                Click <strong>"Edit Resume"</strong> to customize all sections — add your education, experience, projects,
                                skills, and contact info. Platform stats (problems solved, achievements) are auto-populated from your activity.
                                Your changes are saved locally in your browser.
                            </p>
                        </div>
                    </div>

                    {/* A4 Resume */}
                    <div
                        ref={componentRef}
                        className="w-full max-w-[210mm] min-h-[297mm] bg-white text-black p-[20mm] shadow-2xl print:shadow-none print:w-full print:max-w-none animate-slide-up"
                    >
                        {/* Header */}
                        <header className="border-b-2 border-gray-800 pb-6 mb-8 flex justify-between items-start">
                            <div>
                                <h1 className="text-4xl font-bold uppercase tracking-wider mb-2">
                                    {user.name}
                                </h1>
                                <p className="text-lg text-gray-600 font-medium">{resumeData.jobTitle}</p>
                            </div>
                            <div className="text-right space-y-1 text-sm text-gray-600">
                                <div className="flex items-center justify-end gap-2">
                                    <span>{user.email}</span>
                                    <Mail className="w-4 h-4" />
                                </div>
                                {resumeData.phone && (
                                    <div className="flex items-center justify-end gap-2">
                                        <span>{resumeData.phone}</span>
                                        <Phone className="w-4 h-4" />
                                    </div>
                                )}
                                {resumeData.location && (
                                    <div className="flex items-center justify-end gap-2">
                                        <span>{resumeData.location}</span>
                                        <MapPin className="w-4 h-4" />
                                    </div>
                                )}
                                {resumeData.github && (
                                    <div className="flex items-center justify-end gap-2">
                                        <span>{resumeData.github}</span>
                                        <Github className="w-4 h-4" />
                                    </div>
                                )}
                                {resumeData.linkedin && (
                                    <div className="flex items-center justify-end gap-2">
                                        <span>{resumeData.linkedin}</span>
                                        <Linkedin className="w-4 h-4" />
                                    </div>
                                )}
                            </div>
                        </header>

                        <div className="grid grid-cols-3 gap-8">
                            {/* Left Column */}
                            <div className="col-span-1 border-r border-gray-200 pr-8 space-y-8">
                                {/* Skills */}
                                <section>
                                    <h2 className="text-lg font-bold uppercase border-b border-gray-300 pb-1 mb-3 flex items-center gap-2">
                                        <Code className="w-4 h-4" /> Skills
                                    </h2>
                                    <div className="flex flex-wrap gap-2">
                                        {resumeData.skills.map((skill) => (
                                            <span key={skill} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded font-medium">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </section>

                                {/* Languages */}
                                <section>
                                    <h2 className="text-lg font-bold uppercase border-b border-gray-300 pb-1 mb-3">
                                        Languages
                                    </h2>
                                    <ul className="space-y-1 text-sm text-gray-700">
                                        {resumeData.languages.map((lang, idx) => (
                                            <li key={idx}>{lang.name} ({lang.level})</li>
                                        ))}
                                    </ul>
                                </section>

                                {/* Platform Achievements */}
                                <section>
                                    <h2 className="text-lg font-bold uppercase border-b border-gray-300 pb-1 mb-3 flex items-center gap-2">
                                        <Trophy className="w-4 h-4" /> Achievements
                                    </h2>
                                    <div className="space-y-3 text-sm">
                                        <div>
                                            <div className="font-bold text-2xl text-indigo-600">
                                                {user.solvedProblems?.length || 0}
                                            </div>
                                            <div className="text-gray-500 uppercase text-xs">Problems Solved</div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-center">
                                            <div className="bg-emerald-50 p-1 rounded">
                                                <div className="font-bold text-emerald-600">{stats?.difficulty?.Easy || 0}</div>
                                                <div className="text-[10px] text-emerald-800">Easy</div>
                                            </div>
                                            <div className="bg-amber-50 p-1 rounded">
                                                <div className="font-bold text-amber-600">{stats?.difficulty?.Medium || 0}</div>
                                                <div className="text-[10px] text-amber-800">Med</div>
                                            </div>
                                            <div className="bg-rose-50 p-1 rounded">
                                                <div className="font-bold text-rose-600">{stats?.difficulty?.Hard || 0}</div>
                                                <div className="text-[10px] text-rose-800">Hard</div>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Right Column */}
                            <div className="col-span-2 space-y-8">
                                {/* Profile Summary */}
                                <section>
                                    <h2 className="text-lg font-bold uppercase border-b border-gray-300 pb-1 mb-3">
                                        Profile
                                    </h2>
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                        {resumeData.summary}
                                    </p>
                                </section>

                                {/* Experience */}
                                {resumeData.experience.length > 0 && (
                                    <section>
                                        <h2 className="text-lg font-bold uppercase border-b border-gray-300 pb-1 mb-3 flex items-center gap-2">
                                            <Briefcase className="w-4 h-4" /> Experience
                                        </h2>
                                        <div className="space-y-4">
                                            {resumeData.experience.map((exp, idx) => (
                                                <div key={idx}>
                                                    <div className="flex justify-between items-baseline">
                                                        <h3 className="font-bold text-gray-800">{exp.role || "Untitled Role"}</h3>
                                                        <span className="text-xs text-gray-500">{exp.startDate} — {exp.endDate || "Present"}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 font-medium">{exp.company}</p>
                                                    {exp.description && (
                                                        <p className="text-sm text-gray-700 mt-1 leading-relaxed">{exp.description}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Projects */}
                                {resumeData.projects.length > 0 && (
                                    <section>
                                        <h2 className="text-lg font-bold uppercase border-b border-gray-300 pb-1 mb-3 flex items-center gap-2">
                                            <FolderOpen className="w-4 h-4" /> Projects
                                        </h2>
                                        <div className="space-y-4">
                                            {resumeData.projects.map((proj, idx) => (
                                                <div key={idx}>
                                                    <h3 className="font-bold text-gray-800">{proj.name || "Untitled Project"}</h3>
                                                    {proj.description && (
                                                        <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">{proj.description}</p>
                                                    )}
                                                    {proj.tech && (
                                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                                            {proj.tech.split(",").map((t, i) => (
                                                                <span key={i} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded font-mono">
                                                                    {t.trim()}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Recent Solved Problems (Auto) */}
                                <section>
                                    <h2 className="text-lg font-bold uppercase border-b border-gray-300 pb-1 mb-3 flex items-center gap-2">
                                        <Star className="w-4 h-4" /> Recent Solved Problems
                                    </h2>
                                    <div className="space-y-4">
                                        {stats?.recentSubmissions?.slice(0, 5).map((sub) => (
                                            <div key={sub._id} className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-bold text-gray-800 text-sm">
                                                        {sub.problem?.title || "Unknown Problem"}
                                                    </h3>
                                                    <div className="flex gap-2 text-xs text-gray-500 mt-0.5">
                                                        <span className="font-mono bg-gray-100 px-1 rounded">{sub.language}</span>
                                                        <span>•</span>
                                                        <span>{new Date(sub.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${sub.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                                    {sub.status === 'accepted' ? 'Solved' : 'Attempted'}
                                                </span>
                                            </div>
                                        ))}
                                        {(!stats?.recentSubmissions || stats.recentSubmissions.length === 0) && (
                                            <p className="text-sm text-gray-500 italic">No recent activity.</p>
                                        )}
                                    </div>
                                </section>

                                {/* Education */}
                                <section>
                                    <h2 className="text-lg font-bold uppercase border-b border-gray-300 pb-1 mb-3 flex items-center gap-2">
                                        <GraduationCap className="w-4 h-4" /> Education
                                    </h2>
                                    {resumeData.education.map((edu, idx) => (
                                        <div key={idx} className="mb-4">
                                            <h3 className="font-bold text-gray-800">{edu.degree || "Untitled Degree"}</h3>
                                            <div className="flex justify-between text-sm text-gray-600">
                                                <span>{edu.institution}</span>
                                                <span>{edu.startYear} — {edu.endYear}</span>
                                            </div>
                                        </div>
                                    ))}
                                </section>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-auto pt-8 border-t border-gray-200 text-center text-xs text-gray-400">
                            Generated by <span className="font-bold">CodeInterview Platform</span> • {new Date().toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
