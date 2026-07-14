/**
 * ===============================================
 * AVAILABILITY VALIDATION SERVICES - HAMZA SHER
 * ===============================================
 * Created by: Hamza Sher
 * Date: October 28, 2025
 * Time: 2:00 PM
 * Purpose: Validation rules for availability management APIs
 * Lines Modified: 1-120 (ENTIRE FILE CREATED)
 * Features: Time slot creation, viewing, and management validation
 * Note: Comprehensive validation for all availability endpoints
 * ===============================================
 */

import { body, param, query } from "express-validator";

// Validation for creating time slot
export const createTimeSlotValidator = [
    body('sessionTitle')
        .notEmpty()
        .withMessage('Session title is required')
        .isLength({ min: 3, max: 100 })
        .withMessage('Session title must be between 3 and 100 characters')
        .trim(),
    
    body('scheduleType')
        .optional()
        .isIn(['Recurring Weekly', 'One Time', 'Recurring Daily'])
        .withMessage('Schedule type must be one of: Recurring Weekly, One Time, Recurring Daily'),
    
    body('days')
        .isArray({ min: 1 })
        .withMessage('At least one day must be selected')
        .custom((days) => {
            const validDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
            const invalidDays = days.filter(day => !validDays.includes(day));
            if (invalidDays.length > 0) {
                throw new Error(`Invalid days: ${invalidDays.join(', ')}. Valid days are: ${validDays.join(', ')}`);
            }
            return true;
        }),
    
    body('startTime')
        .notEmpty()
        .withMessage('Start time is required')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Start time must be in HH:MM format (24-hour)'),
    
    body('endTime')
        .notEmpty()
        .withMessage('End time is required')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('End time must be in HH:MM format (24-hour)')
        .custom((endTime, { req }) => {
            const startTime = req.body.startTime;
            if (startTime && endTime) {
                const start = new Date(`2000-01-01T${startTime}:00`);
                const end = new Date(`2000-01-01T${endTime}:00`);
                if (start >= end) {
                    throw new Error('End time must be after start time');
                }
            }
            return true;
        })
];

// Validation for updating time slot
export const updateTimeSlotValidator = [
    param('slotId')
        .isMongoId()
        .withMessage('Invalid time slot ID'),
    
    body('sessionTitle')
        .optional()
        .isLength({ min: 3, max: 100 })
        .withMessage('Session title must be between 3 and 100 characters')
        .trim(),
    
    body('scheduleType')
        .optional()
        .isIn(['Recurring Weekly', 'One Time', 'Recurring Daily'])
        .withMessage('Schedule type must be one of: Recurring Weekly, One Time, Recurring Daily'),
    
    body('days')
        .optional()
        .isArray({ min: 1 })
        .withMessage('At least one day must be selected')
        .custom((days) => {
            const validDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
            const invalidDays = days.filter(day => !validDays.includes(day));
            if (invalidDays.length > 0) {
                throw new Error(`Invalid days: ${invalidDays.join(', ')}. Valid days are: ${validDays.join(', ')}`);
            }
            return true;
        }),
    
    body('startTime')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Start time must be in HH:MM format (24-hour)'),
    
    body('endTime')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('End time must be in HH:MM format (24-hour)')
        .custom((endTime, { req }) => {
            const startTime = req.body.startTime;
            if (startTime && endTime) {
                const start = new Date(`2000-01-01T${startTime}:00`);
                const end = new Date(`2000-01-01T${endTime}:00`);
                if (start >= end) {
                    throw new Error('End time must be after start time');
                }
            }
            return true;
        })
];

// Validation for instructor ID parameter
export const instructorIdValidator = [
    param('instructorId')
        .isMongoId()
        .withMessage('Invalid instructor ID')
];

// Validation for time slot ID parameter
export const timeSlotIdValidator = [
    param('slotId')
        .isMongoId()
        .withMessage('Invalid time slot ID')
];

// Validation for query parameters
export const availabilityQueryValidator = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    
    query('status')
        .optional()
        .isIn(['active', 'inactive'])
        .withMessage('Status must be either active or inactive'),
    
    query('day')
        .optional()
        .isIn(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'])
        .withMessage('Day must be a valid day of the week')
];
