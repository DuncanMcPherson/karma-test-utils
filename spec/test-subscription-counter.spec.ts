import { TestSubscriptionCounter } from '../src';
import { BehaviorSubject } from "rxjs";

describe("TestSubscriptionCounter", () => {
	let counter: TestSubscriptionCounter<number>;
	let observable: BehaviorSubject<number>

	beforeEach(() => {
		observable = new BehaviorSubject<number>(0);
		counter = new TestSubscriptionCounter<number>(observable);
	});
	
	describe("countedObservable$", () => {
		it("should return a counted observable", () => {
			expect(counter.countedObservable$).toBeTruthy();
			const tempNumber = Math.floor(Math.random() * 10);
			observable.next(tempNumber);
			const subscription = counter.countedObservable$.subscribe((value) => {
				expect(value).toEqual(tempNumber)
			});
			expect(counter.activeSubscriptionCount).toEqual(1);
			expect(counter.lifetimeSubscriptionCount).toEqual(1);
			expect(counter.allSubscriptionsFinalized).toEqual(false);
			expect(counter.hadSubscribers).toEqual(true);
			expect(counter.hasSubscribers).toEqual(true);
			subscription.unsubscribe();
			expect(counter.activeSubscriptionCount).toEqual(0);
			expect(counter.allSubscriptionsFinalized).toEqual(true);
		})
	})
})