import { getDocs, collection, query, where, updateDoc, arrayUnion, doc } from "firebase/firestore";
import { auth, db } from '../firebaseConfig';

interface User {
    id: string,
    username: string
}

export const searchUser = async(searchTerm: string): Promise<User[]> => {
    const user = auth.currentUser;
    // query for the username
    // get the user reference
    const usersRef = collection(db, "users");
    // look for the search term (username) in all user usernames
    const q = query(usersRef, 
        where("profile.username", ">=", searchTerm.toLowerCase()), 
        where("profile.username", "<=", searchTerm.toLowerCase() + '\uf8ff'));
    const querySnapshot = await getDocs(q);
    // initially the search results (users) is empty users
    const users = [];
    // as the user types we push the current search results onto the 'users' of type User array
    querySnapshot.forEach((doc) => {
        // cant look up own name
      if(doc.id != user.uid){
        users.push({ id: doc.id, username: doc.data().profile.username });
      }
    });    
    return users;
}

