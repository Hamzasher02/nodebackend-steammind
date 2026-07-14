import express from 'express';
import authenticationMiddleware from '../middleware/authentication.middleware.js';
import routeAuthorizationMiddleware from '../middleware/route.authorization.middleware.js';
import activityLogger from '../middleware/activitylogger.middleware.js';
import { validationMiddleware } from '../services/auth.validator.services.js';
import {
    uploadHeroImages,
    uploadPlatformFiles,
    uploadMissionFiles,
    uploadPartnerLogo,
    uploadArticleIcon,
    uploadStrategicFiles,
    uploadMemberImage
} from '../middleware/aboutuspage.multer.middleware.js';
import {
    getAboutUsPage,
    updateHero,
    updateIntroduction,
    addPlatform,
    updatePlatform,
    deletePlatform,
    addMissionSection,
    updateMissionSection,
    deleteMissionSection,
    addPartner,
    deletePartner,
    addArticle,
    updateArticle,
    deleteArticle,
    addStrategicPartner,
    updateStrategicPartner,
    deleteStrategicPartner,
    addCoreMember,
    updateCoreMember,
    deleteCoreMember,
    addSupportingMember,
    updateSupportingMember,
    deleteSupportingMember
} from '../controller/aboutuspage.controller.js';
import {
    introductionValidator,
    platformValidator,
    missionVisionValidator,
    articleValidator,
    strategicPartnershipValidator,
    teamMemberValidator
} from '../services/aboutuspage.validator.services.js';

const router = express.Router();

// 1. Get About Us Content (Public)
router.route('/')
    .get(
        activityLogger('WEBSITE_MANAGEMENT', 'Get about us page content request'),
        getAboutUsPage
    );

// 2. Update Hero Background Images
router.route('/hero')
    .patch(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'update'),
        uploadHeroImages,
        activityLogger('WEBSITE_MANAGEMENT', 'Update about us hero background images request'),
        updateHero
    );

// 3. Update Introduction
router.route('/introduction')
    .patch(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'update'),
        introductionValidator(),
        validationMiddleware,
        activityLogger('WEBSITE_MANAGEMENT', 'Update about us introduction request'),
        updateIntroduction
    );

// 4. Platforms CRUD
router.route('/platforms')
    .post(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'write'),
        uploadPlatformFiles,
        platformValidator(),
        validationMiddleware,
        activityLogger('WEBSITE_MANAGEMENT', 'Add platform request'),
        addPlatform
    );

router.route('/platforms/:platformId')
    .patch(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'update'),
        uploadPlatformFiles,
        platformValidator(),
        validationMiddleware,
        activityLogger('WEBSITE_MANAGEMENT', 'Update platform request'),
        updatePlatform
    )
    .delete(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'delete'),
        activityLogger('WEBSITE_MANAGEMENT', 'Delete platform request'),
        deletePlatform
    );

// 5. Mission/Vision CRUD
router.route('/mission-vision')
    .post(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'write'),
        uploadMissionFiles,
        missionVisionValidator(),
        validationMiddleware,
        activityLogger('WEBSITE_MANAGEMENT', 'Add mission vision section request'),
        addMissionSection
    );

router.route('/mission-vision/:sectionId')
    .patch(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'update'),
        uploadMissionFiles,
        missionVisionValidator(),
        validationMiddleware,
        activityLogger('WEBSITE_MANAGEMENT', 'Update mission vision section request'),
        updateMissionSection
    )
    .delete(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'delete'),
        activityLogger('WEBSITE_MANAGEMENT', 'Delete mission vision section request'),
        deleteMissionSection
    );

// 6. Partners CRUD
router.route('/partners')
    .post(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'write'),
        uploadPartnerLogo,
        activityLogger('WEBSITE_MANAGEMENT', 'Add partner logo request'),
        addPartner
    );

router.route('/partners/:partnerId')
    .delete(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'delete'),
        activityLogger('WEBSITE_MANAGEMENT', 'Delete partner logo request'),
        deletePartner
    );

// 7. Articles CRUD
router.route('/articles')
    .post(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'write'),
        uploadArticleIcon,
        articleValidator(),
        validationMiddleware,
        activityLogger('WEBSITE_MANAGEMENT', 'Add about us article request'),
        addArticle
    );

router.route('/articles/:articleId')
    .patch(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'update'),
        uploadArticleIcon,
        articleValidator(),
        validationMiddleware,
        activityLogger('WEBSITE_MANAGEMENT', 'Update about us article request'),
        updateArticle
    )
    .delete(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'delete'),
        activityLogger('WEBSITE_MANAGEMENT', 'Delete about us article request'),
        deleteArticle
    );

// 8. Strategic Partnerships CRUD
router.route('/strategic-partnerships')
    .post(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'write'),
        uploadStrategicFiles,
        strategicPartnershipValidator(),
        validationMiddleware,
        activityLogger('WEBSITE_MANAGEMENT', 'Add strategic partner request'),
        addStrategicPartner
    );

router.route('/strategic-partnerships/:partnerId')
    .patch(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'update'),
        uploadStrategicFiles,
        strategicPartnershipValidator(),
        validationMiddleware,
        activityLogger('WEBSITE_MANAGEMENT', 'Update strategic partner request'),
        updateStrategicPartner
    )
    .delete(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'delete'),
        activityLogger('WEBSITE_MANAGEMENT', 'Delete strategic partner request'),
        deleteStrategicPartner
    );

// 9. Core Team CRUD
router.route('/core-team')
    .post(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'write'),
        uploadMemberImage,
        teamMemberValidator(),
        validationMiddleware,
        activityLogger('WEBSITE_MANAGEMENT', 'Add core team member request'),
        addCoreMember
    );

router.route('/core-team/:memberId')
    .patch(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'update'),
        uploadMemberImage,
        teamMemberValidator(),
        validationMiddleware,
        activityLogger('WEBSITE_MANAGEMENT', 'Update core team member request'),
        updateCoreMember
    )
    .delete(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'delete'),
        activityLogger('WEBSITE_MANAGEMENT', 'Delete core team member request'),
        deleteCoreMember
    );

// 10. Supporting Team CRUD
router.route('/supporting-team')
    .post(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'write'),
        uploadMemberImage,
        teamMemberValidator(),
        validationMiddleware,
        activityLogger('WEBSITE_MANAGEMENT', 'Add supporting team member request'),
        addSupportingMember
    );

router.route('/supporting-team/:memberId')
    .patch(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'update'),
        uploadMemberImage,
        teamMemberValidator(),
        validationMiddleware,
        activityLogger('WEBSITE_MANAGEMENT', 'Update supporting team member request'),
        updateSupportingMember
    )
    .delete(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'delete'),
        activityLogger('WEBSITE_MANAGEMENT', 'Delete supporting team member request'),
        deleteSupportingMember
    );

export default router;
