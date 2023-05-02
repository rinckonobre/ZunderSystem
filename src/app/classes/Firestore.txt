import fbAdmin from "firebase-admin";
const db = fbAdmin.firestore();
const { FieldValue } = fbAdmin.firestore;

type FirestoreDocRef = fbAdmin.firestore.DocumentReference<fbAdmin.firestore.DocumentData>

export class FirestoreDocManager {
    private doc: FirestoreDocRef;
    constructor(doc: FirestoreDocRef){
        this.doc = doc;
        return this;
    }
    public add(path: string, value: number){
        this.doc.update({[path]: FieldValue.increment(value)});
    }
    public set(path: string, value: any){
        this.doc.update({[path]: value});
    }
    public deleteField(path: string){
        this.doc.update({[path]: FieldValue.delete()});
    }
    public async getData(){
        const data = (await this.doc.get()).data();
        return data;
    }
}

type ZunderCollections = "players" | "resources" | "guilds"

export class Firestore {
    public collection;

    constructor(collectionName: ZunderCollections){
        this.collection = db.collection(collectionName);
    }
    public getDoc(id: string){
        const doc = this.collection.doc(id);
        return doc;
    }
    public async getDocData(id: string){
        const doc = await this.collection.doc(id).get();
        return doc.data();
    }
    public async saveDocData(id: string, data: object){
        if (data) {
            this.collection.doc(id).update(data);
            return true;
        } else {
            return false;
        }
    }
    public async createDoc(id: string, data: object){
        this.collection.doc(id).set(data);
    }
    public async addDoc(data: object){
        return await this.collection.add(data);
    }
    public getDocManager(id: string){
        const doc = this.collection.doc(id);
        return new FirestoreDocManager(doc);
    }
    public deleteDoc(id: string){
        this.collection.doc(id).delete();
    }
}