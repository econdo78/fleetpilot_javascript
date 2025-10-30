(() => {
  const form = document.querySelector('.auth-form-wrapper form');
  if (!form) {
    return;
  }

  const translate = (key, fallback, vars) => {
    if (window.i18n && typeof window.i18n.t === 'function') {
      return window.i18n.t(key, fallback, vars);
    }
    if (typeof fallback === 'string' && vars && Object.keys(vars).length) {
      return fallback.replace(/\{\{(\w+?)\}\}/g, (_, token) => (token in vars ? vars[token] : `{{${token}}}`));
    }
    return fallback ?? key ?? '';
  };

  const usernameInput = form.querySelector('#userName');
  const passwordInput = form.querySelector('#userPassword');
  const submitButton = form.querySelector('button[type="submit"]');
  const toastElement = document.getElementById('loginToast');
  const toastMessage = document.getElementById('loginToastMessage');
  const toastInstance = toastElement ? bootstrap.Toast.getOrCreateInstance(toastElement, { autohide: true, delay: 3000 }) : null;
  const toastVariants = ['text-bg-danger', 'text-bg-success', 'text-bg-warning', 'text-bg-info'];
  const authStorage = window.AuthStorage;
  const apiClient = window.ApiClient;
  const REMOTE_FILEMAKER_BASE_URL = 'https://preproduccion.fleetpad.app/fmi/data/vLatest/databases/fleetpilot';
  const DEFAULT_DATABASE_NAME = 'fleetpilot';
  const DATA_API_SESSIONS_PATH = 'sessions';

  const resolveFileMakerBaseUrl = () => {
    const clientBase = apiClient?.getBaseUrl?.();
    if (clientBase) {
      return clientBase;
    }

    const overrideUrl = typeof window.FILEMAKER_BASE_URL === 'string' ? window.FILEMAKER_BASE_URL.trim() : '';
    if (overrideUrl) {
      return overrideUrl;
    }

    const { hostname } = window.location;
    if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1') {
      return '/fm-api';
    }
    return REMOTE_FILEMAKER_BASE_URL;
  };

  const FILEMAKER_BASE_URL = resolveFileMakerBaseUrl();
  let effectiveFileMakerBaseUrl = FILEMAKER_BASE_URL;
  apiClient?.setBaseUrl?.(effectiveFileMakerBaseUrl);
  submitButton?.setAttribute('data-default-label', submitButton?.innerText ?? 'Login');
  let originalSubmitLabel = translate('login.submit', submitButton?.dataset.defaultLabel ?? 'Login');

  const getValidatingLabel = () => translate('login.validating', 'Validando...');

  const setSubmittingState = (submitting) => {
    if (!submitButton) {
      return;
    }
    submitButton.disabled = submitting;
    submitButton.classList.toggle('disabled', submitting);
    submitButton.innerText = submitting ? getValidatingLabel() : originalSubmitLabel;
  };

  const showToast = (message, variant = 'danger') => {
    if (!toastElement || !toastMessage || !toastInstance) {
      return;
    }
    const content = message ?? translate('login.toast.default', 'Credenciales inválidas.');
    toastVariants.forEach((className) => toastElement.classList.remove(className));
    toastElement.classList.add(`text-bg-${variant}`);
    toastMessage.textContent = content;
    const show = () => toastInstance.show();
    if (toastElement.classList.contains('show')) {
      toastElement.addEventListener('hidden.bs.toast', show, { once: true });
      toastInstance.hide();
    } else {
      show();
    }
  };

  const encodeBasicAuth = (username, password) => {
    const token = `${username}:${password}`;
    const tokenBytes = new TextEncoder().encode(token);
    let binary = '';
    tokenBytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return window.btoa(binary);
  };

  const validateInputs = () => {
    const username = usernameInput?.value.trim();
    const password = passwordInput?.value ?? '';

    if (!username || !password) {
      showToast(translate('login.toast.missingCredentials', 'Introduce usuario y contraseña.'), 'warning');
      return null;
    }

    return { username, password };
  };

  const authenticate = async (username, password) => {
    const encodedToken = encodeBasicAuth(username, password);
    const basicAuthorization = `Basic ${encodedToken}`;
    const baseHeaders = {
      Authorization: basicAuthorization,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    };

    const normalizeBaseUrl = (input) => {
      if (!input) {
        return '';
      }
      return input.replace(/\/+$/, '');
    };

    const appendPath = (baseUrl, suffix) => {
      const normalizedBase = normalizeBaseUrl(baseUrl);
      if (!suffix) {
        return normalizedBase;
      }
      if (!normalizedBase) {
        return suffix.startsWith('/') ? suffix : `/${suffix}`;
      }
      return `${normalizedBase}${suffix.startsWith('/') ? '' : '/'}${suffix}`;
    };

    const extractDatabaseNameFromUrl = (url) => {
      if (!url) {
        return DEFAULT_DATABASE_NAME;
      }
      const match = /\/databases\/([^/]+)/i.exec(url);
      if (match && match[1]) {
        try {
          return decodeURIComponent(match[1]);
        } catch (_) {
          return match[1];
        }
      }
      return DEFAULT_DATABASE_NAME;
    };

    const buildLoginBody = (baseUrl) => ({
      fmDataSource: [
        {
          database: extractDatabaseNameFromUrl(baseUrl),
        },
      ],
    });

    const executeLogin = async (baseUrl) => {
      const targetUrl = appendPath(baseUrl, DATA_API_SESSIONS_PATH);
      const headers = new Headers(baseHeaders);
      const init = {
        method: 'POST',
        headers,
        body: JSON.stringify(buildLoginBody(baseUrl)),
        mode: 'cors',
        cache: 'no-store',
      };

      let response = null;
      let payload = null;
      let error = null;

      try {
        response = await fetch(targetUrl, init);
      } catch (fetchError) {
        error = fetchError;
      }

      if (response) {
        try {
          payload = await response.clone().json();
        } catch (parseError) {
          error = error ?? parseError;
        }
      }

      const token = payload?.response?.token ?? null;
      const messages = Array.isArray(payload?.messages) ? payload.messages : [];
      const messageCode = messages.find((message) => message && message.code != null)?.code ?? null;

      return {
        response,
        payload,
        targetUrl,
        error,
        token,
        messageCode,
      };
    };

    const candidateSet = new Set();
    const registerCandidate = (value) => {
      if (!value) {
        return;
      }
      const normalized = normalizeBaseUrl(value);
      if (normalized) {
        candidateSet.add(normalized);
      }
    };

    const normalizedEffective = normalizeBaseUrl(effectiveFileMakerBaseUrl || '');
    registerCandidate(REMOTE_FILEMAKER_BASE_URL);
    registerCandidate(normalizedEffective || effectiveFileMakerBaseUrl || '');

    const orderedCandidates = Array.from(candidateSet);

    let finalResult = {
      response: null,
      payload: null,
      baseUrl: normalizedEffective || effectiveFileMakerBaseUrl || REMOTE_FILEMAKER_BASE_URL,
      targetUrl: null,
      error: null,
      token: null,
      messageCode: null,
    };

    let firstErrorResult = null;

    for (const candidate of orderedCandidates) {
      const candidateResult = await executeLogin(candidate);
      const enrichedResult = { ...candidateResult, baseUrl: candidate };
      finalResult = enrichedResult;

      const status = candidateResult.response?.status ?? 0;
      const numericStatus = Number(status);
      const messageCode = candidateResult.messageCode;
      const numericMessageCode = messageCode != null ? Number(messageCode) : null;
      const hasToken = typeof candidateResult.token === 'string' && candidateResult.token.length > 0;
      const isSuccessStatus = numericStatus >= 200 && numericStatus < 300;
      const isMessageSuccess = numericMessageCode == null || Number.isNaN(numericMessageCode)
        ? messageCode == null
        : numericMessageCode === 0;

      if (isSuccessStatus && hasToken && isMessageSuccess) {
        const bearerToken = `Bearer ${candidateResult.token}`;
        return {
          ...enrichedResult,
          authorization: bearerToken,
          bearerToken,
        };
      }

      if (candidateResult.error) {
        console.warn('FileMaker Data API login attempt failed.', {
          url: candidateResult.targetUrl,
          error: candidateResult.error,
        });
        if (!firstErrorResult) {
          firstErrorResult = enrichedResult;
        }
        continue;
      }

      if (status === 401 || status === 403 || isInvalidCredentialsCode(messageCode)) {
        return {
          ...enrichedResult,
          authorization: basicAuthorization,
        };
      }

      if (status === 404) {
        console.error('FileMaker Data API base URL not found.', {
          attemptedUrl: candidateResult.targetUrl,
        });
        if (!firstErrorResult) {
          firstErrorResult = enrichedResult;
        }
        continue;
      }

      if (!firstErrorResult) {
        firstErrorResult = enrichedResult;
      }
    }

    const fallbackResult = firstErrorResult ?? finalResult;
    return {
      ...fallbackResult,
      authorization: basicAuthorization,
    };
  };

  const extractErrorCode = (payload) => {
    if (!payload || typeof payload !== 'object') {
      return null;
    }
    if (Array.isArray(payload.messages)) {
      const messageWithCode = payload.messages.find((message) => message && message.code != null);
      if (messageWithCode && messageWithCode.code != null) {
        return messageWithCode.code;
      }
    }
    if (payload.error && payload.error.code != null) {
      return payload.error.code;
    }
    if (payload.scriptResult && payload.scriptResult.code != null) {
      return payload.scriptResult.code;
    }
    return null;
  };

  const isInvalidCredentialsCode = (code) => {
    if (code == null) {
      return false;
    }
    const numeric = Number(code);
    if (!Number.isNaN(numeric)) {
      return numeric === 212;
    }
    if (typeof code === 'string') {
      return code.trim() === '212';
    }
    return false;
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const credentials = validateInputs();
    if (!credentials) {
      return;
    }

    setSubmittingState(true);

    try {
      const {
        response,
        payload,
        authorization,
        baseUrl: resolvedBaseUrl,
        targetUrl,
        error,
      } = await authenticate(
        credentials.username,
        credentials.password,
      );

      if (resolvedBaseUrl && resolvedBaseUrl !== effectiveFileMakerBaseUrl) {
        effectiveFileMakerBaseUrl = resolvedBaseUrl;
        apiClient?.setBaseUrl?.(effectiveFileMakerBaseUrl);
        window.FILEMAKER_BASE_URL = effectiveFileMakerBaseUrl;
      }

      const status = response?.status ?? 0;
      const errorCode = extractErrorCode(payload);
      const attemptedUrl = targetUrl || resolvedBaseUrl || effectiveFileMakerBaseUrl;
      const isMessageSuccess = errorCode == null || Number(errorCode) === 0;
      const hasBearerAuthorization = typeof authorization === 'string' && /^Bearer\s/i.test(authorization);
      const sessionToken = payload?.response?.token ?? null;

      if (response?.ok && isMessageSuccess && (hasBearerAuthorization || (typeof sessionToken === 'string' && sessionToken.length > 0))) {
        const storedAuthorization = hasBearerAuthorization ? authorization : `Bearer ${sessionToken}`;
        authStorage?.saveSession?.({ token: storedAuthorization, user: credentials.username });
        window.location.href = 'dashboard.html';
        return;
      }

      if (status === 401 || status === 403 || isInvalidCredentialsCode(errorCode)) {
        console.warn('FileMaker Data API rechazó las credenciales proporcionadas.', { status, errorCode, attemptedUrl });
        authStorage?.clearSession?.();
        showToast(translate('login.toast.invalidCredentials', 'Credenciales incorrectas. Revisa tu usuario y contraseña.'), 'danger');
        return;
      }

      if (status === 404) {
        console.error('FileMaker Data API no encontró el recurso solicitado.', { attemptedUrl });
        const message = translate(
          'login.toast.serviceNotFound',
          'No se pudo contactar con la FileMaker Data API. Revisa la URL configurada.'
        );
        showToast(message, 'danger');
        return;
      }

      if (!status || status === 0) {
        console.error('FileMaker Data API no respondió.', { attemptedUrl, error });
        authStorage?.clearSession?.();
        const message = translate(
          'login.toast.corsError',
          'El servidor rechazó la conexión directa. Ejecuta "npx gulp serve" para usar el proxy /fm-api o habilita CORS en FileMaker.',
        );
        showToast(message, 'danger');
        return;
      }

      const errorMessage = translate(
        'login.toast.genericError',
        `No se pudo validar el usuario (código ${status}).`,
        { status },
      );
      console.error('FileMaker Data API devolvió un error inesperado.', { status, errorCode, attemptedUrl, payload });
      showToast(errorMessage, 'danger');
    } catch (error) {
      console.error('Error durante la autenticación con la FileMaker Data API:', error);
      authStorage?.clearSession?.();
      showToast(translate('login.toast.connectionError', 'Error de conexión con el servidor. Inténtalo de nuevo más tarde.'), 'danger');
    } finally {
      setSubmittingState(false);
    }
  });

  const updateLocalizedStrings = () => {
    if (!submitButton) {
      return;
    }
    const defaultLabel = submitButton.dataset.defaultLabel ?? submitButton.innerText ?? 'Login';
    originalSubmitLabel = translate('login.submit', defaultLabel);
    if (!submitButton.disabled) {
      submitButton.innerText = originalSubmitLabel;
    }
  };

  updateLocalizedStrings();
  document.addEventListener('i18n:changed', updateLocalizedStrings);
})();
