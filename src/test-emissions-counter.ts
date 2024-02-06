import { Observable, Subscriber, tap } from "rxjs";

export class TestEmissionsCounter<T> {
	private _totalEmissions = 0;

	public readonly emissionsCountingObservable = new Observable<T>((observer: Subscriber<T>) => {
		const subscription = this.observable$
			.pipe(tap(() => this._totalEmissions++))
			.subscribe(observer);

		return () => subscription.unsubscribe();
	});

	constructor(private readonly observable$: Observable<T>) {}

	public get emissions(): number {
		return this._totalEmissions;
	}
}