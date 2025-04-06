const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

const Redis = require("../config/redis");
const ChatGPT = require('../models/chatgpt')
const Messages = require("../models/messages");
const Dialogflow = require("../models/dialogflow");
const clientModel = require("../models/clients");

const ApiVerification = async (req, res) => {
  try {
    const {
      "hub.mode": mode,
      "hub.verify_token": token,
      "hub.challenge": challenge,
    } = req.query;

    if (mode && token && mode == "subscribe" && token == VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    } else {
      return res.status(403).send("unauthorized");
    }
  } catch (error) {
    return res.status(500).send(error);
  }
};

const MessageInfo = async (req, res) => {
  const redis = await Redis();
  try {
    const body = req.body.entry[0].changes[0];
    const {
      value: { messages, contacts },
    } = body;

    // If the message is send by the bot do not answer
    if (!messages) return res.status(200).send();

    const {
      profile: { name: wsName },
    } = contacts[0];

    const {
      from: phoneNumber,
      id: messageId,
      text: { body: messageText },
    } = messages[0];

    // const options = {
    //     text: 'Example pdf document',
    //     phoneNumber,
    //     type: 'document',
    //     messageId,
    //     reply: true,
    //     document:{
    //         link: 'https://dd86-181-33-163-197.ngrok-free.app/mediaFiles/invoicesample.pdf',
    //         filename: 'invoice.pdf'
    //     }
    // }

    // Messages.sendTextMessage(messageText, phoneNumber);
    // Messages.sendTextMessageReply(messageText, phoneNumber, messageId);
    // await Messages.sendReactionMessage(phoneNumber, messageId);
    // await Messages.sendMessage(options)
    
    let activeTool;
    const activeToolKey = `${phoneNumber}:tool`;
    const contextKey = `${phoneNumber}:context`;
    const gptContextKey = `${phoneNumber}:chatgpt:context`;

    const formatMessage = messageText
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    await clientModel.verifyStoreClient(phoneNumber, wsName, messageText);
      // await Dialogflow.dialogflowProcess(messageText, phoneNumber, messageId);
    // return res.status(200).send();

    if(formatMessage === 'menu'){
      await redis.del(activeToolKey)
      await redis.del(gptContextKey)
      await redis.del(contextKey)
    }else{
      activeTool = await redis.get(activeToolKey)
    }
  
    if(activeTool === 'dialogflow'){
      await Dialogflow.dialogflowProcess(messageText, phoneNumber, messageId)
      return null
    }else if(activeTool === 'chatgpt'){
      await ChatGPT.chatgpt(messageText, phoneNumber, messageId)
    }else{
      await Messages.sendMessageSteps(formatMessage, phoneNumber, messageId);
    }

    return res.status(200).send();
  } catch (error) {
    return res.status(500).send(error);
  }
};

module.exports = {
  ApiVerification,
  MessageInfo,
};
