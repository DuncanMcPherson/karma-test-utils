import {
	readObservableErrorSynchronously,
	readObservableCompletionSynchronously,
	readObservableSynchronouslyAfterAction,
	readObservableSynchronously
} from "../src";
import { BehaviorSubject, of, Subject } from "rxjs";

describe('readObservableSynchronously', () => {
	it('should read observable synchronously', () => {
      const observable$ = of('test');
      const result = readObservableSynchronously(observable$);
      expect(result).toEqual('test');
    });

	it("should fail if observable is not passed in", () => {
		expect(() => readObservableSynchronously(null)).toThrow();
	});
});

describe("readObservableSynchronouslyAfterAction", () => {
	it("should read the observable synchronously", () => {
		const observable$ = of('test');
        const result = readObservableSynchronouslyAfterAction(observable$, () => {
            // perform some action
        });
        expect(result).toEqual('test');
	});

	it("should throw error if action not passed in", () => {
		const observable$ = of("test");
		expect(() => readObservableSynchronouslyAfterAction(observable$, null)).toThrow();
	});

	it("should throw error when observable throws error", () => {
		const observable$ = new Subject();
		const action = () => {
			observable$.error("test");
		}
		expect(() => readObservableSynchronouslyAfterAction(observable$, action)).toThrow();
	});

	it("should throw error when observable doesn't emit", () => {
		const observable$ = new Subject();
        const action = () => {
            // do nothing
        };
		expect(() => readObservableSynchronouslyAfterAction(observable$, action, 1)).toThrow();
	});
});

describe("readObservableErrorSynchronously", () => {
	it("should read the error synchronously", () => {
        const observable$ = new Subject();
		observable$.error("test")
        const error = readObservableErrorSynchronously(observable$);
        expect(error).toEqual("test");
    });

	it("should throw error if observable is not supplied", () => {
		expect(() => readObservableErrorSynchronously(null)).toThrow();
	});

	it("should throw error if observable doesn't emit error", () => {
		const observable$ = new BehaviorSubject("test");
		expect(() => readObservableErrorSynchronously(observable$)).toThrow();
	});

	it("should throw error if emits less times than expected", () => {
		const observable$ = new BehaviorSubject("test");
		expect(() => readObservableErrorSynchronously(observable$, 1)).toThrow();
	});
});

describe("readObservableCompletionSynchronously", () => {
	it("should read the completion synchronously", () => {
        const observable$ = new Subject();
        observable$.complete();
        const completion = readObservableCompletionSynchronously(observable$);
        expect(completion).toEqual(true);
    });

	it("should throw error if observable$ not supplied", () => {
		expect(() => readObservableCompletionSynchronously(null)).toThrow();
	});

	it("should throw error if emits a value instead of completing", () => {
		const observable$ = new BehaviorSubject("test");
		expect(() => readObservableCompletionSynchronously(observable$)).toThrow();
	});

	it("should throw error if emits an error instead of completing", () => {
		const observable$ = new Subject()
		observable$.error("test");
		expect(() => readObservableCompletionSynchronously(observable$)).toThrow();
	});

	it("should throw an error if it doesn't complete", () => {
		const observable$ = new BehaviorSubject("test");
		expect(() => readObservableCompletionSynchronously(observable$, 1)).toThrow();
	})
})