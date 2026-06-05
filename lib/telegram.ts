import TelegramBot from 'node-telegram-bot-api';

const token = process.env.TELEGRAM_BOT_TOKEN;
const testChatId = process.env.TELEGRAM_TEST_CHAT_ID;

// Create a bot that uses 'polling' to fetch new updates
// We set polling to false because we are just sending outgoing messages from the API
const bot = token ? new TelegramBot(token, { polling: false }) : null;

/**
 * Intercepts an outgoing notification and forwards it to the Telegram test chat.
 * 
 * @param intendedRecipient The email or phone number this was supposed to go to.
 * @param subject A short subject or reason for the alert.
 * @param message The actual drafted message.
 */
export async function sendTestTelegramMessage(intendedRecipient: string, subject: string, message: string) {
  if (!bot || !testChatId) {
    console.error("Telegram bot not configured. Check TELEGRAM_BOT_TOKEN and TELEGRAM_TEST_CHAT_ID in .env.local");
    return;
  }

  const formattedMessage = `🔴 *[TEST MODE - Intercepted]*\n*Intended Recipient:* ${intendedRecipient}\n*Subject:* ${subject}\n*Message:*\n${message}`;

  try {
    await bot.sendMessage(testChatId, formattedMessage, { parse_mode: 'Markdown' });
    console.log(`Test Telegram message sent for ${intendedRecipient}`);
  } catch (error) {
    console.error("Failed to send Telegram message:", error);
  }
}

/**
 * Intercepts an outgoing document (like a PDF) and forwards it to the Telegram test chat.
 * 
 * @param intendedRecipient The email or phone number this was supposed to go to.
 * @param subject A short subject or reason for the alert.
 * @param message The actual drafted message to go along with the document.
 * @param fileBuffer The buffer containing the file data.
 * @param fileName The name of the file (e.g., 'RFQ-123.pdf').
 */
export async function sendTestTelegramDocument(intendedRecipient: string, subject: string, message: string, fileBuffer: Buffer, fileName: string) {
  if (!bot || !testChatId) {
    console.error("Telegram bot not configured.");
    return;
  }

  const formattedMessage = `🔴 *[TEST MODE - Intercepted Email with Attachment]*\n*Intended Recipient:* ${intendedRecipient}\n*Subject:* ${subject}\n*Message:*\n${message}`;

  try {
    // node-telegram-bot-api supports sending buffers directly
    await bot.sendDocument(testChatId, fileBuffer, { 
      caption: formattedMessage, 
      parse_mode: 'Markdown' 
    }, {
      filename: fileName,
      contentType: 'application/pdf'
    });
    console.log(`Test Telegram document sent for ${intendedRecipient}`);
  } catch (error) {
    console.error("Failed to send Telegram document:", error);
  }
}
