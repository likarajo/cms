/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react"
import { debounce } from 'lodash';
import { Card, CardContent, Typography, Box, Chip, Badge, Stack, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, TextField, LinearProgress, CircularProgress } from '@mui/material';
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';
import { Add, Close, Edit, Check } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { DEFAULT_IMAGE } from "@/constants";
import { useMessageStore } from "@/redux/stores/messageStore";

const MessageTile = ({ message } ) => {

    const {
        handleValidateMessage,
        handleUpdateMessage,
        handleFetchMessages,
    } = useMessageStore();

    const [isLoading, setIsLoading] = useState(false);
    const [updatedMessage, setUpdatedMessage] = useState(message);
    const [tags, setTags] = useState(message.tags);

    useEffect(() => {
        setUpdatedMessage(message);
        setTags(message.tags);
    }, [message])
    
    const [elevated, setElevated] = useState(false);
    const [openView, setOpenView] = useState(false);

    const descriptionElementRef = React.useRef(null);
    useEffect(() => {
        if (openView) {
            const { current: descriptionElement } = descriptionElementRef;
            if (descriptionElement !== null) {
                descriptionElement.focus();
            }
        }
    }, [openView]);

    const TagsTooltip = styled(({ className, ...props }) => (
        <Tooltip {...props} classes={{ popper: className }} style={{cursor: "pointer"}} />
    ))(({ theme }) => ({
        [`& .${tooltipClasses.tooltip}`]: {
          backgroundColor: theme.palette.common.white,
          color: 'rgba(0, 0, 0, 0.87)',
          boxShadow: theme.shadows[1],
          fontSize: 14,
        },
    }));

    const [openEdit, setOpenEdit] = useState(false);
    
    const handleTagsInputChange = (e) => {
        let updatedTags = new Set();
        e.target.value.split(',')?.map((item) => {
            let tag = item.trim()
            if(tag?.length > 0) updatedTags.add(tag)  // Trim each to remove leading and trailing whitespace
        })
        setTags(Array.from(updatedTags))
        
    };

    useEffect (() => {
        setUpdatedMessage((prev) => ({...prev, tags: tags}));
    }, [tags])

    const VALIDATION_PAYLOAD = {valid: null, attribute: null, note: null};
    const [validation, setValidation] = useState(VALIDATION_PAYLOAD);
    const [validating, setValidating] = useState(false);

    const handleCloseEdit = () => {
        setOpenEdit(false);
        setUpdatedMessage(message); // reset
        setTags(message?.tags); // reset
        setValidation(VALIDATION_PAYLOAD); // reset
        setValidating(false);
    }

    const handleSubmit = async () => {
        setValidating(true);
        try {
            const { valid, attribute, note } = await handleValidateMessage(updatedMessage);
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
                    console.log("Updating Message", updatedMessage)
                    const done = await handleUpdateMessage(updatedMessage)
                    if(done){
                        handleCloseEdit();
                        await handleFetchMessages();
                    } else {
                        console.error("Updating Message failed", updatedMessage)
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
            {isLoading && <CircularProgress size="30px" />}
            <Card 
                sx={{ 
                    width: 300, 
                    height: 350,
                    cursor: "pointer",
                    transition: "box-shadow 0.3s ease",
                    boxShadow: elevated ? "0px 4px 12px rgba(0, 0, 0, 0.2)" : undefined,
                    border: "1px solid rgba(0, 0, 0, 0.1)",
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                }} 
                onMouseEnter={() => setElevated(true)} 
                onMouseLeave={() => setElevated(false)}
                onClick={() => setOpenView(true)}
            >
                <CardContent>
                    <Typography 
                        variant="h5" 
                        component="div" 
                        style={{paddingTop: '4px'}}
                    >
                        {message?.title}
                    </Typography>
                    <Box
                        component="img"
                        src={message?.thumbnail ?? DEFAULT_IMAGE}
                        alt="Thumbnail"
                        sx={{ width: '100%', height: 150, objectFit: 'cover', my: 1 }}
                    />
                    <Typography 
                        variant="body2" 
                        sx={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}
                    >
                        {message?.description}
                    </Typography>
                </CardContent>
                <Box sx={{ padding: '16px', display: 'flex', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
                    {tags?.length > 0 && <Chip label={tags[0]} variant="outlined" size="small"/>}
                    {tags?.length > 1 && 
                        <TagsTooltip 
                            title={<Stack>{tags?.slice(1)?.map((tag, index) => <Typography key={index} variant='body2'>{tag}</Typography>)}</Stack>}
                            placement="right-start"
                        >
                            <Badge badgeContent={tags?.length - 1} color="primary">
                                <Add color="action" />
                            </Badge>
                        </TagsTooltip>
                    }
                </Box>
            </Card>
            
            {openView &&
            <Dialog
                open={openView}
                onClose={(_, reason) => {
                    if (reason !== 'backdropClick') setOpenView(false) // Only if it isn't a backdrop click
                }}
                maxWidth={"lg"}
                sx={{ minWidth: '900px', minHeight: '900px', objectFit: 'cover', my: 1 }}
            >
                <DialogTitle id="scroll-dialog-title">
                    {message?.title}
                    <div>
                        {tags?.map((tag, index) => (
                            <Chip key={index} label={tag} variant="outlined" size="small" style={{margin: '4px'}}/>
                        ))}
                    </div>
                </DialogTitle>
                <DialogContent dividers={true}>
                    <Box
                        component="img"
                        src={message?.thumbnail ?? DEFAULT_IMAGE}
                        alt="Thumbnail"
                        sx={{ height: 200, margin: '0 auto', display: 'block', padding: '8px'}}
                    />
                    <DialogContentText
                        ref={descriptionElementRef}
                        tabIndex={-1}
                    >
                        <Typography variant="body2">
                            {message?.description}
                        </Typography>
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {setOpenEdit(true); setOpenView(false);}} startIcon={<Edit/>}>Edit</Button>
                    <Button onClick={() => setOpenView(false)} variant="outlined" startIcon={<Close/>}>Close</Button>
                </DialogActions>
            </Dialog>}

            {openEdit &&
            <Dialog
                open={openEdit}
                onClose={(_, reason) => {
                    if (reason !== 'backdropClick') handleCloseEdit() // Only if it isn't a backdrop click
                }}
                maxWidth={"lg"}
                slotProps={{paper: {sx: {minWidth: '900px', minHeight: '900px'}}}}
            >
                <DialogTitle id="scroll-dialog-title">
                    {message?.title}
                </DialogTitle>
                <DialogContent dividers={true}>
                    <TextField 
                        label={"Description*"} 
                        variant="outlined" 
                        margin="normal" 
                        fullWidth
                        multiline rows={15}
                        error={validation?.valid===false && validation?.attribute === "description"}
                        helperText={validation?.valid===false && validation?.attribute === "description" ? validation?.note : null}
                        defaultValue={updatedMessage?.description}
                        onChange={debounce((e) => {
                            setUpdatedMessage((prev) => ({...prev, description: e.target.value}));
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
                        defaultValue={updatedMessage?.thumbnail}
                        onChange={debounce((e) => {
                            setUpdatedMessage((prev) => ({...prev, thumbnail: e.target.value}));
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
                        defaultValue={updatedMessage?.tags}
                        onChange={(e) => handleTagsInputChange(e)}
                    />
                    <Stack direction="row" spacing={1}>
                        {tags.map((chip, index) => (
                            <Chip key={index} label={chip} variant="outlined" size="small"/>
                        ))}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => handleSubmit()} variant="outlined" startIcon={<Check/>}>Submit</Button>
                    <Button onClick={() => handleCloseEdit()} startIcon={<Close/>}>Cancel</Button>
                </DialogActions>
            </Dialog>}
        
        </React.Fragment>
    );
}

export default MessageTile;
