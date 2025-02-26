import { useDispatch } from "react-redux";
import { fetchMessages, fetchThumbnail, addMessage, editMessage } from "@/redux/actions/messageActions";
import { setMessages } from "@/redux/reducers/messageReducer";
import { MAX_IMAGE_SIZE_MB, ALLOWED_IMAGE_FORMATS } from "@/constants";
import { isValidURL } from "@/utils/common";

export const useMessageStore = () => {
    const dispatch = useDispatch();

    const handleFetchMessages = async () => {
        try {
            let data = await dispatch(fetchMessages()).unwrap()
            dispatch(setMessages(data));
        } catch(error) {
            console.error(error);
        }
    }

    const handleValidateMessage = async (message) => {
        if(!message?.title){
            return {valid: false, attribute: "title", note: "Message Title is required"}
        }
      
        if(!message?.description){
            return {valid: false, attribute: "description", note: "Message Description is required"}
        }
          
        if(message?.thumbnail){
            try {
                if(!isValidURL(message?.thumbnail)) {
                    return {valid: false, attribute: "thumbnail", note: "URL validation failed"}
                }
                let data = await dispatch(fetchThumbnail(message?.thumbnail)).unwrap()
                
                if(!data){
                    return {valid: false, attribute: "thumbnail", note: "Error validating thumbnail image"}
                }

                const imageSizeMB = data.size / (1024 * 1024);
                if (imageSizeMB > MAX_IMAGE_SIZE_MB) {
                    return {valid: false, attribute: "thumbnail", note: `Thumbnail image size must be less than ${MAX_IMAGE_SIZE_MB} MB`}
                }

                const imageFormat = data.type;
                if (!ALLOWED_IMAGE_FORMATS.split(",").includes(imageFormat)) {
                    return {valid: false, attribute: "thumbnail", note: `Only ${ALLOWED_IMAGE_FORMATS} formats are allowed`}
                }
            
            } catch (error){
                return {valid: false, attribute: "thumbnail", note: `Error validating Thumbnail Image ${error}`}
            }
        }

        return {valid: true, attribute: null, note: null}
    }

    const handleAddMessage = async (message) => {
        try {
            const done = await dispatch(addMessage(message)).unwrap()
            return done
        } catch(error) {
            console.error(error);
            return false
        }
    }

    const handleUpdateMessage = async (message) => {
        try {
            const done = await dispatch(editMessage(message)).unwrap()
            return done
        } catch(error) {
            console.error(error);
            return false
        }
    }

    return { 
        handleFetchMessages,
        handleValidateMessage,
        handleAddMessage,
        handleUpdateMessage,
    };
}
