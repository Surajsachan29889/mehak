import Question from "../models/Question.js";
import users from '../models/auth.js'
import mongoose from "mongoose";

export const Askquestion = async (req, res) => {
    const postquestiondata = req.body;
    const userid = req.userid;
    const postquestion = new Question({ ...postquestiondata, userid })
    try {
        await postquestion.save();
        res.status(200).json("Posted a question successfully");
    } catch (error) {
        console.log(error)
        res.status(404).json("couldn't post a new question");
        return
    }
};

export const getallquestion = async (req, res) => {
    try {
        const questionlist = await Question.find().sort({ askedon: -1 });
        res.status(200).json(questionlist)
    } catch (error) {
        console.log(error)
        res.status(404).json({ message: error.message });
        return
    }
};

export const deletequestion = async (req, res) => {
    const { id: _id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(404).send("question unavailable...");
    }
    try {
        await Question.findByIdAndDelete(_id);
        return res.status(200).json({ message: "successfully deleted..." })
    } catch (error) {
        return res.status(404).json({ message: error.message });
    }
};


export const votequestion = async (req, res) => {
    const { id: questionId } = req.params; // Question ID
    const { value } = req.body; // Voting type (upvote or downvote)
    const userid = req.userid; // Authenticated user ID
    // Validate the question ID
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
        return res.status(404).send("Question unavailable...");
    }

    try {
        const questionObject = await Question.findById(questionId);
        if (!questionObject) {
            return res.status(404).send("Question not found.");
        }

        if (questionObject.upvote.includes(userid) && value == 'upvote'){
            return res.status(200).json({ message: "Already voted" });

        }

        if (questionObject.downvote.includes(userid) && value == 'downvote'){
            return res.status(200).json({ message: "Already downvoted" });

        }

        const upIndex = questionObject.upvote.findIndex((id) => id === String(userid));
        const downIndex = questionObject.downvote.findIndex((id) => id === String(userid));
        // Handle upvote logic
        if (value === "upvote") {
            if (downIndex !== -1) {
                questionObject.downvote = questionObject.downvote.filter((id) => id !== String(userid));
            }
            if (upIndex === -1) {
                questionObject.upvote.push(userid);
            } else {
                questionObject.upvote = questionObject.upvote.filter((id) => id !== String(userid));
            }
        }
        // Handle downvote logic
        else if (value === "downvote") {
            if (upIndex !== -1) {
                questionObject.upvote = questionObject.upvote.filter((id) => id !== String(userid));
            }
            if (downIndex === -1) {
                questionObject.downvote.push(userid);
            } else {
                questionObject.downvote = questionObject.downvote.filter((id) => id !== String(userid));
            }
        }

        // Save the updated question
        await questionObject.save();
        const userIdObject = new mongoose.Types.ObjectId(questionObject.userid); // Convert to ObjectId
        const user = await users.findById(questionObject.userid);
        // Emit a notification to the question author on upvote
        if (user.notificationPreference){
            if (value === "upvote") {
                const io = req.app.get("socketio"); // Access the Socket.IO instance
    
                io.to(questionObject.userid).emit("upvoteNotification", {
                    questionId: userIdObject,
                    message: `Your question was upvoted!`,
                });
            }
    
            if (value === "downvote") {
                const io = req.app.get("socketio"); // Access the Socket.IO instance
    
                io.to(questionObject.userid).emit("downvoteNotification", {
                    questionId: userIdObject,
                    message: `Your question was downvoted!`,
                });
            }
        }

        res.status(200).json({ message: "Voted successfully.." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error in voting" });
    }
};

export const  getQuestion = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);
        res.status(200).json(question); // Ensure the `question.userid` (owner) is included in the response
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};
