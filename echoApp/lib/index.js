import Alexa from "alexa-lambda-skill";
import OneBusAway from "./one-bus-away";

export default new Alexa.Handler(new OneBusAway());
