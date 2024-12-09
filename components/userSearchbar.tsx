import React, { useState, useCallback } from "react";
import { StyleSheet, TextInput, View, Text as RNText, FlatList } from "react-native";
import { searchUser } from "../backend/searchUser";
import debounce from 'lodash/debounce';
import { InviteButton } from "./inviteButton";
import { useGroup } from "../backend/globalState/groupContext";

interface User {
    id: string;
    username: string;
}

export default function UserSearchBar() {
    const {group} = useGroup();
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [searchResults, setSearchResults] = useState<User[]>([]);

    const debouncedSearch = useCallback(
        debounce(async (text: string) => {
            // if nothing is entered into the text box the search results are empty
            if (text.trim() === '') {
                setSearchResults([]);
            } else {
                // else get the results async
                try {
                    const results = await searchUser(text);
                    setSearchResults(results);
                    // on error set results back to empty
                } catch (error) {
                    console.error('Error searching for users:', error);
                    setSearchResults([]);
                }
            }
            // set a 300 ms timeout on typing/deleting
            // allow 'catch up'
        }, 300),
        []
    );

    const handleSearch = (text: string) => {
        setSearchQuery(text);
        debouncedSearch(text);
    };

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.input}
                placeholder="Search for friends!"
                value={searchQuery}
                onChangeText={handleSearch}
            />
            <FlatList
            // render the username of each user
                data={searchResults}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.resultContainer}>
                        <RNText style={styles.resultItem}>{item.username}</RNText>
                        <InviteButton userid={item.id} />
                    </View>
                )}
            />

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        padding: 10,
        
    },
    input: {
        padding: 10,
        marginBottom: 10,
        borderRadius: 25,
        backgroundColor: '#f0f0f0'
    },
    resultItem: {
        padding: 5,
        fontWeight: 'bold',
        color: 'white',
    },
    resultContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
});