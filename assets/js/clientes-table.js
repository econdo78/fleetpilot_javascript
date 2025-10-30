(() => {
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
  const TABLE_SELECTOR = '#clientesTable';
  const LAYOUT = 'clientes';
  const TABLE_SEARCH_SELECTOR = '[data-clientes-table-search]';
  const COLUMN_MODAL_SELECTOR = '[data-clientes-columns-modal]';
  const COLUMN_LIST_SELECTOR = '[data-clientes-columns-list]';
  const COLUMN_ALL_SELECTOR = '[data-clientes-columns-all]';
  const COLUMN_SEARCH_SELECTOR = '[data-clientes-columns-search]';
  const COLUMN_EMPTY_SELECTOR = '[data-clientes-columns-empty]';
  const PRIMARY_COLUMN_ALIASES = [
    ['nombrecompleto'],
    ['dni', 'documentoidentidad', 'ndocumentoidentidad', 'ndcumentoidentidad'],
    ['estado'],
    ['matricula', 'matriculavehiculoasignado', 'matriculaasignada'],
    ['nombreinversor', 'inversornombre'],
    ['numerotarjetacombustible', 'tarjetacombustible', 'ntarjetacombustible'],
    ['numerotarjetaefectivo', 'tarjetaefectivo', 'ntarjetaefectivo']
  ];
  const DEFAULT_VISIBLE_COLUMN_KEYS = new Set(PRIMARY_COLUMN_ALIASES.flat());
  const LOCKED_COLUMNS = new Set(['id', ...DEFAULT_VISIBLE_COLUMN_KEYS]);
  const ACTIONS_TRIGGER_SELECTOR = '[data-clientes-actions-toggle]';
  const ACTIONS_NAME_SELECTOR = '[data-clientes-actions-name]';
  const ACTIONS_OFFCANVAS_ID = 'clientesActionsOffcanvas';
  const EXPORT_BUTTON_SELECTOR = '[data-clientes-export]';
  const EXPORT_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  const PROCESS_SELECTION_STORAGE_KEY = 'clientes.process-selection';

  const getSessionStorage = (() => {
    let cached = undefined;
    return () => {
      if (cached !== undefined) {
        return cached;
      }
      cached = null;
      try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          const testKey = '__clientes_session_test__';
          window.sessionStorage.setItem(testKey, '1');
          window.sessionStorage.removeItem(testKey);
          cached = window.sessionStorage;
        }
      } catch (_) {
        cached = null;
      }
      return cached;
    };
  })();

  const saveProcessSelection = (record, fieldOrder, displayName = null, recordKey = null) => {
    const storage = getSessionStorage();
    if (!storage) {
      return;
    }
    if (!record) {
      try {
        storage.removeItem(PROCESS_SELECTION_STORAGE_KEY);
      } catch (_) {
        // ignore
      }
      return;
    }
    const normalizedRecordKey = normalizeKeyValue(recordKey);
    const payload = {
      layout: LAYOUT,
      savedAt: Date.now(),
      recordKey: record.recordId ?? null,
      recordId: record.recordId ?? null,
      fieldOrder: Array.isArray(fieldOrder) ? fieldOrder.slice() : [],
      displayName: typeof displayName === 'string' && displayName.trim() ? displayName.trim() : null,
      key: normalizedRecordKey || null,
      record
    };
    try {
      storage.setItem(PROCESS_SELECTION_STORAGE_KEY, JSON.stringify(payload));
    } catch (_) {
      // ignore storage issues
    }
  };

  const loadProcessSelection = () => {
    const storage = getSessionStorage();
    if (!storage) {
      return null;
    }
    let raw = null;
    try {
      raw = storage.getItem(PROCESS_SELECTION_STORAGE_KEY);
    } catch (_) {
      raw = null;
    }
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        return null;
      }
      if (parsed.layout && parsed.layout !== LAYOUT) {
        return null;
      }
      return parsed;
    } catch (_) {
      return null;
    }
  };

  const clearProcessSelection = () => {
    saveProcessSelection(null, []);
  };

  const normalizeColumnName = (name) => {
    const raw = String(name ?? '').trim();
    const withoutPrefix = raw.includes('::') ? raw.split('::').pop() : raw;
    const ascii = withoutPrefix.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return ascii.replace(/[^a-z0-9]/gi, '').toLowerCase();
  };

  const humanizeColumnName = (name) => {
    const raw = String(name ?? '').trim();
    const normalizedKey = normalizeColumnName(raw);

    // Mapeo de nombres técnicos a nombres amigables
    const friendlyNames = {
      'ndocumentoidentidad': 'Número de documento de identidad',
      'documentoidentidad': 'Documento de identidad',
      'ndcumentoidentidad': 'Número de documento de identidad',
      'dni': 'DNI',
      'nie': 'NIE',
      'nombrecompleto': 'Nombre completo',
      'nombre': 'Nombre',
      'apellido1': 'Primer apellido',
      'apellido2': 'Segundo apellido',
      'estado': 'Estado',
      'estadogeneral': 'Estado general',
      'estadoconductor': 'Estado del conductor',
      'fechanacimiento': 'Fecha de nacimiento',
      'edad': 'Edad',
      'nafiliacionss': 'Número de afiliación S.S.',
      'nacionalidad': 'Nacionalidad',
      'nivelformativotrabajador': 'Nivel formativo',
      'telefono1': 'Teléfono 1',
      'telefono2': 'Teléfono 2',
      'correopersonal': 'Correo personal',
      'correoplataforma': 'Correo plataforma',
      'telefonoboltcompleto': 'Teléfono Bolt',
      'tipovia': 'Tipo de vía',
      'nombrevia': 'Nombre de vía',
      'numero': 'Número',
      'pisoyLetra': 'Piso y letra',
      'cp': 'Código postal',
      'localidad': 'Localidad',
      'provincia': 'Provincia',
      'matricula': 'Matrícula',
      'matriculavehiculoasignado': 'Matrícula vehículo asignado',
      'matriculaasignada': 'Matrícula asignada',
      'nombreinversor': 'Nombre del inversor',
      'inversornombre': 'Nombre del inversor',
      'numerotarjetacombustible': 'Número tarjeta combustible',
      'tarjetacombustible': 'Tarjeta combustible',
      'ntarjetacombustible': 'Número tarjeta combustible',
      'numerotarjetaefectivo': 'Número tarjeta efectivo',
      'tarjetaefectivo': 'Tarjeta efectivo',
      'ntarjetaefectivo': 'Número tarjeta efectivo',
      'fechafirma': 'Fecha de firma',
      'tipodocumentoidentidad': 'Tipo de documento de identidad'
    };

    // Si existe un nombre amigable, usarlo
    if (friendlyNames[normalizedKey]) {
      return friendlyNames[normalizedKey];
    }

    // Si no, capitalizar la primera letra y devolver el nombre original
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  };

  const isLockedColumn = (name) => LOCKED_COLUMNS.has(normalizeColumnName(name));
  const isHiddenColumn = (name) => normalizeColumnName(name) === 'id';

  const escapeHtml = (value) => {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const ready = (callback) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  };

  const select = (selector) => document.querySelector(selector);

  const getExportButton = () => select(EXPORT_BUTTON_SELECTOR);
  const getTableSearchInput = () => select(TABLE_SEARCH_SELECTOR);

  const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const applyTableSearchHighlights = () => {
    const table = select(TABLE_SELECTOR);
    const tbody = table?.tBodies?.[0];
    if (!tbody) {
      return;
    }
    const rawTerm = (getTableSearchInput()?.value ?? '').trim();
    const tokens = rawTerm
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 0)
      .sort((a, b) => b.length - a.length);
    const shouldHighlight = tokens.length > 0;

    Array.from(tbody.rows).forEach((row) => {
      Array.from(row.cells).forEach((cell) => {
        const original = cell.dataset.originalContent ?? cell.innerHTML;
        if (cell.dataset.originalContent === undefined) {
          cell.dataset.originalContent = original;
        }
        const baseHtml = cell.dataset.originalContent;
        if (!shouldHighlight) {
          if (cell.innerHTML !== baseHtml) {
            cell.innerHTML = baseHtml;
          }
          return;
        }

        // Si la celda contiene HTML (badges, etc), no aplicar highlight para evitar romper el markup
        const containsHtml = /<[^>]+>/.test(baseHtml);
        if (containsHtml) {
          if (cell.innerHTML !== baseHtml) {
            cell.innerHTML = baseHtml;
          }
          return;
        }

        let highlightedHtml = baseHtml;
        tokens.forEach((token) => {
          if (!token) {
            return;
          }
          const regex = new RegExp(`(${escapeRegex(token)})`, 'gi');
          highlightedHtml = highlightedHtml.replace(regex, '<span class="table-search-highlight">$1</span>');
        });
        if (cell.innerHTML !== highlightedHtml) {
          cell.innerHTML = highlightedHtml;
        }
      });
    });
  };

  const unbindTableSearchInput = () => {
    const input = getTableSearchInput();
    if (!input || !input.__clientesSearchHandler) {
      return;
    }
    ['input', 'search'].forEach((eventName) => {
      input.removeEventListener(eventName, input.__clientesSearchHandler);
    });
    input.__clientesSearchHandler = null;
  };

  const bindTableSearchInput = () => {
    const input = getTableSearchInput();
    if (!input || !dataTableInstance) {
      return;
    }
    unbindTableSearchInput();
    const handler = () => {
      const value = input.value ?? '';
      dataTableInstance.search(value).draw();
      applyTableSearchHighlights();
    };
    ['input', 'search'].forEach((eventName) => {
      input.addEventListener(eventName, handler);
    });
    input.__clientesSearchHandler = handler;
    const initialValue = input.value ?? '';
    if (initialValue !== dataTableInstance.search()) {
      dataTableInstance.search(initialValue).draw();
    }
    applyTableSearchHighlights();
  };

  const applyPendingOrderState = () => {
    if (!dataTableInstance || !Array.isArray(pendingOrderState) || !pendingOrderState.length) {
      return;
    }
    const columnIndexMap = new Map();
    lastColumnMeta.forEach((meta, index) => {
      if (typeof meta.name === 'string') {
        columnIndexMap.set(meta.name, index);
      }
      if (typeof meta.key === 'string') {
        columnIndexMap.set(meta.key, index);
      }
    });
    const orderConfig = [];
    pendingOrderState.forEach((descriptor) => {
      if (!descriptor || typeof descriptor !== 'object') {
        return;
      }
      const normalizedDir = descriptor.dir === 'desc' ? 'desc' : 'asc';
      const byName = typeof descriptor.name === 'string' ? descriptor.name : '';
      const byKey = typeof descriptor.key === 'string' ? descriptor.key : '';
      const index = columnIndexMap.has(byName)
        ? columnIndexMap.get(byName)
        : columnIndexMap.has(byKey)
          ? columnIndexMap.get(byKey)
          : null;
      if (index != null) {
        orderConfig.push([index, normalizedDir]);
      }
    });
    if (orderConfig.length) {
      dataTableInstance.order(orderConfig).draw(false);
    }
    pendingOrderState = null;
  };

  const getRecordDisplayLabel = (record) => {
    if (!record) {
      return '';
    }
    const fieldData = record.fieldData ?? {};
    const candidate = [
      fieldData.nombreCompleto,
      fieldData.NombreCompleto,
      fieldData.nombrecompleto,
      fieldData.Nombre,
      fieldData.nombre
    ].find((value) => typeof value === 'string' && value.trim());
    if (candidate) {
      return candidate.trim();
    }
    const composedName = ['nombre', 'apellido1', 'apellido2']
      .map((key) => fieldData[key])
      .filter((value) => typeof value === 'string' && value.trim())
      .join(' ')
      .trim();
    if (composedName) {
      return composedName;
    }
    if (record.recordId !== undefined && record.recordId !== null && String(record.recordId).trim()) {
      return `ID ${record.recordId}`;
    }
    return 'conductor seleccionado';
  };

  const normalizeKeyValue = (value) => {
    if (value === null || value === undefined) {
      return '';
    }
    return (typeof value === 'string' ? value : String(value)).trim();
  };

  const getRecordPrimaryKey = (record) => {
    if (!record) {
      return null;
    }
    const fieldData = record.fieldData ?? {};
    const candidates = [
      fieldData.id,
      fieldData.ID,
      fieldData.Id,
      fieldData.uuid,
      fieldData.UUID,
      fieldData.Uuid
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

  const updateActionsControls = (record) => {
    const trigger = select(ACTIONS_TRIGGER_SELECTOR);
    const nameTarget = select(ACTIONS_NAME_SELECTOR);
    const hasRecord = Boolean(record);
    if (trigger) {
      const forceVisible = trigger.hasAttribute('data-actions-always-visible');
      if (forceVisible) {
        trigger.classList.remove('d-none');
        trigger.setAttribute('aria-hidden', 'false');
        trigger.toggleAttribute('disabled', !hasRecord);
      } else {
        trigger.classList.toggle('d-none', !hasRecord);
        trigger.toggleAttribute('disabled', !hasRecord);
        trigger.setAttribute('aria-hidden', hasRecord ? 'false' : 'true');
      }
      if (!hasRecord) {
        const offcanvasElement = document.getElementById(ACTIONS_OFFCANVAS_ID);
        const offcanvasInstance = window.bootstrap?.Offcanvas?.getInstance?.(offcanvasElement);
        offcanvasInstance?.hide?.();
      }
    }
    if (nameTarget) {
      nameTarget.textContent = hasRecord ? getRecordDisplayLabel(record) : 'seleccionado';
    }
  };

  let dataTableInstance = null;
  let selectedRecordKey = null;
  let recordsByKey = new Map();
  let fieldOrder = [];
  let currentRecords = [];

  const shareCurrentRecords = () => {
    const snapshot = Array.isArray(currentRecords)
      ? currentRecords.slice()
      : [];
    window.ClientesSharedData = window.ClientesSharedData || {};
    window.ClientesSharedData[LAYOUT] = snapshot;
    document.dispatchEvent(
      new CustomEvent('clientesTable:data', {
        detail: {
          layout: LAYOUT,
          records: snapshot,
        },
      }),
    );
  };

  const columnVisibility = new Map();
  let defaultVisibilityFallbackAll = false;
  let renderPending = false;
  let lastColumnMeta = [];
  let pendingOrderState = null;

  const TABLE_STATE_STORAGE_PREFIX = 'clientesTable.state';

  const getPersistentStorage = (() => {
    let cached = undefined;
    return () => {
      if (cached !== undefined) {
        return cached;
      }
      cached = null;
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const testKey = `${TABLE_STATE_STORAGE_PREFIX}.__test__`;
          window.localStorage.setItem(testKey, '1');
          window.localStorage.removeItem(testKey);
          cached = window.localStorage;
        }
      } catch (_) {
        cached = null;
      }
      return cached;
    };
  })();

  const getStorageKey = () => {
    const rawUser = window.AuthStorage?.getUser?.();
    const normalizedUser = typeof rawUser === 'string' && rawUser.trim()
      ? rawUser.trim().toLowerCase().replace(/[^a-z0-9_-]+/gi, '_')
      : 'anonimo';
    return `${TABLE_STATE_STORAGE_PREFIX}:${normalizedUser}:${LAYOUT}`;
  };

  const loadStoredTableState = () => {
    const storage = getPersistentStorage();
    if (!storage) {
      return null;
    }
    const raw = storage.getItem(getStorageKey());
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw);
      const storedFieldOrder = Array.isArray(parsed?.fieldOrder)
        ? parsed.fieldOrder.filter((value) => typeof value === 'string' && value.trim())
        : [];
      const uniqueFieldOrder = Array.from(new Set(storedFieldOrder));
      const storedVisibility = parsed?.visibility && typeof parsed.visibility === 'object'
        ? parsed.visibility
        : {};
      return {
        fieldOrder: uniqueFieldOrder,
        visibility: storedVisibility
      };
    } catch (_) {
      return null;
    }
  };

  const saveTableState = (activeColumns = null) => {
    const storage = getPersistentStorage();
    if (!storage) {
      return;
    }
    const payload = {
      fieldOrder: Array.isArray(fieldOrder)
        ? Array.from(new Set(fieldOrder.filter((value) => typeof value === 'string' && value.trim())))
        : [],
      visibility: {}
    };
    columnVisibility.forEach((visible, name) => {
      if (typeof name === 'string' && name.trim()) {
        payload.visibility[name] = Boolean(visible);
      }
    });
    if (Array.isArray(activeColumns) && activeColumns.length) {
      const allowed = new Set(activeColumns);
      payload.fieldOrder = payload.fieldOrder.filter((name) => allowed.has(name));
      const filteredVisibility = {};
      Object.entries(payload.visibility).forEach(([name, visible]) => {
        if (allowed.has(name)) {
          filteredVisibility[name] = visible;
        }
      });
      payload.visibility = filteredVisibility;
    }
    try {
      storage.setItem(getStorageKey(), JSON.stringify(payload));
    } catch (_) {
      // Ignored (e.g., quota exceeded, privacy mode).
    }
  };

  const initializeTableStateFromStorage = () => {
    const stored = loadStoredTableState();
    if (!stored) {
      return;
    }
    if (Array.isArray(stored.fieldOrder) && stored.fieldOrder.length) {
      fieldOrder = stored.fieldOrder.slice();
    }
    if (stored.visibility && typeof stored.visibility === 'object') {
      Object.entries(stored.visibility).forEach(([name, visible]) => {
        if (typeof name === 'string' && name.trim()) {
          columnVisibility.set(name, Boolean(visible));
        }
      });
    }
  };

  initializeTableStateFromStorage();

  const dispatchSelectionChange = () => {
    const record = selectedRecordKey ? recordsByKey.get(selectedRecordKey) ?? null : null;
    const currentFieldOrder = Array.isArray(fieldOrder) ? [...fieldOrder] : [];
    const displayName = record ? getRecordDisplayLabel(record) : null;
    updateActionsControls(record);
    if (record) {
      saveProcessSelection(record, currentFieldOrder, displayName, selectedRecordKey);
    } else {
      clearProcessSelection();
    }
    document.dispatchEvent(new CustomEvent('clientesTable:select', {
      detail: {
        recordKey: selectedRecordKey,
        recordId: record?.recordId ?? null,
        record,
        fieldOrder: currentFieldOrder,
        displayName
      }
    }));
  };

  const toggleSpinner = (visible) => {
    const spinner = select('[data-clientes-loading]');
    if (!spinner) {
      return;
    }
    spinner.classList.toggle('d-none', !visible);
  };

  const setStatus = (message) => {
    const status = select('[data-clientes-status]');
    if (!status) {
      return;
    }
    if (!message) {
      status.textContent = '';
      status.classList.add('d-none');
      return;
    }
    status.textContent = message;
    status.classList.remove('d-none');
  };

  const clearPlaceholders = (table) => {
    table.querySelector('[data-clientes-placeholder-header]')?.remove();
    table.querySelector('[data-clientes-placeholder-row]')?.remove();
  };

  const applySelectionHighlight = (table) => {
    const tbody = table.tBodies[0];
    if (!tbody) {
      return;
    }
    Array.from(tbody.rows).forEach((row) => {
      const isSelected = Boolean(selectedRecordKey && row.dataset.recordKey === selectedRecordKey);
      row.classList.toggle('table-active', isSelected);
    });
  };

  const scrollSelectedRowIntoView = (table) => {
    if (!table || !selectedRecordKey) {
      return;
    }
    const tbody = table.tBodies[0];
    if (!tbody) {
      return;
    }
    const rows = Array.from(tbody.rows);
    const target = rows.find((row) => row.dataset.recordKey === selectedRecordKey);
    if (!target) {
      return;
    }
    target.scrollIntoView({ block: 'nearest' });
  };

  const restoreProcessSelection = () => {
    const loader = window.ClientesProcessSelection?.load;
    if (typeof loader !== 'function') {
      return false;
    }
    let stored = null;
    try {
      stored = loader();
    } catch (_) {
      stored = null;
    }
    if (!stored || typeof stored !== 'object') {
      return false;
    }
    const rawKey = stored.key ?? stored.recordKey ?? null;
    const storedKey = typeof rawKey === 'string' && rawKey.trim() ? rawKey.trim() : null;
    const storedRecordId = typeof stored.recordId === 'string' && stored.recordId.trim() ? stored.recordId.trim() : null;
    if (!storedKey && !storedRecordId) {
      return false;
    }
    const candidateKey = storedKey ? normalizeKeyValue(storedKey) : null;
    const candidateRecordId = storedRecordId ? normalizeKeyValue(storedRecordId) : null;
    let candidate = candidateKey;
    if (!candidate && candidateRecordId) {
      candidate = candidateRecordId;
    }
    if (!candidate) {
      return false;
    }
    if (!recordsByKey.has(candidate)) {
      if (candidateRecordId && recordsByKey.has(candidateRecordId)) {
        candidate = candidateRecordId;
      } else if (candidateKey && recordsByKey.has(candidateKey)) {
        candidate = candidateKey;
      } else {
        return false;
      }
    }
    selectedRecordKey = candidate;
    return true;
  };

  const bindRowSelection = ($table, tableNode) => {
    $table.off('click.clientes-row');
    $table.off('draw.dt.clientes-row');

    $table.on('click.clientes-row', 'tbody tr', function handleRowClick() {
      const clickedKey = this.dataset.recordKey || null;
      // Toggle: si hago clic en la misma fila, deseleccionar
      if (selectedRecordKey === clickedKey) {
        selectedRecordKey = null;
      } else {
        selectedRecordKey = clickedKey;
      }
      applySelectionHighlight(tableNode);
      dispatchSelectionChange();
    });

    $table.on('draw.dt.clientes-row', () => {
      applySelectionHighlight(tableNode);
      scrollSelectedRowIntoView(tableNode);
      if (dataTableInstance) {
        document.dispatchEvent(new CustomEvent('clientesTable:draw', { detail: { instance: dataTableInstance } }));
      }
    });

    applySelectionHighlight(tableNode);
  };

  document.addEventListener('clientesTable:clear-selection', () => {
    selectedRecordKey = null;
    const tableNode = document.querySelector(TABLE_SELECTOR);
    if (tableNode) {
      applySelectionHighlight(tableNode);
    }
    dispatchSelectionChange();
  });

  const setExportButtonEnabled = (enabled) => {
    const button = getExportButton();
    if (!button) {
      return;
    }
    button.toggleAttribute('disabled', !enabled);
  };

  const collectVisibleColumnMetadata = () => {
    if (!dataTableInstance || !Array.isArray(lastColumnMeta) || !lastColumnMeta.length) {
      return [];
    }
    const indexes = dataTableInstance.columns(':visible').indexes().toArray();
    const result = [];
    indexes.forEach((columnIndex) => {
      const meta = lastColumnMeta.find((entry) => entry.dataIndex === columnIndex);
      if (!meta || meta.isAction) {
        return;
      }
      const headerNode = dataTableInstance.column(columnIndex).header();
      const fallbackName = typeof headerNode?.textContent === 'string' ? headerNode.textContent.trim() : `Columna ${columnIndex + 1}`;
      result.push({
        index: columnIndex,
        name: typeof meta.name === 'string' && meta.name.trim() ? meta.name : fallbackName
      });
    });
    return result;
  };

  const getCellTextContent = (cellNode, rawValue) => {
    if (cellNode) {
      const clone = cellNode.cloneNode(true);
      clone.querySelectorAll('script, style').forEach((node) => node.remove());
      return clone.textContent.replace(/\s+/g, ' ').trim();
    }
    if (rawValue === undefined || rawValue === null) {
      return '';
    }
    if (typeof rawValue === 'string') {
      return rawValue.trim();
    }
    return String(rawValue).trim();
  };

  const collectFilteredRowSnapshot = (visibleColumns) => {
    if (!dataTableInstance || !visibleColumns.length) {
      return [];
    }
    const rowIndexes = dataTableInstance.rows({ search: 'applied', order: 'applied' }).indexes().toArray();
    return rowIndexes.map((rowIndex) => {
      return visibleColumns.map(({ index }) => {
        const cell = dataTableInstance.cell(rowIndex, index);
        const node = typeof cell?.node === 'function' ? cell.node() : null;
        const rawValue = typeof cell?.data === 'function' ? cell.data() : '';
        return getCellTextContent(node, rawValue);
      });
    });
  };

  const escapeXml = (value) => {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const sanitizeWorksheetName = (name) => {
    const invalidChars = /[\\/?*\[\]:]/g;
    const cleaned = String(name ?? '')
      .trim()
      .replace(/\s+/g, ' ')
      .replace(invalidChars, ' ')
      .slice(0, 31);
    return cleaned || 'Hoja1';
  };

  const sanitizeFileName = (name) => {
    const base = String(name ?? 'export')
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_-]+/g, '');
    return base || 'export';
  };

  const utf8Encoder = new TextEncoder();

  const CRC32_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let index = 0; index < 256; index += 1) {
      let crc = index;
      for (let bit = 0; bit < 8; bit += 1) {
        if ((crc & 1) !== 0) {
          crc = (crc >>> 1) ^ 0xedb88320;
        } else {
          crc >>>= 1;
        }
      }
      table[index] = crc >>> 0;
    }
    return table;
  })();

  const crc32 = (data) => {
    let crc = 0xffffffff;
    for (let index = 0; index < data.length; index += 1) {
      const byte = data[index];
      crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ byte) & 0xff];
    }
    return (crc ^ 0xffffffff) >>> 0;
  };

  const concatUint8Arrays = (arrays) => {
    const totalLength = arrays.reduce((sum, array) => sum + array.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    arrays.forEach((array) => {
      result.set(array, offset);
      offset += array.length;
    });
    return result;
  };

  const toUint8Array = (input) => (typeof input === 'string' ? utf8Encoder.encode(input) : input);

  const columnLetter = (index) => {
    let dividend = index + 1;
    let column = '';
    while (dividend > 0) {
      const modulo = (dividend - 1) % 26;
      column = String.fromCharCode(65 + modulo) + column;
      dividend = Math.floor((dividend - modulo) / 26);
    }
    return column;
  };

  const createInlineCell = (value, columnIndex, rowIndex) => {
    const cellRef = `${columnLetter(columnIndex)}${rowIndex}`;
    const text = escapeXml(value);
    const textNode = text ? `<t xml:space="preserve">${text}</t>` : '<t xml:space="preserve"></t>';
    return `<c r="${cellRef}" t="inlineStr"><is>${textNode}</is></c>`;
  };

  const buildWorksheetXml = (columns, rows) => {
    const totalColumns = columns.length;
    const totalRows = rows.length + 1;
    const lastCell = totalColumns ? `${columnLetter(totalColumns - 1)}${Math.max(totalRows, 1)}` : 'A1';
    const dimensionRef = totalColumns ? `A1:${lastCell}` : 'A1';
    const headerRow = `<row r="1">${columns
      .map((column, index) => createInlineCell(column.name, index, 1))
      .join('')}</row>`;
    const dataRows = rows
      .map((cells, rowIndex) => {
        const excelRow = rowIndex + 2;
        const cellXml = cells
          .map((value, columnIndex) => createInlineCell(value, columnIndex, excelRow))
          .join('');
        return `<row r="${excelRow}">${cellXml}</row>`;
      })
      .join('');
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
      `<dimension ref="${dimensionRef}"/>` +
      `<sheetData>${headerRow}${dataRows}</sheetData>` +
      `</worksheet>`;
  };

  const buildWorkbookXml = (sheetName) => {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ` +
      `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
      `<sheets>` +
      `<sheet name="${escapeXml(sheetName)}" sheetId="1" r:id="rId1"/>` +
      `</sheets>` +
      `</workbook>`;
  };

  const buildWorkbookRelationshipsXml = () => {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
      `</Relationships>`;
  };

  const buildPackageRelationshipsXml = () => {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
      `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>` +
      `<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>` +
      `</Relationships>`;
  };

  const buildContentTypesXml = () => {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
      `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
      `<Default Extension="xml" ContentType="application/xml"/>` +
      `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
      `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
      `<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>` +
      `<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>` +
      `</Types>`;
  };

  const buildAppPropertiesXml = () => {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" ` +
      `xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">` +
      `<Application>Microsoft Excel</Application>` +
      `</Properties>`;
  };

  const buildCorePropertiesXml = (title) => {
    const timestamp = new Date().toISOString();
    const safeTitle = escapeXml(title);
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" ` +
      `xmlns:dc="http://purl.org/dc/elements/1.1/" ` +
      `xmlns:dcterms="http://purl.org/dc/terms/" ` +
      `xmlns:dcmitype="http://purl.org/dc/dcmitype/" ` +
      `xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">` +
      `<dc:title>${safeTitle}</dc:title>` +
      `<dc:creator>FleetPilot</dc:creator>` +
      `<cp:lastModifiedBy>FleetPilot</cp:lastModifiedBy>` +
      `<dcterms:created xsi:type="dcterms:W3CDTF">${timestamp}</dcterms:created>` +
      `<dcterms:modified xsi:type="dcterms:W3CDTF">${timestamp}</dcterms:modified>` +
      `</cp:coreProperties>`;
  };

  const createZipBlob = (files) => {
    const localParts = [];
    const centralParts = [];
    let offset = 0;

    files.forEach((file) => {
      const fileNameBytes = utf8Encoder.encode(file.name);
      const fileData = toUint8Array(file.data);
      const crc = crc32(fileData);
      const size = fileData.length;

      const localHeader = new Uint8Array(30 + fileNameBytes.length);
      const localView = new DataView(localHeader.buffer);
      localView.setUint32(0, 0x04034b50, true);
      localView.setUint16(4, 20, true);
      localView.setUint16(6, 0x0800, true);
      localView.setUint16(8, 0, true);
      localView.setUint16(10, 0, true);
      localView.setUint16(12, 0, true);
      localView.setUint32(14, crc, true);
      localView.setUint32(18, size, true);
      localView.setUint32(22, size, true);
      localView.setUint16(26, fileNameBytes.length, true);
      localView.setUint16(28, 0, true);
      localHeader.set(fileNameBytes, 30);

      const centralHeader = new Uint8Array(46 + fileNameBytes.length);
      const centralView = new DataView(centralHeader.buffer);
      centralView.setUint32(0, 0x02014b50, true);
      centralView.setUint16(4, 0x0314, true);
      centralView.setUint16(6, 20, true);
      centralView.setUint16(8, 0x0800, true);
      centralView.setUint16(10, 0, true);
      centralView.setUint16(12, 0, true);
      centralView.setUint16(14, 0, true);
      centralView.setUint32(16, crc, true);
      centralView.setUint32(20, size, true);
      centralView.setUint32(24, size, true);
      centralView.setUint16(28, fileNameBytes.length, true);
      centralView.setUint16(30, 0, true);
      centralView.setUint16(32, 0, true);
      centralView.setUint16(34, 0, true);
      centralView.setUint16(36, 0, true);
      centralView.setUint32(38, 0, true);
      centralView.setUint32(42, offset, true);
      centralHeader.set(fileNameBytes, 46);

      localParts.push(localHeader, fileData);
      centralParts.push(centralHeader);
      offset += localHeader.length + fileData.length;
    });

    const centralDirectory = concatUint8Arrays(centralParts);
    const centralOffset = offset;
    const centralSize = centralDirectory.length;

    const endOfCentralDir = new Uint8Array(22);
    const endView = new DataView(endOfCentralDir.buffer);
    endView.setUint32(0, 0x06054b50, true);
    endView.setUint16(4, 0, true);
    endView.setUint16(6, 0, true);
    endView.setUint16(8, files.length, true);
    endView.setUint16(10, files.length, true);
    endView.setUint32(12, centralSize, true);
    endView.setUint32(16, centralOffset, true);
    endView.setUint16(20, 0, true);

    const zipBytes = concatUint8Arrays([...localParts, centralDirectory, endOfCentralDir]);
    return new Blob([zipBytes], { type: EXPORT_MIME_TYPE });
  };

  const createXlsxBlob = (columns, rows) => {
    const sheetName = sanitizeWorksheetName(LAYOUT || 'Hoja1');
    const worksheetXml = buildWorksheetXml(columns, rows);
    const workbookXml = buildWorkbookXml(sheetName);
    const workbookRelsXml = buildWorkbookRelationshipsXml();
    const packageRelsXml = buildPackageRelationshipsXml();
    const contentTypesXml = buildContentTypesXml();
    const appPropsXml = buildAppPropertiesXml();
    const corePropsXml = buildCorePropertiesXml(sheetName);

    return createZipBlob([
      { name: '[Content_Types].xml', data: contentTypesXml },
      { name: '_rels/.rels', data: packageRelsXml },
      { name: 'docProps/app.xml', data: appPropsXml },
      { name: 'docProps/core.xml', data: corePropsXml },
      { name: 'xl/workbook.xml', data: workbookXml },
      { name: 'xl/_rels/workbook.xml.rels', data: workbookRelsXml },
      { name: 'xl/worksheets/sheet1.xml', data: worksheetXml }
    ]);
  };

  const downloadExcelFile = (blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const now = new Date();
    const pad = (value) => String(value).padStart(2, '0');
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    link.href = url;
    link.download = `${sanitizeFileName(LAYOUT || 'export')}_${timestamp}.xlsx`;
    document.body?.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const exportVisibleTable = () => {
    const columns = collectVisibleColumnMetadata();
    const rows = collectFilteredRowSnapshot(columns);
    if (!columns.length || !rows.length) {
      return false;
    }
    const workbookBlob = createXlsxBlob(columns, rows);
    downloadExcelFile(workbookBlob);
    return true;
  };

  const updateExportButtonState = () => {
    if (!dataTableInstance) {
      setExportButtonEnabled(false);
      return;
    }
    const columns = collectVisibleColumnMetadata();
    const hasRows = dataTableInstance.rows({ search: 'applied', order: 'applied' }).indexes().toArray().length > 0;
    setExportButtonEnabled(columns.length > 0 && hasRows);
  };

  const bindExportButton = () => {
    const button = getExportButton();
    if (!button) {
      return;
    }
    if (button.__clientesExportHandler) {
      button.removeEventListener('click', button.__clientesExportHandler);
    }
    const handler = (event) => {
      event.preventDefault();
      if (!dataTableInstance) {
        return;
      }
      if (!exportVisibleTable()) {
        button.blur();
      }
    };
    button.addEventListener('click', handler);
    button.__clientesExportHandler = handler;
  };

  const getColumnModal = () => select(COLUMN_MODAL_SELECTOR);
  const getColumnList = () => select(COLUMN_LIST_SELECTOR);
  const getColumnAllToggle = () => select(COLUMN_ALL_SELECTOR);
  const getColumnSearchInput = () => select(COLUMN_SEARCH_SELECTOR);
  const getColumnEmptyMessage = () => select(COLUMN_EMPTY_SELECTOR);

  const applySavedVisibility = (columnsMeta) => {
    if (!dataTableInstance) {
      return;
    }
    const names = columnsMeta.map((meta) => meta.name);
    const seen = new Set(names);
    Array.from(columnVisibility.keys()).forEach((name) => {
      if (!seen.has(name)) {
        columnVisibility.delete(name);
      }
    });
    columnsMeta.forEach((meta) => {
      const { name, dataIndex } = meta;
      const normalized = normalizeColumnName(name);
      const defaultVisible = DEFAULT_VISIBLE_COLUMN_KEYS.has(normalized) || defaultVisibilityFallbackAll;
      const stored = columnVisibility.has(name) ? columnVisibility.get(name) : defaultVisible;
      const visible = isLockedColumn(name) ? true : stored;
      columnVisibility.set(name, visible);
      dataTableInstance.column(dataIndex).visible(visible, false);
    });
    dataTableInstance.columns.adjust().draw(false);
    saveTableState(names);
  };

  const bindColumnControls = (columnsMeta) => {
    const modal = getColumnModal();
    const list = getColumnList();
    const selectAllToggle = getColumnAllToggle();
    const searchInput = getColumnSearchInput();
    const emptyMessage = getColumnEmptyMessage();

    if (!list || !dataTableInstance) {
      return;
    }

    list.innerHTML = '';

    const columnNames = columnsMeta.map((meta) => meta.name);

    columnsMeta.forEach((meta, index) => {
      const name = meta.name;
      const dataIndex = meta.dataIndex;
      const lowerName = String(name || '').toLowerCase();
      const wrapper = document.createElement('div');
      wrapper.className = 'form-check column-picker-item';
      wrapper.dataset.columnOption = 'true';
      wrapper.dataset.columnName = lowerName;

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.className = 'form-check-input me-2';
      input.id = 'clientes-column-' + index;
      input.dataset.columnIndex = String(dataIndex);
      input.dataset.columnNameOriginal = name;
      const visible = dataTableInstance.column(dataIndex).visible();
      input.checked = visible;

      const locked = isLockedColumn(name);
      if (locked) {
        input.disabled = true;
        input.checked = true;
      }
      columnVisibility.set(name, visible);

      const label = document.createElement('label');
      label.className = 'form-check-label w-100';
      label.setAttribute('for', 'clientes-column-' + index);

      const titleSpan = document.createElement('span');
      titleSpan.className = 'flex-grow-1 text-truncate';
      const displayName = humanizeColumnName(name);
      titleSpan.textContent = displayName;
      titleSpan.title = displayName;
      label.appendChild(titleSpan);

      if (locked) {
        const lockedBadge = document.createElement('span');
        lockedBadge.className = 'badge bg-secondary-subtle text-secondary fw-semibold';
        lockedBadge.textContent = 'Fijo';
        label.appendChild(lockedBadge);
      }

      wrapper.appendChild(input);
      wrapper.appendChild(label);
      list.appendChild(wrapper);
    });

    const applyAllState = () => {
      if (!selectAllToggle) {
        return;
      }
      const inputs = list.querySelectorAll('input[data-column-index]');
      const unlocked = Array.from(inputs).filter((input) => !isLockedColumn(input.dataset.columnNameOriginal));
      const allChecked = unlocked.every((input) => input.checked);
      selectAllToggle.checked = allChecked && unlocked.length > 0;
      selectAllToggle.indeterminate = !allChecked && unlocked.some((input) => input.checked);
    };

    const applyFilter = (query) => {
      const normalized = String(query || '').trim().toLowerCase();
      let visibleCount = 0;
      list.querySelectorAll('[data-column-option]').forEach((item) => {
        const matches = !normalized || String(item.dataset.columnName || '').includes(normalized);
        item.classList.toggle('d-none', !matches);
        if (matches) {
          visibleCount += 1;
        }
      });
      if (emptyMessage) {
        emptyMessage.classList.toggle('d-none', visibleCount !== 0);
      }
    };

    if (searchInput) {
      if (!searchInput.dataset.columnsSearchBound) {
        searchInput.addEventListener('input', (event) => {
          const handler = searchInput.__clientesApplyFilter;
          if (typeof handler === 'function') {
            handler(event.target.value || '');
          }
        });
        searchInput.dataset.columnsSearchBound = 'true';
      }
      searchInput.__clientesApplyFilter = applyFilter;
      searchInput.value = '';
      applyFilter('');
    } else if (emptyMessage) {
      emptyMessage.classList.add('d-none');
    }

    list.querySelectorAll('input[data-column-index]').forEach((input) => {
      input.addEventListener('change', (event) => {
        const index = Number(event.target.dataset.columnIndex);
        const columnName = event.target.dataset.columnNameOriginal || '';
        if (Number.isNaN(index) || isLockedColumn(columnName)) {
          return;
        }
        const visible = event.target.checked;
        columnVisibility.set(columnName, visible);
        if (dataTableInstance) {
          dataTableInstance.column(index).visible(visible);
        }
        applyAllState();
        saveTableState(columnNames);
      });
    });

    if (selectAllToggle) {
      if (selectAllToggle.__clientesHandler) {
        selectAllToggle.removeEventListener('change', selectAllToggle.__clientesHandler);
      }
      const handleChange = (event) => {
        const shouldCheck = event.target.checked;
        list.querySelectorAll('input[data-column-index]').forEach((input) => {
          const index = Number(input.dataset.columnIndex);
          const columnName = input.dataset.columnNameOriginal || '';
          if (isLockedColumn(columnName)) {
            return;
          }
          input.checked = shouldCheck;
          columnVisibility.set(columnName, shouldCheck);
          dataTableInstance.column(index).visible(shouldCheck);
        });
        applyAllState();
        saveTableState(columnNames);
      };
      selectAllToggle.__clientesHandler = handleChange;
      selectAllToggle.addEventListener('change', handleChange);
    }

    applyAllState();

    if (modal) {
      requestAnimationFrame(() => {
        window.lucide?.createIcons?.(modal);
      });
    }
  };
  const resetColumnControls = () => {
    const list = getColumnList();
    if (list) {
      list.innerHTML = '';
    }
    const emptyMessage = getColumnEmptyMessage();
    if (emptyMessage) {
      emptyMessage.classList.add('d-none');
    }
    const searchInput = getColumnSearchInput();
    if (searchInput) {
      searchInput.value = '';
      searchInput.__clientesApplyFilter = null;
    }
    const selectAllToggle = getColumnAllToggle();
    if (selectAllToggle) {
      selectAllToggle.checked = false;
      selectAllToggle.indeterminate = false;
    }
  };

  const collectFieldNames = (flattenedRecords) => {
    const seen = new Set();
    const names = [];
    flattenedRecords.forEach((fields) => {
      Object.keys(fields || {}).forEach((name) => {
        if (!seen.has(name) && !isHiddenColumn(name)) {
          seen.add(name);
          names.push(name);
        }
      });
    });
    return names;
  };

  const getPrimaryColumnsInOrder = (fieldNames) => {
    const used = new Set();
    const primary = [];
    PRIMARY_COLUMN_ALIASES.forEach((aliases) => {
      const match = fieldNames.find((name) => {
        const normalized = normalizeColumnName(name);
        return aliases.some((alias) => normalized === alias);
      });
      if (match && !used.has(match)) {
        primary.push(match);
        used.add(match);
      }
    });
    return { primary, used };
  };

  const getDefaultOrderedColumns = (fieldNames) => {
    if (!Array.isArray(fieldNames) || !fieldNames.length) {
      return [];
    }
    const { primary, used } = getPrimaryColumnsInOrder(fieldNames);
    const secondary = fieldNames.filter((name) => !used.has(name));
    return primary.length ? [...primary, ...secondary] : fieldNames.slice();
  };

  const isPrimaryColumnName = (name) => {
    const normalized = normalizeColumnName(name);
    return PRIMARY_COLUMN_ALIASES.some((aliases) => aliases.includes(normalized));
  };

  const resolveOrderedColumns = (fieldNames) => {
    if (!Array.isArray(fieldNames) || !fieldNames.length) {
      fieldOrder = [];
      return [];
    }
    const defaultOrder = getDefaultOrderedColumns(fieldNames);
    if (!fieldOrder.length) {
      fieldOrder = defaultOrder.slice();
      return fieldOrder.slice();
    }
    const available = new Set(fieldNames);
    const ordered = [];
    fieldOrder.forEach((name) => {
      if (available.delete(name)) {
        ordered.push(name);
      }
    });
    defaultOrder.forEach((name) => {
      if (available.delete(name)) {
        ordered.push(name);
      }
    });
    if (available.size) {
      ordered.push(...Array.from(available));
    }
    fieldOrder = ordered.slice();
    return ordered.slice();
  };

  const scheduleTableRender = () => {
    if (renderPending) {
      return;
    }
    renderPending = true;
    const renderCallback = () => {
      renderPending = false;
      const table = select(TABLE_SELECTOR);
      if (!table) {
        return;
      }
      const snapshot = Array.isArray(currentRecords) ? [...currentRecords] : [];
      renderTable(table, snapshot);
    };
    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(renderCallback);
    } else {
      setTimeout(renderCallback, 0);
    }
  };

  const applyColumnReorder = (fromIndex, toIndex, table) => {
    if (!Array.isArray(fieldOrder) || fieldOrder.length < 2) {
      return false;
    }
    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    const from = clamp(fromIndex, 0, fieldOrder.length - 1);
    let to = clamp(toIndex, 0, fieldOrder.length);
    if (to > from) {
      to -= 1;
    }
    if (to === from) {
      return false;
    }

    if (table) {
      if (dataTableInstance && typeof dataTableInstance.destroy === 'function') {
        if (typeof dataTableInstance.off === 'function') {
          dataTableInstance.off('.clientes-drag');
        }
        document.dispatchEvent(new CustomEvent('clientesTable:destroy', { detail: { instance: dataTableInstance } }));
        dataTableInstance.destroy();
        dataTableInstance = null;
      } else if (window.jQuery?.fn?.DataTable?.isDataTable?.(table)) {
        const existingInstance = window.jQuery(table).DataTable();
        if (typeof existingInstance?.off === 'function') {
          existingInstance.off('.clientes-drag');
        }
        document.dispatchEvent(new CustomEvent('clientesTable:destroy', { detail: { instance: existingInstance } }));
        existingInstance.destroy();
      }
    }

    const updated = fieldOrder.slice();
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    fieldOrder = updated;
    saveTableState(fieldOrder);
    scheduleTableRender();
    return true;
  };

  const formatCellValue = (value) => {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch (error) {
        return '[object]';
      }
    }
    return String(value);
  };

  const flattenRecordFields = (record) => {
    const aggregated = {};
    const ensureKey = (key) => {
      if (!aggregated[key]) {
        aggregated[key] = [];
      }
      return aggregated[key];
    };
    const appendValue = (key, rawValue, prefix = '') => {
      const bucket = ensureKey(key);
      const formatted = formatCellValue(rawValue);
      if (prefix) {
        const prefixValue = prefix.trim();
        if (formatted) {
          bucket.push(`${prefixValue ? `${prefixValue} ` : ''}${formatted}`);
        } else if (prefixValue) {
          bucket.push(prefixValue);
        } else {
          bucket.push(formatted);
        }
      } else {
        bucket.push(formatted);
      }
    };

    const fieldData = record?.fieldData ?? {};
    Object.entries(fieldData).forEach(([fieldName, value]) => {
      if (isHiddenColumn(fieldName)) {
        return;
      }
      appendValue(fieldName, value);
    });

    const portalData = record?.portalData ?? {};
    Object.entries(portalData).forEach(([portalName, rows]) => {
      if (!Array.isArray(rows)) {
        return;
      }
      const multipleRows = rows.length > 1;
      rows.forEach((portalRow, index) => {
        const rowFieldData = portalRow?.fieldData ?? {};
        const rowPrefix = multipleRows ? `[${index + 1}]` : '';
        Object.entries(rowFieldData).forEach(([fieldName, value]) => {
          const combinedName = `${portalName}::${fieldName}`;
          if (isHiddenColumn(combinedName)) {
            return;
          }
          appendValue(combinedName, value, rowPrefix);
        });
      });
    });

    return aggregated;
  };

  const joinFieldValues = (values, separator = ' · ') => {
    if (!Array.isArray(values) || !values.length) {
      return '';
    }
    return values
      .map((value) => (typeof value === 'string' ? value : formatCellValue(value)))
      .map((value) => value.trim())
      .filter((value) => value !== '')
      .join(separator);
  };

  const normalizeStatusValue = (value) => {
    const raw = String(value ?? '').trim();
    if (!raw) {
      return '';
    }
    return raw
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  };

  const getEstadoBadgeClasses = (value) => {
    const normalized = normalizeStatusValue(value);
    switch (normalized) {
      case 'contratado':
        return 'badge rounded-pill bg-success';
      case 'en bolsa':
      case 'enbolsa':
        return 'badge rounded-pill bg-warning text-dark';
      case 'finalizado':
        return 'badge rounded-pill bg-secondary';
      default:
        return 'badge rounded-pill bg-light text-body';
    }
  };

  const formatCellContent = (columnName, values) => {
    const normalizedColumn = normalizeColumnName(columnName);
    const list = Array.isArray(values) ? values : values == null ? [] : [values];
    const textValue = joinFieldValues(list);
    if (!textValue) {
      return '';
    }
    if (normalizedColumn === 'estado') {
      const badgeClasses = getEstadoBadgeClasses(textValue);
      return `<span class="${badgeClasses}">${escapeHtml(textValue)}</span>`;
    }
    return escapeHtml(textValue);
  };

  const setupColumnDragReorder = (table, orderedColumns) => {
    const thead = table.tHead;
    if (!thead || !thead.rows.length) {
      return;
    }
    const headerRow = thead.rows[0];
    const resolveFieldIndex = (cell) => {
      if (!cell) {
        return null;
      }
      const name = typeof cell.dataset.columnName === 'string' ? cell.dataset.columnName : '';
      const key = typeof cell.dataset.columnKey === 'string' ? cell.dataset.columnKey : '';
      if (name) {
        const directIndex = fieldOrder.indexOf(name);
        if (directIndex !== -1) {
          return directIndex;
        }
      }
      const normalizedCandidates = [];
      if (key) {
        normalizedCandidates.push(key);
      }
      if (name) {
        normalizedCandidates.push(normalizeColumnName(name));
      }
      if (normalizedCandidates.length) {
        for (let i = 0; i < fieldOrder.length; i += 1) {
          const normalized = normalizeColumnName(fieldOrder[i]);
          if (normalizedCandidates.includes(normalized)) {
            return i;
          }
        }
      }
      return null;
    };
    const isReorderableCell = (cell) => resolveFieldIndex(cell) !== null;
    const allHeaderCells = Array.from(headerRow.cells);
    const headerCells = allHeaderCells.filter(isReorderableCell);
    if (!Array.isArray(orderedColumns) || orderedColumns.length <= 1 || headerCells.length <= 1) {
      allHeaderCells.forEach((cell) => {
        cell.classList.remove('table-column--dragging', 'table-column--drop-target');
      });
      return;
    }

    // Limpiar todos los flags de drag bound para forzar revinculación
    allHeaderCells.forEach((cell) => {
      delete cell.dataset.columnDragBound;
    });

    const supportsPointer = typeof window !== 'undefined' && 'PointerEvent' in window;
    let suppressNextClick = false;
    let suppressResetTimer = null;
    const activeState = {
      pointerId: null,
      startIndex: null,
      startFieldIndex: null,
      dropIndex: null,
      headerCells: [],
      cleanup: null
    };

    const getCurrentHeaderCells = () => Array.from(headerRow.cells).filter(isReorderableCell);

    const clearIndicators = () => {
      activeState.headerCells.forEach((cell) => cell.classList.remove('table-column--drop-target'));
    };

    const applyDropIndicator = (candidateIndex) => {
      clearIndicators();
      if (candidateIndex == null) {
        return;
      }
      const cells = activeState.headerCells;
      if (!cells.length) {
        return;
      }
      const normalizedIndex = Math.min(Math.max(candidateIndex, 0), cells.length - 1);
      const noMovement =
        candidateIndex === activeState.startIndex ||
        (candidateIndex === activeState.startIndex + 1 && candidateIndex >= cells.length);
      if (!noMovement && cells[normalizedIndex]) {
        cells[normalizedIndex].classList.add('table-column--drop-target');
      }
    };

    const computeCandidateIndex = (clientX, clientY) => {
      const cells = activeState.headerCells;
      if (!cells.length) {
        return null;
      }
      const rowRect = headerRow.getBoundingClientRect();
      const targetY = typeof clientY === 'number' && !Number.isNaN(clientY)
        ? clientY
        : rowRect.top + rowRect.height / 2;
      let element = null;
      try {
        element = document.elementFromPoint(clientX, targetY);
      } catch (_) {
        element = null;
      }
      if (element) {
        const targetCell = element.closest('th');
        if (targetCell && headerRow.contains(targetCell)) {
          const index = cells.indexOf(targetCell);
          if (index >= 0) {
            const rect = targetCell.getBoundingClientRect();
            const before = clientX < rect.left + rect.width / 2;
            return before ? index : index + 1;
          }
        }
      }
      if (clientX <= rowRect.left) {
        return 0;
      }
      if (clientX >= rowRect.right) {
        return cells.length;
      }
      return null;
    };

    const finishDrag = (shouldApply) => {
      if (typeof activeState.cleanup === 'function') {
        activeState.cleanup();
      }
      clearIndicators();
      activeState.headerCells.forEach((cell) => cell.classList.remove('table-column--dragging'));
      if (document.body) {
        document.body.classList.remove('user-select-none');
      }
      let performedMove = false;
      const resolveTargetFieldIndex = (index) => {
        if (index == null) {
          return null;
        }
        if (index >= activeState.headerCells.length) {
          return fieldOrder.length;
        }
        return resolveFieldIndex(activeState.headerCells[index]);
      };
      if (
        shouldApply &&
        activeState.startIndex != null &&
        activeState.dropIndex != null &&
        Number.isFinite(activeState.startIndex) &&
        Number.isFinite(activeState.dropIndex)
      ) {
        let targetIndex = activeState.dropIndex;
        const totalColumns = Array.isArray(activeState.headerCells) ? activeState.headerCells.length : 0;
        const isSamePosition =
          targetIndex === activeState.startIndex ||
          targetIndex === activeState.startIndex + 1;
        if (isSamePosition) {
          targetIndex = null;
        }
        if (targetIndex != null) {
          targetIndex = Math.min(Math.max(targetIndex, 0), totalColumns);
          const fromFieldIndex = activeState.startFieldIndex;
          const targetFieldIndex = resolveTargetFieldIndex(targetIndex);
          if (fromFieldIndex != null && targetFieldIndex != null) {
            performedMove = applyColumnReorder(fromFieldIndex, targetFieldIndex, table);
          }
        }
      }
      if (performedMove) {
        suppressNextClick = true;
        if (suppressResetTimer !== null) {
          clearTimeout(suppressResetTimer);
        }
        suppressResetTimer = setTimeout(() => {
          suppressNextClick = false;
          suppressResetTimer = null;
        }, 0);
        activeState.dropIndex = null;
      } else {
        suppressNextClick = false;
        if (suppressResetTimer !== null) {
          clearTimeout(suppressResetTimer);
          suppressResetTimer = null;
        }
      }
      activeState.pointerId = null;
      activeState.startIndex = null;
      activeState.startFieldIndex = null;
      activeState.dropIndex = null;
      activeState.headerCells = [];
      activeState.cleanup = null;
    };

    const bindPointerHandlers = (cell, index) => {
      const handlePointerMove = (event) => {
        if (activeState.pointerId !== event.pointerId) {
          return;
        }
        const candidateIndex = computeCandidateIndex(event.clientX, event.clientY);
        activeState.dropIndex = candidateIndex;
        applyDropIndicator(candidateIndex);
      };

      const handlePointerUp = (event) => {
        if (activeState.pointerId !== event.pointerId) {
          return;
        }
        finishDrag(true);
      };

      const handlePointerCancel = (event) => {
        if (activeState.pointerId !== event.pointerId) {
          return;
        }
        finishDrag(false);
      };

      const handlePointerDown = (event) => {
        if (event.button !== 0) {
          return;
        }
        if (activeState.pointerId !== null) {
          return;
        }
        const cells = getCurrentHeaderCells();
        if (cells.length <= 1) {
          return;
        }
        const fieldIndex = resolveFieldIndex(cell);
        if (fieldIndex == null) {
          return;
        }
        const headerIndex = cells.indexOf(cell);
        if (headerIndex === -1) {
          return;
        }
        activeState.pointerId = event.pointerId;
        activeState.startIndex = headerIndex;
        activeState.startFieldIndex = fieldIndex;
        activeState.dropIndex = activeState.startIndex;
        activeState.headerCells = cells;
        cells.forEach((headerCell) => headerCell.classList.remove('table-column--dragging', 'table-column--drop-target'));
        if (cells[headerIndex]) {
          cells[headerIndex].classList.add('table-column--dragging');
        }
        if (document.body) {
          document.body.classList.add('user-select-none');
        }
        document.addEventListener('pointermove', handlePointerMove);
        document.addEventListener('pointerup', handlePointerUp);
        document.addEventListener('pointercancel', handlePointerCancel);
        activeState.cleanup = () => {
          document.removeEventListener('pointermove', handlePointerMove);
          document.removeEventListener('pointerup', handlePointerUp);
          document.removeEventListener('pointercancel', handlePointerCancel);
        };
      };

      cell.addEventListener('pointerdown', handlePointerDown);
      cell.addEventListener('click', (event) => {
        if (suppressNextClick) {
          event.preventDefault();
          event.stopPropagation();
          suppressNextClick = false;
        }
      });
    };

    const bindMouseHandlers = (cell, index) => {
      const handleMouseMove = (event) => {
        if (!activeState.headerCells.length) {
          return;
        }
        const candidateIndex = computeCandidateIndex(event.clientX, event.clientY);
        activeState.dropIndex = candidateIndex;
        applyDropIndicator(candidateIndex);
      };

      const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        finishDrag(true);
      };

      const handleMouseDown = (event) => {
        if (event.button !== 0) {
          return;
        }
        if (activeState.headerCells.length) {
          return;
        }
        const cells = getCurrentHeaderCells();
        if (cells.length <= 1) {
          return;
        }
        const fieldIndex = resolveFieldIndex(cell);
        if (fieldIndex == null) {
          return;
        }
        const headerIndex = cells.indexOf(cell);
        if (headerIndex === -1) {
          return;
        }
        activeState.startIndex = headerIndex;
        activeState.startFieldIndex = fieldIndex;
        activeState.dropIndex = activeState.startIndex;
        activeState.headerCells = cells;
        cells.forEach((headerCell) => headerCell.classList.remove('table-column--dragging', 'table-column--drop-target'));
        if (activeState.startIndex >= 0 && cells[activeState.startIndex]) {
          cells[activeState.startIndex].classList.add('table-column--dragging');
        }
        if (document.body) {
          document.body.classList.add('user-select-none');
        }
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        activeState.cleanup = () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
        };
      };

      cell.addEventListener('mousedown', handleMouseDown);
      cell.addEventListener('click', (event) => {
        if (suppressNextClick) {
          event.preventDefault();
          event.stopPropagation();
          suppressNextClick = false;
        }
      });
    };

    headerCells.forEach((cell, index) => {
      cell.setAttribute('draggable', 'false');
      if (supportsPointer) {
        bindPointerHandlers(cell, index);
      } else {
        bindMouseHandlers(cell, index);
      }
      cell.dataset.columnDragBound = 'true';
    });
  };

  const renderTable = (table, records) => {
    clearPlaceholders(table);

    const sourceRecords = Array.isArray(records) ? records : [];
    recordsByKey = new Map();
    const preparedRecords = [];

    sourceRecords.forEach((record) => {
      const key = getRecordPrimaryKey(record);
      if (!key) {
        return;
      }
      recordsByKey.set(key, record);
      preparedRecords.push({
        record,
        key,
        flattened: flattenRecordFields(record)
      });
    });

    currentRecords = preparedRecords.map(({ record }) => record);
    shareCurrentRecords();

    if (selectedRecordKey && !recordsByKey.has(selectedRecordKey)) {
      selectedRecordKey = null;
    }

    if (!preparedRecords.length) {
      fieldOrder = [];
      if (selectedRecordKey !== null) {
        selectedRecordKey = null;
      }
      dispatchSelectionChange();
      resetColumnControls();
      if (dataTableInstance) {
        document.dispatchEvent(new CustomEvent('clientesTable:destroy', { detail: { instance: dataTableInstance } }));
        dataTableInstance.destroy();
        dataTableInstance = null;
      }
      const thead = table.tHead ?? table.createTHead();
      thead.innerHTML = '<tr><th>Mensaje</th></tr>';
      const tbody = table.tBodies[0] ?? table.createTBody();
      tbody.innerHTML = '<tr><td class="text-secondary">No se encontraron clientes.</td></tr>';
      document.dispatchEvent(new CustomEvent('clientesTable:destroy'));
      lastColumnMeta = [];
      pendingOrderState = null;
      updateExportButtonState();
      return;
    }

    const fieldNames = collectFieldNames(preparedRecords.map(({ flattened }) => flattened));
    const orderedColumns = resolveOrderedColumns(fieldNames);
    const hasDefaultVisibleColumns = orderedColumns.some((name) => DEFAULT_VISIBLE_COLUMN_KEYS.has(normalizeColumnName(name)));
    defaultVisibilityFallbackAll = !orderedColumns.length || !hasDefaultVisibleColumns;

    const buildColumnMeta = () => {
      if (!orderedColumns.length) {
        const fallbackKey = normalizeColumnName('Información') || 'informacion';
        return [
          {
            name: 'Información',
            key: fallbackKey,
            classes: ['table-column', 'table-column--primary'],
            synthetic: true,
            isAction: false,
            draggable: true
          }
        ];
      }
      const meta = orderedColumns.map((name, index) => {
        const key = normalizeColumnName(name) || `column-${index}`;
        const isPrimary = isPrimaryColumnName(name);
        const classes = ['table-column', isPrimary ? 'table-column--primary' : 'table-column--secondary'];
        if (index >= 3) {
          classes.push('table-column--collapse-md');
        }
        if (index >= 2) {
          classes.push('table-column--collapse-sm');
        }
        return {
          name,
          displayName: humanizeColumnName(name),
          key,
          classes,
          synthetic: false,
          isAction: false,
          draggable: true
        };
      });
      return meta;
    };

    const columnMeta = buildColumnMeta().map((meta, index) => ({
      ...meta,
      dataIndex: index
    }));
    const dataColumnMeta = columnMeta.filter((meta) => !meta.isAction);
    const hasActionColumn = columnMeta.some((meta) => meta.isAction);
    lastColumnMeta = columnMeta.map((meta) => ({
      name: meta.name,
      displayName: meta.displayName || meta.name,
      key: meta.key,
      synthetic: Boolean(meta.synthetic),
      isAction: Boolean(meta.isAction),
      dataIndex: meta.dataIndex
    }));

    // PRIMERO: Destruir DataTables existente ANTES de construir el HTML
    if (window.jQuery?.fn?.DataTable) {
      const $table = window.jQuery(table);
      $table.off();  // Eliminar TODOS los event listeners
      unbindTableSearchInput();

      if (dataTableInstance) {
        debugLog('🧹 renderTable: Limpiando DataTables existente...');

        // Limpiar búsqueda
        if (typeof dataTableInstance.search === 'function') {
          dataTableInstance.search('');
          debugLog('✅ renderTable: Búsqueda limpiada');
        }

        // Limpiar datos internos
        if (typeof dataTableInstance.clear === 'function') {
          dataTableInstance.clear();
          debugLog('✅ renderTable: Datos limpiados');
        }

        // Despachar evento
        document.dispatchEvent(new CustomEvent('clientesTable:destroy', { detail: { instance: dataTableInstance } }));

        // Destruir completamente
        dataTableInstance.destroy();  // Sin parámetro true para no borrar el HTML
        debugLog('✅ renderTable: DataTables destruido');
        dataTableInstance = null;

      } else if (window.jQuery.fn.DataTable.isDataTable(table)) {
        debugLog('🧹 renderTable: Limpiando DataTables existente (jQuery)...');
        const existingInstance = $table.DataTable();

        if (typeof existingInstance.search === 'function') {
          existingInstance.search('');
        }
        if (typeof existingInstance.clear === 'function') {
          existingInstance.clear();
        }

        document.dispatchEvent(new CustomEvent('clientesTable:destroy', { detail: { instance: existingInstance } }));
        existingInstance.destroy();
        debugLog('✅ renderTable: DataTables destruido (jQuery)');
      }

      // Limpiar caché global de DataTables
      if (window.jQuery.fn.DataTable.settings) {
        const settingsBefore = window.jQuery.fn.DataTable.settings.length;
        window.jQuery.fn.DataTable.settings.length = 0;
        debugLog(`✅ renderTable: Caché de DataTables limpiada (${settingsBefore} → 0)`);
      }
    }

    // SEGUNDO: Construir el HTML DESPUÉS de destruir DataTables
    const thead = table.tHead ?? table.createTHead();
    thead.innerHTML = '';
    const headerRow = thead.insertRow();
    columnMeta.forEach((meta, index) => {
      const th = document.createElement('th');
      th.textContent = meta.displayName || meta.name;
      th.dataset.columnDragBound = 'false';
      th.dataset.columnKey = meta.key;
      th.dataset.columnName = meta.name;
      th.dataset.columnDisplayName = meta.displayName || meta.name;
      th.dataset.columnIndex = String(index);
      if (meta.isAction) {
        th.dataset.orderable = 'false';
        th.classList.add('sorting_disabled');
      }
      meta.classes.forEach((cls) => th.classList.add(cls));
      headerRow.appendChild(th);
    });

    const tbody = table.tBodies[0] ?? table.createTBody();
    tbody.innerHTML = '';
    debugLog(`🏗️ renderTable: Construyendo ${preparedRecords.length} filas en tbody...`);
    preparedRecords.forEach(({ record, flattened, key }) => {
      const row = tbody.insertRow();
      const cellContents = columnMeta.map((meta) => {
        if (meta.synthetic) {
          return '';
        }
        return formatCellContent(meta.name, flattened?.[meta.name]);
      });
      cellContents.forEach((html, index) => {
        const cell = row.insertCell();
        cell.innerHTML = html;
        cell.dataset.originalContent = html;
        const meta = columnMeta[index];
        if (meta) {
          cell.dataset.columnKey = meta.key;
          meta.classes.forEach((cls) => cell.classList.add(cls));
        }
      });
      row.dataset.recordKey = key;
      if (record.recordId !== undefined && record.recordId !== null) {
        row.dataset.recordId = String(record.recordId);
      } else {
        delete row.dataset.recordId;
      }
    });
    debugLog(`✅ renderTable: tbody construido con ${tbody.rows.length} filas`);
    window.lucide?.createIcons?.();

    // Verificar que la tabla todavía existe en el DOM
    const tableCheckAfterBuild = document.getElementById('clientesTable');
    debugLog(`🔍 renderTable: ¿Tabla existe en DOM después de construir HTML?`, tableCheckAfterBuild ? 'SÍ' : 'NO');
    if (!tableCheckAfterBuild) {
      console.error('❌ renderTable: ¡LA TABLA NO EXISTE EN EL DOM! Abortando...');
      return;
    }

    // TERCERO: Crear nueva instancia de DataTables
    if (window.jQuery?.fn?.DataTable) {
      const $table = window.jQuery(table);
      const dataTableOptions = {
        destroy: true,
        paging: false,
        info: true,
        layout: {
          topStart: null,
          topEnd: null,
          bottomStart: 'info',
          bottomEnd: null
        },
        language: {
          search: '',
          info: 'Mostrando _TOTAL_ registros',
          infoEmpty: 'Mostrando 0 registros',
          infoFiltered: '(filtrado de _MAX_ totales)',
          paginate: {
            previous: 'Anterior',
            next: 'Siguiente'
          }
        }
      };
      if (hasActionColumn) {
        dataTableOptions.columnDefs = [
          { targets: 0, orderable: false, searchable: false }
        ];
      }
      dataTableInstance = $table.DataTable(dataTableOptions);

      debugLog('✅ renderTable: Nueva instancia de DataTables creada');
      debugLog(`📊 renderTable: Nueva instancia tiene ${dataTableInstance.data().count()} registros`);
      debugLog(`📊 renderTable: tbody ahora tiene ${table.tBodies[0]?.rows.length || 0} filas`);

      // Verificar que la tabla todavía existe después de crear DataTables
      const tableCheckAfterDT = document.getElementById('clientesTable');
      debugLog(`🔍 renderTable: ¿Tabla existe en DOM después de crear DataTables?`, tableCheckAfterDT ? 'SÍ' : 'NO');

      bindTableSearchInput();
      applyPendingOrderState();
      bindRowSelection($table, table);
      if (!selectedRecordKey) {
        restoreProcessSelection();
      }
      // NO seleccionar automáticamente la primera fila al cargar
      // if (!selectedRecordKey) {
      //   const firstRow = table.tBodies[0]?.rows?.[0] ?? null;
      //   if (firstRow?.dataset.recordKey) {
      //     selectedRecordKey = firstRow.dataset.recordKey;
      //   }
      // }
      if (selectedRecordKey) {
        applySelectionHighlight(table);
        scrollSelectedRowIntoView(table);
      }
      const rebindDragHandles = () => {
        const headerCells = Array.from(table.tHead?.rows?.[0]?.cells ?? []);
        const headerNames = headerCells.map((cell) => cell?.textContent ?? '');
        setupColumnDragReorder(table, headerNames.length ? headerNames : orderedColumns);
      };
      if (typeof dataTableInstance.on === 'function') {
        dataTableInstance.off('.clientes-drag');
        dataTableInstance.on('draw.dt.clientes-drag', () => {
          rebindDragHandles();
        });
        dataTableInstance.on('column-visibility.dt.clientes-drag', () => {
          rebindDragHandles();
        });
        dataTableInstance.off('.clientes-highlight');
        dataTableInstance.on('draw.dt.clientes-highlight column-visibility.dt.clientes-highlight', () => {
          applyTableSearchHighlights();
        });
        dataTableInstance.off('.clientes-export');
        dataTableInstance.on('draw.dt.clientes-export column-visibility.dt.clientes-export', () => {
          updateExportButtonState();
        });
        dataTableInstance.off('.clientes-icons');
        dataTableInstance.on('draw.dt.clientes-icons column-visibility.dt.clientes-icons', () => {
          window.lucide?.createIcons?.();
        });
      }
      if (orderedColumns.length) {
        applySavedVisibility(dataColumnMeta);
        bindColumnControls(dataColumnMeta);
      } else {
        resetColumnControls();
      }
      rebindDragHandles();
      applyTableSearchHighlights();
      updateExportButtonState();
      document.dispatchEvent(new CustomEvent('clientesTable:ready', { detail: { instance: dataTableInstance } }));
      document.dispatchEvent(new CustomEvent('clientesTable:draw', { detail: { instance: dataTableInstance } }));
    }

    setupColumnDragReorder(table, orderedColumns);
    dispatchSelectionChange();
  };

  const getCurrentTableState = () => {
    if (!Array.isArray(lastColumnMeta) || !lastColumnMeta.length) {
      return null;
    }
    const columns = [];
    lastColumnMeta.forEach((meta) => {
      if (meta.isAction) {
        return;
      }
      const dataIndex = meta.dataIndex;
      const visible = dataTableInstance ? dataTableInstance.column(dataIndex).visible() : true;
      columns.push({
        name: meta.name,
        key: meta.key,
        visible
      });
    });
    const order = [];
    if (dataTableInstance) {
      const currentOrder = dataTableInstance.order();
      if (Array.isArray(currentOrder)) {
        currentOrder.forEach((entry) => {
          if (!Array.isArray(entry) || entry.length < 2) {
            return;
          }
          const [columnIndex, direction] = entry;
          const meta = lastColumnMeta.find((item) => item.dataIndex === columnIndex);
          if (!meta) {
            return;
          }
          if (meta.isAction) {
            return;
          }
          order.push({
            name: meta.name,
            key: meta.key,
            dir: direction === 'desc' ? 'desc' : 'asc'
          });
        });
      }
    }
    return {
      fieldOrder: Array.isArray(fieldOrder) ? [...fieldOrder] : [],
      columns,
      order
    };
  };

  const applyTableState = (state = {}) => {
    if (!state || typeof state !== 'object') {
      return;
    }
    let structureChanged = false;

    const sanitizeNameList = (list) => {
      if (!Array.isArray(list)) {
        return [];
      }
      return Array.from(new Set(
        list
          .map((value) => (typeof value === 'string' ? value.trim() : ''))
          .filter((value) => value)
      ));
    };

    const sanitizedColumns = Array.isArray(state.columns)
      ? state.columns
          .map((column) => ({
            name: typeof column?.name === 'string' ? column.name.trim() : '',
            key: typeof column?.key === 'string' ? column.key.trim() : '',
            visible: column?.visible !== false
          }))
          .filter((column) => column.name)
      : [];

    if (sanitizedColumns.length) {
      const orderedNames = sanitizeNameList(sanitizedColumns.map((column) => column.name));
      if (orderedNames.length) {
        fieldOrder = orderedNames.slice();
        structureChanged = true;
      }
      sanitizedColumns.forEach((column) => {
        columnVisibility.set(column.name, column.visible);
      });
      structureChanged = true;
    } else {
      const sanitizedFieldOrder = sanitizeNameList(state.fieldOrder);
      if (sanitizedFieldOrder.length) {
        fieldOrder = sanitizedFieldOrder;
        structureChanged = true;
      }
    }

    if (state.visibility && typeof state.visibility === 'object') {
      Object.entries(state.visibility).forEach(([name, visible]) => {
        if (typeof name === 'string' && name.trim()) {
          columnVisibility.set(name.trim(), Boolean(visible));
          structureChanged = true;
        }
      });
    }

    if (structureChanged) {
      saveTableState();
      scheduleTableRender();
    }

    if (Array.isArray(state.order) && state.order.length) {
      pendingOrderState = state.order
        .map((descriptor) => {
          if (!descriptor || typeof descriptor !== 'object') {
            return null;
          }
          const name = typeof descriptor.name === 'string' ? descriptor.name.trim() : '';
          const key = typeof descriptor.key === 'string' ? descriptor.key.trim() : '';
          const dir = descriptor.dir === 'desc' ? 'desc' : 'asc';
          if (!name && !key) {
            return null;
          }
          return { name, key, dir };
        })
        .filter(Boolean);
      if (!structureChanged && dataTableInstance) {
        applyPendingOrderState();
      }
    } else {
      pendingOrderState = null;
    }
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

  const normalizeRecordsPayload = (payload) => {
    const metadata = { source: 'unknown', error: null };
    const buildResult = (records) => ({ records, metadata });

    if (!payload || typeof payload !== 'object') {
      return buildResult([]);
    }

    if (payload.scriptResult) {
      metadata.source = 'script';
      const { code, resultParameter } = payload.scriptResult;
      if (typeof code === 'number' && code !== 0) {
        metadata.error = `El script devolvió el código ${code}.`;
        return buildResult([]);
      }

      let rawArray = [];
      if (Array.isArray(resultParameter)) {
        rawArray = resultParameter;
      } else if (typeof resultParameter === 'string') {
        const trimmed = resultParameter.trim();
        if (trimmed) {
          try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
              rawArray = parsed;
            } else {
              metadata.error = 'El script no devolvió una lista de registros válida.';
              return buildResult([]);
            }
          } catch (error) {
            const detail = error && error.message ? ` Detalle: ${error.message}` : '';
            metadata.error = `No se pudo interpretar la respuesta del script.${detail}`;
            return buildResult([]);
          }
        }
      }

      const records = rawArray
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

  const fetchClientes = async () => {
    if (typeof window.FileMakerConductores?.listar === 'function') {
      debugLog('🔍 fetchClientes: Solicitando datos a través de FileMakerConductores.listar...');
      const records = await window.FileMakerConductores.listar();
      const lastScript = window.FileMakerConductores?.lastUsedScript ?? 'desconocido';
      const lastLayout = window.FileMakerConductores?.lastUsedLayout ?? 'sin contexto';
      const scriptCandidates = window.FileMakerConductores?.scriptCandidates ?? [];
      const layoutCandidates = window.FileMakerConductores?.layoutCandidates ?? [];
      debugLog(`🧾 fetchClientes: Script utilizado -> ${lastScript}`);
      debugLog(`🧾 fetchClientes: Layout en contexto -> ${lastLayout}`);
      if (scriptCandidates.length) {
        debugLog('🧾 fetchClientes: Scripts candidatos configurados:', scriptCandidates);
      }
      if (layoutCandidates.length) {
        debugLog('🧾 fetchClientes: Layouts candidatos configurados:', layoutCandidates);
      }
      debugLog(`📊 fetchClientes: FileMaker devolvió ${records.length} registros`);
      debugLog('📋 fetchClientes: RecordIds devueltos:', records.map(r => r.recordId));
      return records;
    }

    if (!window.ApiClient?.post) {
      throw new Error('ApiClient no esta disponible.');
    }

    const fallbackScriptName = (window.FileMakerConductores?.scriptCandidates?.[0]
      || window.FILEMAKER_SCRIPT_NAMES?.conductoresListar
      || 'conductor.Listar');

    if (window.ApiClient?.runScript) {
      debugLog(`🔍 fetchClientes: Ejecutando script directo mediante ApiClient.runScript -> ${fallbackScriptName}`);
      const response = await window.ApiClient.runScript(fallbackScriptName, { 'script.param': '' });
      if (!response.ok) {
        const detail = `${response.status} ${response.statusText}`.trim();
        throw new Error(`No se pudieron obtener los clientes (${detail}).`);
      }
      let payload = {};
      if (response.status !== 204) {
        try {
          payload = await response.json();
        } catch (error) {
          debugWarn('No se pudo interpretar la respuesta JSON del script ejecutado directamente.', error);
          payload = {};
        }
      }
      window.FileMakerConductores = window.FileMakerConductores || {};
      window.FileMakerConductores.lastUsedScript = `${fallbackScriptName} (fallback)`;
      window.FileMakerConductores.lastUsedLayout = null;
      const { records, metadata } = normalizeRecordsPayload(payload);
      if (metadata.error) {
        throw new Error(metadata.error);
      }
      debugLog(`📊 fetchClientes: FileMaker devolvió ${records.length} registros`);
      debugLog('📋 fetchClientes: RecordIds devueltos:', records.map(r => r.recordId));
      return records;
    }

    const encodedFallback = window.ApiClient?.encodePathSegment
      ? window.ApiClient.encodePathSegment(fallbackScriptName)
      : encodeURIComponent(fallbackScriptName);
    const scriptPath = `scripts/${encodedFallback}`;
    debugLog(`🔍 fetchClientes: Ejecutando ${scriptPath} en FileMaker Data API (ruta directa sin runScript)...`);
    const response = await window.ApiClient.post(scriptPath, {
      'script.param': '',
    });
    if (!response.ok) {
      const detail = `${response.status} ${response.statusText}`.trim();
      throw new Error(`No se pudieron obtener los clientes (${detail}).`);
    }
  const payload = await response.json();
  window.FileMakerConductores = window.FileMakerConductores || {};
  window.FileMakerConductores.lastUsedScript = `${fallbackScriptName} (ruta directa)`;
  window.FileMakerConductores.lastUsedLayout = null;
    const { records, metadata } = normalizeRecordsPayload(payload);
    if (metadata.error) {
      throw new Error(metadata.error);
    }
    debugLog(`📊 fetchClientes: FileMaker devolvió ${records.length} registros`);
    debugLog('📋 fetchClientes: RecordIds devueltos:', records.map(r => r.recordId));
    return records;
  };

  const loadClientes = async () => {
    const table = select(TABLE_SELECTOR);
    if (!table) {
      return;
    }
    setExportButtonEnabled(false);
    toggleSpinner(true);
    setStatus('Cargando clientes...');
    try {
      const records = await fetchClientes();
      debugLog(`✅ loadClientes: Renderizando ${records.length} registros en la tabla`);
      renderTable(table, records);

      // Verificar cuántas filas se renderizaron realmente
      const tbody = table.tBodies[0];
      const rowCount = tbody ? tbody.rows.length : 0;
      debugLog(`📊 loadClientes: Verificación HTML - tbody tiene ${rowCount} filas`);
      debugLog(`📊 loadClientes: dataTableInstance:`, dataTableInstance);

      if (dataTableInstance) {
        debugLog(`📊 loadClientes: DataTables.data().count():`, dataTableInstance.data().count());
      }

      setStatus(records.length ? '' : 'No se encontraron clientes.');
    } catch (error) {
      console.error(error);
      setStatus(error.message || 'Error al cargar los clientes.');
    } finally {
      toggleSpinner(false);
    }
  };

  const selectByRecordId = (recordId) => {
    if (!recordId) {
      return false;
    }

    debugLog(`🔍 selectByRecordId: Buscando conductor con recordId: ${recordId}`);
    debugLog(`📊 selectByRecordId: Hay ${recordsByKey.size} registros en recordsByKey`);
    debugLog('📋 selectByRecordId: RecordIds disponibles:', Array.from(recordsByKey.values()).map(r => r.recordId));

    // Buscar el registro con el recordId especificado
    let foundRecord = null;
    for (const [key, record] of recordsByKey.entries()) {
      if (record.recordId === recordId) {
        selectedRecordKey = key;
        foundRecord = record;
        debugLog(`✅ selectByRecordId: ¡Encontrado! Key: ${key}`);
        break;
      }
    }

    if (!foundRecord) {
      console.error(`❌ selectByRecordId: NO se encontró el registro con recordId: ${recordId}`);
      return false;
    }

    // Obtener referencia a la tabla
    const table = select(TABLE_SELECTOR);
    if (!table) {
      console.error(`❌ selectByRecordId: No se encontró la tabla con selector: ${TABLE_SELECTOR}`);
      return false;
    }

    const tbody = table.tBodies[0];
    const rowCount = tbody ? tbody.rows.length : 0;
    debugLog(`📊 selectByRecordId: La tabla tiene ${rowCount} filas en tbody`);

    // Actualizar la UI para mostrar la selección
    dispatchSelectionChange();
    applySelectionHighlight(table);

    // Verificar si se aplicó el highlight
    const highlightedRows = tbody ? Array.from(tbody.rows).filter(r => r.classList.contains('table-active')) : [];
    debugLog(`📊 selectByRecordId: ${highlightedRows.length} filas con clase 'table-active'`);

    scrollSelectedRowIntoView(table);

    debugLog(`✅ selectByRecordId: Retornando true`);
    return true;
  };

  window.ClientesTable = window.ClientesTable || {};
  window.ClientesTable.getState = getCurrentTableState;
  window.ClientesTable.applyState = applyTableState;
  window.ClientesTable.selectByRecordId = selectByRecordId;
  window.ClientesTable.reload = loadClientes;

  debugLog('✅ clientes-table.js: Funciones exportadas a window.ClientesTable');
  debugLog('🔧 window.ClientesTable.reload:', window.ClientesTable.reload);
  debugLog('🔧 typeof loadClientes:', typeof loadClientes);

  window.ClientesProcessSelection = window.ClientesProcessSelection || {};
  Object.assign(window.ClientesProcessSelection, {
    save: saveProcessSelection,
    load: loadProcessSelection,
    clear: clearProcessSelection
  });

  document.addEventListener('clientesTable:ready', updateExportButtonState);
  document.addEventListener('clientesTable:draw', updateExportButtonState);
  document.addEventListener('clientesTable:destroy', () => {
    setExportButtonEnabled(false);
  });

  ready(() => {
    bindExportButton();
    updateExportButtonState();
    loadClientes();
  });
})();
