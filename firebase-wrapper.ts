import * as admin from 'firebase-admin';

admin.initializeApp();

type QueryOptions = {
  where?: [string, FirebaseFirestore.WhereFilterOp, any][];
  orderBy?: [string, FirebaseFirestore.OrderByDirection][];
  limit?: number;
  startAt?: FirebaseFirestore.DocumentSnapshot;
  endAt?: FirebaseFirestore.DocumentSnapshot;
};

type GetOneOptions = {
  errorFlag?: boolean;
} & QueryOptions;

type PathSegment = {
  collectionId: string;
  docId?: string;
};

const buildQuery = (path: string, options: QueryOptions = {}) => {
  const pathSegments: PathSegment[] = path.split('/').reduce((segments: PathSegment[], segment: string, index: number) => {
    if (index % 2 === 0) {
      segments.push({ collectionId: segment });
    } else {
      segments[segments.length - 1].docId = segment;
    }
    return segments;
  }, []);
  let query = admin.firestore().collection(pathSegments.shift()!.collectionId);
  for (const { collectionId, docId } of pathSegments) {
    if (docId) {
      query = query.doc(docId).collection(collectionId);
    } else {
      query = query.collection(collectionId);
    }
  }
  if (options.where) {
    for (const [fieldPath, opStr, value] of options.where) {
      query = query.where(fieldPath, opStr, value);
    }
  }
  if (options.orderBy) {
    for (const [fieldPath, direction] of options.orderBy) {
      query = query.orderBy(fieldPath, direction);
    }
  }
  if (options.limit) {
    query = query.limit(options.limit);
  }
  if (options.startAt) {
    query = query.startAt(options.startAt);
  }
  if (options.endAt) {
    query = query.endAt(options.endAt);
  }
  return query;
};

const getOne = async (
  path: string,
  options: GetOneOptions = {}
): Promise<FirebaseFirestore.DocumentData | null | false> => {
  const { errorFlag = false, ...queryOptions } = options;
  const query = buildQuery(path, queryOptions);
  const snapshot = await query.get();
  if (snapshot.empty) {
    return errorFlag ? Promise.reject(new Error(`Document not found at path ${path}`)) : false;
  }
  return snapshot.docs[0].data();
};

const create = async (path: string, data: FirebaseFirestore.DocumentData) => {
  const pathSegments = path.split('/');
  let batch = admin.firestore().batch();
  let ref: FirebaseFirestore.DocumentReference | null = null;
  for (let i = pathSegments.length - 1; i >= 0; i -= 2) {
    ref = ref ? ref.collection(pathSegments[i]).doc(pathSegments[i - 1]) : admin.firestore().collection(pathSegments[i]).doc(pathSegments[i - 1]);
    batch.set(ref, data);
  }
  await batch.commit();
};

const getAll = async (path: string, options: QueryOptions = {}) => {
  const query = buildQuery(path, options);
  const snapshot = await query.get();
  return snapshot.docs.map((doc) => doc.data());
};

const updateOne = async (
  path: string,
  options: GetOneOptions = {},
  data: FirebaseFirestore.DocumentData
) => {
  const query = buildQuery(path, options);
  const snapshot = await query.get();
  if (snapshot.empty) {
    throw new Error(`Document not found at path ${path}`);
  }
  await snapshot.docs[0].ref.update(data);
};

const updateMany = async (
  path: string,
  options: QueryOptions = {},
  data: FirebaseFirestore.DocumentData
) => {
  const query = buildQuery(path, options);
  const snapshot = await query.get();
  const batch = admin.firestore().batch();
  snapshot.docs.forEach((doc) => batch.update(doc.ref, data));
  await batch.commit();
};

const deleteOne = async (path: string, options: GetOneOptions = {}) => {
  const query = buildQuery(path, options);
  const snapshot = await query.get();
  if (snapshot.empty) {
    throw new Error(`Document not found at path ${path}`);
  }
  await snapshot.docs[0].ref.delete();
};

const deleteMany = async (path: string, options: QueryOptions = {}) => {
  const query = buildQuery(path, options);
  const snapshot = await query.get();
  const batch = admin.firestore().batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
};

export { getOne, create, getAll, updateOne, updateMany, deleteOne, deleteMany };

