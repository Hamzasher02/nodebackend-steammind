import mongo from 'mongoose';
export const ROUTES = [
    "course management",
    "user management",
    "student progress",
    "manage requests",
    "manage payments",
    "activity log",
    "deletion history",
    "website management",
    "chat moderation",
];

export const PERMISSIONS = ["read", "write", "update", "delete"];
const routePermissionSchema = new mongo.Schema({
    route: {
        type: String,
        enum: ROUTES,
        required: true
    },
    permissions: {
        type: [String],
        enum: PERMISSIONS,
        default: ["read"]
    },
    _id: false
});
const roleSchema = new mongo.Schema({
    name: {
        type: String,
        trim: true,
        minlength: 3,
        maxlength: 50,
        required: true,
        unique: true
    },
    createdBy: {
        type: mongo.Types.ObjectId,
        ref: 'Staff',
        required: true,
    },
    type: {
        type: String,
        enum: ['default', 'customized'],
        default: 'default'
    },
    description: {
        type: String,
        required: true,
        minlength: 10,
        maxlength: 200
    },
    routePermission: {
        type: [routePermissionSchema],
        required: true
    },
     isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    },
    deletedBy: {
        type: mongo.Types.ObjectId,
        ref: 'Staff',
        default: null
    },
    restoredAt: {
        type: Date,
        default: null
    },
    restoredBy: {
        type: mongo.Types.ObjectId,
        ref: 'Staff',
        default: null
    }
}, { timestamps: true });

//role with no particular route will have all the permissions
roleSchema.pre('save', function (next) {
    if (!this.routePermission || this.routePermission.length === 0) {
        this.routePermission = ROUTES.map(route => ({
            route,
            permissions: ["read"]
        }));
    } else {
        this.routePermission.forEach(routePerm => {
            if (!routePerm.permissions || routePerm.permissions.length === 0) {
                routePerm.permissions = ["read"];
            }
        });
    }
    next();
});
const roleModel = mongo.model('Role', roleSchema);

export default roleModel;







