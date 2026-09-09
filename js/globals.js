const ADMIN_EMAILS = [
    'jrsabalbero@gmail.com',
    'admin@caphacks.com'
];

window.ADMIN_EMAILS = ADMIN_EMAILS;

window.isAdminUser = function(user) {
    if (!user || !user.email) return false;
    return ADMIN_EMAILS.map(e => e.toLowerCase()).includes(user.email.toLowerCase());
};
