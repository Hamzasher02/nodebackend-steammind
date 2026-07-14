import { body, param, query } from "express-validator";

 const staffRegisterationValidator = () => [
    body("firstName")
        .notEmpty().withMessage("First name is required")
        .isLength({ min: 3, max: 15 }).withMessage("First name must be between 3 and 15 characters"),
    body("lastName")
        .notEmpty().withMessage("Last name is required")
        .isLength({ min: 3, max: 15 }).withMessage("Last name must be between 3 and 15 characters"),
    body("email")
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Invalid email format"),
    body("password")
        .notEmpty().withMessage("Password is required")
        .isLength({ min: 6 }).withMessage("Password must be at least 6 characters long")
];

 const assignRoleValidator = () => [
    body("roleName")
        .notEmpty().withMessage("Role name is required"),
    body("email")
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Invalid email format")
];

 const updateStaffRoleValidator = () => [
    body("roleName")
        .notEmpty().withMessage("Role name is required"),
    body("email")
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Invalid email format")
];

 const toggleStaffValidator = () => [
    body("staffId")
        .notEmpty().withMessage("staffId is required")
       
];


const getSingleStaffValidator = () => [
    param("id")
        .notEmpty().withMessage("Staff ID is required")
        .isMongoId().withMessage("Invalid staff ID format")
];

 const verifyRoleStatusValidator = () => [
    param("userId")
        .notEmpty().withMessage("User ID is required")
        .isMongoId().withMessage("Invalid user ID format"),
    param("secret")
        .notEmpty().withMessage("Secret token is required")
        .isLength({ min: 20 }).withMessage("Invalid secret token")
];

 const searchStaffValidator = () => [
    body("name")
        .notEmpty().withMessage("Name or email is required to search staff")
        .isString().withMessage("Search term must be a string")
];

 const getStaffQueryValidator = () => [
    query("role")
        .optional()
        .isString().withMessage("Role query must be a string"),
    query("status")
        .optional()
        .isString().withMessage("Status query must be a string")
];

export  {
    staffRegisterationValidator,
    assignRoleValidator,
    updateStaffRoleValidator,
    getSingleStaffValidator,
    verifyRoleStatusValidator,
    searchStaffValidator,
    getStaffQueryValidator,
    toggleStaffValidator
};
