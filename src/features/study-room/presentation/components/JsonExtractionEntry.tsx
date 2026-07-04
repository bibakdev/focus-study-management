import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import {
  Alert,
  Keyboard,
  Pressable,
  Text,
  TextInput,
  View
} from 'react-native';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';

interface JsonExtractionEntryProps {
  onExtract: (jsonString: string) => void;
  isLoading?: boolean;
}

const DEFAULT_OCR_PROMPT = `تو یک موتور استخراج داده (OCR) و پردازش تصویر بسیار دقیق هستی.
وظیفه شما:
بررسی دقیق اسکرین‌شات‌های ارسال شده از لیست کاربران و استخراج اطلاعات آن‌ها دقیقاً مطابق با تصویر.
قوانین استخراج (بسیار مهم):
۱): باید دقیقاً عین تصویر استخراج شود. رعایت حروف بزرگ و کوچک، فاصله‌ها، اعداد، کاراکترهای خاص و حتی ایموجی‌ها الزامی است. نباید هیچ تغییری در نام ایجاد کنی.
۲): دقیقاً زمانی که در بخش "Today" برای هر کاربر نوشته شده است را استخراج کن (مثلاً "50m" یا "2h 4m").
۳): اگر در زیر نام کاربر کلمه "Focusing..." همراه با آیکون تایمر وجود داشت، مقدار آن را true قرار بده، در غیر این صورت false بگذار.
۴): اگر کاربری تایم صفر یا بالای ۱۸ ساعت داشت، او را کلاً در نظر نگیر و در فایل JSON قرار نده.
قوانین خروجی (اخطار جدی):
خروجی تو فقط و فقط باید یک آرایه JSON معتبر (Valid JSON) باشد.
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

export function JsonExtractionEntry({
  onExtract,
  isLoading
}: JsonExtractionEntryProps) {
  const [jsonInput, setJsonInput] = useState('');

  // استیت‌های مربوط به باکس پرامپت
  const [promptText, setPromptText] = useState(DEFAULT_OCR_PROMPT);
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);

  const handleCopyPrompt = async () => {
    await Clipboard.setStringAsync(promptText);
    Alert.alert(
      'کپی شد',
      'پرامپت در حافظه (Clipboard) ذخیره شد. حالا می‌توانید آن را برای هوش مصنوعی ارسال کنید.'
    );
  };

  const handleExtract = () => {
    if (!jsonInput.trim()) {
      alert('لطفاً اطلاعات JSON را وارد کنید.');
      return;
    }

    try {
      JSON.parse(jsonInput);
      onExtract(jsonInput.trim());
      Keyboard.dismiss();
    } catch (error) {
      alert('ساختار JSON نامعتبر است. لطفاً کدها را بررسی کنید.');
    }
  };

  return (
    <View className="bg-surface-card rounded-3xl p-5 shadow-sm border border-surface-muted mt-4 overflow-hidden">
      {/* هدر کامپوننت */}
      <View className="flex-row justify-end items-center gap-2 mb-4">
        <Text className="text-text-primary font-bold text-base font-main">
          استخراج هوشمند از JSON
        </Text>
        <Ionicons name="flash" size={20} color="#4f46e5" />
      </View>

      {/* باکس پرامپت تعاملی و انیمیت‌شده */}
      <Animated.View
        layout={Layout.springify().damping(15)}
        className="bg-primary-light/20 border border-primary-light/50 rounded-2xl p-4 mb-5 overflow-hidden"
      >
        <View className="flex-row justify-between items-center mb-2">
          <Pressable
            onPress={handleCopyPrompt}
            className="bg-primary-light/50 px-3 py-1.5 rounded-lg flex-row items-center gap-1.5 active:scale-95 transition-transform"
          >
            <Ionicons name="copy-outline" size={14} color="#4f46e5" />
            <Text className="text-primary-main font-bold font-main text-xs">
              کپی پرامپت
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setIsPromptExpanded(!isPromptExpanded)}
            className="flex-row items-center gap-2 flex-1 justify-end active:opacity-70 transition-opacity"
          >
            <Text className="text-primary-main font-bold font-main text-sm text-right">
              پرامپت استخراج هوش مصنوعی
            </Text>
            <Ionicons
              name={isPromptExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="#4f46e5"
            />
          </Pressable>
        </View>

        {isPromptExpanded ? (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
          >
            <TextInput
              className="w-full bg-surface-card border border-primary-light/40 rounded-xl p-3 mt-2 text-text-secondary text-xs font-main focus:border-primary-main transition-colors"
              style={
                {
                  minHeight: 250,
                  textAlign: 'right',
                  textAlignVertical: 'top',
                  outlineStyle: 'none'
                } as any
              }
              multiline={true}
              value={promptText}
              onChangeText={setPromptText}
            />
          </Animated.View>
        ) : (
          <Pressable onPress={() => setIsPromptExpanded(true)}>
            <Text
              className="text-text-secondary font-main text-xs leading-5 text-right opacity-80 mt-1"
              numberOfLines={2}
            >
              {promptText}
            </Text>
          </Pressable>
        )}
      </Animated.View>

      {/* فیلد ورود کد JSON */}
      <View className="mb-5">
        <TextInput
          className="w-full bg-surface-main border border-surface-muted rounded-xl p-4 text-text-primary text-sm font-mono focus:border-primary-main focus:bg-primary-light/10 transition-colors"
          style={
            {
              minHeight: 120,
              textAlign: 'left',
              textAlignVertical: 'top',
              direction: 'ltr',
              outlineStyle: 'none'
            } as any
          }
          placeholder={`[\n  { "name": "moein", "today_time": "51m", "isFocussing": false }\n]`}
          placeholderTextColor="#94a3b8"
          multiline={true}
          numberOfLines={5}
          value={jsonInput}
          onChangeText={setJsonInput}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
        />
      </View>

      {/* دکمه اکشن */}
      <Pressable
        disabled={isLoading}
        onPress={handleExtract}
        className={`bg-primary-main py-3.5 rounded-2xl items-center flex-row justify-center gap-2 active:scale-95 transition-transform ${isLoading ? 'opacity-70' : 'opacity-100'}`}
      >
        <Text className="text-white font-bold font-main text-sm">
          پردازش و انتقال به لیست نهایی
        </Text>
      </Pressable>
    </View>
  );
}
