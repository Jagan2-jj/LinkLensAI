// API Configuration with secure environment variable handling
export const API_CONFIG = {
  // Validate required environment variables
  LINKEDIN_API_KEY: import.meta.env.VITE_LINKEDIN_API_KEY,
  LINKEDIN_API_URL: import.meta.env.VITE_LINKEDIN_API_URL || 'https://api.linkedin.com/v2',
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY,
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  APP_ENV: import.meta.env.VITE_APP_ENV || 'development',
};

// Validation function to ensure required API keys are present
export const validateApiConfig = () => {
  const requiredKeys = [
    { key: 'VITE_LINKEDIN_API_KEY', value: API_CONFIG.LINKEDIN_API_KEY },
  ];

  const missingKeys = requiredKeys.filter(({ value }) => !value);

  if (missingKeys.length > 0) {
    const missing = missingKeys.map(({ key }) => key).join(', ');
    throw new Error(
      `Missing required environment variables: ${missing}. ` +
      'Please check your .env file and ensure all required API keys are set.'
    );
  }

  // Log configuration status (without exposing actual keys)
  console.log('✅ API Configuration validated successfully');
  console.log(`🌍 Environment: ${API_CONFIG.APP_ENV}`);
  console.log(`🔗 API Base URL: ${API_CONFIG.API_BASE_URL}`);
};

// Safe logging function that doesn't expose sensitive data
export const logApiStatus = () => {
  console.log('🔐 API Keys Status:');
  console.log(`  LinkedIn API: ${API_CONFIG.LINKEDIN_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`  Google OAuth: ${API_CONFIG.GOOGLE_CLIENT_ID ? '✅ Configured' : '❌ Missing'}`);
  console.log(`  OpenAI API: ${API_CONFIG.OPENAI_API_KEY ? '✅ Configured' : '❌ Missing'}`);
};