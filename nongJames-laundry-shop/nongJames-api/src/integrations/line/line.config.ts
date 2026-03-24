export class LineConfig {
  static readonly CHANNEL_ID = process.env.LINE_CHANNEL_ID || '';
  static readonly CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || '';
  static readonly ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN || '';
  static readonly API_URL = 'https://api.line.me/v2/bot/message';
}
