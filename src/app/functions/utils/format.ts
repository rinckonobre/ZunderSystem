export function zeroPad(number: number): string {
    return number < 10 ? String(number) : `0${number}`; 
}