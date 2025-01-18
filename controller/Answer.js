import mongoose from "mongoose";
import Question from "../models/Question.js";
import users from "../models/auth.js";



export const postanswer = async (req, res) => {
    const questionId = req.params.id; // Question ID
    const { noofanswers, answerbody, useranswered } = req.body; // Answer details from the request
    const userid = req.userid; // User ID from the authenticated request
    // Validate the question ID
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
        return res.status(404).send("Question unavailable...");
    }

    // Update the number of answers for the question
    updatenoofquestion(questionId, noofanswers);

    try {
        // Add the new answer to the question's answer list
        const updatedQuestion = await Question.findByIdAndUpdate(
            questionId,
            {
                $addToSet: { answer: [{ answerbody, useranswered, userid }] },
            },
            { new: true }
        );   
        

        // Fetch the owner of the question
        const questionObject = await Question.findById(questionId);
        const userIdObject = new mongoose.Types.ObjectId(questionObject.userid); // Convert to ObjectId
        const user = await users.findById(questionObject.userid);
        // Emit a notification to the question author on upvote
        if (user.notificationPreference){
         // Check if the question owner exists and emit the notification
            if (questionObject) {
                const io = req.app.get("socketio"); // Access the Socket.IO instance

                io.to(questionObject.userid).emit("answerNotification", {
                    questionId: userIdObject,
                    message: `Your question has received an answer!`,
                });
            }
        }
        else{
            console.log("notification denied");
        }

        // Respond with the updated question
        res.status(200).json(updatedQuestion);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error in posting the answer" });
    }
};


const updatenoofquestion=async(_id,noofanswers)=>{
    try {
        await Question.findByIdAndUpdate(_id,{
            $set:{noofanswers:noofanswers},
        });

    } catch (error) {
        console.log(error)
    }
}

export const deleteanswer=async(req,res)=>{
    const {id:_id}=req.params;
    const {answerid,noofanswers}=req.body;
    if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(404).send("question unavailable...");
    }
    if (!mongoose.Types.ObjectId.isValid(answerid)) {
        return res.status(404).send("answer unavailable...");
    }
    updatenoofquestion(_id,noofanswers);
    try {
        await Question.updateOne(
            {_id},
            {$pull:{answer:{_id:answerid}}}
        );
        res.status(200).json({message:"successfully deleted.."})
    } catch (error) {
        res.status(404).json({ message: "error in deleting.." });
        return
    }
}
