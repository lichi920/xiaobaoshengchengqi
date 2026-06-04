/**
 * app.js — 主入口：UI 事件绑定、流程编排
 */

'use strict';

/* ========== 全局状态 ========== */

let currentVocab = null;   // 当前生成的词汇对象
let isBusy = false;         // 是否正在处理

/* ========== 初始化 ========== */

document.addEventListener('DOMContentLoaded', initUI);

function initUI() {
  // 绑定错误 Toast
  $('#error-dismiss').addEventListener('click', hideError);

  // 绑定保存 API Key
  $('#settings-save').addEventListener('click', handleSaveApiKey);

  // 绑定主流程按钮
  $('#btn-gen-vocab').addEventListener('click', handleGenerateVocab);
  $('#btn-regen-vocab').addEventListener('click', handleGenerateVocab);
  $('#btn-gen-image').addEventListener('click', handleGenerateImage);
  $('#btn-new-gen').addEventListener('click', handleNewGeneration);

  // 监听输入变化
  const themeInput = $('#theme-input');
  const titleInput = $('#title-input');

  const checkInputs = () => {
    const hasContent = themeInput.value.trim() && titleInput.value.trim();
    $('#btn-gen-vocab').disabled = !hasContent || isBusy;

    // 显示可用主题提示
    updateThemeHint(themeInput.value.trim());
  };

  themeInput.addEventListener('input', checkInputs);
  titleInput.addEventListener('input', checkInputs);

  // 加载已保存的 API Key
  const settings = loadSettings();
  if (settings.imageApiKey) {
    $('#image-api-key').value = settings.imageApiKey;
  }

  checkInputs();
}

/* ---------- 主题输入提示 ---------- */

function updateThemeHint(input) {
  const hintEl = $('#theme-hint');
  if (!input) {
    const themes = getAvailableThemes();
    hintEl.textContent = '可选主题：' + themes.join('、');
    return;
  }
  // 检查是否有匹配
  const matched = lookupVocabulary(input);
  if (matched) {
    hintEl.textContent = '已匹配本地词库';
    hintEl.style.color = 'var(--success)';
  } else {
    hintEl.textContent = '未找到匹配词库，将使用空白模板，可手动编辑提示词';
    hintEl.style.color = '#e6a817';
  }
}

/* ---------- 保存 API Key ---------- */

function handleSaveApiKey() {
  const imageApiKey = $('#image-api-key').value.trim();

  if (!imageApiKey) {
    showError('请填写图片生成 API Key');
    return;
  }

  saveSettings({ imageApiKey: imageApiKey });
  hideError();

  // 重新检查按钮状态
  const hasContent = $('#theme-input').value.trim() && $('#title-input').value.trim();
  $('#btn-gen-vocab').disabled = !hasContent || isBusy;
}

/* ========== 流程：生成词汇 ========== */

async function handleGenerateVocab() {
  if (isBusy) return;

  const settings = loadSettings();
  if (!settings.imageApiKey) {
    showError('请先填写图片生成 API Key 并点击保存。');
    return;
  }

  const theme = $('#theme-input').value.trim();
  const title = $('#title-input').value.trim();

  if (!theme || !title) {
    showError('请填写主题和标题。');
    return;
  }

  hideError();

  // 从本地词库查找词汇
  const vocab = lookupVocabulary(theme);

  if (vocab) {
    currentVocab = vocab;
  } else {
    // 没有匹配的词库，使用空白模板
    currentVocab = {
      core: [
        { pinyin: '', chinese: '（请填写）' },
      ],
      items: [
        { pinyin: '', chinese: '（请填写）' },
      ],
      environment: [
        { pinyin: '', chinese: '（请填写）' },
      ],
    };
  }

  // 组装提示词
  const prompt = assemblePrompt(theme, title, currentVocab);

  // 显示词汇预览
  renderVocabSummary(currentVocab);

  // 填充文本编辑区
  $('#prompt-editor').value = prompt;

  // 显示提示词编辑区
  show('#section-prompt');

  // 滚动到提示词区域
  $('#section-prompt').scrollIntoView({ behavior: 'smooth' });
}

/**
 * 渲染词汇预览卡片
 */
function renderVocabSummary(vocab) {
  const container = $('#vocab-summary');
  container.innerHTML = '';

  const categories = [
    { label: '核心角色与设施', words: vocab.core, color: '#e3f2fd' },
    { label: '常见物品/工具', words: vocab.items, color: '#e8f5e9' },
    { label: '环境与装饰', words: vocab.environment, color: '#fff3e0' },
  ];

  categories.forEach((cat) => {
    const card = document.createElement('div');
    card.className = 'vocab-card';
    card.style.backgroundColor = cat.color;

    const title = document.createElement('h4');
    title.textContent = cat.label + `（${cat.words.length} 个）`;
    card.appendChild(title);

    const wordList = document.createElement('div');
    wordList.className = 'vocab-words';

    cat.words.forEach((w) => {
      const tag = document.createElement('span');
      tag.className = 'vocab-tag';
      tag.innerHTML = `<span class="pinyin">${escapeHtml(w.pinyin)}</span><span class="chinese">${escapeHtml(w.chinese)}</span>`;
      wordList.appendChild(tag);
    });

    card.appendChild(wordList);
    container.appendChild(card);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/* ========== 流程：生成图片 ========== */

async function handleGenerateImage() {
  if (isBusy) return;

  const settings = loadSettings();
  if (!settings.imageApiKey) {
    showError('请先填写图片生成 API Key 并点击保存。');
    return;
  }

  const promptText = $('#prompt-editor').value.trim();
  if (!promptText) {
    showError('提示词不能为空。');
    return;
  }

  setBusy(true, '提交图片生成任务...');
  hideError();

  // 显示结果区域
  show('#section-result');
  show('#progress-area');
  hide('#image-area');
  $('#progress-text').textContent = '提交任务中...';
  $('#elapsed-time').textContent = '';

  $('#section-result').scrollIntoView({ behavior: 'smooth' });

  try {
    // 创建任务
    const taskId = await createImageTask(promptText, settings);

    $('#progress-text').textContent = '图片生成中，请等待...';

    // 轮询结果
    const imageUrl = await pollTaskResult(taskId, settings, (elapsedMs) => {
      $('#elapsed-time').textContent = `已等待 ${formatElapsed(elapsedMs)}`;
    });

    // 显示图片
    const img = $('#result-image');
    img.src = imageUrl;
    img.onload = () => {
      hide('#progress-area');
      show('#image-area');
    };
    img.onerror = () => {
      hide('#progress-area');
      show('#image-area');
      img.alt = '图片加载失败';
    };

    // 设置下载链接
    const downloadBtn = $('#download-btn');
    downloadBtn.href = imageUrl;
    downloadBtn.target = '_blank';

  } catch (err) {
    hide('#progress-area');
    showError(err.message);
  } finally {
    setBusy(false);
  }
}

/* ========== 流程：重新生成 ========== */

function handleNewGeneration() {
  hide('#section-result');
  hide('#section-prompt');
  currentVocab = null;
  $('#theme-input').focus();
}

/* ========== UI 状态控制 ========== */

function setBusy(busy, statusText) {
  isBusy = busy;

  // 禁用/启用所有操作按钮
  const buttons = ['#btn-gen-vocab', '#btn-regen-vocab', '#btn-gen-image'];
  buttons.forEach((sel) => {
    const btn = $(sel);
    if (btn) btn.disabled = busy;
  });

  // 更新状态提示
  if (busy && statusText) {
    const spinner = $('#global-spinner');
    if (spinner) {
      show(spinner);
      $('#spinner-text').textContent = statusText;
    }
  } else {
    hide('#global-spinner');
  }
}
