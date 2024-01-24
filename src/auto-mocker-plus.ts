import { NEVER, observable, Observable, of, ReplaySubject, startWith, Subject, throwError } from "rxjs";
import { AutoMocker } from './autoMocker';
import { TestSubscriptionCounter } from './test-subscription-counter';
import { ObservablePropertyNames } from '@types-local'

type ObservableType<T> = T extends Observable<infer U> ? U : T;

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
}

export const defaultAutoMockerInstance = new AutoMockerPlus();