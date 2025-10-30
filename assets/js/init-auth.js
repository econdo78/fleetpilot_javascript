(() => {
  const LOGIN_PAGE = 'login.html';
  const DASHBOARD_PAGE = 'dashboard.html';

  const getCurrentPage = () => {
    const parts = window.location.pathname.split('/');
    return parts[parts.length - 1] || '';
  };

  const isLoginPage = () => getCurrentPage().toLowerCase() === LOGIN_PAGE;

  const redirectToLogin = () => {
    if (!isLoginPage()) {
      window.location.href = LOGIN_PAGE;
    }
  };

  const maybeRedirectToDashboard = () => {
    if (isLoginPage() && window.AuthStorage?.hasSession?.()) {
      window.location.href = DASHBOARD_PAGE;
    }
  };

  const syncUserName = () => {
    const userSlot = document.querySelector('[data-auth-user]');
    if (!userSlot) {
      return;
    }
    const username = window.AuthStorage?.getUser?.();
    userSlot.textContent = username ?? userSlot.dataset.defaultValue ?? '';
  };

  const syncUserAvatar = () => {
    const avatars = document.querySelectorAll('[data-auth-avatar]');
    if (!avatars.length) {
      return;
    }
    const username = window.AuthStorage?.getUser?.() || 'User';
    const encodedName = encodeURIComponent(username);

    avatars.forEach((avatar) => {
      const size = avatar.dataset.avatarSize || '128';
      avatar.src = `https://ui-avatars.com/api/?name=${encodedName}&background=6571ff&color=fff&size=${size}`;
    });
  };

  const syncToken = () => {
    const tokenSlot = document.querySelector('[data-auth-token]');
    if (!tokenSlot) {
      return;
    }
    const token = window.AuthStorage?.getToken?.();
    tokenSlot.textContent = token ?? '—';
  };

  const bindLogoutButtons = () => {
    const elements = document.querySelectorAll('[data-auth-action="logout"]');
    if (!elements.length) {
      return;
    }

    const logout = (event) => {
      event.preventDefault();
      window.AuthStorage?.clearSession?.();
      redirectToLogin();
    };

    elements.forEach((element) => {
      element.addEventListener('click', logout);
    });
  };

  const enforceSession = () => {
    if (isLoginPage()) {
      return;
    }
    if (!window.AuthStorage?.hasSession?.()) {
      redirectToLogin();
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    maybeRedirectToDashboard();
    enforceSession();
    bindLogoutButtons();
    syncUserName();
    syncUserAvatar();
    syncToken();
  });

  window.addEventListener('auth:logout', redirectToLogin);
  window.addEventListener('auth:session-changed', syncUserName);
  window.addEventListener('auth:session-changed', syncUserAvatar);
  window.addEventListener('auth:session-changed', syncToken);
})();
