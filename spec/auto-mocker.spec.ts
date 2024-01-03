import { AutoMocker } from '../src/autoMocker';

class TestAutoMocker {}

describe("AutoMocker", () => {
	let autoMocker: AutoMocker;

    beforeEach(() => {
        autoMocker = new AutoMocker();
    });

    it("should mock a class", () => {
        const mockClass = autoMocker.mockClass(TestAutoMocker);
        expect(mockClass).toBeDefined();
    });
})