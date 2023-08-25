/**
 * Takes to ISO string dates and check wheather the first date is older than the second
 * @param dateStr1 ISO String date
 * @param dateStr2 ISO String date
 * @returns true if the first date is older, false otherwise
 */
export function compareDates(dateStr1: string, dateStr2: string): boolean {
    const date1 = new Date(dateStr1);
    const date2 = new Date(dateStr2);
  
    if (date1 <= date2) {
      return true
    } else if (date1 > date2) {
      return false
    } else {
      return false
    }
  }

/**
 * Creates a budget text with a Decimal number
 * @param value decimal number like 0.21
 * @returns string tag with a value
 */
export function getBudgetText(value: number) {
  return `Aleph Alpha Budget: ${value.toFixed(2)}`
}

/**
 * Creates a random UUID
 * @returns UUID as Hex string
 */
export function generateUUID() {
	let d = new Date().getTime();
	if (
		typeof performance !== "undefined" &&
		typeof performance.now === "function"
	) {
		d += performance.now(); // Use high-precision timer if available
	}
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
		/[xy]/g,
		function (c) {
			const r = (d + Math.random() * 16) % 16 | 0;
			d = Math.floor(d / 16);
			return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
		}
	);
}