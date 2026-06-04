/**
 * settings.js — localStorage 配置管理
 */

'use strict';

const SETTINGS_KEYS = {
  imageApiKey:  'literacy_image_api_key',
};

/**
 * 从 localStorage 读取配置
 * @returns {{ imageApiKey: string }}
 */
function loadSettings() {
  const s = {};
  for (const [key, storageKey] of Object.entries(SETTINGS_KEYS)) {
    s[key] = localStorage.getItem(storageKey) || '';
  }
  return s;
}

/**
 * 保存配置到 localStorage
 * @param {object} settings
 */
function saveSettings(settings) {
  for (const [key, storageKey] of Object.entries(SETTINGS_KEYS)) {
    if (settings[key] !== undefined) {
      localStorage.setItem(storageKey, settings[key]);
    }
  }
}

/**
 * 检查 API Key 是否已填写
 * @returns {boolean}
 */
function isConfigured() {
  const s = loadSettings();
  return !!s.imageApiKey;
}

/**
 * 清除所有配置
 */
function clearSettings() {
  for (const storageKey of Object.values(SETTINGS_KEYS)) {
    localStorage.removeItem(storageKey);
  }
}
