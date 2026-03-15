const jwt = require('jsonwebtoken');
const Order = require('../models/Order');
const Voucher = require('../models/Voucher');
const Bowl = require('../models/Bowl');

const SUPPORT_HOTLINE = '0326 238 700';
const SUPPORT_EMAIL = 'contact@eatomo.com';
const SUPPORT_HOURS = '10:00 - 21:00 (moi ngay)';
const SUPPORT_LINK = '/about-us';

const chatAnalytics = {
  totalRequests: 0,
  fallbackCount: 0,
  clarifyCount: 0,
  handoffCount: 0,
  intentCounts: {},
  unresolvedByIntent: {},
  dropSignals: 0,
  lastEvents: []
};

function pushAnalyticsEvent(type, payload = {}) {
  chatAnalytics.lastEvents.push({
    type,
    at: new Date().toISOString(),
    ...payload
  });

  if (chatAnalytics.lastEvents.length > 100) {
    chatAnalytics.lastEvents.shift();
  }
}

function incIntentCount(intent) {
  const key = intent || 'unknown';
  chatAnalytics.intentCounts[key] = (chatAnalytics.intentCounts[key] || 0) + 1;
}

function incUnresolved(intent) {
  const key = intent || 'unknown';
  chatAnalytics.unresolvedByIntent[key] = (chatAnalytics.unresolvedByIntent[key] || 0) + 1;
}

function supportFooter() {
  return `Hotline: ${SUPPORT_HOTLINE} | Email: ${SUPPORT_EMAIL} | Gio ho tro: ${SUPPORT_HOURS} | Lien he: ${SUPPORT_LINK}`;
}

function normalizeText(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function detectIntent(rawMessage) {
  const message = normalizeText(rawMessage);

  if (!message) return 'empty';

  if (/(huy don|huy order|cancel order)/.test(message) && /(ord[-\w]+)/i.test(rawMessage || '')) return 'cancel_order';
  if (/(chi tiet don|tra cuu ma don|ma don|order code|ord-)/.test(message) && /(ord[-\w]+)/i.test(rawMessage || '')) return 'order_lookup';
  if (/(voucher.*(bao nhieu|duoc khong)|ma.*(ap duoc|hop le)|kiem tra voucher|check voucher)/.test(message)) return 'voucher_check';
  if (/(tu van cho rieng|tu van ca nhan|bmi|can nang|chieu cao|\d+\s*kg|\d+\s*cm|\d[\.,]\d\s*m|tuoi|gioi tinh|tap luyen|tan suat tap|giam can|tang can|giu can|lose|gain|maintain|calo|dinh duong|macro)/.test(message)) return 'nutrition_coaching';
  if (/(giao hang|thanh toan|doi tra|hoan tien|gio mo cua|cua hang|lien he|hotline)/.test(message)) return 'customer_faq';
  if (/(hoc|study|nang suat|productivity|tap luyen|suc khoe|lap trinh|debug|phong van|career|ra quyet dinh|ke hoach)/.test(message)) return 'off_topic';
  if (/(xin chao|\bhello\b|\bhi\b|chao em|chao shop)/.test(message)) return 'greeting';
  if (/(don hang|order|trang thai don|don cua toi|bao gio giao|theo doi don)/.test(message)) return 'order_status';
  if (/(voucher|ma giam|khuyen mai|uu dai|promo|coupon)/.test(message)) return 'voucher_info';
  if (/(goi y|de xuat|nen an|recommend|mon nao|bowl nao)/.test(message)) return 'bowl_recommendation';

  return 'fallback';
}

function buildIntentScores(rawMessage) {
  const message = normalizeText(rawMessage);
  const scores = {
    cancel_order: 0,
    order_lookup: 0,
    voucher_check: 0,
    nutrition_coaching: 0,
    customer_faq: 0,
    off_topic: 0,
    greeting: 0,
    order_status: 0,
    voucher_info: 0,
    bowl_recommendation: 0
  };

  if (/(huy don|huy order|cancel order)/.test(message)) scores.cancel_order += 2;
  if (/(ord[-\w]+)/i.test(rawMessage || '')) {
    scores.cancel_order += 1;
    scores.order_lookup += 2;
  }

  if (/(chi tiet don|tra cuu ma don|ma don|order code|ord-)/.test(message)) scores.order_lookup += 2;
  if (/(voucher.*(bao nhieu|duoc khong)|ma.*(ap duoc|hop le)|kiem tra voucher|check voucher)/.test(message)) scores.voucher_check += 2;
  if (/(tu van cho rieng|tu van ca nhan|bmi|can nang|chieu cao|\d+\s*kg|\d+\s*cm|\d[\.,]\d\s*m|tuoi|gioi tinh|tap luyen|tan suat tap|giam can|tang can|giu can|lose|gain|maintain|calo|dinh duong|macro)/.test(message)) scores.nutrition_coaching += 2;
  if (/(giao hang|thanh toan|doi tra|hoan tien|gio mo cua|cua hang|lien he|hotline)/.test(message)) scores.customer_faq += 2;
  if (/(hoc|study|nang suat|productivity|tap luyen|suc khoe|lap trinh|debug|phong van|career|ra quyet dinh|ke hoach)/.test(message)) scores.off_topic += 1;
  if (/(xin chao|\bhello\b|\bhi\b|chao em|chao shop)/.test(message)) scores.greeting += 2;
  if (/(don hang|order|trang thai don|don cua toi|bao gio giao|theo doi don)/.test(message)) scores.order_status += 2;
  if (/(voucher|ma giam|khuyen mai|uu dai|promo|coupon)/.test(message)) scores.voucher_info += 1;
  if (/(goi y|de xuat|nen an|recommend|mon nao|bowl nao)/.test(message)) scores.bowl_recommendation += 1;

  return Object.entries(scores)
    .map(([intent, score]) => ({ intent, score }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
}

function getIntentMeta(rawMessage) {
  const ruleIntent = detectIntent(rawMessage);
  const scored = buildIntentScores(rawMessage);
  const top = scored[0] || null;
  const second = scored[1] || null;

  const intent = ruleIntent === 'fallback' && top ? top.intent : ruleIntent;
  const totalScore = scored.reduce((sum, item) => sum + item.score, 0);
  const confidence = top ? Number((top.score / Math.max(totalScore, 1)).toFixed(2)) : 0;
  const ambiguous = Boolean(top && second && Math.abs(top.score - second.score) <= 1);

  return {
    intent,
    confidence,
    ambiguous,
    candidates: scored.slice(0, 3)
  };
}

function detectDropSignal(rawMessage) {
  const m = normalizeText(rawMessage);
  return /(tam biet|bye|thoat|thoi khong can|de sau|cam on duoc roi|ko can nua)/.test(m);
}

function extractSessionMemory(rawMessage, history) {
  const userTexts = Array.isArray(history)
    ? history.filter((m) => m?.role === 'user' && typeof m?.content === 'string').map((m) => m.content)
    : [];
  userTexts.push(String(rawMessage || ''));
  const joined = userTexts.join(' | ');
  const normalized = normalizeText(joined);

  const budget = extractAmount(joined);
  const goal = parseGoal(joined);
  const noBeef = /(khong an bo|ko an bo|di ung bo|avoid beef)/.test(normalized);
  const areaMatch = joined.match(/(quan\s*\d+|q\.?\s*\d+|thu duc|go vap|tan binh|binh thanh|phu nhuan|quan 7|quan 1|quan 3)/i);

  return {
    goal: goal || null,
    preferences: parsePreferences(joined),
    noBeef,
    budget: budget || null,
    area: areaMatch ? areaMatch[1] : null
  };
}

function buildSessionMemoryHint(sessionMemory) {
  const items = [];
  if (sessionMemory.goal) items.push(`muc tieu ${sessionMemory.goal}`);
  if (sessionMemory.noBeef) items.push('khong an bo');
  if (sessionMemory.budget) items.push(`ngan sach ${formatCurrency(sessionMemory.budget)}`);
  if (sessionMemory.area) items.push(`khu vuc ${sessionMemory.area}`);
  return items.length > 0 ? `Minh dang nho: ${items.join(', ')}.` : '';
}

function shouldAskClarifyingQuestion(text, intentMeta) {
  if (!text || text.trim().length < 4) return true;
  if (intentMeta.intent === 'greeting') return false;
  if (intentMeta.intent === 'fallback') return true;
  return intentMeta.confidence < 0.55 || intentMeta.ambiguous;
}

function buildClarifyingResponse(intentMeta, sessionMemory) {
  const topIntent = intentMeta.candidates[0]?.intent || intentMeta.intent;

  if (topIntent === 'voucher_check' || topIntent === 'voucher_info') {
    return {
      reply:
        'Minh muon xac nhan nhanh de tra loi dung y ban: ban dang muon kiem tra ma voucher cu the hay xem danh sach voucher hien co?',
      suggestions: ['Kiem tra ma voucher cu the', 'Xem voucher hien co']
    };
  }

  if (topIntent === 'order_lookup' || topIntent === 'order_status' || topIntent === 'cancel_order') {
    return {
      reply:
        'Minh can lam ro 1 y: ban muon tra cuu trang thai don hay huy don? Neu co, gui kem ma don dang ORD-... de minh xu ly ngay.',
      suggestions: ['Tra cuu trang thai don', 'Huy don voi ma ORD-...']
    };
  }

  if (topIntent === 'nutrition_coaching' || topIntent === 'bowl_recommendation') {
    const memoryHint = [
      sessionMemory.goal ? `muc tieu: ${sessionMemory.goal}` : null,
      sessionMemory.noBeef ? 'khong an bo' : null,
      sessionMemory.budget ? `ngan sach: ${formatCurrency(sessionMemory.budget)}` : null
    ].filter(Boolean).join(', ');

    return {
      reply:
        `Minh can hoi them 1 cau de de xuat chuan hon: ban uu tien giam can, tang co hay giu dang?${memoryHint ? ` (minh dang nho: ${memoryHint})` : ''}`,
      suggestions: ['Giam can', 'Tang co', 'Giu dang']
    };
  }

  return {
    reply:
      `Minh chua du chac de tra loi ngay. Ban cho minh lam ro 1 cau: ban dang can ho tro ve don hang, voucher, dinh duong hay cua hang?\n${supportFooter()}`,
    suggestions: ['Ho tro don hang', 'Ho tro voucher', 'Tu van dinh duong', 'Thong tin cua hang']
  };
}

function formatCurrency(value) {
  return new Intl.NumberFormat('vi-VN').format(value || 0) + 'đ';
}

function getUserIdFromToken(req) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded?.id || null;
  } catch {
    return null;
  }
}

function mapCategoryFromMessage(rawMessage) {
  const m = normalizeText(rawMessage);

  if (/(an chay|chay|vegetarian|vegan)/.test(m)) return 'vegetarian';
  if (/(nhieu dam|giam mo tang co|protein|tap gym)/.test(m)) return 'high-protein';
  if (/(giam can|it calo|low cal|eat clean)/.test(m)) return 'low-cal';
  return 'balanced';
}

function isInternalQuery(rawMessage) {
  const m = normalizeText(rawMessage);

  const internalPatterns = [
    /noi bo|internal|backend|frontend|source code|ma nguon|repository|repo/,
    /api\b|endpoint|schema|database|mongodb|mysql|jwt|token|secret|env/,
    /kien truc|architecture|deploy|infra|server config|config he thong/,
    /project_overview|service_plan|ui_plan|instruction\.md|admin_integration/
  ];

  return internalPatterns.some((p) => p.test(m));
}

function answerCustomerFaq(rawMessage) {
  const m = normalizeText(rawMessage);

  if (/(giao hang|bao lau|khi nao nhan)/.test(m)) {
    return 'Thông thường đơn được giao trong 30-60 phút tùy khu vực và lượng đơn hiện tại.';
  }

  if (/(thanh toan|payment|tra tien|momo|card|cash)/.test(m)) {
    return 'EATOMO hỗ trợ thanh toán tiền mặt, MoMo, thẻ và chuyển khoản. Bạn có thể chọn ở bước checkout.';
  }

  if (/(doi tra|hoan tien|refund|huy don)/.test(m)) {
    return 'Bạn có thể hủy đơn khi đơn đang ở trạng thái pending. Các trường hợp khác vui lòng liên hệ hỗ trợ để được xử lý nhanh.';
  }

  if (/(gio mo cua|mo cua|store hours|open)/.test(m)) {
    return 'Cửa hàng mở cửa từ 10:00 đến 21:00 mỗi ngày.';
  }

  if (/(lien he|hotline|so dien thoai|support)/.test(m)) {
    return `Bạn vui lòng liên hệ hotline ${SUPPORT_HOTLINE} hoặc email ${SUPPORT_EMAIL}. Đội ngũ EATOMO sẽ hỗ trợ bạn nhanh nhất.`;
  }

  return 'Mình có thể hỗ trợ giao hàng, thanh toán, hủy đơn, voucher và gợi ý bowl theo nhu cầu của bạn.';
}

function answerUnknownIntent(rawMessage) {
  const m = normalizeText(rawMessage);

  const possibleTopics = [];
  if (/(don hang|order|ma don|ord-)/.test(m)) possibleTopics.push('tra cuu don hang');
  if (/(voucher|ma giam|khuyen mai|coupon|promo)/.test(m)) possibleTopics.push('kiem tra voucher');
  if (/(giam can|tang can|dinh duong|bmi|calo|macro)/.test(m)) possibleTopics.push('tu van dinh duong');
  if (/(dia chi|cua hang|chi nhanh|store)/.test(m)) possibleTopics.push('thong tin cua hang');

  if (possibleTopics.length > 0) {
    return (
      `Mình đã nhận diện được một phần yêu cầu (${possibleTopics.join(', ')}) nhưng chưa đủ dữ liệu để trả lời chính xác.\n` +
      `Bạn giúp mình bổ sung thêm thông tin cụ thể hoặc liên hệ hotline ${SUPPORT_HOTLINE} / email ${SUPPORT_EMAIL} để được hỗ trợ nhanh hơn.`
    );
  }

  return (
    'Xin lỗi, câu hỏi này hiện vượt phạm vi tự động của trợ lý.\n' +
    `Bạn vui lòng liên hệ hotline ${SUPPORT_HOTLINE} hoặc email ${SUPPORT_EMAIL}, đội ngũ EATOMO sẽ hỗ trợ chi tiết cho bạn.`
  );
}

function getCustomerFaqAction(rawMessage) {
  const m = normalizeText(rawMessage);

  if (/(dia chi|co so|chi nhanh|cua hang|store|vi tri|quan|huyen|thanh pho)/.test(m)) {
    return 'redirect_stores';
  }

  if (/(lien he|contact|hotline|so dien thoai|email|complain|khieu nai|gop y|phan hoi|about|gioi thieu|thong tin)/.test(m)) {
    return 'redirect_about_us';
  }

  return null;
}

function parseNumber(text) {
  const n = Number(String(text || '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function parseActivityFactor(text) {
  const m = normalizeText(text);

  if (/(0 buoi|khong tap|it van dong|ngoi nhieu)/.test(m)) return { label: 'it van dong', factor: 1.2 };
  if (/(1-2 buoi|1 den 2 buoi|1 2 buoi|nhe)/.test(m)) return { label: 'tap nhe', factor: 1.375 };
  if (/(3-5 buoi|3 den 5 buoi|3 4 buoi|4 5 buoi|vua)/.test(m)) return { label: 'tap vua', factor: 1.55 };
  if (/(6-7 buoi|6 den 7 buoi|hang ngay|nang)/.test(m)) return { label: 'tap nang', factor: 1.725 };
  if (/(2 buoi.*ngay|van dong rat nang|vdv)/.test(m)) return { label: 'rat nang', factor: 1.9 };
  return null;
}

function parseGoal(text) {
  const m = normalizeText(text);
  if (/(giam can|giam mo|siet|cut|\blose\b)/.test(m)) return 'lose';
  if (/(tang can|tang co|bulk|\bgain\b)/.test(m)) return 'gain';
  if (/(giu can|giu dang|duy tri|\bmaintain\b)/.test(m)) return 'maintain';
  return null;
}

function parsePreferences(text) {
  const m = normalizeText(text);
  const prefs = [];

  if (/(an chay|chay|vegan|vegetarian)/.test(m)) prefs.push('vegetarian');
  if (/(nhieu dam|protein|tap gym|gym)/.test(m)) prefs.push('high-protein');
  if (/(it calo|low cal|giam can|eat clean)/.test(m)) prefs.push('low-cal');
  if (/(ca hoi|salmon)/.test(m)) prefs.push('likes salmon');
  if (/(bo|beef)/.test(m)) prefs.push('likes beef');
  if (/(khong an cay|it cay)/.test(m)) prefs.push('avoid spicy');

  return prefs;
}

function extractNutritionProfile(rawMessage, history) {
  const userTexts = Array.isArray(history)
    ? history.filter((m) => m?.role === 'user' && typeof m?.content === 'string').map((m) => m.content)
    : [];
  userTexts.push(String(rawMessage || ''));

  const joined = userTexts.join(' | ');
  const normalized = normalizeText(joined);

  const weightMatch = joined.match(/(\d{2,3}(?:[\.,]\d+)?)\s*(kg|kilogram)/i);
  const heightCmMatch = joined.match(/(\d{2,3}(?:[\.,]\d+)?)\s*cm\b/i);
  const heightMMatch = joined.match(/(1(?:[\.,]\d{1,2})?)\s*m\b/i);
  const ageMatch = joined.match(/(\d{1,2})\s*(tuoi|age)\b|(?:tuoi|age)\s*(\d{1,2})\b/i);

  let gender = null;
  if (/(nam gioi|nam\b|male|boy)/.test(normalized)) gender = 'male';
  if (/(nu gioi|nu\b|female|girl)/.test(normalized)) gender = 'female';

  const weightKg = weightMatch ? parseNumber(weightMatch[1]) : null;
  let heightCm = heightCmMatch ? parseNumber(heightCmMatch[1]) : null;
  if (!heightCm && heightMMatch) {
    const hm = parseNumber(heightMMatch[1]);
    if (hm) heightCm = Math.round(hm * 100);
  }

  const age = ageMatch ? parseNumber(ageMatch[1] || ageMatch[3]) : null;
  const activity = parseActivityFactor(joined);
  const goal = parseGoal(joined);
  const preferences = parsePreferences(joined);

  return {
    weightKg,
    heightCm,
    age,
    gender,
    activityFactor: activity?.factor || null,
    activityLabel: activity?.label || null,
    goal,
    preferences
  };
}

function calculateBmi(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return Math.round(bmi * 10) / 10;
}

function classifyBmiAsian(bmi) {
  if (bmi === null) return null;
  if (bmi < 18.5) return 'thieu can';
  if (bmi < 23) return 'binh thuong';
  if (bmi < 25) return 'thua can nguy co';
  if (bmi < 30) return 'beo phi do I';
  return 'beo phi do II';
}

function estimateCalories(profile) {
  const { weightKg, heightCm, age, gender, activityFactor, goal } = profile;
  if (!weightKg || !heightCm || !gender) {
    return null;
  }

  const resolvedAge = age || 25;
  const resolvedActivity = activityFactor || 1.375;

  const bmr = gender === 'male'
    ? 10 * weightKg + 6.25 * heightCm - 5 * resolvedAge + 5
    : 10 * weightKg + 6.25 * heightCm - 5 * resolvedAge - 161;

  const tdee = Math.round(bmr * resolvedActivity);

  let target = tdee;
  if (goal === 'lose') target = Math.round(tdee - 350);
  if (goal === 'gain') target = Math.round(tdee + 300);

  return {
    bmr: Math.round(bmr),
    tdee,
    targetCalories: Math.max(1200, target),
    assumptions: {
      usedDefaultAge: !age,
      usedDefaultActivity: !activityFactor,
      resolvedAge,
      resolvedActivity
    }
  };
}

function estimateMacros(targetCalories, goal) {
  const proteinRatio = goal === 'gain' ? 0.3 : 0.28;
  const fatRatio = 0.25;
  const carbRatio = 1 - proteinRatio - fatRatio;

  return {
    proteinG: Math.round((targetCalories * proteinRatio) / 4),
    carbsG: Math.round((targetCalories * carbRatio) / 4),
    fatG: Math.round((targetCalories * fatRatio) / 9)
  };
}

function deriveBowlCategory(profile) {
  const pref = profile.preferences || [];
  if (pref.includes('vegetarian')) return 'vegetarian';
  if (pref.includes('high-protein')) return 'high-protein';
  if (profile.goal === 'lose' || pref.includes('low-cal')) return 'low-cal';
  if (profile.goal === 'gain') return 'high-protein';
  return 'balanced';
}

function buildPresetFromProfile(profile) {
  const pref = profile.preferences || [];

  const protein = pref.includes('vegetarian')
    ? 'Sous vide Norwegian salmon'
    : pref.includes('likes beef')
      ? 'Full sous vide top blade beef steak'
      : pref.includes('likes salmon')
        ? 'Sous vide Norwegian salmon'
        : profile.goal === 'gain'
          ? 'Full sous vide original chicken breast'
          : 'Sous vide lemon pepper prawn';

  const carbs = profile.goal === 'lose'
    ? 'Sweet potato'
    : profile.goal === 'gain'
      ? 'Brown rice'
      : 'Cold soba';

  const side = pref.includes('vegetarian') ? 'Broccoli' : 'Edamame';
  const sauce = profile.goal === 'lose' ? 'Wasabi soy' : 'Japanese';

  return {
    protein,
    carbs,
    side,
    sauce
  };
}

async function buildNutritionAdvice(rawMessage, history) {
  const profile = extractNutritionProfile(rawMessage, history);
  const missingRequired = [];
  if (!profile.weightKg) missingRequired.push('can nang (kg)');
  if (!profile.heightCm) missingRequired.push('chieu cao (cm hoac m)');
  if (!profile.gender) missingRequired.push('gioi tinh (nam/nu)');
  if (!profile.goal) missingRequired.push('muc tieu (lose/gain/maintain)');

  if (missingRequired.length > 0) {
    return {
      success: true,
      intent: 'nutrition_coaching',
      reply:
        `Tư vấn cho riêng bạn - vui lòng bổ sung:\n` +
        `- Bắt buộc: ${missingRequired.join(', ')}\n` +
        `- Tùy chọn (khuyến nghị cung cấp): tuổi, tần suất tập (0 / 1-2 / 3-5 / 6-7 buổi/tuần)\n` +
        `- Sở thích cơ bản: chay, high-protein, low-cal, thích bò/cá hồi...\n` +
        `Mẫu nhanh: nam, 72kg, 170cm, lose, 28 tuổi, tập 3-5 buổi/tuần, thích bò.`
    };
  }

  const bmi = calculateBmi(profile.weightKg, profile.heightCm);
  const bmiClass = classifyBmiAsian(bmi);
  const calories = estimateCalories(profile);
  const macros = estimateMacros(calories.targetCalories, profile.goal);
  const category = deriveBowlCategory(profile);

  const minCalo = Math.max(220, Math.round((calories.targetCalories * 0.28) / 3));
  const maxCalo = Math.round((calories.targetCalories * 0.4) / 3) + 120;

  const bowls = await Bowl.find({ category, inStock: true, calories: { $gte: minCalo, $lte: maxCalo } })
    .sort({ isFeatured: -1, protein: -1 })
    .limit(4)
    .select('_id name calories protein carbs fat price category image')
    .lean();

  const fallbackBowls = bowls.length > 0
    ? bowls
    : await Bowl.find({ category, inStock: true })
      .sort({ isFeatured: -1, protein: -1 })
      .limit(4)
      .select('_id name calories protein carbs fat price category image')
      .lean();

  const bowlLines = fallbackBowls.map((b, idx) => {
    return `${idx + 1}. ${b.name} - ${formatCurrency(b.price)} - ${b.calories} kcal (${b.protein}P/${b.carbs}C/${b.fat}F)`;
  });

  const goalText = profile.goal === 'lose' ? 'giảm cân' : profile.goal === 'gain' ? 'tăng cân/tăng cơ' : 'giữ cân';
  const buildYourOwnPreset = buildPresetFromProfile(profile);
  const assumedAgeText = calories.assumptions.usedDefaultAge
    ? `\n- Lưu ý: chưa có tuổi, tạm tính với tuổi giả định ${calories.assumptions.resolvedAge}.`
    : '';
  const assumedActivityText = calories.assumptions.usedDefaultActivity
    ? `\n- Lưu ý: chưa có tần suất tập, tạm tính mức tập nhẹ (1-2 buổi/tuần).`
    : '';

  return {
    success: true,
    intent: 'nutrition_coaching',
    action: 'redirect_build_your_own',
    reply:
      `Phân tích nhanh cho bạn (${goalText}):\n` +
      `- BMI: ${bmi} (${bmiClass})\n` +
      `- BMR: ~${calories.bmr} kcal/ngày\n` +
      `- TDEE: ~${calories.tdee} kcal/ngày\n` +
      `- Mục tiêu calo: ~${calories.targetCalories} kcal/ngày\n` +
      `- Macro gợi ý: ${macros.proteinG}g protein, ${macros.carbsG}g carb, ${macros.fatG}g fat\n` +
      `- Bowl gợi ý hôm nay:\n${bowlLines.join('\n')}\n` +
      `- Nếu bạn muốn, mình đã chuẩn bị sẵn 1 công thức Build Your Own phù hợp để bạn mở lên dùng ngay.\n` +
      `- Kế hoạch 2 tuần: ăn đúng calo mục tiêu và duy trì tập đều ${profile.activityLabel || 'tập nhẹ'}. Sau 14 ngày, cập nhật cân nặng để mình tính lại chính xác hơn.` +
      `${assumedAgeText}${assumedActivityText}`,
    data: {
      profile,
      bmi,
      bmiClass,
      calories,
      macros,
      recommendedBowls: fallbackBowls,
      buildYourOwnPreset
    },
    suggestions: ['Tư vấn cho riêng bạn', 'Mở Build Your Own theo gợi ý', 'Tôi không ăn bò, đổi món giúp tôi']
  };
}

function inferStyleFromHistory(history) {
  const userMessages = Array.isArray(history)
    ? history.filter((m) => m?.role === 'user' && typeof m?.content === 'string')
    : [];

  if (userMessages.length === 0) {
    return {
      concise: true,
      direct: true,
      format: 'bullet'
    };
  }

  const avgLen = Math.round(
    userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length
  );

  return {
    concise: avgLen < 140,
    direct: true,
    format: 'bullet'
  };
}

function formatStyledReply(title, actions, style) {
  const intro = style.concise ? `${title}` : `${title} Bạn làm theo các bước sau:`;
  const list = actions.map((a) => `- ${a}`).join('\n');
  return `${intro}\n${list}`;
}

function answerSmartOffTopic(rawMessage, history) {
  const m = normalizeText(rawMessage);
  const style = inferStyleFromHistory(history);

  const isStudyContext = /(hoc|study|on thi|nho lau|tap trung|nang suat|productivity)/.test(m);

  if (/(lap trinh|code|debug|bug|thuat toan)/.test(m) && !isStudyContext) {
    return formatStyledReply('Cách xử lý bài toán kỹ thuật nhanh và chắc:', [
      'Chốt đầu vào/đầu ra + 2-3 edge case trước khi code.',
      'Làm bản đúng trước, sau đó tối ưu theo profile bottleneck.',
      'Test theo nhom: happy path, edge cases, regression.'
    ], style);
  }

  if (/(hoc|study|on thi|nho lau|tap trung|nang suat|productivity)/.test(m)) {
    return formatStyledReply('Kế hoạch học thông minh trong ngày:', [
      'Học theo block 50/10 trong 3-4 chu kỳ, mỗi chu kỳ một mục tiêu rõ ràng.',
      'Sau mỗi block: tự tóm tắt 5 dòng, không đọc lại nguyên chương.',
      'Cuối ngày: làm 10-15 câu vận dụng để khóa kiến thức.'
    ], style);
  }

  if (/(tap luyen|gym|giam can|suc khoe|an uong)/.test(m)) {
    return formatStyledReply('Khung hành động đơn giản để thay đổi thật:', [
      'Giữ 1 mục tiêu duy nhất trong 14 ngày (vd: 8k bước/ngày).',
      'Theo dõi 2 chỉ số: tính đều + chất lượng giấc ngủ.',
      'Nếu trượt kế hoạch 1 buổi, quay lại ngay buổi tiếp theo, không bù 2x.'
    ], style);
  }

  if (/(ra quyet dinh|chon|so sanh|co nen|nen hay)/.test(m)) {
    return formatStyledReply('Ra quyết định nhanh mà vẫn chắc:', [
      'Xác định 3 tiêu chí quan trọng nhất và gán trọng số 50/30/20.',
      'Chấm điểm mỗi lựa chọn theo từng tiêu chí (thang 10).',
      'Chọn phương án tổng điểm cao nhất, đặt mốc review sau 7 ngày.'
    ], style);
  }

  return formatStyledReply('Mình trả lời theo phong cách ngắn-gọn-trực-diện:', [
    'Nếu bạn muốn, gửi mục tiêu cụ thể + bối cảnh hiện tại.',
    'Mình sẽ đề xuất 3 bước hành động ưu tiên cao nhất.',
    'Sau đó mình tối ưu tiếp dựa trên kết quả bạn phản hồi.'
  ], style);
}

function extractOrderCode(rawMessage) {
  const match = String(rawMessage || '').match(/(ORD[-A-Z0-9]+)/i);
  if (!match) return null;
  return match[1].toUpperCase();
}

function extractVoucherCode(rawMessage) {
  const normalized = String(rawMessage || '').toUpperCase();
  const known = [
    'WELCOME10', 'FIRSTORDER30', 'EATOMO50K', 'HEALTHY20',
    'FLASH25', 'FREESHIP', 'VIP100K', 'SUMMER15', 'VEGGIE25', 'PROTEIN10'
  ];

  for (const code of known) {
    if (normalized.includes(code)) return code;
  }

  const generic = normalized.match(/\b[A-Z]{3,}[A-Z0-9]{1,}\b/g) || [];
  for (const token of generic) {
    if (token.length >= 5 && token.length <= 20) return token;
  }

  return null;
}

function extractAmount(rawMessage) {
  const text = normalizeText(rawMessage);
  const compact = text.replace(/\s+/g, ' ');

  const kMatch = compact.match(/(\d+(?:[\.,]\d+)?)\s*k\b/);
  if (kMatch) {
    const value = Number(kMatch[1].replace(',', '.'));
    if (!Number.isNaN(value)) return Math.round(value * 1000);
  }

  const nghinMatch = compact.match(/(\d+(?:[\.,]\d+)?)\s*(nghin|ngan)\b/);
  if (nghinMatch) {
    const value = Number(nghinMatch[1].replace(',', '.'));
    if (!Number.isNaN(value)) return Math.round(value * 1000);
  }

  const rawNumberMatch = compact.match(/\b(\d{5,9})\b/);
  if (rawNumberMatch) {
    const value = Number(rawNumberMatch[1]);
    if (!Number.isNaN(value)) return value;
  }

  return null;
}

async function handleOrderLookup(rawMessage, userId) {
  const orderCode = extractOrderCode(rawMessage);
  if (!orderCode) {
    return {
      success: true,
      intent: 'order_lookup',
      reply: 'Bạn gửi giúp mình mã đơn theo định dạng ORD-XXXX để tra cứu nhanh.'
    };
  }

  if (!userId) {
    return {
      success: true,
      intent: 'order_lookup',
      reply: 'Bạn cần đăng nhập để tra cứu chi tiết đơn hàng theo mã đơn.',
      requiresAuth: true
    };
  }

  const order = await Order.findOne({ orderNumber: orderCode, userId })
    .select('orderNumber status totalAmount paymentStatus createdAt deliveryAddress')
    .lean();

  if (!order) {
    return {
      success: true,
      intent: 'order_lookup',
      reply: `Mình không tìm thấy đơn ${orderCode} trong tài khoản của bạn.`
    };
  }

  return {
    success: true,
    intent: 'order_lookup',
    action: 'lookup_order_by_code',
    reply:
      `Đơn ${order.orderNumber}: trạng thái ${order.status}, thanh toán ${order.paymentStatus}, tổng ${formatCurrency(order.totalAmount)}.`,
    data: { order }
  };
}

async function handleCancelOrder(rawMessage, userId) {
  const orderCode = extractOrderCode(rawMessage);
  if (!orderCode) {
    return {
      success: true,
      intent: 'cancel_order',
      reply: 'Bạn cần cung cấp mã đơn ORD-... để mình hủy chính xác.'
    };
  }

  if (!userId) {
    return {
      success: true,
      intent: 'cancel_order',
      reply: 'Bạn cần đăng nhập trước khi hủy đơn.',
      requiresAuth: true
    };
  }

  const order = await Order.findOne({ orderNumber: orderCode, userId });
  if (!order) {
    return {
      success: true,
      intent: 'cancel_order',
      reply: `Mình không tìm thấy đơn ${orderCode} trong tài khoản của bạn.`
    };
  }

  if (order.status !== 'pending') {
    return {
      success: true,
      intent: 'cancel_order',
      action: 'cancel_order',
      reply: `Đơn ${order.orderNumber} đang ở trạng thái ${order.status} nên không thể hủy tự động.`
    };
  }

  order.status = 'cancelled';
  await order.save();

  return {
    success: true,
    intent: 'cancel_order',
    action: 'cancel_order',
    reply: `Đã hủy đơn ${order.orderNumber} thành công.`,
    data: { orderNumber: order.orderNumber, status: order.status }
  };
}

async function handleVoucherCheck(rawMessage) {
  const code = extractVoucherCode(rawMessage);
  const amount = extractAmount(rawMessage);

  if (!code) {
    return {
      success: true,
      intent: 'voucher_check',
      reply: 'Bạn gửi mã voucher (vd: WELCOME10) và tổng đơn (vd: 320k) để mình tính chính xác.'
    };
  }

  const now = new Date();
  const voucher = await Voucher.findOne({ code: code.toUpperCase() }).lean();
  if (!voucher) {
    return {
      success: true,
      intent: 'voucher_check',
      action: 'validate_voucher_for_amount',
      reply: `Không tìm thấy mã voucher ${code}.`
    };
  }

  if (!voucher.isActive) {
    return {
      success: true,
      intent: 'voucher_check',
      action: 'validate_voucher_for_amount',
      reply: `Mã ${voucher.code} hiện không hoạt động.`
    };
  }

  if (voucher.validFrom && voucher.validFrom > now) {
    return {
      success: true,
      intent: 'voucher_check',
      action: 'validate_voucher_for_amount',
      reply: `Mã ${voucher.code} chưa đến thời gian áp dụng.`
    };
  }

  if (voucher.validUntil && voucher.validUntil < now) {
    return {
      success: true,
      intent: 'voucher_check',
      action: 'validate_voucher_for_amount',
      reply: `Mã ${voucher.code} đã hết hạn.`
    };
  }

  if (voucher.currentUses >= voucher.maxUses) {
    return {
      success: true,
      intent: 'voucher_check',
      action: 'validate_voucher_for_amount',
      reply: `Mã ${voucher.code} đã hết lượt sử dụng.`
    };
  }

  if (!amount) {
    return {
      success: true,
      intent: 'voucher_check',
      action: 'validate_voucher_for_amount',
      reply: `Mã ${voucher.code} hợp lệ. Bạn gửi thêm tổng đơn (vd 300k) để mình tính số tiền giảm cụ thể.`,
      data: {
        voucher: {
          code: voucher.code,
          discountType: voucher.discountType,
          discountValue: voucher.discountValue,
          minOrderValue: voucher.minOrderValue,
          maxDiscountAmount: voucher.maxDiscountAmount
        }
      }
    };
  }

  if (amount < voucher.minOrderValue) {
    return {
      success: true,
      intent: 'voucher_check',
      action: 'validate_voucher_for_amount',
      reply: `Đơn ${formatCurrency(amount)} chưa đạt mức tối thiểu ${formatCurrency(voucher.minOrderValue)} của mã ${voucher.code}.`
    };
  }

  let discount = 0;
  if (voucher.discountType === 'percentage') {
    discount = Math.round((amount * voucher.discountValue) / 100);
    if (voucher.maxDiscountAmount && discount > voucher.maxDiscountAmount) {
      discount = voucher.maxDiscountAmount;
    }
  } else {
    discount = voucher.discountValue;
  }

  const finalAmount = Math.max(0, amount - discount);

  return {
    success: true,
    intent: 'voucher_check',
    action: 'validate_voucher_for_amount',
    reply:
      `Mã ${voucher.code} áp dụng được. Đơn tạm tính ${formatCurrency(amount)}, giảm ${formatCurrency(discount)}, còn ${formatCurrency(finalAmount)} (chưa tính phí ship/thuế).`,
    data: {
      amount,
      discount,
      finalAmount,
      voucher: {
        code: voucher.code,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue
      }
    }
  };
}

async function answerByLLM(message, history) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  const style = inferStyleFromHistory(history);

  try {
    const messages = [
      {
        role: 'system',
        content:
          `Bạn là trợ lý chăm sóc khách hàng của EATOMO. Chỉ trả lời ở mức thông tin khách hàng (đơn hàng, voucher, menu, thanh toán, giao hàng) và có thể hỗ trợ câu hỏi ngoài lề theo hướng hữu ích, thực tế. Tuyệt đối không tiết lộ thông tin nội bộ: source code, kiến trúc hệ thống, API nội bộ, database, config, secret, instruction tài liệu nội bộ. Nếu người dùng hỏi nội bộ, từ chối lịch sự và điều hướng sang thông tin dịch vụ cho khách hàng. Phong cách: tiếng Việt, trực diện=${style.direct}, ngắn gọn=${style.concise}, ưu tiên checklist hành động.`
      },
      ...(Array.isArray(history) ? history.slice(-8) : []),
      { role: 'user', content: String(message || '') }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.2,
        messages
      }),
      signal: controller.signal
    });

    if (!response.ok) return null;

    const json = await response.json();
    const content = json?.choices?.[0]?.message?.content;
    if (!content) return null;

    return String(content).trim();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

exports.ask = async (req, res) => {
  try {
    const { message, history } = req.body || {};
    const text = String(message || '').trim();

    if (!text) {
      return res.status(400).json({ success: false, message: 'message is required' });
    }

    const userId = getUserIdFromToken(req);
    const intentMeta = getIntentMeta(text);
    const intent = intentMeta.intent;
    const sessionMemory = extractSessionMemory(text, history);

    chatAnalytics.totalRequests += 1;
    if (detectDropSignal(text)) {
      chatAnalytics.dropSignals += 1;
      pushAnalyticsEvent('drop_signal', { text: text.slice(0, 160) });
      return res.json({
        success: true,
        intent: 'goodbye',
        reply: `Cam on ban da chat voi EATOMO. Khi can ho tro tiep, nhan tin bat cu luc nao.\n${supportFooter()}`,
        suggestions: ['Tu van cho rieng ban', 'Don hang cua toi']
      });
    }

    incIntentCount(intent);
    pushAnalyticsEvent('intent_detected', {
      intent,
      confidence: intentMeta.confidence,
      ambiguous: intentMeta.ambiguous
    });

    if (shouldAskClarifyingQuestion(text, intentMeta) && (intent === 'fallback' || intentMeta.ambiguous)) {
      chatAnalytics.clarifyCount += 1;
      incUnresolved(intent);
      const clarification = buildClarifyingResponse(intentMeta, sessionMemory);
      return res.json({
        success: true,
        intent: 'clarify',
        confidence: intentMeta.confidence,
        reply: `${clarification.reply}\n${buildSessionMemoryHint(sessionMemory)}`.trim(),
        suggestions: clarification.suggestions
      });
    }

    if (isInternalQuery(text)) {
      chatAnalytics.handoffCount += 1;
      incUnresolved('internal_blocked');
      return res.json({
        success: true,
        intent: 'internal_blocked',
        reply:
          `Xin loi, minh khong the cung cap thong tin noi bo he thong. Minh co the ho tro ban ve don hang, voucher, thanh toan, giao hang va goi y mon phu hop.\n${supportFooter()}`,
        suggestions: ['Đơn hàng của tôi', 'Voucher hiện có', 'Gợi ý bowl giảm cân']
      });
    }

    if (intent === 'order_lookup') {
      const result = await handleOrderLookup(text, userId);
      return res.json(result);
    }

    if (intent === 'cancel_order') {
      const result = await handleCancelOrder(text, userId);
      return res.json(result);
    }

    if (intent === 'voucher_check') {
      const result = await handleVoucherCheck(text);
      return res.json(result);
    }

    if (intent === 'nutrition_coaching') {
      const result = await buildNutritionAdvice(text, history);
      return res.json(result);
    }

    if (intent === 'customer_faq') {
      const faqAction = getCustomerFaqAction(text);
      const areaHint = sessionMemory.area ? ` Ban dang o ${sessionMemory.area}, minh uu tien goi y co so gan khu vuc nay.` : '';
      return res.json({
        success: true,
        intent,
        reply: `${answerCustomerFaq(text)}${areaHint}`,
        action: faqAction || undefined,
        suggestions: ['Tư vấn cho riêng bạn', 'Voucher nào đang dùng được?', 'Địa chỉ giao hàng ở đâu?']
      });
    }

    if (intent === 'off_topic') {
      const llmReply = await answerByLLM(text, history);
      return res.json({
        success: true,
        intent,
        reply: llmReply || answerSmartOffTopic(text, history),
        suggestions: ['Tối ưu kế hoạch học', 'Quyết định nhanh', 'Gợi ý hành động 3 bước']
      });
    }

    if (intent === 'greeting') {
      const memoryHint = buildSessionMemoryHint(sessionMemory);
      return res.json({
        success: true,
        intent,
        reply: `Chào bạn. Mình có thể hỗ trợ đơn hàng, voucher, gợi ý bowl và các câu hỏi về EATOMO.${memoryHint ? ` ${memoryHint}` : ''}`,
        suggestions: ['Đơn hàng của tôi', 'Voucher hiện có', 'Gợi ý bowl giảm cân']
      });
    }

    if (intent === 'order_status') {
      if (!userId) {
        return res.json({
          success: true,
          intent,
          reply: 'Bạn cần đăng nhập để mình tra cứu đơn hàng của bạn chính xác.',
          requiresAuth: true,
          suggestions: ['Đăng nhập', 'Tra cứu đơn hàng sau khi đăng nhập']
        });
      }

      const orders = await Order.find({ userId })
        .sort({ createdAt: -1 })
        .limit(3)
        .select('orderNumber status totalAmount createdAt')
        .lean();

      if (orders.length === 0) {
        return res.json({
          success: true,
          intent,
          reply: 'Bạn chưa có đơn hàng nào. Mình có thể gợi ý một số bowl phù hợp cho bạn.',
          data: { orders: [] },
          suggestions: ['Gợi ý bowl', 'Xem menu']
        });
      }

      const lines = orders.map((o, idx) => {
        return `${idx + 1}. ${o.orderNumber} - ${o.status} - ${formatCurrency(o.totalAmount)}`;
      });

      return res.json({
        success: true,
        intent,
        reply: `Đây là 3 đơn gần nhất của bạn:\n${lines.join('\n')}`,
        data: { orders }
      });
    }

    if (intent === 'voucher_info') {
      const now = new Date();
      const vouchers = await Voucher.find({
        isActive: true,
        validFrom: { $lte: now },
        $or: [{ validUntil: null }, { validUntil: { $gte: now } }],
        $expr: { $lt: ['$currentUses', '$maxUses'] }
      })
        .sort({ createdAt: -1 })
        .limit(8)
        .select('code discountType discountValue minOrderValue maxDiscountAmount')
        .lean();

      if (vouchers.length === 0) {
        return res.json({
          success: true,
          intent,
          reply: 'Hiện tại không có voucher khả dụng nào.',
          data: { vouchers: [] }
        });
      }

      const lines = vouchers.map((v) => {
        const discount = v.discountType === 'percentage'
          ? `${v.discountValue}%`
          : formatCurrency(v.discountValue);
        const minOrder = v.minOrderValue > 0 ? `, đơn tối thiểu ${formatCurrency(v.minOrderValue)}` : '';
        return `- ${v.code}: giảm ${discount}${minOrder}`;
      });

      return res.json({
        success: true,
        intent,
        reply: `Voucher hiện có:\n${lines.join('\n')}`,
        data: { vouchers }
      });
    }

    if (intent === 'bowl_recommendation') {
      const category = mapCategoryFromMessage(text);
      const bowlsRaw = await Bowl.find({ category, inStock: true })
        .sort({ isFeatured: -1, price: 1 })
        .limit(12)
        .select('_id name category calories protein carbs fat price')
        .lean();

      let bowls = bowlsRaw;
      if (sessionMemory.noBeef) {
        bowls = bowls.filter((b) => !/beef|bo\b/i.test(String(b.name || '')));
      }
      if (sessionMemory.budget) {
        bowls = bowls.filter((b) => Number(b.price || 0) <= sessionMemory.budget);
      }
      bowls = bowls.slice(0, 5);

      if (bowls.length === 0) {
        return res.json({
          success: true,
          intent,
          reply: 'Nhóm bowl này tạm hết hàng. Bạn thử nhóm balanced nhé.',
          data: { category, bowls: [] }
        });
      }

      const lines = bowls.map((b) => {
        return `- ${b.name}: ${formatCurrency(b.price)} | ${b.calories} kcal | ${b.protein}P-${b.carbs}C-${b.fat}F`;
      });

      return res.json({
        success: true,
        intent,
        reply: `Gợi ý bowl nhóm ${category}:\n${lines.join('\n')}\n${buildSessionMemoryHint(sessionMemory)}`.trim(),
        data: { category, bowls }
      });
    }

    chatAnalytics.fallbackCount += 1;
    chatAnalytics.handoffCount += 1;
    incUnresolved('fallback');
    pushAnalyticsEvent('fallback', { text: text.slice(0, 160), confidence: intentMeta.confidence });

    return res.json({
      success: true,
      intent: 'fallback',
      action: 'redirect_about_us',
      reply: `${answerUnknownIntent(text)}\n${buildSessionMemoryHint(sessionMemory)}\n${supportFooter()}`.trim(),
      suggestions: ['Liên hệ hỗ trợ', 'Đơn hàng của tôi', 'Voucher hiện có']
    });
  } catch (error) {
    console.error('Chat ask error:', error);
    return res.status(500).json({ success: false, message: 'Failed to process chat request', error: error.message });
  }
};

exports.getAnalytics = async (_req, res) => {
  const intentEntries = Object.entries(chatAnalytics.intentCounts).sort((a, b) => b[1] - a[1]);
  const topIntents = intentEntries.slice(0, 8).map(([intent, count]) => ({ intent, count }));
  const unresolvedTotal = Object.values(chatAnalytics.unresolvedByIntent).reduce((s, n) => s + n, 0);

  return res.json({
    success: true,
    analytics: {
      totalRequests: chatAnalytics.totalRequests,
      fallbackCount: chatAnalytics.fallbackCount,
      clarifyCount: chatAnalytics.clarifyCount,
      handoffCount: chatAnalytics.handoffCount,
      dropSignals: chatAnalytics.dropSignals,
      unresolvedTotal,
      topIntents,
      unresolvedByIntent: chatAnalytics.unresolvedByIntent,
      lastEvents: chatAnalytics.lastEvents
    }
  });
};
