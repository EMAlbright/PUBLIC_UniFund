import { BarChart } from "react-native-chart-kit";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { auth, db } from "../firebaseConfig";
import { useEffect, useState } from "react";
import { FetchAllExpenses } from "../backend/chartFunctions/fetchAllExpenses";
import { Dimensions } from "react-native";
import { doc, onSnapshot } from "firebase/firestore";
import { FetchExpensesByGroup } from "../backend/chartFunctions/fetchGroupExpenses";
import { Check } from "lucide-react";
import { Ionicons } from "@expo/vector-icons";

type ExpenseData = {
    expensesByCategory: Record<string, number>;
    totalAmount: number;
}

interface Group {
    groupId: string,
    groupName: string,
}

export const BudgetChart = () => {
    const [expenseData, setExpenseData] = useState<ExpenseData | null>(null);
    const [userGroups, setUserGroups] = useState<Group[] | null>(null);
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    // initlaly display the past week
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [timeframe, setTimeFrame] = useState<'Week' | '2 Weeks' | 'Month' | 'Quarter'>('Week');
    const [error, setError] = useState<string | null>(null);
    const user = auth.currentUser;
    const userId = user?.uid;  

    useEffect(() => {
        // firestore listener to grab groups
        if (!user) {
            setUserGroups([]);
            return;
        }
        const userDocRef = doc(db, "users", user.uid);

        const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                const userData = docSnapshot.data();
                const groups = userData.groups || [];
                // set the groups to the group names
                setUserGroups(groups);
            } else {
                setUserGroups([]);
            }
        }, (error) => {
            console.error("Error fetching user's groups: ", error);
        });

        // Cleanup function to unsubscribe when component unmounts
        return () => unsubscribe();
    }, [user]);

    // use effect should execute on change of timeframe or diff user
    useEffect(() => {
        const renderChartData = async () => {
            try {
                let data: any;
                
                if(selectedGroup == 'all'){
                    data = await FetchAllExpenses(userId, timeframe)
                }
                else{
                    //filter by group
                    data = await FetchExpensesByGroup(userId, selectedGroup, timeframe);
                }

                if (!data || !data.expensesByCategory) {
                    setError("No data received");
                    return;
                }
                setExpenseData(data);
                setError(null);
            } catch (err) {
                console.log("Error fetching expense data:", err);
            }
        };

        renderChartData();
    }, [timeframe, user, selectedGroup]);

    const getSelectedGroupName = () => {
        if(!selectedGroup){
            return 'Select a Group';
        }
        else if(selectedGroup == 'all') {
            return 'All Groups';
        }
        else{
            return userGroups?.find(g => g.groupId === selectedGroup)?.groupName;
        }
    }
    
    const handleSelectGroup = (groupId: string) => {
        setSelectedGroup(groupId);
        setDropdownOpen(false);
    }

    const GroupDropdown = () => (
        <>
            <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setDropdownOpen(!dropdownOpen)}
            >
                <Text style={styles.dropdownButtonText}>{getSelectedGroupName()}</Text>
                <Ionicons name="arrow-down" size={20} color="white" />
            </TouchableOpacity>

            <Modal
                visible={dropdownOpen}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setDropdownOpen(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setDropdownOpen(false)}
                >
                    <View style={styles.dropdownList}>
                        <TouchableOpacity
                            style={styles.dropdownItem}
                            onPress={() => handleSelectGroup('all')}
                        >
                            <Text style={styles.dropdownItemText}>All Groups</Text>
                            {selectedGroup === 'all' && (
                                <Ionicons name="checkmark" size={20} color="#003f7f" />
                            )}
                        </TouchableOpacity>
                        {/** map each user group for the drop down */}
                        {userGroups?.map((group) => (
                            <TouchableOpacity
                                key={group.groupId}
                                style={styles.dropdownItem}
                                onPress={() => handleSelectGroup(group.groupId)}
                            >
                                <Text style={styles.dropdownItemText}>{group.groupName}</Text>
                                {selectedGroup === group.groupId && (
                                    <Ionicons name="checkmark" size={20} color="#003f7f" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );

    if (error) {
        return <Text style={styles.error}>{error}</Text>;
    }

    const noData = {
        labels: [''],
        datasets: [{
            data: [0]
        }],
    }

    // format the color string properly
    const getColor = (opacity = 1) => `rgba(255, 255, 255, ${opacity})`;

    return (
        <View style={styles.container}>
            {/** for dropdown groups */}
            <View style={styles.dropdownContainer}>
                <GroupDropdown />
            </View>

            {/** no data */}
            {expenseData && Object.keys(expenseData.expensesByCategory).length === 0 && (
                <View>
                <Text style={styles.noDataTextTop}>
                    No expenses logged in the past {timeframe}
                </Text>
                <Text style={styles.noDataText}>
                    Create a group, make a budget, add a category, log an expense!
                </Text>
                </View>
            )}                    
            {/** x (key) value is the category name, y (value) value is amount spent */}
            {/** display regular data if it exists, lese display empty data */}
            {expenseData && (
                <Text style={styles.totalAmount}>
                    Total Spent: ${expenseData.totalAmount.toFixed(2)}
                </Text>
            )}
            <View style={{backgroundColor: '#007bff'}}>
            <BarChart
                data={
                expenseData && Object.keys(expenseData.expensesByCategory).length > 0 ?
                {
                    labels: Object.keys(expenseData.expensesByCategory),
                    datasets: [{ 
                    data: Object.values(expenseData.expensesByCategory)
                    }],
                } : noData
                } 
                    width={Dimensions.get("window").width}
                    height={250}
                    fromZero
                    yAxisLabel="$"
                    yAxisSuffix=""
                    chartConfig={{
                    backgroundGradientFrom: "#007bff",
                    backgroundGradientTo: "#007bff",
                    decimalPlaces: 2,
                    color: getColor,
                }}
                style={styles.chart}
                />
            </View>
            <View style={styles.timeframeContainer}>
                {['Week', '2 Weeks', 'Month', 'Quarter'].map((period) => (
                    <TouchableOpacity
                    key={period}
                    style={[
                        styles.timeframeButton,
                        timeframe === period && styles.selectedTimeframe
                    ]}
                    onPress={() => setTimeFrame(period as typeof timeframe)}
                >
                    <Text style={[
                        styles.timeframeText,
                        timeframe === period && styles.selectedTimeframe
                    ]}>
                        {period}
                    </Text>
                </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingTop: 40,
    },
    dropdownContainer: {
        marginBottom: 16,
        paddingHorizontal: 16,
    },
    dropdownButton: {
        backgroundColor: '#003f7f',
        padding: 12,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#003f7f',
    },
    dropdownButtonText: {
        fontSize: 16,
        color: 'white',
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-start',
        paddingTop: 100,
    },
    dropdownList: {
        backgroundColor: 'white',
        marginHorizontal: 16,
        borderRadius: 8,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    dropdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    dropdownItemText: {
        fontSize: 16,
        color: '#333',
    },
    noDataTextTop: {
        textAlign: 'center',
        fontSize: 12,
        color: 'black',
        marginVertical: 8,
        fontStyle: 'italic',
    },
    noDataText: {
        textAlign: 'center',
        fontSize: 12,
        color: 'black',
        marginVertical: 8,
        fontStyle: 'italic',
        fontWeight: 'bold'
    },
    chart: {
        marginVertical: 8,
    },
    loadingContainer: {
        height: 220,
        justifyContent: 'center',
        alignItems: 'center',
    },
    error: {
        color: 'red',
        textAlign: 'center',
        padding: 16,
    },
    totalAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginVertical: 8,
        color: 'white'
    },
    timeframeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 16,
    },
    timeframeButton: {
        padding: 12,
        borderRadius: 24,
        backgroundColor: '#003f7f',
    },
    selectedTimeframe: {
        backgroundColor: 'white',
        color: '#003f7f'
    },
    timeframeText: {
        color: 'white',
        fontWeight: 'bold'
    },
});