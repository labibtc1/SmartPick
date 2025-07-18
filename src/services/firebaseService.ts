import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  User as FirebaseAuthUser 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { FirebaseUser, UserStats } from '../types';
import { LeetCodeAPI } from './leetcodeApi';

export class FirebaseService {
  static async signUp(email: string, password: string): Promise<FirebaseAuthUser> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user document in 'users' collection
    const userData: FirebaseUser = {
      uid: userCredential.user.uid,
      email,
      createdAt: Date.now(),
      isAdmin: email === 'admin@gmail.com'
    };
    
    // This will automatically create the 'users' collection if it doesn't exist
    await setDoc(doc(db, 'users', userCredential.user.uid), userData);
    
    return userCredential.user;
  }

  static async signIn(email: string, password: string): Promise<FirebaseAuthUser> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  }

  static async signOut(): Promise<void> {
    await signOut(auth);
  }

  static async getUserData(uid: string): Promise<FirebaseUser | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      return userDoc.exists() ? userDoc.data() as FirebaseUser : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  static async updateCodeforcesHandle(uid: string, handle: string): Promise<void> {
    // Use setDoc with merge to update or create the document
    await setDoc(doc(db, 'users', uid), { 
      codeforcesHandle: handle,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }

  static async updateLeetcodeHandle(uid: string, handle: string): Promise<void> {
    // Use setDoc with merge to update or create the document
    await setDoc(doc(db, 'users', uid), { 
      leetcodeHandle: handle,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }

  static async updateGithubHandle(uid: string, handle: string): Promise<void> {
    // Use setDoc with merge to update or create the document
    await setDoc(doc(db, 'users', uid), { 
      githubHandle: handle,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }

  static async saveUserStats(uid: string, stats: UserStats): Promise<void> {
    // This will automatically create the 'userStats' collection if it doesn't exist
    await setDoc(doc(db, 'userStats', uid), {
      ...stats,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  static async updateUserStatsWithLeetcode(uid: string, codeforcesStats: UserStats, leetcodeHandle: string): Promise<void> {
    try {
      const leetcodeStats = await LeetCodeAPI.getUserStats(leetcodeHandle);
      
      const updatedStats: UserStats = {
        ...codeforcesStats,
        leetcodeHandle,
        leetcodeProblemsSolved: leetcodeStats.totalSolved,
        totalProblemsSolved: codeforcesStats.problemsSolved + leetcodeStats.totalSolved,
        lastUpdated: Date.now()
      };

      await this.saveUserStats(uid, updatedStats);
    } catch (error) {
      throw new Error(`Failed to update LeetCode stats: ${error}`);
    }
  }

  static async getAllUserStats(): Promise<UserStats[]> {
    try {
      // This will access the 'userStats' collection
      const querySnapshot = await getDocs(collection(db, 'userStats'));
      return querySnapshot.docs.map(doc => doc.data() as UserStats);
    } catch (error) {
      console.error('Error getting all user stats:', error);
      return [];
    }
  }

  static async deleteUserStats(uid: string): Promise<void> {
    await deleteDoc(doc(db, 'userStats', uid));
  }

  // Helper method to initialize collections if needed (optional)
  static async initializeCollections(): Promise<void> {
    try {
      // Check if collections exist by trying to read them
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const statsSnapshot = await getDocs(collection(db, 'userStats'));
      
      console.log(`Users collection has ${usersSnapshot.size} documents`);
      console.log(`UserStats collection has ${statsSnapshot.size} documents`);
    } catch (error) {
      console.log('Collections will be created automatically when first document is added');
    }
  }
}