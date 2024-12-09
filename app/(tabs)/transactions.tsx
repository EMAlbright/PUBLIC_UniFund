import React, { useEffect, useState, useRef } from 'react';
import { Animated, Button, TextInput } from 'react-native';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useGroup } from '../../backend/globalState/groupContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Directions } from 'react-native-gesture-handler';
import { YouOwe } from '../../components/transactionPage/youOwe';
import { YouOwed } from '../../components/transactionPage/youOwed';
import { ConfirmedTransaction } from '../../components/transactionPage/confirmed';
// TODO add a third page that lists all the expenses the user has 
// and any debts left to collect

export default function Transactions() {
  const [currentPage, setCurrentPage] = useState(0);
  const {group} = useGroup();

  const notifySwipeAnimation = useRef(new Animated.Value(1)).current;

  const swipe = Gesture.Pan()
  .runOnJS(true)
  .onEnd((event) => {
    if (event.velocityX < -1000) {
      setCurrentPage(prev => Math.min(prev + 1, 2));
    }
    else if (event.velocityX > 1000){
      setCurrentPage(prev => Math.max(prev- 1, 0));
    }
  });

  // when first mounted, this animation will appear to tell the user
  // you can swipe left/right to see what you owe or are owed
  useEffect(() => {
    Animated.sequence([
      Animated.timing(notifySwipeAnimation, {toValue: 1, duration: 2000, useNativeDriver: true}),
      Animated.timing(notifySwipeAnimation, { toValue: 0, duration: 2000, useNativeDriver: true })
    ]).start();
  }, []);

  // now that we have three cases render with switch case
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 0:
        return <YouOwe />;
      case 1:
        return <YouOwed />;
      case 2:
        return <ConfirmedTransaction />;
      default:
        return <YouOwe />;
    }
  };

  return (
    <GestureDetector gesture={swipe}>
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRight} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerText}>
            {group ? group.groupName : "No group"}
          </Text>
        </View>
        <View style={styles.headerLeft} />
      </View>
      {renderCurrentPage()}

        {/* Dot indicators -- fill the activate page dot, nonactive empty */}
        <View style={styles.dotContainer}>
        <View style={[styles.dot, currentPage === 0 && styles.activeDot]} />
          <View style={[styles.dot, currentPage === 1 && styles.activeDot]} />
          <View style={[styles.dot, currentPage === 2 && styles.activeDot]} />
        </View>

        {/* Fade-in hint text == initial page load fade in to */}
        <Animated.Text style=
        {
          [styles.swipeHint, 
          { opacity: notifySwipeAnimation }]
        }>
          Swipe to navigate
        </Animated.Text>

    </SafeAreaView>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
      flex: 1,
      backgroundColor: '#003f7f',
  },
  header: {
    backgroundColor: '#003f7f',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 2,
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
    marginHorizontal: 4,
    opacity: 0.3,
  },
  activeDot: {
    opacity: 1,
  },
  swipeHint: {
    textAlign: 'center',
    color: 'white',
    fontSize: 14,
    marginBottom: 10,
  },
});