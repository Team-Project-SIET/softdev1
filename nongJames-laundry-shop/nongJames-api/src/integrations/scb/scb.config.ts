// Integration configurations
export class ScbConfig {
  static readonly API_URL = process.env.SCB_API_URL || 'https://api.scb.example.com';
  static readonly API_KEY = process.env.SCB_API_KEY || '';
  static readonly SECRET_KEY = process.env.SCB_SECRET_KEY || '';
  static readonly MERCHANT_ID = process.env.SCB_MERCHANT_ID || '';
}
