// src/features/study-room/data/services/gemini.service.ts

const DEFAULT_OCR_PROMPT = `تو یک موتور استخراج داده (OCR) و پردازش تصویر بسیار دقیق هستی.
وظیفه شما:
بررسی دقیق اسکرین‌شات‌های ارسال شده از لیست کاربران و استخراج اطلاعات آن‌ها دقیقاً مطابق با تصویر. (ممکن است چند تصویر همزمان ارسال شده باشد، همه را با هم بررسی و ترکیب کن).
قوانین استخراج (بسیار مهم):
۱): باید دقیقاً عین تصویر استخراج شود. رعایت حروف بزرگ و کوچک، فاصله‌ها، اعداد، کاراکترهای خاص و حتی ایموجی‌ها الزامی است. نباید هیچ تغییری در نام ایجاد کنی.
۲): دقیقاً زمانی که در بخش "Today" برای هر کاربر نوشته شده است را استخراج کن (مثلاً "50m" یا "2h 4m").
۳): اگر در زیر نام کاربر کلمه "Focusing..." همراه با آیکون تایمر وجود داشت، مقدار آن را true قرار بده، در غیر این صورت false بگذار.
۴): اگر کاربری تایم صفر یا بالای ۱۸ ساعت داشت، او را کلاً در نظر نگیر و در فایل JSON قرار نده.
قوانین خروجی (اخطار جدی):
خروجی تو فقط و فقط باید یک آرایه JSON معتبر (Valid JSON) یکپارچه از تمام عکس‌ها باشد.
هیچ کلمه، جمله، توضیح، مقدمه (مثل "بفرمایید") یا موخره‌ای قبل و بعد از JSON ننویس.
ساختار کلیدها (Keys) نباید تحت هیچ شرایطی تغییر کند.
فرمت دقیق خروجی:
[
  {
    "name": "string",
    "today_time": "string",
    "isFocussing": boolean
  }
]`;

export class GeminiService {
  /**
   * ارسال آرایه‌ای از تصاویر به Gemini و دریافت JSON
   */
  static async extractDataFromImages(
    base64Images: string[],
    apiKey: string
  ): Promise<string> {
    const modelName = 'gemini-3.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    // تبدیل هر عکس Base64 به آبجکت استاندارد Gemini
    const imageParts = base64Images.map((base64) => ({
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64
      }
    }));

    const payload = {
      contents: [
        {
          parts: [{ text: DEFAULT_OCR_PROMPT }, ...imageParts]
        }
      ],
      generationConfig: {
        temperature: 0.1, // پایین‌ترین دما برای جلوگیری از توهم و حفظ ساختار JSON
        topK: 1,
        topP: 1
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error?.message || 'خطا در ارتباط با سرور هوش مصنوعی'
      );
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      throw new Error('پاسخی از هوش مصنوعی دریافت نشد.');
    }

    return textContent;
  }
}
