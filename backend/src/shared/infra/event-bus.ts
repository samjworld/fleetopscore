
import { RedisClient } from '../../infra/redis';
import { logger } from '../../utils/logger';

export type EventHandler = (payload: any, messageId: string) => Promise<void>;

export class EventBus {
  private redis = RedisClient.getInstance();
  private consumerGroup: string;
  private consumerName: string;

  constructor(consumerGroup: string) {
    this.consumerGroup = consumerGroup;
    this.consumerName = `${consumerGroup}-${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Publish an Event to a Stream
   */
  public async publish(stream: string, eventName: string, payload: any) {
    try {
      await this.redis.xadd(
        stream,
        '*', // Auto-generate ID
        'event', eventName,
        'payload', JSON.stringify(payload),
        'timestamp', Date.now().toString()
      );
    } catch (error) {
      logger.error(`Failed to publish to ${stream}`, error);
      throw error;
    }
  }

  /**
   * Subscribe to a Stream using Consumer Groups
   * Handles creation of group if not exists.
   */
  public async subscribe(stream: string, handler: EventHandler) {
    // 1. Ensure Consumer Group Exists
    try {
      await this.redis.xgroup('CREATE', stream, this.consumerGroup, '0', 'MKSTREAM');
    } catch (e: any) {
      // Ignore if group already exists (BUSYGROUP)
      if (!e.message.includes('BUSYGROUP')) throw e;
    }

    logger.info(`Started consumer ${this.consumerName} on ${stream}`);

    // 2. Start Polling Loop
    this.poll(stream, handler);
  }

  private async poll(stream: string, handler: EventHandler) {
    while (true) {
      try {
        // XREADGROUP BLOCK 0 means wait indefinitely for new messages
        const response = await this.redis.xreadgroup(
          'GROUP', this.consumerGroup, this.consumerName,
          'BLOCK', '5000', // Block for 5s to allow event loop breathing room
          'COUNT', '10',
          'STREAMS', stream,
          '>' // Read messages never delivered to other consumers
        );

        if (response) {
          const [key, messages] = response[0]; // response structure: [[stream, [[id, [field, value]]]]]
          
          for (const message of messages) {
            const id = message[0];
            const body = message[1];
            
            // Parse generic body (Redis returns array [key, val, key, val])
            const eventData = this.parseRedisMessage(body);
            
            try {
              await handler(eventData, id);
              // ACK on success
              await this.redis.xack(stream, this.consumerGroup, id);
            } catch (err) {
              logger.error(`Error processing message ${id}`, err);
              // Do NOT Ack. It will remain in PEL for retry/DLQ logic.
            }
          }
        }
      } catch (error) {
        logger.error('Polling error', error);
        await new Promise(r => setTimeout(r, 1000)); // Backoff
      }
    }
  }

  // Helper to convert Redis array format to Object
  private parseRedisMessage(raw: string[]): any {
    const obj: any = {};
    for (let i = 0; i < raw.length; i += 2) {
      obj[raw[i]] = raw[i + 1];
    }
    return JSON.parse(obj.payload || '{}');
  }
}
