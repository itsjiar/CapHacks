const ADMIN_EMAILS = [
    'jrsabalbero@gmail.com',
    'admin@caphacks.com'
];

window.isAdminUser = function(user) {
    if (!user) return false;
    return ADMIN_EMAILS.includes(user.email);
};
