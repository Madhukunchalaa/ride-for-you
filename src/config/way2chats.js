const axios = require('axios');

const way2chatsConfig = {
  apiKey: process.env.WAY2CHATS_API_KEY,
  phoneId: process.env.WAY2CHATS_PHONE_ID,
  url: process.env.WAY2CHATS_URL || 'https://app.way2chats.com/api/v2/whatsapp-business/messages'
};

const way2chatsApi = axios.create({
  baseURL: way2chatsConfig.url,
  headers: {
    'x-api-key': way2chatsConfig.apiKey,
    'Content-Type': 'application/json'
  }
});

module.exports = { way2chatsConfig, way2chatsApi };
