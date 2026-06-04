/**
 * utils.js — DOM 工具函数、错误提示、定时器
 */

'use strict';

/* ---------- DOM 简写 ---------- */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

function show(el) {
  if (typeof el === 'string') el = $(el);
  if (el) el.classList.remove('hidden');
}

function hide(el) {
  if (typeof el === 'string') el = $(el);
  if (el) el.classList.add('hidden');
}

/* ---------- 错误 Toast ---------- */

let _toastTimer = null;

function showError(message, duration = 8000) {
  const toast = $('#error-toast');
  const msgEl = $('#error-message');
  if (!toast || !msgEl) return;

  msgEl.textContent = message;
  show(toast);

  clearTimeout(_toastTimer);
  if (duration > 0) {
    _toastTimer = setTimeout(() => hideError(), duration);
  }
}

function hideError() {
  hide('#error-toast');
  clearTimeout(_toastTimer);
}

/* ---------- 定时器 ---------- */

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ---------- 时间格式化 ---------- */

function formatElapsed(ms) {
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec} 秒`;
  const min = Math.floor(sec / 60);
  const remainSec = sec % 60;
  return `${min} 分 ${remainSec} 秒`;
}
