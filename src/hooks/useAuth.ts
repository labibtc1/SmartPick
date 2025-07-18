import { useState, useEffect } from 'react';
import { User as FirebaseAuthUser, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import { FirebaseService } from '../services/firebaseService';
import { FirebaseUser } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<FirebaseAuthUser | null>(null);
  const [userData, setUserData] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          // Get user data from Firestore
          const userData = await FirebaseService.getUserData(firebaseUser.uid);
          setUserData(userData);
        } catch (error) {
          console.warn('Error fetching user data:', error);
          // If user document doesn't exist, create it
          if (firebaseUser.email) {
            try {
              const newUserData: FirebaseUser = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                createdAt: Date.now(),
                isAdmin: firebaseUser.email === 'admin@gmail.com'
              };
              // Create user document directly
              await setDoc(doc(db, 'users', firebaseUser.uid), newUserData);
              setUserData(newUserData);
            } catch (createError) {
              console.warn('Error creating user document:', createError);
            }
          }
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { user, userData, loading };
};