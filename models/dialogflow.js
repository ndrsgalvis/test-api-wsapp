const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const Redis = require('../config/redis')
const Messages = require("./messages");
const dialogflow = require("@google-cloud/dialogflow");
const DIALOGFLOW_ACCOUNT_PATH = `${__dirname}/../config/dialogflow-account.json`;

const getDialogflowCredentials = () => {
  if (!fs.existsSync(DIALOGFLOW_ACCOUNT_PATH)) return null;
  const credentials = fs.readFileSync(DIALOGFLOW_ACCOUNT_PATH);
  if (!credentials) return null;

  const parseCredentials = JSON.parse(credentials);
  return parseCredentials;
};

const formatedObject = (obj) => {
  for (let item in obj) {
    obj[item] = obj[item][obj[item].kind];
    if (typeof obj[item] === "object") {
      obj[item] = obj[item].fields;
      formatedObject(obj[item]);
    }
  }

  return obj;
};

const dialogflowProcess = async (message, phoneNumber, messageId) => {
  try {
    const redis = await Redis();

    const sessionId = uuidv4();
    const credentialsDF = getDialogflowCredentials();
    const { private_key, client_email, project_id } = credentialsDF;
    const configuration = {
      credentials: {
        private_key,
        client_email,
      },
    };

    const sessionClient = new dialogflow.SessionsClient(configuration);
    const sessionPath = sessionClient.projectAgentSessionPath(
      project_id,
      sessionId
    );
    const requestPayload = {
      session: sessionPath,
      queryInput: {
        text: {
          text: message,
          languageCode: "es",
        },
      },
    };

    const contextKey = `${phoneNumber}:context`;
    const redisContext = await redis.get(contextKey)
    if(redisContext){
      requestPayload.queryParams = {
        contexts : [{
          name: redisContext,
          lifespanCount: 2
        }]
      }
    }


    const response = await sessionClient.detectIntent(requestPayload);
    console.log('Intent: ', JSON.stringify(response));
    
    const queryResult = response[0].queryResult;
    if(queryResult.outputContexts[0]){
      const newContext = queryResult.outputContexts[0].name;
      await redis.set(contextKey, newContext)
      await redis.expire(contextKey, 80)
    }else{
      await redis.del(contextKey)
    }

    const recieveMessage = queryResult.fulfillmentText;
    const fulfillmentMessages = queryResult.fulfillmentMessages;
    
    let attachment = fulfillmentMessages.find(
      (items) => (items.message === "payload")
    );

    const options = {
      text: recieveMessage,
      phoneNumber,
      messageId,
      type: "text",
    };

    if (attachment) {
      console.log(attachment);
      
      let fields = attachment.payload.fields;
      fields = formatedObject(fields);
      const {
        type,
        reply,
        hasUrl,
        contact,
        location,
        document,
        listPayload,
        buttonPayload,
      } = fields;


      options.document = document
      options.location = location;
      options.type = type ? type : 'text';

    }

    
    console.log(options);
    await Messages.sendMessage(options);

    return null;
  } catch (err) {
    console.log("Error => ", err);
    throw new Error(err);
  }
};

module.exports = { dialogflowProcess };
