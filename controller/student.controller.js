import asyncWrapper from "../middleware/asyncWrapper.js";
import studentModel from "../model/student.model.js";
import userModel from "../model/user.model.js";

const activeStudentAndNewRegistrations = asyncWrapper(async (req, res) => {
    const studentRecords = await studentModel.find({}).select("createdBy");
    console.log(studentRecords);
    const studentUserIds = studentRecords.map(stu => stu.createdBy);
    const activeStudents = await userModel.find({
        _id: { $in: studentUserIds },
        role: "student",
        accountStatus: "active"
    })
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newStudentRecords = await studentModel.find({
        createdAt: { $gte: sevenDaysAgo }
    })
    const newStudentUserIds = newStudentRecords.map(s => s.createdBy);
    const newStudents = await userModel.find({
        _id: { $in: newStudentUserIds },
        role: "student"
    }).select("firstName lastName email createdAt");

    res.status(200).json({
        success: true,
        message: "Active students and new registrations fetched",
        data: {
            activeStudentsCount: activeStudents.length,
            activeStudents,
            newStudentRegistrationsCount: newStudents.length,
            newStudents
        }
    });
});


export {activeStudentAndNewRegistrations}