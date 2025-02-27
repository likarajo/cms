/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useLayoutEffect } from "react";
import { debounce } from 'lodash';
import { CircularProgress, Container, Button, Grid2, Dialog, DialogTitle, DialogContent, DialogActions, 
    TextField, LinearProgress, Typography, Stack, Chip, FormControlLabel, Switch, Alert,
    FormControl, InputLabel, Select, OutlinedInput, MenuItem, Checkbox, ListItemText, IconButton
} from '@mui/material';
import { AddCircleOutline, Check, Close, Add } from '@mui/icons-material';
import { useMessageStore } from "@/redux/stores/messageStore";
import { useSelector } from 'react-redux';
import MessageTile from './MessageTile';

const Messages = () => {

    const { 
        handleFetchMessages,
        handleFetchAllTags,
        handleValidateMessage,
        handleAddMessage,
        handleAddTags,
        handleAssignTags,
    } = useMessageStore()

    const messages = useSelector((state) => state?.messageReducer?.messages);
    const allTags = useSelector((state) => state?.messageReducer?.allTags);

    const [filteredMessages, setFilteredMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        try {
            handleFetchMessages();
            handleFetchAllTags();
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        setFilteredMessages(messages);
    }, [messages])

    const [openAdd, setOpenAdd] = useState(false);
    const MESSAGE_PAYLOAD = {
        "title": null,
        "description": null,
        "thumbnail": null,
        "video": null,
        "tags": [],
    }
    const [newMessage, setNewMessage] = useState(MESSAGE_PAYLOAD);
    const [tags, setTags] = useState([]);

    const handleTagsInputChange = (e) => {
        let updatedTags = new Set();
        e.target.value.split(',')?.map((item) => {
            let tag = item.trim()
            if(tag?.length > 0) updatedTags.add(tag)  // Trim each to remove leading and trailing whitespace
        })
        setTags(Array.from(updatedTags))
    };

    useEffect (() => {
        setNewMessage((prev) => ({...prev, tags: tags}));
    }, [tags])
    
    const VALIDATION_PAYLOAD = {valid: null, attribute: null, note: null};
    const [validation, setValidation] = useState(VALIDATION_PAYLOAD);
    const [validating, setValidating] = useState(false);

    const handleCloseAdd = async () => {
        setOpenAdd(false);
        setNewMessage(MESSAGE_PAYLOAD); // reset
        setTags([]); // reset
        setValidation(VALIDATION_PAYLOAD); // reset
        setValidating(false);
    }

    const [isLoading2, setIsLoading2] = useState(false);

    const handleSubmit = async () => {
        try {
            setValidating(true);
            const { valid, attribute, note } = await handleValidateMessage(newMessage);
            setValidating(false);
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
                setIsLoading2(true);
                try {
                    let newMessageTitle = newMessage?.title;
                    console.log("Adding New Message", newMessage)
                    const done = await handleAddMessage(newMessage)
                    if(done){
                        await handleCloseAdd();
                        await handleFetchMessages();
                        alert(`Successfully Created the Message: ${newMessageTitle}`)
                    } else {
                        console.error("Adding New Message failed", newMessage)
                    }
                } catch (error) {
                    console.error(error)
                } finally {
                    setIsLoading2(false);
                }
            }
        } finally {
            setValidating(false);
            setIsLoading2(false);
        }
    }

    const [assigningTags, setAssigningTags] = useState(false);
    const [selectedTags, setSelectedTags] = useState([]);
    const [selectedMessageIds, setSelectedMessageIds] = useState([]);
    const [selectedTagIds, setSelectedTagIds] = useState([]);
    
    const handleTagsSelect = (e) => {
        setSelectedTags(e.target.value);
    };

    useLayoutEffect(() => {
        if(!assigningTags) {
            setFilteredMessages( 
                selectedTags?.length > 0
                ? messages?.filter(message => message.tags.some(tag => selectedTags.map(t => t.name)?.includes(tag)))
                : messages
            )
        } else {
            setSelectedTagIds(selectedTags.map(t => t?.id))
        }
    }, [selectedTags, assigningTags])

    useLayoutEffect(() => {
        console.log("selectedMessageIds", selectedMessageIds)
    }, [selectedMessageIds])

    useLayoutEffect(() => {
        console.log("selectedTagIds", selectedTagIds)
    }, [selectedTagIds])

    const handleAssignTagsOpen = async () => {
        setAssigningTags(true);
        setSelectedTagIds([]);
        setSelectedMessageIds([]);
        setSelectedTags([]);
        setFilteredMessages(messages)
    }

    const handleAssignTagsClose = async () => {
        setFilteredMessages(messages)
        setAssigningTags(false);
        setSelectedTagIds([]);
        setSelectedMessageIds([]);
    }

    const handleAssignTagsSubmit = async () => {
        setIsLoading2(true);
        try {
            console.log("Assigning Message Tags", selectedMessageIds, selectedTagIds)
            const done = await handleAssignTags(selectedMessageIds, selectedTagIds)
            if(done){
                await handleAssignTagsClose();
                await handleFetchMessages();
                alert(`Successfully Assigned Message Tags`)
            } else {
                console.error("Assigning Message Tags failed")
            }
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading2(false);
        }
    }

    const [openAddTags, setOpenAddTags] = useState(false);
    const [tagsNew, setTagsNew] = useState([])

    const handleCloseAddTags = async () => {
        setOpenAddTags(false);
        setTagsNew([]); // reset
    }

    const handleTagsInputChangeNew = (e) => {
        let newTags = new Set();
        e.target.value.split(',')?.map((item) => {
            let tag = item.trim()
            if(tag?.length > 0) newTags.add(tag)  // Trim each to remove leading and trailing whitespace
        })
        setTagsNew(Array.from(newTags))
    };

    const handleSubmitTags = async () => {
        try {
            setIsLoading2(true);
            try {
                console.log("Adding New Tags", tagsNew)
                const done = await handleAddTags(tagsNew)
                if(done){
                    await handleCloseAddTags();
                    await handleFetchAllTags();
                    alert(`Successfully Created the Tags`)
                } else {
                    console.error("Adding New Tags failed", tagsNew)
                }
            } catch (error) {
                console.error(error)
            } finally {
                setIsLoading2(false);
            }
        } finally {
            setValidating(false);
            setIsLoading2(false);
        }
    }

    return (
        <React.Fragment>
            {isLoading && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 1, // ensures the loader is on top
                    }}
                >
                    <CircularProgress size="30px" />
                </div>
            )}
            <Container style={{margin: '0'}} maxWidth={false}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <Button onClick={() => setOpenAdd(true)} variant="outlined" startIcon={<AddCircleOutline/>} size="small">
                        Add New
                    </Button>
                    <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
                        {!assigningTags ?
                            <Button onClick={() => handleAssignTagsOpen()}>
                                Assign Tag
                            </Button>
                        :
                            <div style={{display: 'flex', alignItems: 'center'}}>
                                <span>Tag Assignment</span>
                                <IconButton onClick={() => handleAssignTagsSubmit()} disabled={selectedMessageIds?.length === 0 || selectedTagIds?.length === 0}>
                                    <Check/>
                                </IconButton>
                                <IconButton onClick={() => handleAssignTagsClose()}>
                                    <Close/>
                                </IconButton>
                            </div>
                        }
                        <FormControl sx={{ m: 1, width: 150 }}>
                            <InputLabel id="demo-multiple-checkbox-label">
                                {!assigningTags ? "Filter By Tags" : "Select Tags"}
                            </InputLabel>
                            <Select
                                multiple
                                value={selectedTags}
                                onChange={(e) => handleTagsSelect(e)}
                                input={<OutlinedInput label={!assigningTags ? "Filter By Tags" : "Select Tags"} />}
                                renderValue={(selected) => selected.map(tag => tag.name).join(', ')}
                                MenuProps={{ PaperProps: {style: {width: 250}} }}
                            >
                                {assigningTags && (
                                    <MenuItem key={"new"} value={"new"} sx={{marginLeft: '8px', gap: '8px'}} onClick={() => setOpenAddTags(true)}>
                                        <Add/>
                                        <ListItemText primary={"Create New"}/>
                                    </MenuItem>
                                )}
                                {allTags?.map((tag) => (
                                    <MenuItem key={tag?.name} value={tag}>
                                        <Checkbox checked={selectedTags?.some(selectedTag => selectedTag.name === tag.name)} />
                                        <ListItemText primary={tag?.name} />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </div>
                </div>
                <Grid2 container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }} style={{paddingTop: '24px'}}>
                    {filteredMessages?.map((message, index) => (
                        <MessageTile key={index} message={message} assigningTags={assigningTags} setSelectedMessageIds={setSelectedMessageIds}/>
                    ))}
                </Grid2>
            </Container>
            
            {openAdd &&
            <Dialog
                open={openAdd}
                onClose={(_, reason) => {
                    if (reason !== 'backdropClick') handleCloseAdd() // Only if it isn't a backdrop click
                }}
                maxWidth={"lg"}
                slotProps={{paper: {sx: {width: '900px', minHeight: '900px'}}}}
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
                        multiline rows={10}
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
                    <TextField 
                        label={"Video URL"} 
                        variant="outlined" 
                        margin="normal" 
                        fullWidth
                        error={validation?.valid===false && validation?.attribute === "video"}
                        helperText={validation?.valid===false && validation?.attribute === "video" ? validation?.note : null}
                        onChange={debounce((e) => {
                            setNewMessage((prev) => ({...prev, video: e.target.value}));
                            if(validation?.valid===false && validation?.attribute === "video") {
                                setValidation(VALIDATION_PAYLOAD); // reset
                            }
                        }, 300)} // Debounce to avoid excessive re-renders
                    />
                    {(newMessage?.video?.length>0) && // only if video link is added
                    <FormControlLabel 
                        control={
                            <Switch 
                                checked={newMessage?.gen_transcript}
                                onChange={(e) => setNewMessage((prev) => ({...prev, gen_transcript: e.target.checked}))}
                            />
                        }
                        label="Generate Transcript" 
                    />}
                    {newMessage?.gen_transcript && <Alert severity="warning" sx={{width: '200px'}}>Longer Upload Time</Alert>}
                    <TextField 
                        label={"Tags"} 
                        variant="standard" 
                        margin="normal" 
                        fullWidth
                        helperText="Enter Tags comma-separated"
                        onChange={(e) => handleTagsInputChange(e)}
                    />
                    <Stack direction="row" spacing={1}>
                        {tags.map((chip, index) => (
                            <Chip key={index} label={chip} variant="outlined" size="small"/>
                        ))}
                    </Stack>
                    {validating && <div><Typography variant='body2'>Validating</Typography><LinearProgress/></div>}
                    {isLoading2 && <div><Typography variant='body2'>Uploading</Typography><LinearProgress/></div>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => handleSubmit()} variant="outlined" startIcon={<Check/>}>Submit</Button>
                    <Button onClick={() => handleCloseAdd()} startIcon={<Close/>}>Cancel</Button>
                </DialogActions>
            </Dialog>}

            {openAddTags &&
            <Dialog
                open={openAddTags}
                onClose={(_, reason) => {
                    if (reason !== 'backdropClick') handleCloseAddTags() // Only if it isn't a backdrop click
                }}
                maxWidth={"md"}
                slotProps={{paper: {sx: {width: '500px', minHeight: '500px'}}}}
            >
                <DialogTitle id="scroll-dialog-title">
                    Create New Tag
                </DialogTitle>
                <DialogContent dividers={true}>
                    <TextField 
                        label={"Tags"} 
                        variant="standard" 
                        margin="normal" 
                        fullWidth
                        helperText="Enter Tags comma-separated"
                        onChange={(e) => handleTagsInputChangeNew(e)}
                    />
                    <Stack direction="row" spacing={1}>
                        {tagsNew.map((chip, index) => (
                            <Chip key={index} label={chip} variant="outlined" size="small"/>
                        ))}
                    </Stack>
                    {isLoading2 && <div><Typography variant='body2'>Creating</Typography><LinearProgress/></div>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => handleSubmitTags()} variant="outlined" startIcon={<Check/>} disabled={tagsNew?.length < 1}>Submit</Button>
                    <Button onClick={() => handleCloseAddTags()} startIcon={<Close/>}>Cancel</Button>
                </DialogActions>
            </Dialog>}

        </React.Fragment>
    )
}

export default Messages;
