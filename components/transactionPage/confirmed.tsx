import { ActivityIndicator, StyleSheet, Text, View } from "react-native"
import { auth } from "../../firebaseConfig";
import { useEffect, useState } from "react";
import { GetConfirmedTransactions } from "../../backend/payments/getConfirmedTransactions";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";



export const ConfirmedTransaction = () => { 
    const [loading, setLoading] = useState(true);
    const [settledDebts, setSettledDebts] = useState([]);
    const [settledCredits, setSettledCredits] = useState([]);
    const user = auth.currentUser;
    const userId = user?.uid;
    // dont think we need a firestore listener because if it fetches whenever page mounts
    // we never do transactions on this page
    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }
        const FetchTransactionData = async() => {
            try {
                const transactionData = await GetConfirmedTransactions(userId);
                setSettledCredits(transactionData.credits);
                setSettledDebts(transactionData.debits);
            } catch (error) {
                console.error('Error fetching transactions:', error);
            } finally {
                setLoading(false);
            }
        };
        FetchTransactionData();
    },[])

    if (loading) {
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        );
      }

    return(
        <ScrollView>
        <Text style={styles.title}>Confirmed Transactions</Text>
        <View style={styles.container}>
            <Text style={styles.doubleTapHint}>Transactions that have confirmed by both parties.</Text>
            {settledCredits.map((credit, index) => (
                <View style={{paddingVertical: 20}} key={index}> 
                    <Text style={{fontWeight: 'bold', fontSize: 14, color: 'white'}}>{credit.debtLogger} paid you back ${(credit.paidAmount).toFixed(2)} for {credit.categoryName} in {credit.groupName}</Text>
                </View>
            ))}
            {settledDebts.map((debt, index) => (
                <View style={{paddingVertical: 20}} key={index}>
                    <Text style={{fontWeight: 'bold', fontSize: 14, color: 'white'}}>You paid {debt.expenseLogger} back ${(debt.paidAmount).toFixed(2)} for {debt.categoryName} in {debt.groupName}</Text>
                </View>
            ))}
        </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container:{
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
    title:{
        fontWeight: 'bold', 
        textAlign: 'center', 
        alignSelf: 'center',
        color: '#fff',
        fontSize: 20
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
      },
      doubleTapHint: {
        fontSize: 12,
        color: '#AAA', 
        marginTop: 4,
        textAlign: 'center', 
        alignSelf: 'center',
    },
})