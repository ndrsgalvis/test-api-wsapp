const TOKEN = process.env.TOKEN;
const API_VERSION = process.env.API_VERSION;
const BOT_NUMBER_ID = process.env.BOT_NUMBER_ID;

const axios = require("axios");
const redisClient = require("../config/redis");
const stepResponses = require("../helpers/reponses.json");

const sendTextMessage = async (text, phoneNumber) => {
  try {
    const url = `https://graph.facebook.com/${API_VERSION}/${BOT_NUMBER_ID}/messages`;
    const body = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phoneNumber,
      type: "text",
      text: {
        preview_url: false,
        body: text,
      },
    };
    const config = {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
    };
    const result = await axios.post(url, body, config);
    return result;
  } catch (error) {
    console.log("error", error?.response?.data);
    throw new Error(error?.response?.data?.error?.message);
  }
};

const sendTextMessageReply = async (text, phoneNumber, messageId) => {
  try {
    const url = `https://graph.facebook.com/${API_VERSION}/${BOT_NUMBER_ID}/messages`;
    const body = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phoneNumber,
      type: "text",
      context: {
        message_id: messageId,
      },
      text: {
        preview_url: false,
        body: text,
      },
    };
    const config = {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
    };
    const result = await axios.post(url, body, config);
    console.log(result.data);
    return result;
  } catch (error) {
    console.log("error", error?.response?.data);
    throw new Error(error?.response?.data?.error?.message);
  }
};
const sendReactionMessage = async (phoneNumber, messageId) => {
  try {
    const url = `https://graph.facebook.com/${API_VERSION}/${BOT_NUMBER_ID}/messages`;
    const body = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phoneNumber,
      type: "reaction",
      reaction: {
        message_id: messageId,
        emoji: "✌🏻",
      },
    };
    const config = {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
    };
    const result = await axios.post(url, body, config);
    console.log(result.data);
    return result;
  } catch (error) {
    console.log("error", error?.response?.data);
    throw new Error(error?.response?.data?.error?.message);
  }
};

const useTool = async(phoneNumber, tool) => {
  const redis = await redisClient();
  const activeToolKey = `${phoneNumber}:tool`;
  const stepsKey = `${phoneNumber}:steps`;

  await redis.set(activeToolKey, tool);
  await redis.expire(activeToolKey, 86400)
  await redis.del(stepsKey)
  return null
}

const sendMessage = async (options) => {
  const {
    text,
    phoneNumber,
    messageId,
    reply = false,
    hasUrl = false,
    type,
    document,
    contact,
    location,
    listPayload,
    buttonPayload
  } = options;
  try {
    const url = `https://graph.facebook.com/${API_VERSION}/${BOT_NUMBER_ID}/messages`;
    const body = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phoneNumber,
    };

    if (reply && messageId) {
      body.context = {
        message_id: messageId,
      };
    }

    switch (type) {
      case "text":
        body.type = "text";
        body.text = {
          preview_url: hasUrl,
          body: text,
        };
        break;
      case "reaction":
        body.type = "reaction";
        body.reaction = {
          message_id: messageId,
          body: text,
        };
        break;
      case "image":
        body.type = "image";
        body.image = {
          link: text,
        };
        break;
      case "audio":
        body.type = "audio";
        body.audio = {
          link: text,
        };
        break;
      case "document":
        body.type = "document";
        body.document = document;
        document.caption = text;
        break;
      case "video":
        body.type = "video";
        body.video = {
          link: text,
        };
        break;
      case "contacts":
        body.type = "contacts";
        body.contacts = contact;
        break;
      case "location":
        body.type = "location";
        body.location = location;
        break;
      case "location":
        body.type = "interactive";
        body.interactive = listPayload;
        break;
      case "button":
        body.type = "interactive";
        body.interactive = buttonPayload;
        break;
      case "dialogflow":
        await useTool(phoneNumber, 'dialogflow')
        body.type = 'text',
        body.text = {
          body: text
        }
        break;
      case "chatgpt":
        await useTool(phoneNumber, 'chatgpt')
        body.type = 'text',
        body.text = {
          body: text
        }
        break;
      default:
        break;
    }

    const config = {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
    };

    const result = await axios.post(url, body, config);
    console.log(result.data);
    return result;
  } catch (error) {
    console.log("error", error?.response?.data);
    throw new Error(error?.response?.data?.error?.message);
  }
};

const sendMessageSteps = async (message, phoneNumber, messageId) => {
  const redis = await redisClient();

  const inactiveClientKey = `${phoneNumber}:inactive`;
  const inactiveClientRedis = await redis.get(inactiveClientKey);
  if(inactiveClientRedis) return "Client inactive"
  
  let step = 0;
  const stepsKey = `${phoneNumber}:steps`;
  if(message === 'menu'){
    await redis.del(stepsKey)
  }else{
    step = await redis.get(stepsKey) || 0;
  }

  try {
    
    const key = stepResponses.find((items) => items.keywords.includes(message) && Number(items.previusStep) === Number(step));
    
    if (!key) return null;

    const { response, type, document, location } = key;
    await redis.set(stepsKey, key.step)
    // This key will expire in 24h
    await redis.expire(stepsKey, 84600)
    

    const options = {
      text: response.join(""),
      type,
      phoneNumber,
      messageId,
      document,
      location,
    };
    console.log('The options',options)
    await sendMessage(options);
    return null;
  } catch (error) {
    console.log("error", error);
    throw new Error(error?.response?.data?.error?.message);
  }
};

module.exports = {
  sendTextMessage,
  sendTextMessageReply,
  sendReactionMessage,
  sendMessage,
  sendMessageSteps,
};
