import asyncWrapper from "../middleware/asyncWrapper.js";
import {
  BAD_REQUEST,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
  UNAUTHENTICATED,
  UNAUTHORIZED,
} from "../error/error.js";
import userModel from "../model/user.model.js";
import ct from "countries-and-timezones";
import {
  deleteFromCloud,
  uploadToCloud,
} from "../services/cloudinary.uploader.services.js";
import residenceInformationModel from "../model/residenceinfo.model.js";
import emergencyInformationModel from "../model/emergencycontact.model.js";
import mongo from "mongoose";
import otpModel from "../model/otp.model.js";
import crypto from "crypto";
import sendEmail from "../services/mailer.services.js";
import cleanupUploadedFiles from "../utils/cleanup.helper.utils.js";
import { StatusCodes } from "http-status-codes";
import { attachCookie, removeCookie } from "../utils/cookies.utils.js";
import instructorModel from "../model/instructor.model.js";
import studentModel from "../model/student.model.js";
import refreshTokenModel from "../model/refreshtoken.model.js";
import staffModel from "../model/staff.model.js";
import courseModel from "../model/course.model.js";
import categoryModel from "../model/category.model.js";
const registerStudent = asyncWrapper(async (req, res) => {
  let publicid;
  let isSessionEnded = false;
  const session = await mongo.startSession();
  session.startTransaction();
  //just using for mongo session else no need of tr cat
  try {
    const {
      firstName,
      lastName,
      fatherName,
      email,
      dateOfBirth,
      country,
      bio,
      password,
      phoneNumber,
      consentAccepted,
      parentPhoneNumber,
      ageGroup,
      age,
      address,
      city,
      postalCode,
      fullName,
      relationship,
      emergencyPhoneNumber,
    } = req.body;
    const category = await categoryModel.findOne({ categoryAgeGroup: { $in: [ageGroup] } });
    if (!category) {
      throw new BAD_REQUEST(`invalid age group: ${ageGroup}`);
    }
    if (!req.file) throw new BAD_REQUEST("Please provide avatar");
    if (!req.file.mimetype.startsWith("image/")) {
      throw new BAD_REQUEST("Please provide valid image format.");
    }

    const isEmailAlreadyExist = await userModel.findOne({ email });

    if (isEmailAlreadyExist)
      throw new BAD_REQUEST("user already exist with this email");

    if (!consentAccepted)
      throw new BAD_REQUEST("You must accept consent to register");
    const countryData = ct.getCountry(country); //only tak value liek 'PK , IND so make sure admin add only these values' logic len 2 and using same package find if undefined so no country.gg
    if (!countryData) throw new NOT_FOUND("No country found.");
    const timezone = countryData.timezones[0];
    const profilePictureCloud = await uploadToCloud(req.file.path);
    publicid = profilePictureCloud.publicId; //incase creation failed so we can delete from cloud
    if (!profilePictureCloud.publicId || !profilePictureCloud.secureUrl) {
      throw new INTERNAL_SERVER_ERROR(
        "Unable to uplaod file to the server please provide a valid file"
      );
    }
    const profilePicture = { ...profilePictureCloud };
    const [user] = await userModel.create(
      [
        {
          firstName,
          lastName,
          fatherName,
          email,
          password,
          dateOfBirth,
          phoneNumber,
          consentAccepted,
          bio,
          role: "student",
          profilePicture,
        },
      ],
      { session }
    );

    //  create student other fields that are not comon b/w std and teacher
    await studentModel.create(
      [
        {
          age,
          ageGroup,
          parentPhoneNumber,
          createdBy: user._id,
        },
      ],
      { session }
    );
    //  create residence
    await residenceInformationModel.create(
      [
        {
          createdBy: user._id,
          address,
          country,
          city,
          postalCode,
          timezone,
        },
      ],
      { session }
    );

    // create emergency contact

    await emergencyInformationModel.create(
      [
        {
          createdBy: user._id,
          fullName,
          relationship,
          phoneNumber: emergencyPhoneNumber,
        },
      ],
      { session }
    );
    let otp = crypto.randomInt(1000, 9999);
    const [userOtp] = await otpModel.create(
      [
        {
          createdBy: user._id,
          otp: otp,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();
    isSessionEnded = true;
    await sendEmail({
      to: email,
      subject: "Please verify your account",
      text: userOtp.otp.toString(),
    });
    cleanupUploadedFiles(req);
    res.status(201).json({
      success: true,
      message: "Student registered successfully.Otp sent via email",
      data: [],
    });
  } catch (err) {
    if (isSessionEnded === false) {
      await session.abortTransaction();
      session.endSession();
    }
    if (publicid) {
      const { result } = await deleteFromCloud(publicid);
      if (result !== "ok")
        throw new BAD_REQUEST("some thing went wrong while deleting the file");
    }
    throw err;
  }
});

const verifyEmailAddress = asyncWrapper(async (req, res) => {
  const { email, otp } = req.body;
  const user = await userModel.findOne({ email });
  if (!user) {
    throw new NOT_FOUND("no user found with this email.");
  }
  if (user.isEmailVerified) {
    throw new BAD_REQUEST("email is already verified please login");
  }
  const isOtpExist = await otpModel.findOne({ createdBy: user._id });
  if (!isOtpExist) {
    let otp = crypto.randomInt(1000, 9999);
    const userOtp = await otpModel.create({
      createdBy: user._id,
      otp: otp,
    });
    await sendEmail({
      to: email,
      subject: "Please verify your account",
      text: userOtp.otp.toString(),
    });
    throw new NOT_FOUND("A new otp is sent to your email.");
  }

  if (otp.toString() !== isOtpExist.otp.toString()) {
    throw new BAD_REQUEST("invailed otp");
  }

  user.isEmailVerified = true;
  user.emailVerificationDate = new Date();
  await user.save();
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Email verification successfull. Please login",
    data: [],
  });
});

const loginUser = asyncWrapper(async (req, res) => {
  const { email, password } = req.body;

  const user = await userModel.findOne({ email: email }).select("+password");
  if (!user) throw new NOT_FOUND("no user found");
  if (user.role === "admin")
    throw new BAD_REQUEST("admins can not be logged in using this route");
  if (!user.isEmailVerified) {
    const isOtpExist = await otpModel.findOne({ createdBy: user._id });
    if (!isOtpExist) {
      let otp = crypto.randomInt(1000, 9999);
      const userOtp = await otpModel.create({
        createdBy: user._id,
        otp: otp,
      });
      await sendEmail({
        to: email,
        subject: "Please verify your account",
        text: userOtp.otp.toString(),
      });
      throw new NOT_FOUND("A new otp is sent to your email.");
    }
    throw new UNAUTHORIZED("Please verify your email before logging in.");
  }

  const isCorrectPassword = await user.comparePassword(password);

  if (!isCorrectPassword) {
    throw new UNAUTHENTICATED("Invailed password please try again");
  }
  let refreshToken = "";

  const existingToken = await refreshTokenModel.findOne({
    createdBy: user._id,
  });

  if (existingToken) {
    const { isValid } = existingToken;
    if (!isValid) throw new UNAUTHENTICATED("Authentication failed");
    refreshToken = existingToken.refreshToken;
    attachCookie({
      user: {
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        userId: user._id,
      },
      refreshToken,
      res,
    });
    user.lastLogin = new Date();
    await user.save();
    res.status(StatusCodes.OK).json({
      success: true,
      message: "user logged in successfull",
      data: [{
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture.secureUrl,
        userId: user._id
      }],
    });
    return;
  }

  refreshToken = crypto.randomBytes(40).toString("hex");
  const userAgent = req.headers["user-agent"];
  const ip = req.ip;
  const userToken = { refreshToken, userAgent, ip, createdBy: user._id };
  const newRefreshToken = await refreshTokenModel.create(userToken);

  user.lastLogin = new Date();
  await user.save();
  attachCookie({
    user: {
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      userId: user._id,
      firstName: user.firstName,
      lastName: user.lastName
    },
    refreshToken: newRefreshToken.refreshToken,
    res,
  });
  res.status(StatusCodes.OK).json({
    success: true,
    message: "User logged in successfull.",
    data: [{
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePicture: user.profilePicture.secureUrl
    }],
  });
});

const loginStaff = asyncWrapper(async (req, res) => {
  const { email, password } = req.body;
  const user = await staffModel.findOne({ email }).select("+password");
  if (!user) throw new NOT_FOUND("user not found");
  const isCorrectPassword = await user.comparePassword(password);
  if (!isCorrectPassword) {
    throw new UNAUTHENTICATED("Invailed password please try again");
  }
  let refreshToken = "";
  if (user.role !== "admin") {
    if (user.role === null) throw new UNAUTHORIZED("No Role assigned");
    if (user.roleStatus === "pending")
      throw new UNAUTHORIZED("You are not assigned any role yet.");
  }
  const existingToken = await refreshTokenModel.findOne({
    createdBy: user._id,
  });
  if (existingToken) {
    const { isValid } = existingToken;
    if (!isValid) throw new UNAUTHENTICATED("Authentication failed");
    refreshToken = existingToken.refreshToken;
    attachCookie({
      user: {
        email: user.email,
        role: user.role,
        userId: user._id,
        firstName: user.firstName,
        lastName: user.lastName
      },
      refreshToken,
      res,
    });
    user.lastLogin = new Date();
    await user.save();
    res.status(StatusCodes.OK).json({
      success: true,
      message: "user logged in successfull",
      data: [{
        email: user.email,
        role: user.role,
        userId: user._id,
        firstName: user.firstName,
        lastName: user.lastName
      }],
    });
    return;
  }

  refreshToken = crypto.randomBytes(40).toString("hex");
  const userAgent = req.headers["user-agent"];
  const ip = req.ip;
  const userToken = { refreshToken, userAgent, ip, createdBy: user._id };
  const newRefreshToken = await refreshTokenModel.create(userToken);

  user.lastLogin = new Date();
  await user.save();
  attachCookie({
    user: {
      email: user.email,
      role: user.role,
      userId: user._id,
    },
    refreshToken: newRefreshToken.refreshToken,
    res,
  });
  res.status(StatusCodes.OK).json({
    success: true,
    message: "user logged in successfull",
    data: [{
      email: user.email,
      role: user.role,
      userId: user._id,
      firstName: user.firstName,
      lastName: user.lastName
    }],
  });
});

const registerInstructor = asyncWrapper(async (req, res) => {
  let isSessionEnded = false;
  let publicIdProfilePicture;
  let publicIdTranscript;
  const session = await mongo.startSession();
  session.startTransaction();
  //just using for mongo session else no need of tr cat
  try {
    const {
      // user fields like base user
      firstName,
      lastName,
      fatherName,
      email,
      password,
      phoneNumber,
      dateOfBirth,
      bio,
      consentAccepted,
      country,
      address,
      city,
      postalCode,
      fullName,
      relationship,
      emergencyPhoneNumber,

      // instructor fields ..
      qualification,
      degreeTitle,
      graduationYear,
      totalMarks,
      obtainedMarks,
      institution,
      coursePreferences,
    } = req.body;

    if (!req.files || req.files.length < 2) {
      throw new BAD_REQUEST(
        "Please provide both avatar (image) and transcript (PDF)"
      );
    }
    let avatarFile, transcriptFile;

    for (const file of req.files) {
      if (file.mimetype.startsWith("image/")) {
        avatarFile = file;
      } else if (file.mimetype === "application/pdf") {
        transcriptFile = file;
      }
    }

    if (!avatarFile) {
      throw new BAD_REQUEST("Avatar image is required (jpg, png, etc.)");
    }
    if (!transcriptFile) {
      throw new BAD_REQUEST("Transcript PDF is required");
    }
    if (avatarFile.size > 1 * 1024 * 1024) {
      throw new BAD_REQUEST("Avatar image size must not exceed 1 MB");
    }
    if (transcriptFile.size > 10 * 1024 * 1024) {
      throw new BAD_REQUEST("Transcript PDF size must not exceed 10 MB");
    }

    //check course id weather it exist or not in the db .........
    const uniqueCoursePrefs = [...new Set(coursePreferences)];

    const existingCourses = await courseModel
      .find({
        _id: { $in: uniqueCoursePrefs },
      })
      .select("_id");

    if (existingCourses.length !== uniqueCoursePrefs.length) {
      throw new BAD_REQUEST("One or more selected courses are invalid");
    }
    if (!consentAccepted) {
      throw new BAD_REQUEST("You must accept consent to register");
    }
    const countryData = ct.getCountry(country); //only tak value liek 'PK , IND so make sure admin add only these values' logic len 2 and using same package find if undefined so no country.gg
    if (!countryData) throw new NOT_FOUND("No country found.");
    const timezone = countryData.timezones[0];
    const profilePictureCloud = await uploadToCloud(avatarFile.path);
    const transcriptCloud = await uploadToCloud(transcriptFile.path);

    publicIdProfilePicture = profilePictureCloud.publicId; //incase creation failed so we can delete from cloud
    publicIdTranscript = transcriptCloud.publicId;
    if (!publicIdProfilePicture || !publicIdTranscript) {
      throw new INTERNAL_SERVER_ERROR(
        "Unable to uplaod file to the server please provide a valid file"
      );
    }
    const profilePicture = { ...profilePictureCloud };
    const transcript = { ...transcriptCloud };

    const [user] = await userModel.create(
      [
        {
          firstName,
          lastName,
          fatherName,
          email,
          password,
          phoneNumber,
          dateOfBirth,
          bio,
          role: "instructor",
          consentAccepted,
          profilePicture
        },
      ],
      { session }
    );

    //  create residence
    await residenceInformationModel.create(
      [
        {
          createdBy: user._id,
          address,
          country,
          city,
          postalCode,
          timezone,
        },
      ],
      { session }
    );

    // create emergency contact

    await emergencyInformationModel.create(
      [
        {
          createdBy: user._id,
          fullName,
          relationship,
          phoneNumber: emergencyPhoneNumber,
        },
      ],
      { session }
    );
    await instructorModel.create(
      [
        {
          totalMarks,
          obtainedMarks,
          qualification,
          degreeTitle,
          graduationYear,
          transcript,
          institution,
          createdBy: user._id,
          coursePreferences: uniqueCoursePrefs,
        },
      ],
      { session }
    );
    let otp = crypto.randomInt(1000, 9999);
    const [userOtp] = await otpModel.create(
      [
        {
          createdBy: user._id,
          otp: otp,
        },
      ],
      { session }
    );
    await session.commitTransaction();
    session.endSession();
    isSessionEnded = true;
    await sendEmail({
      to: email,
      subject: "Please verify your account",
      text: userOtp.otp.toString(),
    });

    cleanupUploadedFiles(req);
    res.status(201).json({
      success: true,
      message: "Instructor registered successfully.Otp sent via email",
      data: []
    });
  } catch (err) {
    if (isSessionEnded === false) {
      await session.abortTransaction();
      session.endSession();
    }
    if (publicIdProfilePicture) await deleteFromCloud(publicIdProfilePicture);
    if (publicIdTranscript) await deleteFromCloud(publicIdTranscript);
    throw err;
  }
});

const logoutUser = asyncWrapper(async (req, res) => {
  removeCookie({ res });
  res.status(StatusCodes.OK).json({
    success: true,
    message: "user logged out successfull",
    data: [],
  });
});
const forgotPassword = asyncWrapper(async (req, res) => {
  const { email } = req.body;

  const user = await userModel.findOne({ email });
  if (!user) throw new NOT_FOUND("no account found with this email");
  const otp = crypto.randomInt(1000, 9999);
  await otpModel.findOneAndUpdate(
    { createdBy: user._id },
    { otp, createdAt: Date.now() },
    { upsert: true, new: true }
  );

  await sendEmail({
    to: email,
    subject: "password change otp",
    text: `your verification code:${otp}`,
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: "otp sent to your email address",
    data: []
  });
});
const verifyInitialOtp = asyncWrapper(async (req, res) => {
  const { email, otp } = req.body;
  const user = await userModel.findOne({ email });
  const validOtp = await otpModel.findOne({ createdBy: user._id, otp });
  if (!validOtp) throw new BAD_REQUEST("Invalid or expired OTP");
  res.status(StatusCodes.OK).json({ success: true, message: "OTP Verified", data: [] });
});
const resetPasswordWithOtp = asyncWrapper(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const user = await userModel.findOne({ email });
  if (!user) throw new NOT_FOUND("User not found");
  const otpRecord = await otpModel.findOne({
    createdBy: user._id,
    otp: otp
  });

  if (!otpRecord) {
    throw new BAD_REQUEST("invalid or expired otp plz request a new one.");
  }
  const userWithPass = await userModel.findById(user._id).select("+password");
  const isSamePassword = await userWithPass.comparePassword(newPassword);

  if (isSamePassword) {
    throw new BAD_REQUEST("new password cannot be the same as the old password");
  }
  userWithPass.password = newPassword;
  await userWithPass.save();
  await otpModel.deleteOne({ _id: otpRecord._id });

  res.status(StatusCodes.OK).json({
    success: true,
    message: "your paassword has been reset successfully please login ",
    data: []
  });
});
export {
  registerStudent,
  registerInstructor,
  loginUser,
  verifyEmailAddress,
  logoutUser,
  loginStaff,
  forgotPassword,
  verifyInitialOtp,
  resetPasswordWithOtp
};
