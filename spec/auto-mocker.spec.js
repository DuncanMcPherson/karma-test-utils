"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const autoMocker_1 = require("../src/autoMocker");
class TestAutoMocker {
}
describe("AutoMocker", () => {
    let autoMocker;
    beforeEach(() => {
        autoMocker = new autoMocker_1.AutoMocker();
    });
    it("should mock a class", () => {
        const mockClass = autoMocker.mockClass(TestAutoMocker);
        expect(mockClass).toBeDefined();
    });
});
//# sourceMappingURL=auto-mocker.spec.js.map