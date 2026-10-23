const fs = require('fs');
['finder.html', 'compare.html', 'evidence.html', 'guide.html'].forEach(fname => {
  let c = fs.readFileSync(fname, 'utf8');
  let oldStr = '<span class="auth-btn-text" data-i18n="auth.nav_login_btn">تسجيل الدخول / إنشاء حساب</span>';
  let newStr = '<span class="auth-btn-text auth-btn-text-full" data-i18n="auth.nav_login_btn">تسجيل الدخول / إنشاء حساب</span>\n            <span class="auth-btn-text auth-btn-text-short" data-i18n="auth.nav_login_btn_short">دخول</span>';
  if (c.includes(oldStr)) {
    c = c.replace(oldStr, newStr);
    fs.writeFileSync(fname, c, 'utf8');
    console.log('Updated ' + fname);
  } else {
    console.log('Not found in ' + fname);
  }
});
