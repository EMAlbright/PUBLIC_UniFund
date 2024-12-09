import { doc, onSnapshot} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { auth, db } from "../../firebaseConfig";
import { Gesture, GestureDetector, ScrollView } from 'react-native-gesture-handler';
import {DemocraticPayByLogger} from '../../backend/payments/demoraticYouOwed';

interface Transaction {
    isDebt: boolean,
    paymentId: string
}

interface Credit {
    paymentId: string;
    createdByUsername: string;
    owedDetails: { amountOwed: number; userId: string; status: string; username: string;}[];
    totalAmount: number;
    groupName: string;
    categoryName: string;
}


export const YouOwed = () => {

    const [credits, setcredits] = useState<Credit[]>([]);
    // when the logger of the expense (since this is for what you are owed)
    // double taps a transaction, set the user id of who owes them
    const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    // track which transactions have been confirmed by user
    // issue with logging out because useEffect side effect is userid
    const user = auth.currentUser;
    const userId = user?.uid;
    /**
     * add listener for any new credits
     * the owedDetail confirmationStatus (or credit) should only be shown if confirmationStatus is "pending"
     */
    // have to use useMemo at top level
    const creditTransactions = useMemo(() =>
        userTransactions.filter((t) => !t.isDebt),
        [userTransactions]
    );

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }
        const userRef = doc(db, "users", userId);
        const unsubscribe = onSnapshot(userRef, async(snapDoc) => {
            if(snapDoc.exists()){
                const userData = snapDoc.data();
                const userTransactions = userData.transactions || [];
                // filter for where iscredit is true
                // useMemo cache so only recomputes if transactions change
                setUserTransactions(userTransactions);
            }
        });        
            return () => unsubscribe();
        }, [user]);
    
        useEffect(() => {
            if (!creditTransactions.length) {
                setLoading(false);
                return;
            }
            if (!user) {
                setLoading(false);
                return;
            }
            // array of firestore listeners
            const unsubscribes: (() => void)[] = [];
            // go through each credit transaction
            creditTransactions.forEach((creditTransaction) => {
                const creditRef = doc(db, "payments", creditTransaction.paymentId);
                
                const unsubcredit = onSnapshot(creditRef, (creditDoc) => {
                    if (!creditDoc.exists()) return;
                    
                    const creditData = creditDoc.data();
                    const categoryRef = doc(db, "groups", creditData.groupId, "UserCategories", creditData.categoryId);
                    const groupRef = doc(db, "groups", creditData.groupId);
    
                    // Listen for category changes
                    const unsubCategory = onSnapshot(categoryRef, (categoryDoc) => {
                        if (!categoryDoc.exists()) return;
    
                        // listen for group changes
                        const unsubGroup = onSnapshot(groupRef, (groupDoc) => {
                            if (!groupDoc.exists()) return;
    
                            setcredits(prevcredits => {
                                const newcreditData = {
                                    paymentId: creditDoc.id,
                                    ...creditData as Credit,
                                    groupName: groupDoc.data()?.groupName,
                                    categoryName: categoryDoc.data()?.categoryName
                                };
    
                                const index = prevcredits.findIndex(d => d.paymentId === creditDoc.id);
                                if (index !== -1) {
                                    const updatedcredits = [...prevcredits];
                                    updatedcredits[index] = newcreditData;
                                    return updatedcredits;
                                }
                                return [...prevcredits, newcreditData];
                            });
                            setLoading(false);
                        });
                        unsubscribes.push(unsubGroup);
                    });
                    unsubscribes.push(unsubCategory);
                });
                unsubscribes.push(unsubcredit);
            });
            
            return () => unsubscribes.forEach(unsubscribe => unsubscribe());
        }, [creditTransactions]);

    return(
        <ScrollView>
            <Text style={styles.header}>To Be Collected</Text>
            <View style={styles.container}>
                <Text style={styles.doubleTapHint}>Double-tap a transaction to confirm payment.</Text>
                {credits.map((credit, index) => (
                    <View key={`${credit.paymentId}-${index}`}>
                        {credit.owedDetails.
                        filter((detail) => detail.status !== "confirmed").
                        map((detail, idx) => (
                            <View>
                            <GestureDetector 
                                key={`${credit.paymentId}-${detail.userId}-${index}`}
                                gesture={Gesture.Tap()
                                    .numberOfTaps(2)
                                    .runOnJS(true)
                                    .onStart(() => {
                                        DemocraticPayByLogger(credit.paymentId, detail.userId)
                                    })
                                }
                            >
                            <View style={{marginVertical: 20}}>
                                <Text style={{fontWeight: 'bold', fontSize: 14, color: 'white', alignSelf: 'center'}}>
                                    {detail.username} owes you for {credit.categoryName} in {credit.groupName}
                                </Text>
                                <View style={{ alignItems: 'center', paddingVertical: 4 }}>
                                    <Text style={{fontSize: 20, color: '#fff', paddingVertical: 2, alignSelf: 'center'}}>
                                        ${detail.amountOwed.toFixed(2)}
                                    </Text>
                                    <Text style={{color: '#FFC107', fontWeight: 'ultralight'}}>
                                        {detail.status}
                                    </Text>
                                </View>
                            </View>
                            </GestureDetector>
                            <View style={styles.divider}></View>
                            </View>
                        ))}
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    divider: {
        height: 1,
        backgroundColor: '#333',
        marginVertical: 10,
    },
    container: {
        padding: 16,
        backgroundColor: '#003f7f',
        marginVertical: 8,
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,
        elevation: 4,
    },
    loadingContainer:{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      
    },
    header: {
        fontWeight: 'bold', 
        textAlign: 'center', 
        alignSelf: 'center',
        color: '#fff',
        fontSize: 20
    },
    creditTransactionContainer:{
        fontWeight: 'bold', 
        textAlign: 'center', 
        alignSelf: 'center', 
        color: '#fff', 
    },
    doubleTapHint: {
        fontSize: 12,
        color: '#AAA', 
        marginTop: 4,
        textAlign: 'center', 
        alignSelf: 'center',
    },
})