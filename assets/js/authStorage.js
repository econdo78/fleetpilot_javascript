(() => {
  const TOKEN_KEY = 'fmApiToken';
  const USER_KEY = 'fmApiUser';

  const memoryStore = new Map();

  const getSessionStorage = () => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const testKey = '__auth_storage_test__';
        window.sessionStorage.setItem(testKey, '1');
        window.sessionStorage.removeItem(testKey);
        return window.sessionStorage;
      }
    } catch (_) {
      // Ignored because we fall back to the in-memory store.
    }
    return null;
  };

  const sessionStorageRef = getSessionStorage();

  const writeValue = (key, value) => {
    if (sessionStorageRef) {
      sessionStorageRef.setItem(key, value);
    } else {
      memoryStore.set(key, value);
    }
  };

  const readValue = (key) => {
    if (sessionStorageRef) {
      return sessionStorageRef.getItem(key);
    }
    return memoryStore.get(key) ?? null;
  };

  const deleteValue = (key) => {
    if (sessionStorageRef) {
      sessionStorageRef.removeItem(key);
    } else {
      memoryStore.delete(key);
    }
  };

  const clearAll = () => {
    deleteValue(TOKEN_KEY);
    deleteValue(USER_KEY);
  };

  const notifyChange = () => {
    window.dispatchEvent(new CustomEvent('auth:session-changed'));
  };

  const authStorage = {
    saveSession: ({ token, user }) => {
      if (!token) {
        throw new Error('Token is required to save the session.');
      }
      writeValue(TOKEN_KEY, token);
      if (typeof user === 'string' && user.length) {
        writeValue(USER_KEY, user);
      } else {
        deleteValue(USER_KEY);
      }
      notifyChange();
    },
    getToken: () => readValue(TOKEN_KEY),
    getUser: () => readValue(USER_KEY),
    hasSession: () => Boolean(readValue(TOKEN_KEY)),
    clearSession: () => {
      clearAll();
      notifyChange();
    },
  };

  window.AuthStorage = authStorage;
})();
