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
const IS_AUTHORIZED = 'isAuthorizedProperty';
const IS_WELCOME_MESSAGE_SENT = 'isWelcomeMessageSent';
class SkypeBot {
    constructor(userState) {
        this.userState = userState;
        this.isAuthorizedProperty = userState.createProperty(IS_AUTHORIZED);
        this.isWelcomeMessageSent = userState.createProperty(IS_WELCOME_MESSAGE_SENT);
    }
    onTurn(turnContext, reference) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('OnTurn');
            console.log('turnContext.activity.type', turnContext.activity.type);
            if (turnContext.activity.type === botbuilder_1.ActivityTypes.ConversationUpdate || turnContext.activity.type === botbuilder_1.ActivityTypes.ContactRelationUpdate) {
                const isWelcomeMessageSent = yield this.isWelcomeMessageSent.get(turnContext, false);
                if (!isWelcomeMessageSent) {
                    yield this.sendWelcomeMessage(turnContext);
                    yield this.isWelcomeMessageSent.set(turnContext, true);
                }
                yield this.userState.saveChanges(turnContext);
            }
        });
    }
    sendWelcomeMessage(turnContext) {
        return __awaiter(this, void 0, void 0, function* () {
            yield turnContext.sendActivity(`Welcome! 
    Please enter your verification code. 
    You can get you verification code in your user profile in Renaizant.`);
        });
    }
}
exports.SkypeBot = SkypeBot;
