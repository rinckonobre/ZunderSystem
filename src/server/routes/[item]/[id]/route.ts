import { StatusCodes } from "http-status-codes";
import { Route } from "../../../types/Route";

export default new Route({
    async GET(req, res) {
        const { item, id } = req.params;
        const baseUrl = "https://jsonplaceholder.typicode.com";
        const data = await fetch(`${baseUrl}/${item}/${id}`)
        .then(response => response.json());
        
        res
        .status(StatusCodes.OK)
        .send(data);
    }
});