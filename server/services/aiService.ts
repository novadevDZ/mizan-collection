import { GoogleGenAI } from '@google/genai';

export interface GenerateMessageParams {
  customerName: string;
  companyName?: string;
  outstandingAmount: number;
  oldestOverdueDays: number;
  invoiceNumber?: string;
  tone: 'friendly' | 'professional' | 'firm' | 'final_reminder';
  channel: 'whatsapp' | 'sms';
  merchantName?: string;
}

export interface AiRiskAnalysisParams {
  customerName: string;
  companyName?: string;
  outstandingAmount: number;
  overdueAmount: number;
  daysOverdue: number;
  creditLimit: number;
  riskScore: number;
  brokenPromisesCount: number;
}

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

/**
 * Fallback message generator if API key is not present or API call encounters error
 */
function getFallbackMessage(params: GenerateMessageParams): string {
  const formattedAmount = new Intl.NumberFormat('ar-DZ').format(params.outstandingAmount) + ' دج';
  const name = params.customerName;
  const inv = params.invoiceNumber ? ` المتعلق بالفاتورة رقم ${params.invoiceNumber}` : '';
  const merchant = params.merchantName || 'مؤسستنا';

  switch (params.tone) {
    case 'friendly':
      return `السلام عليكم أخي ${name}، نرجو أن تكون بخير وصحة وعافية.\nنود فقط تذكيركم بلطف بوجود رصيد مستحق قدره ${formattedAmount}${inv}.\nنرجو منكم تحديد موعد لتسوية المبلغ في أقرب فرصة ودمتم شركاء نجاح لنا، بارك الله فيكم.`;
    
    case 'professional':
      return `تحية طيبة سيدي ${name}،\nنحيطكم علماً بوجود رصيد تجاري مستحق الدفع قدره ${formattedAmount}${inv} وهو متأخر عن أجل الاستحقاق (${params.oldestOverdueDays} يوماً).\nيرجى التفضل بموافاتنا بوصل الدفع أو تحديد موعد التحصيل لتسوية كشف الحساب.\nشكراً لتعاونكم مع ${merchant}.`;

    case 'firm':
      return `السلام عليكم سيدي ${name}،\nنلفت انتباهكم إلى أن المبلغ المستحق قدره ${formattedAmount} قد تجاوز مهلة السداد المحددة بـ ${params.oldestOverdueDays} يوماً.\nنرجو منكم أخذ هذا الإشعار بعين الاعتبار والعمل على سداد الرصيد خلال 48 ساعة للحفاظ على استمرارية المعاملات التجارية وتفادي أي تعليق للطلبيات الجديدة. تقبلوا فائق الاحترام.`;

    case 'final_reminder':
      return `إشعار أخير لتسوية الحساب:\nإلى السيد ${name}، نذكركم للمرة الأخيرة بأن الرصيد غير المسدد والبالغ ${formattedAmount} قد تجاوز كافة الآجال الممنوحة (${params.oldestOverdueDays} يوماً).\nنرجو التوجه لتسوية المبلغ فوراً لتفادي تجميد الحساب التجاري نهائياً وإحالة الملف إلى الإجراءات النظامية المعتمدة.\nإدارة التحصيل - ${merchant}.`;

    default:
      return `السلام عليكم ${name}، نذكركم بوجود مبلغ مستحق قدره ${formattedAmount}. نرجو تسوية المبلغ وشكراً لتعاونكم.`;
  }
}

const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
];

function callWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('AI generation timed out')), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

/**
 * Execute Gemini model generation with automatic retries and multi-model fallback.
 * Prevents 503 UNAVAILABLE / high-demand errors from breaking the user experience.
 */
async function generateWithFallback(client: GoogleGenAI, prompt: string): Promise<string | null> {
  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await callWithTimeout(
        client.models.generateContent({
          model,
          contents: prompt,
        }),
        3500
      );

      const text = response.text?.trim();
      if (text) {
        return text;
      }
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      const isHighDemandOrTransient =
        errMsg.includes('503') ||
        errMsg.includes('high demand') ||
        errMsg.includes('UNAVAILABLE') ||
        errMsg.includes('429') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.includes('timed out');

      if (isHighDemandOrTransient) {
        continue;
      }
      continue;
    }
  }
  return null;
}

export async function generateCollectionMessage(params: GenerateMessageParams): Promise<{ message: string; source: 'gemini' | 'deterministic_template'; isFallback?: boolean }> {
  const client = getAiClient();
  if (!client) {
    return {
      message: getFallbackMessage(params),
      source: 'deterministic_template',
      isFallback: true,
    };
  }

  try {
    const formattedAmount = new Intl.NumberFormat('ar-DZ').format(params.outstandingAmount) + ' دج';
    
    const prompt = `أنت مساعد تحصيل ذكي متخصص في قطاع التجارة والتوزيع في الجزائر (MIZAN COLLECTION).
اكتب رسالة ${params.channel === 'whatsapp' ? 'واتساب' : 'SMS'} موجهة إلى الزبون/التاجر باللغة العربية الفصحى الواضحة والمهذبة المتداولة في التجارة الجزائرية.

بيانات الزبون:
- اسم الزبون: ${params.customerName}
- اسم الشركة أو المحل: ${params.companyName || 'بدون اسم تجاري'}
- المبلغ المستحق بدقة: ${formattedAmount}
- عدد أيام التأخير: ${params.oldestOverdueDays} يوماً
${params.invoiceNumber ? `- رقم الفاتورة: ${params.invoiceNumber}` : ''}
- النبرة المطلوبة: ${params.tone} (خيارات النبرة: friendly: ودية ومحترمة، professional: مهنية كلاسيكية، firm: حازمة وجدية، final_reminder: إنذار أخير قبل تعليق التوريد)
- اسم المورد: ${params.merchantName || 'مؤسستنا'}

قواعد صارمة جداً:
1. لا تغير أي رقم مالي ولا تخترع أي مبلغ من عندك إطلاقاً. المبلغ هو فقط: ${formattedAmount}.
2. كن مهذباً وقانونياً ومهنياً. تجنب أي تهديد شخصي، إهانة، أو تشهير.
3. اكتب نص الرسالة فقط بدون أي مقدمات أو شروحات جانبية، لتكون جاهزة للنسخ أو الإرسال مباشرة بنقرة واحدة.
4. حافظ على الإيجاز لتناسب الرسائل السريعة.`;

    const text = await generateWithFallback(client, prompt);
    if (text) {
      return { message: text, source: 'gemini', isFallback: false };
    }

    return { message: getFallbackMessage(params), source: 'deterministic_template', isFallback: true };
  } catch {
    return { message: getFallbackMessage(params), source: 'deterministic_template', isFallback: true };
  }
}

export interface ParsedProductResult {
  name: string;
  barcode?: string;
  category: string;
  unit: string;
  purchasePrice: number;
  salePrice: number;
  minSalePrice?: number;
  packaging?: string;
  stockQuantity: number;
  minStockAlert: number;
}

export async function explainRiskScoreWithAi(params: AiRiskAnalysisParams): Promise<string> {
  const client = getAiClient();
  const formattedAmount = new Intl.NumberFormat('ar-DZ').format(params.outstandingAmount) + ' دج';
  const formattedOverdue = new Intl.NumberFormat('ar-DZ').format(params.overdueAmount) + ' دج';

  const defaultExplanation = `العميل لديه ديون مستحقة بقيمة ${formattedAmount} منها ${formattedOverdue} متأخرة عن موعدها بـ ${params.daysOverdue} يوماً، ومؤشر الخطر المحسوب هو ${params.riskScore}/100. يُوصى بجدولة متابعة هاتفية فورية قبل توريد أي بضاعة جديدة.`;

  if (!client) {
    return defaultExplanation;
  }

  try {
    const prompt = `بصفتك محلل مخاطر ائتمانية للشركات وتجار الجملة في الجزائر:
اشرح باختصار وبلغة عربية مباشرة في 2-3 أسطر لماذا حصل هذا العميل على درجة خطر ${params.riskScore}/100 بناءً على المعطيات الدقيقة التالية فقط (لا تخترع بيانات غير مذكورة):
- العميل: ${params.customerName}
- إجمالي الرصيد القائم: ${formattedAmount}
- الرصيد المتأخر: ${formattedOverdue}
- مدة التأخير: ${params.daysOverdue} يوماً
- الحد الائتماني: ${new Intl.NumberFormat('ar-DZ').format(params.creditLimit)} دج
- عدد وعود السداد المنكوبة (Broken Promises): ${params.brokenPromisesCount}

اكتب تفسيراً عملياً ونصحاً واقعياً للتاجر، بدون مصطلحات معقدة.`;

    const text = await generateWithFallback(client, prompt);
    return text || defaultExplanation;
  } catch {
    return defaultExplanation;
  }
}

/**
 * Intelligent fallback parser for merchant text (WhatsApp, SMS, invoices, voice transcripts)
 */
function fallbackRegexParseProducts(rawText: string): ParsedProductResult[] {
  const lines = rawText
    .split(/\r?\n|;/)
    .map(l => l.trim())
    .filter(l => l.length > 2);

  const results: ParsedProductResult[] = [];

  for (const line of lines) {
    // Strip leading numbering e.g. "1.", "1)", "-"
    const cleanLine = line.replace(/^[\d\s.\-•*)+]+/, '').trim();
    if (!cleanLine) continue;

    // Detect Barcode (e.g. 13 digits or 8-14 digits)
    const barcodeMatch = cleanLine.match(/\b(613\d{10}|\d{8,14})\b/);
    const barcode = barcodeMatch ? barcodeMatch[1] : undefined;

    // Detect prices (looking for words like شراء, بيع, prix, achat, vente, دج, DA, or numbers)
    let purchasePrice = 0;
    let salePrice = 0;

    const purchaseMatch = cleanLine.match(/(?:شراء|تكلفة|achat|cost)\s*[:=\-]?\s*(\d+[\d\s.,]*)/i);
    const saleMatch = cleanLine.match(/(?:بيع|سعر|vente|price)\s*[:=\-]?\s*(\d+[\d\s.,]*)/i);

    if (purchaseMatch) {
      purchasePrice = parseFloat(purchaseMatch[1].replace(/[\s,]/g, '')) || 0;
    }
    if (saleMatch) {
      salePrice = parseFloat(saleMatch[1].replace(/[\s,]/g, '')) || 0;
    }

    // If only standalone numbers are present (e.g. "حليب كونديا 120 140 50")
    const allNumbers = cleanLine.match(/\b\d+(?:\.\d+)?\b/g);
    if ((!purchasePrice || !salePrice) && allNumbers && allNumbers.length >= 2) {
      const nums = allNumbers
        .map(n => parseFloat(n))
        .filter(n => n !== 1 && n !== 5 && n !== 2 && n !== 10 && (!barcode || n !== parseFloat(barcode))); // filter common sizes like 1L, 5L
      if (nums.length >= 2) {
        if (!purchasePrice) purchasePrice = nums[0];
        if (!salePrice) salePrice = nums[1] > nums[0] ? nums[1] : Math.round(nums[0] * 1.15);
      }
    }

    // Detect quantity
    let quantity = 1;
    const qtyMatch = cleanLine.match(/(?:كمية|مخزون|عدد|qte|quantité|stock)\s*[:=\-]?\s*(\d+)/i);
    if (qtyMatch) {
      quantity = parseInt(qtyMatch[1], 10) || 1;
    } else {
      const lastNumMatch = cleanLine.match(/\b(\d+)\s*(?:قطعة|علبة|كرتونة|حزمة|bouteille|carton|pièce|boite)\b/i);
      if (lastNumMatch) {
        quantity = parseInt(lastNumMatch[1], 10) || 1;
      }
    }

    // Detect unit
    let unit = 'قطعة';
    if (/كرتون|carton/i.test(cleanLine)) unit = 'كرتونة';
    else if (/علبة|boite|pack/i.test(cleanLine)) unit = 'علبة';
    else if (/كغ|كيلو|kg/i.test(cleanLine)) unit = 'كيلوغرام';
    else if (/لتر|litre|l\b/i.test(cleanLine)) unit = 'لتر';
    else if (/حزمة|fardeau/i.test(cleanLine)) unit = 'حزمة';

    // Detect category
    let category = 'مواد غذائية عامة';
    if (/حليب|جبن|لبن|ياغورت|زبادي|فرماج|lait|fromage/i.test(cleanLine)) category = 'مشروبات وألبان';
    else if (/زيت|سكر|طماطم|عجائن|معكرونة|كسكسي|أرز|قهوة|huile|sucre|café/i.test(cleanLine)) category = 'مواد غذائية عامة';
    else if (/إيزيس|أومو|صابون|منظف|جافيل|غسيل|detergent|savon/i.test(cleanLine)) category = 'منظفات ومواد تعقيم';
    else if (/شامبو|كريم|عطر|شامبوان|كوسميتيك|cosmetique/i.test(cleanLine)) category = 'عناية وتجميل';
    else if (/إلكترونيات|شاحن|كابل|هاتف|بطارية/i.test(cleanLine)) category = 'إلكترونيات وهواتف';
    else if (/خردوات|دهان|بناء|quincaillerie/i.test(cleanLine)) category = 'خردوات ومواد بناء';

    // Packaging detection (e.g. 12 علبة / كرتون)
    const packMatch = cleanLine.match(/\b(\d+)\s*(?:علبة|قطعة|قارورة|قوارير)\s*(?:\/|\sفي\s)\s*(?:الكرتون|كرتونة|حزمة)/i);
    const packaging = packMatch ? `${packMatch[1]} وحدة / كرتون` : undefined;

    // Clean name: take everything before the price/qty markers
    let name = cleanLine
      .replace(/(?:شراء|تكلفة|بيع|سعر|كمية|مخزون|achat|vente|qte|prix).*$/i, '')
      .replace(/\b(613\d{10}|\d{8,14})\b/, '')
      .trim();

    if (!name || name.length < 2) {
      name = cleanLine.split(/[-–—,]/)[0].trim();
    }

    if (name) {
      // Ensure sensible prices
      if (purchasePrice <= 0 && salePrice > 0) purchasePrice = Math.round(salePrice * 0.85);
      if (salePrice <= 0 && purchasePrice > 0) salePrice = Math.round(purchasePrice * 1.15);
      if (salePrice <= 0 && purchasePrice <= 0) {
        salePrice = 100;
        purchasePrice = 85;
      }

      results.push({
        name,
        barcode,
        category,
        unit,
        purchasePrice,
        salePrice,
        minSalePrice: Math.round(purchasePrice * 1.05),
        packaging,
        stockQuantity: quantity || 10,
        minStockAlert: 5,
      });
    }
  }

  return results;
}

/**
 * Smart AI Parser for extracting structured products from free text (messages, invoices, notes, speech)
 */
export async function parseProductsWithAi(rawText: string): Promise<{
  products: ParsedProductResult[];
  source: 'gemini' | 'regex_parser';
}> {
  if (!rawText || !rawText.trim()) {
    return { products: [], source: 'regex_parser' };
  }

  const client = getAiClient();
  if (client) {
    try {
      const prompt = `You are an expert Algerian wholesale and distribution inventory assistant.
Parse the following raw text (which may be a supplier delivery note, WhatsApp order, voice dictation in Algerian Arabic/French, or Excel paste) and extract all distinct commercial products into structured JSON.

For each product, return:
- name: Clear product trade name in Arabic or French (e.g. "حليب كونديا 1 لتر", "زيت إيليو 5 لتر", "مسحوق إيزيس 3 كغ").
- barcode: EAN-13 or barcode string if present in text, or null.
- category: One of ["مواد غذائية عامة", "مشروبات وألبان", "منظفات ومواد تعقيم", "عناية وتجميل", "خردوات ومواد بناء", "إلكترونيات وهواتف", "أخرى"].
- unit: Unit in Arabic, e.g. "قطعة", "كرتونة", "علبة", "كيلوغرام", "لتر", "حزمة".
- purchasePrice: Cost/purchase price in Algerian Dinars (DZD) as a number. If missing, estimate reasonably from salePrice (e.g. ~85% of salePrice).
- salePrice: Selling price in DZD as a number. If missing, estimate from purchasePrice + 15%.
- minSalePrice: Safe minimum selling price (must be >= purchasePrice).
- packaging: e.g. "12 قطعة / كرتونة" if mentioned, or null.
- stockQuantity: Stock quantity mentioned, or 10 if not specified.
- minStockAlert: Minimum stock alert threshold (default 5).

Input text:
"""
${rawText}
"""

Return ONLY a valid JSON array of objects. No explanations or code fences.`;

      const responseText = await generateWithFallback(client, prompt);
      if (responseText) {
        const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validated = parsed.map((p: any) => ({
            name: String(p.name || 'منتج غير مسمى').trim(),
            barcode: p.barcode ? String(p.barcode).trim() : undefined,
            category: String(p.category || 'مواد غذائية عامة').trim(),
            unit: String(p.unit || 'قطعة').trim(),
            purchasePrice: Math.max(0, Number(p.purchasePrice) || 0),
            salePrice: Math.max(0, Number(p.salePrice) || 0),
            minSalePrice: Math.max(0, Number(p.minSalePrice) || Math.round((Number(p.purchasePrice) || 0) * 1.05)),
            packaging: p.packaging ? String(p.packaging).trim() : undefined,
            stockQuantity: Math.max(0, Number(p.stockQuantity) || 0),
            minStockAlert: Math.max(1, Number(p.minStockAlert) || 5),
          }));
          return { products: validated, source: 'gemini' };
        }
      }
    } catch {
      // Fall through to regex parser
    }
  }

  // Fallback to deterministic regex parser
  const fallbackProducts = fallbackRegexParseProducts(rawText);
  return { products: fallbackProducts, source: 'regex_parser' };
}
