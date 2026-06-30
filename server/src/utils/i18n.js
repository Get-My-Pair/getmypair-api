/**
 * Server-side i18n for API response messages.
 * Supported: en, kn, ta, hi, te
 */

const SUPPORTED_LANGUAGES = ['en', 'kn', 'ta', 'hi', 'te'];
const DEFAULT_LANGUAGE = 'en';

const messages = {
  en: {
    otp_sent: 'OTP sent successfully',
    login_success: 'Login successful',
    complete_profile: 'Please complete your profile',
    profile_completed: 'Profile completed successfully. Login successful.',
    token_refreshed: 'Token refreshed successfully',
    logout_success: 'Logout successful',
    user_retrieved: 'User retrieved successfully',
    language_updated: 'Language preference updated',
    mobile_required: 'Mobile number is required',
    mobile_invalid: 'Please provide a valid mobile number',
    otp_required: 'OTP is required',
    otp_invalid: 'OTP must be 6 digits',
    otp_numeric: 'OTP must be numeric',
    name_required: 'Name is required',
    dob_required: 'Date of birth is required',
    dob_invalid: 'Please provide a valid date of birth',
    age_min: 'You must be at least 18 years old',
    gender_required: 'Gender is required',
    gender_invalid: 'Gender must be one of: male, female, other',
    refresh_required: 'Refresh token is required',
    language_required: 'Language code is required',
    language_invalid: 'Language must be one of: en, kn, ta, hi, te',
    rate_limit: 'Too many OTP requests. Please try again later.',
    route_not_found: 'Route not found',
    server_running: 'Server is running',
  },
  kn: {
    otp_sent: 'OTP ಯಶಸ್ವಿಯಾಗಿ ಕಳುಹಿಸಲಾಗಿದೆ',
    login_success: 'ಲಾಗಿನ್ ಯಶಸ್ವಿ',
    complete_profile: 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಪೂರ್ಣಗೊಳಿಸಿ',
    profile_completed: 'ಪ್ರೊಫೈಲ್ ಪೂರ್ಣಗೊಂಡಿದೆ. ಲಾಗಿನ್ ಯಶಸ್ವಿ.',
    token_refreshed: 'ಟೋಕನ್ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ',
    logout_success: 'ಲಾಗ್ ಔಟ್ ಯಶಸ್ವಿ',
    user_retrieved: 'ಬಳಕೆದಾರರನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಪಡೆಯಲಾಗಿದೆ',
    language_updated: 'ಭಾಷೆ ಆದ್ಯತೆ ನವೀಕರಿಸಲಾಗಿದೆ',
    mobile_required: 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಅಗತ್ಯ',
    mobile_invalid: 'ಮಾನ್ಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ',
    otp_required: 'OTP ಅಗತ್ಯ',
    otp_invalid: 'OTP 6 ಅಂಕೆಗಳಾಗಿರಬೇಕು',
    otp_numeric: 'OTP ಸಂಖ್ಯೆಯಾಗಿರಬೇಕು',
    name_required: 'ಹೆಸರು ಅಗತ್ಯ',
    dob_required: 'ಜನ್ಮ ದಿನಾಂಕ ಅಗತ್ಯ',
    dob_invalid: 'ಮಾನ್ಯ ಜನ್ಮ ದಿನಾಂಕ ನಮೂದಿಸಿ',
    age_min: 'ನೀವು ಕನಿಷ್ಠ 18 ವರ್ಷ ವಯಸ್ಸಿನವರಾಗಿರಬೇಕು',
    gender_required: 'ಲಿಂಗ ಅಗತ್ಯ',
    gender_invalid: 'ಲಿಂಗ: male, female, other ಇವುಗಳಲ್ಲಿ ಒಂದು',
    refresh_required: 'ರಿಫ್ರೆಶ್ ಟೋಕನ್ ಅಗತ್ಯ',
    language_required: 'ಭಾಷೆ ಕೋಡ್ ಅಗತ್ಯ',
    language_invalid: 'ಭಾಷೆ: en, kn, ta, hi, te ಇವುಗಳಲ್ಲಿ ಒಂದು',
    rate_limit: 'ಹಲವಾರು OTP ವಿನಂತಿಗಳು. ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
    route_not_found: 'ಮಾರ್ಗ ಕಂಡುಬಂದಿಲ್ಲ',
    server_running: 'ಸರ್ವರ್ ಚಾಲನೆಯಲ್ಲಿದೆ',
  },
  ta: {
    otp_sent: 'OTP வெற்றிகரமாக அனுப்பப்பட்டது',
    login_success: 'உள்நுழைவு வெற்றி',
    complete_profile: 'உங்கள் சுயவிவரத்தை முடிக்கவும்',
    profile_completed: 'சுயவிவரம் முடிந்தது. உள்நுழைவு வெற்றி.',
    token_refreshed: 'டோக்கன் வெற்றிகரமாக புதுப்பிக்கப்பட்டது',
    logout_success: 'வெளியேறுதல் வெற்றி',
    user_retrieved: 'பயனர் வெற்றிகரமாக பெறப்பட்டார்',
    language_updated: 'மொழி விருப்பம் புதுப்பிக்கப்பட்டது',
    mobile_required: 'மொபைல் எண் தேவை',
    mobile_invalid: 'செல்லுபடியாகும் மொபைல் எண்ணை உள்ளிடவும்',
    otp_required: 'OTP தேவை',
    otp_invalid: 'OTP 6 இலக்கங்களாக இருக்க வேண்டும்',
    otp_numeric: 'OTP எண்ணாக இருக்க வேண்டும்',
    name_required: 'பெயர் தேவை',
    dob_required: 'பிறந்த தேதி தேவை',
    dob_invalid: 'செல்லுபடியாகும் பிறந்த தேதியை உள்ளிடவும்',
    age_min: 'நீங்கள் குறைந்தது 18 வயதாக இருக்க வேண்டும்',
    gender_required: 'பாலினம் தேவை',
    gender_invalid: 'பாலினம்: male, female, other',
    refresh_required: 'ரிஃப்ரெஷ் டோக்கன் தேவை',
    language_required: 'மொழி குறியீடு தேவை',
    language_invalid: 'மொழி: en, kn, ta, hi, te',
    rate_limit: 'பல OTP கோரிக்கைகள். பின்னர் முயற்சிக்கவும்.',
    route_not_found: 'பாதை கிடைக்கவில்லை',
    server_running: 'சர்வர் இயங்குகிறது',
  },
  hi: {
    otp_sent: 'OTP सफलतापूर्वक भेजा गया',
    login_success: 'लॉगिन सफल',
    complete_profile: 'कृपया अपनी प्रोफ़ाइल पूरी करें',
    profile_completed: 'प्रोफ़ाइल पूरी हुई। लॉगिन सफल।',
    token_refreshed: 'टोकन सफलतापूर्वक अपडेट हुआ',
    logout_success: 'लॉग आउट सफल',
    user_retrieved: 'उपयोगकर्ता सफलतापूर्वक प्राप्त',
    language_updated: 'भाषा वरीयता अपडेट हो गई',
    mobile_required: 'मोबाइल नंबर आवश्यक है',
    mobile_invalid: 'मान्य मोबाइल नंबर दर्ज करें',
    otp_required: 'OTP आवश्यक है',
    otp_invalid: 'OTP 6 अंकों का होना चाहिए',
    otp_numeric: 'OTP संख्यात्मक होना चाहिए',
    name_required: 'नाम आवश्यक है',
    dob_required: 'जन्म तिथि आवश्यक है',
    dob_invalid: 'मान्य जन्म तिथि दर्ज करें',
    age_min: 'आपकी आयु कम से कम 18 वर्ष होनी चाहिए',
    gender_required: 'लिंग आवश्यक है',
    gender_invalid: 'लिंग: male, female, other',
    refresh_required: 'रिफ्रेश टोकन आवश्यक है',
    language_required: 'भाषा कोड आवश्यक है',
    language_invalid: 'भाषा: en, kn, ta, hi, te',
    rate_limit: 'बहुत अधिक OTP अनुरोध। बाद में पुनः प्रयास करें।',
    route_not_found: 'मार्ग नहीं मिला',
    server_running: 'सर्वर चल रहा है',
  },
  te: {
    otp_sent: 'OTP విజయవంతంగా పంపబడింది',
    login_success: 'లాగిన్ విజయవంతం',
    complete_profile: 'దయచేసి మీ ప్రొఫైల్ పూర్తి చేయండి',
    profile_completed: 'ప్రొఫైల్ పూర్తయింది. లాగిన్ విజయవంతం.',
    token_refreshed: 'టోకెన్ విజయవంతంగా నవీకరించబడింది',
    logout_success: 'లాగ్ అవుట్ విజయవంతం',
    user_retrieved: 'వినియోగదారు విజయవంతంగా పొందబడింది',
    language_updated: 'భాషా ప్రాధాన్యత నవీకరించబడింది',
    mobile_required: 'మొబైల్ నంబర్ అవసరం',
    mobile_invalid: 'చెల్లుబాటు అయ్యే మొబైల్ నంబర్ నమోదు చేయండి',
    otp_required: 'OTP అవసరం',
    otp_invalid: 'OTP 6 అంకెలు ఉండాలి',
    otp_numeric: 'OTP సంఖ్యాత్మకంగా ఉండాలి',
    name_required: 'పేరు అవసరం',
    dob_required: 'పుట్టిన తేదీ అవసరం',
    dob_invalid: 'చెల్లుబాటు అయ్యే పుట్టిన తేదీ నమోదు చేయండి',
    age_min: 'మీరు కనీసం 18 సంవత్సరాల వయస్సు ఉండాలి',
    gender_required: 'లింగం అవసరం',
    gender_invalid: 'లింగం: male, female, other',
    refresh_required: 'రిఫ్రెష్ టోకెన్ అవసరం',
    language_required: 'భాషా కోడ్ అవసరం',
    language_invalid: 'భాష: en, kn, ta, hi, te',
    rate_limit: 'చాలా OTP అభ్యర్థనలు. తర్వాత మళ్లీ ప్రయత్నించండి.',
    route_not_found: 'మార్గం కనుగొనబడలేదు',
    server_running: 'సర్వర్ నడుస్తోంది',
  },
};

/**
 * Resolve language code from request headers or user preference.
 */
const resolveLanguage = (req) => {
  const headerLang =
    req.headers['x-app-language'] ||
    (req.headers['accept-language'] || '').split(',')[0].trim().split('-')[0];
  const userLang = req.user?.preferredLanguage;
  const candidate = (userLang || headerLang || DEFAULT_LANGUAGE).toLowerCase();
  return SUPPORTED_LANGUAGES.includes(candidate) ? candidate : DEFAULT_LANGUAGE;
};

/**
 * Translate a message key for the given language.
 */
const t = (key, lang = DEFAULT_LANGUAGE) => {
  const language = SUPPORTED_LANGUAGES.includes(lang) ? lang : DEFAULT_LANGUAGE;
  return messages[language][key] || messages[DEFAULT_LANGUAGE][key] || key;
};

module.exports = {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  resolveLanguage,
  t,
};
