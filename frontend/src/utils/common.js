const getCurrentYear = () => {
    const currentDate = new Date();
    return currentDate.getFullYear().toString();
};

export const currentYear = getCurrentYear();

export const isValidURL = (url) => {
    const regex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
    if (!regex.test(url)) {
        return false; // Invalid URL format
    }
    try {
        new URL(url);
        return true; // Valid URL
    } catch (error) {
        console.log(error)
        return false; // Invalid URL
    }
}
