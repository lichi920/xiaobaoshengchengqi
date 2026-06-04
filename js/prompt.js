/**
 * prompt.js — 提示词模板、本地词库、组装逻辑
 */

'use strict';

/* ---------- 提示词模板（来自 ai-doc/prompt.md） ---------- */

const PROMPT_TEMPLATE = `请生成一张儿童识字小报《{{THEME}}》，竖版 A4，学习小报版式，适合 5–9 岁孩子认字与看图识物。

# 一、小报标题区（顶部）

**顶部居中大标题**：《{{TITLE}}》
* **风格**：十字小报 / 儿童学习报感
* **文本要求**：大字、醒目、卡通手写体、彩色描边
* **装饰**：周围添加与 {{THEME}} 相关的贴纸风装饰，颜色鲜艳

# 二、小报主体（中间主画面）

画面中心是一幅 **卡通插画风的「{{THEME}}」场景**：
* **整体气氛**：明亮、温暖、积极
* **构图**：物体边界清晰，方便对应文字，不要过于拥挤。

**场景分区与核心内容**
1.  **核心区域 A（主要对象）**：表现 {{THEME}} 的核心活动。
2.  **核心区域 B（配套设施）**：展示相关的工具或物品。
3.  **核心区域 C（环境背景）**：体现环境特征（如墙面、指示牌等）。

**主题人物**
* **角色**：1 位可爱卡通人物（职业/身份：与 {{THEME}} 匹配）。
* **动作**：正在进行与场景相关的自然互动。

# 三、必画物体与识字清单（Generated Content）

**请务必在画面中清晰绘制以下物体，并为其预留贴标签的位置：**

**1. 核心角色与设施：**
{{VOCAB_CORE}}

**2. 常见物品/工具：**
{{VOCAB_ITEMS}}

**3. 环境与装饰：**
{{VOCAB_ENV}}

*(注意：画面中的物体数量不限于此，但以上列表必须作为重点描绘对象)*

# 四、识字标注规则

对上述清单中的物体，贴上中文识字标签：
* **格式**：两行制（第一行拼音带声调，第二行简体汉字）。
* **样式**：彩色小贴纸风格，白底黑字或深色字，清晰可读。
* **排版**：标签靠近对应的物体，不遮挡主体。

# 五、画风参数
* **风格**：儿童绘本风 + 识字小报风
* **色彩**：高饱和、明快、温暖 (High Saturation, Warm Tone)
* **质量**：8k resolution, high detail, vector illustration style, clean lines.`;

/* ---------- 本地词库 ---------- */

const VOCAB_DATABASE = {
  '超市': {
    core: [
      { pinyin: 'shōu yín yuán', chinese: '收银员' },
      { pinyin: 'huò jià', chinese: '货架' },
      { pinyin: 'gòu wù chē', chinese: '购物车' },
      { pinyin: 'shōu yín tái', chinese: '收银台' },
    ],
    items: [
      { pinyin: 'píng guǒ', chinese: '苹果' },
      { pinyin: 'niú nǎi', chinese: '牛奶' },
      { pinyin: 'miàn bāo', chinese: '面包' },
      { pinyin: 'xī hóng shì', chinese: '西红柿' },
      { pinyin: 'yá shuā', chinese: '牙刷' },
      { pinyin: 'zhǐ jīn', chinese: '纸巾' },
      { pinyin: 'xī wán jīng', chinese: '洗洁精' },
      { pinyin: 'líng shí', chinese: '零食' },
    ],
    environment: [
      { pinyin: 'chū kǒu', chinese: '出口' },
      { pinyin: 'rù kǒu', chinese: '入口' },
      { pinyin: 'dēng', chinese: '灯' },
      { pinyin: 'jià qiān', chinese: '价签' },
      { pinyin: 'bāo zhuāng dài', chinese: '包装袋' },
    ],
  },
  '医院': {
    core: [
      { pinyin: 'yī shēng', chinese: '医生' },
      { pinyin: 'hù shì', chinese: '护士' },
      { pinyin: 'bìng chuáng', chinese: '病床' },
      { pinyin: 'guà hào chù', chinese: '挂号处' },
    ],
    items: [
      { pinyin: 'tī wēn jì', chinese: '体温计' },
      { pinyin: 'yào pǐn', chinese: '药品' },
      { pinyin: 'zhù shè qì', chinese: '注射器' },
      { pinyin: 'kǒu zhào', chinese: '口罩' },
      { pinyin: 'mián qiú', chinese: '棉球' },
      { pinyin: 'bāng dài', chinese: '绷带' },
      { pinyin: 'tīng zhěn qì', chinese: '听诊器' },
    ],
    environment: [
      { pinyin: 'jí zhěn shì', chinese: '急诊室' },
      { pinyin: 'yào fáng', chinese: '药房' },
      { pinyin: 'hóng shí zì', chinese: '红十字' },
      { pinyin: 'pái duì', chinese: '排队' },
    ],
  },
  '公园': {
    core: [
      { pinyin: 'pén you', chinese: '朋友' },
      { pinyin: 'huá tī', chinese: '滑梯' },
      { pinyin: 'qiū qiān', chinese: '秋千' },
      { pinyin: 'cháng yǐ', chinese: '长椅' },
    ],
    items: [
      { pinyin: 'fēng zhēng', chinese: '风筝' },
      { pinyin: 'zì xíng chē', chinese: '自行车' },
      { pinyin: 'shuǐ hú', chinese: '水壶' },
      { pinyin: 'shā tān qiú', chinese: '沙滩球' },
      { pinyin: 'miàn bāo', chinese: '面包' },
      { pinyin: 'xiǎo gǒu', chinese: '小狗' },
      { pinyin: 'bīng qí lín', chinese: '冰淇淋' },
    ],
    environment: [
      { pinyin: 'shù mù', chinese: '树木' },
      { pinyin: 'huā duǒ', chinese: '花朵' },
      { pinyin: 'chí táng', chinese: '池塘' },
      { pinyin: 'xiǎo lù', chinese: '小路' },
      { pinyin: 'pēn quán', chinese: '喷泉' },
    ],
  },
  '动物园': {
    core: [
      { pinyin: 'dòng wù', chinese: '动物' },
      { pinyin: 'lǎo hǔ', chinese: '老虎' },
      { pinyin: 'dà xiàng', chinese: '大象' },
      { pinyin: 'cháng jǐng lù', chinese: '长颈鹿' },
      { pinyin: 'liè rén', chinese: '狮子' },
    ],
    items: [
      { pinyin: 'hóu zi', chinese: '猴子' },
      { pinyin: 'xióng māo', chinese: '熊猫' },
      { pinyin: 'bān mǎ', chinese: '斑马' },
      { pinyin: 'tù zi', chinese: '兔子' },
      { pinyin: 'niǎo', chinese: '鸟' },
      { pinyin: 'yú', chinese: '鱼' },
      { pinyin: 'è yú', chinese: '鳄鱼' },
    ],
    environment: [
      { pinyin: 'lóng zi', chinese: '笼子' },
      { pinyin: 'cǎo dì', chinese: '草地' },
      { pinyin: 'shuǐ chí', chinese: '水池' },
      { pinyin: 'biāo pái', chinese: '标牌' },
    ],
  },
  '学校': {
    core: [
      { pinyin: 'lǎo shī', chinese: '老师' },
      { pinyin: 'tóng xué', chinese: '同学' },
      { pinyin: 'jiào shì', chinese: '教室' },
      { pinyin: 'hēi bǎn', chinese: '黑板' },
    ],
    items: [
      { pinyin: 'qiān bǐ', chinese: '铅笔' },
      { pinyin: 'xiàng pí', chinese: '橡皮' },
      { pinyin: 'shū bāo', chinese: '书包' },
      { pinyin: 'kè běn', chinese: '课本' },
      { pinyin: 'chǐ zi', chinese: '尺子' },
      { pinyin: 'cǎi bǐ', chinese: '彩笔' },
      { pinyin: 'wén jù hé', chinese: '文具盒' },
    ],
    environment: [
      { pinyin: 'cāo chǎng', chinese: '操场' },
      { pinyin: 'guó qí', chinese: '国旗' },
      { pinyin: 'kè zhuō', chinese: '课桌' },
      { pinyin: 'tú shū guǎn', chinese: '图书馆' },
    ],
  },
  '厨房': {
    core: [
      { pinyin: 'chú shī', chinese: '厨师' },
      { pinyin: 'guō', chinese: '锅' },
      { pinyin: 'zào tái', chinese: '灶台' },
      { pinyin: 'bīng xiāng', chinese: '冰箱' },
    ],
    items: [
      { pinyin: 'wǎn', chinese: '碗' },
      { pinyin: 'kuài zi', chinese: '筷子' },
      { pinyin: 'sháo zi', chinese: '勺子' },
      { pinyin: 'pán zi', chinese: '盘子' },
      { pinyin: 'cài dāo', chinese: '菜刀' },
      { pinyin: 'mǐ fàn', chinese: '米饭' },
      { pinyin: 'jī dàn', chinese: '鸡蛋' },
      { pinyin: 'shū cài', chinese: '蔬菜' },
    ],
    environment: [
      { pinyin: 'shuǐ lóng tóu', chinese: '水龙头' },
      { pinyin: 'cān zhuō', chinese: '餐桌' },
      { pinyin: 'wēi bō lú', chinese: '微波炉' },
      { pinyin: 'tiáo wèi liào', chinese: '调味料' },
    ],
  },
  '海洋': {
    core: [
      { pinyin: 'hǎi yáng', chinese: '海洋' },
      { pinyin: 'hǎi tún', chinese: '海豚' },
      { pinyin: 'jīng yú', chinese: '鲸鱼' },
      { pinyin: 'hǎi guī', chinese: '海龟' },
    ],
    items: [
      { pinyin: 'yú', chinese: '鱼' },
      { pinyin: 'xiè', chinese: '蟹' },
      { pinyin: 'hǎi xīng', chinese: '海星' },
      { pinyin: 'zhēn zhū', chinese: '珍珠' },
      { pinyin: 'bèi ké', chinese: '贝壳' },
      { pinyin: 'hǎi cǎo', chinese: '海草' },
      { pinyin: 'shān hú', chinese: '珊瑚' },
    ],
    environment: [
      { pinyin: 'làng huā', chinese: '浪花' },
      { pinyin: 'shā tān', chinese: '沙滩' },
      { pinyin: 'dēng tǎ', chinese: '灯塔' },
      { pinyin: 'xiǎo chuán', chinese: '小船' },
      { pinyin: 'hǎi ōu', chinese: '海鸥' },
    ],
  },
  '农场': {
    core: [
      { pinyin: 'nóng fū', chinese: '农夫' },
      { pinyin: 'tián dì', chinese: '田地' },
      { pinyin: 'gǔ cāng', chinese: '谷仓' },
      { pinyin: 'tuō lā jī', chinese: '拖拉机' },
    ],
    items: [
      { pinyin: 'niú', chinese: '牛' },
      { pinyin: 'zhū', chinese: '猪' },
      { pinyin: 'jī', chinese: '鸡' },
      { pinyin: 'yáng', chinese: '羊' },
      { pinyin: 'mǎ', chinese: '马' },
      { pinyin: 'píng guǒ', chinese: '苹果' },
      { pinyin: 'xiǎo mài', chinese: '小麦' },
      { pinyin: 'yù mǐ', chinese: '玉米' },
    ],
    environment: [
      { pinyin: 'zhà lan', chinese: '栅栏' },
      { pinyin: 'fēng chē', chinese: '风车' },
      { pinyin: 'guǒ shù', chinese: '果树' },
      { pinyin: 'xiǎo hé', chinese: '小河' },
    ],
  },
  '太空': {
    core: [
      { pinyin: 'yǔ háng yuán', chinese: '宇航员' },
      { pinyin: 'huǒ jiàn', chinese: '火箭' },
      { pinyin: 'fēi chuán', chinese: '飞船' },
      { pinyin: 'kōng jiān zhàn', chinese: '空间站' },
    ],
    items: [
      { pinyin: 'xīng xīng', chinese: '星星' },
      { pinyin: 'yuè liang', chinese: '月亮' },
      { pinyin: 'tài yáng', chinese: '太阳' },
      { pinyin: 'dì qiú', chinese: '地球' },
      { pinyin: 'wèi xīng', chinese: '卫星' },
      { pinyin: 'liú xīng', chinese: '流星' },
      { pinyin: 'wàng yuǎn jìng', chinese: '望远镜' },
    ],
    environment: [
      { pinyin: 'xīng kōng', chinese: '星空' },
      { pinyin: 'yín hé', chinese: '银河' },
      { pinyin: 'hēi dòng', chinese: '黑洞' },
      { pinyin: 'wài xīng rén', chinese: '外星人' },
    ],
  },
  '花园': {
    core: [
      { pinyin: 'huā yuán', chinese: '花园' },
      { pinyin: 'huā duǒ', chinese: '花朵' },
      { pinyin: 'dà shù', chinese: '大树' },
      { pinyin: 'pēn hú', chinese: '喷壶' },
    ],
    items: [
      { pinyin: 'méi guī', chinese: '玫瑰' },
      { pinyin: 'xiàng rì kuí', chinese: '向日葵' },
      { pinyin: 'hú dié', chinese: '蝴蝶' },
      { pinyin: 'mì fēng', chinese: '蜜蜂' },
      { pinyin: 'xiǎo cǎo', chinese: '小草' },
      { pinyin: 'zhǒng zi', chinese: '种子' },
      { pinyin: 'shuǐ hú', chinese: '水壶' },
      { pinyin: 'chú tou', chinese: '锄头' },
    ],
    environment: [
      { pinyin: 'zhà lan', chinese: '栅栏' },
      { pinyin: 'shí tou', chinese: '石头' },
      { pinyin: 'ní tǔ', chinese: '泥土' },
      { pinyin: 'yáng guāng', chinese: '阳光' },
    ],
  },
};

/* ---------- 词汇查询 ---------- */

/**
 * 从本地词库查找词汇，支持模糊匹配
 * @param {string} theme 主题/场景
 * @returns {{ core: Array, items: Array, environment: Array } | null}
 */
function lookupVocabulary(theme) {
  // 精确匹配
  if (VOCAB_DATABASE[theme]) {
    return JSON.parse(JSON.stringify(VOCAB_DATABASE[theme]));
  }

  // 模糊匹配：主题包含词库名 或 词库名包含主题
  for (const [key, value] of Object.entries(VOCAB_DATABASE)) {
    if (key.includes(theme) || theme.includes(key)) {
      return JSON.parse(JSON.stringify(value));
    }
  }

  return null;
}

/**
 * 获取词库中所有可用的主题列表
 * @returns {string[]}
 */
function getAvailableThemes() {
  return Object.keys(VOCAB_DATABASE);
}

/* ---------- 词汇格式化 ---------- */

/**
 * 将词汇数组格式化为 "拼音 汉字, 拼音 汉字" 形式
 * @param {Array<{pinyin: string, chinese: string}>} words
 * @returns {string}
 */
function formatVocabList(words) {
  if (!words || !words.length) return '';
  return words.map((w) => `${w.pinyin} ${w.chinese}`).join(', ');
}

/* ---------- 提示词组装 ---------- */

/**
 * 将主题、标题、词汇组装成最终提示词
 * @param {string} theme 主题/场景
 * @param {string} title 标题
 * @param {{ core: Array, items: Array, environment: Array }} vocab 词汇对象
 * @returns {string}
 */
function assemblePrompt(theme, title, vocab) {
  let result = PROMPT_TEMPLATE;
  result = result.replaceAll('{{THEME}}', theme);
  result = result.replaceAll('{{TITLE}}', title);
  result = result.replaceAll('{{VOCAB_CORE}}', formatVocabList(vocab.core));
  result = result.replaceAll('{{VOCAB_ITEMS}}', formatVocabList(vocab.items));
  result = result.replaceAll('{{VOCAB_ENV}}', formatVocabList(vocab.environment));
  return result;
}
