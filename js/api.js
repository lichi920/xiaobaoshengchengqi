/**
 * api.js — Nano Banana Pro 图片生成 API
 */

'use strict';

/* ---------- CORS 代理辅助 ---------- */

/**
 * 获取经过 CORS 代理的 URL（如已配置）
 * @param {string} targetUrl
 * @param {string} corsProxy
 * @returns {string}
 */
function getProxiedUrl(targetUrl, corsProxy) {
  if (!corsProxy) return targetUrl;
  return corsProxy + encodeURIComponent(targetUrl);
}

/* ---------- Nano Banana Pro 图片生成 ---------- */

const IMAGE_API_BASE = 'https://api.kie.ai/api/v1/jobs';

/**
 * 创建图片生成任务
 * @param {string} prompt 提示词
 * @param {{ imageApiKey: string, corsProxy: string }} settings
 * @returns {Promise<string>} taskId
 */
async function createImageTask(prompt, settings) {
  const url = getProxiedUrl(`${IMAGE_API_BASE}/createTask`, settings.corsProxy || '');

  const body = {
    model: 'nano-banana-pro',
    input: {
      prompt: prompt,
      image_input: [],
      aspect_ratio: '3:4',
      resolution: '4K',
      output_format: 'png',
    },
  };

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.imageApiKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new Error(
      '无法连接图片生成 API，可能是网络错误或 CORS 限制。\n' +
      '错误详情：' + err.message
    );
  }

  const data = await response.json();

  if (data.code !== 200) {
    throw new Error(`图片任务创建失败：${data.msg || '未知错误'} (code: ${data.code})`);
  }

  if (!data.data || !data.data.taskId) {
    throw new Error('图片任务创建成功但未返回 taskId。');
  }

  return data.data.taskId;
}

/**
 * 轮询图片生成任务状态
 * @param {string} taskId
 * @param {{ imageApiKey: string, corsProxy: string }} settings
 * @param {(elapsedMs: number) => void} onProgress
 * @returns {Promise<string>} 图片 URL
 */
async function pollTaskResult(taskId, settings, onProgress) {
  const POLL_INTERVAL = 5000;  // 5 秒
  const MAX_DURATION = 300000; // 5 分钟

  const startTime = Date.now();

  // 初始等待 3 秒
  await sleep(3000);

  while (true) {
    const elapsed = Date.now() - startTime;

    if (elapsed > MAX_DURATION) {
      throw new Error('图片生成超时（超过 5 分钟），请稍后在 kie.ai 查看任务状态。');
    }

    if (onProgress) onProgress(elapsed);

    const url = getProxiedUrl(`${IMAGE_API_BASE}/recordInfo?taskId=${taskId}`, settings.corsProxy || '');

    let response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${settings.imageApiKey}`,
        },
      });
    } catch (err) {
      // 网络错误不直接抛出，继续重试
      console.warn('轮询请求失败，将重试：', err.message);
      await sleep(POLL_INTERVAL);
      continue;
    }

    const data = await response.json();

    if (data.code !== 200) {
      throw new Error(`查询任务状态失败：${data.msg || '未知错误'}`);
    }

    const state = data.data && data.data.state;

    if (state === 'success') {
      // 解析结果
      let resultUrls;
      try {
        const resultObj = JSON.parse(data.data.resultJson);
        resultUrls = resultObj.resultUrls;
      } catch {
        throw new Error('图片生成成功但无法解析结果 URL。');
      }

      if (!resultUrls || !resultUrls.length) {
        throw new Error('图片生成成功但未返回图片 URL。');
      }

      return resultUrls[0];
    }

    if (state === 'fail') {
      const failMsg = (data.data && data.data.failMsg) || '未知原因';
      throw new Error(`图片生成失败：${failMsg}`);
    }

    // state === 'waiting' 或其他状态，继续轮询
    await sleep(POLL_INTERVAL);
  }
}
