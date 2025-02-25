import { useDispatch } from "react-redux";
import { fetchMessages } from "@/redux/actions/messageActions";
import { setMessages } from "@/redux/reducers/messageReducer";

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

    return { 
        handleFetchMessages,
    };
}
