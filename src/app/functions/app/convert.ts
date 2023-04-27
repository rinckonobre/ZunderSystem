export function convertHex(color: string){
    if (color.startsWith("#")){
        return parseInt(color.slice(1), 16);
    } else return parseInt(color, 16);
}