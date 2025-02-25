/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { CircularProgress, Container, Typography } from '@mui/material';
import { useMessageStore } from "@/redux/stores/messageStore";
import { useSelector } from 'react-redux';

const Messages = () => {

    const { 
        handleFetchMessages,
    } = useMessageStore()

    const messages = useSelector((state) => state?.messageReducer?.messages);

    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        try {
            handleFetchMessages();
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    return (
        isLoading ? <CircularProgress size="30px" /> :
        <Container>
            <Typography variant="h5" gutterBottom>
                Messages
            </Typography>
            <Container>
                {messages}
            </Container>
        </Container>
    )
}

export default Messages;
