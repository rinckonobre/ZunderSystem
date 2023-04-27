type TimeUnits = "miliseconds" | "seconds" | "minutes" | "hours"
export function wait(miliseconds: number, timeUnit: TimeUnits = "miliseconds"){
    switch (timeUnit) {
        case "seconds":
        miliseconds *= 1000;
        break;
        case "minutes":
        miliseconds *= 60 * 1000;
        break;
        case "hours":
        miliseconds *= 60 * 60 * 1000;
        break;
    }
    return new Promise(resolve => {
        setTimeout(resolve, miliseconds);
    });
}