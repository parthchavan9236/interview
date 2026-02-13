const InterviewSlot = require("../models/InterviewSlot");
const Interview = require("../models/Interview");

// Create a new interview slot
const createSlot = async (req, res) => {
    try {
        console.log("Create slot request body:", req.body);
        console.log("User creating slot:", req.user?._id);

        const { startTime } = req.body;

        if (!startTime) {
            return res.status(400).json({ message: "Start time is required" });
        }

        const slot = await InterviewSlot.create({
            interviewer: req.user._id,
            startTime: new Date(startTime),
        });

        console.log("Slot created:", slot);
        res.status(201).json(slot);
    } catch (error) {
        console.error("Create slot error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get all open slots (not created by me)
const getOpenSlots = async (req, res) => {
    try {
        console.log("Fetching open slots for user:", req.user?._id);
        const query = {
            status: "open",
            // interviewer: { $ne: req.user._id }, // Commented out to allow seeing own slots
            startTime: { $gt: new Date() },
        };
        console.log("Query:", query);

        const slots = await InterviewSlot.find(query)
            .populate("interviewer", "name image")
            .sort({ startTime: 1 });

        console.log(`Found ${slots.length} open slots`);
        res.json(slots);
    } catch (error) {
        console.error("Error fetching open slots:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get my slots (created or booked)
const getMySlots = async (req, res) => {
    try {
        const slots = await InterviewSlot.find({
            $or: [{ interviewer: req.user._id }, { candidate: req.user._id }],
        })
            .populate("interviewer", "name image")
            .populate("candidate", "name image")
            .sort({ startTime: 1 });

        res.json(slots);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Book a slot
const bookSlot = async (req, res) => {
    try {
        const { id } = req.params;

        const slot = await InterviewSlot.findById(id);

        if (!slot) {
            return res.status(404).json({ message: "Slot not found" });
        }

        if (slot.status !== "open") {
            return res.status(400).json({ message: "Slot is not available" });
        }

        if (slot.interviewer.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: "Cannot book your own slot" });
        }

        slot.candidate = req.user._id;
        slot.status = "booked";
        await slot.save();

        // Create Interview session
        const interview = await Interview.create({
            title: "Technical Interview",
            interviewer: slot.interviewer,
            candidate: req.user._id,
            scheduledAt: slot.startTime,
            streamCallId: `interview-${slot._id}-${Date.now()}`,
            status: "scheduled"
        });

        res.json({ slot, interview });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const startInterview = async (req, res) => {
    try {
        const { id } = req.params;
        const interview = await Interview.findById(id);
        if (!interview) return res.status(404).json({ message: "Interview not found" });
        interview.status = "in_progress";
        interview.startTime = new Date();
        await interview.save();
        res.json(interview);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

const endInterview = async (req, res) => {
    try {
        const { id } = req.params;
        const { score, feedback } = req.body;
        const interview = await Interview.findById(id);
        if (!interview) return res.status(404).json({ message: "Interview not found" });
        interview.status = "completed";
        interview.endTime = new Date();
        interview.duration = (interview.endTime - interview.startTime) / (1000 * 60);
        interview.score = score;
        interview.feedback = feedback;
        await interview.save();
        res.json(interview);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

const getInterview = async (req, res) => {
    try {
        const interview = await Interview.findById(req.params.id)
            .populate("interviewer", "name image")
            .populate("candidate", "name image")
            .populate("problems");
        res.json(interview);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};


const addProblemToInterview = async (req, res) => {
    try {
        const { id } = req.params;
        const { problemId } = req.body;

        const interview = await Interview.findById(id);
        if (!interview) return res.status(404).json({ message: "Interview not found" });

        // Prevent duplicates
        if (!interview.problems.includes(problemId)) {
            interview.problems.push(problemId);
            await interview.save();
        }

        res.json(interview);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { createSlot, getOpenSlots, getMySlots, bookSlot, startInterview, endInterview, getInterview, addProblemToInterview };
