import express, { Router } from "express";
import { readdirSync, statSync } from "fs";
import { join } from "path";
import { Route } from "./types/Route";

interface ServerOptions {
    port?: string;
}
export default async ({ port="3000" }: ServerOptions = {}) => {
    const app = express();
    app.use(express.json());
    app.listen(port, () => console.log(`Server online on port ${port}`.bgGreen.black, port.green));
    
    const router = Router();
    const apiDirPath = join(__dirname, "routes");

    async function handler(basePath: string, routePath: string){
        for(const path of readdirSync(routePath)){
            const stat = statSync(join(routePath, path));
            if (stat.isDirectory()) {
                if (path.startsWith("[") && path.endsWith("]")){
                    const param = path.slice(1, path.length -1);
                    const paramPath = `:${param}/`;
                    handler(`${basePath}${paramPath}`, join(routePath, path));
                    continue;
                }
                handler(`${basePath}${path}/`, join(routePath, path));
                continue;
            }
            if (path == "route.ts" || path == "route.js"){
                const funcs: Route = (await import(`${routePath}/${path}`))?.default;
                if (!funcs.data) continue;
                const { GET, POST, PUT, PATCH, DELETE } = funcs.data;
                if (GET) router.get(basePath, GET);
                if (POST) router.post(basePath, POST);
                if (PUT) router.put(basePath, PUT);
                if (PATCH) router.patch(basePath, PATCH);
                if (DELETE) router.delete(basePath, DELETE);
            }
        }
    }
    await handler("/", apiDirPath);
    app.use(router);
};
  