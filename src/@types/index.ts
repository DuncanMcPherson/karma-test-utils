import { Observable } from "rxjs"
export type Accessor = "get" | "set";
export type Constructor<T> = new(...args: any[]) => T;

export type ObservablePropertyNames<T, O> = {
	[K in keyof T]: T[K] extends Observable<O> ? K : never;
}[keyof T];