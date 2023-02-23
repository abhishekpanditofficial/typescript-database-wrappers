import { firestore } from 'firebase-admin';

type CollectionPath = string | firestore.CollectionReference;

interface FirestoreWrapperOptions {
  errorFlag?: boolean;
  batchSize?: number;
}

function firestoreWrapper<T>(
  collectionPath: CollectionPath,
  { errorFlag = false, batchSize = 500 }: FirestoreWrapperOptions = {}
) {
  const getCollectionRef = () => {
    if (typeof collectionPath === 'string') {
      return firestore().collection(collectionPath);
    }
    return collectionPath;
  };

  const getOne = async (
    documentPath: string,
    options: FirestoreWrapperOptions = {}
  ): Promise<T | null | false> => {
    const docRef = getCollectionRef().doc(documentPath);
    const doc = await docRef.get();
    if (doc.exists) {
      return doc.data() as T;
    }
    if (options.errorFlag) {
      throw new Error(`Document does not exist at path: ${docRef.path}`);
    }
    return false as null | false;
  };

  const create = async (
    documentPath: string,
    data: T
  ): Promise<firestore.DocumentReference> => {
    const docRef = getCollectionRef().doc(documentPath);
    await docRef.set(data);
    return docRef;
  };

  const updateOne = async (
    documentPath: string,
    data: Partial<T>,
    options: FirestoreWrapperOptions = {}
  ): Promise<void> => {
    const docRef = getCollectionRef().doc(documentPath);
    const doc = await docRef.get();
    if (!doc.exists) {
      if (options.errorFlag) {
        throw new Error(`Document does not exist at path: ${docRef.path}`);
      }
      return;
    }
    await docRef.update(data);
  };

  const updateMany = async (
    query: firestore.Query,
    data: Partial<T>,
    options: FirestoreWrapperOptions = {}
  ): Promise<void> => {
    const batchSize = options.batchSize || batchSize;
    await query.batch(batchSize).update(data);
  };

  const deleteOne = async (
    documentPath: string,
    options: FirestoreWrapperOptions = {}
  ): Promise<void> => {
    const docRef = getCollectionRef().doc(documentPath);
    const doc = await docRef.get();
    if (!doc.exists) {
      if (options.errorFlag) {
        throw new Error(`Document does not exist at path: ${docRef.path}`);
      }
      return;
    }
    await docRef.delete();
  };

  const deleteMany = async (
    query: firestore.Query,
    options: FirestoreWrapperOptions = {}
  ): Promise<void> => {
    const batchSize = options.batchSize || batchSize;
    await query.batch(batchSize).delete();
  };

  const getAll = async (
    query: firestore.Query,
    options: FirestoreWrapperOptions = {}
  ): Promise<T[]> => {
    const batchSize = options.batchSize || batchSize;
    const docs = await query.batch(batchSize).get();
    return docs.docs.map((doc) => doc.data() as T);
  };

  return {
    getOne,
    create,
    updateOne,
    updateMany,
    deleteOne,
    deleteMany,
    getAll,
  };
}
