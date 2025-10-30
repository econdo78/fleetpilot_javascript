'use strict';

(function () {

  const DEBUG_LOGGING = Boolean(window.FleetPilotDebug);
  const debugLog = (...args) => {
    if (!DEBUG_LOGGING) {
      return;
    }
    window.console.log(...args);
  };
  const debugWarn = (...args) => {
    if (!DEBUG_LOGGING) {
      return;
    }
    window.console.warn(...args);
  };

  // Root css-variable value
  const getCssVariableValue = function(variableName) {
    let hex = getComputedStyle(document.documentElement).getPropertyValue(variableName);
    if ( hex && hex.length > 0 ) {
      hex = hex.trim();
    }
    return hex;
  }

  // Global variables
  window.config = {
    colors: {
      primary        : getCssVariableValue('--bs-primary'),
      secondary      : getCssVariableValue('--bs-secondary'),
      success        : getCssVariableValue('--bs-success'),
      info           : getCssVariableValue('--bs-info'),
      warning        : getCssVariableValue('--bs-warning'),
      danger         : getCssVariableValue('--bs-danger'),
      light          : getCssVariableValue('--bs-light'),
      dark           : getCssVariableValue('--bs-dark'),
      gridBorder     : "rgba(77, 138, 240, .15)",
    },
    fontFamily       : "'Roboto', Helvetica, sans-serif"
  }

  const body = document.body;
  const sidebar = document.querySelector('.sidebar');
  const sidebarBody = document.querySelector('.sidebar .sidebar-body');
  const horizontalMenu = document.querySelector('.horizontal-menu');


  // Initializing bootstrap tooltip
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
  const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl)
  })



  // Initializing bootstrap popover
  const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
  const popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
    return new bootstrap.Popover(popoverTriggerEl)
  })



  // Applying perfect-scrollbar 
  if (document.querySelector('.sidebar .sidebar-body')) {
    const sidebarBodyScroll = new PerfectScrollbar('.sidebar-body');
  }



  // Sidebar toggle to sidebar-folded
  const sidebarTogglers = document.querySelectorAll('.sidebar-toggler');
  // there are two sidebar togglers. 
  // 1: on sidebar - for min-width 992px (laptop, desktop) 
  // 2: on navbar - for max-width 991px (mobile phone, tablet)
  if (sidebarTogglers.length) {

    sidebarTogglers.forEach( toggler => {

      toggler.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelector('.sidebar .sidebar-toggler').classList.toggle('active');
        if (window.matchMedia('(min-width: 992px)').matches) {
          body.classList.toggle('sidebar-folded');
        } else if (window.matchMedia('(max-width: 991px)').matches) {
          body.classList.toggle('sidebar-open');
        }
      });

    });

    // To avoid layout issues, remove body and toggler classes on window resize.
    window.addEventListener('resize', function(event) {
      body.classList.remove('sidebar-folded', 'sidebar-open');
      document.querySelector('.sidebar .sidebar-toggler').classList.remove('active');
    }, true);

  }



  //  sidebar-folded on min-width:992px and max-width: 1199px (in lg only not in xl)
  // Warning!!! this results apex chart width issue
  // 
  // const desktopMedium = window.matchMedia('(min-width:992px) and (max-width: 1199px)');
  // function iconSidebar() {
  //   if (desktopMedium.matches) {
  //     body.classList.add('sidebar-folded');
  //   } else {
  //     body.classList.remove('sidebar-folded');
  //   }
  // }
  // window.addEventListener('resize', iconSidebar)
  // iconSidebar();



  // Add "active" class to nav-link based on url dynamically
  function addActiveClass(element) {
    
    // Get parents of the 'el' with a selector (class, id, etc..)
    function getParents(el, selector) {
      const parents = [];
      while ((el = el.parentNode) && el !== document) {
        if (!selector || el.matches(selector)) parents.push(el);
      }
      return parents;
    }

    if (current === "") {
      // For root url
      if (element.getAttribute('href').indexOf("index.html") !== -1) {    // Checking href of 'element' matching with 'index.html'
        const elParents = getParents(element, '.nav-item');               // Getting parents of the 'element' with a class '.nav-item'
        elParents[elParents.length - 1].classList.add('active');          // Adding class 'active' to the outer(direct) '.nav-item'
        if (getParents(element, '.sub-menu').length) {                    // Checking if it's a submenu 'element'
          element.closest('.collapse').classList.add('show');             // Adding class 'show' to the closest '.collapse' to expand submenu
          element.classList.add('active');                                // Adding class 'active' to the submenu '.nav-link'
        }
      }
    } else {
      // For other url
      if (element.getAttribute('href').indexOf(current) !== -1) {   // Checking href of 'element' matching with current url
        const elParents = getParents(element, '.nav-item');         // Getting parents of the 'element' with a class '.nav-item'
        elParents[elParents.length - 1].classList.add('active');    // Adding class 'active' to the outer(direct) '.nav-item'
        if (getParents(element, '.sub-menu').length) {              // Checking if it's a submenu 'element' [in vertical menu sidebar - demo1]
          element.closest('.collapse').classList.add('show');       // Adding class 'show' to the closest '.collapse' to expand submenu
          element.classList.add('active');                          // Adding class 'active' to the submenu '.nav-link'
        }
        if (getParents(element, '.submenu-item')) {                 // Checking if it's a submenu-item 'element' [in horizontal menu bottom-navbar - demo2] 
          element.classList.add('active');                          // Adding class 'active' to the submenu-item '.nav-link'
          if (element.closest('.nav-item.active .submenu')) {       // Checking element has a submenu
            element.closest('.nav-item.active').classList.add('show-submenu');  // adding class 'show-submenu' to the parent .nav-item (only for mobile/tablet)
          }
        }
      }
    }
  }

  // current url [Eg: dashboard.html]
  const current = location.pathname.split("/").slice(-1)[0].replace(/^\/|\/$/g, '');

  if (sidebar) {
    const sidebarNavLinks = document.querySelectorAll('.sidebar .nav li a');
    sidebarNavLinks.forEach( navLink => {
      addActiveClass(navLink);
    });
  }

  if (horizontalMenu) {
    const navbarNavLinks = document.querySelectorAll('.horizontal-menu .nav li a');
    navbarNavLinks.forEach( navLink => {
      addActiveClass(navLink);
    });
  }



  // Open & fold sidebar-folded on mouse enter and leave
  if (sidebarBody) {
    sidebarBody.addEventListener('mouseenter', function () {
      if (body.classList.contains('sidebar-folded')) {
        body.classList.add('open-sidebar-folded');
      }
    });

    sidebarBody.addEventListener('mouseleave', function () {
      if (body.classList.contains('sidebar-folded')) {
        body.classList.remove('open-sidebar-folded');
      }
    });
  }



  // Close sidebar on click outside in phone/tablet
  const mainWrapper = document.querySelector('.main-wrapper');
  if (sidebar) {
    document.addEventListener('touchstart', function(e) {
      if (e.target === mainWrapper && body.classList.contains('sidebar-open')) {
        body.classList.remove('sidebar-open');
        document.querySelector('.sidebar .sidebar-toggler').classList.remove('active');
      }
    });
  }



  // Horizontal menu in small screen devices (mobile/tablet)
  if (horizontalMenu) {
    const horizontalMenuToggleButton = document.querySelector('[data-toggle="horizontal-menu-toggle"]');
    const bottomNavbar = document.querySelector('.horizontal-menu .bottom-navbar');
    if (horizontalMenuToggleButton) {
      horizontalMenuToggleButton.addEventListener('click', function () {
        bottomNavbar.classList.toggle('header-toggled');
        horizontalMenuToggleButton.classList.toggle('open');
        body.classList.toggle('header-open'); // used for creating backdrop
      });

      // To avoid layout issues, remove body and toggler classes on window resize.
      window.addEventListener('resize', function(event) {
        bottomNavbar.classList.remove('header-toggled');
        horizontalMenuToggleButton.classList.remove('open');
        body.classList.remove('header-open');
      }, true);
    }
  }
  



  // Horizontal menu nav-item click submenu show/hide on mobile/tablet
  if (horizontalMenu) {
    const navItems = document.querySelectorAll('.horizontal-menu .page-navigation >.nav-item');
    if (window.matchMedia('(max-width: 991px)').matches) {
      navItems.forEach( function (navItem) {
        navItem.addEventListener('click', function () {
          if (!this.classList.contains('show-submenu')) {
            navItems.forEach(function (navItem) {
              navItem.classList.remove('show-submenu');
            });
          }
          this.classList.toggle('show-submenu');
        });
      });
    }
  }
    



  const CLIENTES_LAYOUT = 'clientes';
  const PROCESS_SELECTION_STORAGE_KEY = 'clientes.process-selection';

  const DRIVER_FIELD_ALIASES = {
    nombreCompleto: ['nombrecompleto', 'nombre', 'nombre completo', 'NombreCompleto', 'NOMBRECOMPLETO', 'Nombre'],
    numeroDocumento: [
      'ndocumentoidentidad',
      'documentoidentidad',
      'numerodocumento',
      'dni',
      'numero identificacion',
      'NDOCUMENTOIDENTIDAD',
      'DocumentoIdentidad',
      'DNI',
    ],
    estado: ['estado', 'estadogeneral', 'Estado', 'ESTADO'],
    nombreInversor: ['nombreinversor', 'inversornombre', 'NombreInversor', 'InversorNombre', 'NOMBREINVERSOR'],
  };

  const DRIVER_STATUS_CLASS_MAP = {
    contratado: 'badge rounded-pill bg-success text-white',
    activo: 'badge rounded-pill bg-success text-white',
    suspendido: 'badge rounded-pill bg-danger text-white',
    pendiente: 'badge rounded-pill bg-warning text-dark',
    baja: 'badge rounded-pill bg-secondary text-white',
    finalizado: 'badge rounded-pill bg-secondary text-white',
  };

  const DEFAULT_DRIVER_STATUS_CLASS = 'badge rounded-pill bg-light text-body';

  const normalizeKeyValue = (value) => {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value).trim();
  };

  const getDriverRecordPrimaryKey = (record) => {
    if (!record || typeof record !== 'object') {
      return null;
    }
    const fieldData = record.fieldData ?? {};
    const candidates = [
      fieldData.id,
      fieldData.ID,
      fieldData.Id,
      fieldData.uuid,
      fieldData.UUID,
      fieldData.Uuid,
    ];
    for (const candidate of candidates) {
      const normalized = normalizeKeyValue(candidate);
      if (normalized) {
        return normalized;
      }
    }
    const fallback = normalizeKeyValue(record.recordId);
    return fallback || null;
  };

  const cloneRecordForStorage = (record) => {
    if (!record || typeof record !== 'object') {
      return record ?? null;
    }
    if (typeof structuredClone === 'function') {
      try {
        return structuredClone(record);
      } catch (_) {
        // ignore structuredClone failures and fallback
      }
    }
    const cloned = { ...record };
    if (record.fieldData && typeof record.fieldData === 'object') {
      cloned.fieldData = { ...record.fieldData };
    }
    if (record.portalData && typeof record.portalData === 'object') {
      try {
        cloned.portalData = JSON.parse(JSON.stringify(record.portalData));
      } catch (_) {
        cloned.portalData = record.portalData;
      }
    }
    return cloned;
  };

  const persistDriverSelection = (record, recordKey, displayName, fallbackRecordId = null) => {
    if (!record && !fallbackRecordId) {
      return;
    }
    const normalizedRecordId = normalizeKeyValue(record?.recordId ?? fallbackRecordId);
    const normalizedKey = normalizeKeyValue(recordKey) || normalizedRecordId;
    const payload = {
      layout: CLIENTES_LAYOUT,
      savedAt: Date.now(),
      recordKey: record?.recordId ?? fallbackRecordId ?? null,
      recordId: record?.recordId ?? fallbackRecordId ?? null,
      fieldOrder: [],
      displayName: displayName && displayName.trim() ? displayName.trim() : null,
      key: normalizedKey || null,
      record: record ? cloneRecordForStorage(record) : null,
    };
    try {
      window.sessionStorage?.setItem(PROCESS_SELECTION_STORAGE_KEY, JSON.stringify(payload));
    } catch (_) {
      // ignore storage failures
    }
    if (record && window.ClientesProcessSelection?.save) {
      try {
        window.ClientesProcessSelection.save(record, [], payload.displayName, normalizedKey);
      } catch (_) {
        // ignore bridge failures
      }
    }
  };

  const navbarDriverTables = new Set();
  const navbarDriverTableStates = new WeakMap();
  let sharedDriverRecords = null;
  let driversFetchPromise = null;

  const normalizeFieldKey = (value) => {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  };

  const buildFieldMap = (fieldData) => {
    const map = new Map();
    Object.entries(fieldData ?? {}).forEach(([key, val]) => {
      const normalized = normalizeFieldKey(key);
      if (!map.has(normalized)) {
        map.set(normalized, val);
      }
    });
    return map;
  };

  const getFieldValue = (fieldMap, aliases) => {
    for (const alias of aliases) {
      const normalizedAlias = normalizeFieldKey(alias);
      if (fieldMap.has(normalizedAlias)) {
        const value = fieldMap.get(normalizedAlias);
        if (value !== null && value !== undefined) {
          const trimmed = String(value).trim();
          if (trimmed) {
            return trimmed;
          }
        }
      }
    }
    return '';
  };

  const formatDriverStatus = (raw) => {
    const label = String(raw ?? '').trim();
    if (!label) {
      return {
        label: 'Sin estado',
        className: DEFAULT_DRIVER_STATUS_CLASS,
      };
    }
    const normalized = label
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    const className =
      DRIVER_STATUS_CLASS_MAP[normalized] ??
      (normalized.includes('bolsa')
        ? 'badge rounded-pill bg-warning text-dark'
        : DEFAULT_DRIVER_STATUS_CLASS);
    return {
      label,
      className,
    };
  };

  const mapDriverRecordToRow = (record) => {
    if (!record || typeof record !== 'object') {
      return null;
    }
    const fieldMap = buildFieldMap(record.fieldData ?? {});
    const nombreCompleto = getFieldValue(fieldMap, DRIVER_FIELD_ALIASES.nombreCompleto) || '—';
    const numeroDocumento = getFieldValue(fieldMap, DRIVER_FIELD_ALIASES.numeroDocumento) || '—';
    const estadoRaw = getFieldValue(fieldMap, DRIVER_FIELD_ALIASES.estado);
    const estado = formatDriverStatus(estadoRaw);
    const nombreInversor = getFieldValue(fieldMap, DRIVER_FIELD_ALIASES.nombreInversor) || '—';
    const recordKey = getDriverRecordPrimaryKey(record);
    const recordId = record?.recordId ?? null;
    const recordIdString =
      recordId !== null && recordId !== undefined ? String(recordId).trim() : '';
    return {
      record,
      recordKey,
      recordId,
      recordIdString,
      nombreCompleto,
      numeroDocumento,
      estado: estado.label,
      estadoClass: estado.className,
      estadoBadgeClasses: estado.className,
      nombreInversor,
    };
  };

  const mapDriverRecordsToRows = (records) => {
    if (!Array.isArray(records)) {
      return [];
    }
    return records
      .map((record) => mapDriverRecordToRow(record))
      .filter((row) => row && typeof row === 'object');
  };

  const updateStatesWithSharedRecords = (records) => {
    navbarDriverTables.forEach((tableElement) => {
      const state = navbarDriverTableStates.get(tableElement);
      if (!state) {
        return;
      }
      state.cachedRecords = Array.isArray(records) ? records.slice() : [];
      if (state.isLoaded) {
        state.renderFromRecords(state.cachedRecords);
      }
    });
  };

  const setSharedDriverRecords = (records) => {
    sharedDriverRecords = Array.isArray(records) ? records.slice() : [];
    updateStatesWithSharedRecords(sharedDriverRecords);
  };

  const KNOWN_RECORD_ID_KEYS = [
    '__RecordId',
    '__RecordID',
    '__recordId',
    '__recordID',
    '__recordid',
    'recordId',
    'RecordId',
    'RecordID',
    'recordID',
    'recordid',
    'id',
    'ID',
    'Id',
  ];

  const KNOWN_MOD_ID_KEYS = [
    '__ModId',
    '__ModID',
    '__modId',
    '__modID',
    '__modid',
    'modId',
    'ModId',
    'ModID',
  ];

  const mapScriptEntriesToRecords = (entries) => {
    if (!Array.isArray(entries)) {
      return [];
    }
    return entries
      .map((entry) => {
        if (!entry || typeof entry !== 'object') {
          return null;
        }
        const fieldData = { ...entry };
        const recordIdKey = KNOWN_RECORD_ID_KEYS.find((key) => key in entry) ?? null;
        const modIdKey = KNOWN_MOD_ID_KEYS.find((key) => key in entry) ?? null;
        const recordIdValue = recordIdKey ? entry[recordIdKey] : undefined;
        const modIdValue = modIdKey ? entry[modIdKey] : undefined;

        return {
          recordId: recordIdValue != null ? String(recordIdValue) : undefined,
          modId: modIdValue != null ? String(modIdValue) : undefined,
          fieldData,
          raw: entry,
        };
      })
      .filter(Boolean);
  };

  const parseScriptResultEntries = (result) => {
    if (Array.isArray(result)) {
      return { entries: result, error: null };
    }

    if (result && typeof result === 'object') {
      if (Array.isArray(result.records)) {
        return { entries: result.records, error: null };
      }
      if (Array.isArray(result.data)) {
        return { entries: result.data, error: null };
      }
    }

    if (typeof result === 'string') {
      const trimmed = result.trim();
      if (!trimmed) {
        return { entries: [], error: null };
      }
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return { entries: parsed, error: null };
        }
        if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.records)) {
            return { entries: parsed.records, error: null };
          }
          if (Array.isArray(parsed.data)) {
            return { entries: parsed.data, error: null };
          }
        }
        return { entries: [], error: 'El script devolvió un JSON sin la lista de registros esperada.' };
      } catch (error) {
        const detail = error && error.message ? ` Detalle: ${error.message}` : '';
        return { entries: [], error: `No se pudo interpretar la respuesta del script.${detail}` };
      }
    }

    if (result == null) {
      return { entries: [], error: null };
    }

    return { entries: [], error: 'La respuesta del script no tiene un formato soportado.' };
  };

  const DEFAULT_CONDUCTORES_LISTAR_SCRIPT_CANDIDATES = [
    'conductor.Listar',
    'Conductor.Listar',
    'conductores.Listar',
    'Conductores.Listar',
    'Script.conductor.Listar',
  ];

  const DEFAULT_CONDUCTORES_LISTAR_LAYOUT_CANDIDATES = [
    'conductor.Listar',
    'Conductor.Listar',
    'conductores',
    'Conductores',
    'conductor',
    'Conductor',
    'clientes',
    'Clientes',
    'clientes_listado',
    'Clientes_Listado',
  ];

  const resolveConductoresListarCandidates = () => {
    const overrides = window.FILEMAKER_SCRIPT_NAMES?.conductoresListar;
    if (!overrides) {
      return DEFAULT_CONDUCTORES_LISTAR_SCRIPT_CANDIDATES.slice();
    }
    if (typeof overrides === 'string') {
      return [overrides];
    }
    if (Array.isArray(overrides)) {
      return overrides.filter((entry) => typeof entry === 'string' && entry.trim().length);
    }
    if (typeof overrides === 'object') {
      const { primary, fallbacks } = overrides;
      const result = [];
      if (typeof primary === 'string' && primary.trim()) {
        result.push(primary.trim());
      }
      if (Array.isArray(fallbacks)) {
        fallbacks.forEach((entry) => {
          if (typeof entry === 'string' && entry.trim()) {
            result.push(entry.trim());
          }
        });
      }
      if (result.length) {
        return result;
      }
    }
    return DEFAULT_CONDUCTORES_LISTAR_SCRIPT_CANDIDATES.slice();
  };

  const resolveConductoresLayoutCandidates = () => {
    const overrides = window.FILEMAKER_LAYOUT_NAMES?.conductoresListar;
    if (!overrides) {
      return DEFAULT_CONDUCTORES_LISTAR_LAYOUT_CANDIDATES.slice();
    }
    if (typeof overrides === 'string') {
      return [overrides];
    }
    if (Array.isArray(overrides)) {
      return overrides.filter((entry) => typeof entry === 'string' && entry.trim().length);
    }
    if (typeof overrides === 'object') {
      const { primary, fallbacks } = overrides;
      const result = [];
      if (typeof primary === 'string' && primary.trim()) {
        result.push(primary.trim());
      }
      if (Array.isArray(fallbacks)) {
        fallbacks.forEach((entry) => {
          if (typeof entry === 'string' && entry.trim()) {
            result.push(entry.trim());
          }
        });
      }
      if (result.length) {
        return result;
      }
    }
    return DEFAULT_CONDUCTORES_LISTAR_LAYOUT_CANDIDATES.slice();
  };

  const parseScriptResponsePayload = async (response) => {
    let payload = {};
    let parseError = null;
    if (response.status !== 204) {
      try {
        payload = await response.json();
      } catch (error) {
        parseError = error;
      }
    }
    return { payload, parseError };
  };

  const tryFetchConductoresViaLayout = async (layoutName, options = {}) => {
    if (!window.ApiClient?.post) {
      throw new Error('ApiClient no está disponible para consultar layouts de FileMaker.');
    }
    const encodedLayout = window.ApiClient?.encodePathSegment
      ? window.ApiClient.encodePathSegment(layoutName)
      : encodeURIComponent(layoutName);
    const limit = Number.isFinite(options.limit) ? Number(options.limit) : null;
    const offset = Number.isFinite(options.offset) ? Number(options.offset) : null;
    const requestBody = {
      query: CONDUCTORES_FIND_QUERY.map((entry) => ({ ...entry }))
    };
    if (limit != null && limit > 0) {
      requestBody.limit = limit;
    }
    if (offset != null && offset >= 0) {
      requestBody.offset = offset;
    }
    debugLog('📥 Intentando obtener conductores desde layout (_find)...', { layoutName, requestBody });
    const response = await window.ApiClient.post(`layouts/${encodedLayout}/_find`, requestBody);
    if (response.status === 401) {
      debugLog('ℹ️ Consulta _find sin coincidencias para layout', { layoutName });
      return {
        layoutName,
        payload: { response: { data: [] } }
      };
    }
    if (!response.ok) {
      const message = response.statusText || 'error desconocido';
      const error = new Error(message);
      error.response = response;
      throw error;
    }

    let payload = {};
    if (response.status !== 204) {
      try {
        payload = await response.json();
      } catch (error) {
        debugWarn('No se pudo interpretar la respuesta JSON de la consulta de layout.', {
          layoutName,
          error,
        });
        payload = {};
      }
    }

    return { layoutName, payload };
  };

  const fetchConductoresViaLayouts = async (layoutCandidates) => {
    const attempts = [];
    for (const layoutName of layoutCandidates) {
      try {
        return await tryFetchConductoresViaLayout(layoutName);
      } catch (error) {
        const status = error?.response?.status ?? null;
        const message = error?.message ?? 'error inesperado';
        attempts.push({ layoutName, status, message });
      }
    }

    const detail = attempts
      .map((attempt) => {
        const parts = [`layout: ${attempt.layoutName}`];
        if (attempt.status != null) {
          parts.push(`status: ${attempt.status}`);
        }
        if (attempt.message) {
          parts.push(`message: ${attempt.message}`);
        }
        return parts.join(', ');
      })
      .join(' | ');

    const error = new Error('No se pudo obtener la lista de conductores a través de layouts de la Data API.');
    error.details = attempts;
    if (detail) {
      error.message += ` Detalle: ${detail}`;
    }
    throw error;
  };

  const interpretActiveFlag = (value) => {
    if (value === null || value === undefined) {
      return null;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'number') {
      if (Number.isNaN(value)) {
        return null;
      }
      return value !== 0;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return null;
      }
      const normalized = trimmed.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      if (normalized === 'true' || normalized === 't' || normalized === 'yes' || normalized === 'y' || normalized === 'si' || normalized === '1') {
        return true;
      }
      if (normalized === 'false' || normalized === 'f' || normalized === 'no' || normalized === 'n' || normalized === '0') {
        return false;
      }
      const numeric = Number(normalized);
      if (!Number.isNaN(numeric)) {
        return numeric !== 0;
      }
      return null;
    }
    return null;
  };

  const ACTIVE_FIELD_CANDIDATES = [
    'isActivo',
    'IsActivo',
    'ISACTIVO',
    'activo',
    'Activo',
    'ACTIVO',
    'esActivo',
    'EsActivo',
    'ESACTIVO',
  ];

  const isRecordActive = (record) => {
    if (!record || typeof record !== 'object') {
      return false;
    }
    const sources = [];
    if (record.fieldData && typeof record.fieldData === 'object') {
      sources.push(record.fieldData);
    }
    if (record.raw && typeof record.raw === 'object') {
      sources.push(record.raw);
    }
    sources.push(record);
    for (const source of sources) {
      for (const key of ACTIVE_FIELD_CANDIDATES) {
        if (key in source) {
          const flag = interpretActiveFlag(source[key]);
          if (flag !== null) {
            return flag;
          }
        }
      }
    }
    return false;
  };

  const filterActiveDriverRecords = (records) => {
    if (!Array.isArray(records)) {
      return [];
    }
    return records.filter((record) => isRecordActive(record));
  };

  const KEEP_ALIVE_INTERVAL_MS = 9 * 60 * 1000; // 9 minutos
  const KEEP_ALIVE_RETRY_MS = 60 * 1000; // reintento rápido si falla
  const KEEP_ALIVE_VISIBILITY_THRESHOLD_MS = 2 * 60 * 1000;

  let keepAliveTimerId = null;
  let keepAliveActive = false;
  let lastKeepAliveSuccessTs = 0;

  const shouldRunKeepAlive = () => Boolean(window.AuthStorage?.hasSession?.());

  const getKeepAliveLayouts = () => {
    const layouts = [];
    const rememberedLayout = window.FileMakerConductores?.lastUsedLayout;
    if (rememberedLayout && !layouts.includes(rememberedLayout)) {
      layouts.push(rememberedLayout);
    }
    resolveConductoresLayoutCandidates().forEach((candidate) => {
      if (!layouts.includes(candidate)) {
        layouts.push(candidate);
      }
    });
    return layouts;
  };

  const runKeepAlivePing = async (reason = 'interval') => {
    if (!shouldRunKeepAlive()) {
      return false;
    }
    const layouts = getKeepAliveLayouts();
    for (const layoutName of layouts) {
      try {
        await tryFetchConductoresViaLayout(layoutName, { limit: 1, offset: 0 });
        window.FileMakerConductores = window.FileMakerConductores || {};
        window.FileMakerConductores.lastUsedLayout = layoutName;
        window.FileMakerConductores.lastUsedScript = null;
        lastKeepAliveSuccessTs = Date.now();
        debugLog('💓 KeepAlive: ping OK', { layoutName, reason });
        return true;
      } catch (error) {
        debugWarn('💢 KeepAlive: fallo en layout', {
          layoutName,
          reason,
          status: error?.response?.status ?? null,
          message: error?.message,
        });
      }
    }
    return false;
  };

  const scheduleKeepAlive = (delayMs) => {
    if (!keepAliveActive) {
      return;
    }
    if (keepAliveTimerId) {
      window.clearTimeout(keepAliveTimerId);
    }
    keepAliveTimerId = window.setTimeout(async () => {
      const success = await runKeepAlivePing('interval');
      const nextDelay = success ? KEEP_ALIVE_INTERVAL_MS : KEEP_ALIVE_RETRY_MS;
      scheduleKeepAlive(nextDelay);
    }, Math.max(KEEP_ALIVE_RETRY_MS, delayMs));
  };

  const startKeepAlive = () => {
    if (keepAliveActive || !shouldRunKeepAlive()) {
      return;
    }
    keepAliveActive = true;
    lastKeepAliveSuccessTs = Date.now();
    debugLog('💤 KeepAlive: iniciado');
    scheduleKeepAlive(KEEP_ALIVE_INTERVAL_MS);
  };

  const stopKeepAlive = () => {
    if (!keepAliveActive) {
      return;
    }
    keepAliveActive = false;
    if (keepAliveTimerId) {
      window.clearTimeout(keepAliveTimerId);
      keepAliveTimerId = null;
    }
    debugLog('💤 KeepAlive: detenido');
  };

  const handleSessionStateChange = () => {
    if (shouldRunKeepAlive()) {
      startKeepAlive();
    } else {
      stopKeepAlive();
    }
  };

  window.addEventListener('auth:logout', stopKeepAlive);
  window.addEventListener('auth:session-changed', handleSessionStateChange);

  const maybeRunVisibilityKeepAlive = () => {
    if (!keepAliveActive) {
      handleSessionStateChange();
      return;
    }
    const now = Date.now();
    if (now - lastKeepAliveSuccessTs >= KEEP_ALIVE_INTERVAL_MS - KEEP_ALIVE_VISIBILITY_THRESHOLD_MS) {
      runKeepAlivePing('visibility');
    }
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      maybeRunVisibilityKeepAlive();
    }
  });

  window.addEventListener('focus', () => {
    maybeRunVisibilityKeepAlive();
  });

  const CONDUCTORES_LISTAR_BODY = { 'script.param': '' };
  const CONDUCTORES_FIND_QUERY = Object.freeze([{ isActivo: 1 }]);

  const executeConductoresListarScript = async () => {
    if (!window.ApiClient?.runScript) {
      throw new Error('ApiClient.runScript no está disponible para ejecutar scripts de FileMaker.');
    }

    const attempts = [];

    const baseUrl = window.ApiClient?.getBaseUrl?.() ?? '(desconocido)';

    const candidates = resolveConductoresListarCandidates();
    const layoutCandidates = resolveConductoresLayoutCandidates();
    window.FileMakerConductores = window.FileMakerConductores || {};
    window.FileMakerConductores.scriptCandidates = candidates.slice();
    window.FileMakerConductores.layoutCandidates = layoutCandidates.slice();

    const registerSuccessContext = (scriptName, layoutName) => {
      window.FileMakerConductores.lastUsedScript = scriptName;
      window.FileMakerConductores.lastUsedLayout = layoutName ?? null;
    };

    for (const scriptName of candidates) {
      try {
        debugLog('🔄 Intentando ejecutar script de conductores vía Data API...', {
          scriptName,
          baseUrl,
        });
        const response = await window.ApiClient.runScript(scriptName, CONDUCTORES_LISTAR_BODY);
        const { payload, parseError } = await parseScriptResponsePayload(response);

        if (!response.ok) {
          const message = payload?.messages?.[0]?.message ?? response.statusText ?? 'error desconocido';
          attempts.push({ scriptName, status: response.status, message, payload });
        } else if (parseError) {
          attempts.push({ scriptName, status: response.status, error: parseError });
        } else {
          registerSuccessContext(scriptName, null);
          return {
            scriptName,
            payload: payload ?? {},
            response,
            layoutName: null,
          };
        }
      } catch (error) {
        attempts.push({ scriptName, error });
      }

      for (const layoutName of layoutCandidates) {
        try {
          debugLog('🔁 Intentando ejecutar script de conductores con contexto de layout...', {
            scriptName,
            layoutName,
            baseUrl,
          });
          const response = await window.ApiClient.runLayoutScript(layoutName, scriptName, CONDUCTORES_LISTAR_BODY);
          const { payload, parseError } = await parseScriptResponsePayload(response);

          if (!response.ok) {
            const message = payload?.messages?.[0]?.message ?? response.statusText ?? 'error desconocido';
            attempts.push({ scriptName, layoutName, status: response.status, message, payload });
            continue;
          }

          if (parseError) {
            attempts.push({ scriptName, layoutName, status: response.status, error: parseError });
            continue;
          }

          registerSuccessContext(scriptName, layoutName);
          return {
            scriptName,
            payload: payload ?? {},
            response,
            layoutName,
          };
        } catch (error) {
          attempts.push({ scriptName, layoutName, error });
        }
      }
    }

    const aggregatedDetails = attempts
      .map((attempt) => {
        const parts = [`script: ${attempt.scriptName}`];
        if (attempt.layoutName) {
          parts.push(`layout: ${attempt.layoutName}`);
        }
        if (attempt.status != null) {
          parts.push(`status: ${attempt.status}`);
        }
        if (attempt.message) {
          parts.push(`message: ${attempt.message}`);
        }
        if (attempt.error) {
          parts.push(`error: ${attempt.error.message ?? attempt.error}`);
        }
        return parts.join(', ');
      })
      .join(' | ');

    const error = new Error('No se pudo ejecutar el script conductores.Listar a través de la FileMaker Data API.');
    error.details = attempts;
    if (aggregatedDetails) {
      error.message += ` Detalle: ${aggregatedDetails}`;
    }
    throw error;
  };

  const normalizeRecordsPayload = (payload) => {
    const metadata = { source: 'unknown', error: null };
    const buildResult = (records) => ({ records, metadata });

    if (!payload || typeof payload !== 'object') {
      return buildResult([]);
    }

    if (payload?.response?.scriptResult !== undefined || payload?.response?.scriptError !== undefined) {
      metadata.source = 'data-api-script';
      const errorCodeRaw = payload?.response?.scriptError;
      const numericScriptError = errorCodeRaw == null ? 0 : Number(errorCodeRaw);
      if (!Number.isNaN(numericScriptError) && numericScriptError !== 0) {
        metadata.error = `El script devolvió el código ${numericScriptError}.`;
        return buildResult([]);
      }

      const { entries, error } = parseScriptResultEntries(payload?.response?.scriptResult ?? null);
      if (error) {
        metadata.error = error;
        return buildResult([]);
      }

      const records = mapScriptEntriesToRecords(entries);
      return buildResult(records);
    }

    if (payload.scriptResult) {
      metadata.source = 'script';
      const { code, resultParameter } = payload.scriptResult;
      if (typeof code === 'number' && code !== 0) {
        metadata.error = `El script devolvió el código ${code}.`;
        return buildResult([]);
      }

      const { entries, error } = parseScriptResultEntries(resultParameter);
      if (error) {
        metadata.error = error;
        return buildResult([]);
      }

      const records = mapScriptEntriesToRecords(entries);
      return buildResult(records);
    }

    if (payload && Array.isArray(payload.response?.data)) {
      metadata.source = 'data-api';
      return buildResult(payload.response.data);
    }

    if (!payload || !Array.isArray(payload.value)) {
      return buildResult([]);
    }

    metadata.source = 'odata';
    const records = payload.value
      .map((entry) => {
        if (!entry || typeof entry !== 'object') {
          return null;
        }
        const recordIdKey = KNOWN_RECORD_ID_KEYS.find((key) => key in entry) ?? null;
        const modIdKey = KNOWN_MOD_ID_KEYS.find((key) => key in entry) ?? null;
        const fieldData = {};

        Object.entries(entry).forEach(([key, value]) => {
          if (key.startsWith('@odata')) {
            return;
          }
          if (key === recordIdKey || key === modIdKey) {
            return;
          }
          fieldData[key] = value;
        });

        const recordIdValue = recordIdKey ? entry[recordIdKey] : undefined;
        const modIdValue = modIdKey ? entry[modIdKey] : undefined;

        return {
          recordId: recordIdValue != null ? String(recordIdValue) : undefined,
          modId: modIdValue != null ? String(modIdValue) : undefined,
          fieldData,
          raw: entry,
        };
      })
      .filter(Boolean);

    return buildResult(records);
  };

  const fetchConductoresListadoRecords = async () => {
    const layoutCandidates = resolveConductoresLayoutCandidates();
    window.FileMakerConductores = window.FileMakerConductores || {};
    window.FileMakerConductores.layoutCandidates = layoutCandidates.slice();
    try {
      const { payload, layoutName } = await fetchConductoresViaLayouts(layoutCandidates);
      const { records, metadata } = normalizeRecordsPayload(payload);
      if (metadata.error) {
        throw new Error(metadata.error);
      }
      window.FileMakerConductores.lastUsedLayout = layoutName;
      window.FileMakerConductores.lastUsedScript = null;
      const filtered = filterActiveDriverRecords(records);
      debugLog('📊 Conductores activos recuperados (layout)', {
        layoutName,
        total: records?.length ?? 0,
        activos: filtered.length
      });
      return filtered;
    } catch (layoutError) {
      debugWarn('No se pudo obtener la lista de conductores mediante layouts. Probando scripts…', layoutError);
      const { payload, scriptName } = await executeConductoresListarScript();
      const { records, metadata } = normalizeRecordsPayload(payload);
      if (metadata.error) {
        throw new Error(metadata.error);
      }
      window.FileMakerConductores = window.FileMakerConductores || {};
      window.FileMakerConductores.lastUsedScript = scriptName;
      const filtered = filterActiveDriverRecords(records);
      debugLog('📊 Conductores activos recuperados (script)', {
        scriptName,
        total: records?.length ?? 0,
        activos: filtered.length
      });
      return filtered;
    }
  };

  const fetchDriverRecordsFromApi = async () => fetchConductoresListadoRecords();

  window.FileMakerConductores = window.FileMakerConductores || {};
  window.FileMakerConductores.listar = fetchConductoresListadoRecords;

  document.addEventListener('DOMContentLoaded', handleSessionStateChange);

  document.addEventListener('clientesTable:data', (event) => {
    const detail = event?.detail ?? {};
    if (detail.layout === 'clientes' && Array.isArray(detail.records)) {
      setSharedDriverRecords(detail.records);
    }
  });

  if (Array.isArray(window.ClientesSharedData?.clientes)) {
    setSharedDriverRecords(window.ClientesSharedData.clientes);
  }

  function initialiseNavbarDriversTable(tableElement) {
    debugLog('🏗️ initialiseNavbarDriversTable llamado:', {
      hasTable: !!tableElement,
      tableId: tableElement?.id,
      estaEnDOM: tableElement ? document.body.contains(tableElement) : false
    });

    if (!tableElement) {
      return null;
    }

    if (navbarDriverTableStates.has(tableElement)) {
      debugLog('♻️ Retornando estado existente');
      return navbarDriverTableStates.get(tableElement);
    }

    const tbody = tableElement.tBodies?.[0] ?? tableElement.createTBody();
    debugLog('📋 tbody obtenido:', {
      hasTbody: !!tbody,
      tbodyEstaEnDOM: tbody ? document.body.contains(tbody) : false
    });
    const loadingRow = tbody.querySelector('[data-search-panel-loading]') ?? null;
    const emptyRow = tbody.querySelector('[data-search-panel-empty]') ?? null;
    const errorRow = tbody.querySelector('[data-search-panel-error]') ?? null;

    // Usar delegación de eventos: vincular UNA VEZ al tbody, no a cada fila
    let rowsDataMap = new Map(); // Mapa de recordKey -> rowData
    const rowsDataStore = new WeakMap(); // Referencia directa fila -> rowData para casos sin clave persistente

    // DEBUG: Listener global para detectar TODOS los clicks
    document.addEventListener('click', (event) => {
      const target = event.target;
      if (target.closest('[data-search-panel-table]')) {
        debugLog('🌍 Click GLOBAL detectado en área de tabla:', {
          target: target,
          tagName: target.tagName,
          className: target.className,
          tbody_contains: tbody.contains(target)
        });
      }
    }, true);

    // Delegación de eventos: UNA VEZ vinculado al tbody
    tbody.addEventListener('click', (event) => {
      debugLog('📍 Click en tbody detectado:', event.target);
      const row = event.target.closest('tr[data-search-panel-row]');
      if (!row) {
        debugLog('⚠️ Click no fue en una fila de datos');
        return;
      }

      const recordKey = row.dataset.recordKey ?? '';
      debugLog('✅ Fila clickeada, recordKey:', recordKey);

      let rowData = rowsDataMap.get(recordKey);
      if (!rowData) {
        const fallbackKey = row.dataset.recordKeyOriginal ?? '';
        if (fallbackKey) {
          rowData = rowsDataMap.get(fallbackKey);
        }
      }
      if (!rowData) {
        rowData = rowsDataStore.get(row) ?? null;
      }
      if (!rowData) {
        debugLog('❌ No se encontró rowData para recordKey:', recordKey);
        return;
      }

      debugLog('🖱️ Click en conductor:', {
        nombreCompleto: rowData.nombreCompleto,
        recordId: rowData.recordId,
        recordIdString: rowData.recordIdString,
        hasRecord: !!rowData.record
      });

      event.preventDefault();
      event.stopPropagation();

      state?.handleRowActivation?.({
        ...rowData,
        recordId: rowData.recordId ?? rowData.recordIdRaw ?? null,
        recordIdString: rowData.recordIdString,
      });
    });

    // También para teclado
    tbody.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') {
        return;
      }

      const row = event.target.closest('tr[data-search-panel-row]');
      if (!row) {
        return;
      }

      const recordKey = row.dataset.recordKey ?? '';
      let rowData = rowsDataMap.get(recordKey);
      if (!rowData) {
        const fallbackKey = row.dataset.recordKeyOriginal ?? '';
        if (fallbackKey) {
          rowData = rowsDataMap.get(fallbackKey);
        }
      }
      if (!rowData) {
        rowData = rowsDataStore.get(row) ?? null;
      }
      if (!rowData) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      state?.handleRowActivation?.({
        ...rowData,
        recordId: rowData.recordId ?? rowData.recordIdRaw ?? null,
        recordIdString: rowData.recordIdString,
      });
    });

    const showRow = (row) => {
      if (row) {
        row.classList.remove('d-none');
      }
    };

    const hideRow = (row) => {
      if (row) {
        row.classList.add('d-none');
      }
    };

    const getErrorCell = () => errorRow?.querySelector('td') ?? null;

    const clearDataRows = () => {
      Array.from(tbody.querySelectorAll('tr[data-search-panel-row]')).forEach((row) => row.remove());
    };

    const renderRows = (rows) => {
      debugLog('🎨 renderRows llamado:', {
        esArray: Array.isArray(rows),
        cantidad: rows?.length || 0,
        primeraFila: rows?.[0]
      });
      clearDataRows();
      if (!Array.isArray(rows) || !rows.length) {
        debugLog('⚠️ No hay filas para renderizar, mostrando mensaje vacío');
        hideRow(loadingRow);
        hideRow(errorRow);
        showRow(emptyRow);
        return;
      }

      debugLog('✅ Renderizando', rows.length, 'conductores');
      rowsDataMap.clear(); // Limpiar mapa antes de renderizar

      rows.forEach((rowData, index) => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-search-panel-row', 'true');
        const recordIdRawValue =
          rowData.recordId !== null && rowData.recordId !== undefined
            ? rowData.recordId
            : rowData.recordIdString ?? '';
        const recordIdStringValue =
          rowData.recordIdString ||
          (recordIdRawValue !== null && recordIdRawValue !== undefined
            ? String(recordIdRawValue).trim()
            : '');

        const recordKeyRaw =
          rowData.recordKey !== null && rowData.recordKey !== undefined
            ? String(rowData.recordKey)
            : '';
        const recordKeyNormalized = recordKeyRaw.trim();
        const recordKeyFallback =
          recordKeyNormalized || (recordIdStringValue ? recordIdStringValue.trim() : '');
        const mapKey = recordKeyFallback || `__row-${index}`;

        tr.dataset.recordId = recordIdStringValue;
        tr.dataset.recordKey = mapKey;
        if (recordKeyNormalized) {
          tr.dataset.recordKeyOriginal = recordKeyNormalized;
        }
        if (recordIdRawValue !== null && recordIdRawValue !== undefined && recordIdStringValue) {
          tr.dataset.recordIdRaw = String(recordIdRawValue);
        }
        tr.classList.add('search-panel-row');
        tr.setAttribute('role', 'button');
        tr.tabIndex = 0;

        // Guardar datos en el mapa para delegación de eventos
        const mappedRowData = {
          ...rowData,
          recordIdRaw: recordIdRawValue,
          recordIdString: recordIdStringValue
        };
        rowsDataMap.set(mapKey, mappedRowData);
        if (recordKeyNormalized && recordKeyNormalized !== mapKey) {
          rowsDataMap.set(recordKeyNormalized, mappedRowData);
        }
        rowsDataStore.set(tr, mappedRowData);

        const nombreTd = document.createElement('td');
        nombreTd.textContent = rowData.nombreCompleto || '—';
        tr.appendChild(nombreTd);

        const documentoTd = document.createElement('td');
        documentoTd.textContent = rowData.numeroDocumento || '—';
        tr.appendChild(documentoTd);

        const estadoTd = document.createElement('td');
        const estadoBadge = document.createElement('span');
        estadoBadge.className = rowData.estadoBadgeClasses || DEFAULT_DRIVER_STATUS_CLASS;
        estadoBadge.textContent = rowData.estado || 'Sin estado';
        estadoTd.appendChild(estadoBadge);
        tr.appendChild(estadoTd);

        const inversorTd = document.createElement('td');
        inversorTd.textContent = rowData.nombreInversor || '—';
        tr.appendChild(inversorTd);

        tbody.appendChild(tr);

        // Log solo para la primera fila
        if (rowData === rows[0]) {
          debugLog('🎯 Primera fila agregada al DOM:', {
            nombreCompleto: rowData.nombreCompleto,
            recordKey: recordKeyNormalized || null,
            mapKey: mapKey,
            guardadoEnMapa: rowsDataMap.has(mapKey),
            estaEnDOM: document.body.contains(tr),
            tbody: tbody,
            tbodyEstaEnDOM: document.body.contains(tbody)
          });
        }
      });

      hideRow(loadingRow);
      hideRow(emptyRow);
      hideRow(errorRow);
    };

    const state = {
      table: tableElement,
      tbody,
      loadingRow,
      emptyRow,
      errorRow,
      cachedRecords: sharedDriverRecords ? sharedDriverRecords.slice() : null,
      isLoading: false,
      isLoaded: false,
      rows: [],
      filteredRows: [],
      error: null,
      loadingPromise: null,
      activeTerm: '',
      panelCloser: null,
      renderRows,
      renderFromRecords(records) {
        this.cachedRecords = Array.isArray(records) ? records.slice() : [];
        const rows = mapDriverRecordsToRows(this.cachedRecords);
        this.rows = rows;
        if (this.activeTerm) {
          const term = this.activeTerm;
          this.activeTerm = '';
          this.setFilterTerm(term);
        } else {
          this.filteredRows = rows.slice();
          renderRows(this.filteredRows);
        }
        this.isLoaded = true;
        this.error = null;
      },
      setLoading(flag) {
        this.isLoading = flag;
        if (flag) {
          this.error = null;
          showRow(this.loadingRow);
          hideRow(this.emptyRow);
          hideRow(this.errorRow);
        } else {
          hideRow(this.loadingRow);
        }
      },
      setFilterTerm(term) {
        const normalizeText = (value) =>
          String(value ?? '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();

        const normalizedTerm = normalizeText(term).trim();

        if (normalizedTerm === this.activeTerm) {
          if (!normalizedTerm) {
            this.filteredRows = this.rows.slice();
            renderRows(this.filteredRows);
          }
          return;
        }

        this.activeTerm = normalizedTerm;

        if (!normalizedTerm) {
          this.filteredRows = this.rows.slice();
          renderRows(this.filteredRows);
          return;
        }

        const tokens = normalizedTerm
          .split(/\s+/)
          .map((token) => token.trim())
          .filter(Boolean);

        if (!tokens.length) {
          this.filteredRows = this.rows.slice();
          renderRows(this.filteredRows);
          return;
        }

        const matchesTokens = (row) => {
          const haystack = normalizeText(
            [
              row.nombreCompleto,
              row.numeroDocumento,
              row.estado,
              row.nombreInversor,
            ].join(' '),
          );
          return tokens.every((token) => haystack.includes(token));
        };

        this.filteredRows = this.rows.filter(matchesTokens);
        renderRows(this.filteredRows);
      },
      showError(message) {
        const targetCell = getErrorCell();
        if (targetCell) {
          targetCell.textContent = message || 'No se pudieron cargar los conductores.';
        }
        hideRow(this.loadingRow);
        hideRow(this.emptyRow);
        showRow(this.errorRow);
      },
      async ensureData() {
        debugLog('📊 ensureData llamado:', {
          isLoaded: this.isLoaded,
          rowsLength: this.rows.length,
          cachedRecordsLength: this.cachedRecords?.length || 0,
          sharedRecordsLength: sharedDriverRecords?.length || 0,
          activeTerm: this.activeTerm
        });

        const resolveRows = () =>
          this.filteredRows.length || this.activeTerm ? this.filteredRows : this.rows;

        if (this.isLoaded && this.rows.length) {
          debugLog('✅ Datos ya cargados, mostrando');
          if (this.activeTerm) {
            this.setFilterTerm(this.activeTerm);
          } else {
            renderRows(resolveRows());
          }
          return resolveRows();
        }

        if (Array.isArray(this.cachedRecords) && this.cachedRecords.length > 0) {
          debugLog('📦 Usando cachedRecords:', this.cachedRecords.length);
          this.renderFromRecords(this.cachedRecords);
          return resolveRows();
        }

        if (Array.isArray(sharedDriverRecords) && sharedDriverRecords !== null && sharedDriverRecords.length > 0) {
          debugLog('🌐 Usando sharedDriverRecords:', sharedDriverRecords.length);
          this.renderFromRecords(sharedDriverRecords);
          return resolveRows();
        }

        debugLog('🔄 No hay datos, haciendo fetch...');

        if (this.isLoading && this.loadingPromise) {
          return this.loadingPromise;
        }

        this.setLoading(true);

        if (!driversFetchPromise) {
          driversFetchPromise = fetchDriverRecordsFromApi()
            .then((records) => {
              setSharedDriverRecords(records);
              return records;
            })
            .finally(() => {
              driversFetchPromise = null;
            });
        }

        this.loadingPromise = driversFetchPromise
          .then((records) => {
            this.renderFromRecords(records);
            return resolveRows();
          })
          .catch((error) => {
            this.error = error;
            this.isLoaded = false;
            this.showError(error?.message || 'No se pudieron cargar los conductores.');
            throw error;
          })
          .finally(() => {
            this.setLoading(false);
            this.loadingPromise = null;
          });

        return this.loadingPromise;
      },
      setPanelCloser(fn) {
        this.panelCloser = typeof fn === 'function' ? fn : null;
      },
      handleRowActivation(rowData, options = {}) {
        debugLog('📞 handleRowActivation llamado:', {
          hasRowData: !!rowData,
          hasRecord: !!rowData?.record,
          recordId: rowData?.recordId,
          recordIdString: rowData?.recordIdString
        });

        if (!rowData || typeof rowData !== 'object') {
          debugLog('❌ rowData inválido, retornando');
          return;
        }

        let record = rowData.record;
        if (!record) {
          const recordIdFallback =
            rowData.recordId !== undefined && rowData.recordId !== null
              ? rowData.recordId
              : rowData.recordIdString ?? null;
          if (recordIdFallback !== null && recordIdFallback !== undefined) {
            const rawKey = normalizeKeyValue(rowData.recordKey) || normalizeKeyValue(recordIdFallback);
            const candidates = Array.isArray(sharedDriverRecords) ? sharedDriverRecords : [];
            const matching = candidates.find((candidate) => {
              if (!candidate || typeof candidate !== 'object') {
                return false;
              }
              const candidateKey = normalizeKeyValue(getDriverRecordPrimaryKey(candidate));
              const candidateId = normalizeKeyValue(candidate.recordId);
              return candidateKey === rawKey || candidateId === normalizeKeyValue(recordIdFallback);
            });
            if (matching) {
              record = matching;
            }
          }
        }
        const recordIdRaw =
          record?.recordId !== undefined && record?.recordId !== null
            ? record.recordId
            : rowData.recordId ?? null;
        const recordIdString =
          rowData.recordIdString ||
          (recordIdRaw !== null && recordIdRaw !== undefined ? String(recordIdRaw).trim() : '');
        const recordKey = normalizeKeyValue(rowData.recordKey) || normalizeKeyValue(recordIdRaw);
        const displayName =
          rowData.nombreCompleto && rowData.nombreCompleto !== '—' ? rowData.nombreCompleto : null;

        persistDriverSelection(record, recordKey, displayName, recordIdRaw ?? recordIdString);

        const closePanel =
          typeof options.closePanel === 'function' ? options.closePanel : this.panelCloser;
        if (closePanel) {
          try {
            closePanel();
          } catch (_) {
            // ignore close failures
          }
        }

        const targetPath = 'ListaConductores.html';
        const currentPath = (window.location.pathname || '').split('/').slice(-1)[0];
        debugLog('🔍 Verificando navegación:', {
          targetPath,
          currentPath,
          estamosEnPagina: currentPath === targetPath,
          recordIdRaw,
          recordIdString
        });

        if (currentPath === targetPath) {
          // Asegurarnos de tener un recordId válido (priorizar recordIdRaw, luego recordIdString)
          const recordIdToSelect = recordIdRaw !== null && recordIdRaw !== undefined ? recordIdRaw : recordIdString;
          debugLog('✅ Estamos en ListaConductores, intentando seleccionar:', recordIdToSelect);
          debugLog('🔧 window.ClientesTable:', window.ClientesTable);
          debugLog('🔧 window.ClientesTable?.selectByRecordId:', window.ClientesTable?.selectByRecordId);

          if (recordIdToSelect && window.ClientesTable?.selectByRecordId) {
            try {
              const selectionResult =
                window.ClientesTable.selectByRecordId(recordIdRaw) ||
                window.ClientesTable.selectByRecordId(recordIdString);
              debugLog('📊 Resultado de selección:', selectionResult);
              if (!selectionResult && typeof window.ClientesTable.reload === 'function') {
                debugLog('🔄 Recargando tabla para intentar seleccionar...');
                window.ClientesTable.reload().then(() => {
                  window.ClientesTable.selectByRecordId(recordIdToSelect);
                });
              }
            } catch (error) {
              console.error('❌ Error al seleccionar:', error);
            }
          } else {
            debugLog('⚠️ No se puede seleccionar:', {
              hasRecordIdToSelect: !!recordIdToSelect,
              hasClientesTable: !!window.ClientesTable,
              hasSelectMethod: !!window.ClientesTable?.selectByRecordId
            });
          }
          return;
        }

        debugLog('🚀 Navegando a ListaConductores...');

        try {
          const url = new URL(targetPath, window.location.href);
          if (recordIdString) {
            url.searchParams.set('recordId', recordIdString);
          }
          window.location.href = url.toString();
        } catch (_) {
          window.location.href = targetPath;
        }
      },
    };

    navbarDriverTables.add(tableElement);
    navbarDriverTableStates.set(tableElement, state);
    tableElement.dataset.initialized = 'true';

    if (Array.isArray(state.cachedRecords)) {
      state.renderFromRecords(state.cachedRecords);
    }

    return state;
  }



  // Navbar search panel interactions
  const navbarSearchForms = document.querySelectorAll('.search-form');
  if (navbarSearchForms.length) {
    navbarSearchForms.forEach((searchForm) => {
      const searchPanel = searchForm.querySelector('.search-panel');
      const searchInput = searchForm.querySelector('input[type="text"], input[type="search"]');

      if (!searchPanel || !searchInput) {
        return;
      }

      const driversTable = searchPanel.querySelector('[data-search-panel-table="drivers"]');
      const driversTableState = initialiseNavbarDriversTable(driversTable);

      const applyFilter = (term) => {
        debugLog('🔎 applyFilter llamado con term:', term);
        const result = driversTableState?.ensureData?.();
        debugLog('📦 ensureData retornó:', {
          esPromesa: !!(result && typeof result.then === 'function'),
          valor: result
        });
        if (result && typeof result.then === 'function') {
          result
            .then(() => {
              debugLog('✅ Promesa resuelta, llamando setFilterTerm');
              driversTableState?.setFilterTerm?.(term);
            })
            .catch((error) => {
              console.error('❌ Error en ensureData:', error);
            });
        } else {
          debugLog('✅ Llamando setFilterTerm síncronamente');
          driversTableState?.setFilterTerm?.(term);
        }
      };

      const setPanelState = (isOpen) => {
        searchForm.classList.toggle('search-form--open', isOpen);
        searchPanel.setAttribute('aria-hidden', String(!isOpen));
        if (isOpen) {
          applyFilter(searchInput.value ?? '');
        }
      };
      driversTableState?.setPanelCloser?.(() => setPanelState(false));

      setPanelState(false);

      const handleFocusIn = () => {
        setPanelState(true);
      };
      const handleFocusOut = (event) => {
        const nextFocusedElement = event.relatedTarget;
        if (!searchForm.contains(nextFocusedElement)) {
          setPanelState(false);
        }
      };

      const handleDocumentClick = (event) => {
        if (!searchForm.contains(event.target)) {
          setPanelState(false);
        }
      };

      const handleEscape = (event) => {
        if (event.key === 'Escape') {
          setPanelState(false);
          const { activeElement } = document;
          if (activeElement && searchForm.contains(activeElement) && typeof activeElement.blur === 'function') {
            activeElement.blur();
          }
          searchInput.blur();
        }
      };

      searchForm.addEventListener('focusin', handleFocusIn);
      searchForm.addEventListener('focusout', handleFocusOut);
      searchForm.addEventListener('keydown', handleEscape);
      searchForm.addEventListener('click', () => {
        applyFilter(searchInput.value ?? '');
      });
      const handleSearchInput = (event) => {
        applyFilter(event.target.value ?? '');
      };
      searchInput.addEventListener('input', handleSearchInput);
      searchInput.addEventListener('search', handleSearchInput);
      document.addEventListener('click', handleDocumentClick);
    });
  }



  // Horizontal menu fixed on scroll on Demo2
  if (horizontalMenu) {
    window.addEventListener('scroll', function () {
      if (window.matchMedia('(min-width: 992px)').matches) {
        if (window.scrollY >= 60) {
          horizontalMenu.classList.add('fixed-on-scroll');
        } else {
          horizontalMenu.classList.remove('fixed-on-scroll');
        }
      }
    });
  }



  // Prevent body scrolling while sidebar scroll
  // 
  // if (sidebarBody) {
  //   sidebarBody.addEventListener('mouseover', function () {
  //     body.classList.add('overflow-hidden');
  //   });
  //   sidebarBody.addEventListener('mouseout', function () {
  //     body.classList.remove('overflow-hidden');
  //   });
  // }




  // Setup clipboard.js plugin (https://github.com/zenorocha/clipboard.js)
  const clipboardButtons = document.querySelectorAll('.btn-clipboard');

  if (clipboardButtons.length) {

    clipboardButtons.forEach( btn => {
      btn.addEventListener('mouseover', function() {
        this.innerText = 'Copy to clipboard';
      });
      btn.addEventListener('mouseout', function() {
        this.innerText = 'Copy';
      });
    });

    const clipboard = new ClipboardJS('.btn-clipboard');

    clipboard.on('success', function(e) {
      e.trigger.innerHTML = 'Copied';
      setTimeout(function() {
        e.trigger.innerHTML = 'Copy';
        e.clearSelection();
      },800)
    });
  }



  // Enable lucide icons with SVG markup
  lucide.createIcons();

})();
