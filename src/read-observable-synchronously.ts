import { Observable, skip, take, tap } from 'rxjs';

/**
 * Reads and returns the value emitted by the given observable synchronously.
 *
 * @param {Observable<T>} observable$ - The observable to read from.
 * @param {number} [skips=0] - The number of values to skip before reading. Default is 0.
 * @returns {T} - The value emitted by the observable.
 */
export function readObservableSynchronously<T>(observable$: Observable<T>, skips: number = 0): T {
	return readObservableSynchronouslyAfterAction(observable$, () => {
		// intentionally empty
	}, skips);
}

/**
 * Reads the first value emitted by an Observable synchronously after performing a specified action.
 *
 * @param {Observable<T>} observable$ - The Observable to subscribe to.
 * @param {() => void} action - The action to perform before subscribing to the Observable.
 * @param {number} [skips=0] - The number of emissions to skip before reading the first value.
 * @returns {T} - The first value emitted by the Observable.
 * @throws {Error} - If the Observable is not provided or the action is not provided.
 * @throws {Error} - If an error occurs during subscription to the Observable.
 * @throws {Error} - If the Observable does not emit any value after skipping the specified number of emissions.
 */
export function readObservableSynchronouslyAfterAction<T>(
	observable$: Observable<T>,
	action: () => void,
	skips: number = 0
): T {
	if (!observable$) {
		throw new Error(`cannot subscribe to ${observable$}`);
	}
	if (!action) {
		throw new Error(`action (${action}) is required`);
	}

	let actualResult: T;
	let emitted = false;
	let emissionCount = 0;
	let error: any;

	const subscription = observable$.pipe(
		tap(() => emissionCount++),
		skip(skips),
		take(1)
	).subscribe({
		next: (value) => {
			actualResult = value;
			emitted = true
		},
		error: (err) => {
			error = err
		}
	});
	action();

	if (error) {
		throw new Error(error);
	}

	if (!emitted) {
		subscription.unsubscribe();
		throw new Error(`observable did not emit (skips requested: ${skips}, total skipped emissions: ${emissionCount})`);
	}

	return actualResult;
}

/**
 * Reads the error emitted by an Observable synchronously.
 *
 * @param {Observable<any>} observable$ - The source Observable to subscribe to.
 * @param {number} [skips=0] - The number of emissions to skip before considering the first emission as an error.
 * @return {any} - The error emitted by the Observable.
 * @throws {Error} - If the observable is not provided.
 * @throws {Error} - If the observable emits a value instead of an error on first eligible emission.
 * @throws {Error} - If the observable does not emit an error after the specified number of skipped emissions.
 */
export function readObservableErrorSynchronously(
	observable$: Observable<any>,
	skips: number = 0
): any {
	if (!observable$) {
		throw new Error(`cannot subscribe to ${observable$}`);
	}

	let actualError: any;
	let emitted = false;
	let emissionCount = 0;
	let valueReceived: any;

	const subscription = observable$
		.pipe(
			tap(() => emissionCount++),
			skip(skips),
			take(1)
		)
		.subscribe({
			next: (val) => {valueReceived = val},
			error: (error) => {
				actualError = error;
                emitted = true;
			}
		});

	if (!!valueReceived) {
		throw new Error(valueReceived);
	}

	if (!emitted) {
		subscription.unsubscribe();
		throw new Error(`observable did not emit error (skips requested: ${skips}, total skipped emissions: ${emissionCount}`);
	}

	return actualError;
}

/**
 * The readObservableCompletionSynchronously function is designed for reading
 * the final value provided by an Observable in a synchronous manner.
 * Note: Observables are naturally asynchronous, thus this function
 * provides a workaround for cases where synchronous retrieval of a value is required.
 * Use this function with caution to prevent blocking call situations in your
 * asynchronous data flow.
 *
 * @param {Observable<any>}observable$ The Observable instance from which you want to read.
 * @param {number} [skips=0] - The number of emissions to skip before considering the first emission as an error.
 * @returns Whether the source Observable completes.
 * @throws {Error} - If the `observable$` is not provided.
 * @throws {Error} - If the `skips` parameter is a negative number.
 * @throws {Error} - If the `observable$` emits a value, does not complete, or emits an error.
 * @throws {Error} - If the total number of emissions is less than the requested number of skipped emissions
 *
 * @example
 * let exampleObservable = of(1, 2, 3, 4, 5);
 * let finalValue = readObservableCompletionSynchronously<number>(exampleObservable, 5);
 * console.log(finalValue); // Outputs: true
 */
export function readObservableCompletionSynchronously(observable$: Observable<any>, skips: number = 0): boolean {
	if (!observable$) {
		throw new Error(`cannot subscribe to ${observable$}`);
	}

	let actualComplete: boolean;
	let emitted = false;
	let emissionCount = 0;
	let error: any;
	let value: any;

	const subscription = observable$
		.pipe(
			tap(() => emissionCount++),
			skip(skips),
			take(1)
		).subscribe({
			next: (val) => {value = val},
			error: (err) => {error = err},
			complete: () => {
				actualComplete = true;
				emitted = true;
			}
		});

	if (!!value) {
		throw new Error(value)
	}

	if (!!error) {
		throw new Error(error);
	}

	if (!emitted) {
		subscription.unsubscribe();
		throw new Error(`observable did not complete (skips requested: ${skips}, total skipped emissions: ${emissionCount})`);
	}

	return actualComplete;
}