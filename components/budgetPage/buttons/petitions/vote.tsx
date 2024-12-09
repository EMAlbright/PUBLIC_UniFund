/**
 * button to vote for a petition
 * should only appear clickable if the user has voted
 * else \just have a disable "voted" button
 * check to see if user id is in either yay or nay array
 */

import { arrayUnion, doc, getDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { auth, db } from "../../../../firebaseConfig";
import { Text, TouchableOpacity, View } from "react-native";

interface User{
    userId: string,
    username: string,
}

interface VoteButtonProps {
    petitionId: string
}

export const VoteButton = ({petitionId}: VoteButtonProps) => {
    const [voted, setVoted] = useState(false);
    const [user, setUser] = useState<User>(null);
    const currUser = auth.currentUser;
    const userId = currUser?.uid;
    useEffect(() => {   
        const GrabUserData = async() => {
            const userRef = doc(db, "users", userId);
            const userDoc = await getDoc(userRef);
            setUser({
                userId: userId,
                username: userDoc.data().profile.username
            });
        }
        GrabUserData();
    }, []);

    useEffect(() => {
        const checkIfUserVoted = async () => {
            const petitionRef = doc(db, "petitions", petitionId);
            const petitionDoc = await getDoc(petitionRef);
            const petitionData = petitionDoc.data();
            // if user id is in any yay or nay array then set voted to true
            if(
                petitionData.yayVotes.some((vote: any) => vote.userId === userId) ||
                petitionData.nayVotes.some((vote: any) => vote.userId === userId)
            ){
                setVoted(true);
            }

          };
          checkIfUserVoted();

    }, [petitionId])

    // see if the user have voted already or not

    const HandleYay = async() => {
        // update petition doc to yayVote
        const petitionRef = doc(db, "petitions", petitionId);
        await updateDoc(petitionRef, {
            yayVotes: arrayUnion({userId: user.userId, username: user.username})
        })
        setVoted(true);
    }

    const HandleNay = async() => {
        // update petition doc to nayVote
        const petitionRef = doc(db, "petitions", petitionId);
        await updateDoc(petitionRef, {
            nayVotes: arrayUnion({userId: user.userId, username: user.username})
        })
        setVoted(true);
    }

    return(
        
        <View>
            {!voted && (
                <View>
                    <TouchableOpacity onPress={HandleYay}>
                        <Text>Vote Yay</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={HandleNay}>
                        <Text>Vote Nay</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    )
}