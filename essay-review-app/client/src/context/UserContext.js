import React, { createContext, useContext, useState } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [age, setAge] = useState(null);
    const [writingGrade, setWritingGrade] = useState(null);

    const updateUser = (userData) => {
        setUser(userData);
    };

    const updateAge = (userAge) => {
        setAge(userAge);
    };

    const updateWritingGrade = (grade) => {
        setWritingGrade(grade);
    };

    return (
        <UserContext.Provider value={{ user, age, writingGrade, updateUser, updateAge, updateWritingGrade }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUserContext = () => {
    return useContext(UserContext);
};