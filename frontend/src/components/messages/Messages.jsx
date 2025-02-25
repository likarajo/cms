/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { debounce } from 'lodash';
import { CircularProgress, Container, Button, Grid2, Dialog, DialogTitle, DialogContent, DialogActions, TextField, LinearProgress, Typography, Stack, Chip } from '@mui/material';
import { AddCircleOutline, Check, Close } from '@mui/icons-material';
import { useMessageStore } from "@/redux/stores/messageStore";
import { useSelector } from 'react-redux';
import MessageTile from './MessageTile';

const Messages = () => {

    const { 
        handleFetchMessages,
        handleValidateMessage,
        handleAddMessage,
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

    const [openAdd, setOpenAdd] = useState(false);
    
    const MESSAGE_PAYLOAD = {
        "title": null,
        "description": null,
        "thumbnail": null,
        "tags": null,
    }
    const [newMessage, setNewMessage] = useState(MESSAGE_PAYLOAD);

    const [chips, setChips] = useState([]);

    const handleInputChange = (e) => {
        setNewMessage((prev) => ({...prev, tags: e.target.value}));
        let updatedChips = new Set();
        e.target.value.split(',')?.map((item) => {
            let chip = item.trim()
            if(chip?.length > 0) updatedChips.add(chip)  // Trim each chip to remove leading and trailing whitespace
        })
        setChips(Array.from(updatedChips))
    };
    
    const VALIDATION_PAYLOAD = {valid: null, attribute: null, note: null};
    const [validation, setValidation] = useState(VALIDATION_PAYLOAD);
    const [validating, setValidating] = useState(false);

    const handleCloseAdd = () => {
        setOpenAdd(false);
        setNewMessage(MESSAGE_PAYLOAD); // 
        setChips([]); // reset
        setValidation(VALIDATION_PAYLOAD); // reset
        setValidating(false);
    }

    const handleSubmit = async () => {
        setValidating(true);
        try {
            const { valid, attribute, note } = await handleValidateMessage(newMessage);
            if(!valid) {
                console.log("Validation failed:", attribute, note)
                setValidation((prev) => ({
                    ...prev,
                    valid: valid,
                    attribute: attribute,
                    note: note,
                }))
                alert(note);
            } else {
                setIsLoading(true);
                try {
                    console.log("Adding New Message", newMessage)
                    const done = await handleAddMessage(newMessage)
                    if(done){
                        handleCloseAdd();
                        await handleFetchMessages();
                    } else {
                        console.error("Adding New Message failed", newMessage)
                    }
                } catch (error) {
                    console.error(error)
                } finally {
                    setIsLoading(false);
                }
            }
        } finally {
            setValidating(false);
        }
    }

    return (
        <React.Fragment>
            {isLoading ? <CircularProgress size="30px" /> :
            <Container style={{margin: 0}}>
                <Button onClick={() => setOpenAdd(true)} variant="outlined" startIcon={<AddCircleOutline/>} size="small">
                    Add New
                </Button>
                <Grid2 container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }} style={{paddingTop: '24px'}}>
                    {messages.map((message, index) => (
                        <MessageTile key={index} message={message}/>
                    ))}
                </Grid2>
            </Container>}
            
            {openAdd &&
            <Dialog
                open={openAdd}
                onClose={(_, reason) => {
                    if (reason !== 'backdropClick') handleCloseAdd() // Only if it isn't a backdrop click
                }}
                maxWidth={"lg"}
                slotProps={{paper: {sx: {minWidth: '900px', minHeight: '900px'}}}}
            >
                <DialogTitle id="scroll-dialog-title">
                    Add New Message
                </DialogTitle>
                <DialogContent dividers={true}>
                    <TextField 
                        label={"Title*"} 
                        variant="outlined" 
                        margin="normal" 
                        fullWidth
                        error={validation?.valid===false && validation?.attribute === "title"}
                        helperText={validation?.valid===false && validation?.attribute === "title" ? validation?.note : null}
                        onChange={debounce((e) => {
                            setNewMessage((prev) => ({...prev, title: e.target.value}));
                            if(validation?.valid===false && validation?.attribute === "title") {
                                setValidation(VALIDATION_PAYLOAD); // reset
                            }
                        }, 300)} // Debounce to avoid excessive re-renders
                    />
                    <TextField 
                        label={"Description*"} 
                        variant="outlined" 
                        margin="normal" 
                        fullWidth
                        multiline rows={15}
                        error={validation?.valid===false && validation?.attribute === "description"}
                        helperText={validation?.valid===false && validation?.attribute === "description" ? validation?.note : null}
                        onChange={debounce((e) => {
                            setNewMessage((prev) => ({...prev, description: e.target.value}));
                            if(validation?.valid===false && validation?.attribute === "description") {
                                setValidation(VALIDATION_PAYLOAD); // reset
                            }
                        }, 300)} // Debounce to avoid excessive re-renders
                    />
                    <TextField 
                        label={"Thumbnail URL"} 
                        variant="outlined" 
                        margin="normal" 
                        fullWidth
                        error={validation?.valid===false && validation?.attribute === "thumbnail"}
                        helperText={validation?.valid===false && validation?.attribute === "thumbnail" ? validation?.note : null}
                        onChange={debounce((e) => {
                            setNewMessage((prev) => ({...prev, thumbnail: e.target.value}));
                            if(validation?.valid===false && validation?.attribute === "thumbnail") {
                                setValidation(VALIDATION_PAYLOAD); // reset
                            }
                        }, 300)} // Debounce to avoid excessive re-renders
                    />
                    {validating && <div><Typography variant='body2'>Validating</Typography><LinearProgress/></div>}
                    <TextField 
                        label={"Tags"} 
                        variant="standard" 
                        margin="normal" 
                        fullWidth
                        helperText="Enter Tags comma-separated"
                        onChange={(e) => handleInputChange(e)}
                    />
                    <Stack direction="row" spacing={1}>
                        {chips.map((chip, index) => (
                            <Chip key={index} label={chip} variant="outlined" size="small"/>
                        ))}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => handleSubmit()} variant="outlined" startIcon={<Check/>}>Submit</Button>
                    <Button onClick={() => handleCloseAdd()} startIcon={<Close/>}>Cancel</Button>
                </DialogActions>
            </Dialog>}
        </React.Fragment>
    )
}

export default Messages;
