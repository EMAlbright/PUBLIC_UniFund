import React, {createContext, useState, useContext} from 'react';
/**
 * This file creates a global state for the application 
 * Based on the group the user selects in the profile page
 * The state of the application is dependent on the group
 */
// addind this to help for removing the context when a user deletes a group
// that they are currently set in
interface Group {
    groupId: string,
    groupName: string,
}
interface GroupContext {
    group: Group | null;
    // setter
    setGroup: (group: Group | null) => void;
}
const GroupContext = createContext<GroupContext | null>(null);

export const GroupState = ({children}) => {
    const[ group, setGroup] = useState<Group | null>(null);
    return (
        <GroupContext.Provider value={{ group, setGroup }}>
            {children}
        </GroupContext.Provider>
    );
};

export const useGroup = () => useContext(GroupContext);