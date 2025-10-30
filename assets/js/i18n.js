(() => {
  const STORAGE_KEY = 'ignite:lang';
  const DEFAULT_LANG = 'es';
  const SUPPORTED_LANGS = ['es', 'en'];
  const LANGUAGE_FLAGS = {
    es: 'assets/images/flags/es.svg',
    en: 'assets/images/flags/us.svg',
  };

  const cache = {};
  let currentLang = DEFAULT_LANG;
  let isApplying = false;

  const resolveLang = (lang) => {
    if (lang && SUPPORTED_LANGS.includes(lang)) {
      return lang;
    }
    if (lang && typeof lang === 'string') {
      const short = lang.slice(0, 2).toLowerCase();
      if (SUPPORTED_LANGS.includes(short)) {
        return short;
      }
    }
    return DEFAULT_LANG;
  };

  const loadDictionary = async (lang) => {
    if (cache[lang]) {
      return cache[lang];
    }
    try {
      const response = await fetch(`./assets/i18n/${lang}.json`, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Unable to load locale ${lang}`);
      }
      const dict = await response.json();
      cache[lang] = dict;
      return dict;
    } catch (error) {
      console.error('[i18n] Error loading dictionary:', error);
      cache[lang] = {};
      return cache[lang];
    }
  };

  const interpolate = (template, vars = {}) => {
    if (typeof template !== 'string') {
      return template;
    }
    return template.replace(/\{\{(\w+?)\}\}/g, (_, key) => {
      return key in vars ? vars[key] : `{{${key}}}`;
    });
  };

  const applyTranslations = (dict) => {
    if (!dict) {
      return;
    }
    isApplying = true;
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach((element) => {
      const key = element.getAttribute('data-i18n');
      if (key && key in dict) {
        element.textContent = dict[key];
      }
    });

    const allElements = document.querySelectorAll('[data-i18n-attr], [data-i18n-placeholder], [data-i18n-title], [data-i18n-html]');
    allElements.forEach((element) => {
      element.getAttributeNames().forEach((name) => {
        if (!name.startsWith('data-i18n-') || name === 'data-i18n') {
          return;
        }
        const attr = name.replace('data-i18n-', '');
        const key = element.getAttribute(name);
        if (!key) {
          return;
        }
        const translation = dict[key];
        if (translation === undefined) {
          return;
        }
        if (attr === 'html') {
          element.innerHTML = translation;
        } else if (attr === 'text') {
          element.textContent = translation;
        } else {
          element.setAttribute(attr, translation);
        }
      });
    });

    updateLanguageIndicators();
    isApplying = false;
  };

  const updateLanguageIndicators = () => {
    document.documentElement.setAttribute('lang', currentLang);

    const flagSrc = LANGUAGE_FLAGS[currentLang];
    const langLabel = t(`language.name.${currentLang}`, currentLang.toUpperCase());
    if (flagSrc) {
      document.querySelectorAll('[data-lang-flag]').forEach((img) => {
        img.setAttribute('src', flagSrc);
        img.setAttribute('title', langLabel);
        img.setAttribute('alt', langLabel);
      });
    }

    document.querySelectorAll('[data-lang-option]').forEach((el) => {
      const lang = el.getAttribute('data-lang-option');
      const isActive = lang === currentLang;
      el.classList.toggle('active', isActive);
      el.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    const currentLabel = document.querySelector('[data-lang-current]');
    if (currentLabel) {
      currentLabel.textContent = t('navbar.language.display', currentLabel.textContent);
    }
  };

  const t = (key, fallback = '', vars = {}) => {
    const dictionary = cache[currentLang] || {};
    const template = dictionary[key] ?? fallback ?? key ?? '';
    return interpolate(template, vars);
  };

  const setLanguage = async (lang, options = {}) => {
    const targetLang = resolveLang(lang);
    currentLang = targetLang;

    const dict = await loadDictionary(targetLang);
    applyTranslations(dict);

    if (!options.silent) {
      document.dispatchEvent(new CustomEvent('i18n:changed', { detail: { lang: targetLang } }));
    }

    if (options.persist !== false) {
      localStorage.setItem(STORAGE_KEY, targetLang);
    }
  };

  const setupLanguageSwitcher = () => {
    document.querySelectorAll('[data-lang]').forEach((element) => {
      element.addEventListener('click', (event) => {
        event.preventDefault();
        const lang = element.getAttribute('data-lang');
        if (!lang || isApplying) {
          return;
        }
        setLanguage(lang);
      });
    });
  };

  const init = async () => {
    const storedLang = localStorage.getItem(STORAGE_KEY);
    const browserLang = navigator.language || navigator.userLanguage;
    const initialLang = resolveLang(storedLang || browserLang);

    await setLanguage(initialLang, { persist: false, silent: true });
    document.dispatchEvent(new CustomEvent('i18n:changed', { detail: { lang: initialLang } }));
    setupLanguageSwitcher();
  };

  window.i18n = {
    t,
    setLanguage,
    getLanguage: () => currentLang,
  };

  document.addEventListener('DOMContentLoaded', init);
})();
