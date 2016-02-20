import Alexa from "alexa-lambda-skill";
import OneBusAway from "./one-bus-away";


console.log('index.js');
export default new Alexa.Handler(new OneBusAway());
