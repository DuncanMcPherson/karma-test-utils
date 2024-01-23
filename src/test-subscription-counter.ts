import { Observable, finalize, Subscriber } from 'rxjs';

export class TestSubscriptionCounter<T> {
	private _lifetimeSubscriptionCount: number = 0;
	private _activeSubscriptionCount: number = 0;

	public readonly countedObservable$: Observable<T> = new Observable<T>((observer: Subscriber<T>) => {
		this._lifetimeSubscriptionCount++;
		this._activeSubscriptionCount++;

		const subscription = this.observable$
			.pipe(finalize(() => this._activeSubscriptionCount--))
			.subscribe(observer);

		return () => subscription.unsubscribe();
	});

	constructor(private readonly observable$: Observable<T>) {}

	public get lifetimeSubscriptionCount(): number {
        return this._lifetimeSubscriptionCount;
    }

    public get activeSubscriptionCount(): number {
        return this._activeSubscriptionCount;
    }

	public get hadSubscribers(): boolean {
		return this.lifetimeSubscriptionCount > 0;
	}

	public get hasSubscribers(): boolean {
		return this.activeSubscriptionCount > 0;
	}

	public get allSubscriptionsFinalized(): boolean {
		return this.activeSubscriptionCount === 0;
	}
}