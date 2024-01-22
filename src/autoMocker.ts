// noinspection JSValidateJSDoc

import isEmpty from "lodash/isEmpty";
import uniq from "lodash/uniq";
import { Accessor, Constructor } from "@types-local";

/**
 * Represents the data structure for member data of a given type.
 * @interface
 * @template T - The type of the member data.
 */
interface IMemberData<T> {
	/**
	 * An array containing the names of methods in the given object type.
	 *
	 * @type {readonly (keyof T)[]}
	 */
	readonly methodNames: readonly (keyof T)[];
	/**
	 * Represents an array of defined property data. Property data is limited to getters and setters.
	 * @name definedPropertiesData
	 * @type {ReadonlyArray<IDefinedPropertyData<T>>}
	 * @readonly
	 * @memberof YourNamespace
	 */
	readonly definedPropertiesData: readonly IDefinedPropertyData<T>[];
}

/**
 * Represents defined property data.
 * @interface
 * @template T - The type of the target object.
 */
interface IDefinedPropertyData<T> {
	/**
	 * Represents the name of a property in an object.
	 *
	 * @readonly
	 * @type {keyof T}
	 */
	readonly propertyName: keyof T;
	/**
	 * Flag indicating whether the variable has a setter method or not.
	 * @type {boolean}
	 * @readonly
	 */
	readonly hasSet: boolean;
	/**
	 * Flag indicating whether the variable has a getter method or not.
	 *
	 * @type {boolean}
	 * @readonly
	 */
	readonly hasGet: boolean;
}

/**
 * Interface representing options for mocking a class.
 */
export interface IMockClassOptions<T> {
	/**
	 * Additional methods to be mocked as part of the mocked class.
	 * Examples would be private or protected methods that aren't normally available.
	 *
	 * Default value: ``` [] ```
	 */
	readonly additionalMethodsToMock: readonly (keyof T)[];
	/**
	 * Getters and Setters that you would like to have an undefined implementation of.
	 *
	 * Default value: ``` [] ```
	 */
	readonly ignoredProperties: readonly (keyof T)[]
	/**
	 * Ignore all Getters and Setters
	 *
	 * Default value: ``` false ```
	 */
	readonly ignoreAllProperties: boolean;
}

const mockClassOptionsDefaults: IMockClassOptions<any> = {
	additionalMethodsToMock: [],
	ignoredProperties: [],
	ignoreAllProperties: false
}


export class AutoMocker {

	constructor(private readonly maxDepth: number = 1) {}

	/**
	 * Creates a mock object of a given class with the specified options.
	 *
	 * @param {Constructor<T>} ctor - The class constructor to mock.
	 * @param {Partial<IMockClassOptions<T>>} [options] - The options for mocking the class.
	 * @return {T} - The mock object.
	 */
	public mockClass<T>(
		ctor: Constructor<T>,
		options?: Partial<IMockClassOptions<T>>
	): T {
		const appliedOptions = {
			...mockClassOptionsDefaults as IMockClassOptions<T>,
			...options
		};

		const memberData = this.getMemberData(ctor);
		const allMethodsToMock: readonly (keyof T)[] = uniq([
			...memberData.methodNames,
			...appliedOptions.additionalMethodsToMock
		]);

		const mock = isEmpty(allMethodsToMock)
			? ({} as T)
			: jasmine.createSpyObj<T>(
				ctor.prototype.constructor.name,
				allMethodsToMock as jasmine.SpyObjMethodNames<T>
			);

		if (!appliedOptions.ignoreAllProperties) {
			memberData.definedPropertiesData
				.filter(
					(propertyData) =>
						!appliedOptions.ignoredProperties.includes(propertyData.propertyName)
				)
				.forEach((propertyData) => {
					this.addMockDefinedProperty<T>(mock, propertyData)
				});
		}

		return mock;
	}

	/**
	 * Mocks an object by replacing its properties and methods with mock implementations.
	 *
	 * @param {string} objectName - The name of the object to mock.
	 * @param {T} objectToMock - The object to mock.
	 * @param {number} [maxDepth] - The maximum depth to traverse when mocking nested objects. Defaults to the maximum depth defined in the MockingService instance.
	 *
	 * @return {void}
	 */
	public mock<T extends {}>(objectName: string, objectToMock: T, maxDepth?: number): void {
		/* istanbul ignore else */
		if (!!objectToMock && this.isObject(objectToMock) || /* istanbul ignore next */ this.isFunction(objectToMock)) {
			this.mockObject(objectName, objectToMock, 0, maxDepth || this.maxDepth);
		}
	}

	/**
	 * Sets up a spy to call a fake function instead of the original function when it is called.
	 *
	 * @param {Function} spy - The spy to set up with a fake function.
	 * @param {Function} fakeFunction - The fake function to be called instead of the original function.
	 * @param {string} [spyName] - Optional name of the spy.
	 * @return {void}
	 */
	public withCallFake<TFunction extends (...args: any[]) => any>(
		spy: TFunction,
		fakeFunction: (...params: Parameters<TFunction>) => ReturnType<TFunction>,
		spyName?: string
	): void {
		if (this.isSpyLike(spy)) {
			spy.and.callFake(fakeFunction);
			return;
		}
		this.throwNotASpyError('withCallFake', spyName);
	}

	/**
	 * Sets up a spy function to return specific values based on the first argument.
	 *
	 * @param {Function} spy - The spy function to set up.
	 * @param {Object} returnMap - An object that maps first argument values to return values.
	 * @param {any} defaultReturn - The default return value if the first argument does not have a mapping.
	 * @param {string} [spyName] - The name of the spy function for error messaging purposes.
	 * @returns {void}
	 */
	public withFirstArgMappedReturn<T>(
		spy: (arg1: string | number, ...args: any[]) => T,
		returnMap: Record<string | number, T>,
		defaultReturn: T = undefined,
		spyName?: string
	): void {
		if (this.isSpyLike(spy)) {
			spy.and.callFake((key) =>
			Object.prototype.hasOwnProperty.call(returnMap, key)
				? returnMap[key]
				: defaultReturn
			)
			return;
		}
		this.throwNotASpyError('withFirstArgMappedReturn', spyName)
	}

	/**
	 * Applies spy functionality to the target spy. Calling the spy will always return undefined
	 *
	 * @param {Function} spy - The spy to apply the callThrough functionality to.
	 * @param {string} [spyName] - The name of the spy. Optional.
	 * @return {void}
	 * @throws {TypeError} Throws a TypeError if the argument is not a spy.
	 */
	public withCallThrough(spy: Function, spyName?: string): void {
		if (this.isSpyLike(spy)) {
			spy.and.callThrough();
			return;
		}
		this.throwNotASpyError('withCallThrough', spyName);
	}

	/**
	 * Sets the return value for a spy function.
	 *
	 * @param {function} spy - The spy function.
	 * @param {any} returnValue - The return value to be set.
	 * @param {string} [spyName] - Optional name of the spy.
	 *
	 * @returns {void}
	 */
	public withReturnValue<T>(spy: (...args: any[]) => T, returnValue: T, spyName?: string): void {
		if (this.isSpyLike(spy)) {
			spy.and.returnValue(returnValue);
			return;
		}
		this.throwNotASpyError('withReturnValue', spyName);
	}

	/**
	 * Sets up a spy to return a specified value for a given set of arguments.
	 *
	 * @param {Function} spy - The spy function to set up.
	 * @param {Array} args - An array of arguments to be used when calling the spy function.
	 * @param {any} returnValue - The value to be returned when the spy function is called with the specified arguments.
	 * @param {string} [spyName] - An optional name for the spy function.
	 * @returns {void}
	 */
	public withReturnForArguments<TFunction extends (...args: any[]) => any>(
		spy: TFunction,
		args: [...Parameters<TFunction>],
		returnValue: ReturnType<TFunction>,
		spyName?: string
	): void {
		if (!this.isSpyLike(spy)) {
			this.throwNotASpyError('withReturnForArguments', spyName);
		}
		spy.withArgs(...args).and.returnValue(returnValue);
	}

	/**
	 * Sets the return values for the given spy function. Values will be returned in the order passed.
	 *
	 * @param {Function} spy - The spy function.
	 * @param {Array} returnValues - An array of return values for the spy function.
	 * @param {string} [spyName] - Optional name of the spy function.
	 * @return {void}
	 */
	public withReturnValues<T>(
		spy: (...args: any) => T,
		returnValues: T[],
		spyName?: string
	): void {
		if (this.isSpyLike(spy)) {
			spy.and.returnValues(...returnValues);
			return;
		}

		this.throwNotASpyError('withReturnValues', spyName);
	}

	/**
	 * Sets up a spy to throw an error when called.
	 *
	 * @param {Function} spy - The spy to set up.
	 * @param {string} [message] - The error message to throw.
	 * @param {string} [spyName] - The name of the*/
	public withThrows(spy: Function, message?: string, spyName?: string): void {
		if (this.isSpyLike(spy)) {
			spy.and.throwError(message);
			return;
		}

		this.throwNotASpyError('withThrows', spyName);
	}

	/**
	 * Resets the call count and other state of the spy object.
	 *
	 * @param {Function} spy - The spy object to reset.
	 * @param {string} [spyName] - The name of the spy object (optional).
	 * @return {void}
	 */
	public resetSpy(spy: Function, spyName?: string): void {
		if (this.isSpyLike(spy)) {
			spy.calls.reset();
			return;
		}

		this.throwNotASpyError('resetSpy', spyName);
	}

	/**
	 * Overrides a property accessor on an object with a fake function for testing purposes.
	 *
	 * @param {Object} obj - The object containing the property.
	 * @param {string} key - The key of the property.
	 * @param {Accessor} accessor - The type of accessor (get or set).
	 * @param {Function} fakeFunction - The fake function to be used as the property accessor.
	 * @param {string} [spyName] - An optional name for the spy.
	 *
	 * @return {void}
	 */
	public withCallAccessorFake<T>(
		obj: T,
		key: keyof T,
		accessor: Accessor,
		fakeFunction: (params: any[]) => any,
		spyName?: string
	): void {
		this.withCallFake(this.getPropertyAccessorSpy(obj, key, accessor), fakeFunction, spyName);
	}

	/**
	 * Executes the specified accessor method on the given object with the provided key.
	 *
	 * @param {T} obj - The object on which to call the accessor method.
	 * @param {keyof T} key - The key for the accessor method.
	 * @param {Accessor} accessor - The accessor method to call.
	 * @param {string} [spyName] - The name of the spy to log for testing purposes.
	 *
	 * @return {void}
	 */
	public withCallAccessorThrough<T>(
		obj: T,
		key: keyof T,
		accessor: Accessor,
		spyName?: string
	): void {
		this.withCallThrough(this.getPropertyAccessorSpy(obj, key, accessor), spyName);
	}

	/**
	 * Sets the return value for calls to the specified getter.
	 *
	 * @param {object} obj - The object on which the getter is defined.
	 * @param {string} key - The key/name of the property to set.
	 * @param {*} returnValue - The expected return value of the property getter.
	 * @param {string} [spyName] - The name of the spy function used for assertion.
	 * @returns {void}
	 */
	public withReturnGetterValue<T, K extends keyof T>(
		obj: T,
		key: K,
		returnValue: T[K],
		spyName?: string
	): void {
		this.withReturnValue(this.getPropertyAccessorSpy(obj, key, "get"), returnValue, spyName);
	}

	/**
	 * Sets up a spy function on the given object's getter method, which will return the specified values.
	 *
	 * @param {object} obj - The object to set up the spy on.
	 * @param {string} key - The name of the getter method to spy on.
	 * @param {Array} returnValues - The array of values to be returned by the spy function.
	 * @param {string} [spyName] - Optional name for the spy function.
	 * @return {void}
	 */
	public withReturnGetterValues<T, K extends keyof T>(
		obj: T,
		key: K,
		returnValues: T[K][],
		spyName?: string
	): void {
		this.withReturnValues(this.getPropertyAccessorSpy(obj, key, "get"), returnValues, spyName);
	}

	/**
	 * Sets up an accessor to throw an error.
	 *
	 * @param {T} obj - The object on which to set up the spy.
	 * @param {K} key - The key of the property on which to execute the accessor function.
	 * @param {Accessor} [accessor] - An optional function that accesses the given property on the object.
	 * @param {string} [message] - An optional error message to be thrown if the accessor fails.
	 * @param {string} [spyName] - An optional name for the spy function that represents the accessor.
	 * @returns {void}
	 */
	public withAccessorThrows<T, K extends keyof T>(
		obj: T,
		key: K,
		accessor?: Accessor,
		message?: string,
		spyName?: string
	): void {
		this.withThrows(this.getPropertyAccessorSpy(obj, key, accessor), message, spyName);
	}

	/**
	 * Resets the accessor spy for a given object and key.
	 *
	 * @param {Object} obj - The object to reset the spy for.
	 * @param {string} key - The key of the property to reset the spy for.
	 * @param {Accessor} [accessor] - The accessor type of the property. Defaults to undefined.
	 * @param {string} [spyName] - The name of the spy to reset. Defaults to undefined.
	 * @returns {void}
	 */
	public resetAccessorSpy<T, K extends keyof T>(
		obj: T,
		key: K,
		accessor?: Accessor,
		spyName?: string
	): void {
		this.resetSpy(this.getPropertyAccessorSpy(obj, key, accessor), spyName);
	}

	/**
	 * Retrieves the arguments for a specific call made to a spy function.
	 *
	 * @param {TFunction} spy - The spy function.
	 * @param {number} callIndex - The index of the call for which to retrieve the arguments. Default value is 0.
	 * @param {string} [spyName] - The name of the spy function. Optional parameter used for error reporting.
	 * @returns {Array} - An array containing the arguments of the specified call.
	 */
	public getCallArgs<TFunction extends (...args: any[]) => any>(
		spy: TFunction,
		callIndex: number = 0,
		spyName?: string
	): Parameters<TFunction> {
		if (this.isSpyLike(spy)) {
			return spy.calls.argsFor(callIndex) as Parameters<TFunction>;
		}

		this.throwNotASpyError('getCallArgs', spyName);
	}

	/**
	 * Retrieves the number of times a spy has been called.
	 *
	 * @param {Function} spy - The spy function to get the call count for.
	 * @param {string} [spyName] - Optional name for the spy function.
	 * @returns {number} - The number of times the spy function has been called.
	 */
	public getCallCount<TFunction extends (...args: any) => any>(
		spy: TFunction,
		spyName?: string
	): number {
		if (!this.isSpyLike(spy)) {
			this.throwNotASpyError('getCallCount', spyName);
		}

		return spy.calls.all().length;
	}

	/**
	 * Retrieves member data for the given constructor.
	 *
	 * @template T
	 * @param {Constructor<T>} ctor - The constructor to retrieve member data for.
	 * @private
	 * @returns {IMemberData<T>} The member data.
	 */
	private getMemberData<T>(ctor: Constructor<T>): IMemberData<T> {
		const methodNames: (keyof T)[] = [];
		const definedPropertiesData: IDefinedPropertyData<T>[] = [];

		let currentPrototype: any = ctor.prototype;
		do {
			if (currentPrototype.constructor.name === "Object") {
				break;
			}

			(Object.getOwnPropertyNames(currentPrototype) as (keyof T)[]).forEach((memberName) => {
				if (memberName === "constructor") {
					return;
				}

				const propertyData = this.getDefinedPropertyData(currentPrototype, memberName);
				if (propertyData && (propertyData.hasGet || propertyData.hasSet)) {
					definedPropertiesData.push(propertyData);
					return;
				}
				/* istanbul ignore else: Not a possible situation */
				if (this.isFunction(currentPrototype[memberName])) {
					methodNames.push(memberName);
					return;
				}
			})
		} while ((currentPrototype = Object.getPrototypeOf(currentPrototype)));

		return {
			methodNames,
			definedPropertiesData
		};
	}

	/**
	 * Gets the defined property data of an object.
	 *
	 * @param {T} obj - The object to get the property data from.
	 * @param {keyof T} propertyName - The name of the property.
	 * @returns {IDefinedPropertyData<T>} - The defined property data.
	 * @private
	 */
	private getDefinedPropertyData<T>(obj: T, propertyName: keyof T): IDefinedPropertyData<T> {
		try {
			const descriptor = Object.getOwnPropertyDescriptor(obj, propertyName);
			return {
				propertyName: propertyName,
				hasSet: descriptor && this.isFunction(descriptor.set),
				hasGet: descriptor && this.isFunction(descriptor.get)
			};
		} catch {
			/* istanbul ignore next */
			return null;
		}
	}

	/**
	 * Adds a defined property to the given mock object.
	 *
	 * @param {T} mock - The mock object.
	 * @param {IDefinedPropertyData<T>} propertyData - The data for the property.
	 * @private
	 * @returns {void}
	 */
	private addMockDefinedProperty<T>(mock: T, propertyData: IDefinedPropertyData<T>): void {
		const attributes = {
			get: propertyData.hasGet ? () => {} : /* istanbul ignore next */ undefined,
			set: propertyData.hasSet ? () => {} : /* istanbul ignore next */ undefined,
			configurable: true
		};
		Object.defineProperty(mock, propertyData.propertyName, attributes);
		this.mockAsProperty(mock, propertyData.propertyName);
	}

	/**
	 * Mocks properties of an object recursively up to a maximum depth.
	 *
	 * @param {string} objectName - The name of the object being mocked.
	 * @param {Object} objectToMock - The object to be mocked.
	 * @param {number} depth - The current depth of recursion.
	 * @param {number} maxDepth - The maximum depth of recursion.
	 * @private
	 * @returns {T[keyof T]}
	 */
	private mockObject<T extends {}>(
		objectName: string,
		objectToMock: T,
		depth: number,
		maxDepth: number
	): T {
		/* istanbul ignore if: will need to revisit this */
		if (this.isFunction(objectToMock)) {
			objectToMock = (jasmine.createSpy("fn", objectToMock as unknown as jasmine.Func).and.callThrough() as unknown as T);
			return;
		}
		const objectKeys = this.getInstancePropertyNames(objectToMock);
		objectKeys.forEach((key: keyof T & string) => {
			try {
				/* istanbul ignore else */
				if (!this.mockAsProperty(objectToMock, key)) {
					objectToMock[key] = this.mockValue(
						objectName,
						objectToMock,
						key,
						depth++,
						maxDepth
					);
				}
			} catch (e) {
				/* istanbul ignore next */
				console.error(
					`Unable to mock ${objectName}.${key} with preexisting value of ${objectToMock[key]}`
				)
			}
		});
		return objectToMock;
	}

	/**
	 * Retrieves the instance property names of the given object.
	 *
	 * @param {T} objectToMock - The object to retrieve property names from.
	 * @returns {string[]} - An array of instance property names.
	 * @private
	 */
	private getInstancePropertyNames<T>(objectToMock: T): string[] {
		let names: Set<string> = new Set();
		let proto = objectToMock;
		while (proto && proto !== Object.prototype) {
			Object.getOwnPropertyNames(proto).forEach((name) => {
				/* istanbul ignore else */
				if (name !== "constructor") {
					names.add(name);
				}
			});
			proto = Object.getPrototypeOf(proto);
		}
		return Array.from(names);
	}

	/**
	 * Mocks a property on an object for testing purposes.
	 *
	 * @param {object} objectToMock - The object to mock the property on.
	 * @param {string} key - The key of the property to mock.
	 * @returns {boolean} - `true` if the property was successfully mocked, `false` otherwise.
	 * @private
	 */
	private mockAsProperty<T extends {}>(objectToMock: T, key: keyof T): boolean {
		let descriptor: PropertyDescriptor;
		do {
			descriptor = Object.getOwnPropertyDescriptor(objectToMock, key);
		} while (!descriptor && /* istanbul ignore next */ (objectToMock = Object.getPrototypeOf(objectToMock)));

		if (descriptor && (descriptor.get || descriptor.set)) {
			if (descriptor.get && !this.isSpyLike(descriptor.get)) {
				spyOnProperty(objectToMock, key, "get").and.callThrough();
			}
			if (descriptor.set && !this.isSpyLike(descriptor.set)) {
				spyOnProperty(objectToMock, key, "set");
			}
			return true;
		}
		return false;
	}

	/**
	 * Mocks a value for a given object property.
	 *
	 * @param {string} objectName - The name of the object.
	 * @param {T} objectToMock - The object to mock.
	 * @param {keyof T} key - The key of the property to mock.
	 * @param {number} depth - The current depth of recursion.
	 * @param {number} maxDepth - The maximum depth of recursion.
	 * @returns {T[keyof T & string]} - The mocked value.
	 * @private
	 */
	private mockValue<T>(
		objectName: string,
		objectToMock: T,
		key: keyof T,
		depth: number,
		maxDepth: number
	): T[keyof T & string] {
		const value = objectToMock[key];

		if (this.isUndefined(value) || value === null) {
			// @ts-ignore
			return value;
		}

		if (Array.isArray(value)) {
			// @ts-ignore
			return depth < maxDepth
				? value.map((item, i) =>
					this.mockValue(`${objectName}[${i}]`, value, i as any, depth++, maxDepth)
				) : value;
		}
		if (this.isFunction(value)) {
			// @ts-ignore
			return this.isSpyLike(value)
				? value
				: spyOn(objectToMock, key as T[keyof T] extends Function ? keyof T : never)
		}
		if (this.isObject(value)) {
			// @ts-ignore
			return depth < maxDepth
				? this.mockObject(`${objectName}.${String(key)}`, value, ++depth, maxDepth)
				: value;
		}
		if (this.isString(value)) {
			// @ts-ignore
			return `${objectName}.${String(key)}` + this.generateNumber().toString();
		}
		if (this.isDate(value)) {
			// @ts-ignore
			return new Date(2000, 1, 1, 1, 1, 1, 1);
		}
		if (this.isNumber(value)) {
			// @ts-ignore
			return this.generateNumber();
		}
		return value;
	}

	/**
	 * Returns a Jasmine spy for the specified property accessor of an object.
	 * If the object or its prototype chain does not contain the specified property, null is returned.
	 *
	 * @param {T} obj - The object to inspect.
	 * @param {keyof T} key - The key of the property.
	 * @param {Accessor} accessor - The type of accessor to spy on (e.g., "get" or "set").
	 * @returns {jasmine.Spy|null} - A Jasmine spy for the specified property accessor or null if not found.
	 * @private
	 */
	private getPropertyAccessorSpy<T>(
		obj: T,
		key: keyof T,
		accessor: Accessor
	): jasmine.Spy {
		let descriptor: PropertyDescriptor;
		do {
			descriptor = Object.getOwnPropertyDescriptor(obj, key);
		} while (!descriptor && (obj = Object.getPrototypeOf(obj)));

		if (!descriptor) {
			return null;
		}

		return descriptor[accessor] as jasmine.Spy;
	}

	/**
	 * Throws an error indicating that the provided spy is not an actual spy.
	 *
	 * @param {string} caller - The name of the calling function or component.
	 * @param {string} [spyName="[spyName not provided]"] - The name of the spy.
	 *
	 * @protected
	 * @returns {never} - This function does not return a value.
	 */
	protected throwNotASpyError(caller: string, spyName: string = "[spyName not provided]"): never {
		throw new Error(`${caller}: Provided spy ${spyName} is not an actual spy.`)
	}

	/**
	 * Generates a random number between 0 and 999.
	 *
	 * @private
	 * @returns {number} The generated random number.
	 */
	private generateNumber(): number {
		return Math.floor(Math.random() * 1000);
	}

	/**
	 * Checks if a value is a function.
	 *
	 * @param {any} value - The value to check.
	 * @return {boolean} - true if the value is a function, false otherwise.
	 * @private
	 */
	private isFunction(value: any): value is Function {
		return typeof value === "function";
	}

	/**
	 * Check if a value is an object.
	 *
	 * @param {*} value - The value to check.
	 * @returns {boolean} - Returns true if the value is an object, otherwise returns false.
	 * @private
	 */
	private isObject(value: any): value is Object {
	 	return value !== null && typeof value === 'object';
	}

	/**
	 * Checks if a given value is a Date object.
	 *
	 * @param {any} value - The value to be checked.
	 * @returns {boolean} - Returns true if the value is a Date object, otherwise returns false.
	 * @private
	 */
	private isDate(value: any): value is Date {
		return toString.call(value) === "[object Date]";
	}

	/**
	 * Checks if the given value is a number.
	 *
	 * @param {any} value - The value to check.
	 * @private
	 * @return {boolean} - True if the value is a number, false otherwise.
	 */
	private isNumber(value: any): value is number {
		return typeof value === "number";
	}

	/**
	 * Checks if the given value is a string.
	 *
	 * @param {*} value - The value to be checked.
	 * @returns {boolean} - Returns true if the value is a string, false otherwise.
	 */
	private isString(value: any): value is string {
		return typeof value === "string";
	}

	/**
	 * Checks if a value is undefined.
	 *
	 * @param {any} value - The value to check.
	 * @returns {boolean} Returns true if the value is undefined, else false.
	 * @private
	 */
	private isUndefined(value: any): boolean {
		return typeof value === "undefined";
	}

	/**
	 * Checks if the given value is spy-like.
	 *
	 * @param {any} value - The value to be checked.
	 * @protected
	 * @return {boolean} - Returns true if the value is spy-like, false otherwise.
	 */
	protected isSpyLike(value: any): value is jasmine.Spy {
		return value && !!value.calls;
	}
}