type loggerTypes = "info" | "warn" | "error" | "log"
export function logger(type: loggerTypes, ...text: string[]){
    console[type](...text);
}