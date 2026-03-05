/**
 * Gugenka Auth - Google認証モジュール (CDN版 / All-in-One)
 * @version 2.0.0
 * @description ドメイン制限 + Firestore ユーザー管理 + 監査ログ
 *
 * CDN Usage:
 *   <script src="gugenka-auth.js"></script>
 *   GugenkaAuth.init({ ... });
 *   GugenkaAuth.requireLogin();
 */

var GugenkaAuth = (function () {
  'use strict';

  // ─── 内部状態 ───
  var config = {};
  var currentUser = null;
  var currentUserData = null;
  var authStateCallbacks = [];
  var initialized = false;
  var db = null;

  // ─── デフォルト設定 ───
  var DEFAULT_CONFIG = {
    firebase: null,
    allowedDomains: [],
    allowedEmails: [],
    appName: 'Application',
    appLogo: null,
    loginMessage: 'ログインしてください',
    redirectAfterLogin: '/',
    persistLogin: true,
    headless: false,
    useFirestore: false,
    collections: {
      allowedUsers: 'allowed_users',
      auditLogs: 'audit_logs'
    },
    enableAuditLog: false,
    providers: ['google'],
    onLoginSuccess: null,
    onLoginError: null,
    onLogout: null
  };

  // ─── Utility ───

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  var GOOGLE_ICON_SVG =
    '<svg viewBox="0 0 24 24" width="20" height="20">' +
    '<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>' +
    '<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>' +
    '<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>' +
    '<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>' +
    '</svg>';

  // ─── Audit Log ───

  function writeAuditLog(action, email, details) {
    if (!config.enableAuditLog || !db) return;
    try {
      db.collection(config.collections.auditLogs).add({
        action: action,
        email: email || null,
        performedBy: currentUser ? currentUser.email : (email || null),
        details: details || null,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null
      });
    } catch (err) {
      console.warn('GugenkaAuth: Failed to write audit log -', err.message);
    }
  }

  // ─── Firestore User Management ───

  async function firestoreGetUserData(email) {
    if (!db || !email) return null;
    try {
      var doc = await db.collection(config.collections.allowedUsers).doc(email.toLowerCase()).get();
      return doc.exists ? doc.data() : null;
    } catch (err) {
      console.warn('GugenkaAuth: Failed to get user data -', err.message);
      return null;
    }
  }

  async function firestoreCheckUser(email) {
    var userData = await firestoreGetUserData(email);
    return { allowed: userData !== null, userData: userData };
  }

  async function firestoreUpdateLastLogin(email) {
    if (!db || !email) return;
    try {
      await db.collection(config.collections.allowedUsers).doc(email.toLowerCase()).update({
        lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (err) { /* ドキュメントがない場合は無視 */ }
  }

  // ─── Auth Provider ───

  function createGoogleProvider() {
    var provider = new firebase.auth.GoogleAuthProvider();
    if (config.allowedDomains && config.allowedDomains.length === 1) {
      provider.setCustomParameters({ hd: config.allowedDomains[0] });
    }
    return provider;
  }

  // ─── Domain/Email Check ───

  function isAllowedByConfig(email) {
    if (!email) return false;
    var domain = email.split('@')[1];

    if (config.allowedDomains && config.allowedDomains.length > 0) {
      if (config.allowedDomains.includes(domain)) return true;
    }
    if (config.allowedEmails && config.allowedEmails.length > 0) {
      if (config.allowedEmails.includes(email.toLowerCase())) return true;
    }
    if ((!config.allowedDomains || config.allowedDomains.length === 0) &&
        (!config.allowedEmails || config.allowedEmails.length === 0)) {
      return true;
    }
    return false;
  }

  // ─── Auth State Handler ───

  async function handleAuthStateChange(firebaseUser) {
    if (firebaseUser) {
      var email = firebaseUser.email;

      // Firestore allowed_users チェック
      var userData = null;
      if (config.useFirestore && db) {
        var result = await firestoreCheckUser(email);
        if (!result.allowed) {
          console.warn('GugenkaAuth: User not in allowed_users -', email);
          writeAuditLog('login_denied', email, { reason: 'not_in_allowed_users' });
          firebase.auth().signOut().then(function () {
            if (!config.headless) {
              showError('このアカウント (' + email + ') ではアクセスできません。\n許可されたアカウントでログインしてください。');
            }
          });
          if (config.onLoginError) {
            config.onLoginError({ code: 'USER_NOT_ALLOWED', email: email });
          }
          return;
        }
        userData = result.userData;
        firestoreUpdateLastLogin(email);
      }

      // ドメイン制限チェック
      if (!isAllowedByConfig(email)) {
        console.warn('GugenkaAuth: Domain not allowed -', email);
        writeAuditLog('login_denied', email, { reason: 'domain_not_allowed' });
        firebase.auth().signOut().then(function () {
          if (!config.headless) {
            showError('このアカウント (' + email + ') ではアクセスできません。\n許可されたアカウントでログインしてください。');
          }
        });
        if (config.onLoginError) {
          config.onLoginError({ code: 'DOMAIN_NOT_ALLOWED', email: email });
        }
        return;
      }

      currentUser = {
        uid: firebaseUser.uid,
        email: email,
        name: firebaseUser.displayName || email.split('@')[0],
        photoURL: firebaseUser.photoURL,
        domain: email.split('@')[1]
      };
      currentUserData = userData;

      writeAuditLog('login', email);

      if (!config.headless) {
        hideLoginOverlay();
      }

      authStateCallbacks.forEach(function (cb) {
        cb(currentUser, currentUserData);
      });

      if (config.onLoginSuccess) {
        config.onLoginSuccess(currentUser, currentUserData);
      }

      console.log('GugenkaAuth: Login success -', email);
    } else {
      var prevEmail = currentUser ? currentUser.email : null;
      currentUser = null;
      currentUserData = null;

      if (prevEmail) {
        writeAuditLog('logout', prevEmail);
      }

      authStateCallbacks.forEach(function (cb) {
        cb(null, null);
      });

      if (config.onLogout) {
        config.onLogout();
      }

      console.log('GugenkaAuth: Logged out');
    }
  }

  // ─── UI ───

  function showLoginOverlay() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('gugenka-auth-overlay')) return;

    var domainHint = config.allowedDomains && config.allowedDomains.length > 0
      ? '※ @' + config.allowedDomains.join(', @') + ' のアカウントのみ'
      : '';

    var overlay = document.createElement('div');
    overlay.id = 'gugenka-auth-overlay';
    overlay.className = 'gugenka-auth-overlay';
    overlay.innerHTML =
      '<div class="gugenka-auth-modal">' +
      (config.appLogo ? '<img src="' + escapeHtml(config.appLogo) + '" class="gugenka-auth-logo" alt="Logo">' : '') +
      '<h1 class="gugenka-auth-title">' + escapeHtml(config.appName) + '</h1>' +
      '<p class="gugenka-auth-message">' + escapeHtml(config.loginMessage) + '</p>' +
      '<button class="gugenka-auth-google-btn" id="gugenka-auth-login-btn">' +
      GOOGLE_ICON_SVG +
      'Googleでログイン' +
      '</button>' +
      (domainHint ? '<p class="gugenka-auth-hint">' + escapeHtml(domainHint) + '</p>' : '') +
      '<p id="gugenka-auth-error" class="gugenka-auth-error"></p>' +
      '</div>';

    document.body.appendChild(overlay);
    document.getElementById('gugenka-auth-login-btn').addEventListener('click', loginWithGoogle);
  }

  function hideLoginOverlay() {
    if (typeof document === 'undefined') return;
    var overlay = document.getElementById('gugenka-auth-overlay');
    if (overlay) {
      overlay.classList.add('gugenka-auth-fade-out');
      setTimeout(function () { overlay.remove(); }, 300);
    }
  }

  function showError(message) {
    if (typeof document === 'undefined') return;
    var errorEl = document.getElementById('gugenka-auth-error');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }
  }

  // ─── Public API ───

  function init(userConfig) {
    if (initialized) {
      console.warn('GugenkaAuth: Already initialized');
      return;
    }

    config = Object.assign({}, DEFAULT_CONFIG, userConfig);
    if (userConfig.collections) {
      config.collections = Object.assign({}, DEFAULT_CONFIG.collections, userConfig.collections);
    }

    if (!firebase.apps.length) {
      firebase.initializeApp(config.firebase);
    }

    if (config.useFirestore) {
      db = firebase.firestore();
    }

    var persistence = config.persistLogin
      ? firebase.auth.Auth.Persistence.LOCAL
      : firebase.auth.Auth.Persistence.SESSION;

    firebase.auth().setPersistence(persistence).then(function () {
      firebase.auth().onAuthStateChanged(handleAuthStateChange);
    });

    initialized = true;
    console.log('GugenkaAuth: Initialized');
  }

  function requireLogin() {
    if (config.headless) return;
    if (!currentUser && !document.getElementById('gugenka-auth-overlay')) {
      showLoginOverlay();
    }
  }

  function loginWithGoogle() {
    var btn = document.getElementById('gugenka-auth-login-btn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'ログイン中...';
    }

    var provider = createGoogleProvider();

    firebase.auth().signInWithPopup(provider)
      .catch(function (error) {
        console.error('GugenkaAuth: Login error -', error);

        if (btn) {
          btn.disabled = false;
          btn.innerHTML = GOOGLE_ICON_SVG + 'Googleでログイン';
        }

        if (error.code === 'auth/popup-blocked') {
          showError('ポップアップがブロックされました。ブラウザの設定で許可してください。');
        } else if (error.code === 'auth/popup-closed-by-user') {
          showError('ログインがキャンセルされました。');
        } else if (error.code === 'auth/network-request-failed') {
          showError('ネットワークエラーが発生しました。接続を確認してください。');
        } else {
          showError('ログインに失敗しました。もう一度お試しください。');
        }

        if (config.onLoginError) {
          config.onLoginError(error);
        }
      });
  }

  async function logout() {
    try {
      await firebase.auth().signOut();
      if (!config.headless) {
        showLoginOverlay();
      }
    } catch (error) {
      console.error('GugenkaAuth: Logout error -', error);
    }
  }

  function getCurrentUser() {
    return currentUser;
  }

  function getCurrentUserData() {
    return currentUserData;
  }

  function onAuthStateChanged(callback) {
    authStateCallbacks.push(callback);
    if (currentUser) {
      callback(currentUser, currentUserData);
    }
  }

  function isAdmin() {
    return currentUserData && currentUserData.role === 'admin';
  }

  function isAllowedUser(email) {
    return isAllowedByConfig(email);
  }

  function isInitialized() {
    return initialized;
  }

  function getConfig() {
    return Object.assign({}, config);
  }

  // Firestore User Management

  async function getAllUsers() {
    if (!db) {
      console.warn('GugenkaAuth: Firestore is not enabled');
      return [];
    }
    try {
      var snapshot = await db.collection(config.collections.allowedUsers).get();
      return snapshot.docs.map(function (doc) {
        return Object.assign({ email: doc.id }, doc.data());
      });
    } catch (err) {
      console.warn('GugenkaAuth: Failed to get users -', err.message);
      return [];
    }
  }

  async function addUser(email, name, role) {
    if (!db || !email) return false;
    try {
      await db.collection(config.collections.allowedUsers).doc(email.toLowerCase()).set({
        name: name || email.split('@')[0],
        role: role || 'user',
        addedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      writeAuditLog('user_add', email, { name: name, role: role || 'user' });
      return true;
    } catch (err) {
      console.warn('GugenkaAuth: Failed to add user -', err.message);
      return false;
    }
  }

  async function removeUser(email) {
    if (!db || !email) return false;
    try {
      await db.collection(config.collections.allowedUsers).doc(email.toLowerCase()).delete();
      writeAuditLog('user_remove', email);
      return true;
    } catch (err) {
      console.warn('GugenkaAuth: Failed to remove user -', err.message);
      return false;
    }
  }

  // ─── Return Public API ───
  return {
    // 既存API（互換維持）
    init: init,
    requireLogin: requireLogin,
    loginWithGoogle: loginWithGoogle,
    logout: logout,
    getCurrentUser: getCurrentUser,
    onAuthStateChanged: onAuthStateChanged,
    isAllowedUser: isAllowedUser,
    isInitialized: isInitialized,

    // v2.0 追加API
    isAdmin: isAdmin,
    getCurrentUserData: getCurrentUserData,
    getConfig: getConfig,
    getAllUsers: getAllUsers,
    addUser: addUser,
    removeUser: removeUser
  };
})();

// グローバル公開 + ESM/CJS互換
if (typeof window !== 'undefined') {
  window.GugenkaAuth = GugenkaAuth;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GugenkaAuth;
}
