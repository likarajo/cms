const getCurrentYear = () => {
    const currentDate = new Date();
    return currentDate.getFullYear().toString();
};

export const currentYear = getCurrentYear();

