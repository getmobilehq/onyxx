"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUser = isUser;
exports.isBuilding = isBuilding;
exports.isAssessment = isAssessment;
exports.isApiError = isApiError;
function isUser(obj) {
    return obj && typeof obj.id === 'string' && typeof obj.email === 'string';
}
function isBuilding(obj) {
    return obj && typeof obj.id === 'string' && typeof obj.name === 'string';
}
function isAssessment(obj) {
    return obj && typeof obj.id === 'string' && typeof obj.building_id === 'string';
}
function isApiError(obj) {
    return obj && typeof obj.code === 'string' && typeof obj.message === 'string';
}
//# sourceMappingURL=index.js.map