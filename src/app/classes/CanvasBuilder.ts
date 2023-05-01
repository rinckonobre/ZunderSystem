import { Canvas, Image, SKRSContext2D } from "@napi-rs/canvas";

type CanvasStyle = string | CanvasGradient | CanvasPattern;

interface Coords { x: number; y: number; }
interface Sizes { width: number; height: number; }

interface DrawOptions {
    method: "fill" | "stroke",
    style?: CanvasStyle,
    radius?: number;
    lineWidth?: number;
}
interface CornerRadius {
    upperLeft: number;
    upperRight: number;
    lowerLeft: number;
    lowerRight: number;
}
interface FontOptions {
    size: number,
    family: string;
    style: string,
    textAlign?: CanvasTextAlign,
    textBaseLine?: CanvasTextBaseline;
}
interface Global {
    width: number;
    height: number;
}
interface DrawRectOptions extends Coords, Sizes, Omit<DrawOptions, "radius"> {
    radius?: number | CornerRadius;
}
interface DrawTextOptions extends Coords, DrawOptions {
    text: string, maxWidth?: number;
}
interface StyleOptions {
    style: CanvasStyle,
    applyOn?: "fill" | "stroke" | "both";
}
interface DrawImageOptions extends Coords { image: Image | Canvas, size?: number, radius?: number; }

interface DrawProgressBarOptions extends Coords, Sizes {
    current: number; total: number;
    styles?: { progress: CanvasStyle; background: CanvasStyle; };
    radius?: number;
}

type DrawCircleOptions = Coords & DrawOptions & { center?: boolean; }
interface GradientOptions { start: Coords, end: Coords, startColor: string, endColor: string; }


export class CanvasBuilder {
    public data: Canvas; 
    public context: SKRSContext2D;
    constructor(width: number, height: number) {
        this.data = new Canvas(width, height);
        this.context = this.data.getContext("2d");    
        this.imageSettings(true);
    }
    public setFont(options: FontOptions) {
        const { family, size, style, textAlign, textBaseLine } = options;

        this.context.font = `${style} ${size}px ${family}`;

        if (textAlign) this.context.textAlign = textAlign;
        if (textBaseLine) this.context.textBaseline = textBaseLine;
        return this;
    }
    public setStyle(options: StyleOptions) {
        let { style, applyOn = "both" } = options;

        switch (applyOn) {
            case "fill": {
                this.context.fillStyle = style;
                break;
            }
            case "stroke": {
                this.context.strokeStyle = style;
                break;
            }
            default: {
                this.context.fillStyle = style;
                this.context.strokeStyle = style;
                break;
            }
        }
        return this;
    }
    public drawScreen(style: CanvasStyle) {
        const { width, height } = this.data;
        this.drawRect({ x: 0, y: 0, width, height, method: "fill", style: style });
        return this;
    }
    public drawText(options: DrawTextOptions) {
        const { x, y, text, style, method, maxWidth } = options;

        this.context.save();

        if (style) this.setStyle({ style });

        switch (method) {
            case "fill": this.context.fillText(text, x, y, maxWidth);
                break;
            case "stroke": this.context.strokeText(text, x, y, maxWidth);
                break;
        }
        this.context.restore();
        return this;
    }
    public drawRect(options: DrawRectOptions) {
        const { x, y, width, height, method, radius = 0, style, lineWidth } = options;
        const cornerRadius: CornerRadius = { upperLeft: 0, upperRight: 0, lowerLeft: 0, lowerRight: 0 };
        if (typeof radius === "number") {
            cornerRadius.upperLeft = cornerRadius.upperRight = cornerRadius.lowerLeft = cornerRadius.lowerRight = radius;
        } else {
            for (const [side, value] of Object.entries(radius) as [keyof CornerRadius, number][]) {
                cornerRadius[side] = value;
            }
        }
        this.context.save();
        if (style) this.setStyle({ style });
        if (lineWidth) this.context.lineWidth = lineWidth;

        this.context.beginPath();
        this.context.moveTo(x + cornerRadius.upperLeft, y);
        this.context.lineTo(x + width - cornerRadius.upperRight, y);
        this.context.quadraticCurveTo(x + width, y, x + width, y + cornerRadius.upperRight);
        this.context.lineTo(x + width, y + height - cornerRadius.lowerRight);
        this.context.quadraticCurveTo(x + width, y + height, x + width - cornerRadius.lowerRight, y + height);
        this.context.lineTo(x + cornerRadius.lowerLeft, y + height);
        this.context.quadraticCurveTo(x, y + height, x, y + height - cornerRadius.lowerLeft);
        this.context.lineTo(x, y + cornerRadius.upperLeft);
        this.context.quadraticCurveTo(x, y, x + cornerRadius.upperLeft, y);
        this.context.closePath();

        switch (method) {
            case "fill": this.context.fill();
                break;
            case "stroke": this.context.stroke();
                break;
        }
        this.context.restore();
        return this;
    }
    public drawImage(options: DrawImageOptions) {
        const { x, y, radius = 0, image, size } = options;

        const imgWidth = image.width;
        const imgHeight = image.height;
        const aspectRatio = imgWidth / imgHeight;

        this.context.save();
        if (radius > 0) {
            this.context.beginPath();
            this.context.arc(x + radius, y + radius, radius, 0, 2 * Math.PI);
            this.context.closePath();
            this.context.clip();
            this.context.drawImage(image, x, y, radius * 2 * aspectRatio, radius * 2);
        } else if (size) {
            this.context.drawImage(image, x, y, size * 2 * aspectRatio, size * 2);
        } else {
            this.context.drawImage(image, x, y);
        }
        this.context.restore();
        return this;
    }
    public drawCircle(options: DrawCircleOptions) {
        const { x, y, radius = 10, style, center, lineWidth, method } = options;

        this.context.save();

        if (style) this.setStyle({ style });

        if (lineWidth) this.context.lineWidth = lineWidth;
        this.context.beginPath();
        if (center) {
            this.context.arc(x, y, radius, 0, 2 * Math.PI);
        } else {
            this.context.arc(x + radius, y + radius, radius, 0, 2 * Math.PI);
        }
        this.context.closePath();

        switch (method) {
            case "fill": this.context.fill();
                break;
            case "stroke": this.context.stroke();
                break;
        }
        this.context.restore();
        return this;
    }
    public setFilter() {
        const builder = this;
        const { context } = builder;
        return {
            blur(px: number) {
                context.filter = `blur(${px}px)`;
                return builder;
            },
            dropShadow(x: number, y: number, blur: number, color: string) {
                context.filter = `drop-shadow(${x}px ${y}px ${blur}px ${color})`;
                return builder;
            },
            brightness(percent: number) {
                context.filter = `brightness(${percent}%)`;
                return builder;
            },
            contrast(percent: number) {
                context.filter = `contrast(${percent}%)`;
                return builder;
            },
            grayscale(percent: number) {
                context.filter = `grayscale(${percent}%)`;
                return builder;
            },
            hueRotate(deg: number) {
                context.filter = `hue-rotate(${deg}deg)`;
                return builder;
            },
            invert(percent: number) {
                context.filter = `grayscale(${percent}%)`;
                return builder;
            },
            opacity(percent: number) {
                context.filter = `opacity(${percent}%)`;
                return builder;
            },
            saturate(percent: number) {
                context.filter = `saturate(${percent}%)`;
                return builder;
            },
            sepia(percent: number) {
                context.filter = `sepia(${percent}%)`;
                return builder;
            }
        };
    }
    public clearFilter() {
        this.context.filter = "none";
        return this;
    }
    public setGradient() {
        const builder = this;
        const { context } = builder;
        return {
            linear(options: GradientOptions) {
                const { start, end, startColor, endColor } = options;
                const gradient = context.createLinearGradient(start.x, start.y, end.x, end.y);
                gradient.addColorStop(0, startColor);
                gradient.addColorStop(1, endColor);
                builder.setStyle({ style: gradient });
                return builder;
            }
        };
    }
    public imageSettings(enabled: boolean, quality: ImageSmoothingQuality = "high"){
        this.context.imageSmoothingQuality = quality;
        this.context.imageSmoothingEnabled = enabled;
        return this;
    }
    public static rgbaStyle(red: number, green: number, blue: number, alpha: number = 1) {
        return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
    }
}

export class CanvasFontBuilder {
    public data: FontOptions;
    private family: string;
    private style: string;
    private size: number;
    private textAlign?: CanvasTextAlign;
    private textBaseLine?: CanvasTextBaseline;
    constructor(options: FontOptions){
        this.family = options.family;
        this.style = options.style;
        this.size = options.size;
        this.textAlign = options.textAlign;
        this.textBaseLine = options.textBaseLine;
        const { family, style, size, textAlign, textBaseLine } = this;
        this.data = { family, style, size, textAlign, textBaseLine };
    }
    private refreshData(){
        const { family, style, size, textAlign, textBaseLine } = this;
        this.data = { family, style, size, textAlign, textBaseLine };
    }
    public setFamily(family: string){
        this.family = family;
        this.refreshData();
        return this;
    }
    public setStyle(style: string){
        this.style = style;
        this.refreshData();
        return this;
    }
    public setSize(size: number){
        this.size = size;
        this.refreshData();
        return this;
    }
    public setAlign(align: CanvasTextAlign){
        this.textAlign = align;
        this.refreshData();
        return this;
    }
    public setBaseLine(baseLine: CanvasTextBaseline){
    this.textBaseLine = baseLine;
        this.refreshData();
        return this;
    }
}