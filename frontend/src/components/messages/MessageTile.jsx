/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react"
import { Card, CardContent, Typography, Box, Chip, Badge, Stack, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';
import { Add, Close, Edit } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { DEFAULT_IMAGE } from "@/constants";

const MessageTile = ({ message } ) => {
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

    const [elevated, setElevated] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
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

    return (
        <React.Fragment>
            <Card 
                sx={{ 
                    width: 300, height: 350,
                    cursor: "pointer",
                    transition: "box-shadow 0.3s ease",
                    boxShadow: elevated ? "0px 4px 12px rgba(0, 0, 0, 0.2)" : undefined,
                    border: "1px solid rgba(0, 0, 0, 0.1)"
                }} 
                onMouseEnter={() => setElevated(true)} 
                onMouseLeave={() => setElevated(false)}
                onClick={() => setOpenView(true)}
            >
                <CardContent>
                    <Chip label={message?.tags?.[0]} variant="outlined" size="small"/>
                    {message?.tags?.length > 1 && 
                    <TagsTooltip 
                        title={<Stack>{message?.tags?.slice(1)?.map((tag, index) => <Typography key={index} variant='body2'>{tag}</Typography>)}</Stack>}
                        placement="right-start"
                    >
                        <Badge badgeContent={message?.tags?.length - 1} color="primary">
                            <Add color="action" />
                        </Badge>
                    </TagsTooltip>}
                    <Typography variant="h5" component="div" style={{paddingTop: '4px'}}>
                        {message?.title}
                    </Typography>
                    <Box
                        component="img"
                        src={message?.thumbnail ?? DEFAULT_IMAGE}
                        alt="Thumbnail"
                        sx={{ width: '100%', height: 150, objectFit: 'cover', my: 1 }}
                    />
                    <Typography variant="body2">
                        {message?.description?.length > 150
                        ? `${message.description.slice(0, 150)}...`
                        : message?.description}
                    </Typography>
                </CardContent>
            </Card>
            
            {openView &&
            <Dialog
                open={openView}
                onClose={(_, reason) => {
                    if (reason !== 'backdropClick') setOpenView(false) // Only if it isn't a backdrop click
                }}
                maxWidth={"lg"}
            >
                <DialogTitle id="scroll-dialog-title">
                    {message?.title}
                    <div>
                        {message?.tags?.map((tag, index) => (
                            <Chip key={index} label={tag} variant="outlined" size="small" style={{margin: '4px'}}/>
                        ))}
                    </div>
                </DialogTitle>
                <DialogContent dividers={true}>
                    <DialogContentText
                        ref={descriptionElementRef}
                        tabIndex={-1}
                    >
                        <Typography variant="body2">
                            {/* {message?.description} */}
                            {Array.from({ length: 10 }, () => message?.description).join("\n")}
                        </Typography>
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenEdit(true)} startIcon={<Edit/>}>Edit</Button>
                    <Button onClick={() => setOpenView(false)} variant="outlined" startIcon={<Close/>}>Close</Button>
                </DialogActions>
            </Dialog>}
        
        </React.Fragment>
    );
}

export default MessageTile;
