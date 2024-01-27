import { NEVER, Observable, of, ReplaySubject, startWith, Subject, throwError } from "rxjs";
import { AutoMocker } from './autoMocker';
import { TestSubscriptionCounter } from './test-subscription-counter';
import { ObservablePropertyNames } from '@types-local'

type ObservableType<T> = T extends Observable<infer U> ? U : T;

/**
 * Represents a subject counter that associates a ReplaySubject with a TestSubscriptionCounter.
 *
 * @template T The type of values emitted by the ReplaySubject.
 */
export interface ISubjectCounter<T> {
	subject: ReplaySubject<T>,
	counter: TestSubscriptionCounter<T>
}

export class AutoMockerPlus extends AutoMocker {
	/**
	 * Creates an Observable that mimics the behavior of a spy function.
	 *
	 * @template T - The type that the observable returns
	 * @param {function} spy - The function to spy on.
	 * @param {T} [resolveWith] - The value to resolve the Observable with.
	 * @param {string} [spyName] - The name of the spy function.
	 * @returns {Observable} - An Observable that resolves to the provided value when the spy function is called.
	 */
	public withReturnObservable<T>(
		spy: (...args: any[]) => Observable<T>,
		resolveWith?: T,
		spyName?: string
	): Observable<T> {
		if (this.isSpyLike(spy)) {
			const observable = of(resolveWith);
			spy.and.returnValue(observable);
			return observable;
		}
		this.throwNotASpyError('withReturnObservable', spyName);
	}

	/**
	 * Returns a non-emitting observable that is either the provided spy's return value or a thrown error.
	 *
	 * @template T - Type of the emissions from the observable
	 * @param {(...args: any[]) => Observable<T>} spy - The spy function to be called.
	 * @param {string} [spyName] - The name of the spy function (optional).
	 * @returns {Observable<T>} - A non-emitting observable, either the spy's return value or an error.
	 */
	public withReturnNonEmittingObservable<T>(
		spy: (...args: any[]) => Observable<T>,
		spyName?: string
	): Observable<T> {
		if (this.isSpyLike(spy)) {
			const observable: Observable<T> = NEVER;
			spy.and.returnValue(observable);
			return observable;
		}
		this.throwNotASpyError("withReturnNonEmittingObservable", spyName);
	}

	/**
	 * Returns a TestSubscriptionCounter object that completes based on the provided nextValue.
	 * The counter is used to track the number of subscriptions to the observable returned by the spy function.
	 *
	 * @template T - The type of data included in the observable.
	 * @param {function} spy The spy function that should be replaced with the counter.
	 * @param {T} [nextValue] The value that should be emitted by the observable returned by the spy function.
	 * @param {string} [spyName] The name of the spy function for error reporting purposes.
	 * @returns {TestSubscriptionCounter} The TestSubscriptionCounter object that completes based on the nextValue.
	 */
	public withReturnCompletingCountedObservable<T>(
		spy: (...args: any[]) => Observable<T>,
		nextValue?: T,
		spyName?: string
	): TestSubscriptionCounter<T> {
		if (this.isSpyLike(spy)) {
			const observable = of(nextValue);
			const counter = new TestSubscriptionCounter(observable);
			spy.and.returnValue(counter.countedObservable$);
			return counter;
		}
		this.throwNotASpyError("withReturnCompletingCountedObservable", spyName);
	}

	/**
	 * Returns a TestSubscriptionCounter object that wraps the provided spy function and modifies its behavior.
	 * The TestSubscriptionCounter object tracks the number of subscriptions made to the spy function's returned observable.
	 *
	 * @template T - The type of data included in the observable.
	 * @param {Function} spy - The spy function to wrap and modify.
	 * @param {T} [nextValue] - The value to start the non-completing observable with. Defaults to undefined.
	 * @param {string} [spyName] - The name of the spy function. Used in error messages. Defaults to undefined.
	 *
	 * @return {TestSubscriptionCounter} - A TestSubscriptionCounter object that tracks subscriptions to the modified spy function's observable.
	 *
	 * @throws {Error} - If the provided spy is not a callable function.
	 */
	public withReturnNonCompletingCountedObservable<T>(
		spy:(...args: any[]) => Observable<T>,
		nextValue?: T,
		spyName?: string
	): TestSubscriptionCounter<T> {
		if (this.isSpyLike(spy)) {
			const nonCompletingObservable: Observable<T> = NEVER.pipe(startWith(nextValue));
			const counter = new TestSubscriptionCounter(nonCompletingObservable);
			spy.and.returnValue(counter.countedObservable$);
			return counter;
		}
		this.throwNotASpyError("withReturnNonCompletingCountedObservable", spyName);
	}

	/**
	 * Executes a spy function and resolves it with the provided values or observables.
	 *
	 * @param {function} spy - The spy function to execute.
	 * @param {Array|Observable[]} resolveWith - The values or observables to resolve the spy function with.
	 * @param {string} [spyName] - (Optional) The name of the spy function.
	 * @returns {Observable[]} - An array of observables representing the resolved values of the spy function.
	 */
	public withReturnObservables<T>(
		spy: (...args: any[]) => Observable<T>,
		resolveWith: T[] | Observable<T>[],
		spyName?: string
	): Observable<T>[] {
		if (this.isSpyLike(spy)) {
			const observables = resolveWith.map((r: T | Observable<T>) => {
				if (r instanceof Observable) {
					return r;
				}

				return of(r)
			});
			this.withReturnValues(spy, observables, spyName);
			return observables;
		}
		this.throwNotASpyError("withReturnObservables", spyName);
	}

	/**
	 * Returns an observable that throws an error when the given `spy` is called.
	 *
	 * @param {Function} spy - The spy function to wrap with the observable.
	 * @param {any} [error] - The error to be thrown when the spy is called.
	 * @param {string} [spyName] - The name of the spy (optional).
	 * @returns {Observable} - An observable that throws an error.
	 */
	public withReturnThrowObservable<T>(
		spy: (...args: any[]) => Observable<T>,
		error?: any,
		spyName?: string
	): Observable<T> {
		if (this.isSpyLike(spy)) {
			const observable: Observable<T> = throwError(() => new Error(error));
			spy.and.returnValue(observable);
			return observable;
		}
		this.throwNotASpyError("withReturnThrowObservable", spyName);
	}

	/**
	 * Maps the return value of a spy function based on the first argument using an observable.
	 * If the spy function is not a spy-like object, it throws an error.
	 *
	 * @template T - The expected return of the observable
	 * @param {Function} spy - The spy function to be mapped.
	 * @param {Record<string|number, T>} returnMap - A map of return values based on the first argument.
	 * @param {T} defaultReturn - The default return value if the first argument is not in the map. Default is undefined.
	 * @param {string} [spyName] - Optional name of the spy function.
	 * @returns {void}
	 */
	public withFirstArgMappedReturnObservable<T>(
		spy: (arg1: string | number, ...args: any[]) => Observable<T>,
		returnMap: Record<string | number, T>,
		defaultReturn: T = undefined,
		spyName?: string
	): void {
		if (this.isSpyLike(spy)) {
			spy.and.callFake((key) =>
				Object.prototype.hasOwnProperty.call(returnMap, key)
					? of(returnMap[key])
					: of(defaultReturn)
			);
			return;
		}
		this.throwNotASpyError("withFirstArgMappedReturnObservable", spyName);
	}

	/**
	 * Returns a ReplaySubject for a given observable property of an object.
	 *
	 * @param {Object} objectMock - The object containing the observable property.
	 * @param {string} observablePropertyName - The name of the observable property.
	 * @param {any} initialValue - The initial value for the ReplaySubject.
	 * @param {number} replayBuffer - The size of the replay buffer for the ReplaySubject.
	 * @returns {ReplaySubject} - The ReplaySubject for the observable property.
	 */
	public withReturnSubjectForObservableProperty<
		T,
		K extends ObservablePropertyNames<T, any>,
		U extends ObservableType<T[K]>
	>(
		objectMock: T,
		observablePropertyName: K,
		initialValue?: U,
		replayBuffer = 1
	): ReplaySubject<U> {
		const subject = new ReplaySubject<U>(replayBuffer);
		(objectMock[observablePropertyName] as any) = subject.asObservable();
		if (initialValue !== undefined) {
			subject.next(initialValue);
		}
		return subject;
	}

	/**
	 * Returns a subject and a counter for a specified observable property in a given object.
	 * The subject emits values of the observable property, and the counter keeps track of the number of subscriptions to the subject.
	 *
	 * @param {object} objectMock - The object containing the observable property.
	 * @param {string} observablePropertyName - The name of the observable property in the object.
	 * @param {*} [initialValue] - The initial value to be emitted by the subject.
	 * @param {number} [replayBuffer=1] - The number of values to buffer and replay upon subscription.
	 *
	 * @returns {ISubjectCounter} - An object containing the subject and counter.
	 */
	public withReturnSubjectWithCompletingCountedObservableForObservableProperty<
		T,
		K extends ObservablePropertyNames<T, any>,
		U extends ObservableType<T[K]>
	>(
		objectMock: T,
		observablePropertyName: K,
		initialValue?: U,
		replayBuffer = 1
	): ISubjectCounter<U> {
		const subject = new ReplaySubject<U>(replayBuffer);
		const counter = new TestSubscriptionCounter(subject.asObservable());
		(objectMock[observablePropertyName] as any) = counter.countedObservable$;
		if (initialValue !== undefined) {
			subject.next(initialValue);
		}
		return {
			subject,
			counter
		}
	}

	/**
	 * Creates a subject that returns an observable, using the provided spy function.
	 *
	 * @template T - The type of the observable returned by the spy.
	 * @param {(...args: any) => Observable<T>} spy - The spy function that will be called when the observable is subscribed to.
	 * @param {string} [spyName] - An optional name for the spy function.
	 *
	 * @returns {Subject<T>} A subject that returns the observable created by the spy function.
	 *
	 * @throws {Error} If the provided spy is not a function.
	 */
	public withReturnSubjectAsObservable<T>(
		spy: (...args: any) => Observable<T>,
		spyName?: string
	): Subject<T> {
		if (this.isSpyLike(spy)) {
            const subject = new Subject<T>();
            spy.and.returnValue(subject.asObservable());
            return subject;
        }
        this.throwNotASpyError("withReturnSubjectAsObservable", spyName);
	}

	/**
	 * Returns a Subject that can be subscribed to as an Observable, with the spy function invoked and an error emitted.
	 *
	 * @param {Function} spy - The spy function to invoke.
	 * @param {any} [resolveWithError] - The error to emit. If not provided, a default Error with message "error" will be emitted.
	 * @param {string} [spyName] - The name of the spy function. Used for error handling.
	 *
	 * @returns {Subject} - The Subject that emits the error as an Observable.
	 */
	public withReturnSubjectWithErrorAsObservable<T>(
		spy: (...args: any[]) => Observable<T>,
		resolveWithError?: any,
		spyName?: string,
	): Subject<T> {
		if (this.isSpyLike(spy)) {
			const subject = new Subject<T>();
			if (resolveWithError) {
				subject.error(resolveWithError);
			} else {
				subject.error(new Error("error"));
			}
			const observable: Observable<T> = subject.asObservable();
			spy.and.returnValue(observable);
			return subject;
		}
		this.throwNotASpyError(spyName);
	}

	/**
	 * Executes a given spy function and returns a Promise that resolves to a specified value.
	 *
	 * @param {Function} spy - The spy function to be executed.
	 * @param {*} resolveWith - The value to resolve the Promise with.
	 * @param {string} spyName - The name of the spy function.
	 * @return {Promise} - A Promise that resolves to the specified value.
	 */
	public withReturnPromise<T>(
		spy: (...args: any[]) => Promise<T>,
		resolveWith?: T,
		spyName?: string,
	): Promise<T> {
		if (this.isSpyLike(spy)) {
			const promise = Promise.resolve(resolveWith);
			spy.and.returnValue(promise);
			return promise;
		}
		return this.throwNotASpyError(spyName);
	}

	/**
	 * Returns a promise that is rejected with the specified value.
	 *
	 * @param {(...args: any[]) => Promise<T>} spy - The spy function that will be replaced with a rejected promise.
	 * @param {any} [rejectWith] - The value with which the promise should be rejected. Default is undefined.
	 * @param {string} [spyName] - The name of the spy function. Default is undefined.
	 * @returns {Promise<T>} A promise that is rejected with the specified value.
	 */
	public withReturnRejectedPromise<T>(
		spy: (...args: any[]) => Promise<T>,
		rejectWith?: any,
		spyName?: string,
	): Promise<T> {
		if (this.isSpyLike(spy)) {
			const promise = Promise.reject(rejectWith);
			spy.and.returnValue(promise);
			return promise;
		}
		return this.throwNotASpyError(spyName);
	}
}

export const defaultAutoMockerInstance = new AutoMockerPlus();