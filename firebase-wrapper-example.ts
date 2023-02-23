// Assuming you've already initialized Firebase Admin SDK
import admin from "firebase-admin";
import {
  create,
  getOne,
  getAll,
  updateOne,
  updateMany,
  deleteOne,
  deleteMany,
} from "./firebaseWrapper";

// Create a new document in a collection
const createDocument = async () => {
  const data = {
    name: "John Doe",
    age: 35,
    email: "johndoe@example.com",
  };

  // Single path
  const path = "users";
  await create(path, data);

  // Multiple paths
  const paths = ["users", "userDetails/johndoe"];
  await create(paths, data);
};

// Get a document by ID, with optional error flag
const getDocument = async (id: string, errorFlag = false) => {
  const path = `users/${id}`;
  const options = errorFlag ? { errorIfMissing: true } : {};
  const document = await getOne(path, options);
  return document;
};

// Get all documents in a collection, with optional query options
const getAllDocuments = async () => {
  const path = "users";
  const options = { orderBy: "name" };
  const documents = await getAll(path, options);
  return documents;
};

// Update a document by ID, with optional query options
const updateDocument = async (id: string, data: Record<string, any>) => {
  const path = `users/${id}`;
  const options = { where: ["age", ">=", 30] };
  await updateOne(path, options, data);
};

// Update multiple documents in a collection, with optional query options
const updateDocuments = async (data: Record<string, any>) => {
  const path = "users";
  const options = { where: ["age", ">=", 30] };
  await updateMany(path, options, data);
};

// Delete a document by ID, with optional query options
const deleteDocument = async (id: string) => {
  const path = `users/${id}`;
  const options = { errorIfMissing: true };
  await deleteOne(path, options);
};

// Delete multiple documents in a collection, with optional query options
const deleteDocuments = async () => {
  const path = "users";
  const options = { where: ["age", "<=", 25] };
  await deleteMany(path, options);
};

// Complex query to get users between a certain age range, sorted by name
const getUsersByAgeRange = async (minAge: number, maxAge: number) => {
  const path = "users";
  const options = {
    where: [
      ["age", ">=", minAge],
      ["age", "<=", maxAge],
    ],
    orderBy: "name",
  };
  const documents = await getAll(path, options);
  return documents;
};
