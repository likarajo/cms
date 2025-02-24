import { Container, Typography } from "@mui/material";
import { currentYear } from "@/utils/common";

const AppFooter = () => {
    return (
        <Container style={{height: '24px'}}>
            <Typography variant="body2" color="text.secondary" align="center">
                Watermark Community Church &copy; {currentYear}
            </Typography>
        </Container>
    )
}

export default AppFooter;
