import { Document } from 'mongoose';

export const transformMongoDoc = <T extends Document>(
  doc: T
): Omit<ReturnType<T['toObject']>, '_id'> & { id: string } => {
  const obj = doc.toObject();
  const { _id, ...rest } = obj;
  return {
    id: _id.toString(),
    ...rest,
  } as any;
};

export const transformMongoDocs = <T extends Document>(
  docs: T[]
): (Omit<ReturnType<T['toObject']>, '_id'> & { id: string })[] => {
  return docs.map(transformMongoDoc);
};
