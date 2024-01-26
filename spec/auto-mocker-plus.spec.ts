import { AutoMockerPlus, readObservableErrorSynchronously, readObservableSynchronously } from "../src";
import { Observable, Subject, of } from "rxjs";
import { TestEmissionsCounter } from "../src/test-emissions-counter";
import { result } from "lodash";

class AutoMockerPlusTest {
	 public observableProperties$: Observable<string> = new Subject<string>();

	 public testObservableMethod(): Observable<number> {
		 return of(Math.floor(Math.random() * 1000));
	 }

	 public argBasedObservable(arg1: string): Observable<number> {
		 switch(arg1) {
			 case "one":
				 return of(1);
			 case "two":
				 return of(2);
			 default:
				 return of (-1);
		 }
	 }

	 public getTestPromise(): Promise<number> {
		 return new Promise<number>(() => {
			 return Math.floor(Math.random() * 10);
		 });
	 }
}

describe("AutoMockerPlus", () => {
	let autoMocker: AutoMockerPlus;
	let mock: AutoMockerPlusTest;

	beforeEach(() => {
		autoMocker = new AutoMockerPlus();
		mock = autoMocker.mockClass(AutoMockerPlusTest);
	});

	describe("withReturnObservable", () => {
		it("should throw an error when method is not an actual spy", () => {
			expect(() => autoMocker.withReturnObservable(() => of())).toThrowError();
		});

		it("should return an observable with an undefined value", () => {
			autoMocker.withReturnObservable(mock.testObservableMethod);

			const result = readObservableSynchronously(mock.testObservableMethod());

			expect(result).toBeFalsy();
		});

		it("should return the expected number", () => {
			const expected = Math.floor(Math.random() * 1000);
			autoMocker.withReturnObservable(mock.testObservableMethod, expected);

			const result = readObservableSynchronously(mock.testObservableMethod());
            expect(result).toBe(expected);
		});
	});

	describe("withReturnNonEmittingObservable", () => {
		it("should throw an error if the method is not an actual spy", () => {
			expect(() => autoMocker.withReturnNonEmittingObservable(() => of())).toThrowError();
		});

		it("should not emit", () => {
			autoMocker.withReturnNonEmittingObservable(mock.testObservableMethod);
			const emissionsCounter = new TestEmissionsCounter(mock.testObservableMethod());
			emissionsCounter.emissionsCountingObservable.subscribe();
			expect(emissionsCounter.emissions).toEqual(0);
		});
	});

	describe("withReturnCompletingCountedObservable", () => {
		it("should throw an error if the method is not an actual spy", () => {
			expect(() => autoMocker.withReturnCompletingCountedObservable(() => of())).toThrowError();
		});

		it("should return an observable that completes", () => {
			const counter = autoMocker.withReturnCompletingCountedObservable(mock.testObservableMethod);
			mock.testObservableMethod().subscribe()
			expect(counter.allSubscriptionsFinalized).toBeTrue();
		});
	});

	describe("withReturnNonCompletingCountedObservable", () => {
		it("should throw an error when method is not an actual spy", () => {
			expect(() => autoMocker.withReturnNonCompletingCountedObservable(() => of())).toThrowError();
		});

		it("should return undefined and not complete", () => {
			const counter = autoMocker.withReturnNonCompletingCountedObservable(mock.testObservableMethod);
			const observableResult = readObservableSynchronously(mock.testObservableMethod());
			counter.countedObservable$.subscribe();
			expect(observableResult).toBeUndefined();
            expect(counter.allSubscriptionsFinalized).toBeFalse();
		});

		it("should return a number and not complete", () => {
			const expectedNumber = Math.floor(Math.random() * 1000)
			const counter = autoMocker.withReturnNonCompletingCountedObservable(mock.testObservableMethod, expectedNumber);
			const observableResult = readObservableSynchronously(mock.testObservableMethod());
			counter.countedObservable$.subscribe();
            expect(observableResult).toBe(expectedNumber);
            expect(counter.allSubscriptionsFinalized).toBeFalse();
		});
	});

	describe("withReturnObservables", () => {
		it('should throw an error when method is not an actual spy', () => {
			expect(() => autoMocker.withReturnObservables(() => of(), [])).toThrowError();
		});

		it("should return an array of observables", () => {
			const arrLength = Math.floor(Math.random() * 10);
			const values = [];
			for (let i = 0; i < arrLength; i++) {
				if (i % 2 === 0) {
					values.push(of(Math.floor(Math.random() * 1000)));
				} else {
					values.push(Math.floor(Math.random() * 1000));
				}
			}
			autoMocker.withReturnObservables(mock.testObservableMethod, values);

			let results = [];

			for (let i = 0; i < arrLength; i++) {
				results.push(readObservableSynchronously(mock.testObservableMethod()));
			}

			expect(results.length).toEqual(arrLength);
		});
	});

	describe("withReturnThrowObservable", () => {
		it("should throw an error when method is not an actual spy", () => {
			expect(() => autoMocker.withReturnThrowObservable(() => of())).toThrowError();
		});

		it('should return an error message', () => {
			autoMocker.withReturnThrowObservable(mock.testObservableMethod, 'Error message');
			const errorMessage = readObservableErrorSynchronously(mock.testObservableMethod());
			expect(errorMessage.message).toEqual('Error message');
		});
	});

	describe('withFirstArgMappedReturnObservable', () => {
		it('should throw an error if the method is not an actual spy', () => {
			expect(() => autoMocker.withFirstArgMappedReturnObservable(() => of(), {})).toThrowError();
		});

		it('should return the mapped value based on the first argument', () => {
            const returnMap = {
                'one': 1,
                'two': 2,
                'three': 3
            };
            autoMocker.withFirstArgMappedReturnObservable(mock.argBasedObservable, returnMap);

            const result1 = readObservableSynchronously(mock.argBasedObservable('one'));
            const result2 = readObservableSynchronously(mock.argBasedObservable('two'));
            const result3 = readObservableSynchronously(mock.argBasedObservable('three'));

            expect(result1).toBe(1);
            expect(result2).toBe(2);
            expect(result3).toBe(3);
        });

		it('should return a default value if the map doesn\'t have the key that was passed', () => {
			const returnMap = {
				1: 1,
				2: 3
			};

			autoMocker.withFirstArgMappedReturnObservable(mock.argBasedObservable, returnMap, -1);

			const result = readObservableSynchronously(mock.argBasedObservable("test"));

			expect(result).toBe(-1);
		});
	});

	describe('withReturnSubjectForObservableProperty', () => {
		it('should not emit if initial value not passed', () => {
			autoMocker.withReturnSubjectForObservableProperty(mock, 'observableProperties$');
			const counter = new TestEmissionsCounter(mock.observableProperties$);
			counter.emissionsCountingObservable.subscribe();
			expect(counter.emissions).toEqual(0);
		});

		it("should emit a value when initial value is passed", () => {
			autoMocker.withReturnSubjectForObservableProperty(mock, 'observableProperties$', 'initial value');
			const result = readObservableSynchronously(mock.observableProperties$);
            expect(result).toBe('initial value');
		});

		it('should update the value when subject.next is called', () => {
			const subject = autoMocker.withReturnSubjectForObservableProperty(mock, "observableProperties$", "test1");
			let emissionNumber = 1;
			mock.observableProperties$.subscribe((val) => {
				if (emissionNumber === 1) {
					expect(val).toEqual('test1');
					emissionNumber++;
				} else {
					expect(val).toEqual('test2');
				}
			});
			subject.next('test2');
		});
	})
})
