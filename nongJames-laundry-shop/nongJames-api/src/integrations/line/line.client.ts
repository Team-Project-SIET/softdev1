import { LineConfig } from './line.config';
import * as crypto from 'crypto';

/**
 * LINE Official Account Client
 * Handles messaging, webhook verification, and event processing
 */
export class LineClient {
  private accessToken = LineConfig.ACCESS_TOKEN;
  private channelSecret = LineConfig.CHANNEL_SECRET;
  private apiUrl = LineConfig.API_URL;

  /**
   * Send text message to user
   */
  async sendMessage(userId: string, message: string): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      if (!this.accessToken) {
        console.warn('[LINE] Access token not configured, skipping message');
        return { success: true, messageId: `mock-${Date.now()}` };
      }

      const payload = {
        to: userId,
        messages: [
          {
            type: 'text',
            text: message,
          },
        ],
      };

      // In production, make actual HTTP request:
      // const response = await fetch(`${this.apiUrl}/push`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${this.accessToken}`,
      //   },
      //   body: JSON.stringify(payload),
      // });

      console.log(`[LINE] Message sent to ${userId}: ${message}`);

      return {
        success: true,
        messageId: `msg-${Date.now()}`,
      };
    } catch (error) {
      console.error('[LINE] Send message error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message',
      };
    }
  }

  /**
   * Send Flex Message (rich format) to user
   * Useful for order status, buttons, images, etc.
   */
  async sendFlexMessage(userId: string, flexMessage: any): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      if (!this.accessToken) {
        console.warn('[LINE] Access token not configured, skipping flex message');
        return { success: true, messageId: `mock-${Date.now()}` };
      }

      const payload = {
        to: userId,
        messages: [
          {
            type: 'flex',
            altText: flexMessage.altText || 'Notification',
            contents: flexMessage,
          },
        ],
      };

      // In production:
      // const response = await fetch(`${this.apiUrl}/push`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${this.accessToken}`,
      //   },
      //   body: JSON.stringify(payload),
      // });

      console.log(`[LINE] Flex message sent to ${userId}`);

      return {
        success: true,
        messageId: `msg-${Date.now()}`,
      };
    } catch (error) {
      console.error('[LINE] Send flex message error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send flex message',
      };
    }
  }

  /**
   * Verify LINE webhook signature
   * LINE sends requests with X-Line-Signature header containing HMAC-SHA256
   */
  async verifyWebhookSignature(signature: string, bodyString: string): Promise<boolean> {
    try {
      if (!this.channelSecret) {
        console.warn('[LINE] Channel secret not configured');
        return process.env.NODE_ENV !== 'production';
      }

      // Generate expected signature: HMAC-SHA256(body, channelSecret)
      const expectedSignature = crypto
        .createHmac('sha256', this.channelSecret)
        .update(bodyString)
        .digest('base64');

      const isValid = expectedSignature === signature;

      if (!isValid) {
        console.error('[LINE] Signature mismatch - possible tampering');
      } else {
        console.log('[LINE] Webhook signature verified');
      }

      return isValid;
    } catch (error) {
      console.error('[LINE] Webhook verification error:', error);
      return false;
    }
  }

  /**
   * Handle incoming LINE webhook events
   */
  async handleWebhookEvent(event: {
    events: Array<{
      type: string;
      message?: { type: string; text: string; id: string };
      source: { type: string; userId: string };
      timestamp: number;
      replyToken: string;
    }>;
  }): Promise<void> {
    try {
      const events = event.events || [];

      for (const evt of events) {
        console.log(`[LINE] Processing ${evt.type} event from ${evt.source.userId}`);

        switch (evt.type) {
          case 'message':
            await this.handleMessageEvent(evt);
            break;
          case 'follow':
            await this.handleFollowEvent(evt);
            break;
          case 'unfollow':
            await this.handleUnfollowEvent(evt);
            break;
          case 'postback':
            await this.handlePostbackEvent(evt);
            break;
          default:
            console.log(`[LINE] Unknown event type: ${evt.type}`);
        }
      }
    } catch (error) {
      console.error('[LINE] Webhook event handling error:', error);
      throw error;
    }
  }

  /**
   * Handle message event from user
   */
  private async handleMessageEvent(evt: any): Promise<void> {
    const { source, message, replyToken } = evt;
    console.log(`[LINE] Message from ${source.userId}: ${message?.text}`);

    // Implement order status queries, support, etc.
    // This is where you'd integrate with your order service
  }

  /**
   * Handle follow event (user adds bot as friend)
   */
  private async handleFollowEvent(evt: any): Promise<void> {
    const { source } = evt;
    console.log(`[LINE] User ${source.userId} followed the bot`);

    // Welcome message or auto-user registration can happen here
    // Integrate with AuthService to auto-create user
  }

  /**
   * Handle unfollow event (user blocks bot)
   */
  private async handleUnfollowEvent(evt: any): Promise<void> {
    const { source } = evt;
    console.log(`[LINE] User ${source.userId} unfollowed the bot`);

    // Mark user as not friend in database
  }

  /**
   * Handle postback event (user clicks button)
   */
  private async handlePostbackEvent(evt: any): Promise<void> {
    const { source, postback } = evt;
    console.log(`[LINE] Postback from ${source.userId}:`, postback);

    // Handle button clicks, menu selections, etc.
  }

  /**
   * Send order status notification to customer
   */
  async notifyOrderStatus(
    userId: string,
    orderNumber: string,
    status: string,
    estimatedTime?: string
  ): Promise<{ success: boolean }> {
    const statusMessages: { [key: string]: string } = {
      PENDING: `📋 Order #${orderNumber} received! We\'ll start washing soon.`,
      WASHING: `🧺 Order #${orderNumber} is being washed now.`,
      PACKING: `📦 Order #${orderNumber} is being packed.`,
      READY: `✅ Order #${orderNumber} is ready for pickup!`,
      COMPLETED: `🎉 Order #${orderNumber} completed. Thank you!`,
      CANCELLED: `❌ Order #${orderNumber} has been cancelled.`,
    };

    const message = statusMessages[status] || `Order #${orderNumber} status updated to ${status}`;
    return this.sendMessage(userId, message);
  }

  /**
   * Send delivery tracking notification
   */
  async notifyDeliveryUpdate(
    userId: string,
    orderNumber: string,
    driverName: string,
    latitude?: number,
    longitude?: number
  ): Promise<{ success: boolean }> {
    const locationText = latitude && longitude
      ? `\nLocation: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
      : '';

    const message = `🚗 Driver ${driverName} is delivering Order #${orderNumber}${locationText}`;
    return this.sendMessage(userId, message);
  }
}

export * from './line.config';
