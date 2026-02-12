const inngest = require("./client");
const Interview = require("../models/Interview");

// Background function: Send interview reminder
const sendInterviewReminder = inngest.createFunction(
    { id: "send-interview-reminder", name: "Send Interview Reminder" },
    { event: "interview/reminder.send" },
    async ({ event, step }) => {
        const { interviewId } = event.data;

        const interview = await step.run("fetch-interview", async () => {
            return await Interview.findById(interviewId)
                .populate("interviewer", "name email")
                .populate("candidate", "name email");
        });

        if (!interview) {
            return { message: "Interview not found" };
        }

        // Log reminder (in production, you'd send an email here)
        await step.run("send-reminder", async () => {
            console.log(`Reminder: Interview "${interview.title}" scheduled at ${interview.scheduledAt}`);
            console.log(`Interviewer: ${interview.interviewer?.name}`);
            console.log(`Candidate: ${interview.candidate?.name || interview.candidateEmail}`);
            return { sent: true };
        });

        return { message: "Reminder sent successfully" };
    }
);

// Background function: Process submission asynchronously
const processSubmission = inngest.createFunction(
    { id: "process-submission", name: "Process Code Submission" },
    { event: "submission/process" },
    async ({ event, step }) => {
        const { submissionId } = event.data;

        await step.run("log-submission", async () => {
            console.log(`Processing submission: ${submissionId}`);
            return { processed: true };
        });

        return { message: "Submission processed" };
    }
);

module.exports = { sendInterviewReminder, processSubmission };
