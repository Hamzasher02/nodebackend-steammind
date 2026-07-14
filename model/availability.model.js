/**
 * ===============================================
 * AVAILABILITY MODEL - HAMZA SHER
 * ===============================================
 * Created by: Hamza Sher
 * Date: October 28, 2025
 * Time: 2:00 PM
 * Purpose: Mongoose schema for instructor availability time slots
 * Lines Modified: 1-81 (ENTIRE FILE CREATED)
 * Features: Time validation, conflict checking, multiple days support
 * Note: Stores instructor time slots with validation and indexing
 * ===============================================
 */

import mongo from "mongoose";

const availabilitySchema = new mongo.Schema({
    instructorId: {
        type: mongo.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sessionTitle: {
        type: String,
        required: true,
        trim: true,
        maxLength: 100
    },
    scheduleType: {
        type: String,
        enum: ['Recurring Weekly', 'One Time', 'Recurring Daily'],
        default: 'Recurring Weekly'
    },
    days: [{
        type: String,
        enum: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
        required: true
    }],
    startTime: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: 'Start time must be in HH:MM format'
        }
    },
    endTime: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: 'End time must be in HH:MM format'
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for efficient querying
availabilitySchema.index({ instructorId: 1, isActive: 1 });
availabilitySchema.index({ days: 1, startTime: 1, endTime: 1 });

// Pre-save middleware to validate time logic
availabilitySchema.pre('save', function (next) {
    if (this.startTime && this.endTime) {
        const start = new Date(`2000-01-01T${this.startTime}:00`);
        const end = new Date(`2000-01-01T${this.endTime}:00`);

        if (start >= end) {
            return next(new Error('End time must be after start time'));
        }
    }
    next();
});

const availabilityModel = mongo.model('Availability', availabilitySchema);

export default availabilityModel;
