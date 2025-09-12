/**
 * Environment variable validation utility
 */

interface EnvConfig {
  VITE_API_URL?: string;
}

const requiredEnvVars = {
  // Add any required frontend environment variables here
} as const;

const optionalEnvVars = {
  VITE_API_URL: 'http://localhost:3001',
} as const;

export const validateEnvironment = (): EnvConfig => {
  const config: EnvConfig = {};
  
  // Validate required environment variables
  for (const [key, _] of Object.entries(requiredEnvVars)) {
    const value = import.meta.env[key];
    if (!value) {
      throw new Error(`Required environment variable ${key} is not set`);
    }
    config[key as keyof EnvConfig] = value;
  }
  
  // Set optional environment variables with defaults
  for (const [key, defaultValue] of Object.entries(optionalEnvVars)) {
    const value = import.meta.env[key];
    config[key as keyof EnvConfig] = value || defaultValue;
  }
  
  return config;
};

export const getEnvConfig = (): EnvConfig => {
  try {
    return validateEnvironment();
  } catch (error) {
    console.error('Environment validation failed:', error);
    // Return defaults in case of validation failure
    return {
      VITE_API_URL: 'http://localhost:3001',
    };
  }
};
