
/**
 * ONLY the creator (members[0]) can delete the group
 */

import { arrayRemove, collection, deleteDoc, doc, getDoc, getDocs, query, where, writeBatch } from "firebase/firestore"
import { db } from "../../firebaseConfig"

export const DeleteGroup = async(userId: string, groupId: string) => {
    try{
        // do all the deletes at once with btach function
        const batch = writeBatch(db);

        const userRef = doc(db, "users", userId);
        const groupRef = doc(db, "groups", groupId);

        const userDoc = await getDoc(userRef);
        const groupDoc = await getDoc(groupRef);

        const userGroups = userDoc.data().groups || [];
        const groupToDelete = userGroups.find(group => group.groupId === groupId);

        const groupName = groupDoc.data().groupName;

        if (!groupToDelete?.isOwner) {
            return "Only Group Owners can delete groups!";
        }
        
        // go through all payments and expenses, delete them if they have groupId
        // go through users groups, delete groups[i]
        const expenseQuery = query(
            collection(db, "expenses"),
            where("groupId", "==", groupId)
        );
        const expenseDocs = await getDocs(expenseQuery);
        expenseDocs.forEach((expenseDoc) => {
            batch.delete(doc(db, "expenses", expenseDoc.id));
        })

        // same for payments
        const paymentQuery = query(
            collection(db, "payments"),
            where("groupId", "==", groupId)
        );
        const paymentDocs = await getDocs(paymentQuery);
        const paymentIds = paymentDocs.docs.map(doc => doc.id);
        paymentDocs.forEach((paymentDoc) => {
            batch.delete(doc(db, "payments", paymentDoc.id));
        })

        // Update users
        const usersQuery = query(
            collection(db, "users"),
            where("groups", "array-contains", {
                groupId: groupId,
                groupName: groupName,
                isOwner: false
            })
        );
        
        const usersDocs = await getDocs(usersQuery);
        
        usersDocs.forEach((doc) => {
            const userData = doc.data();
            const groupToRemove = userData.groups.find(g => g.groupId === groupId);
            
            if (groupToRemove) {
                batch.update(doc.ref, {
                    groups: arrayRemove(groupToRemove)
                });
            }
        });

        // Also update the owner's document
        const ownerQuery = query(
            collection(db, "users"),
            where("groups", "array-contains", {
                groupId: groupId,
                groupName: groupName,
                isOwner: true
            })
        );
        
        const ownerDocs = await getDocs(ownerQuery);
        
        ownerDocs.forEach((doc) => {
            const userData = doc.data();
            const groupToRemove = userData.groups.find(g => g.groupId === groupId);
            
            if (groupToRemove) {
                batch.update(doc.ref, {
                    groups: arrayRemove(groupToRemove)
                });
            }
        });

        const userTransactionQuery = query(collection(db, "users"));
    
        const userDocs = await getDocs(userTransactionQuery);
    
        userDocs.forEach((userDoc) => {
            const userData = userDoc.data();
            if (userData.transactions) {
                // Check if user has any of the payment IDs in their transactions
                const hasMatchingPayment = userData.transactions.some(
                    transaction => paymentIds.includes(transaction.paymentId)
                );
                
                if (hasMatchingPayment) {
                    paymentIds.forEach((paymentId) => {
                        batch.update(userDoc.ref, {
                            transactions: arrayRemove({
                                paymentId: paymentId,
                                isDebt: false
                            })
                        });
                        
                        batch.update(userDoc.ref, {
                            transactions: arrayRemove({
                                paymentId: paymentId,
                                isDebt: true
                            })
                        });
                    });
                }
            }
        });


        // last delete the groupref
        batch.delete(groupRef);
        //have to commit
        await batch.commit();
        return "Group Deleted!"
    }
    catch(error){
        console.log(error);
    }
}