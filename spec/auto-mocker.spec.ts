import { AutoMocker } from '../src/autoMocker';
import isEmpty from "lodash/isEmpty";

class TestEmptyAutoMocker {
}

class TestAutoMocker {
	private _value: number = 4;

	public add(num1: number, num2: number): number {
		return num1 + num2;
	}

	public get Value(): number {
		return this._value;
	}

	public set Value(value: number) {
		this._value = value;
	}

	public get Values(): number {
		return this._value
	}

	public set UpdateValues(value: number) {
		this._value = value;
	}
}

describe("AutoMocker", () => {
	let autoMocker: AutoMocker;

	beforeEach(() => {
		autoMocker = new AutoMocker();
	});

	it("should create", () => {
		expect(autoMocker).toBeTruthy();
	});

	describe("mockClass", () => {
		it("should create an empty mock class", () => {
			const mock = autoMocker.mockClass(TestEmptyAutoMocker);
			expect(mock).toBeTruthy();
			expect(isEmpty(mock)).toBe(true);
		});

		it("should create a mock with at least 1 mocked method", () => {
			const mock = autoMocker.mockClass(TestAutoMocker);
			expect(mock).toBeTruthy();
			expect(mock.add).toBeInstanceOf(Function);
			expect(Object.keys(mock).length).toBeGreaterThanOrEqual(1);
		});

		it("should create a mock with at least 1 mocked property", () => {
			const mock = autoMocker.mockClass(TestAutoMocker);
			expect(mock).toBeTruthy();
			const propertyNames = Object.getOwnPropertyNames(mock);
			expect(propertyNames.includes("Value")).toEqual(true);
			// Expect to be undefined because we don't call the actual constructor
			expect(mock.Value).toBeUndefined();
		});

		it("should not define Value property if ignore all properties is true", () => {
			const mock = autoMocker.mockClass(TestAutoMocker, {ignoreAllProperties: true})
			expect(Object.keys(mock).includes("Value")).toBeFalse()
			expect(mock).toBeTruthy();
		});
	});

	describe("mock", () => {
		it("should mock an object", () => {
			const fn = {
				prop: 25,
				method: () => 45
			};
			autoMocker.mock("fn", fn);
			expect(fn).toBeDefined();
			expect(fn.prop).toBeDefined();
			expect((fn.method as jasmine.Spy).calls).toBeDefined();
		});

		// TODO: need to understand why this doesn't work
		// xit("should mock a function", () => {
		// 	let fn = () => 123;
		// 	autoMocker.mock("fn", fn);
		// 	console.log(fn)
		// 	expect((fn as jasmine.Spy).calls).toBeDefined();
		// });
	});

	describe("withCallFake", () => {
		it("should replace a spy with a fake function", () => {
			const mock = autoMocker.mockClass(TestAutoMocker);
			autoMocker.withCallFake(mock.add, (num1, num2) => num1 * num2);
			const result = mock.add(2, 3);
			expect(result).toBe(6);
		});

		it('should throw an error when method is not a spy', () => {
			const fn = () => {
			};
			expect(() => autoMocker.withCallFake(fn, () => {
			})).toThrowError();
		});
	});

	describe("withFirstArgMappedReturn", () => {
		let mock: TestAutoMocker;
		beforeEach(() => {
			mock = autoMocker.mockClass(TestAutoMocker)
		});

		it('should return the proper response when called', () => {
			autoMocker.withFirstArgMappedReturn(mock.add, {2: 10, 3: 20}, 30);
			const result = mock.add(2, 3);
			const res2 = mock.add(3, 4);
			const res3 = mock.add(4, 5);
			expect(result).toBe(10);
			expect(res2).toBe(20);
			expect(res3).toBe(30);
		});

		it('should throw error when method is not a spy', () => {
			expect(() => autoMocker.withFirstArgMappedReturn(() => {
			}, {}, null)).toThrowError();
		});
	});

	describe("withCallThrough", () => {
		let mock: TestAutoMocker;

		beforeEach(() => {
			mock = autoMocker.mockClass(TestAutoMocker);
		});

		it("should call the spy function and return undefined when called", () => {
			autoMocker.withCallThrough(mock.add);
			const num1 = Math.floor(Math.random() * 10), num2 = Math.floor(Math.random() * 10);
			const result = mock.add(num1, num2);
			expect(result).toBeUndefined();
		});

		it('should throw an error when method is not a spy', () => {
			expect(() => autoMocker.withCallThrough(() => {
			}, "notASpy")).toThrowError();
		});
	});

	describe("withReturnValue", () => {
		let mock: TestAutoMocker;

		beforeEach(() => {
			mock = autoMocker.mockClass(TestAutoMocker);
		});

		it("should return the correct value when called", () => {
			const returnValue = Math.floor(Math.random() * 10);
			autoMocker.withReturnValue(mock.add, returnValue);
			const result = mock.add(2, 3);
			expect(result).toBe(returnValue);
		});

		it("should throw error when method is not a spy", () => {
			expect(() => autoMocker.withReturnValue(() => {
			}, void 0)).toThrowError();
		});
	});

	describe("withReturnForArguments", () => {
		it('should throw error when method is not a spy', () => {
			expect(() => autoMocker.withReturnForArguments(() => {
			}, [], null)).toThrowError();
		});

		it("should return the correct value for different sets of args", () => {
			const mock = autoMocker.mockClass(TestAutoMocker);
			autoMocker.withReturnForArguments(mock.add, [2, 3], 10);
			autoMocker.withReturnForArguments(mock.add, [3, 4], 20);
			autoMocker.withReturnForArguments(mock.add, [4, 5], 30);

			expect(mock.add(2, 3)).toBe(10);
			expect(mock.add(3, 4)).toBe(20);
			expect(mock.add(4, 5)).toBe(30);
		});
	});

	describe('withReturnValues', () => {
		it("should return the correct values in order when called multiple times", () => {
			const mock = autoMocker.mockClass(TestAutoMocker);
			autoMocker.withReturnValues(mock.add, [10, 20, 30]);
			expect(mock.add(2, 3)).toBe(10);
			expect(mock.add(3, 4)).toBe(20);
			expect(mock.add(4, 5)).toBe(30);
		});

		it("should return undefined when called more times than there are return values", () => {
			const mock = autoMocker.mockClass(TestAutoMocker);
			autoMocker.withReturnValues(mock.add, [10, 20]);
			expect(mock.add(2, 3)).toBe(10);
			expect(mock.add(3, 4)).toBe(20);
			expect(mock.add(4, 5)).toBeUndefined();
		});

		it('should throw an error when method is not a spy', () => {
			expect(() => autoMocker.withReturnValues(() => {
			}, [])).toThrowError();
		});
	});

	describe("withThrows", () => {
		it("should throw not a spy error when method is not a spy", () => {
			try {
				autoMocker.withThrows(() => {
				});
				/* istanbul ignore next */
				fail('Should have thrown an error');
			} catch (e) {
				expect((e as Error).message.includes('not an actual spy')).toBeTrue();
			}
		});

		it('should throw correct error when method is called', () => {
			const mock = autoMocker.mockClass(TestAutoMocker);
			autoMocker.withThrows(mock.add, "Test error");

			try {
				const res = mock.add(2, 3);
				/* istanbul ignore next */
				fail(`Should have thrown an error instead of receiving value: ${res}`);
			} catch (e) {
				expect((e as Error).message).toBe("Test error");
			}
		});
	});

	describe("resetSpy", () => {
		it("should reset the spy", () => {
			const mock = autoMocker.mockClass(TestAutoMocker);
			mock.add(1, 2);
			expect((mock.add as jasmine.Spy).calls.all().length).toEqual(1);
			autoMocker.resetSpy(mock.add);
			expect((mock.add as jasmine.Spy).calls.all().length).toEqual(0);
		});

		it("should throw error when method is not a spy", () => {
			expect(() => autoMocker.resetSpy(() => {
			})).toThrowError();
		});
	})

	describe("withCallAccessorFake", () => {
		describe("get", () => {
			it("should return the proper value when accessing the property", () => {
				const mock = autoMocker.mockClass(TestAutoMocker);
				autoMocker.withCallAccessorFake(mock, "Value", "get", () => 10);
				const result = mock.Value;
				expect(result).toBe(10);
			});
		});

		describe("set", () => {
			it("should call the fake when called", () => {
				const mock = autoMocker.mockClass(TestAutoMocker);
				let wasCalled = false;
				autoMocker.withCallAccessorFake(mock, "Value", "set", (_) => {
					wasCalled = true;
				});
				mock.Value = 5;
				expect(wasCalled).toBe(true);
			});
		});
	});

	describe("withCallAccessorThrough", () => {
		it("should track call counts", () => {
			const mock = autoMocker.mockClass(TestAutoMocker);

			autoMocker.withCallAccessorThrough(mock, "Value", "get");

			let descriptor = Object.getOwnPropertyDescriptor(mock, "Value");
			expect(autoMocker.getCallCount(descriptor.get)).toEqual(0);
			mock.Value;
			expect(autoMocker.getCallCount(descriptor.get)).toEqual(1);
		});
	});

	describe("withReturnGetterValue", () => {
		it("should return the proper value when called", () => {
			const mock = autoMocker.mockClass(TestAutoMocker);

			autoMocker.withReturnGetterValue(mock, "Value", 123);
			const result = mock.Value;
			expect(result).toEqual(123);
		});
	});

	describe("withReturnGetterValues", () => {
		it("should return the proper values for each call", () => {
			const mock = autoMocker.mockClass(TestAutoMocker);
			const expected = [1, 2, 3, 4, 5, 6, 7, 8, 9];

			autoMocker.withReturnGetterValues(mock, "Value", expected);
			for (let i = 0; i < expected.length; i++) {
				const result = mock.Value;
				expect(result).toEqual(expected[i]);
			}
		});
	});

	describe("withAccessorThrows", () => {
		it("get should throw an error when called", () => {
			const mock = autoMocker.mockClass(TestAutoMocker);
			autoMocker.withAccessorThrows(mock, "Value", "get", "Test error");
			expect(() => mock.Value).toThrowError("Test error");
		});

		it("set should throw error when called", () => {
			const mock = autoMocker.mockClass(TestAutoMocker);
			autoMocker.withAccessorThrows(mock, "Value", "set", "I'm a test");
			expect(() => {
				mock.Value = 15
			}).toThrowError("I'm a test");
		});
	});

	describe("resetAccessorSpy", () => {
		it("should reset the call count on the spy", () => {
			const mock = autoMocker.mockClass(TestAutoMocker);
			const descriptor = Object.getOwnPropertyDescriptor(mock, "Value");
			expect(autoMocker.getCallCount(descriptor.get)).toEqual(0);
			mock.Value;
			expect(autoMocker.getCallCount(descriptor.get)).toEqual(1);
			autoMocker.resetAccessorSpy(mock, "Value", "get");
			expect(autoMocker.getCallCount(descriptor.get)).toEqual(0)
		});
	});

	describe("getCallArgs", () => {
		it("should return the arguments that were passed for the call to the method", () => {
			const mock = autoMocker.mockClass(TestAutoMocker);
			autoMocker.withCallThrough(mock.add);

			mock.add(1, 2);
			const params = autoMocker.getCallArgs(mock.add);

			expect(params).toEqual([1, 2])
		});

		it("should throw an error when method is not a spy", () => {
			expect(() => autoMocker.getCallArgs(() => {
			})).toThrowError();
		});
	});

	describe("getCallCount", () => {
		it("should return the correct call count", () => {
			const mock = autoMocker.mockClass(TestAutoMocker);
			autoMocker.withCallThrough(mock.add);

			let callCount = autoMocker.getCallCount(mock.add);
			expect(callCount).toEqual(0);
			mock.add(1, 2);
			callCount = autoMocker.getCallCount(mock.add);
			expect(callCount).toEqual(1);
		});

		it("should throw error if method is not a spy", () => {
			expect(() => autoMocker.getCallCount(() => {
			})).toThrowError();
		});
	});

	describe("[private] mockValue", () => {
		let methodUnderTest: <T>(objectName: string, objectToMock: T, key: keyof T, depth: number, maxDepth: number) => T;
		const testObject = {
			undefVal: undefined,
			arrayVal: [1, 2, 3],
			func: () => console.log("test func"),
			objVal: {
				key1: "test",
				key2: "keys"
			},
			deepObjVal: {
				nestedObj: {
					num: 12
				},
				str: "test"
			},
			strVal: "test string",
			dateVal: new Date(),
			numVal: 12345,
			boolVal: true
		}

		beforeEach(() => {
			// @ts-ignore
			methodUnderTest = autoMocker["mockValue"];
		});

		it("should return undefined", () => {
			const res = methodUnderTest.call(autoMocker,"testObject", testObject, "undefVal", 0, 1);
			expect(res).toBeUndefined();
		});

		it("should return an array", () => {
			const res = methodUnderTest.call(autoMocker, "testObject", testObject, "arrayVal", 0, 1);
			expect(res.length).toEqual(3);
		});

		it("should return original value when depth is equal to maxDepth", () => {
			const res = methodUnderTest.call(autoMocker, "testObject", testObject, "arrayVal", 0, 0);
			expect(res).toEqual(testObject.arrayVal);
		});

		it("should make function a spy", () => {
			const res = methodUnderTest.call(autoMocker, "testObject", testObject, "func", 0, 1)
			expect((res as jasmine.Spy).calls).toBeDefined();
		});

		it("should return the spy if method is a spy", () => {
			const spy = jasmine.createSpy("func", testObject.func);
			testObject.func = spy
			const res = methodUnderTest.call(autoMocker, "test", testObject, "func", 0, 1);
			expect(res).toEqual(spy);
		});

		it("should return the object", () => {
			const res = methodUnderTest.call(autoMocker, "test", testObject, "objVal", 0, 0)
			expect(res).toEqual(testObject.objVal);
		});

		it("should return a truncated object", () => {
			const res = methodUnderTest.call(autoMocker, "test", testObject, "deepObjVal", 0, 1);
			expect(res).toBeTruthy();
		});

		it("should return a string", () => {
			const res = methodUnderTest.call(autoMocker, "test", testObject, "strVal", 0, 1);
			expect(res).toBeTruthy();
		});

		it("should return a date", () => {
			const res = methodUnderTest.call(autoMocker, "test", testObject, "dateVal", 0, 0);
			expect(typeof res).toEqual("object");
		})
	});
});

// this is only for coverage and coverage errors
describe("TestAutoMocker", () => {
	it("should create", () => {
		const mock = new TestAutoMocker();
		expect(mock).toBeTruthy();
	});

	it("should add", () => {
		const mock = new TestAutoMocker();
		const res = mock.add(1, 2);
		expect(res).toEqual(3);
	});

	it("should get _value", () => {
		const mock = new TestAutoMocker();
		const res = mock.Value;
		expect(res).toEqual(4);
	});

	it("should set _value", () => {
		const mock = new TestAutoMocker();
		mock.Value = 123;
		expect(mock.Value).toEqual(123);
	});

	it("should get _value from get only property", () => {
		const mock = new TestAutoMocker();
		expect(mock.Values).toEqual(4);
	});

	it("should set _value from set only property", () => {
		const mock = new TestAutoMocker();
		mock.UpdateValues = 123;
		expect(mock.Value).toEqual(123);
	})
})
