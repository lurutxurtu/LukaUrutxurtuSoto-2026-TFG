import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc,
  query, where, orderBy, serverTimestamp, arrayUnion,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Group, GroupMember } from '../types';
import { generateJoinCode } from '../utils/formatters';

const GROUPS_COLLECTION = 'groups';

export async function createGroup(name: string, currency: string, owner: GroupMember): Promise<string> {
  const joinCode = generateJoinCode();
  const groupData = {
    name, currency, ownerId: owner.uid,
    memberIds: [owner.uid], members: [owner],
    joinCode, createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, GROUPS_COLLECTION), groupData);
  return docRef.id;
}

export async function getGroup(groupId: string): Promise<Group | null> {
  const docRef = doc(db, GROUPS_COLLECTION, groupId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Group;
}

export async function getUserGroups(userId: string): Promise<Group[]> {
  const q = query(
    collection(db, GROUPS_COLLECTION),
    where('memberIds', 'array-contains', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Group));
}

export async function joinGroupByCode(joinCode: string, member: GroupMember): Promise<string> {
  const q = query(
    collection(db, GROUPS_COLLECTION),
    where('joinCode', '==', joinCode.toUpperCase())
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) throw new Error('Código de grupo no válido');

  const groupDoc = snapshot.docs[0];
  const groupData = groupDoc.data() as Group;
  if (groupData.memberIds.includes(member.uid)) throw new Error('Ya eres miembro de este grupo');

  await updateDoc(doc(db, GROUPS_COLLECTION, groupDoc.id), {
    memberIds: arrayUnion(member.uid),
    members: arrayUnion(member),
  });
  return groupDoc.id;
}

export async function updateGroupName(groupId: string, name: string): Promise<void> {
  await updateDoc(doc(db, GROUPS_COLLECTION, groupId), { name });
}

export async function deleteGroup(groupId: string): Promise<void> {
  await deleteDoc(doc(db, GROUPS_COLLECTION, groupId));
}

export async function leaveGroup(groupId: string, userId: string): Promise<void> {
  const docRef = doc(db, GROUPS_COLLECTION, groupId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) throw new Error('Grupo no encontrado');
  
  const groupData = docSnap.data() as Group;
  
  if (groupData.ownerId === userId && groupData.memberIds.length > 1) {
    throw new Error('El creador no puede abandonar el grupo mientras haya otros miembros. Elimina el grupo o pide a los demás que salgan primero.');
  }

  const updatedMemberIds = groupData.memberIds.filter(id => id !== userId);
  const updatedMembers = groupData.members.filter(m => m.uid !== userId);

  if (updatedMemberIds.length === 0) {

    await deleteDoc(docRef);
  } else {
    await updateDoc(docRef, {
      memberIds: updatedMemberIds,
      members: updatedMembers
    });
  }
}
