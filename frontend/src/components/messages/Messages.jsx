/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { CircularProgress, Container, Button, Grid2 } from '@mui/material';
import { AddCircleOutline } from '@mui/icons-material';
import { useMessageStore } from "@/redux/stores/messageStore";
import { useSelector } from 'react-redux';
import MessageTile from './MessageTile';

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

    const [openNew, setOpenNew] = useState(false);

    return (
        isLoading ? <CircularProgress size="30px" /> :
        <Container style={{margin: 0}}>
            <Button variant="outlined" startIcon={<AddCircleOutline/>} size="small">
                Add New
            </Button>
            <Grid2 container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }} style={{paddingTop: '24px'}}>
                {messages.map((message, index) => (
                    <MessageTile key={index} message={message}/>
                ))}
            </Grid2>
        </Container>
    )
}

export default Messages;
