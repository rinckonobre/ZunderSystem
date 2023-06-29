import { RequestHandler } from "express";

type RouteData = {
    GET?: RequestHandler | Array<RequestHandler>
    POST?: RequestHandler | Array<RequestHandler>
    DELETE?: RequestHandler | Array<RequestHandler>
    PUT?: RequestHandler | Array<RequestHandler>
    PATCH?: RequestHandler | Array<RequestHandler>
}
export class Route {
    public readonly data;
    constructor(data: RouteData){
        this.data = data;
    }
}