import { Response } from "alexa-lambda-skill";
console.log('one-bus-away.js');

export default class OneBusAway {
  launch() {
    return Response.say("OneBusAway launched!");
  }

  hello(slots) {
    const { name = "world" } = slots;
    return Response.say(`Hello oneBusAway`).card("OneBusAway", `Hello oneBusAway`);
  }

  intent(name, slots) {
    return Promise.reject(`No handler found for intent "oneBusAway"`);
  }
}
