export default function sum(...args: number[]): number {
	let res = 0;
	args.forEach((num) => {
		res += num;
	});
	return res;
}