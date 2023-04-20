import { firestore } from 'firebase-admin';
const db = firestore();
const { FieldValue } = firestore;

export class Database {
    public collection;
    constructor(collectionName: string){
        this.collection = db.collection(collectionName)
    }
    public async create({id, data}:{id?: string, data: Object}){
        if (id) {
            return await this.collection.doc(id).set(data)
        }
        return await this.collection.doc().set(data)
    }
    public async delete(id: string){
        return await this.collection.doc(id).delete();
    }
    public async get(id:string, path?: string): Promise<any>{
        const doc = await this.collection.doc(id).get()
        const data = doc.data();
        if (path && data){
            const parts = path.split('.');
            let value = data;
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                if (part.includes('[')) {
                    const key = part.substring(0, part.indexOf('['));
                    const index = part.substring(part.indexOf('[') + 1, part.indexOf(']'));
                    value = value[key][index];
                } else {
                    value = value[part];
                }
            }
            return value;
        } else {
            return data;
        }
    }
    public async update(id: string, path: string, value: any, option?: "increment" | "delete" | "arrayUnion" | "arrayRemove"){
        const doc = this.collection.doc(id)
        if (option){
            switch(option){
                case "increment":{
                    if (typeof value == "number"){
                        return await doc.update({[path]: FieldValue.increment(value)})
                    } else {
                        throw new Error("Database increment: value is not a number")
                    }
                }
                case "arrayUnion": {
                    return await doc.update({[path]: FieldValue.arrayUnion(value)})
                }
                case "arrayRemove":{
                    return await doc.update({[path]: FieldValue.arrayRemove(value)})
                }
                case "delete": {
                    return await doc.update({[path]: FieldValue.delete()})
                }
            }
        } else {
            return await doc.update({[path]: value})
        }
    }

    public async set(id: string, path: string, value: any){
        const doc = this.collection.doc(id)
        return await doc.set({[path]: value})
    }
    public async setData(id: string, value: any){
        const doc = this.collection.doc(id)
        return await doc.set(value)
    }
}