const fs = require('fs');

let content = fs.readFileSync('finder.html', 'utf8');

const targetStr = '<div class="user-profile-container">\n          <button class="user-profile-btn" id="userProfileBtn" aria-haspopup="true" aria-expanded="false" title="Researcher Profile">';

const targetStrCRLF = '<div class="user-profile-container">\r\n          <button class="user-profile-btn" id="userProfileBtn" aria-haspopup="true" aria-expanded="false" title="Researcher Profile">';

const replacementLF = `<div class="user-profile-container">
          <!-- Guest Sign In / Register Button (Visible when not logged in) -->
          <a href="login.html" class="nav-auth-login-btn" id="navAuthLoginBtn">
            <span class="auth-btn-icon">🔐</span>
            <span class="auth-btn-text" data-i18n="auth.nav_login_btn">تسجيل الدخول / إنشاء حساب</span>
          </a>

          <!-- User Profile Badge & Dropdown (Visible only when logged in) -->
          <button class="user-profile-btn" id="userProfileBtn" aria-haspopup="true" aria-expanded="false" title="Researcher Profile" style="display: none;">`;

const replacementCRLF = replacementLF.replace(/\n/g, '\r\n');

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementLF);
  fs.writeFileSync('finder.html', content, 'utf8');
  console.log('REPLACED LF');
} else if (content.includes(targetStrCRLF)) {
  content = content.replace(targetStrCRLF, replacementCRLF);
  fs.writeFileSync('finder.html', content, 'utf8');
  console.log('REPLACED CRLF');
} else {
  console.log('TARGET NOT FOUND');
}
