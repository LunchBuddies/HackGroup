import chai from "chai";
import promises from "chai-as-promised";
import { Response } from "alexa-lambda-skill";
import OneBusAway from "../lib/one-bus-away";

chai.use(promises);
const { expect } = chai;

describe("OneBusAway", function() {
  describe("launch", function() {
    it("should say that it was launched", function() {
      const result = new OneBusAway().launch();
      expect(result).to.be.an.instanceOf(Response);
    });
  });

  describe("intent", function() {
    it("should reject the request as unhandled", function() {
      const result = new OneBusAway().intent("foo");
      expect(result).to.eventually.be.rejected;
    });
  });
});
