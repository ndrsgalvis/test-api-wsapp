const router = require("express").Router();
const messagesController = require("../controllers/messages");

router.get("/bot/webhook", messagesController.ApiVerification);
router.post("/bot/webhook", messagesController.MessageInfo);

module.exports = router;
