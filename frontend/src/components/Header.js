import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Flex, IconButton, Image, Spacer } from '@chakra-ui/react';
import { FaSearch, FaHome, FaBookmark, FaUser } from 'react-icons/fa';
import MarketMasterLogo from '../assets/MarketMasterLogo.png'

const Header = () => {
    return (
        <Box bg="brand.500" p={3}>
            <Flex maxW="1200px" mx="auto" align="center">
                <Link to="/">
                    <Image src={MarketMasterLogo} alt="logo" boxSize="50px" />
                </Link>
                <Spacer />
                <Link to="/search">
                    <IconButton
                        aria-label="Search"
                        icon={<FaSearch />}
                        color="white"
                        fontSize="25px"
                        bg="transparent"
                        _hover={{ bg: 'brand.600' }}
                        mx={2}
                    />
                </Link>
                <Link to="/">
                    <IconButton
                        aria-label="Home"
                        icon={<FaHome />}
                        color="white"
                        fontSize="25px"
                        bg="transparent"
                        _hover={{ bg: 'brand.600 '}}
                        mx={2}
                    />
                </Link>
                <Link to="/saved">
                    <IconButton
                        aria-label="Saved List"
                        icon={<FaBookmark />}
                        color="white"
                        fontSize="25px"
                        bg="transparent"
                        _hover={{ bg: 'brand.600' }}
                        mx={2}
                    />
                </Link>
                <Link to="/account">
                    <IconButton
                        aria-label="Account"
                        icon={<FaUser />}
                        color="white"
                        fontSize="25px"
                        bg="transparent"
                        _hover={{ bg: 'brand.600' }}
                        mx={2}
                    />
                </Link>
            </Flex>
        </Box>
    );
};

export default Header;