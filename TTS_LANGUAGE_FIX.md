# TTS Language Selection Fix - Testing Guide

## 🎯 What Was Fixed

### **Problem:**
When users selected a language during the call (e.g., Hindi, Telugu), there were TWO issues:
1. ❌ Speech Recognition continued listening in the OLD language (usually English)
2. ❌ User's voice input in the new language wasn't being recognized properly
3. ❌ **CRITICAL**: Sometimes Telugu text was being sent to TTS with "English" language parameter, causing TTS to fail

### **Solution:**
Implemented a comprehensive fix with THREE components:
1. ✅ **Dynamic Language Switching**: Detects when user selects a new language and restarts speech recognition
2. ✅ **State Synchronization**: Added selectedLanguage to stateRef to prevent stale closure issues
3. ✅ **Automatic Language Detection**: Analyzes text content and auto-corrects language parameter if mismatch detected

---

## 🔧 Changes Made

### **1. VoiceOverlay.jsx - Dynamic Language Switching**
- Added a new `useEffect` hook that monitors `selectedLanguage.code` changes
- When language changes:
  - Stops current recognition
  - Reinitializes with new language
  - Restarts recognition after 500ms delay
- Added detailed console logging for debugging

### **2. VoiceOverlay.jsx - State Synchronization**
- Added `selectedLanguage` to `stateRef` to prevent stale closures
- Ensures all event handlers have access to the latest language selection

### **3. VoiceOverlay.jsx - Automatic Language Detection**
- Added Unicode script detection for all supported languages:
  - Telugu: `\u0C00-\u0C7F`
  - Hindi/Marathi: `\u0900-\u097F` (Devanagari)
  - Tamil: `\u0B80-\u0BFF`
  - Kannada: `\u0C80-\u0CFF`
  - Malayalam: `\u0D00-\u0D7F`
- If text contains Telugu script but language is "English", auto-corrects to "Telugu"
- Prevents TTS errors like: "Language: English, Text: తెలుగు"

### **4. ttsService.js**
- Added console logging to track TTS requests
- Shows: Language, Gender, and Text preview

---

## 🧪 How to Test

### **Step 1: Start the Application**
1. Ensure both servers are running:
   - Frontend: `npm run dev` (already running)
   - TTS Server: `python main.py` in `tts_server` folder (already running)

### **Step 2: Open Browser Console**
1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Keep it open to see the debug logs

### **Step 3: Start a Call**
1. Click on any company agent to start a call
2. Wait for Callix to greet you

### **Step 4: Test Language Selection**
1. When Callix asks for your name and language, say:
   - **"My name is [YourName] and I prefer Telugu"**
   - OR **"నా పేరు [YourName] మరియు నేను తెలుగు ఇష్టపడతాను"**

2. Watch the console for:
   ```
   🌐 Language changed to: Telugu (te-IN)
   ✅ Recognition restarted in Telugu
   🗣️ Speak called: Code="te-IN", Language="Telugu", Gender="female"
   🎤 TTS Request: Language="Telugu", Gender="female", Text="..."
   ```

### **Step 5: Verify Voice Recognition**
1. After language selection, speak in Telugu
2. Your Telugu speech should now be recognized correctly
3. Callix should respond in Telugu with Telugu TTS voice

### **Step 6: Test Other Languages**
Try these phrases:
- **Hindi**: "मेरा नाम [Name] है और मैं हिंदी पसंद करता हूं"
- **Tamil**: "என் பெயர் [Name] மற்றும் நான் தமிழ் விரும்புகிறேன்"
- **Kannada**: "ನನ್ನ ಹೆಸರು [Name] ಮತ್ತು ನಾನು ಕನ್ನಡ ಇಷ್ಟಪಡುತ್ತೇನೆ"

---

## 🔍 Debug Console Logs

You should see these logs in sequence:

### **1. Initial Call Start**
```
Recognition initialized
Call connected
```

### **2. Language Selection**
```
🌐 Language changed to: Telugu (te-IN)
Recognition stop failed: (or success)
✅ Recognition restarted in Telugu
```

### **3. TTS Request**
```
🗣️ Speak called: Code="te-IN", Language="Telugu", Gender="female"
Attempting TTS for Telugu...
🎤 TTS Request: Language="Telugu", Gender="female", Text="మిమ్మల్ని కలవడం సంతోషం..."
```

### **4. Backend Response**
```
--- New TTS Request ---
Language: Telugu
Cleaned Text: మిమ్మల్ని కలవడం సంతోషం...
Selected Voice: te-IN-ShrutiNeural
Success: Generated XXXXX bytes
```

---

## ✅ Expected Behavior

### **Before Fix:**
- User selects Telugu
- Groq responds in Telugu ✅
- TTS speaks in Telugu ✅
- User speaks in Telugu
- Recognition still listens in English ❌
- Telugu words not recognized ❌

### **After Fix:**
- User selects Telugu
- Groq responds in Telugu ✅
- TTS speaks in Telugu ✅
- Recognition switches to Telugu ✅
- User speaks in Telugu
- Telugu words recognized correctly ✅
- Conversation continues in Telugu ✅

---

## 🐛 Troubleshooting

### **Issue: Recognition not restarting**
**Check:**
- Console shows "Recognition restarted in [Language]"
- If not, check browser permissions for microphone

### **Issue: TTS not working in selected language**
**Check:**
- TTS server is running on port 8000
- Console shows TTS request with correct language
- Backend logs show voice selection

### **Issue: Wrong voice gender**
**Check:**
- Hospital agents should use female voice
- Other agents should use male voice
- Console shows correct gender in TTS request

---

## 📊 Supported Languages

| Language | Code | Male Voice | Female Voice |
|----------|------|------------|--------------|
| English | en-US | GuyNeural | AriaNeural |
| Hindi | hi-IN | MadhurNeural | SwararaNeural |
| Telugu | te-IN | MohanNeural | ShrutiNeural |
| Tamil | ta-IN | ValluvarNeural | PallaviNeural |
| Kannada | kn-IN | GaganNeural | SapnaNeural |
| Marathi | mr-IN | ManoharNeural | AarohiNeural |
| Malayalam | ml-IN | MidhunNeural | SobhanaNeural |

---

## 🎉 Success Criteria

The fix is working correctly if:
1. ✅ Console shows language change detection
2. ✅ Recognition restarts with new language code
3. ✅ TTS request shows correct language name
4. ✅ Backend generates audio with correct voice
5. ✅ User can speak and be understood in selected language
6. ✅ Entire conversation continues in selected language

---

## 📝 Notes

- Language detection happens during onboarding phase
- Recognition restart has a 500ms delay to ensure stability
- Fallback to browser TTS if backend fails
- Echo detection prevents infinite loops
- All language changes are logged for debugging
