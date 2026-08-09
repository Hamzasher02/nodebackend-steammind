import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieSignature from 'cookie-signature';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: './.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/STEMPROJECTTESTONE';
const JWT_SECRET = process.env.JWT_SECRET || 'add json web token secret here';
const COOKIE_SECRET = process.env.COOKIE_PARSER_SECRET || 'your-cookie-secret';

// Import Models
import roleModel, { ROUTES, PERMISSIONS } from './model/role.model.js';
import staffModel from './model/staff.model.js';
import userModel from './model/user.model.js';
import studentModel from './model/student.model.js';
import instructorModel from './model/instructor.model.js';
import categoryModel from './model/category.model.js';
import courseModel from './model/course.model.js';
import courseModuleModel from './model/coursemodule.model.js';
import courseLectureModel from './model/courselecture.model.js';
import coursePdfMaterialModel from './model/coursepdfmaterials.model.js';
import courseOutcomeModel from './model/learningoutcome.model.js';
import courseBundleModel from './model/coursebundle.model.js';
import quizModel from './model/quiz.model.js';
import quizQuestionModel from './model/quizquestion.model.js';
import quizAttemptModel from './model/quizattempt.model.js';
import enrollmentModel from './model/enrollment.model.js';
import courseFeedbackModel from './model/coursefeedback.model.js';
import courseSessionModel from './model/coursesession.model.js';
import demoSessionRequestModel from './model/demosessionrequest.model.js';
import homepageModel from './model/homepage.model.js';
import aboutUsPageModel from './model/aboutuspage.model.js';
import productsPageModel from './model/productspage.model.js';
import campPageModel from './model/camppage.model.js';
import contactUsPageModel from './model/contactuspage.model.js';
import coursesPageModel from './model/coursespage.model.js';
import logosModel from './model/logos.model.js';
import blogModel from './model/blog.model.js';
import competitionModel from './model/competition.model.js';
import competitionRegistrationModel from './model/competitionregistration.model.js';
import discussionPostModel from './model/discussionpost.model.js';
import discussionCommentModel from './model/discussioncomment.model.js';
import chatModel from './model/chat.model.js';
import messageModel from './model/message.model.js';
import flaggedMessageModel from './model/flaggedmessage.model.js';
import documentModel from './model/document.model.js';
import activityTypeModel from './model/activitytype.model.js';
import activityLogModel from './model/activitylog.model.js';
import cartModel from './model/cart.model.js';
import nameChangeRequestModel from './model/namechangerequest.model.js';

function createSignedCookie(payload) {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
  const signed = 's:' + cookieSignature.sign(token, COOKIE_SECRET);
  return { token, cookieHeader: 'accessToken=' + encodeURIComponent(signed) };
}

async function seed() {
  console.log('Connecting to MongoDB:', MONGO_URI);
  await mongoose.connect(MONGO_URI);
  console.log('Connected successfully!');

  // Hash common password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('Password@123', salt);

  // Define full permissions for all routes
  const fullRoutePermissions = ROUTES.map(r => ({
    route: r,
    permissions: ["read", "write", "update", "delete"]
  }));

  // 1. Roles
  let roleAdmin = await roleModel.findOne({ name: 'admin' });
  if (!roleAdmin) {
    roleAdmin = await roleModel.create({
      name: 'admin',
      type: 'default',
      description: 'System Administrator Role with full control',
      routePermission: fullRoutePermissions,
      createdBy: new mongoose.Types.ObjectId()
    });
  } else {
    roleAdmin.routePermission = fullRoutePermissions;
    await roleAdmin.save();
  }

  let roleManager = await roleModel.findOne({ name: 'website manager' });
  if (!roleManager) {
    roleManager = await roleModel.create({
      name: 'website manager',
      type: 'default',
      description: 'Website Content Manager Role',
      routePermission: fullRoutePermissions,
      createdBy: roleAdmin._id
    });
  } else {
    roleManager.routePermission = fullRoutePermissions;
    await roleManager.save();
  }

  let roleMod = await roleModel.findOne({ name: 'moderator' });
  if (!roleMod) {
    roleMod = await roleModel.create({
      name: 'moderator',
      type: 'default',
      description: 'Community and Chat Moderator Role',
      routePermission: fullRoutePermissions,
      createdBy: roleAdmin._id
    });
  } else {
    roleMod.routePermission = fullRoutePermissions;
    await roleMod.save();
  }

  // 2. Staff Accounts
  await staffModel.deleteMany({ email: { $in: ['admin@steamminds.org', 'manager@steamminds.org', 'moderator@steamminds.org'] } });
  let staffAdmin = await staffModel.create({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@steamminds.org',
    password: 'Password@123',
    role: 'admin',
    roleStatus: 'active',
    profilePicture: {
      secureUrl: 'https://res.cloudinary.com/dvizkrkox/image/upload/v1/samples/avatar.jpg',
      publicId: 'samples/avatar_admin'
    }
  });

  let staffManager = await staffModel.create({
    firstName: 'Manager',
    lastName: 'User',
    email: 'manager@steamminds.org',
    password: 'Password@123',
    role: 'website manager',
    roleStatus: 'active',
    profilePicture: {
      secureUrl: 'https://res.cloudinary.com/dvizkrkox/image/upload/v1/samples/manager.jpg',
      publicId: 'samples/avatar_manager'
    }
  });

  let staffMod = await staffModel.create({
    firstName: 'Moderator',
    lastName: 'User',
    email: 'moderator@steamminds.org',
    password: 'Password@123',
    role: 'moderator',
    roleStatus: 'active',
    profilePicture: {
      secureUrl: 'https://res.cloudinary.com/dvizkrkox/image/upload/v1/samples/mod.jpg',
      publicId: 'samples/avatar_mod'
    }
  });

  // 3. User Accounts (Student & Instructor) - Ensure isEmailVerified: true
  await userModel.deleteMany({ email: { $in: ['student@test.com', 'instructor@test.com'] } });
  let studentUser = await userModel.create({
    firstName: 'Test',
    lastName: 'Student',
    fatherName: 'Father',
    email: 'student@test.com',
    password: 'Password@123',
    phoneNumber: '+923001234567',
    bio: 'I am a passionate student ready to learn STEAM courses.',
    role: 'student',
    accountStatus: 'active',
    isEmailVerified: true,
    emailVerificationDate: new Date(),
    consentAccepted: true,
    profilePicture: {
      secureUrl: 'https://res.cloudinary.com/dvizkrkox/image/upload/v1/samples/student.jpg',
      publicId: 'samples/avatar_student'
    }
  });

  let instructorUser = await userModel.create({
    firstName: 'Test',
    lastName: 'Instructor',
    fatherName: 'Father',
    email: 'instructor@test.com',
    password: 'Password@123',
    phoneNumber: '+923009876543',
    bio: 'Expert instructor in Artificial Intelligence and Robotics.',
    role: 'instructor',
    accountStatus: 'active',
    isEmailVerified: true,
    emailVerificationDate: new Date(),
    consentAccepted: true,
    profilePicture: {
      secureUrl: 'https://res.cloudinary.com/dvizkrkox/image/upload/v1/samples/instructor.jpg',
      publicId: 'samples/avatar_instructor'
    }
  });

  // Profiles
  let studentProfile = await studentModel.findOne({ createdBy: studentUser._id });
  if (!studentProfile) {
    studentProfile = await studentModel.create({
      createdBy: studentUser._id,
      parentPhoneNumber: '+923001234567',
      age: 15,
      level: 'basic'
    });
  }

  await instructorModel.deleteMany({ createdBy: instructorUser._id });
  let instructorProfile = await instructorModel.create({
    createdBy: instructorUser._id,
    qualification: 'Master of Science',
    degreeTitle: 'MS Computer Science',
    graduationYear: 2020,
    totalMarks: 1000,
    obtainedMarks: 850,
    institution: 'NUST University',
    transcript: {
      publicId: 'samples/transcript_doc',
      secureUrl: 'https://res.cloudinary.com/dvizkrkox/image/upload/v1/samples/transcript.pdf'
    }
  });

  // 4. Category & Course
  let category = await categoryModel.findOne({ categoryName: 'Robotics & AI' });
  if (!category) {
    category = await categoryModel.create({
      categoryName: 'Robotics & AI',
      categoryDescription: 'Learn building smart robots and AI models.',
      categoryAgeGroup: ['10-16 years'],
      categoryLevel: ['beginner'],
      subCategory: ['Hardware', 'Software'],
      icon: {
        secureUrl: 'https://res.cloudinary.com/dvizkrkox/image/upload/v1/samples/category.jpg',
        publicId: 'samples/category_robotics'
      },
      createdBy: staffAdmin._id
    });
  }

  let course = await courseModel.findOne({ courseTitle: 'Introduction to Python & Arduino' });
  if (!course) {
    course = await courseModel.create({
      courseTitle: 'Introduction to Python & Arduino',
      courseEnrollementType: 'live',
      courseCategory: [category._id.toString()],
      courseSubCategory: 'Hardware',
      courseAgeGroup: '10-16 years',
      courseLevel: 'beginner',
      coursePrice: '150',
      courseThumbnail: {
        secureUrl: 'https://res.cloudinary.com/dvizkrkox/image/upload/v1/samples/course.jpg',
        publicId: 'samples/course_python'
      },
      courseOutline: {
        secureUrl: 'https://res.cloudinary.com/dvizkrkox/image/upload/v1/samples/outline.pdf',
        publicId: 'samples/course_outline'
      },
      courseOverview: {
        courseDescription: 'Master Python basics and connect sensors with Arduino microcontroller boards.',
        courseDuration: '8 weeks',
        coursePrerequisite: 'Basic computer operation',
        courseTargetAudience: 'Kids 10-16'
      },
      createdBy: staffAdmin._id
    });
  }

  // 5. Website Management (CMS) Seeding
  // Homepage
  let homepage = await homepageModel.findOne();
  if (!homepage) {
    homepage = await homepageModel.create({
      hero: {
        title: 'Welcome to SteamMinds',
        subtitle: 'Empowering the next generation of innovators',
        backgroundImages: ['https://res.cloudinary.com/dvizkrkox/image/upload/v1/samples/hero.jpg']
      },
      events: [{
        title: 'Annual Robotics Olympiad',
        description: 'Compete with top young roboticists worldwide.',
        eventDate: new Date(Date.now() + 30*24*3600*1000),
        image: { secureUrl: 'https://res.cloudinary.com/dvizkrkox/image/upload/v1/samples/event.jpg', publicId: 'samples/event' }
      }],
      aboutUs: {
        title: 'About SteamMinds',
        description: 'Leading STEM education provider.'
      },
      brandCards: [{
        title: 'Interactive Learning',
        description: 'Hands-on project based curriculum.',
        icon: { secureUrl: 'https://res.cloudinary.com/dvizkrkox/image/upload/v1/samples/brand.jpg', publicId: 'samples/brand' }
      }]
    });
  }

  // Courses Page
  let coursesPage = await coursesPageModel.findOne();
  if (!coursesPage) {
    coursesPage = await coursesPageModel.create({
      hero: {
        title: 'Explore Our Courses',
        subtitle: 'Find the perfect STEM course for your child',
        backgroundImage: 'https://res.cloudinary.com/dvizkrkox/image/upload/v1/samples/courses_hero.jpg'
      },
      sections: [{
        title: 'Featured Programs',
        description: 'Our top rated hands-on programs',
        image: 'https://res.cloudinary.com/dvizkrkox/image/upload/v1/samples/featured.jpg'
      }]
    });
  }

  // About Us Page
  let aboutUsPage = await aboutUsPageModel.findOne();
  if (!aboutUsPage) {
    aboutUsPage = await aboutUsPageModel.create({
      hero: {
        title: 'Our Mission & Vision',
        subtitle: 'Building a brighter future through technology',
        backgroundImage: 'https://res.cloudinary.com/dvizkrkox/image/upload/v1/samples/about_hero.jpg'
      },
      section1: { title: 'Who We Are', description: 'SteamMinds is a premier institute.' },
      section2: { title: 'Why Choose Us', description: 'Award winning curriculum.' },
      articles: [{ title: 'STEM Education Impact', content: 'Detailed article on STEM impact.' }],
      strategicPartnerships: [{
        name: 'Tech Giant Corp',
        logo: { secureUrl: 'https://res.cloudinary.com/dvizkrkox/image/upload/v1/samples/partner.jpg', publicId: 'samples/partner' }
      }],
      coreTeam: [{
        name: 'Dr. Sarah Connor',
        role: 'Chief Scientific Officer',
        image: { secureUrl: 'https://res.cloudinary.com/dvizkrkox/image/upload/v1/samples/sarah.jpg', publicId: 'samples/sarah' }
      }],
      supportingTeam: [{
        name: 'John Doe',
        role: 'Lead Mentor',
        image: { secureUrl: 'https://res.cloudinary.com/dvizkrkox/image/upload/v1/samples/john.jpg', publicId: 'samples/john' }
      }]
    });
  }

  // Products Page
  let productsPage = await productsPageModel.findOne();
  if (!productsPage) {
    productsPage = await productsPageModel.create({
      hero: {
        title: 'STEM Kits & Hardware',
        subtitle: 'High quality educational robotics kits',
        backgroundImage: 'https://res.cloudinary.com/dvizkrkox/image/upload/v1/samples/products_hero.jpg'
      },
      sections: [{
        title: 'Robotics Starter Kit',
        description: 'Includes microcontroller, sensors, motors, and guides.',
        image: 'https://res.cloudinary.com/dvizkrkox/image/upload/v1/samples/kit.jpg'
      }]
    });
  }

  // Contact Us Page
  let contactUsPage = await contactUsPageModel.findOne();
  if (!contactUsPage) {
    contactUsPage = await contactUsPageModel.create({
      section1: {
        title: 'Get In Touch',
        description: 'We are here to answer your questions.',
        bgImage: 'https://res.cloudinary.com/dvizkrkox/image/upload/v1/samples/contact_bg.jpg'
      },
      locations: [{
        city: 'New York',
        address: '100 Innovation Way, NY 10001',
        phone: '+1 800 555 0199',
        icon: { secureUrl: 'https://res.cloudinary.com/dvizkrkox/image/upload/v1/samples/loc.jpg', publicId: 'samples/loc' }
      }]
    });
  }

  // Camp Page
  let campPage = await campPageModel.findOne({ pageType: 'summer' });
  if (!campPage) {
    campPage = await campPageModel.create({
      pageType: 'summer',
      hero: {
        title: 'Summer STEAM Camp 2026',
        subtitle: 'An unforgettable 4-week summer adventure',
        backgroundImage: 'https://res.cloudinary.com/dvizkrkox/image/upload/v1/samples/camp.jpg'
      },
      section1: { title: 'Camp Highlights', description: 'Robotics, Coding, 3D Printing.' },
      advantages: [{ title: 'Expert Guidance', description: 'Certified mentors.' }]
    });
  }

  await blogModel.deleteMany({ urlSlug: 'top-5-reasons-kids-should-learn-coding-2026' });
  let blog = await blogModel.findOne({ title: 'Top 5 Reasons Kids Should Learn Coding in 2026' });
  if (!blog) {
    blog = await blogModel.create({
      title: 'Top 5 Reasons Kids Should Learn Coding in 2026',
      urlSlug: 'top-5-reasons-kids-should-learn-coding-2026',
      category: 'Technology',
      authorName: 'Admin Team',
      content: 'Coding builds logic, problem-solving skills, and creativity...',
      tags: ['coding', 'education', 'kids'],
      featuredImage: { secureUrl: 'https://res.cloudinary.com/dvizkrkox/image/upload/v1/samples/blog.jpg', publicId: 'samples/blog' },
      cards: [{ title: 'Logic Building', content: 'How coding helps brain development.' }]
    });
  }

  await competitionModel.deleteMany({ urlSlug: 'global-youth-ai-challenge-2026' });
  let competition = await competitionModel.findOne({ title: 'Global Youth AI Challenge 2026' });
  if (!competition) {
    competition = await competitionModel.create({
      title: 'Global Youth AI Challenge 2026',
      urlSlug: 'global-youth-ai-challenge-2026',
      shortDescription: 'Create AI solutions for climate change.',
      startDate: new Date(),
      endDate: new Date(Date.now() + 60*24*3600*1000),
      rules: 'Teams of up to 4 students.',
      prizePool: '$10,000 in awards',
      thumbnail: { secureUrl: 'https://res.cloudinary.com/dvizkrkox/image/upload/v1/samples/comp.jpg', publicId: 'samples/comp' }
    });
  }

  // Competition Registration
  let compReg = await competitionRegistrationModel.findOne({ competitionId: competition._id });
  if (!compReg) {
    compReg = await competitionRegistrationModel.create({
      competitionId: competition._id,
      studentName: 'Test Student',
      grade: 'Grade 10',
      teamName: 'CyberKnights',
      teamSize: 4,
      status: 'pending'
    });
  }

  // Logos
  let logos = await logosModel.findOne();
  if (!logos) {
    logos = await logosModel.create({
      headerLogo: { secureUrl: 'https://res.cloudinary.com/dvizkrkox/image/upload/v1/samples/header_logo.png', publicId: 'samples/header_logo' },
      footerLogo: { secureUrl: 'https://res.cloudinary.com/dvizkrkox/image/upload/v1/samples/footer_logo.png', publicId: 'samples/footer_logo' }
    });
  }

  // 6. Chat & Messages Seeding
  let chat = await chatModel.findOne({ participants: { $all: [studentUser._id, instructorUser._id] } });
  if (!chat) {
    chat = await chatModel.create({
      participants: [studentUser._id, instructorUser._id],
      status: 'active',
      createdBy: studentUser._id
    });
  }

  let message = await messageModel.findOne({ chatId: chat._id });
  if (!message) {
    message = await messageModel.create({
      chatId: chat._id,
      senderId: studentUser._id,
      messageText: 'Hello instructor! I have a question about Python loops.'
    });
  }

  let document = await documentModel.findOne({ uploadedBy: studentUser._id });
  if (!document) {
    document = await documentModel.create({
      messageId: message._id,
      uploadedBy: studentUser._id,
      file: {
        secureUrl: 'https://res.cloudinary.com/dvizkrkox/image/upload/v1/samples/assignment.pdf',
        publicId: 'samples/assignment_pdf',
        originalName: 'python_assignment_1.pdf'
      }
    });
  }

  let flaggedMessage = await flaggedMessageModel.findOne({ messageId: message._id });
  if (!flaggedMessage) {
    flaggedMessage = await flaggedMessageModel.create({
      messageId: message._id,
      chatId: chat._id,
      senderId: studentUser._id,
      flaggedBy: instructorUser._id,
      reason: 'Inappropriate language check',
      messageSnapshot: 'Hello instructor! I have a question about Python loops.'
    });
  }

  // Generate Tokens & Signed Cookie Headers
  const adminAuth = createSignedCookie({ email: staffAdmin.email, role: 'admin', userId: staffAdmin._id.toString(), firstName: 'Super', lastName: 'Admin' });
  const managerAuth = createSignedCookie({ email: staffManager.email, role: 'website manager', userId: staffManager._id.toString(), firstName: 'Website', lastName: 'Manager' });
  const modAuth = createSignedCookie({ email: staffMod.email, role: 'moderator', userId: staffMod._id.toString(), firstName: 'Community', lastName: 'Moderator' });
  const studentAuth = createSignedCookie({ email: studentUser.email, role: 'student', userId: studentUser._id.toString(), firstName: 'Test', lastName: 'Student' });
  const instructorAuth = createSignedCookie({ email: instructorUser.email, role: 'instructor', userId: instructorUser._id.toString(), firstName: 'Test', lastName: 'Instructor' });

  // Environment Variables to set
  const sampleEnv = {
    baseUrl: 'http://localhost:3000',
    basePath: '/api/v1',
    JWT_TOKEN: adminAuth.token,
    ADMIN_TOKEN: adminAuth.token,
    ADMIN_COOKIE: adminAuth.cookieHeader,
    MANAGER_COOKIE: managerAuth.cookieHeader,
    MODERATOR_COOKIE: modAuth.cookieHeader,
    STUDENT_COOKIE: studentAuth.cookieHeader,
    INSTRUCTOR_COOKIE: instructorAuth.cookieHeader,

    // Entity IDs
    SAMPLE_EVENT_ID: (homepage && homepage.events && homepage.events[0]) ? homepage.events[0]._id.toString() : new mongoose.Types.ObjectId().toString(),
    SAMPLE_CARD_ID: (homepage && homepage.brandCards && homepage.brandCards[0]) ? homepage.brandCards[0]._id.toString() : new mongoose.Types.ObjectId().toString(),
    SAMPLE_COURSES_SECTION_ID: (coursesPage && coursesPage.sections && coursesPage.sections[0]) ? coursesPage.sections[0]._id.toString() : new mongoose.Types.ObjectId().toString(),
    SAMPLE_ARTICLE_ID: (aboutUsPage && aboutUsPage.articles && aboutUsPage.articles[0]) ? aboutUsPage.articles[0]._id.toString() : new mongoose.Types.ObjectId().toString(),
    SAMPLE_PARTNER_ID: (aboutUsPage && aboutUsPage.strategicPartnerships && aboutUsPage.strategicPartnerships[0]) ? aboutUsPage.strategicPartnerships[0]._id.toString() : new mongoose.Types.ObjectId().toString(),
    SAMPLE_CORE_MEMBER_ID: (aboutUsPage && aboutUsPage.coreTeam && aboutUsPage.coreTeam[0]) ? aboutUsPage.coreTeam[0]._id.toString() : new mongoose.Types.ObjectId().toString(),
    SAMPLE_SUPPORTING_MEMBER_ID: (aboutUsPage && aboutUsPage.supportingTeam && aboutUsPage.supportingTeam[0]) ? aboutUsPage.supportingTeam[0]._id.toString() : new mongoose.Types.ObjectId().toString(),
    SAMPLE_PRODUCT_SECTION_ID: (productsPage && productsPage.sections && productsPage.sections[0]) ? productsPage.sections[0]._id.toString() : new mongoose.Types.ObjectId().toString(),
    SAMPLE_LOCATION_ID: (contactUsPage && contactUsPage.locations && contactUsPage.locations[0]) ? contactUsPage.locations[0]._id.toString() : new mongoose.Types.ObjectId().toString(),
    SAMPLE_ADVANTAGE_ID: (campPage && campPage.advantages && campPage.advantages[0]) ? campPage.advantages[0]._id.toString() : new mongoose.Types.ObjectId().toString(),
    SAMPLE_BLOG_ID: blog ? blog._id.toString() : new mongoose.Types.ObjectId().toString(),
    SAMPLE_BLOG_CARD_ID: (blog && blog.cards && blog.cards[0]) ? blog.cards[0]._id.toString() : new mongoose.Types.ObjectId().toString(),
    SAMPLE_COMPETITION_ID: competition ? competition._id.toString() : new mongoose.Types.ObjectId().toString(),
    SAMPLE_REGISTRATION_ID: compReg ? compReg._id.toString() : new mongoose.Types.ObjectId().toString(),

    // Chat IDs
    SAMPLE_CHAT_ID: chat._id.toString(),
    SAMPLE_MESSAGE_ID: message._id.toString(),
    SAMPLE_DOCUMENT_ID: document._id.toString(),
    SAMPLE_FLAG_ID: flaggedMessage._id.toString(),
    SAMPLE_USER_ID: studentUser._id.toString(),
    SAMPLE_INSTRUCTOR_ID: instructorUser._id.toString(),
    SAMPLE_CATEGORY_ID: category._id.toString(),
    SAMPLE_COURSE_ID: course._id.toString(),

    ADMIN_EMAIL: 'admin@steamminds.org',
    ADMIN_PASSWORD: 'Password@123',
    STUDENT_EMAIL: 'student@test.com',
    STUDENT_PASSWORD: 'Password@123',
    INSTRUCTOR_EMAIL: 'instructor@test.com',
    INSTRUCTOR_PASSWORD: 'Password@123'
  };

  // Build Postman Environment JSON
  const envValues = Object.entries(sampleEnv).map(([key, value]) => ({
    key,
    value: value || '',
    type: 'default',
    enabled: true
  }));

  const postmanEnvObj = {
    id: 'steamminds-final-env-id',
    name: 'SteamMinds Final QA Environment',
    values: envValues,
    _postman_variable_scope: 'environment',
    _postman_exported_at: new Date().toISOString()
  };

  fs.writeFileSync('./SteamMinds_Final.postman_environment.json', JSON.stringify(postmanEnvObj, null, 2));
  fs.writeFileSync('./postman_environment_final.json', JSON.stringify(postmanEnvObj, null, 2));

  console.log('Database seeded and environment files written successfully!');
  console.log('Seeded IDs:');
  console.log('  Chat ID:', chat._id.toString());
  console.log('  Message ID:', message._id.toString());
  console.log('  Document ID:', document._id.toString());
  console.log('  Flag ID:', flaggedMessage._id.toString());
  console.log('  Blog ID:', blog._id.toString());
  console.log('  Competition ID:', competition._id.toString());

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seeding Error:', err);
  process.exit(1);
});
