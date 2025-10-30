(() => {
  const DEFAULT_LOCAL_PROXY_BASE_URL = '/fm-api';
  const DEFAULT_REMOTE_BASE_URL = 'https://preproduccion.fleetpad.app/fmi/data/vLatest/databases/fleetpilot';

  const normalizeBaseUrl = (url) => {
    if (!url) {
      return '';
    }
    return url.endsWith('/') ? url.slice(0, -1) : url;
  };

  const isODataBaseUrl = (url) => /\/odata\//i.test(url ?? '');

  const encodePathSegment = (segment) => {
    if (segment == null) {
      return '';
    }
    return encodeURIComponent(String(segment)).replace(/%2F/gi, '/');
  };

  const getConfiguredBaseUrl = () => {
    const overrideUrl = typeof window.FILEMAKER_BASE_URL === 'string' ? window.FILEMAKER_BASE_URL.trim() : null;
    if (overrideUrl) {
      return normalizeBaseUrl(overrideUrl);
    }

    const { hostname } = window.location;

    if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1') {
      // During local development we keep leveraging the proxy path.
      return normalizeBaseUrl(DEFAULT_LOCAL_PROXY_BASE_URL);
    }

    return normalizeBaseUrl(DEFAULT_REMOTE_BASE_URL);
  };

  let baseUrl = getConfiguredBaseUrl();

  const toAbsoluteUrl = (path) => {
    if (!path) {
      return baseUrl;
    }
    if (/^https?:\/\//i.test(path)) {
      return path;
    }
    const sanitizedPath = path.startsWith('/') ? path.slice(1) : path;
    return `${baseUrl}/${sanitizedPath}`;
  };

  const ensureJsonBody = (options, headers) => {
    if (!options || options.body == null) {
      return options;
    }
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const isBlob = typeof Blob !== 'undefined' && options.body instanceof Blob;
    const isRequest = typeof Request !== 'undefined' && options.body instanceof Request;

    if (isFormData || isBlob || isRequest) {
      return options;
    }

    const method = (options.method ?? 'GET').toUpperCase();
    if (method === 'GET' || method === 'HEAD') {
      return options;
    }

    if (typeof options.body === 'object') {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      const serialized = JSON.stringify(options.body);
      return { ...options, body: serialized };
    }

    return options;
  };

  const handleUnauthorized = () => {
    try {
      window.AuthStorage?.clearSession();
    } finally {
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
  };

  const buildHeaders = (inputHeaders = {}) => {
    const headers = new Headers(inputHeaders);
    const usingOData = isODataBaseUrl(baseUrl);

    if (usingOData) {
      headers.set('Accept', headers.get('Accept') ?? 'application/json;odata.metadata=minimal');
      headers.set('Cache-Control', headers.get('Cache-Control') ?? 'no-cache');
      headers.set('Pragma', headers.get('Pragma') ?? 'no-cache');
      headers.set('OData-Version', headers.get('OData-Version') ?? '4.0');
      headers.set('OData-MaxVersion', headers.get('OData-MaxVersion') ?? '4.0');
    } else {
      headers.set('Accept', headers.get('Accept') ?? 'application/json');
      headers.set('Cache-Control', headers.get('Cache-Control') ?? 'no-cache');
      headers.set('Pragma', headers.get('Pragma') ?? 'no-cache');
      headers.delete('OData-Version');
      headers.delete('OData-MaxVersion');
    }

    const token = window.AuthStorage?.getToken?.();
    if (token && !headers.has('Authorization')) {
      const trimmed = token.trim();
      if (/^(Basic|Bearer)\s/i.test(trimmed)) {
        headers.set('Authorization', trimmed);
      } else {
        headers.set('Authorization', `Basic ${trimmed}`);
      }
    }

    return headers;
  };

  const normalizeLayoutPathForOData = (path, method, originalOptions) => {
    if (typeof path !== 'string' || !path.length) {
      return { path, options: originalOptions };
    }

    const [rawPathname, rawQuery = ''] = path.split('?');
    const layoutMatch = /^layouts\/([^/]+?)\/records(?:\/([^/?#]+))?$/i.exec(rawPathname);
    if (!layoutMatch) {
      return { path, options: originalOptions };
    }

    const layoutName = layoutMatch[1];
    const recordSpecifier = layoutMatch[2];
    let normalizedPathname = `${layoutName}`;
    if (recordSpecifier) {
      const encodedSpecifier = encodeURIComponent(recordSpecifier);
      normalizedPathname += `(${encodedSpecifier})`;
    }

    const normalizedPath = rawQuery ? `${normalizedPathname}?${rawQuery}` : normalizedPathname;

    let normalizedBody = originalOptions.body;
    if (originalOptions.body && typeof originalOptions.body === 'object') {
      const methodUpper = method.toUpperCase();
      if (['POST', 'PUT', 'PATCH'].includes(methodUpper)) {
        const fieldDataPayload = originalOptions.body.fieldData;
        if (fieldDataPayload && typeof fieldDataPayload === 'object') {
          normalizedBody = fieldDataPayload;
        }
      }
    }

    const normalizedOptions = normalizedBody === originalOptions.body
      ? originalOptions
      : { ...originalOptions, body: normalizedBody };

    return { path: normalizedPath, options: normalizedOptions };
  };

  const transformPathForBackend = (path, method, originalOptions) => {
    if (isODataBaseUrl(baseUrl)) {
      return normalizeLayoutPathForOData(path, method, originalOptions);
    }
    return { path, options: originalOptions };
  };

  const request = async (path, options = {}) => {
    const method = (options.method ?? 'GET').toUpperCase();
    const { path: normalizedPath, options: normalizedOptions } = transformPathForBackend(path, method, options);
    const headers = buildHeaders(normalizedOptions.headers);
    const finalOptions = ensureJsonBody(
      {
        ...normalizedOptions,
        headers,
        method,
        mode: normalizedOptions.mode ?? 'cors',
        cache: normalizedOptions.cache ?? 'no-store',
      },
      headers,
    );

    const response = await fetch(toAbsoluteUrl(normalizedPath), finalOptions);
    if (response.status === 401) {
      handleUnauthorized();
    }
    return response;
  };

  const withJsonShortcut = async (path, method, payload, options = {}) => {
    const mergedOptions = {
      ...options,
      method,
      body: payload,
    };
    return request(path, mergedOptions);
  };

  const apiClient = {
    getBaseUrl: () => baseUrl,
    setBaseUrl: (url) => {
      baseUrl = normalizeBaseUrl(url) || baseUrl;
    },
    encodePathSegment,
    request,
    get: (path, options) => request(path, { ...options, method: 'GET' }),
    post: (path, body, options) => withJsonShortcut(path, 'POST', body, options),
    put: (path, body, options) => withJsonShortcut(path, 'PUT', body, options),
    patch: (path, body, options) => withJsonShortcut(path, 'PATCH', body, options),
    delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
    runScript: (scriptName, scriptBody = {}, options = {}) => {
      if (!scriptName || typeof scriptName !== 'string') {
        throw new Error('Script name is required to execute a FileMaker script.');
      }
      const encodedName = encodePathSegment(scriptName);
      return withJsonShortcut(`scripts/${encodedName}`, 'POST', scriptBody, options);
    },
    runLayoutScript: (layoutName, scriptName, scriptBody = {}, options = {}) => {
      if (!layoutName || typeof layoutName !== 'string') {
        throw new Error('Layout name is required to execute a FileMaker layout script.');
      }
      if (!scriptName || typeof scriptName !== 'string') {
        throw new Error('Script name is required to execute a FileMaker layout script.');
      }
      const encodedLayout = encodePathSegment(layoutName);
      const encodedScript = encodePathSegment(scriptName);
      return withJsonShortcut(`layouts/${encodedLayout}/script/${encodedScript}`, 'POST', scriptBody, options);
    },
  };

  window.ApiClient = apiClient;
})();
