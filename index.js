"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const botbuilder_1 = require("botbuilder");
const botbuilder_azure_1 = require("botbuilder-azure");
const botframework_connector_1 = require("botframework-connector");
const bot_1 = require("./bot");
const restify = require("restify");
const socketIo = require("socket.io");
botframework_connector_1.MicrosoftAppCredentials.trustServiceUrl('https://smba.trafficmanager.net/apis/', new Date(8640000000000000));
const adapter = new botbuilder_1.BotFrameworkAdapter({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD,
    channelService: process.env.ChannelService,
    openIdMetadata: process.env.BotOpenIdMetadata
});
adapter.onTurnError = (context, error) => __awaiter(this, void 0, void 0, function* () {
    console.error(`[onTurnError]`);
    console.log(error);
    if (context.activity.type !== botbuilder_1.ActivityTypes.ContactRelationUpdate) {
        yield context.sendActivity(`Oops. Something went wrong!`);
    }
});
const dbStorage = new botbuilder_azure_1.CosmosDbStorage({
    serviceEndpoint: process.env.AZURE_SERVICE_ENDPOINT || '',
    authKey: process.env.AZURE_AUTH_KEY || '',
    databaseId: process.env.AZURE_DATABASE || '',
    collectionId: process.env.AZURE_COLLECTION || '',
    databaseCreationRequestOptions: {},
    documentCollectionRequestOptions: {}
});
const userState = new botbuilder_1.UserState(dbStorage);
const server = restify.createServer();
const io = socketIo.listen(server.server);
const bot = new bot_1.SkypeBot(userState);
server.use(restify.plugins.bodyParser({ mapParams: true }));
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`${server.name} listening to ${server.url}`);
});
server.post('/api/messages', (req, res) => {
    adapter.processActivity(req, res, (context) => __awaiter(this, void 0, void 0, function* () {
        const reference = botbuilder_1.TurnContext.getConversationReference(context.activity);
        const isAuthorized = yield bot.isAuthorizedProperty.get(context, false);
        console.log('isAuthorized = ', isAuthorized);
        if (context.activity.type === 'message' && !isAuthorized) {
            io.emit('verification_attempt', { body: context.activity.text, reference });
        }
        if (context.activity.type === botbuilder_1.ActivityTypes.ContactRelationUpdate) {
            console.log('REMOVING REFERENCE AND USER STORAGE');
            console.log(context.activity);
            yield bot.userState.delete(context);
            io.emit('remove_reference', { reference });
            if (context.activity.action === 'remove') {
                console.log('BOT: user removed bot. OnTurn function not called');
                return;
            }
        }
        yield bot.onTurn(context, reference);
    }));
});
io.sockets.on('connection', (socket) => {
    console.log('WS connection established');
    socket.on('disconnect', () => {
        console.log('WS connection closed');
    });
    socket.on('message', (msg) => __awaiter(this, void 0, void 0, function* () {
        console.log('BOT: message event received');
        console.log(msg);
        yield adapter.continueConversation(msg.reference, (turnContext) => __awaiter(this, void 0, void 0, function* () {
            if (msg.callbackId && msg.callbackId === 'verification-success') {
                console.log('BOT: verification success event received');
                yield bot.isAuthorizedProperty.set(turnContext, true);
                yield bot.userState.saveChanges(turnContext);
            }
            yield turnContext.sendActivity(msg.text);
        }));
    }));
});
