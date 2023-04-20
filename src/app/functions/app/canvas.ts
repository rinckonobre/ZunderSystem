
import { SKRSContext2D, Image } from "@napi-rs/canvas";

type CanvasCtx = SKRSContext2D;
type CanvasStyle = string | CanvasGradient | CanvasPattern;

interface CanvasCoords { x: number; y: number }
interface CanvasSizes { width: number; height: number }
interface CanvasDrawOptions { 
    method: "fill" | "stroke", 
    color?: CanvasStyle,
    radius?: number;
    lineWidth?: number;
}

interface CanvasCornerRadius {
    upperLeft: number;
    upperRight: number;
    lowerLeft: number;
    lowerRight: number;
}

interface CanvasFontOptions { 
    size: number, 
    family: string; 
    style: string,
    textAlign?: CanvasTextAlign,
    textBaseLine?: CanvasTextBaseline
}

interface CanvasDrawRectOptions extends CanvasCoords, CanvasSizes, Omit<CanvasDrawOptions, "radius"> {
    radius?: number | CanvasCornerRadius
}
export function canvasDrawRect(ctx: CanvasCtx, options: CanvasDrawRectOptions){
    const { x, y, width, height, method, radius = 0, color, lineWidth } = options;
    
    const cornerRadius: CanvasCornerRadius = { upperLeft: 0, upperRight: 0, lowerLeft: 0, lowerRight: 0 };
    if (typeof radius === "number") {
        cornerRadius.upperLeft = cornerRadius.upperRight = cornerRadius.lowerLeft = cornerRadius.lowerRight = radius;
    } else {
        for (const [ side, value ] of Object.entries(radius) as [keyof CanvasCornerRadius, number][]) {
            cornerRadius[side] = value;
        }
    }

    ctx.save();

    if (color) {
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
    }

    if (lineWidth) ctx.lineWidth = lineWidth;

    ctx.beginPath();
    ctx.moveTo(x + cornerRadius.upperLeft, y);
    ctx.lineTo(x + width - cornerRadius.upperRight, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + cornerRadius.upperRight);
    ctx.lineTo(x + width, y + height - cornerRadius.lowerRight);
    ctx.quadraticCurveTo(x + width, y + height, x + width - cornerRadius.lowerRight, y + height);
    ctx.lineTo(x + cornerRadius.lowerLeft, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - cornerRadius.lowerLeft);
    ctx.lineTo(x, y + cornerRadius.upperLeft);
    ctx.quadraticCurveTo(x, y, x + cornerRadius.upperLeft, y);
    ctx.closePath();

    switch (method) {
        case "fill": ctx.fill();
            break;
        case "stroke": ctx.stroke();
            break;
    }
    ctx.restore();
}

type CanvasDrawCircleOptions = CanvasCoords & CanvasDrawOptions & { center?: boolean }
export function canvasDrawCircle(ctx: CanvasCtx, options: CanvasDrawCircleOptions){
    const { x, y, radius = 10, color, center, lineWidth, method } = options;
    
    ctx.save();

    if (color) {
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
    }

    if (lineWidth) ctx.lineWidth = lineWidth;
    ctx.beginPath();
    if (center) {
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
    } else {
        ctx.arc(x + radius, y + radius, radius, 0, 2 * Math.PI);
    }
    ctx.closePath();

    switch (method) {
        case "fill": ctx.fill();
            break;
        case "stroke": ctx.stroke();
            break;
    }
    ctx.restore();
}
interface CanvasDrawImageOptions extends CanvasCoords { image: Image, size?: number, radius?: number }
export function canvasDrawImage(ctx: CanvasCtx, options: CanvasDrawImageOptions){
    const { x, y, radius = 0, image, size } = options;

    const imgWidth = image.width;
    const imgHeight = image.height;
    const aspectRatio = imgWidth / imgHeight;
    
    ctx.save();
    if (radius > 0) {
        ctx.beginPath();
        ctx.arc(x + radius, y + radius, radius, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(image, x, y, radius * 2 * aspectRatio, radius * 2);
    } else if (size){
        ctx.drawImage(image, x, y, size * 2 * aspectRatio, size * 2);
    } else {
        ctx.drawImage(image, x, y);
    }
    ctx.restore();
}

interface CanvasDrawTextOptions extends CanvasCoords, CanvasDrawOptions {
    text: string, maxWidth?: number
}
/**
 * 
 * @param ctx 
 * @param options 
 * @returns text's advance width (the width of that inline box
 */
export function canvasDrawText(ctx: CanvasCtx, options: CanvasDrawTextOptions){
    const { x, y, text, color, method, maxWidth } = options;

    ctx.save();

    if (color) {
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
    }

    switch(method){
        case "fill": ctx.fillText(text, x, y, maxWidth);
            break;
        case "stroke": ctx.strokeText(text, x, y, maxWidth);
            break;
    }
    ctx.restore();
}

export function canvasSetFont(ctx: CanvasCtx, options: CanvasFontOptions){
    const { family, size, style, textAlign, textBaseLine } = options

    ctx.font = `${style} ${size}px ${family}`;

    if (textAlign) ctx.textAlign = textAlign;
    if (textBaseLine) ctx.textBaseline = textBaseLine;
}
interface CanvasGradientOptions { start: CanvasCoords, end: CanvasCoords, startColor: string, endColor: string };
export function createLinearGradiente(ctx: CanvasCtx, options: CanvasGradientOptions){
    const { start, end, startColor, endColor } = options;
    const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
    gradient.addColorStop(0, startColor);
    gradient.addColorStop(1, endColor);
    return gradient
}
export function canvasStyle(ctx: CanvasCtx){
    return {
        rgba(red: number, green: number, blue: number, aplha: number = 1){
            return `rgba(${red}, ${green}, ${blue}, ${aplha})`
        },
        linearGradient(options: CanvasGradientOptions){
            const { start, end, startColor, endColor } = options;
            const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
            gradient.addColorStop(0, startColor);
            gradient.addColorStop(1, endColor);
            return gradient
        }
    }
}