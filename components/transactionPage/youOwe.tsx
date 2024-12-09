import { doc, onSnapshot} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { auth, db } from "../../firebaseConfig";
import { Gesture, GestureDetector, ScrollView } from 'react-native-gesture-handler';
import { DemocraticPayByDebtor } from "../../backend/payments/democraticYouOwe";

interface Transaction {
    isDebt: boolean,
    paymentId: string
}

interface Debt {
    paymentId: string;
    createdByUsername: string;
    owedDetails: { amountOwed: number; userId: string; status: string;}[];
    totalAmount: number;
    groupName: string;
    categoryName: string;
}

export const YouOwe = () => {
    const [debts, setDebts] = useState<Debt[]>([]);
    const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    // track which transactions have been confirmed by user
    // issue with logging out because useEffect side effect is userid
    const user = auth.currentUser;
    const userId = user?.uid;
    /**
     * add listener for any new debts
     * the owedDetail confirmationStatus (or debt) should only be shown if confirmationStatus is "pending"
     */
    // have to use useMemo at top level
    const debtTransactions = useMemo(() =>
        userTransactions.filter((t) => t.isDebt),
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
                // filter for where isDebt is true
                // useMemo cache so only recomputes if transactions change
                setUserTransactions(userTransactions);
            }
        });        
            return () => unsubscribe();
        }, [user]);
    
        useEffect(() => {

            // array of firestore listeners
            const unsubscribes: (() => void)[] = [];
            // go through each debt transaction
            debtTransactions.forEach((debtTransaction) => {
                const debtRef = doc(db, "payments", debtTransaction.paymentId);

                const unsubDebt = onSnapshot(debtRef, (debtDoc) => {
                    if (!debtDoc.exists()) return;
                    
                    const debtData = debtDoc.data();
                    const categoryRef = doc(db, "groups", debtData.groupId, "UserCategories", debtData.categoryId);
                    const groupRef = doc(db, "groups", debtData.groupId);
    
                    // Listen for category changes
                    const unsubCategory = onSnapshot(categoryRef, (categoryDoc) => {
                        if (!categoryDoc.exists()) return;
    
                        // listen for group changes
                        const unsubGroup = onSnapshot(groupRef, (groupDoc) => {
                            if (!groupDoc.exists()) return;
    
                            setDebts(prevDebts => {
                                const newDebtData = {
                                    paymentId: debtDoc.id,
                                    ...debtData as Debt,
                                    groupName: groupDoc.data()?.groupName,
                                    categoryName: categoryDoc.data()?.categoryName
                                };
    
                                const index = prevDebts.findIndex(d => d.paymentId === debtDoc.id);
                                if (index !== -1) {
                                    const updatedDebts = [...prevDebts];
                                    updatedDebts[index] = newDebtData;
                                    return updatedDebts;
                                }
                                return [...prevDebts, newDebtData];
                            });
                        });
                        unsubscribes.push(unsubGroup);
                    });
                    unsubscribes.push(unsubCategory);
                });
                unsubscribes.push(unsubDebt);
            });
            setLoading(false);
            return () => unsubscribes.forEach(unsubscribe => unsubscribe());
        }, [debtTransactions]);
    
    
    if(loading){
        return(
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        )
    }
    // make it so on double tap you mark it as paid
    return(
        
        <ScrollView>
        <Text style={styles.header}>To Be Paid</Text>
        <View style={styles.container}>
            <Text style={styles.doubleTapHint}>Double-tap a transaction to confirm payment.</Text>
            {/** wrap each debt in a gesture detector so it can be double tapped to pay */}
            {debts.map((debt, index) => (
                <View key={debt.paymentId}>
                <GestureDetector gesture={
                Gesture.Tap()
                .numberOfTaps(2)
                .runOnJS(true)
                .onStart(() => 
                DemocraticPayByDebtor(debt.paymentId, userId))
                }>
                {/** each key for the outer layer is the payment id */}
                {/** in the deeper level (owed details) the key will be paymentid-userid */}
                {/** this is unique since userId in owedDetails in a payment doc is unique to one amount */}
                <View style={styles.debtTransactionContainer} key={index}>
                    {debt.owedDetails
                    .filter((detail) => detail.userId === userId && detail.status !== "confirmed")
                    .map((detail, idx) => (
                        <View key={idx}>
                        <Text style={{fontWeight: 'bold', fontSize: 14, color: 'white'}}>{debt.createdByUsername} is charging you for {debt.categoryName} in {debt.groupName}</Text>
                        <View style={{ paddingVertical: 4, alignItems: 'center' }}>
                            <Text style={{fontSize: 20, color: '#fff', paddingVertical: 2, alignSelf: 'center'}}> ${detail.amountOwed.toFixed(2)} </Text> 
                            <Text style={{color: '#FFC107', fontWeight: 'ultralight'}}> {detail.status} </Text> 
                        </View>
                        </View>
                ))}
                </View>
                </GestureDetector>
                {/** conditionally render the divider so it dissapears with confirmed transaction */}
                {debt.owedDetails.some(
                (detail) =>
                detail.userId === userId && detail.status !== "confirmed"
                ) && <View style={styles.divider} />}
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
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
    },
    header: {
        fontWeight: 'bold', 
        textAlign: 'center', 
        alignSelf: 'center',
        color: '#fff',
        fontSize: 20
    },
    debtTransactionContainer:{
        fontWeight: 'bold', 
        textAlign: 'center', 
        alignSelf: 'center', 
        color: '#fff', 
        marginVertical: 20
    },
    doubleTapHint: {
        fontSize: 12,
        color: '#AAA', 
        marginTop: 4,
        textAlign: 'center', 
        alignSelf: 'center',
    },
})