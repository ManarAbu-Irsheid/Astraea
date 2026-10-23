const fs = require('fs');

let content = fs.readFileSync('js/user-system.js', 'utf8');

// 1. In loadUser(): sync with terratwin_registered_users if auth active
const loadUserAnchor = `    // Gate: User is only authenticated if terratwin_auth_active is explicitly true
    this.currentUser.isLoggedIn = isAuthActive;`;

const loadUserPatch = `    // Gate: User is only authenticated if terratwin_auth_active is explicitly true
    this.currentUser.isLoggedIn = isAuthActive;

    // Load persistent registered data if logged in
    if (isAuthActive && this.currentUser.email) {
      try {
        const raw = localStorage.getItem('terratwin_registered_users');
        if (raw) {
          const users = JSON.parse(raw);
          const found = users.find(u => u.email && u.email.toLowerCase() === this.currentUser.email.toLowerCase());
          if (found) {
            this.currentUser = { ...this.currentUser, ...found, isLoggedIn: true };
          }
        }
      } catch (e) {
        console.warn('Sync registered user profile on load:', e);
      }
    }`;

// 2. addXP: strict guard for logged in users
const addXpAnchor = `  addXP(amount, reasonEn, reasonAr) {
    if (!amount || amount <= 0) return;`;

const addXpPatch = `  addXP(amount, reasonEn, reasonAr) {
    if (!this.currentUser || !this.currentUser.isLoggedIn) return; // Strict: Gamification XP only for registered logged-in users!
    if (!amount || amount <= 0) return;`;

// 3. showXpToast: strict guard
const toastAnchor = `  showXpToast(amount, reason) {
    let container = document.getElementById('xpToastContainer');`;

const toastPatch = `  showXpToast(amount, reason) {
    if (!this.currentUser || !this.currentUser.isLoggedIn) return; // Do not show toasts to guests
    let container = document.getElementById('xpToastContainer');`;

// 4. showLevelUpCelebration: strict guard
const levelUpAnchor = `  showLevelUpCelebration(levelNumber) {
    const lvl = this.LEVELS.find(l => l.level === levelNumber) || this.LEVELS[0];`;

const levelUpPatch = `  showLevelUpCelebration(levelNumber) {
    if (!this.currentUser || !this.currentUser.isLoggedIn) return; // Do not show celebration to guests
    const lvl = this.LEVELS.find(l => l.level === levelNumber) || this.LEVELS[0];`;

// 5. recordPageVisit, recordSearch, recordComparison, discoverSite
const recordVisitAnchor = `  recordPageVisit(pageName) {
    if (!this.currentUser) return;`;
const recordVisitPatch = `  recordPageVisit(pageName) {
    if (!this.currentUser || !this.currentUser.isLoggedIn) return;`;

const recordSearchAnchor = `  recordSearch() {
    if (!this.currentUser) return;`;
const recordSearchPatch = `  recordSearch() {
    if (!this.currentUser || !this.currentUser.isLoggedIn) return;`;

const recordCompAnchor = `  recordComparison() {
    if (!this.currentUser) return;`;
const recordCompPatch = `  recordComparison() {
    if (!this.currentUser || !this.currentUser.isLoggedIn) return;`;

const discoverSiteAnchor = `  discoverSite(siteId, siteName) {
    if (!this.currentUser.discoveredSites) {`;
const discoverSitePatch = `  discoverSite(siteId, siteName) {
    if (!this.currentUser || !this.currentUser.isLoggedIn) return;
    if (!this.currentUser.discoveredSites) {`;

function doReplace(str, find, rep) {
  if (str.includes(find)) return str.replace(find, rep);
  const findCRLF = find.replace(/\n/g, '\r\n');
  const repCRLF = rep.replace(/\n/g, '\r\n');
  if (str.includes(findCRLF)) return str.replace(findCRLF, repCRLF);
  const findLF = find.replace(/\r\n/g, '\n');
  const repLF = rep.replace(/\r\n/g, '\n');
  if (str.includes(findLF)) return str.replace(findLF, repLF);
  console.log('MISSING:', find.slice(0, 30));
  return str;
}

content = doReplace(content, loadUserAnchor, loadUserPatch);
content = doReplace(content, addXpAnchor, addXpPatch);
content = doReplace(content, toastAnchor, toastPatch);
content = doReplace(content, levelUpAnchor, levelUpPatch);
content = doReplace(content, recordVisitAnchor, recordVisitPatch);
content = doReplace(content, recordSearchAnchor, recordSearchPatch);
content = doReplace(content, recordCompAnchor, recordCompPatch);
content = doReplace(content, discoverSiteAnchor, discoverSitePatch);

fs.writeFileSync('js/user-system.js', content, 'utf8');
console.log('USER-SYSTEM PATCH COMPLETE');
