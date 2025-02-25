import { useState } from 'react';
import { IconButton, Toolbar, Typography, Drawer, MenuItem, Container } from '@mui/material';
import { Menu as MenuIcon, Launch} from '@mui/icons-material';
import logo from '/wm-brand.svg';
import { API_BASE_URL } from '@/constants';

const AppHeader = () => {

    const [menuEl, setMenuEl] = useState(null);
    const openMenu = Boolean(menuEl);
    
    const handleClickMenu = (event) => {
        setMenuEl(event.currentTarget);
    };
    
    const handleCloseMenu = () => {
        setMenuEl(null);
    };

    const handleAddMessage = () => {
        // TODO:
        handleCloseMenu();
    }

    const handleOpenApiDocs = () => {
        window.open(`${API_BASE_URL}`)
        handleCloseMenu();
    }
    return (
        <Toolbar variant="dense" style={{gap: '8px', padding: '0'}}>
            <IconButton edge="start" onClick={(e) => handleClickMenu(e)}>
                <MenuIcon/>
            </IconButton>
            <Drawer
                anchorEl={menuEl}
                open={openMenu}
                onClose={() => handleCloseMenu()}
            >
                <Container sx={{ width: 200, paddingTop: '24px' }} role="presentation">
                    <MenuItem onClick={() => handleAddMessage()}>Add Message</MenuItem>
                    <MenuItem onClick={() => handleOpenApiDocs()}>API Server&nbsp;<Launch fontSize='small'/></MenuItem>
                </Container>
            </Drawer>
            <img src={logo}/>
            <Typography variant="subtitle1">Content Management System</Typography>
        </Toolbar>
    )
}

export default AppHeader;
